import { NextResponse } from 'next/server';

export async function GET() {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  const results: Record<string, unknown> = {};

  // Test www.reddit.com search
  try {
    const r1 = await fetch('https://www.reddit.com/search.json?q=dental+office+training&limit=3', {
      headers: { 'User-Agent': ua, Accept: 'application/json' },
    });
    results.www_search = { status: r1.status, ok: r1.ok };
    if (r1.ok) {
      const d = await r1.json();
      results.www_search_count = d?.data?.children?.length ?? 0;
    }
  } catch (e) { results.www_search = { error: String(e) }; }

  // Test old.reddit.com search
  try {
    const r2 = await fetch('https://old.reddit.com/search.json?q=dental+office+training&limit=3', {
      headers: { 'User-Agent': ua, Accept: 'application/json' },
    });
    results.old_search = { status: r2.status, ok: r2.ok };
    if (r2.ok) {
      const d = await r2.json();
      results.old_search_count = d?.data?.children?.length ?? 0;
    }
  } catch (e) { results.old_search = { error: String(e) }; }

  // Test www.reddit.com thread fetch
  try {
    const r3 = await fetch('https://www.reddit.com/r/Dentistry/comments/1h3orxc.json', {
      headers: { 'User-Agent': ua, Accept: 'application/json' },
    });
    results.www_thread = { status: r3.status, ok: r3.ok };
  } catch (e) { results.www_thread = { error: String(e) }; }

  // Test old.reddit.com thread fetch
  try {
    const r4 = await fetch('https://old.reddit.com/r/Dentistry/comments/1h3orxc.json', {
      headers: { 'User-Agent': ua, Accept: 'application/json' },
    });
    results.old_thread = { status: r4.status, ok: r4.ok };
  } catch (e) { results.old_thread = { error: String(e) }; }

  return NextResponse.json(results);
}
