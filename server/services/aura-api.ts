import axios from "axios";

const AURA_API_BASE = "https://aura.adex.network";

export async function fetchStrategies(addresses: string[]): Promise<any> {
  try {
    console.log(
      `[Aura API] Fetching strategies for ${addresses.length} address(es):`,
      addresses
    );

    const results = await Promise.all(
      addresses.map(async (address) => {
        console.log(`[Aura API] Requesting strategies for address: ${address}`);
        const startTime = Date.now();

        const response = await axios.get(
          `${AURA_API_BASE}/api/portfolio/strategies`,
          {
            params: {
              address,
              ...(process.env.AURA_API_KEY
                ? { apiKey: process.env.AURA_API_KEY }
                : {}),
            },
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 60000,
          }
        );

        const duration = Date.now() - startTime;
        console.log(
          `[Aura API] Response received for ${address} in ${duration}ms`
        );

        const rawData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        return rawData;
      })
    );

    return {
      strategies: results,
    };
  } catch (error: unknown) {
    if (
      (error as any)?.code === "ECONNABORTED" ||
      (error as any)?.code === "ETIMEDOUT"
    ) {
      throw new Error(
        "Request timed out. The Aura API took too long to respond."
      );
    }
    if ((error as any)?.response?.status === 404) {
      throw new Error(
        "API endpoint not found. Please check the Aura API documentation."
      );
    }
    const errorMessage = (error as any)?.message || "Unknown error";
    throw new Error(`API call failed: ${errorMessage}`);
  }
}
