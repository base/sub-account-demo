import { NextResponse } from "next/server";

import { Turnkey } from "@turnkey/sdk-server";


export async function POST(request: Request) {
    const body = await request.json();
    const { signerType } = body;

    if (signerType === 'turnkey') {
        if (!process.env.NEXT_TURNKEY_API_PUBLIC_KEY || !process.env.NEXT_TURNKEY_API_SECRET_KEY || !process.env.NEXT_TURNKEY_ORG_ID) {
            return NextResponse.json({ error: 'Turnkey API keys are not set' }, { status: 500 });
        }

        const turnkey = new Turnkey({
            apiPublicKey: process.env.NEXT_TURNKEY_API_PUBLIC_KEY as string,
            apiPrivateKey: process.env.NEXT_TURNKEY_API_SECRET_KEY as string,
            defaultOrganizationId: process.env.NEXT_TURNKEY_ORG_ID as string,
            apiBaseUrl: 'https://api.turnkey.com',
        });

        const response = await turnkey.apiClient()
        .createWallet({
            walletName: `bw-social-demo-signer-${Date.now()}`,
            accounts: [{
                curve: "CURVE_SECP256K1",
                pathFormat: "PATH_FORMAT_BIP32",
                path: "m/44'/60'/0'/0/0",
                addressFormat: "ADDRESS_FORMAT_ETHEREUM",
            }]
        });
        const newWalletId = response.walletId;
        const address = response.addresses[0];
        return NextResponse.json({ id: newWalletId, address });
    } else {
        return NextResponse.json({ error: 'Invalid signer type: ' + signerType }, { status: 400 });
    }
}