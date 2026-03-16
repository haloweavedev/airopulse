import { getOpenAI } from '../openai';
import { getTavily } from '../tavily';
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

async function researchCompetitors(productSummary: string): Promise<string> {
  const tvly = getTavily();

  // Extract key terms from the summary for targeted searches
  const searches = [
    `competitors alternatives ${productSummary.slice(0, 100)}`,
    `best software tools ${productSummary.slice(0, 80)}`,
  ];

  const results: string[] = [];

  for (const query of searches) {
    try {
      const response = await tvly.search(query, {
        maxResults: 5,
        searchDepth: 'advanced',
      });
      for (const r of response.results) {
        results.push(`[${r.title}](${r.url})\n${r.content}`);
      }
    } catch (err) {
      console.error('Tavily competitor research failed:', err);
    }
  }

  return results.length > 0
    ? `\n\n## Web Research Results\nThe following are real search results about competitors and alternatives in this space:\n\n${results.join('\n\n---\n\n')}`
    : '';
}

export async function identifyCompetitors(productSummary: string) {
  const openai = getOpenAI();

  // Use Tavily to ground competitor identification in real web data
  const webResearch = await researchCompetitors(productSummary);

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: COMPETITORS_PROMPT },
      { role: 'user', content: productSummary + webResearch },
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
