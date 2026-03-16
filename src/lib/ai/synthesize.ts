import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { GENERATE_FEATURES_PROMPT } from './prompts';
import type { Insight, Competitor } from '../types';

interface GeneratedFeature {
  title: string;
  description: string;
  impact: string;
  effort: string;
  pain_point_indices: number[];
  evidence_summary: string;
}

export async function generateFeatures(
  painPoints: Insight[],
  competitors: Competitor[],
  productSummary: string
) {
  const openai = getOpenAI();

  const painPointsList = painPoints
    .map((p, i) => {
      const whoFeelsIt = p.tags.find((t) => t.startsWith('who:'))?.replace('who:', '') || 'unknown';
      return `[${i}] [${p.intensity}] ${p.title}: ${p.description}${p.evidence ? `\n  Evidence: "${p.evidence}"` : ''}\n  Who: ${whoFeelsIt}`;
    })
    .join('\n\n');

  const competitorList = competitors
    .map((c) => `- ${c.name}${c.is_primary ? ' (primary)' : ''}: ${c.description || 'No description'}`)
    .join('\n');

  // Use gpt-4.1 (not gpt-5.4) — faster for large structured output within Vercel 60s timeout
  const response = await openai.chat.completions.create({
    model: MODELS.worker === 'gpt-4.1-mini' ? 'gpt-4.1' : MODELS.smart,
    messages: [
      { role: 'system', content: GENERATE_FEATURES_PROMPT },
      {
        role: 'user',
        content: `Product Summary:\n${productSummary}\n\n---\n\nCompetitors:\n${competitorList}\n\n---\n\nPain Points (${painPoints.length} total):\n\n${painPointsList}`,
      },
    ],
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"features":[],"report_markdown":""}';
  const parsed = JSON.parse(content);

  return {
    features: (parsed.features || []) as GeneratedFeature[],
    report: (parsed.report_markdown || '') as string,
    usage: response.usage,
    model: MODELS.smart,
  };
}
