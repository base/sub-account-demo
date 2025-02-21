import { Address } from "viem";

interface DisperseFaucetProps {
    to: Address;
}

export default async function disperseFaucet({
    to,
}: DisperseFaucetProps) {
    const response = await fetch('/api/faucet', {
        method: 'POST',
        body: JSON.stringify({ to }),
    });

    if (!response.ok) {
        throw new Error('Failed to disperse faucet');
    }

    return response.json();
}