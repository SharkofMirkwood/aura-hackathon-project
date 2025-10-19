import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenIcon, NetworkIcon } from "@web3icons/react";

interface StrategiesModalProps {
  data: any;
  onClose: () => void;
}

export default function StrategiesModal({
  data,
  onClose,
}: StrategiesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Aura Network DeFi Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              1 wallet analyzed via Aura Network
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div
            className="bg-card border border-border rounded-lg p-5 space-y-4"
            data-testid="card-wallet-0"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Wallet Analysis</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {data.address?.slice(0, 6)}...{data.address?.slice(-4)}
              </code>
            </div>

            {(() => {
              const strategies = data?.strategies?.[0]?.response || [];
              const portfolio = data?.portfolio || [];

              return (
                <div className="space-y-6">
                  {portfolio.length > 0 && (
                    <div className="bg-background border border-border rounded-lg p-4">
                      <h4 className="font-medium text-base mb-3">
                        Aura Portfolio Overview
                      </h4>
                      <div className="space-y-3">
                        {portfolio.map((network: any, networkIdx: number) => (
                          <div key={networkIdx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <NetworkIcon
                                  name={network.network?.platformId?.toLowerCase()}
                                  size={16}
                                  className="w-4 h-4"
                                  variant="branded"
                                />
                                <h5 className="font-medium text-sm">
                                  {network.network?.name || "Unknown Network"}
                                </h5>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {network.tokens?.length || 0} tokens
                              </span>
                            </div>
                            {network.tokens && network.tokens.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {network.tokens
                                  .filter((token: any) => token.balanceUSD > 0)
                                  .sort(
                                    (a: any, b: any) =>
                                      b.balanceUSD - a.balanceUSD
                                  )
                                  .slice(0, 6)
                                  .map((token: any, tokenIdx: number) => (
                                    <div
                                      key={tokenIdx}
                                      className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <TokenIcon
                                          symbol={token.symbol.toLowerCase()}
                                          size={12}
                                          className="w-3 h-3"
                                          variant="branded"
                                        />
                                        <span className="font-medium">
                                          {token.symbol}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground">
                                        ${token.balanceUSD.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!strategies || strategies.length === 0 ? (
                    <div className="bg-background border border-border rounded-lg p-4">
                      <h4 className="font-medium text-base mb-2">
                        Aura Strategy Recommendations
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        No strategies found for this wallet
                      </p>
                    </div>
                  ) : (
                    <div className="bg-background border border-border rounded-lg p-4">
                      <h4 className="font-medium text-base mb-3">
                        Aura Strategy Recommendations
                      </h4>
                      <div className="space-y-3">
                        {strategies.map(
                          (strategy: any, strategyIdx: number) => (
                            <div
                              key={strategyIdx}
                              className="bg-background border border-border rounded-lg p-4 space-y-2"
                              data-testid={`card-strategy-0-${strategyIdx}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium text-base">
                                    {strategy.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {strategy.actions?.[0]?.description ||
                                      "No description available"}
                                  </p>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    strategy.risk === "low"
                                      ? "bg-green-500/10 text-green-500"
                                      : strategy.risk === "moderate"
                                      ? "bg-yellow-500/10 text-yellow-500"
                                      : strategy.risk === "high"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-blue-500/10 text-blue-500"
                                  }`}
                                >
                                  {strategy.risk} Risk
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    APY
                                  </p>
                                  <p className="text-sm font-semibold text-primary">
                                    {strategy.actions?.[0]?.apy || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Networks
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {strategy.actions?.[0]?.networks?.join(
                                      ", "
                                    ) || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {strategy.actions?.[0]?.platforms &&
                                strategy.actions[0].platforms.length > 0 && (
                                  <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Platforms
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {strategy.actions[0].platforms.map(
                                        (
                                          platform: any,
                                          platformIdx: number
                                        ) => (
                                          <span
                                            key={platformIdx}
                                            className="px-2 py-1 bg-muted text-xs rounded"
                                          >
                                            {platform.name}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {strategy.actions?.[0]?.operations &&
                                strategy.actions[0].operations.length > 0 && (
                                  <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Operations
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {strategy.actions[0].operations.map(
                                        (operation: string, opIdx: number) => (
                                          <span
                                            key={opIdx}
                                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                                          >
                                            {operation}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              Powered by Aura Network
            </p>
          </div>
          <Button
            onClick={onClose}
            className="w-full"
            data-testid="button-close"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
