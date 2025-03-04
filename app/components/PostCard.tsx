import { Post } from "../types";
import { timeAgo } from '../utils/timeAgo';
import { toast } from 'react-hot-toast';
import { useCoinbaseProvider } from '../CoinbaseProvider';
import { useEthUsdPrice } from '../hooks/useEthUsdPrice';

const activeTipToasts = new Set<string>();

interface PostCardProps {
  post: Post;
  isTipping: boolean;
  setIsTipping: (isTipping: boolean) => void;
}

export default function PostCard({ post, isTipping, setIsTipping }: PostCardProps) {
  const { sendCallWithSpendPermission, currentChain } = useCoinbaseProvider();
  const { ethUsdPrice } = useEthUsdPrice();
  
  const handleQuickTip = async () => {
    if (isTipping) return;
    setIsTipping(true);
    
    const DEFAULT_TIP_USD = 0.1; // $0.10 tip
    
    const tipAmountEth = DEFAULT_TIP_USD / (ethUsdPrice || 2000); // fallback price if not loaded
    const tipAmountWei = BigInt(Math.floor(tipAmountEth * 1e18));
    
    const toastId = toast(
      (t) => (
        <div className="relative">
          <div>Sending 10¢ tip to @{post.author.username}</div>
          <button
            onClick={() => {
              activeTipToasts.delete(t.id);
              toast.dismiss(t.id);
              toast.error('Tip cancelled');
            }}
            className="mt-2 mb-3 bg-red-500 text-white px-2 py-1 rounded text-sm"
          >
            Cancel
          </button>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{
                animation: 'shrinkProgress 4s linear forwards',
                transformOrigin: 'left',
              }}
            />
          </div>
          <style jsx>{`
            @keyframes shrinkProgress {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>
        </div>
      ),
      { duration: 4000 }
    );

    activeTipToasts.add(toastId);

    setTimeout(async () => {
      if (!activeTipToasts.has(toastId)) {
        setIsTipping(false);
        return;
      }
      activeTipToasts.delete(toastId);
      
      try {
        const txHash = await sendCallWithSpendPermission([
          {
            to: (post.author.verified_addresses.eth_addresses[0] || post.author.custody_address) as `0x${string}`,
            data: '0x',
            value: tipAmountWei.toString(),
          }
        ], tipAmountWei);

        const getExplorerUrl = (txHash: string) => {
          if (!currentChain) return '#';
          return `${currentChain.blockExplorers?.default.url}/tx/${txHash}`;
        };

        toast.success(
          <div>
            Successfully tipped @{post.author.username}!
            <a 
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer" 
              className="block text-blue-500 hover:underline"
            >
              View transaction
            </a>
          </div>,
          { duration: 5000 }
        );
        console.log('Tip sent:', getExplorerUrl(txHash));
      } catch (error) {
        toast.error('Failed to send tip');
        console.error('Tip error:', error);
      } finally {
        setIsTipping(false);
      }
    }, 4000);
  };

  return (
    <div className="border border-gray-200 p-4 rounded-lg mb-4">
      <div className="flex items-start space-x-3">
        {/* Author Profile Picture */}
        <img
          src={post.author.pfp_url}
          alt={post.author.name}
          className="w-12 h-12 rounded-full"
        />
        
        <div className="flex-1">
          {/* Author Info & Timestamp */}
          <div className="flex items-center space-x-2">
            <span className="font-bold">{post.author.name}</span>
            <span className="text-gray-500">{`@${post.author.username}`}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{timeAgo(post.timestamp)}</span>
          </div>
          
          {/* Post Content */}
          <div className="mt-2">
            {post.text && (
              <p className="text-gray-800 mb-2">{post.text}</p>
            )}
            {post.embeds.map((embed) => {
                if (embed.metadata?.content_type?.includes('image')) {
                    return (
                        <img
                            key={embed.url}
                            src={embed.url}
                            alt="Post content"
                            className="rounded-lg w-full"
                        />
                    );
                } else if (embed.metadata?.content_type?.includes('video')) {
                    return (
                        <video
                            key={embed.url}
                            src={embed.url}
                            className="rounded-lg w-full"
                        />
                    );
                } else if (embed.metadata?.content_type?.includes('html')) {
                    return null;
                } else {
                    return null;
                }
            })}
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center space-x-6 mt-4 text-gray-500">
            <button className="flex items-center space-x-2 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.reactions.likes_count}</span>
            </button>
            
            <button className="flex items-center space-x-2 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.replies.count}</span>
            </button>
            
            <button className="flex items-center space-x-2 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{post.reactions.recasts_count}</span>
            </button>
            
            <button 
              className={`flex items-center space-x-2 hover:text-yellow-500 ${isTipping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={handleQuickTip}
              disabled={isTipping}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{isTipping ? 'Tipping...' : 'Tip (10¢)'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}