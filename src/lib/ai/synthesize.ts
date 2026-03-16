import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { SYNTHESIZE_PROMPT } from './prompts';
import type { Insight } from '../types';

export async function synthesizeReport(insights: Insight[], productSummary: string) {
  const openai = getOpenAI();

  const insightsSummary = insights
    .map((i) => `[${i.category}] [${i.intensity}] (freq: ${i.frequency}) ${i.title}: ${i.description}${i.evidence ? `\n  Evidence: "${i.evidence}"` : ''}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: SYNTHESIZE_PROMPT },
      {
        role: 'user',
        content: `Product Summary:\n${productSummary}\n\n---\n\nAll Extracted Insights (${insights.length} total):\n\n${insightsSummary}`,
      },
    ],
    max_tokens: 6000,
  });

  return {
    report: response.choices[0].message.content ?? '',
    usage: response.usage,
    model: MODELS.smart,
  };
}
