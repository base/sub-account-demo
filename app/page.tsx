'use client'
import { baseSepolia } from "viem/chains";
import { useCoinbaseProvider } from "./CoinbaseProvider";
import PostCard from "./components/PostCard";
import Hero from "./components/Hero";
import { Post } from "./types";

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'John Doe',
      username: '@johndoe',
      profilePicture: 'https://placecats.com/100/100',
    },
    timestamp: '2h ago',
    content: {
      text: 'Just launched my new project! 🚀 Really excited to share it with everyone.',
      image: 'https://picsum.photos/seed/1/600/400',
    },
    stats: {
      likes: 142,
      comments: 28,
      reposts: 12,
    },
  },
  {
    id: '2',
    author: {
      name: 'Jane Smith',
      username: '@janesmith',
      profilePicture: 'https://placecats.com/100/100',
    },
    timestamp: '4h ago',
    content: {
      text: 'Beautiful day for coding! ☀️ #coding #developer',
    },
    stats: {
      likes: 89,
      comments: 15,
      reposts: 5,
    },
  },
];

export default function Home() {
  const { address, connect, currentChain, switchChain } = useCoinbaseProvider();

  if (!address) {
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

  console.log('currentChain', currentChain)
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

  return (
    <div>
      <Hero />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
