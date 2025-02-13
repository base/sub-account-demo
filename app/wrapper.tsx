'use client';
import { Providers } from "./providers";

export default function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            {children}
        </Providers>
    )
}