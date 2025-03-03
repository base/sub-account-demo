import { NextResponse } from "next/server";

import { Turnkey } from "@turnkey/sdk-server";
import { serializeSignature } from "viem";

export async function POST(request: Request) {
    const body = await request.json();
    const { address, message, signerType } = body;

    if (!message || !address) {
        return NextResponse.json({ error: 'message and address are required' }, { status: 400 });
    }
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