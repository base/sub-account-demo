'use client'
import { baseSepolia } from "viem/chains";
import { useCoinbaseProvider } from "./CoinbaseProvider";
import PostCard from "./components/PostCard";
import Hero from "./components/Hero";
import { Post } from "./types";
import { useEffect, useState } from "react";
import WalletFooter from "./components/WalletFooter";
import { Hex, parseUnits } from "viem";

export default function Home() {
  const { address, subaccount, connect, currentChain, switchChain, spendPermissionSignature, signSpendPermission } = useCoinbaseProvider();
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!spendPermissionSignature && address && subaccount) {
      signSpendPermission({
        allowance: '0x71afd498d0000',// 0.002 ETH per day (~$5)
        period: 86400, // seconds in a day
        start: Math.floor(Date.now() / 1000), // unix timestamp
        end: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60), // one month from now
        salt: '0x1',
        extraData: "0x" as Hex,
      });
    }
  }, [spendPermissionSignature, signSpendPermission, address, subaccount]);
  
  if (!address && !subaccount) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <Hero />
        <button 
          onClick={() => connect()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign in with Coinbase
        </button>
      </div>
    );
  }

  if (currentChain?.id !== baseSepolia.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <Hero />
        <button 
          onClick={() => switchChain()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Switch to Base Sepolia
        </button>
      </div>
    );
  }

  if (!spendPermissionSignature) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <Hero />
        <div>
          Granting permission for Coinbase Smart wallet demo to spend 0.05 ETH per day...
        </div>
      </div>
    );
  }

  console.log('posts', posts)
  return (
    <div>
      <Hero />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <WalletFooter />
    </div>
  );
}
