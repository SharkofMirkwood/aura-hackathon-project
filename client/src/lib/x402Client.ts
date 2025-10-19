import axios from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { createWalletClient, custom, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { getBuiltInPrivateKey } from "./wallet-utils";

const REQUIRED_CHAIN = base;
const REQUIRED_CHAIN_ID = `0x${REQUIRED_CHAIN.id.toString(16)}`;

export async function createX402Client(useBuiltInWallet: boolean = false) {
  let walletClient;

  if (useBuiltInWallet) {
    const privateKey = getBuiltInPrivateKey();
    if (!privateKey) {
      throw new Error("Built-in wallet not found. Please refresh the page.");
    }

    const account = privateKeyToAccount(privateKey);

    walletClient = createWalletClient({
      account,
      chain: REQUIRED_CHAIN,
      transport: custom({
        async request({ method, params }) {
          const response = await fetch("https://mainnet.base.org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method,
              params,
            }),
          });
          const data = await response.json();
          return data.result;
        },
      }),
    }).extend(publicActions);
  } else {
    if (!window.ethereum) {
      throw new Error("No browser wallet detected. Please install MetaMask.");
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet.");
      }

      const currentChainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      if (currentChainId !== REQUIRED_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: REQUIRED_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4001) {
            throw new Error(
              "You need to switch to the Base network to continue. Please try again and approve the network switch."
            );
          }

          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: REQUIRED_CHAIN_ID,
                    chainName: "Base",
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
                ],
              });
            } catch (addError: any) {
              if (addError.code === 4001) {
                throw new Error(
                  "You need to add the Base network to continue. Please try again and approve adding the network."
                );
              }
              throw new Error(
                "Failed to add Base network to your wallet. Please add it manually."
              );
            }
          } else {
            throw new Error(
              "Failed to switch to Base network. Please switch manually in your wallet."
            );
          }
        }

        const newChainId = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;

        if (newChainId !== REQUIRED_CHAIN_ID) {
          throw new Error(
            "Network switch incomplete. Please manually switch to Base network in your wallet and try again."
          );
        }
      }

      walletClient = createWalletClient({
        account: accounts[0] as `0x${string}`,
        chain: REQUIRED_CHAIN,
        transport: custom(window.ethereum),
      }).extend(publicActions);

      const finalChainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      if (finalChainId !== REQUIRED_CHAIN_ID) {
        throw new Error(
          `Chain mismatch detected. Please ensure you are on the Base network and try again.`
        );
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error(
          "Wallet connection rejected. Please approve the connection request to continue."
        );
      }

      throw error;
    }
  }

  const client = withPaymentInterceptor(
    axios.create({
      baseURL: "",
    }),
    walletClient
  );

  return client;
}
