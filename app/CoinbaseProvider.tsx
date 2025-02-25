'use client';
import { createCoinbaseWalletSDK, getCryptoKeyAccount, ProviderInterface } from "@coinbase/wallet-sdk";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Address, Chain, createPublicClient, createWalletClient, custom, fromHex, Hex, http, parseEther, toHex, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { spendPermissionManagerAbi } from "./abi";
import { Signer, SignerType, SpendPermission, WalletConnectResponse } from "./types";
import { clearObjectStore } from "./utils/clearIndexDB";
import { getTurnkeyAccount } from "./utils/turnkey";
import { SPEND_PERMISSION_REQUESTED_ALLOWANCE, SPEND_PERMISSION_TOKEN } from "./utils/constants";
import { getPrivyAccount } from "./utils/privy";

export const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad';

type CoinbaseContextType = {
    provider: ProviderInterface | null;
    walletClient: WalletClient | null;
    publicClient: any | null;
    address: Address | null;
    addressBalanceWei: bigint;
    connect: () => void;
    subaccount: Address | null;
    switchChain: () => Promise<void>;
    currentChain: Chain | null;
    disconnect: () => Promise<void>;
    spendPermission: object | null;
    spendPermissionSignature: string | null;
    signSpendPermission: (spendPermission: SpendPermission) => Promise<string>;
    sendCallWithSpendPermission: (calls: any[], txValueWei: bigint) => Promise<string>;
    remainingSpend: bigint | null;
    signerType: SignerType;
    setSignerType: (signerType: SignerType) => void;
    spendPermissionRequestedAllowance: string;
    setSpendPermissionRequestedAllowance: (spendPermissionRequestedAllowance: string) => void;
    createLinkedAccount: () => Promise<void>;
    fetchAddressBalance: () => Promise<void>;
};
const CoinbaseContext = createContext<CoinbaseContextType>({ 
    provider: null, 
    publicClient: null, 
    walletClient: null, 
    address: null, 
    addressBalanceWei: BigInt(0),
    connect: () => {},
    subaccount: null,
    switchChain: async () => {},
    currentChain: null,
    disconnect: async () => {},
    spendPermission: null,
    spendPermissionSignature: null,
    signSpendPermission: async () => '',
    sendCallWithSpendPermission: async () => '',
    remainingSpend: null,
    signerType: 'browser',
    setSignerType: () => {},
    spendPermissionRequestedAllowance: '0.002',
    setSpendPermissionRequestedAllowance: () => {},
    createLinkedAccount: async () => {},
    fetchAddressBalance: async () => {}
});

// create sub account and a subsequent spend permission for it.
async function handleCreateLinkedAccount(provider: ProviderInterface,
  chain: Chain,
  signerType: SignerType,
  address: Address,
  spendPermissionOps: {
    token: `0x${string}`,
    allowance: string;
    period: number;
    salt: string;
    extraData: string;
  }
) {
  const signerFunc = getSignerFunc(signerType);
  if (!signerFunc) {
    throw new Error('signerFunc is required');
  }
  const account = await signerFunc();
  if (!account) {
    throw new Error('account is required');
  }
  let signer;
  if (signerType === 'browser') {
    signer = account.account?.publicKey;
  } else if (signerType === 'privy') {
    signer = account.account?.address;
  } else if (signerType === 'turnkey') {
    signer = account.account?.address;
  }
  if (!signer) {
    throw new Error('signer not found');
  }
  const response = (await provider.request({
    method: 'wallet_connect',
    params: [{
      version: '1',
      capabilities: {
        addAddress: {
          chainId: chain.id,
          createAccount: {
            signer,
          },
          address
        },
        spendPermissions: spendPermissionOps,
        getSpendPermissions: true,
      },
    }],
  })) as WalletConnectResponse;
  console.log('custom logs createLinkedAccount resp:', response);
  return {
    address: response?.accounts[0].capabilities?.addAddress?.root,
    subAccount: response?.accounts[0].capabilities?.addAddress?.address,
    spendPermission: response?.accounts[0].capabilities?.spendPermissions,
  };
}
async function handleSwitchChain(provider: ProviderInterface) {
    await provider.request({
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
  spend: bigint;
}

const getSignerFunc = (signerType: SignerType): (() => Promise<Signer>) => {
  if (signerType === 'browser') {
    return getCryptoKeyAccount;
  } else if (signerType === 'privy') {
    return getPrivyAccount;
  } else if (signerType === 'turnkey') {
    return getTurnkeyAccount;
  }
  throw new Error('Invalid signer type');
}

const clearCache = () => {
  localStorage.clear();
  // Clear IndexedDB
  const indexDbReq = indexedDB.open('cbwsdk', 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexDbReq.onsuccess = (event: any) => {
    const db = event.target.result;
    clearObjectStore(db, 'keys');
  }
}

export function CoinbaseProvider({ children }: { children: React.ReactNode }) {
    const [provider, setProvider] = useState<ProviderInterface | null>(null);
    const [subaccount, setSubaccount] = useState<Address | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [addressBalanceWei, setAddressBalanceWei] = useState<bigint>(BigInt(0));
    const [currentChain] = useState<Chain | null>(baseSepolia);
    const [spendPermissionRequestedAllowance, setSpendPermissionRequestedAllowance] = useState<string>(`${SPEND_PERMISSION_REQUESTED_ALLOWANCE}`);
    const [spendPermission, setSpendPermission] = useState<SpendPermission | null>(null);
    const [spendPermissionSignature, setSpendPermissionSignature] = useState<string | null>(null);
    const [,setPeriodSpend] = useState<PeriodSpend | null>(null);
    const [remainingSpend, setRemainingSpend] = useState<bigint | null>(fromHex('0x71afd498d0000', 'bigint'));
    const [signerType, setSignerType] = useState<SignerType>('browser');

    useEffect(() => {
        const cachedSignerType = localStorage.getItem('cbsw-demo-cachedSignerType') as SignerType;
        if (cachedSignerType) {
            setSignerType(cachedSignerType);
        }
    }, []);

    useEffect(() => {
        const sdk = createCoinbaseWalletSDK({
          appName: 'Coinbase Wallet demo',
          appChainIds: [baseSepolia.id],
          preference: {
            options: "smartWalletOnly",
            keysUrl: 'https://keys-dev.coinbase.com/connect',
          },
          subaccount: {
            getSigner: getSignerFunc(signerType)
          }
        });
        setProvider(sdk.getProvider());
    }, [signerType]);

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
      if (!walletClient || !provider || !signerType) return;
      walletClient
        .requestAddresses()
        .then(async (addresses) => {
            if (addresses.length > 0) {
              setAddress(addresses[0])
            }
      });
    }, [walletClient, provider, signerType]);

    const disconnect = useCallback(async () => {
      if (!provider) return;
      provider.disconnect();
      setAddress(null);
      setSubaccount(null);
      setSpendPermission(null);
      setSpendPermissionSignature(null);
      setRemainingSpend(null);
      setPeriodSpend(null);
      clearCache();
  }, [provider]);

  const createLinkedAccount = useCallback(async () => {
    if (!subaccount && address) {

      if (!provider) {
        throw new Error('provider is required');
      }

      // request creation of one. TODO: if one exists, add new owner.
      const createLinkedAccountResp = await handleCreateLinkedAccount(provider, baseSepolia, signerType, address, {
        token: SPEND_PERMISSION_TOKEN,
        allowance: toHex(parseEther(spendPermissionRequestedAllowance)),
        period: 86400,
        salt: '0x1',
        extraData: '0x' as Hex
      });
      console.log('custom logs createLinkedAccount resp:', createLinkedAccountResp);
      setAddress(createLinkedAccountResp.address as Address);
      setSubaccount(createLinkedAccountResp.subAccount as Address);

      setSpendPermissionSignature(createLinkedAccountResp.spendPermission.signature as string);
      setSpendPermission(createLinkedAccountResp.spendPermission.permission as SpendPermission);

    }
  }, [provider, signerType, address, spendPermissionRequestedAllowance, subaccount]);
  
    /*useEffect(() => {
      if (!walletClient) return;
      walletClient
        .getAddresses()
        .then((addresses) => {
          console.log('custom logs getAddresses resp:', addresses);
            if(addresses.length > 0) {
             // setSubaccount(addresses[0])
            }
          });
    }, [walletClient]);*/

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
        token: SPEND_PERMISSION_TOKEN,
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
          address,
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
      console.log('custom logs spendPermissionSignature:', signature);
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
    }, [spendPermission, publicClient, setPeriodSpend]);

    const sendCallWithSpendPermission = useCallback(async (calls: any[], txValueWei: bigint): Promise<string> => {
      if (!provider || !spendPermissionSignature) {
        throw new Error('provider and spendPermissionSignature are required');
      }


      const batchCalls =[
        {
          to: SPEND_PERMISSION_MANAGER_ADDRESS,
          abi: spendPermissionManagerAbi,
          functionName: 'approveWithSignature',
          args: [spendPermission, spendPermissionSignature],
          data: '0x',
      },
      {
          to: SPEND_PERMISSION_MANAGER_ADDRESS,
          abi: spendPermissionManagerAbi,
          functionName: 'spend',
          args: [spendPermission, txValueWei.toString()],
          data: '0x',
      },
       ...calls
      ];

      console.log('custom logs, sendCallWithSpendPermission, spendPermissionSignature:', spendPermissionSignature
        , 'spendPermission:', spendPermission, 'txValueWei:', txValueWei, 'calls:', batchCalls
      );
      const response = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            chainId: currentChain?.id,
            calls: batchCalls,
            from: subaccount,
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
    }, [provider, spendPermissionSignature, spendPermission, currentChain, refreshPeriodSpend, subaccount]);

    const wrappedSetSignerType = useCallback((newSignerType: SignerType) => {
      if (signerType !== newSignerType) {
        clearCache();
        setSignerType(newSignerType);
        localStorage.setItem('cbsw-demo-cachedSignerType', newSignerType);
      }
    }, [setSignerType, signerType]);

    const fetchAddressBalance = useCallback(async () => {
      if (!address) return;
      const balance = await publicClient.getBalance({ address: address as Address });
      setAddressBalanceWei(balance);
    }, [address, publicClient]);


    useEffect(() => {
      fetchAddressBalance();
    }, [fetchAddressBalance]);

    return (
      <CoinbaseContext.Provider value={{ 
        disconnect, spendPermission, spendPermissionSignature, signSpendPermission, sendCallWithSpendPermission,
        remainingSpend, spendPermissionRequestedAllowance, setSpendPermissionRequestedAllowance,
        fetchAddressBalance, createLinkedAccount, addressBalanceWei,
        provider, walletClient, publicClient, address, connect, subaccount, switchChain, currentChain, signerType, setSignerType: wrappedSetSignerType }}>
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