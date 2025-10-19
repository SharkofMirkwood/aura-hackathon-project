import { useState } from "react";
import { TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import StrategiesModal from "@/components/modals/strategies-modal";
import { TokenIcon, NetworkIcon } from "@web3icons/react";

interface StrategiesOverviewProps {
  data: any;
}

export default function StrategiesOverview({ data }: StrategiesOverviewProps) {
  const [showModal, setShowModal] = useState(false);

  const strategiesCount = data?.strategies?.[0]?.response?.length || 0;
  const totalStrategies = strategiesCount;
  const allStrategies = (data?.strategies?.[0]?.response || []).map(
    (s: any) => ({
      protocol: s.name,
      apy: s.actions?.[0]?.apy || "N/A",
    })
  );
  const allTokens = (data?.portfolio || [])
    .flatMap((network: any) => network.tokens || [])
    .filter((token: any) => token.balanceUSD > 0)
    .sort((a: any, b: any) => b.balanceUSD - a.balanceUSD)
    .slice(0, 5);

  return (
    <>
      <div
        className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 space-y-3"
        data-testid="card-strategies-overview"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              Aura Strategy Recommendations
            </h4>
            <p className="text-xs text-muted-foreground">
              {totalStrategies} strategies found across {data.strategies.length}{" "}
              wallet{data.strategies.length !== 1 ? "s" : ""} via AURA
            </p>
          </div>
        </div>

        {allStrategies.length > 0 && (
          <div className="bg-background/50 rounded-md p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Available Strategies:
            </p>
            <div className="space-y-1.5">
              {allStrategies.map((strategy: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{strategy.protocol}</span>
                  <span className="text-primary font-semibold text-xs">
                    {strategy.apy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allTokens.length > 0 && (
          <div className="bg-background/50 rounded-md p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Top Holdings (via AURA):
            </p>
            <div className="space-y-1.5">
              {allTokens.map((token: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <TokenIcon
                      symbol={token.symbol.toLowerCase()}
                      size={16}
                      className="w-4 h-4"
                      variant="branded"
                    />
                    <span className="text-foreground">{token.symbol}</span>
                  </div>
                  <span className="text-primary font-semibold text-xs">
                    ${token.balanceUSD.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => setShowModal(true)}
          variant="secondary"
          size="sm"
          className="w-full"
          data-testid="button-view-details"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View All Details
        </Button>
      </div>

      {showModal && (
        <StrategiesModal data={data} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
