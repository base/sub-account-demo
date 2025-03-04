import { useCallback, useEffect, useState } from "react";
import { SPEND_PERMISSION_DOMAIN, SPEND_PERMISSION_MANAGER_ADDRESS, SPEND_PERMISSION_REQUESTED_ALLOWANCE, SPEND_PERMISSION_TOKEN, SPEND_PERMISSION_TYPES } from "../utils/constants";
import { fromHex, PublicClient } from "viem";
import { SpendPermission } from "../types";
import { ProviderInterface } from "@coinbase/wallet-sdk";
import { spendPermissionManagerAbi } from "../abi";
type PeriodSpend = {
    start: number;
    end: number;
    spend: bigint;
};

export default function useSpendPermission({
    provider,
    address,
    subaccount,
    publicClient,
}: {
    provider: ProviderInterface | null;
    address: `0x${string}` | null;
    subaccount: `0x${string}` | null;
    publicClient: PublicClient | null;
}) {
    const [spendPermissionRequestedAllowance, setSpendPermissionRequestedAllowance] = useState<string>(`${SPEND_PERMISSION_REQUESTED_ALLOWANCE}`);
    const [spendPermission, setSpendPermission] = useState<SpendPermission | null>(null);
    const [spendPermissionSignature, setSpendPermissionSignature] = useState<string | null>(null);
    const [,setPeriodSpend] = useState<PeriodSpend | null>(null);
    const [remainingSpend, setRemainingSpend] = useState<bigint | null>(fromHex('0x71afd498d0000', 'bigint'));

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
        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [
            address,
            {
              types: SPEND_PERMISSION_TYPES,
              primaryType: "SpendPermission",
              message: spendPermission,
              domain: SPEND_PERMISSION_DOMAIN
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
      }, [spendPermission, publicClient, setPeriodSpend]);
  
      useEffect(() => {
        if (spendPermission) {
          refreshPeriodSpend();
        }
      }, [spendPermission, refreshPeriodSpend]);

    return {
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
    }
}