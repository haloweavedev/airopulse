import { getTavily } from '../tavily';

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

/**
 * Search for Reddit threads using Tavily (reddit.com is 403 from Vercel IPs).
 * Tavily provides the thread content directly — no need to fetch from Reddit.
 */
export async function searchReddit(query: string, limit = 10): Promise<RedditSearchResult[]> {
  const tvly = getTavily();

  const response = await tvly.search(query, {
    maxResults: limit,
    searchDepth: 'advanced',
    includeDomains: ['reddit.com'],
  });

  const results: RedditSearchResult[] = [];

  for (const r of response.results) {
    const match = r.url.match(/reddit\.com(\/r\/(\w+)\/comments\/(\w+))/);
    if (!match) continue;

    results.push({
      reddit_id: match[3],
      subreddit: match[2],
      title: r.title,
      selftext: r.content || '',
      url: r.url,
      permalink: match[1],
      score: 0,
      num_comments: 0,
    });
  }

  return results;
}
