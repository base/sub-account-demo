import { Hex } from "viem";
import { toAccount } from "viem/accounts";

export async function getTurnkeyAccount() {
    let id, address;
    
    const turnkeySignerData = localStorage.getItem('cbsw-demo-turnkey-signer');
    if (turnkeySignerData) {
        ({ id, address } = JSON.parse(turnkeySignerData));
    } else {
        const response = await fetch('/api/wallets', {
            method: 'POST',
            body: JSON.stringify({
                signerType: 'turnkey',
            }),
        });
        const createWalletResponseData = await response.json();
        ({ id, address } = createWalletResponseData);
        localStorage.setItem('cbsw-demo-turnkey-signer', JSON.stringify({ id, address }));
    }

    const account = toAccount({
        address: address as Hex,
        type: 'local',
        sign: async ({ hash }): Promise<Hex> => {
            const resp: Response = await fetch('/api/wallets/sign', {
                method: 'POST',
                body: JSON.stringify({
                    address: address as Hex,
                    message: hash,
                    signerType: 'turnkey',
                }),
            });
            const data = await resp.json();
            return data.signature as Hex;
        },
        signMessage: async ({ message}): Promise<Hex> => {
            const resp: Response = await fetch('/api/wallets/sign', {
                method: 'POST',
                body: JSON.stringify({
                    address: address as Hex,
                    message: message,
                    signerType: 'turnkey',
                }),
            });
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
    return {
        account,
    };
}