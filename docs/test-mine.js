require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SEARCH_QUERY = process.argv[2] || "Trainual";
const MAX_THREADS = 3;

async function redditFetch(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Reddit returned ${res.status} for ${url}`);
  return res.json();
}

// Step 1 — Search Reddit for threads
async function searchReddit(query) {
  console.log(`\n🔍 Searching Reddit for: "${query}"\n`);
  const data = await redditFetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=25`
  );
  const posts = data.data.children
    .map((c) => c.data)
    .filter((p) => p.num_comments > 3)
    .sort((a, b) => b.num_comments - a.num_comments)
    .slice(0, MAX_THREADS);

  console.log(`Found ${data.data.children.length} results, picking top ${posts.length} by comment count:\n`);
  posts.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.num_comments} comments, ${p.score} upvotes] ${p.title}`);
    console.log(`     r/${p.subreddit} — ${p.url}\n`);
  });
  return posts;
}

// Step 2 — Fetch full thread JSON and extract all comments
function extractComments(commentTree, depth = 0) {
  const comments = [];
  if (!commentTree || !Array.isArray(commentTree)) return comments;

  for (const item of commentTree) {
    if (item.kind === "t1") {
      const c = item.data;
      comments.push({
        author: c.author,
        body: c.body,
        score: c.score,
        depth,
      });
      if (c.replies && c.replies.data) {
        comments.push(...extractComments(c.replies.data.children, depth + 1));
      }
    }
  }
  return comments;
}

async function fetchThread(post) {
  const jsonUrl = `https://www.reddit.com${post.permalink}.json`;
  const data = await redditFetch(jsonUrl);

  const comments = extractComments(data[1].data.children);
  return {
    title: post.title,
    subreddit: post.subreddit,
    selftext: post.selftext,
    score: post.score,
    url: post.url,
    comments,
  };
}

// Step 3 — Send to OpenAI for analysis
async function analyzeWithLLM(threads) {
  const threadSummaries = threads.map((t) => {
    const topComments = t.comments
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((c) => `[score:${c.score}] ${c.body}`)
      .join("\n---\n");

    return `## Thread: ${t.title}\nSubreddit: r/${t.subreddit} | Post score: ${t.score}\nOriginal post: ${t.selftext || "(link post)"}\n\nTop comments:\n${topComments}`;
  });

  const prompt = `You are AiroPulse, a product research AI. You are analyzing real Reddit discussions to extract actionable product insights.

The product we're building is called Saige — a dental-office-specific training and SOP platform (competing with Trainual, UseWhale, Front Office Rocks). Saige provides:
- Role-based Q&A grounded in office content
- Structured learning paths (Subject → Topic → Step)
- Script coaching ("say this / do this / escalate if")
- Progress tracking and analytics
- Source-protected knowledge base

Analyze these Reddit threads and extract:

1. **COMPLAINTS** — What do users hate about the existing product(s)? Be specific.
2. **FEATURE REQUESTS** — What are users asking for that doesn't exist?
3. **SWITCHING TRIGGERS** — What makes people leave for a competitor?
4. **HIDDEN OPPORTUNITIES** — Problems competitors ignore, workflows users hack together, things nobody is building.
5. **VALIDATION FOR SAIGE** — Which Saige features directly solve complaints mentioned here?
6. **GAPS FOR SAIGE** — Things users want that Saige hasn't planned for yet.

Be specific, cite actual comments when possible, and rank by frequency/intensity.

---

${threadSummaries.join("\n\n===\n\n")}`;

  console.log("\n🤖 Sending to OpenAI for analysis...\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000,
  });

  return response.choices[0].message.content;
}

// Run it
(async () => {
  try {
    const posts = await searchReddit(SEARCH_QUERY);
    if (posts.length === 0) {
      console.log("No threads found with enough comments. Try a different query.");
      return;
    }

    console.log("📥 Fetching full thread data...\n");
    const threads = [];
    for (const post of posts) {
      // Small delay to be polite to Reddit's API
      await new Promise((r) => setTimeout(r, 1500));
      const thread = await fetchThread(post);
      console.log(`  ✓ "${thread.title}" — ${thread.comments.length} comments extracted`);
      threads.push(thread);
    }

    const insights = await analyzeWithLLM(threads);

    console.log("\n" + "=".repeat(80));
    console.log("AIROPULSE INSIGHTS REPORT");
    console.log("=".repeat(80) + "\n");
    console.log(insights);
    console.log("\n" + "=".repeat(80) + "\n");
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
