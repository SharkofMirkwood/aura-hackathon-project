export const API_COSTS = {
  STRATEGIES: {
    COST_PER_ADDRESS: 0.01,
    CURRENCY: "USD",
    DESCRIPTION: "DeFi strategies analysis per wallet address",
  },
} as const;

export const PAYMENT_CONFIG = {
  STRATEGIES: {
    AMOUNT: API_COSTS.STRATEGIES.COST_PER_ADDRESS,
    FUNCTION_NAME: "get_strategies",
    DESCRIPTION: "Get DeFi strategy recommendations",
    FIRST_TIME_MESSAGE:
      "This is your first time requesting DeFi strategies. You'll need to pay $0.01 per wallet address to get personalized recommendations. The payment will be processed automatically through your connected wallet.",
  },
} as const;
