import { parseEther } from "viem";
import { baseSepolia } from "viem/chains";

export const SPEND_PERMISSION_REQUESTED_ALLOWANCE = 0.002;
export const SPEND_PERMISSION_REQUESTED_ALLOWANCE_WEI = parseEther(SPEND_PERMISSION_REQUESTED_ALLOWANCE.toString());
export const SPEND_PERMISSION_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad';

export const SPEND_PERMISSION_TYPES = {
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
};

export const SPEND_PERMISSION_DOMAIN = {
    name: 'Spend Permission Manager',
    version: "1",
    chainId: baseSepolia.id,
    verifyingContract: SPEND_PERMISSION_MANAGER_ADDRESS
  };