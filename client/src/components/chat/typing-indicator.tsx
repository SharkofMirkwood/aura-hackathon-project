import { Zap } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="message-animation flex gap-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center">
        <Zap className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-2xl rounded-tl-sm typing-indicator">
        <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
        <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
        <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
      </div>
    </div>
  );
}
