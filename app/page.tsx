'use client'
import { baseSepolia } from "viem/chains";
import { useCoinbaseProvider } from "./CoinbaseProvider";
import PostCard from "./components/PostCard";
import Hero from "./components/Hero";
import { Post } from "./types";
import { useEffect, useState } from "react";
import WalletFooter from "./components/WalletFooter";

export default function Home() {
  const { address, subaccount, connect, currentChain, switchChain } = useCoinbaseProvider();
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  
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
