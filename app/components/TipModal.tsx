import React, { useState } from 'react';
import { Address } from 'viem';
import { SPEND_PERMISSION_MANAGER_ADDRESS, useCoinbaseProvider } from '../CoinbaseProvider';
import { useEthUsdPrice } from '../hooks/useEthUsdPrice';
import { spendPermissionManagerAbi } from '../abi';

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
  const [confirmationProgress, setConfirmationProgress] = useState(0);
  const [confirmationTimer, setConfirmationTimer] = useState<NodeJS.Timeout | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const predefinedTips = [1, 5, 20, 50];
  const { provider, currentChain, sendCallWithSpendPermission } = useCoinbaseProvider();
  const [isLoading, setIsLoading] = useState(false);
  const {ethUsdPrice} = useEthUsdPrice();
  
  const convertUsdToEth = (usdAmount: number) => {
    if (!ethUsdPrice) return 0;
    return usdAmount / ethUsdPrice;
  };

  const getExplorerUrl = (txHash: string) => {
    if (!currentChain) return '#';
    return `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
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

        const txHash = await sendCallWithSpendPermission([
            {
                to: recipientAddress,
                data: '0x',
                value: tipAmountWei,
            }
        ], tipAmountWei);

        console.log('Transaction hash:', txHash);
        setConfirmationProgress(0);
        setTransactionHash(txHash as string);
        setIsSuccess(true);
    } catch (error) {
        console.error("Error sending tip:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const startConfirmationTimer = async() => {
    setConfirmationProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      if (progress === 100) {
        clearInterval(timer);
        setConfirmationTimer(null);
        sendTip();
      } else {
        setConfirmationProgress(progress);
      }
    }, 50); // Update every 50ms for smooth animation

    setConfirmationTimer(timer);
  };

  const cancelConfirmation = () => {
    if (confirmationTimer) {
      clearInterval(confirmationTimer);
      setConfirmationTimer(null);
      setConfirmationProgress(0);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setTransactionHash(null);
    onClose();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (confirmationTimer) {
        clearInterval(confirmationTimer);
      }
    };
  }, [confirmationTimer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        {!isSuccess ? (
          <>
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

            <div className="flex flex-col space-y-3">
              {confirmationProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-50"
                    style={{ width: `${confirmationProgress}%` }}
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
                  onClick={() => {
                    if (confirmationTimer) {
                      cancelConfirmation();
                    } else {
                      startConfirmationTimer();
                    }
                  }}
                  disabled={!provider || isLoading}
                >
                  {confirmationTimer ? 'Cancel Tip' : 'Send Tip'}
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              You've tipped @{recipientName}!
            </h3>
            <p className="text-gray-600 mb-2">
              Amount: ${parseFloat(customTipAmount).toFixed(2)} USD
            </p>
            <p className="text-gray-600 mb-6">
              Thank you for supporting this creator
            </p>
            {transactionHash && (
              <a 
                href={getExplorerUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline block mb-6"
              >
                View transaction on block explorer
              </a>
            )}
            <button
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 