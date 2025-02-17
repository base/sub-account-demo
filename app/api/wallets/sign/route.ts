import { NextResponse } from "next/server";

import {PrivyClient} from '@privy-io/server-auth';
import { Turnkey } from "@turnkey/sdk-server";
import { serializeSignature } from "viem";

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
    const { id, address, message, signerType } = body;

    if (!message) {
        return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (signerType === 'privy') {
        const data = await privy.walletApi.ethereum.signMessage({
            walletId: id,
            message,
          });
          
          const {signature, encoding} = data;
    
        return NextResponse.json({ signature, encoding });
    } else if (signerType === 'turnkey') {
        const response = await turnkey.apiClient()
            .signRawPayload({
                signWith: address,
                payload: message,
                encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
                hashFunction: 'HASH_FUNCTION_NO_OP',
            });
        // Convert r, s, v into a signature string
        return NextResponse.json({ 
            signature: serializeSignature({
                r: `0x${response.r}`,
                s: `0x${response.s}`,
                v: response.v === '00' ? BigInt(27) : BigInt(28),
            }) 
        });
    }
    return NextResponse.json({ error: 'Invalid signer type: ' + signerType }, { status: 400 });
}