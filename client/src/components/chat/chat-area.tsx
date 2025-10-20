import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Message from "./message";
import TypingIndicator from "./typing-indicator";
import { Zap, Send, Wallet2, MoreVertical, Trash2, Info } from "lucide-react";
import type { Message as MessageType } from "@shared/schema";

interface ChatAreaProps {
  messages: MessageType[];
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onClearChat?: () => void;
  isConnected: boolean;
  hasWallets: boolean | undefined;
  onShowAddWallet: () => void;
  onConnectWallet?: () => void;
  onShowWelcome?: () => void;
}

export default function ChatArea({
  messages,
  isTyping,
  onSendMessage,
  onClearChat,
  isConnected,
  hasWallets,
  onShowAddWallet,
  onConnectWallet,
  onShowWelcome,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold">HeyAura</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                DeFi AI Assistant
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-muted">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-secondary" : "bg-destructive"
              }`}
            ></div>
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                data-testid="button-chat-menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="menu-chat-options">
              <DropdownMenuItem
                onClick={onShowWelcome}
                className="cursor-pointer"
                data-testid="button-more-info"
              >
                <Info className="h-4 w-4 mr-2" />
                More Info
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onClearChat}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid="button-clear-chat"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Loading State - when wallet state is not initialized */}
      {hasWallets === undefined && (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Loading...</h3>
              <p className="text-sm text-muted-foreground">
                Initializing wallet connection
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet State - when no wallets are connected */}
      {hasWallets === false && (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto px-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wallet2 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
              <p className="text-muted-foreground leading-relaxed">
                Connect your wallet to start chatting with HeyAura and get
                personalized DeFi strategies tailored to your portfolio.
              </p>
            </div>
            <Button
              onClick={onConnectWallet || onShowAddWallet}
              className="px-8 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl text-lg font-semibold min-h-[60px]"
              data-testid="connect-wallet-button"
            >
              <Wallet2 className="w-6 h-6 mr-3" />
              Connect Wallet
            </Button>
          </div>
        </div>
      )}

      {/* Chat Interface - when wallets are connected */}
      {hasWallets === true && (
        <>
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 md:px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {messages.length === 0 && (
                <div className="message-animation flex gap-3 md:gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm md:text-base">
                        HeyAura
                      </span>
                      <span className="text-xs text-muted-foreground">
                        AI Assistant
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-sm md:text-base text-foreground leading-relaxed">
                        Welcome to HeyAura! I'm your personal DeFi assistant
                        powered by AI. I can help you:
                      </p>
                      <ul className="mt-2 md:mt-3 space-y-1 text-xs md:text-sm text-muted-foreground">
                        <li>📊 Analyze your wallet's DeFi opportunities</li>
                        <li>💡 Get personalized strategy recommendations</li>
                        <li>🔍 Explore yield farming and liquidity pools</li>
                        <li>⚡ Execute DeFi operations directly</li>
                      </ul>
                      <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                        <span className="hidden md:inline">
                          Connect your wallets in the sidebar to get started!
                        </span>
                        <span className="md:hidden">
                          Tap "Connect Wallet" below to get started!
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card px-3 md:px-4 py-3 md:py-4 pb-safe">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 md:gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about DeFi strategies..."
                    className="min-h-[48px] md:min-h-[52px] max-h-[200px] resize-none bg-muted border-input text-sm md:text-base"
                    data-testid="chat-input"
                    disabled={!hasWallets}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!hasWallets || !input.trim() || isTyping}
                  className="px-4 md:px-6 py-3 md:py-3 bg-primary hover:bg-primary/90 min-h-[48px] md:min-h-auto"
                  data-testid="send-button"
                >
                  <Send className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="ml-2 hidden sm:inline">Send</span>
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                <span className="sm:inline">
                  HeyAura may make mistakes. Always verify DeFi strategies
                  yourself before investing.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
