import { getOpenAI } from '../openai';
import { getTavily } from '../tavily';
import { MODELS } from './models';
import { SEARCH_TERMS_PROMPT, STRUCTURE_COMPETITORS_PROMPT } from './prompts';

interface StructuredCompetitor {
  name: string;
  description: string;
  website: string | null;
  source_url: string;
  is_primary: boolean;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

async function generateSearchTerms(summary: string) {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: SEARCH_TERMS_PROMPT },
      { role: 'user', content: summary },
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"search_terms":[]}';
  const parsed = JSON.parse(content);

  return {
    searchTerms: (parsed.search_terms || []) as string[],
    usage: response.usage,
  };
}

async function searchForCompetitors(terms: string[]): Promise<TavilyResult[]> {
  const tvly = getTavily();
  const seen = new Set<string>();
  const results: TavilyResult[] = [];

  for (const term of terms) {
    try {
      const response = await tvly.search(term, {
        maxResults: 5,
        searchDepth: 'advanced',
      });
      for (const r of response.results) {
        if (!seen.has(r.url)) {
          seen.add(r.url);
          results.push({ title: r.title, url: r.url, content: r.content });
        }
      }
    } catch (err) {
      console.error(`Tavily search failed for "${term}":`, err);
    }
  }

  return results;
}

async function structureCompetitors(summary: string, rawResults: TavilyResult[]) {
  const openai = getOpenAI();

  const resultsText = rawResults
    .map((r) => `[${r.title}](${r.url})\n${r.content}`)
    .join('\n\n---\n\n');

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: STRUCTURE_COMPETITORS_PROMPT },
      {
        role: 'user',
        content: `Product Summary:\n${summary}\n\n---\n\nWeb Search Results:\n\n${resultsText}`,
      },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"competitors":[]}';
  const parsed = JSON.parse(content);

  return {
    competitors: (parsed.competitors || []) as StructuredCompetitor[],
    usage: response.usage,
  };
}

export async function researchCompetitors(productSummary: string) {
  // Step 1: Generate search terms from summary
  const { searchTerms, usage: searchTermsUsage } = await generateSearchTerms(productSummary);

  // Step 2: Search Tavily with those terms
  const rawResults = await searchForCompetitors(searchTerms);

  // Step 3: Structure the results into competitors
  const { competitors, usage: structureUsage } = await structureCompetitors(productSummary, rawResults);

  const totalInputTokens = (searchTermsUsage?.prompt_tokens ?? 0) + (structureUsage?.prompt_tokens ?? 0);
  const totalOutputTokens = (searchTermsUsage?.completion_tokens ?? 0) + (structureUsage?.completion_tokens ?? 0);

  return {
    competitors,
    searchTerms,
    rawResultsCount: rawResults.length,
    usage: { prompt_tokens: totalInputTokens, completion_tokens: totalOutputTokens },
    model: MODELS.smart,
  };
}
