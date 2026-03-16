import { getTavily } from '../tavily';
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

/**
 * Search for Reddit threads using Tavily (much better relevance than Reddit's own API),
 * then fetch metadata from Reddit's JSON endpoint to get scores and comment counts.
 */
export async function searchReddit(query: string, limit = 10): Promise<RedditSearchResult[]> {
  const tvly = getTavily();

  // Tavily search scoped to Reddit via includeDomains
  let tavilyResults;
  try {
    const response = await tvly.search(query, {
      maxResults: limit,
      searchDepth: 'advanced',
      includeDomains: ['reddit.com'],
    });
    tavilyResults = response.results;
  } catch {
    // Fallback: search without includeDomains, add "reddit" to query
    const response = await tvly.search(`${query} reddit.com`, {
      maxResults: limit,
      searchDepth: 'advanced',
    });
    tavilyResults = response.results.filter((r) => r.url.includes('reddit.com'));
  }

  const results: RedditSearchResult[] = [];

  for (const r of tavilyResults) {
    // Extract permalink and subreddit from Reddit URLs
    const match = r.url.match(/reddit\.com(\/r\/\w+\/comments\/\w+)/);
    if (!match) continue;

    const permalink = match[1];
    const subreddit = permalink.match(/\/r\/(\w+)\//)?.[1] ?? '';

    // Fetch actual Reddit metadata (score, comments, selftext)
    try {
      const metaUrl = `https://www.reddit.com${permalink}.json`;
      const res = await rateLimitedFetch(metaUrl);
      const data = await res.json();

      const post = data?.[0]?.data?.children?.[0]?.data;
      if (!post) continue;

      results.push({
        reddit_id: post.id as string,
        subreddit: subreddit,
        title: post.title as string ?? r.title,
        selftext: (post.selftext as string) || '',
        url: r.url,
        permalink: permalink,
        score: (post.score as number) ?? 0,
        num_comments: (post.num_comments as number) ?? 0,
      });
    } catch {
      // If Reddit fetch fails, still include with Tavily data
      results.push({
        reddit_id: permalink.split('/')[4] ?? '',
        subreddit: subreddit,
        title: r.title,
        selftext: r.content || '',
        url: r.url,
        permalink: permalink,
        score: 0,
        num_comments: 0,
      });
    }
  }

  return results;
}
