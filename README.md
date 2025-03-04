# Coinbase Smart Wallet Sub Accounts Demo

This is a demo of using Coinbase Smart Wallets with Sub Accounts. View the live version here: [https://sub-account-demo.com](https://sub-account-demo.com)

### The flow of the demo is as follows:

1. Log in or Sign up with your Coinbase Smart Wallet, and connect it to the app.
2. On connection, the app will request a few permissions to the wallet
    - To create a Sub Account that is linked to the Coinbase Smart Wallet, that can be used for the app
    - Permission to spend a certain amount of ETH per day, which creates a [Spend Permission](https://docs.base.org/identity/smart-wallet/features/spend-permissions) on the Coinbase Smart Wallet that is usable by the newly created Sub Account
3. Once logged in, the app will display a list of trending farcaster posts, each post has a tip button.
4. When the tip button is clicked, a few things happen:
    - The app creates a batch transaction that includes 1) approving the Spend Permission that was created during onboarding 2) pulling the ETH from the Coinbase Smart Wallet to the Sub Account 3) sending the ETH to the farcaster user as a tip

    
## Setup

1. (optional) This demo uses Neynar to fetch live farcaster posts. To run it with live data you'll need a Neynar API key which you can get [here](https://neynar.com/). After signing up, you'll need to create an API key and set the Neynar environment variable in the `.env` file.
2. (optional) This demo also supports using different signer implementations to power the Sub Accounts. Browser keys are the default, but you can also use [Turnkey](https://www.turnkey.com/) server wallets. To use Turnkey, you'll need to create an account and set the relevant Turnkey environment variables in the `.env` file.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
