import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Wallet2, ChevronRight, Loader2 } from "lucide-react";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import type { Wallet } from "@shared/schema";

interface PaymentConfirmationModalProps {
  amount: number;
  functionName: string;
  connectedWallet: Wallet | null;
  builtInWallet: Wallet | null;
  onClose: () => void;
  onConfirm: (useBuiltIn: boolean) => void;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

export default function PaymentConfirmationModal({
  amount,
  functionName,
  connectedWallet,
  builtInWallet,
  onClose,
  onConfirm,
}: PaymentConfirmationModalProps) {
  const [connectedBalance, setConnectedBalance] = useState<number | null>(null);
  const [builtInBalance, setBuiltInBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      try {
        // Fetch connected wallet balance
        if (connectedWallet) {
          const balance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "balanceOf",
            args: [connectedWallet.address as `0x${string}`],
          }) as bigint;
          setConnectedBalance(parseFloat(formatUnits(balance, 6)));
        }

        // Fetch built-in wallet balance
        if (builtInWallet) {
          const balance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "balanceOf",
            args: [builtInWallet.address as `0x${string}`],
          }) as bigint;
          setBuiltInBalance(parseFloat(formatUnits(balance, 6)));
        }
      } catch (error) {
        console.error("Failed to fetch USDC balances:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [connectedWallet, builtInWallet]);

  const connectedHasSufficient = connectedBalance !== null && connectedBalance >= amount;
  const builtInHasSufficient = builtInBalance !== null && builtInBalance >= amount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold" data-testid="payment-modal-title">
              Confirm Payment
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a wallet to pay for this query
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-10 w-10 p-0 rounded-full"
            data-testid="close-payment-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Payment Details */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Function</span>
              <span className="font-mono text-foreground">{functionName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Amount</span>
              <span className="font-bold text-2xl text-foreground" data-testid="payment-amount">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Select Payment Method</h3>

            {/* Connected Wallet Option */}
            {connectedWallet && (
              <button
                onClick={() => connectedHasSufficient && onConfirm(false)}
                disabled={!connectedHasSufficient || isLoading}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  connectedHasSufficient
                    ? "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
                    : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                }`}
                data-testid="pay-with-connected-wallet"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Wallet2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{connectedWallet.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {`${connectedWallet.address.slice(0, 6)}...${connectedWallet.address.slice(-4)}`}
                      </div>
                    </div>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="text-right">
                      <div className={`font-bold ${connectedHasSufficient ? 'text-foreground' : 'text-destructive'}`}>
                        {connectedBalance?.toFixed(2)} USDC
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {connectedHasSufficient ? "Sufficient" : "Insufficient"}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )}

            {/* Built-in Wallet Option */}
            {builtInWallet && (
              <button
                onClick={() => builtInHasSufficient && onConfirm(true)}
                disabled={!builtInHasSufficient || isLoading}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  builtInHasSufficient
                    ? "border-accent bg-accent/5 hover:bg-accent/10 cursor-pointer"
                    : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                }`}
                data-testid="pay-with-builtin-wallet"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {builtInWallet.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                          Auto
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {`${builtInWallet.address.slice(0, 6)}...${builtInWallet.address.slice(-4)}`}
                      </div>
                    </div>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="text-right">
                      <div className={`font-bold ${builtInHasSufficient ? 'text-foreground' : 'text-destructive'}`}>
                        {builtInBalance?.toFixed(2)} USDC
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {builtInHasSufficient ? "Sufficient" : "Insufficient"}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* No Sufficient Funds Warning */}
          {!isLoading && !connectedHasSufficient && !builtInHasSufficient && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">
                Insufficient USDC balance in all wallets. Please top up to continue.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            data-testid="cancel-payment"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
