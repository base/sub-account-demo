import { isAddress } from "viem";

export async function POST(req: Request) {
    const { to } = await req.json();
    if (!to || !isAddress(to)) {
        return new Response('Invalid `to` address provided', { status: 400 });
    }

    if (!process.env.NEXT_FAUCET_SERVICE_URL) {
        return new Response('Faucet service URL is not set', { status: 500 });
    }

    const response = await fetch(`https://${process.env.NEXT_FAUCET_SERVICE_URL}${to}`, {
        method: 'POST',
        body: JSON.stringify({ to }),
    });

    if (!response.ok) {
        console.error('Failed to disperse faucet', await response.json());
        return new Response('Failed to disperse faucet', { status: 500 });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ hash: data }), { status: 200 });
}