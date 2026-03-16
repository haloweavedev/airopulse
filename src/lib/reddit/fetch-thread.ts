import { rateLimitedFetch } from './rate-limiter';

export async function fetchThreadJson(permalink: string): Promise<Record<string, unknown>> {
  const url = `https://www.reddit.com${permalink}.json`;
  const res = await rateLimitedFetch(url);
  const data = await res.json();
  return data;
}
