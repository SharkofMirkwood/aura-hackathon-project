import type { Express } from "express";
import { createServer, type Server } from "http";
import { createChatCompletion } from "./services/openai";
import { fetchStrategies } from "./services/aura-api";
import { paymentMiddleware } from "x402-express";
import { createFacilitatorConfig } from "@coinbase/x402";
import { API_COSTS } from "@shared/config";
import type { Message } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const StrategiesRequestSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to chat endpoint (10 requests per minute)
  // TODO: In production, consider using Redis store for persistence across server restarts
  const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: {
      xForwardedForHeader: false,
    },
  });

  app.post("/api/chat/message", chatRateLimiter, async (req, res) => {
    try {
      const { content, selectedWallets, chatHistory } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }

      const messages = (chatHistory || []).map((msg: Message) => ({
        ...msg,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : null,
        functionCall: msg.functionCall || null,
      }));

      // Filter out assistant tool calls that don't have a corresponding tool response (it usually means the tool call errored, and will prevent the LLM from continuing)
      const filterUnansweredToolCalls = (msgs: Message[]): Message[] => {
        const respondedKeys = new Set<string>();

        for (const m of msgs) {
          if (m.role === "tool" && m.functionCall) {
            const key = m.functionCall.id
              ? `id:${m.functionCall.id}`
              : `name:${m.functionCall.name}`;
            respondedKeys.add(key);
          }
        }

        return msgs.filter((m) => {
          if (m.role === "assistant" && m.functionCall) {
            const idKey = m.functionCall.id ? `id:${m.functionCall.id}` : null;
            const nameKey = `name:${m.functionCall.name}`;
            return (
              (idKey && respondedKeys.has(idKey)) || respondedKeys.has(nameKey)
            );
          }
          return true;
        });
      };

      const filteredMessages = filterUnansweredToolCalls(messages);

      const chatResponse = await createChatCompletion(
        filteredMessages,
        selectedWallets,
        false
      );

      if (!("content" in chatResponse)) {
        throw new Error("Unexpected streaming response");
      }

      const assistantMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: chatResponse.content,
        chatId: null,
        userId: null,
        functionCall: chatResponse.functionCall || null,
        createdAt: new Date(),
      };

      res.json({ message: assistantMessage });
    } catch (error: unknown) {
      console.error("Chat error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ message: errorMessage });
    }
  });

  const PAYTO_ADDRESS = process.env.PAYTO_ADDRESS as `0x${string}`;

  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    const missing = [];
    if (!process.env.CDP_API_KEY_ID) missing.push("CDP_API_KEY_ID");
    if (!process.env.CDP_API_KEY_SECRET) missing.push("CDP_API_KEY_SECRET");
    throw new Error(
      `Missing required Coinbase CDP credentials: ${missing.join(", ")}`
    );
  }

  const facilitator = createFacilitatorConfig(
    process.env.CDP_API_KEY_ID,
    process.env.CDP_API_KEY_SECRET
  );

  app.use(
    paymentMiddleware(
      PAYTO_ADDRESS,
      {
        "/api/aura-strategies": {
          price: `$${API_COSTS.STRATEGIES.COST_PER_ADDRESS}`,
          network: "base",
          config: {
            description: "DeFi strategies API",
          },
        },
      },
      facilitator
    )
  );

  app.post("/api/aura-strategies", async (req, res) => {
    try {
      const { address } = StrategiesRequestSchema.parse(req.body);

      const result = await fetchStrategies([address]);
      if (!res.headersSent) {
        res.json(result.strategies[0]);
      }
    } catch (error: unknown) {
      console.error("Aura Strategies error:", error);
      if (!res.headersSent) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            message: "Invalid request data",
            errors: error.errors,
          });
        } else {
          const errorMessage =
            error instanceof Error ? error.message : "Internal server error";
          res.status(500).json({ message: errorMessage });
        }
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
