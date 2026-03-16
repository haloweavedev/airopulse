import { getOpenAI } from '../openai';
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

  // Use gpt-4.1 — faster for structured output within Vercel 60s timeout
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      { role: 'system', content: GENERATE_FEATURES_PROMPT },
      {
        role: 'user',
        content: `Product Summary:\n${productSummary}\n\n---\n\nCompetitors:\n${competitorList}\n\n---\n\nPain Points (${painPoints.length} total):\n\n${painPointsList}`,
      },
    ],
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content ?? '{"features":[],"executive_summary":""}';
  const parsed = JSON.parse(content);
  const features = (parsed.features || []) as GeneratedFeature[];
  const executiveSummary = (parsed.executive_summary || '') as string;

  // Build markdown report from structured data
  const report = buildReport(executiveSummary, features, painPoints, competitors);

  return {
    features,
    report,
    usage: response.usage,
    model: 'gpt-4.1',
  };
}

function buildReport(
  executiveSummary: string,
  features: { title: string; description: string; impact: string; effort: string; pain_point_indices: number[]; evidence_summary: string }[],
  painPoints: Insight[],
  competitors: Competitor[]
): string {
  const lines: string[] = [];

  lines.push('# Product Research Report\n');
  lines.push('## Executive Summary\n');
  lines.push(executiveSummary + '\n');

  // Pain Points by Severity
  lines.push('## Pain Points by Severity\n');
  const byIntensity: Record<string, Insight[]> = {};
  for (const pp of painPoints) {
    const key = pp.intensity || 'medium';
    if (!byIntensity[key]) byIntensity[key] = [];
    byIntensity[key].push(pp);
  }
  for (const level of ['critical', 'high', 'medium', 'low']) {
    const group = byIntensity[level];
    if (!group?.length) continue;
    lines.push(`### ${level.charAt(0).toUpperCase() + level.slice(1)}\n`);
    for (const pp of group) {
      lines.push(`- **${pp.title}**: ${pp.description}`);
      if (pp.evidence) lines.push(`  > "${pp.evidence}"`);
    }
    lines.push('');
  }

  // Recommended Features
  lines.push('## Recommended Features\n');
  const sorted = [...features].sort((a, b) => {
    const impactOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const effortOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
    return (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2) || (effortOrder[a.effort] ?? 1) - (effortOrder[b.effort] ?? 1);
  });
  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];
    lines.push(`### ${i + 1}. ${f.title}`);
    lines.push(`**Impact:** ${f.impact} | **Effort:** ${f.effort}\n`);
    lines.push(f.description + '\n');
    if (f.evidence_summary) lines.push(`*Evidence:* ${f.evidence_summary}\n`);
  }

  // Competitive Landscape
  if (competitors.length > 0) {
    lines.push('## Competitive Landscape\n');
    lines.push('| Competitor | Type | Website |');
    lines.push('|---|---|---|');
    for (const c of competitors) {
      const type = c.is_primary ? 'Primary' : 'Indirect';
      const url = c.website || '-';
      lines.push(`| ${c.name} | ${type} | ${url} |`);
    }
    lines.push('');
  }

  // Priority Matrix
  lines.push('## Priority Matrix\n');
  lines.push('| # | Feature | Impact | Effort |');
  lines.push('|---|---|---|---|');
  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];
    lines.push(`| ${i + 1} | ${f.title} | ${f.impact} | ${f.effort} |`);
  }

  return lines.join('\n');
}
