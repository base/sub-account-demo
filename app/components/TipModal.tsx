import React, { useState } from 'react';
import { Address } from 'viem';
import { useCoinbaseProvider } from '../CoinbaseProvider';
import { useEthUsdPrice } from '../hooks/useEthUsdPrice';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAddress: Address;
  currentBalance: number;
}

export default function TipModal({ 
  isOpen, 
  onClose, 
  recipientName,
  recipientAddress,
  currentBalance 
}: TipModalProps) {
  const [customTipAmount, setCustomTipAmount] = useState("");
  const predefinedTips = [1, 5, 20, 50];
  const { provider, currentChain } = useCoinbaseProvider();
  const [isLoading, setIsLoading] = useState(false);
  const {ethUsdPrice} = useEthUsdPrice();
  
  const convertUsdToEth = (usdAmount: number) => {
    if (!ethUsdPrice) return 0;
    return usdAmount / ethUsdPrice;
  };

  const sendTip = async () => {
    if (!provider || !currentChain || !customTipAmount) {
        throw new Error("Provider, chain, or tip amount not found");
    }
    setIsLoading(true);
    try {
        const tipAmountUsd = parseFloat(customTipAmount);
        const tipAmountEth = convertUsdToEth(tipAmountUsd);
        const tipAmountWei = BigInt(Math.floor(tipAmountEth * 1e18));

        const tx = await provider.request({
            method: 'wallet_sendCalls',
            params: [
                {
                    chainId: currentChain.id,
                    calls: [
                        {
                            to: recipientAddress,
                            data: '0x',
                            value: tipAmountWei,
                        }
                    ],
                    version: '1',
                    capabilities: {
                        paymasterService: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL!
                    }
                }
            ],
        });
        console.log('tx', tx);
    } catch (error) {
        console.error("Error sending tip:", error);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Send a tip to @{recipientName}</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Your balance: ${currentBalance}</p>
          <div className="grid grid-cols-2 gap-2">
            {predefinedTips.map((amount) => (
              <button
                key={amount}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                onClick={() => setCustomTipAmount(amount.toString())}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">Custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={customTipAmount}
                onChange={(e) => setCustomTipAmount(e.target.value)}
                className="w-full border rounded p-2 pl-6"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {customTipAmount && ethUsdPrice && (
              <p className="text-xs text-gray-500 mt-1">
                ≈ {convertUsdToEth(parseFloat(customTipAmount)).toFixed(6)} ETH
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={() => {
              sendTip().then(onClose);
            }}
            disabled={!provider || isLoading}
          >
            Send Tip
          </button>
          <button
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 