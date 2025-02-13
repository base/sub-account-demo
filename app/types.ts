export interface Post {
    id: string;
    author: {
      name: string;
      display_name: string;
      username: string;
      pfp_url: string;
      power_badge: boolean;
    };
    embeds: {
      metadata: {
        content_type: string;
      },
      url: string;
    }[];
    text: string;
    timestamp: string;
    verified_addresses: {
      eth_addresses: string[];
      sol_addresses: string[];
    }
    reactions: {
      likes_count: number;
      recasts_count: number;
    }
    replies: {
       count: number;
    }
  }