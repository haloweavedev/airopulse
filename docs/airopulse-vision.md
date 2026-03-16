# AiroPulse Vision

**Built by Airodental**

AiroPulse is an AI-powered product research tool that mines Reddit complaints and turns them into actionable product insights — so we can vibecode better apps faster.

> Mine reddit, make money.

## The Playbook

1. **Find a simple app making money** — target SaaS with traction and visible user pain
2. **Find Reddit threads complaining about it** — search for problems, alternatives, frustrations
3. **Add `/.json` to the thread URL** — Reddit serves the entire thread as structured JSON
4. **Download the complete thread** — every reply, all metadata, scores, timestamps, hierarchy
5. **Feed it into an LLM** — extract patterns, opinions, sentiments, and insights
6. **Use the insights to vibecode a better app** — build what users actually want

That's it. Real user pain → real product features → real money.

## Target Categories

- Knowledge base software
- SOP / training software
- Documentation tools
- Workflow tools

**Examples to analyze**: `usewhale.io`, `Trainual`

## How Reddit JSON Works

Any Reddit thread URL can be converted to JSON:

```
https://reddit.com/r/startups/comments/example-thread
→ https://reddit.com/r/startups/comments/example-thread.json
```

The JSON includes:
- Original post + all replies (nested)
- User metadata
- Scores / upvotes
- Timestamps
- Full discussion hierarchy

## What the LLM Extracts

- **Common complaints** — too expensive, poor UI, bad onboarding, missing integrations
- **Feature requests** — API access, automation, templates, analytics, collaboration
- **Hidden opportunities** — features users keep asking for, problems competitors ignore, workflows users hack together
- **Switching triggers** — what makes users leave for a competitor
- **Sentiment & intensity** — how angry are they, and about what

## What We Build With It

Use the insights to:
- Design features users are already begging for
- Fix UX issues competitors ignore
- Prioritize roadmap with real evidence
- Ship faster by building what matters

## Future Sources

AiroPulse will expand beyond Reddit:
- Product Hunt
- G2 / Capterra reviews
- Twitter/X
- Hacker News
- YouTube comments

## Philosophy

> Mine user complaints.
> Turn pain into product features.
> Vibecode the better version.
