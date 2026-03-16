import { NextResponse } from 'next/server';
import { getTavily } from '@/lib/tavily';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const tvly = getTavily();

    // Test Tavily with includeDomains
    const tavilyRes = await tvly.search('Trainual dental training', {
      maxResults: 2,
      searchDepth: 'advanced',
      includeDomains: ['reddit.com'],
    });

    results.tavily = {
      count: tavilyRes.results.length,
      urls: tavilyRes.results.map((r) => r.url),
    };

    // Test Reddit metadata fetch for first result
    if (tavilyRes.results.length > 0) {
      const url = tavilyRes.results[0].url;
      const match = url.match(/reddit\.com(\/r\/\w+\/comments\/\w+)/);
      results.regex_match = match ? match[1] : 'NO MATCH';

      if (match) {
        const permalink = match[1];
        const metaUrl = `https://www.reddit.com${permalink}.json`;
        results.reddit_fetch_url = metaUrl;

        try {
          const res = await fetch(metaUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          });
          results.reddit_status = res.status;
          results.reddit_headers = Object.fromEntries(res.headers.entries());

          if (res.ok) {
            const data = await res.json();
            const post = data?.[0]?.data?.children?.[0]?.data;
            results.reddit_post = post ? {
              id: post.id,
              title: post.title,
              subreddit: post.subreddit,
              score: post.score,
            } : 'post not found in response';
          } else {
            const text = await res.text();
            results.reddit_body = text.slice(0, 500);
          }
        } catch (e) {
          results.reddit_error = e instanceof Error ? e.message : String(e);
        }
      }
    }
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results);
}
