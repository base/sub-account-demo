'use client'
import { baseSepolia } from "viem/chains";
import { useCoinbaseProvider } from "./CoinbaseProvider";
import PostCard from "./components/PostCard";
import Hero from "./components/Hero";
import { Post } from "./types";
import { useEffect, useMemo, useState } from "react";
import WalletFooter from "./components/WalletFooter";
import { Hex, parseEther, toHex } from "viem";
import toast, { Toaster } from 'react-hot-toast';
import SettingsPanel from "./components/SettingsPanel";
import { useMediaQuery } from 'react-responsive';
import disperseFaucet from "./utils/faucet";

export default function Home() {
  const { address, subaccount, fetchAddressBalance, publicClient, createLinkedAccount, connect, addressBalanceWei, currentChain, switchChain, spendPermissionSignature, signSpendPermission, spendPermissionRequestedAllowance } = useCoinbaseProvider();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isTipping, setIsTipping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  

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
        allowance: toHex(parseEther(spendPermissionRequestedAllowance)),
        period: 86400, // seconds in a day
        start: Math.floor(Date.now() / 1000),
        end: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60), // one month from now
        salt: '0x1',
        extraData: "0x" as Hex,
      });
    }
  }, [spendPermissionSignature, signSpendPermission, address, subaccount, spendPermissionRequestedAllowance]);


  const isAddressFunded = useMemo(() => {
    return addressBalanceWei >= parseEther(spendPermissionRequestedAllowance);
  }, [addressBalanceWei, spendPermissionRequestedAllowance]);

  useEffect(() => {
    if (address && !subaccount && isAddressFunded) {
      createLinkedAccount().catch((error) => {
        console.error('error creating linked account', error);
      });
    }

  }, [address, subaccount, isAddressFunded, createLinkedAccount])
  
  const renderContent = () => {
    if (Number(spendPermissionRequestedAllowance) === 0 || spendPermissionRequestedAllowance === '') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <Hero />
          <div>
            Please set a valid daily spend amount in the settings panel.
          </div>
        </div>
      );
    }

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
    } else if (!subaccount && !isAddressFunded) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <Toaster position="top-right" />
          <Hero />
          <div className="text-lg text-gray-700 mb-4 text-center px-6">
            It doesn&apos;t seem like you have any Base Sepolia ETH 🤔... <br/> Let&apos;s get you funded!
          </div>
          <button 
            onClick={async () => {
              setIsFaucetLoading(true);
              try {
                const { hash } = await disperseFaucet({ to: address });
                await publicClient.waitForTransactionReceipt({ hash });
                await fetchAddressBalance();
              } catch (error) {
                console.error('error dispersing faucet', error);
                toast.error(
                  <div className="max-w-[280px] break-words">
                    <p>Error requesting funds. Please try again later. If issues continue to persist, please use the </p>
                    <a 
                      href="https://portal.cdp.coinbase.com/products/faucet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Coinbase CDP Faucet
                    </a>
                    <p className="mt-2">Your wallet address:</p>
                    <code className="bg-gray-100 px-2 py-1 rounded block overflow-x-auto">{address}</code>
                  </div>
                , {
                  duration: 20000,
                });
              } finally {
                setIsFaucetLoading(false);
              }
            }}
            disabled={isFaucetLoading}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-lg transition-colors ${
              isFaucetLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
            }`}
          >
            {isFaucetLoading ? 'Requesting...' : 'Request funds'}
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
          <div className="text-lg text-gray-700 mb-4 text-center px-6">
          {`Granting permission for Coinbase Smart wallet demo to spend ${spendPermissionRequestedAllowance} ETH per day...`}
          </div>
          <button 
            onClick={() => signSpendPermission({
              allowance: '0x71afd498d0000',// 0.002 ETH per day (~$5)
              period: 86400, // seconds in a day
              start: Math.floor(Date.now() / 1000), // unix timestamp
              end: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60), // one month from now
              salt: '0x1',
              extraData: "0x" as Hex,
            })}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Grant permission
          </button>
        </div>
      );
    }

    return (
      <div>
        <Toaster position="top-right" />
        <Hero />
        <div className="max-w-2xl mx-auto py-8 px-4">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              isTipping={isTipping}
              setIsTipping={setIsTipping}
            />
          ))}
        </div>
        <WalletFooter />
      </div>
    );
  };

  return (
    <div className="flex">
      {(!isMobile || isSettingsOpen) && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 bg-white' : 'sticky top-0 h-screen'}`}>
          <SettingsPanel 
            isLoggedIn={!!(address || subaccount)}
            isMobile={isMobile}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}
      
      <div className="flex-1">
        {isMobile && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="fixed top-4 right-4 z-40 p-2 bg-white rounded-full shadow-lg"
          >
            ⚙️
          </button>
        )}
        {renderContent()}
      </div>
    </div>
  );
}
