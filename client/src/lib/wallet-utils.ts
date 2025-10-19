import { privateKeyToAccount } from "viem/accounts";
import { generatePrivateKey } from "viem/accounts";
import type { Wallet } from "@shared/schema";

const BUILTIN_WALLET_KEY = "heyaura_builtin_wallet_pk";

export function getOrCreateBuiltInWallet(): {
  wallet: Wallet;
  privateKey: `0x${string}`;
} {
  // Check if wallet exists in localStorage
  // NOTE: This is a temporary hot wallet for development/testing purposes only.
  // In production, consider using hardware wallets or secure key management solutions.
  let privateKey = localStorage.getItem(BUILTIN_WALLET_KEY) as
    | `0x${string}`
    | null;

  if (!privateKey) {
    // Generate new wallet
    privateKey = generatePrivateKey();
    localStorage.setItem(BUILTIN_WALLET_KEY, privateKey);
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  const wallet: Wallet = {
    id: "builtin_wallet",
    name: "Built-in Wallet",
    address: account.address,
    balance: "0",
    isConnected: false,
    isBuiltIn: true,
    userId: null,
    createdAt: new Date(),
  };

  return { wallet, privateKey };
}

export function getBuiltInPrivateKey(): `0x${string}` | null {
  return localStorage.getItem(BUILTIN_WALLET_KEY) as `0x${string}` | null;
}
