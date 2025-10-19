import OpenAI from "openai";
import type { Message, Wallet } from "@shared/schema";
import { API_COSTS, PAYMENT_CONFIG } from "@shared/config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FunctionCall {
  name: string;
  arguments: any;
  cost?: number;
  id?: string;
}

export interface ChatResponse {
  content?: string;
  functionCall?: FunctionCall;
  finishReason: string;
}

const AVAILABLE_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_strategies",
      description: `Get DeFi strategy recommendations for a single wallet address from Aura Network API. Costs $${API_COSTS.STRATEGIES.COST_PER_ADDRESS} per address. IMPORTANT: Only one wallet address can be analyzed at a time.`,
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            pattern: "^0x[a-fA-F0-9]{40}$",
            description: "Single EVM wallet address to analyze",
          },
        },
        required: ["address"],
      },
    },
  },
];

export async function createChatCompletion(
  messages: Message[],
  selectedWallets: Wallet[] = [],
  stream: boolean = false
): Promise<ChatResponse | AsyncIterable<ChatResponse>> {
  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are HeyAura, a DeFi AI assistant that helps users explore decentralized finance opportunities. You have access to real-time DeFi strategy recommendations through the Aura Network API.

Available wallet context: ${
        selectedWallets.length > 0
          ? selectedWallets
              .map(
                (w) =>
                  `${w.name} (${w.address}) - ${w.network} - Balance: $${w.balance}`
              )
              .join(", ")
          : "No wallets selected"
      }

Key capabilities:
- Explain DeFi protocols, yield farming, liquidity provision
- Provide educational guidance on DeFi strategies
- Get personalized DeFi strategy recommendations using get_strategies function (costs $${
        API_COSTS.STRATEGIES.COST_PER_ADDRESS
      } per wallet address via x402 micropayment)

IMPORTANT: 
- When you call get_strategies, the user's browser will automatically handle the x402 micropayment using their connected wallet. Simply make the function call and the client will execute it and return results. Always mention the cost when suggesting this function.
- You can only analyze ONE wallet address at a time. If the user wants to analyze multiple wallets, you must make separate function calls for each wallet.
- BEFORE calling get_strategies for the first time in a conversation, you MUST ask the user for confirmation and explain the payment requirement. Say something like: "I can analyze your wallet for DeFi strategies, but this requires a payment of $${
        API_COSTS.STRATEGIES.COST_PER_ADDRESS
      } per wallet address. The payment will be processed automatically through your connected wallet. Would you like me to proceed with the analysis?"
- If you want to analyze another wallet after completing the first analysis, you MUST ask the user for confirmation first. Say something like: "I'm ready to analyze another wallet for DeFi strategies. This will require another payment of $${
        API_COSTS.STRATEGIES.COST_PER_ADDRESS
      }. Would you like me to proceed with analyzing another wallet?"
- Always mention that this is a paid service and explain the cost before making the function call.

Always be helpful, accurate, and focused on DeFi education and strategy.

FORMATTING: Use markdown formatting to make your responses more readable:
- Use **bold** for important terms and concepts
- Use *italics* for emphasis
- Use \`code\` for wallet addresses, contract addresses, and technical terms
- Use \`\`\`code blocks\`\`\` for code examples or structured data
- Use bullet points (-) and numbered lists (1.) for organized information
- Use > blockquotes for important warnings or tips
- Use ## headings to organize sections of your response`,
    },
    ...messages.map((msg, index) => {
      if (msg.role === "tool" && msg.functionCall) {
        let toolCallId = (msg.functionCall as any)?.id;
        if (!toolCallId) {
          for (let i = index - 1; i >= 0; i--) {
            const prevMsg = messages[i];
            if (
              prevMsg.role === "assistant" &&
              prevMsg.functionCall &&
              (prevMsg.functionCall as any).name ===
                (msg.functionCall as any).name
            ) {
              toolCallId = `call_${prevMsg.id}`;
              break;
            }
          }
          if (!toolCallId) {
            toolCallId = `call_${msg.id}`;
          }
        }
        return {
          role: "tool" as const,
          content: msg.content,
          tool_call_id: toolCallId,
        };
      }

      if (msg.role === "assistant" && msg.functionCall) {
        const toolCallId = (msg.functionCall as any).id || `call_${msg.id}`;
        return {
          role: "assistant" as const,
          content: msg.content || null,
          tool_calls: [
            {
              id: toolCallId,
              type: "function" as const,
              function: {
                name: (msg.functionCall as any).name,
                arguments:
                  typeof (msg.functionCall as any).arguments === "string"
                    ? (msg.functionCall as any).arguments
                    : JSON.stringify((msg.functionCall as any).arguments),
              },
            },
          ],
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      } as OpenAI.Chat.ChatCompletionMessageParam;
    }),
  ];

  const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
    model: "gpt-4o",
    messages: formattedMessages,
    tools: AVAILABLE_TOOLS,
    max_completion_tokens: 8192,
    stream,
  };

  if (stream) {
    const streamResponse = await openai.chat.completions.create(
      completionParams
    );
    return parseStreamResponse(
      streamResponse as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>
    );
  } else {
    const response = await openai.chat.completions.create(completionParams);
    return parseSingleResponse(response as OpenAI.Chat.ChatCompletion);
  }
}

async function* parseStreamResponse(
  stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>
): AsyncIterable<ChatResponse> {
  let toolCallBuffer = {
    id: "",
    name: "",
    arguments: "",
  };

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield {
        content: delta.content,
        finishReason: chunk.choices[0].finish_reason || "continue",
      };
    }

    if (delta?.tool_calls && delta.tool_calls[0]) {
      const toolCall = delta.tool_calls[0];
      if (toolCall.id) {
        toolCallBuffer.id = toolCall.id;
      }
      if (toolCall.function?.name) {
        toolCallBuffer.name = toolCall.function.name;
      }
      if (toolCall.function?.arguments) {
        toolCallBuffer.arguments += toolCall.function.arguments;
      }
    }

    if (chunk.choices[0]?.finish_reason === "tool_calls") {
      const args = JSON.parse(toolCallBuffer.arguments);
      const cost = calculateFunctionCost(toolCallBuffer.name, args);

      yield {
        functionCall: {
          id: toolCallBuffer.id,
          name: toolCallBuffer.name,
          arguments: args,
          cost,
        },
        finishReason: "tool_calls",
      };
    }
  }
}

function parseSingleResponse(
  response: OpenAI.Chat.ChatCompletion
): ChatResponse {
  const choice = response.choices[0];
  const message = choice.message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.type === "function") {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      const cost = calculateFunctionCost(toolCall.function.name, args);

      const functionMessage = generateFunctionCallMessage(
        toolCall.function.name,
        args,
        cost
      );

      return {
        content: message.content || functionMessage,
        functionCall: {
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: args,
          cost,
        },
        finishReason: choice.finish_reason || "tool_calls",
      };
    }
  }

  return {
    content: message.content || "",
    finishReason: choice.finish_reason || "stop",
  };
}

function generateFunctionCallMessage(
  functionName: string,
  args: any,
  cost: number
): string {
  if (functionName === "get_strategies") {
    const hasAddress = args.address ? 1 : 0;
    return `Let me fetch DeFi strategy recommendations for ${hasAddress} wallet${
      hasAddress !== 1 ? "s" : ""
    }${cost > 0 ? ` (costs $${cost.toFixed(2)})` : ""}...`;
  }
  return `Executing ${functionName}...`;
}

function calculateFunctionCost(functionName: string, args: any): number {
  if (functionName === "get_strategies") {
    return args.address ? API_COSTS.STRATEGIES.COST_PER_ADDRESS : 0;
  }
  return 0;
}
