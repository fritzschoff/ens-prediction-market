'use client';

import { useState, useEffect } from 'react';

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://coins.llama.fi/prices/current/coingecko:ethereum'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch ETH price');
        }

        const data = await response.json();
        const ethPrice = data.coins['coingecko:ethereum']?.price;

        if (!ethPrice) {
          throw new Error('ETH price not found in response');
        }
        setPrice(ethPrice);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch ETH price')
        );
        console.error('Error fetching ETH price:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { price, isLoading, error };
}
