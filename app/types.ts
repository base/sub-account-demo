import { Address } from "viem";

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
    salt: BigInt;
    extraData: string;
  };
  

  export type SignerType = 'browser' | 'privy' | 'turnkey';