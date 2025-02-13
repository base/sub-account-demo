import { formatEther } from "viem";
import { useCoinbaseProvider } from "../CoinbaseProvider";
import { useEthUsdPrice } from "../hooks/useEthUsdPrice";

export default function WalletFooter() {
    const { subaccount, disconnect, currentChain, remainingSpend, signSpendPermission } = useCoinbaseProvider();
    const { ethUsdPrice } = useEthUsdPrice();
    if (!subaccount) return null;

    const ethBalance = remainingSpend ? Number(formatEther(remainingSpend.valueOf())) : 0;
    const usdBalance = ethUsdPrice ? (ethBalance * ethUsdPrice).toFixed(2) : '0.00';

    return (
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Network:</span>{' '}
            {currentChain?.name || 'Unknown'}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Wallet:</span>{' '}
            {`${subaccount.slice(0, 6)}...${subaccount.slice(-4)}`}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Balance:</span>{' '}
            <span>${usdBalance}</span>
          </div>
          <button 
            onClick={() => {
                signSpendPermission({
                    allowance: '0x71afd498d0000',// 0.002 ETH per day (~$5)
                    period: 86400, // seconds in a day
                    start: Math.floor(Date.now() / 1000), // unix timestamp
                    end: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60), // one month from now
                    salt: '0x1',
                    extraData: "0x" as Hex,
                  })
            }}
            className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Top Up Balance
          </button>
          <button 
            onClick={() => disconnect()} 
            className="w-full px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
} 