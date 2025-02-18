import { formatEther, parseEther, toHex } from "viem";
import { useCoinbaseProvider } from "../CoinbaseProvider";
import { useEthUsdPrice } from "../hooks/useEthUsdPrice";

export default function WalletFooter() {
    const { subaccount, disconnect, currentChain, remainingSpend, signSpendPermission, spendPermissionRequestedAllowance } = useCoinbaseProvider();
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
            <span className="inline-flex items-center space-x-1">
              {`${subaccount.slice(0, 6)}...${subaccount.slice(-4)}`}
              <button
                onClick={() => navigator.clipboard.writeText(subaccount)}
                className="hover:text-blue-500 transition-colors active:scale-90 transform transition-transform duration-100"
                title="Copy address"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
              </button>
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Balance:</span>{' '}
            <span>${usdBalance}</span>
          </div>
          <button 
            onClick={() => {
                signSpendPermission({
                    allowance: toHex(parseEther(spendPermissionRequestedAllowance)),
                    period: 86400, // seconds in a day
                    start: Math.floor(Date.now() / 1000),
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