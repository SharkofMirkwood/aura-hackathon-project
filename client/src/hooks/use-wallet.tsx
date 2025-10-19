import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import type { Wallet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateBuiltInWallet } from "@/lib/wallet-utils";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WALLETS_STORAGE_KEY = "heyaura_wallets";
const SELECTED_WALLETS_KEY = "heyaura_selected_wallets";

interface WalletContextType {
  wallets: Wallet[];
  selectedWallets: string[];
  isConnected: boolean;
  connectedAddress: string | null;
  isConnecting: boolean;
  isInitialized: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  addWallet: (
    walletData: Omit<Wallet, "id" | "userId" | "createdAt">
  ) => Promise<void>;
  removeWallet: (walletId: string) => void;
  toggleWalletSelection: (walletId: string) => void;
  getSelectedWallets: () => Wallet[];
  getWalletsForChat: () => Wallet[];
  getBuiltInWallet: () => Wallet | undefined;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { toast } = useToast();

  // Load wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem(WALLETS_STORAGE_KEY);
    const savedSelected = localStorage.getItem(SELECTED_WALLETS_KEY);

    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets);
        setWallets(parsedWallets);
      } catch (error) {
        console.error("Failed to parse saved wallets:", error);
      }
    }

    if (savedSelected) {
      try {
        setSelectedWallets(JSON.parse(savedSelected));
      } catch (error) {
        console.error("Failed to parse selected wallets:", error);
      }
    }

    // Mark as initialized after loading from localStorage
    setIsInitialized(true);
  }, []);

  // Auto-generate built-in wallet on first load
  useEffect(() => {
    const { wallet: builtInWallet } = getOrCreateBuiltInWallet();

    setWallets((prev) => {
      // Check if built-in wallet already exists
      const exists = prev.find((w) => w.id === builtInWallet.id);
      if (exists) {
        return prev.map((w) => (w.id === builtInWallet.id ? builtInWallet : w));
      }
      // Add built-in wallet at the end
      return [...prev, builtInWallet];
    });
  }, []);

  // Save wallets to localStorage
  useEffect(() => {
    localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
  }, [wallets]);

  // Save selected wallets to localStorage
  useEffect(() => {
    localStorage.setItem(SELECTED_WALLETS_KEY, JSON.stringify(selectedWallets));
  }, [selectedWallets]);

  // Check if wallet is already connected (but don't auto-connect)
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0) {
            setIsConnected(true);
            setConnectedAddress(accounts[0]);
            // Add connected wallet directly
            try {
              // Fetch USDC balance on Base network
              const addressParam = accounts[0]
                .slice(2)
                .toLowerCase()
                .padStart(64, "0");

              let balanceUSD = 0;
              const usdcBalance = await window.ethereum.request({
                method: "eth_call",
                params: [
                  {
                    to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    data: `0x70a08231${addressParam}`,
                  },
                  "latest",
                ],
              });

              if (usdcBalance && usdcBalance !== "0x") {
                const balanceInUSDC =
                  parseInt(usdcBalance, 16) / Math.pow(10, 6);
                balanceUSD = balanceInUSDC;
              }

              const connectedWallet: Wallet = {
                id: `connected_${accounts[0]}`,
                name: "Connected Wallet",
                address: accounts[0],
                balance: balanceUSD.toFixed(2),
                isConnected: true,
                isBuiltIn: false,
              };
              setWallets((prev) => {
                const exists = prev.find(
                  (w) => w.address.toLowerCase() === accounts[0].toLowerCase()
                );
                if (exists) {
                  return prev.map((w) =>
                    w.address.toLowerCase() === accounts[0].toLowerCase()
                      ? {
                          ...w,
                          isConnected: true,
                          balance: balanceUSD.toFixed(2),
                        }
                      : { ...w, isConnected: false }
                  );
                }
                return [
                  connectedWallet,
                  ...prev.map((w) => ({ ...w, isConnected: false })),
                ];
              });
              setSelectedWallets((prev) =>
                prev.includes(connectedWallet.id)
                  ? prev
                  : [connectedWallet.id, ...prev]
              );
            } catch (error) {
              console.error("Failed to add connected wallet:", error);
            }
          }
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setIsConnected(true);
        setConnectedAddress(accounts[0]);

        // Add connected wallet
        try {
          // Fetch USDC balance on Base network
          const addressParam = accounts[0]
            .slice(2)
            .toLowerCase()
            .padStart(64, "0");

          let balanceUSD = 0;
          const usdcBalance = await window.ethereum.request({
            method: "eth_call",
            params: [
              {
                to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                data: `0x70a08231${addressParam}`,
              },
              "latest",
            ],
          });

          console.log("usdcBalance", usdcBalance);

          if (usdcBalance && usdcBalance !== "0x") {
            const balanceInUSDC = parseInt(usdcBalance, 16) / Math.pow(10, 6);
            balanceUSD = balanceInUSDC;
          }

          const connectedWallet: Wallet = {
            id: `connected_${accounts[0]}`,
            name: "Connected Wallet",
            address: accounts[0],
            balance: balanceUSD.toFixed(2),
            isConnected: true,
            isBuiltIn: false,
          };
          setWallets((prev) => {
            const exists = prev.find(
              (w) => w.address.toLowerCase() === accounts[0].toLowerCase()
            );
            if (exists) {
              return prev.map((w) =>
                w.address.toLowerCase() === accounts[0].toLowerCase()
                  ? { ...w, isConnected: true, balance: balanceUSD.toFixed(2) }
                  : { ...w, isConnected: false }
              );
            }
            return [
              connectedWallet,
              ...prev.map((w) => ({ ...w, isConnected: false })),
            ];
          });
          setSelectedWallets((prev) =>
            prev.includes(connectedWallet.id)
              ? prev
              : [connectedWallet.id, ...prev]
          );
        } catch (error) {
          console.error("Failed to add connected wallet:", error);
        }

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(
            0,
            6
          )}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectedAddress(null);
    setWallets((prev) => prev.map((w) => ({ ...w, isConnected: false })));

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  const addWallet = useCallback(
    async (walletData: Omit<Wallet, "id">) => {
      try {
        // Check for duplicates
        const exists = wallets.find(
          (w) => w.address.toLowerCase() === walletData.address.toLowerCase()
        );

        if (exists) {
          toast({
            title: "Wallet Already Exists",
            description: "This wallet address is already in your list",
            variant: "destructive",
          });
          return;
        }

        const newWallet: Wallet = {
          id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...walletData,
        };

        setWallets((prev) => [...prev, newWallet]);

        // Auto-select the new wallet
        setSelectedWallets((prev) => [...prev, newWallet.id]);
      } catch (error) {
        throw new Error("Failed to add wallet");
      }
    },
    [wallets, toast]
  );

  const removeWallet = useCallback(
    (walletId: string) => {
      setWallets((prev) => prev.filter((w) => w.id !== walletId));
      setSelectedWallets((prev) => prev.filter((id) => id !== walletId));

      toast({
        title: "Wallet Removed",
        description: "Wallet has been removed from your list",
      });
    },
    [toast]
  );

  const toggleWalletSelection = useCallback((walletId: string) => {
    setSelectedWallets((prev) =>
      prev.includes(walletId)
        ? prev.filter((id) => id !== walletId)
        : [...prev, walletId]
    );
  }, []);

  const getSelectedWallets = useCallback(() => {
    return wallets.filter((w) => selectedWallets.includes(w.id));
  }, [wallets, selectedWallets]);

  // Get wallets for chat context (excludes built-in wallet by default)
  const getWalletsForChat = useCallback(() => {
    return wallets.filter(
      (w) => selectedWallets.includes(w.id) && !w.isBuiltIn
    );
  }, [wallets, selectedWallets]);

  // Get the built-in wallet
  const getBuiltInWallet = useCallback(() => {
    return wallets.find((w) => w.isBuiltIn);
  }, [wallets]);

  const value: WalletContextType = {
    wallets,
    selectedWallets,
    isConnected,
    connectedAddress,
    isConnecting,
    isInitialized,
    connectWallet,
    disconnect,
    addWallet,
    removeWallet,
    toggleWalletSelection,
    getSelectedWallets,
    getWalletsForChat,
    getBuiltInWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
