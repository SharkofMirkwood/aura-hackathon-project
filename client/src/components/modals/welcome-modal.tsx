import { X, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome to HeyAura</h2>
              <p className="text-sm text-muted-foreground">
                Your AI-powered DeFi strategy assistant
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-welcome-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Hackathon Notice */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-orange-700">
                Hackathon Application
              </h3>
            </div>
            <p className="text-sm text-orange-600">
              This is a hackathon application built for demonstration purposes.
              It is not production-ready and should be used with caution. We do
              not accept liability for any financial decisions made based on
              this application.
            </p>
          </div>

          {/* What is HeyAura */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">What is HeyAura?</h3>
            <p className="text-muted-foreground">
              HeyAura is a demonstration app showcasing the power of the AURA
              API and x420 payments. This AI-powered DeFi assistant connects to
              the AURA framework to analyze your wallet portfolio and provide
              personalized strategy recommendations through natural
              conversation.
            </p>
            <p className="text-muted-foreground">
              Simply connect your wallet and ask the AI for DeFi strategies - it
              will analyze your holdings via AURA and suggest optimal investment
              opportunities based on your portfolio.
            </p>
            <a
              href="https://github.com/SharkofMirkwood/aura-hackathon-project"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              View project on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* AURA Section */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h4 className="text-lg font-semibold">About AURA</h4>
            <p className="text-muted-foreground">
              AURA is AdEx's AI-powered DeFi framework that provides
              comprehensive portfolio analysis and strategy recommendations. It
              aggregates data from multiple blockchain networks to give you
              insights into your holdings and suggest optimal DeFi strategies
              based on your risk profile and market conditions.
            </p>
            <p className="text-muted-foreground">
              AURA enables developers to build AI-powered tools that can analyze
              portfolios, suggest strategies, and execute DeFi operations
              through its open API.
            </p>
            <a
              href="https://adexnetwork.notion.site/AdEx-AURA-Vision-198552af7b4f802d8f44c46b3f8ec7ec"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              Learn more about AURA
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* x420 Payments Section */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h4 className="text-lg font-semibold">x420 Payments</h4>
            <p className="text-muted-foreground">
              All requests to the AURA API are secured behind x420 payments,
              Coinbase's micropayment system that enables pay-per-query access
              to protected data or services. This ensures fair compensation for
              data providers while keeping costs minimal for users among other
              advantages.
            </p>
            <p className="text-muted-foreground">
              In this app, we use LLM tool calling functionality where the
              browser intercepts payment requests and makes micropayments
              automatically. The server verifies these payments before
              retrieving responses from the AURA API. This pattern makes it
              trivial to put any tool call behind x420 payments, creating a
              seamless pay-per-use experience for premium AI services.
            </p>
            <a
              href="https://www.coinbase.com/en-gb/developer-platform/products/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              Learn more about x420 payments
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Disclaimer */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-700">
                Important Disclaimer
              </h4>
            </div>
            <div className="text-sm text-red-600 space-y-2">
              <p>
                <strong>
                  This is a hackathon application and is not production-ready.
                </strong>
              </p>
              <p>
                • All financial advice and strategy recommendations are for
                educational purposes only
              </p>
              <p>
                • We do not accept liability for any financial decisions made
                based on this application
              </p>
              <p>
                • Always conduct your own research before making investment
                decisions
              </p>
              <p>• DeFi investments carry significant risk of loss</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
