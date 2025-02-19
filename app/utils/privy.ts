import { Hex } from "viem";
import { toAccount } from "viem/accounts";

export async function getPrivyAccount() {
    // TODO: get walletId and address from local storage if there.

    const response = await fetch('/api/wallets', {
        method: 'POST',
        body: JSON.stringify({
            signerType: 'privy',
        }),
    });
    const createWalletResponseData = await response.json();

    const account = toAccount({
        address: createWalletResponseData.address as Hex,
        signMessage: async ({ message}): Promise<Hex> => {
            const resp: Response = await fetch('/api/wallets/sign', {
                method: 'POST',
                body: JSON.stringify({
                    id: createWalletResponseData.id,
                    message: message,
                    signerType: 'privy',
                }),
            });
            console.log('signMessage response', response);
            const data = await resp.json();
            return data.signature as Hex;
        },
        signTransaction: async ({ transaction }): Promise<Hex> => {
            throw new Error('Not implemented');
        },
        signTypedData: async ({ data }): Promise<Hex> => {
            throw new Error('Not implemented');
        }
    });
    return account;
}