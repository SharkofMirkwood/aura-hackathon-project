import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Wallet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "./use-wallet";
import { createX402Client } from "@/lib/x402Client";
import { usePayment } from "./use-payment";
import { API_COSTS } from "@shared/config";

const MESSAGES_STORAGE_KEY = "heyaura_messages";
const CHAT_ID_KEY = "heyaura_current_chat_id";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId] = useState(() => {
    const saved = localStorage.getItem(CHAT_ID_KEY);
    if (saved) return saved;
    const newId = `chat_${Date.now()}`;
    localStorage.setItem(CHAT_ID_KEY, newId);
    return newId;
  });

  const { getWalletsForChat } = useWallet();
  const { toast } = useToast();
  const { requestPayment } = usePayment();

  useEffect(() => {
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : null,
          }))
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      selectedWallets,
      chatHistory,
    }: {
      content: string;
      selectedWallets: Wallet[];
      chatHistory: Message[];
    }) => {
      const response = await apiRequest("POST", "/api/chat/message", {
        content,
        selectedWallets,
        chatHistory,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      const assistantMessage = data.message;

      if (assistantMessage.functionCall) {
        let currentMessages: Message[] = [];
        setMessages((prev) => {
          currentMessages = [...prev, assistantMessage];
          localStorage.setItem(
            MESSAGES_STORAGE_KEY,
            JSON.stringify(currentMessages)
          );
          return currentMessages;
        });

        try {
          const selectedWallets = getWalletsForChat();
          const result = await executeFunctionCall(
            assistantMessage.functionCall,
            selectedWallets
          );

          const functionResultMessage: Message = {
            id: `msg_${Date.now()}_tool`,
            role: "tool" as const,
            content: JSON.stringify(result),
            chatId: currentChatId,
            functionCall: {
              id: assistantMessage.functionCall.id,
              name: assistantMessage.functionCall.name,
              arguments: assistantMessage.functionCall.arguments,
            },
            metadata: {
              toolResult: result,
              toolName: assistantMessage.functionCall.name,
            },
            createdAt: new Date(),
          };

          setMessages((prev) => {
            currentMessages = [...prev, functionResultMessage];
            localStorage.setItem(
              MESSAGES_STORAGE_KEY,
              JSON.stringify(currentMessages)
            );
            return currentMessages;
          });

          const response = await apiRequest("POST", "/api/chat/message", {
            content: JSON.stringify(result),
            selectedWallets,
            chatHistory: currentMessages,
          });

          const interpretedResponse = await response.json();

          setMessages((prev) => {
            const updated = [...prev, interpretedResponse.message];
            localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
          setIsTyping(false);
        } catch (error: any) {
          console.error("Function execution error:", error);
          setIsTyping(false);

          const errorMessage: Message = {
            id: `msg_${Date.now()}_error`,
            role: "assistant" as const,
            content: `I encountered an error while executing the function: ${
              error.message || "Unknown error"
            }. Please try again or check your wallet connection.`,
            chatId: currentChatId,
            functionCall: null,
            metadata: null,
            createdAt: new Date(),
          };

          setMessages((prev) => {
            const updated = [...prev, errorMessage];
            localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });

          toast({
            title: "Function Execution Failed",
            description:
              error.message || "Failed to execute function. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setMessages((prev) => {
          const updated = [...prev, assistantMessage];
          localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        setIsTyping(false);
      }
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const executeFunctionCall = async (
    functionCall: any,
    selectedWallets: Wallet[]
  ) => {
    try {
      const args =
        typeof functionCall.arguments === "string"
          ? JSON.parse(functionCall.arguments)
          : functionCall.arguments;

      if (functionCall.name === "get_strategies") {
        if (!args.address || typeof args.address !== "string") {
          throw new Error("No wallet address provided");
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(args.address)) {
          throw new Error("Invalid wallet address format");
        }
      }

      const useBuiltInWallet = await requestPayment(
        API_COSTS.STRATEGIES.COST_PER_ADDRESS,
        functionCall.name
      );

      try {
        const x402Client = await createX402Client(useBuiltInWallet);

        if (functionCall.name === "get_strategies") {
          const strategiesRes = await x402Client.post("/api/aura-strategies", {
            address: args.address,
          });
          return strategiesRes.data;
        }

        throw new Error(`Unknown function: ${functionCall.name}`);
      } catch (walletError: any) {
        // Check for 402 payment errors with empty error objects (this happens when Coinbase returns 500 or 502 in the internal library)
        if (
          walletError.response?.status === 402 &&
          walletError.response?.data?.error &&
          Object.keys(walletError.response.data.error).length === 0
        ) {
          throw new Error(
            "Coinbase payment facilitator not responding. Please try again later."
          );
        }

        if (walletError.message) {
          toast({
            title: "Wallet Connection Failed",
            description: walletError.message,
            variant: "destructive",
          });
        }
        throw walletError;
      }
    } catch (error: any) {
      console.error("Function execution error:", error);
      throw error;
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content,
        chatId: currentChatId,
        functionCall: null,
        metadata: null,
        createdAt: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      localStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(updatedMessages)
      );
      setIsTyping(true);

      const selectedWallets = getWalletsForChat();

      sendMessageMutation.mutate({
        content,
        selectedWallets,
        chatHistory: updatedMessages,
      });
    },
    [currentChatId, messages, getWalletsForChat, sendMessageMutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
    const newChatId = `chat_${Date.now()}`;
    localStorage.setItem(CHAT_ID_KEY, newChatId);
  }, []);

  return {
    messages,
    isTyping: isTyping || sendMessageMutation.isPending,
    currentChatId,
    sendMessage,
    clearChat,
  };
}
