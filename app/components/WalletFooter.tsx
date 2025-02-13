import { formatEther } from "viem";
import { useCoinbaseProvider } from "../CoinbaseProvider";


export default function WalletFooter() {
    const { subaccount, disconnect, currentChain, remainingSpend } = useCoinbaseProvider();
    if (!subaccount) return null;

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
          <span>{remainingSpend ? formatEther(remainingSpend.valueOf()) : '0.00'}</span> 
        </div>
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