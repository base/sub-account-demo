import { NextResponse } from "next/server";

import {PrivyClient} from '@privy-io/server-auth';
import { Turnkey } from "@turnkey/sdk-server";

const privy = new PrivyClient(process.env.NEXT_PRIVY_APP_ID as string, process.env.NEXT_PRIVY_APP_SECRET as string);
const turnkey = new Turnkey({
    apiPublicKey: process.env.NEXT_TURNKEY_API_PUBLIC_KEY as string,
    apiPrivateKey: process.env.NEXT_TURNKEY_API_SECRET_KEY as string,
    defaultOrganizationId: process.env.NEXT_TURNKEY_ORG_ID as string,
    apiBaseUrl: 'https://api.turnkey.com',
});

export async function POST(request: Request) {
    const body = await request.json();
    // todo validate SIWE challenge.
    const { signerType } = body;

    if (signerType === 'turnkey') {
        const response = await turnkey.apiClient()
        .createWallet({
            walletName: `bw-social-demo-signer-${Date.now()}`,
            accounts: [{
                curve: "CURVE_SECP256K1",
                pathFormat: "PATH_FORMAT_BIP32",
                path: "m/44'/60'/0'/0/0",
                addressFormat: "ADDRESS_FORMAT_ETHEREUM",
            }]
        })
        const newWalletId = response.walletId;
        const address = response.addresses[0];
        console.log('Created turnkey signer', newWalletId, address);
        return NextResponse.json({ id: newWalletId, address });
    } else if (signerType === 'privy') {
        const {id, address} = await privy.walletApi.create({chainType: 'ethereum'});
        console.log('Created privy signer', id, address);
        return NextResponse.json({ id, address });
    } else {
        return NextResponse.json({ error: 'Invalid signer type: ' + signerType }, { status: 400 });
    }
}