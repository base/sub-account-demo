import { createCoinbaseWalletSDK, ProviderInterface } from "@coinbase/wallet-sdk";
import { useEffect, useState } from "react";
import { Signer } from "../types";

export default function useCoinbaseSDK({
    chainId, getSignerFunc,
}: {
    chainId: number;
    getSignerFunc: () => Promise<Signer>;
}): {
    provider: ProviderInterface | null;
} {
    const [sdk, setSdk] = useState<ReturnType<typeof createCoinbaseWalletSDK> | null>(null);
    useEffect(() => {
        const _sdk = createCoinbaseWalletSDK({
          appName: 'Coinbase Wallet demo',
          appChainIds: [chainId],
          preference: {
            options: "smartWalletOnly",
            keysUrl: 'https://keys-dev.coinbase.com/connect',
          },
          subaccount: {
            getSigner: getSignerFunc
          }
        });
        setSdk(_sdk);
    }, [getSignerFunc, chainId]);

    return {
        provider: sdk?.getProvider() || null,
    };
}