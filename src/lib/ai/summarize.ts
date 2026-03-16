import { getOpenAI } from '../openai';
import { MODELS } from './models';
import { SUMMARIZE_PROMPT } from './prompts';

export async function summarizeDocuments(documents: { name: string; raw_text: string }[]) {
  const openai = getOpenAI();

  const docTexts = documents
    .map((d) => `--- Document: ${d.name} ---\n${d.raw_text}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: MODELS.smart,
    messages: [
      { role: 'system', content: SUMMARIZE_PROMPT },
      { role: 'user', content: docTexts },
    ],
    max_completion_tokens: 4000,
  });

  return {
    summary: response.choices[0].message.content ?? '',
    usage: response.usage,
    model: MODELS.smart,
  };
}
