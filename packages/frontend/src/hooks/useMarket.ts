"use client";

import { usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import { resolveMarketFromENS, MarketRecords } from "@hack-money/ens";

export function useMarketFromENS(ensName: string | undefined) {
  const publicClient = usePublicClient();
  const [market, setMarket] = useState<MarketRecords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ensName || !publicClient) return;

    const fetchMarket = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const records = await resolveMarketFromENS(publicClient, ensName);
        setMarket(records);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch market"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarket();
  }, [ensName, publicClient]);

  return { market, isLoading, error };
}

