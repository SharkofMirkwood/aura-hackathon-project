import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet2, MoreVertical, Bookmark, Trash2 } from "lucide-react";
import type { Wallet } from "@shared/schema";
import { cn } from "@/lib/utils";
import { NetworkBase, TokenIcon, TokenUSDC } from "@web3icons/react";

interface WalletCardProps {
  wallet: Wallet;
  isSelected: boolean;
  onToggleSelection: () => void;
  onRemove?: (walletId: string) => void;
}

export default function WalletCard({
  wallet,
  isSelected,
  onToggleSelection,
  onRemove,
}: WalletCardProps) {
  const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(
    -4
  )}`;
  const balance = parseFloat(wallet.balance || "0");

  const isActive = wallet.isConnected;

  const handleRemove = () => {
    if (onRemove && !wallet.isBuiltIn) {
      onRemove(wallet.id);
    }
  };

  return (
    <div
      className={cn(
        "wallet-card border rounded-xl p-4 transition-all duration-200",
        isSelected
          ? "bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary"
          : "bg-muted/50 border-border",
        isActive && "glow-effect"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isActive ? "bg-primary/20" : "bg-warning/10"
            )}
          >
            {isActive ? (
              <Wallet2 className="w-6 h-6 text-primary" />
            ) : (
              <Bookmark className="w-6 h-6 text-secondary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm" data-testid="wallet-name">
                {wallet.name}
              </h3>
              {isActive && (
                <Badge
                  variant="default"
                  className="text-xs bg-primary/20 text-primary"
                >
                  Active
                </Badge>
              )}
            </div>
            <p
              className="text-xs text-muted-foreground mt-0.5 font-mono"
              data-testid="wallet-address"
            >
              {shortAddress}
            </p>
          </div>
        </div>
        {!wallet.isBuiltIn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                data-testid="wallet-menu-button"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleRemove}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid="remove-wallet-button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TokenUSDC size={16} className="w-4 h-4" />
            Base USDC
          </div>
          <span
            className="font-semibold text-foreground"
            data-testid="wallet-balance"
          >
            ${balance.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        {wallet.isBuiltIn ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-xs text-muted-foreground">
                Auto-payment wallet
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              COMING SOON: Top up this wallet with USDC on Base to enable
              automatic payments for AI queries. Payments will be deducted
              seamlessly when needed.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              data-testid="wallet-selection-checkbox"
            />
            <span className="text-sm text-muted-foreground">
              Include in chat context
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
