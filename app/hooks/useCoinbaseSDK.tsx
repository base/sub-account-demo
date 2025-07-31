import { createBaseAccountSDK, ProviderInterface } from "@base-org/account";
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
    const [sdk, setSdk] = useState<ReturnType<typeof createBaseAccountSDK> | null>(null);
    useEffect(() => {
        const _sdk = createBaseAccountSDK({
          appName: 'Coinbase Wallet demo',
          appChainIds: [chainId],
          subAccounts: {
            toOwnerAccount: getSignerFunc
          }
        });
        setSdk(_sdk);
    }, [getSignerFunc, chainId]);

    return {
        provider: sdk?.getProvider() || null,
    };
}