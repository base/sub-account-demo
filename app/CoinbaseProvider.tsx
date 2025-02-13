'use client';
import { createCoinbaseWalletSDK, getCryptoKeyAccount, ProviderInterface } from "@coinbase/wallet-sdk";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Address, Chain, createPublicClient, createWalletClient, custom, encodeFunctionData, fromHex, http, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { spendPermissionManagerAbi } from "./abi";
import { SpendPermission } from "./types";

export const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad';

type CoinbaseContextType = {
    provider: ProviderInterface | null;
    walletClient: WalletClient | null;
    publicClient: any | null;
    address: Address | null;
    connect: () => void;
    subaccount: Address | null;
    switchChain: () => Promise<void>;
    currentChain: Chain | null;
    disconnect: () => Promise<void>;
    spendPermission: object | null;
    spendPermissionSignature: string | null;
    signSpendPermission: (spendPermission: SpendPermission) => Promise<string>;
    sendCallWithSpendPermission: (calls: any[], txValueWei: bigint) => Promise<string>;
    remainingSpend: BigInt | null;
};
const CoinbaseContext = createContext<CoinbaseContextType>({ 
    provider: null, 
    publicClient: null, walletClient: null, address: null, 
    connect: () => {},
    subaccount: null,
    switchChain: async () => {},
    currentChain: null,
    disconnect: async () => {},
    spendPermission: null,
    spendPermissionSignature: null,
    signSpendPermission: async () => '',
    sendCallWithSpendPermission: async () => '',
    remainingSpend: null
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
    })) as { address: string, root: string };
    console.log('custom logs addAddress resp:', response);
    return response;
}

async function handleSwitchChain(provider: ProviderInterface) {
    const response = await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: `0x${baseSepolia.id.toString(16)}`
          }
        ],
    });
}

type PeriodSpend = {
  start: number;
  end: number;
  spend: BigInt;
}

export function CoinbaseProvider({ children }: { children: React.ReactNode }) {
    const [provider, setProvider] = useState<ProviderInterface | null>(null);
    const [subaccount, setSubaccount] = useState<Address | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [currentChain, setCurrentChain] = useState<Chain | null>(baseSepolia);
    const [spendPermission, setSpendPermission] = useState<SpendPermission | null>(null);
    const [spendPermissionSignature, setSpendPermissionSignature] = useState<string | null>(null);
    const [periodSpend, setPeriodSpend] = useState<PeriodSpend | null>(null);
    const [remainingSpend, setRemainingSpend] = useState<BigInt | null>(fromHex('0x71afd498d0000', 'bigint'));

  useEffect(() => {
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
    setProvider(sdk.getProvider());
  }, []);

    const walletClient = useMemo(() => {
      if (!provider) return null;
      return createWalletClient({
        chain: baseSepolia,
        transport: custom({
          async request({ method, params }) {
            const response = await provider.request({ method, params });
            return response;
          }
        }),
      });
    }, [provider]);
  
    const publicClient = useMemo(() => createPublicClient({
      chain: baseSepolia,
      transport: http(),
    }), []);

    const switchChain = useCallback(async () => {
      if (!provider) return;
      await handleSwitchChain(provider);
    }, [provider]);
  
    const connect = useCallback(async () => {
      if (!walletClient || !provider) return;
      walletClient
        .requestAddresses()
        .then(async (addresses) => {
            if (addresses.length > 0) {
              setAddress(addresses[0])
              if (!subaccount) {
                // request creation of one. TODO: if one exists, add new owner.
                const subAcc = await addAddress(provider, baseSepolia);
                setAddress(subAcc.root as Address);
                setSubaccount(subAcc.address as Address);
              }
            }
      });
    }, [walletClient, setSubaccount, provider, subaccount]);

    const disconnect = useCallback(async () => {
      if (!provider) return;
      provider.disconnect();
      setAddress(null);
      setSubaccount(null);
  }, [provider]);
  
    useEffect(() => {
      if (!walletClient) return;
      walletClient
        .getAddresses()
        .then((addresses) => {
          console.log('custom logs getAddresses resp:', addresses);
            if(addresses.length > 0) {
             // setSubaccount(addresses[0])
            }
          });
    }, [walletClient]);

    useEffect(() => {
      const initSpendPermissionsFromStore = async () => {
        // see if user has any spend permissions in local storage
        const spendPermissions = localStorage.getItem('cbsw-demo-spendPermissions');
        const spendPermissionsSignature = localStorage.getItem('cbsw-demo-spendPermissions-signature');
        if (spendPermissions && spendPermissionsSignature) {
        const spendPermission = JSON.parse(spendPermissions) as SpendPermission;
          setSpendPermission(spendPermission);
          setSpendPermissionSignature(spendPermissionsSignature);
        }
      }
      initSpendPermissionsFromStore();
    }, [])

    useEffect(() => {
      if (spendPermission) {
        refreshPeriodSpend();
      }
    }, [spendPermission]);
   
    const signSpendPermission = useCallback(async ({
      allowance, period, start, end, salt, extraData
    }: {
      allowance: string;
      period: string;
      start: string;
      end: string;
      salt: string;
      extraData: string;
    }) => {
      if (!provider) return;
      const spendPermission = {
        account: address,
        spender: subaccount,
        token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        allowance,
        period,
        start,
        end,
        salt,
        extraData
      }
      console.log('custom logs spendPermission:', spendPermission);
      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [
          address || "0x009A32862CA078F53Fc9D7e7EaA4442d890753a1",
          {
            types: {
              SpendPermission: [
                { name: "account", type: "address" },
                { name: "spender", type: "address" },
                { name: 'token', type: 'address' },
                { name: 'allowance', type: 'uint160' },
                { name: 'period', type: 'uint48' },
                { name: 'start', type: 'uint48' },
                { name: 'end', type: 'uint48' },
                { name: 'salt', type: 'uint256' },
                { name: 'extraData', type: 'bytes' }
              ]
            },
            primaryType: "SpendPermission",
            message: spendPermission,
            domain: {
              name: 'Spend Permission Manager',
              version: "1",
              chainId: baseSepolia.id,
              verifyingContract: SPEND_PERMISSION_MANAGER_ADDRESS
            }
          }
        ]
      });
      setSpendPermission(spendPermission);
      setSpendPermissionSignature(signature as string);
      localStorage.setItem('cbsw-demo-spendPermissions', JSON.stringify(spendPermission));
      localStorage.setItem('cbsw-demo-spendPermissions-signature', signature as string);
    }, [provider, address, subaccount]);

    const refreshPeriodSpend = useCallback(async () => {
      try {
        if (!spendPermission) return;
        const currentPeriod = await publicClient.readContract({
          address: SPEND_PERMISSION_MANAGER_ADDRESS,
          abi: spendPermissionManagerAbi,
          functionName: 'getCurrentPeriod',
          args: [spendPermission],
          blockTag: 'latest'
        });
        const remainingSpend = fromHex(spendPermission.allowance as `0x${string}`, 'bigint') - currentPeriod.spend.valueOf();
        setRemainingSpend(remainingSpend);
        setPeriodSpend(currentPeriod);

      } catch (error) {
        console.error('custom logs refreshPeriodSpend error:', error);
      }
    }, [spendPermission, publicClient]);

    const sendCallWithSpendPermission = useCallback(async (calls: any[], txValueWei: bigint): Promise<string> => {
      if (!provider) return '';
      const response = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            chainId: currentChain?.id,
            calls: [
                {
                  to: SPEND_PERMISSION_MANAGER_ADDRESS,
                  abi: spendPermissionManagerAbi,
                  functionName: 'approveWithSignature',
                  args: [spendPermission, spendPermissionSignature]
              },
              {
                  to: SPEND_PERMISSION_MANAGER_ADDRESS,
                  abi: spendPermissionManagerAbi,
                  functionName: 'spend',
                  args: [spendPermission, txValueWei]
              },
               ...calls

            ],
            version: '1',
            capabilities: {
                paymasterService: {
                    url: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL!
                }
            }
          }   
      ]});
      
      await refreshPeriodSpend();
      return response as string;
    }, [provider, spendPermissionSignature, spendPermission, currentChain, publicClient]);

    return (
      <CoinbaseContext.Provider value={{ 
        disconnect, spendPermission, spendPermissionSignature, signSpendPermission, sendCallWithSpendPermission,
        remainingSpend,
        provider, walletClient, publicClient, address, connect, subaccount, switchChain, currentChain }}>
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