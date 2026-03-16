import { NextResponse } from 'next/server';
import { getTavily } from '@/lib/tavily';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const tvly = getTavily();

    // Test 1: Basic search (like competitors use)
    try {
      const r1 = await tvly.search('Trainual dental training alternatives', {
        maxResults: 3,
        searchDepth: 'advanced',
      });
      results.basic = {
        count: r1.results.length,
        urls: r1.results.map((r) => r.url),
      };
    } catch (e) {
      results.basic = { error: e instanceof Error ? e.message : String(e) };
    }

    // Test 2: With includeDomains (like mine uses)
    try {
      const r2 = await tvly.search('Trainual dental training', {
        maxResults: 3,
        searchDepth: 'advanced',
        includeDomains: ['reddit.com'],
      });
      results.withDomain = {
        count: r2.results.length,
        urls: r2.results.map((r) => r.url),
      };
    } catch (e) {
      results.withDomain = { error: e instanceof Error ? e.message : String(e) };
    }

    // Test 3: Fallback approach
    try {
      const r3 = await tvly.search('Trainual dental training reddit.com', {
        maxResults: 3,
        searchDepth: 'advanced',
      });
      const redditOnly = r3.results.filter((r) => r.url.includes('reddit.com'));
      results.fallback = {
        totalCount: r3.results.length,
        redditCount: redditOnly.length,
        urls: r3.results.map((r) => r.url),
        redditUrls: redditOnly.map((r) => r.url),
      };
    } catch (e) {
      results.fallback = { error: e instanceof Error ? e.message : String(e) };
    }
  } catch (e) {
    results.tavily_init = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results);
}
