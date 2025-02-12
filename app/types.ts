export interface Post {
    id: string;
    author: {
      name: string;
      username: string;
      profilePicture: string;
    };
    timestamp: string;
    content: {
      text?: string;
      image?: string;
    };
    stats: {
      likes: number;
      comments: number;
      reposts: number;
    };
  }