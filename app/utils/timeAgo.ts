export function timeAgo(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  // Handle future dates
  if (seconds < 0) {
    return 'just now';
  }

  // Find the appropriate interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    
    if (interval >= 1) {
      return interval === 1 
        ? `1 ${unit} ago` 
        : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
} 