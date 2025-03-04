'use client';
import { getCryptoKeyAccount, ProviderInterface, removeCryptoKey } from "@coinbase/wallet-sdk";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Address, Chain, createPublicClient, createWalletClient, custom, decodeAbiParameters, encodeFunctionData, Hex, http, parseEther, toHex, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { cbswAbi, spendPermissionManagerAbi } from "./abi";
import { Signer, SignerType, SpendPermission, WalletConnectResponse } from "./types";
import { getTurnkeyAccount } from "./utils/turnkey";
import { SPEND_PERMISSION_MANAGER_ADDRESS, SPEND_PERMISSION_TOKEN } from "./utils/constants";
import useCoinbaseSDK from "./hooks/useCoinbaseSDK";
import useSpendPermission from "./hooks/useSpendPermission";


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
  spendPermissionOps: {
    token: `0x${string}`,
    allowance: string;
    period: number;
    salt: string;
    extraData: string;
  },
  signerType: SignerType,
  activeSigner: Hex
) {
  
  if (!activeSigner) {
    throw new Error('signer not found');
  }
  const response = (await provider.request({
    method: 'wallet_connect',
    params: [{
      version: '1',
      capabilities: {
        addSubAccount: {
          account: {
            type: 'create',
            keys: [{
              type: signerType === 'browser' ? 'webauthn-p256' : 'address',
              key: activeSigner,
            }]   
          }
        },
        spendPermissions: spendPermissionOps,
      },
    }],
  })) as WalletConnectResponse;
  return {
    address: response?.accounts[0].address,
    subAccount: response?.accounts[0].capabilities?.addSubAccount?.address,
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

const getSignerFunc = (signerType: SignerType): (() => Promise<Signer>) => {
  if (signerType === 'browser') {
    return getCryptoKeyAccount;
  } else if (signerType === 'turnkey') {
    return getTurnkeyAccount;
  }
  throw new Error('Invalid signer type');
}

const clearCache = () => {
  localStorage.clear();
  removeCryptoKey();
}

export function CoinbaseProvider({ children }: { children: React.ReactNode }) {
    const [subaccount, setSubaccount] = useState<Address | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [addressBalanceWei, setAddressBalanceWei] = useState<bigint>(BigInt(0));
    const [currentChain] = useState<Chain | null>(baseSepolia);
    const [signerType, setSignerType] = useState<SignerType>('browser');
    const [activeSigner, setActiveSigner] = useState<Hex | null>(null);
    const { provider } = useCoinbaseSDK({
      chainId: baseSepolia.id,
      getSignerFunc: getSignerFunc(signerType)
    });

    const publicClient = useMemo(() => createPublicClient({
      chain: baseSepolia,
      transport: http(),
    }), []);

    const {
      spendPermissionRequestedAllowance,
      setSpendPermissionRequestedAllowance,
      spendPermission,
      setSpendPermission,
      spendPermissionSignature,
      setSpendPermissionSignature,
      refreshPeriodSpend,
      remainingSpend,
      signSpendPermission,
      setRemainingSpend,
      setPeriodSpend,
    } = useSpendPermission({ provider, address, subaccount, publicClient });

    useEffect(() => {
        const cachedSignerType = localStorage.getItem('cbsw-demo-cachedSignerType') as SignerType;
        if (cachedSignerType) {
            setSignerType(cachedSignerType);
        }
    }, []);

    useEffect(() => {
      const getActiveSigner = async () => {
        if (!activeSigner) {
          const signerAccount = await getSignerFunc(signerType)();
          if (signerAccount) {
            let signer;
            if (signerType === 'browser') {
              signer = signerAccount.account?.publicKey;
            } else if (signerType === 'turnkey') {
              signer = signerAccount.account?.address;
            }
            setActiveSigner(signer as Hex);
          }
        }
      }
      getActiveSigner();
    }, [activeSigner, signerType]);

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
      setActiveSigner(null);
  }, [provider]);

  const createLinkedAccount = useCallback(async () => {
      if (!provider || !activeSigner) {
        throw new Error('provider and activeSigner are required');
      }

      const createLinkedAccountResp = await handleCreateLinkedAccount(provider, {
        token: SPEND_PERMISSION_TOKEN,
        allowance: toHex(parseEther(spendPermissionRequestedAllowance)),
        period: 86400,
        salt: '0x1',
        extraData: '0x' as Hex
      }, signerType, activeSigner);
      setAddress(createLinkedAccountResp.address as Address);
      setSubaccount(createLinkedAccountResp.subAccount as Address);

      setSpendPermissionSignature(createLinkedAccountResp.spendPermission.signature as string);
      setSpendPermission(createLinkedAccountResp.spendPermission.permission as SpendPermission);
  }, [provider, spendPermissionRequestedAllowance, activeSigner, signerType, setSpendPermissionSignature, setSpendPermission]);

    const sendCallWithSpendPermission = useCallback(async (calls: any[], txValueWei: bigint): Promise<string> => {
      if (!provider || !spendPermissionSignature || !activeSigner) {
        throw new Error('provider and spendPermissionSignature and activeSigner are required');
      }

      const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL;
      if (!paymasterUrl) {
        throw new Error('paymasterUrl is required, please specify NEXT_PUBLIC_PAYMASTER_SERVICE_URL in your .env');
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

      try {
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
                      url: paymasterUrl
                  }
              }
            }   
        ]});
        await refreshPeriodSpend();
        return response as string;
      } catch (error) {
        if (error?.code === -32603 && error?.message?.includes('account owner not found')) {
          console.debug('signer not found in list of current owners, adding as owner');
          let args;
          if (signerType === 'browser') {
            args = decodeAbiParameters(
              [{ type: 'bytes32' }, { type: 'bytes32' }],
              activeSigner
            );
          } else {
            args = [activeSigner];
          }
          const response = await provider.request({
              method: 'wallet_sendCalls',
              params: [
                {
                  version: 1,
                  from: address,
                  chainId: toHex(baseSepolia.id),
                  calls: [
                    {
                      to: subaccount,
                      data: encodeFunctionData({
                        args,
                        functionName: signerType === 'browser' ? 'addOwnerPublicKey' : 'addOwnerAddress',
                        abi: cbswAbi
                      }),
                      value: toHex(0),
                    },
                  ]
                }
              ],
            });
            return response as string;
        }
        throw error;
      }      
    }, [provider, spendPermissionSignature, spendPermission, currentChain, refreshPeriodSpend, subaccount, signerType, address, activeSigner]);

    const wrappedSetSignerType = useCallback((newSignerType: SignerType) => {
      if (signerType !== newSignerType) {
        clearCache();
        setActiveSigner(null);
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
        disconnect,
        spendPermission, spendPermissionSignature, signSpendPermission, sendCallWithSpendPermission,
        remainingSpend, spendPermissionRequestedAllowance, setSpendPermissionRequestedAllowance,
        fetchAddressBalance, createLinkedAccount, addressBalanceWei,
        provider, walletClient, publicClient, address, connect,
        subaccount, switchChain, currentChain, signerType, setSignerType: wrappedSetSignerType }}>
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