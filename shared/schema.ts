import { z } from "zod";

// Additional types for frontend
export const WalletSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  balance: z.string().optional(),
  isConnected: z.boolean().default(false),
  isBuiltIn: z.boolean().default(false),
});

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  functionCall: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      arguments: z.any(),
      cost: z.number().optional(),
    })
    .optional()
    .nullable(),
  metadata: z.any().optional().nullable(), // Raw tool results for UI
  chatId: z.string(),
  createdAt: z.date().optional(),
});

// Export the inferred types
export type Wallet = z.infer<typeof WalletSchema>;
export type Message = z.infer<typeof MessageSchema>;
