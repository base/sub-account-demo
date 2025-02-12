import { Post } from "../types";

export default function PostCard({ post }: { post: Post }) {
    return (
      <div className="border border-gray-200 p-4 rounded-lg mb-4">
        <div className="flex items-start space-x-3">
          {/* Author Profile Picture */}
          <img
            src={post.author.profilePicture}
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
              {post.content.text && (
                <p className="text-gray-800 mb-2">{post.content.text}</p>
              )}
              {post.content.image && (
                <img
                  src={post.content.image}
                  alt="Post content"
                  className="rounded-lg w-full"
                />
              )}
            </div>
            
            {/* Engagement Stats */}
            <div className="flex items-center space-x-6 mt-4 text-gray-500">
              <button className="flex items-center space-x-2 hover:text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{post.stats.likes}</span>
              </button>
              
              <button className="flex items-center space-x-2 hover:text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.stats.comments}</span>
              </button>
              
              <button className="flex items-center space-x-2 hover:text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{post.stats.reposts}</span>
              </button>
              
              <button className="flex items-center space-x-2 hover:text-yellow-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tip</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }