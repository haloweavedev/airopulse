import { rateLimitedFetch } from './rate-limiter';

export interface RedditSearchResult {
  reddit_id: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
}

export async function searchReddit(query: string, limit = 25): Promise<RedditSearchResult[]> {
  const url = `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}`;
  const res = await rateLimitedFetch(url);
  const data = await res.json();

  const posts = (data?.data?.children || [])
    .map((c: { data: Record<string, unknown> }) => c.data)
    .filter((p: Record<string, unknown>) => (p.num_comments as number) > 3)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.num_comments as number) - (a.num_comments as number));

  return posts.map((p: Record<string, unknown>) => ({
    reddit_id: p.id as string,
    subreddit: p.subreddit as string,
    title: p.title as string,
    selftext: (p.selftext as string) || '',
    url: p.url as string,
    permalink: p.permalink as string,
    score: p.score as number,
    num_comments: p.num_comments as number,
  }));
}
