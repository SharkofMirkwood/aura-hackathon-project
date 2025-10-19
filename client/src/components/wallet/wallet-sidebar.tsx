import { Button } from "@/components/ui/button";
import WalletCard from "./wallet-card";
import { Wallet2, Plus } from "lucide-react";
import type { Wallet } from "@shared/schema";
import { useWallet } from "@/hooks/use-wallet";

interface WalletSidebarProps {
  wallets: Wallet[];
  selectedWallets: string[];
  onShowAddWallet: () => void;
  isMobile?: boolean;
}

export default function WalletSidebar({
  wallets,
  selectedWallets,
  onShowAddWallet,
  isMobile = false,
}: WalletSidebarProps) {
  const { toggleWalletSelection, removeWallet } = useWallet();

  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + parseFloat(wallet.balance || "0"),
    0
  );

  const activeWallets = wallets.filter((w) => selectedWallets.includes(w.id));

  return (
    <aside
      className={`${isMobile ? "w-full" : "w-96"} ${
        isMobile ? "" : "border-l"
      } border-border bg-card flex flex-col h-full`}
    >
      {/* Sidebar Header - Hide on mobile (shown in drawer header) */}
      {!isMobile && (
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet2 className="w-5 h-5 text-warning" />
            Wallet Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage EVM wallets for context
          </p>
        </div>
      )}

      {/* Wallet List */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-thin ${
          isMobile ? "px-3 py-3" : "px-4 py-4"
        } space-y-3`}
      >
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isSelected={selectedWallets.includes(wallet.id)}
            onToggleSelection={() => toggleWalletSelection(wallet.id)}
            onRemove={removeWallet}
            data-testid={`wallet-card-${wallet.id}`}
          />
        ))}

        {/* Add Wallet Button */}
        <Button
          onClick={onShowAddWallet}
          variant="outline"
          className={`w-full ${
            isMobile ? "py-3" : "py-4"
          } border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary group h-auto min-h-[44px]`}
          data-testid="add-wallet-button"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Wallet</span>
        </Button>
      </div>

      {/* Sidebar Footer - Summary */}
      <div
        className={`${
          isMobile ? "px-4 py-3" : "px-6 py-4"
        } border-t border-border bg-muted/30`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Base USDC</span>
            <span
              className="font-bold text-lg text-foreground"
              data-testid="total-balance"
            >
              ${totalBalance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Wallets</span>
            <span
              className="text-foreground font-semibold"
              data-testid="active-wallets-count"
            >
              {activeWallets.length} of {wallets.length}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
