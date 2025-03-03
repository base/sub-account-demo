'use client';
import { SignerType } from '../types';
import { useCoinbaseProvider } from '../CoinbaseProvider';
interface SettingsPanelProps {
  isLoggedIn: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

export default function SettingsPanel({ isLoggedIn, isMobile, onClose }: SettingsPanelProps) {
  const { signerType, setSignerType, spendPermissionRequestedAllowance, setSpendPermissionRequestedAllowance } = useCoinbaseProvider();



  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 w-80 max-w-80 flex-shrink-0">
      <div className="p-6">
        {isMobile && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        )}
        
        <h2 className="text-xl font-bold text-gray-900 mb-8">Settings</h2>
        
        <div className="space-y-8">
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
              Signer Configuration
            </h3>
            <select 
              value={signerType}
              onChange={(e) => setSignerType(e.target.value as SignerType)}
              disabled={isLoggedIn}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 
                disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 
                focus:border-indigo-500 transition-colors"
            >
              <option value="browser">Browser keys</option>
              <option value="turnkey">Turnkey signer</option>
            </select>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
              Spend Permissions
            </h3>
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-medium">
                Daily spend amount (ETH)
              </label>
              <input 
                type="number"
                min="0.001"
                step="0.001"
                value={spendPermissionRequestedAllowance}
                onChange={(e) => {
                    const value = e.target.value;
                    setSpendPermissionRequestedAllowance(value);
                }}
                disabled={isLoggedIn}
                className="w-full p-2.5 border border-gray-300 rounded-lg disabled:bg-gray-50 
                  disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 
                  focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {isLoggedIn && (
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                ℹ️ Settings can only be modified when wallet is not connected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 