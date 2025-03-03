'use client';
 
import type { ReactNode } from 'react';
import { CoinbaseProvider } from './CoinbaseProvider';
 
export function Providers(props: { children: ReactNode }) {
  return (
      <CoinbaseProvider>
          {props.children}
      </CoinbaseProvider>
  );
}