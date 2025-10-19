import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Plus, Info } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

interface AddWalletModalProps {
  onClose: () => void;
}

export default function AddWalletModal({ onClose }: AddWalletModalProps) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { addWallet } = useWallet();
  const { toast } = useToast();

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast({
        title: "Validation Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    if (!validateAddress(address)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addWallet({
        address,
        name: name || `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
        balance: undefined,
        isConnected: false,
        isBuiltIn: false,
      });

      toast({
        title: "Wallet Added",
        description: "Wallet has been successfully added to your list",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <Card className="max-w-md w-full mx-4 overflow-hidden bg-card border border-border shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3
                className="text-lg font-semibold"
                data-testid="add-wallet-title"
              >
                Add Wallet
              </h3>
              <p className="text-xs text-muted-foreground">
                Add EVM wallet to context
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            data-testid="add-wallet-close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <Label
              htmlFor="address"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Wallet Address *
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full font-mono text-sm bg-muted border-input"
              data-testid="wallet-address-input"
            />
          </div>

          <div>
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Wallet Name (Optional)
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Trading Wallet"
              className="w-full bg-muted border-input"
              data-testid="wallet-name-input"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <Info className="w-5 h-5 text-accent flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Wallets are stored locally in your browser and included in chat
              context when selected.
            </p>
          </div>
        </form>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            data-testid="add-wallet-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !address}
            className="flex-1 bg-warning hover:bg-warning/90 text-white"
            data-testid="add-wallet-confirm"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>{isLoading ? "Adding..." : "Add Wallet"}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
