import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { COMPETITORS_PROMPT } from './prompts';

interface CompetitorResult {
  competitors: {
    name: string;
    description: string;
    website: string;
    is_primary: boolean;
  }[];
  queries: string[];
}

export async function identifyCompetitors(productSummary: string) {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: COMPETITORS_PROMPT },
      { role: 'user', content: productSummary },
    ],
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{}';
  const parsed: CompetitorResult = JSON.parse(content);

  return {
    competitors: parsed.competitors || [],
    queries: parsed.queries || [],
    usage: response.usage,
    model: MODELS.smart,
  };
}
