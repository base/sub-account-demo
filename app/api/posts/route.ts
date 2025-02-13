import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { CastWithInteractions } from "@neynar/nodejs-sdk/build/api";
import { NextResponse } from "next/server";

const neynarClient = new NeynarAPIClient(new Configuration({
    apiKey: process.env.NEXT_NEYNAR_API_KEY as string
}))

const castToPost = (cast: CastWithInteractions) => {
    return {
        id: cast.hash,
        text: cast.text,
        embeds: cast.embeds,
        timestamp: cast.timestamp,
        author: cast.author,
        reactions: cast.reactions,
        replies: cast.replies,
    }
}

export async function GET() {
    try {
      // Get tips logic here
      const response = await neynarClient.fetchFeed({
        feedType: 'filter',
        filterType: 'global_trending',
        limit: 15
      });
      return NextResponse.json({ posts: response.casts.map(castToPost), next: response.next });
    } catch (error) {
        console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }