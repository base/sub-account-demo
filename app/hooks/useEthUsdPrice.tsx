import { useEffect, useState, useMemo } from 'react';

interface CoinbaseResponse {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

// Cache the fetched price in memory
let cachedEthUsdPrice: number | null = null;

export function useEthUsdPrice() {
  const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(cachedEthUsdPrice);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!cachedEthUsdPrice);

  useEffect(() => {
    const fetchPrice = async () => {
      if (cachedEthUsdPrice !== null) {
        return;
      }

      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
        const data: CoinbaseResponse = await response.json();
        const newPrice = parseFloat(data.data.amount);
        
        cachedEthUsdPrice = newPrice;
        setEthUsdPrice(newPrice);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ETH/USD price');
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, []);

  return useMemo(() => ({
    ethUsdPrice,
    error,
    loading,
    formattedPrice: ethUsdPrice ? `$${ethUsdPrice.toLocaleString()}` : undefined
  }), [ethUsdPrice, error, loading]);
} 