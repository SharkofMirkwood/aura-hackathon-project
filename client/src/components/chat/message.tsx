import { Zap, Code, User } from "lucide-react";
import type { Message as MessageType } from "@shared/schema";
import StrategiesOverview from "./strategies-overview";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";

  // Check if this is a tool result with strategy data
  const hasStrategiesData =
    isTool &&
    message.metadata &&
    typeof message.metadata === "object" &&
    "toolResult" in message.metadata &&
    "toolName" in message.metadata &&
    (message.metadata as any).toolName === "get_strategies";

  // Tool result messages (show data visualization)
  if (isTool && hasStrategiesData) {
    return (
      <div className="message-animation flex gap-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <StrategiesOverview data={(message.metadata as any).toolResult} />
        </div>
      </div>
    );
  }

  // Regular assistant or user messages
  return (
    <div
      className={`message-animation flex gap-4 ${
        !isAssistant ? "justify-end" : ""
      }`}
    >
      {isAssistant ? (
        <>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">HeyAura</span>
              <span className="text-xs text-muted-foreground">
                AI Assistant
              </span>
            </div>

            {message.functionCall &&
            typeof message.functionCall === "object" &&
            "name" in message.functionCall ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg function-badge text-white text-sm">
                <Code className="w-4 h-4" />
                <span>Calling: {(message.functionCall as any).name}</span>
                {"cost" in message.functionCall &&
                (message.functionCall as any).cost ? (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                    ${((message.functionCall as any).cost as number).toFixed(2)}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-li:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 max-w-2xl space-y-2 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-muted-foreground">You</span>
            </div>
            <div className="inline-block bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm">
              <p className="leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </>
      )}
    </div>
  );
}
