import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { REDDIT_QUERIES_PROMPT } from './prompts';
import type { Competitor } from '../types';

export async function generateRedditQueries(
  productSummary: string,
  competitors: Competitor[]
) {
  const openai = getOpenAI();

  const competitorList = competitors
    .map((c) => `- ${c.name}${c.is_primary ? ' (primary)' : ''}: ${c.description || 'No description'}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: REDDIT_QUERIES_PROMPT },
      {
        role: 'user',
        content: `Product Summary:\n${productSummary}\n\n---\n\nReal Competitors:\n${competitorList}`,
      },
    ],
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"queries":[]}';
  const parsed = JSON.parse(content);

  return {
    queries: (parsed.queries || []) as string[],
    usage: response.usage,
    model: MODELS.smart,
  };
}
