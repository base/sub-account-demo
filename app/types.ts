import { Address, Hex, LocalAccount, OneOf } from "viem";
import { type WebAuthnAccount } from 'viem/account-abstraction';

export interface Post {
    id: string;
    author: {
      name: string;
      display_name: string;
      username: string;
      pfp_url: string;
      power_badge: boolean;
      custody_address: `0x${string}`;
      verified_addresses: {
        eth_addresses: `0x${string}`[];
        sol_addresses: string[];
      }
    }
    embeds: {
      metadata: {
        content_type: string;
      },
      url: string;
    }[];
    text: string;
    timestamp: string;
    reactions: {
      likes_count: number;
      recasts_count: number;
    }
    replies: {
       count: number;
    }
  }

  export type SpendPermission = {
    account: Address;
    spender: Address;
    token: Address;
    allowance: string;
    period: number;
    start: number;
    end: number;
    salt: bigint;
    extraData: string;
  };
  

  export type SignerType = 'browser' | 'privy' | 'turnkey';

  export type Signer = {
    account: OneOf<WebAuthnAccount | LocalAccount> | null
  };


  export type SignInWithEthereumCapabilityResponse = {
    message: string;
    signature: Hex;
  };
  
  export type WalletAddAddressResponse = {
    root: Address;
    address: Address;
    owners: Address[];
    chainId: number;
    initCode: {
      factory: Address;
      factoryCalldata: Hex;
    };
  };

  type AddAddressCapabilityResponse = WalletAddAddressResponse;
  
  type SpendPermissionsCapabilityResponse = {
    signature: string
    permission: SpendPermission
 };
  
  export type GetAppAccountsCapabilityResponse = WalletAddAddressResponse[];
  
  type FetchPermissionsResultItem = {
    createdAt: number; // UTC timestamp for when the permission was granted
    permissionHash: string; // hex
    signature: string; // hex
    permission: SpendPermission
  };

  export type GetSpendPermissionsCapabilityResponse = {
    permissions: FetchPermissionsResultItem[]
  };
  
  export type WalletConnectResponseCapabilities = {
    signInWithEthereum?: SignInWithEthereumCapabilityResponse | any;
    addAddress?: AddAddressCapabilityResponse;
    spendPermissions?: SpendPermissionsCapabilityResponse | any;
    getAppAccounts?: GetAppAccountsCapabilityResponse;
    getSpendPermissions?: GetSpendPermissionsCapabilityResponse;
  };
  
  export type WalletConnectAccountResponse = {
    address: Address;
    capabilities?: WalletConnectResponseCapabilities;
  };
  
  export type WalletConnectResponse = {
    accounts: WalletConnectAccountResponse[];
  };