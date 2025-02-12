'use client';
import { createCoinbaseWalletSDK, getCryptoKeyAccount, ProviderInterface } from "@coinbase/wallet-sdk";
import { createContext, useCallback, useContext, useState } from "react";
import { Address, Chain, createPublicClient, createWalletClient, custom, http, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";

type CoinbaseContextType = {
    provider: ProviderInterface | null;
    walletClient: WalletClient | null;
    publicClient: any | null;
    address: Address | null;
    connect: () => void;
    subaccount: Address | null;
    switchChain: () => Promise<void>;
    currentChain: Chain | null;
};
const CoinbaseContext = createContext<CoinbaseContextType>({ 
    provider: null, 
    publicClient: null, walletClient: null, address: null, 
    connect: () => {},
    subaccount: null,
    switchChain: async () => {},
    currentChain: null});
  

const sdk = createCoinbaseWalletSDK({
    appName: 'BasePaint Mini',
    appChainIds: [baseSepolia.id],
    preference: {
        options: "smartWalletOnly",
        keysUrl: 'https://keys-dev.coinbase.com/connect',
    },
    subaccount: {
        getSigner: getCryptoKeyAccount
    }
});

async function addAddress(provider: ProviderInterface, chain: Chain) {
    const account = await getCryptoKeyAccount();
    const response = (await provider.request({
      method: 'wallet_addAddress',
      params: [
        {
          version: '1',
          chainId: chain.id,
          capabilities: {
            createAccount: {
              signer: account.publicKey,
            },
          },
        },
      ],
    })) as { address: string };
    console.log('custom logs addAddress resp:', response);
    return response.address;
}

async function handleSwitchChain(provider: ProviderInterface) {
    const response = await provider.request({
        method: 'wallet_switchChain',
        params: [baseSepolia.id],
    });
    console.log('custom logs switchChain resp:', response);
}

export function CoinbaseProvider({ children }: { children: React.ReactNode }) {
    const [provider] = useState<ProviderInterface>(sdk.getProvider());
    const [subaccount, setSubaccount] = useState<Address | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [currentChain, setCurrentChain] = useState<Chain | null>(baseSepolia);
    const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom({
          async request({ method, params }) {
            const response = await provider.request({ method, params });
            return response;
          }
        }),
      });
  
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    const switchChain = useCallback(async () => {
        await handleSwitchChain(provider);
    }, [provider]);
  
    const connect = useCallback(async () => {
      walletClient
        .requestAddresses()
        .then(async (addresses) => {
          if (addresses.length > 0) {
            setAddress(addresses[0])
            if (!subaccount) {
              // request creation of one. TODO: if one exists, add new owner.
              const subaccount = await addAddress(provider, baseSepolia);
              setSubaccount(subaccount as Address);
            }
          }
    });
  
    }, [walletClient, setSubaccount]);
  
    /*useEffect(() => {
      walletClient
        .getAddresses()
        .then((addresses) => {
          console.log('custom logs getAddresses resp:', addresses);
            if(addresses.length > 0) {
              setAddress(addresses[0])
            }
          });
    }, [walletClient]);*/
   
  
    console.log('wallet client', walletClient);
  
    return (
      <CoinbaseContext.Provider value={{ provider, walletClient, publicClient, address, connect, subaccount, switchChain, currentChain }}>
        {children}
      </CoinbaseContext.Provider>
    );
  }
  
export function useCoinbaseProvider() {
  if (!CoinbaseContext) {
    throw new Error('Coinbase context must be accessed within a CoinbaseProvider');
  }
  return useContext(CoinbaseContext);
}