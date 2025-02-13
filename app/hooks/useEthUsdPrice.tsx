import { useEffect, useState, useMemo } from 'react';

interface CoinbaseResponse {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

// Cache both the price and the in-flight promise
let cachedEthUsdPrice: number | null = null;
let currentFetchPromise: Promise<number> | null = null;

const fetchPriceOnce = async (): Promise<number> => {
  // Return cached price if available
  if (cachedEthUsdPrice !== null) {
    return cachedEthUsdPrice;
  }

  // Return existing promise if there's already a request in flight
  if (currentFetchPromise !== null) {
    return currentFetchPromise;
  }

  // Create new promise for the fetch
  currentFetchPromise = fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot')
    .then((response) => response.json())
    .then((data: CoinbaseResponse) => {
      const newPrice = parseFloat(data.data.amount);
      cachedEthUsdPrice = newPrice;
      currentFetchPromise = null;
      return newPrice;
    })
    .catch((error) => {
      currentFetchPromise = null;
      throw error;
    });

  return currentFetchPromise;
};

export function useEthUsdPrice() {
  const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(cachedEthUsdPrice);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!cachedEthUsdPrice);

  useEffect(() => {
    if (cachedEthUsdPrice !== null) {
      return;
    }

    fetchPriceOnce()
      .then((price) => {
        setEthUsdPrice(price);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch ETH/USD price');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return useMemo(() => ({
    ethUsdPrice,
    error,
    loading,
    formattedPrice: ethUsdPrice ? `$${ethUsdPrice.toLocaleString()}` : undefined
  }), [ethUsdPrice, error, loading]);
} 