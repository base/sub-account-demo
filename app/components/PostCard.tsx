import { Post } from "../types";
import { useState } from "react";

export default function PostCard({ post }: { post: Post }) {
    console.log('post', post)
  const [showTipModal, setShowTipModal] = useState(false);
  const [customTipAmount, setCustomTipAmount] = useState("");
  
  // Example balance - you'll need to replace this with actual user balance from your app state
  const currentBalance = 100; 

  const predefinedTips = [1, 5, 20, 50];

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
            <span className="text-gray-500">{post.author.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{post.timestamp}</span>
          </div>
          
          {/* Post Content */}
          <div className="mt-2">
            {post.text && (
              <p className="text-gray-800 mb-2">{post.text}</p>
            )}
            {post.embeds.map((embed) => (
              <img
                key={embed.url}
                src={embed.url}
                alt="Post content"
                className="rounded-lg w-full"
              />
            ))}
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center space-x-6 mt-4 text-gray-500">
            <button className="flex items-center space-x-2 hover:text-blue-500 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.reactions.likes_count}</span>
            </button>
            
            <button className="flex items-center space-x-2 hover:text-blue-500 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.replies.replies_count}</span>
            </button>
            
            <button className="flex items-center space-x-2 hover:text-green-500 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{post.reactions.recast_count}</span>
            </button>
            
            <button 
              className="flex items-center space-x-2 hover:text-yellow-500 cursor-pointer"
              onClick={() => setShowTipModal(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tip</span>
            </button>
          </div>
        </div>
      </div>

      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Send a tip to {post.author.name}</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Your balance: ${currentBalance}</p>
              <div className="grid grid-cols-2 gap-2">
                {predefinedTips.map((amount) => (
                  <button
                    key={amount}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    onClick={() => setCustomTipAmount(amount.toString())}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">Custom amount</label>
                <input
                  type="number"
                  value={customTipAmount}
                  onChange={(e) => setCustomTipAmount(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                onClick={() => {
                  // Add your tip handling logic here
                  setShowTipModal(false);
                }}
              >
                Send Tip
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                onClick={() => setShowTipModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}