'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Insight } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  complaint: 'bg-red-100 text-red-800',
  feature_request: 'bg-blue-100 text-blue-800',
  switching_trigger: 'bg-amber-100 text-amber-800',
  opportunity: 'bg-emerald-100 text-emerald-800',
  validation: 'bg-purple-100 text-purple-800',
  gap: 'bg-orange-100 text-orange-800',
  pain_point: 'bg-rose-100 text-rose-800',
};

const INTENSITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={CATEGORY_COLORS[insight.category] || ''}>
            {insight.category.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="secondary" className={INTENSITY_COLORS[insight.intensity] || ''}>
            {insight.intensity}
          </Badge>
          {insight.frequency > 1 && (
            <span className="text-xs text-muted-foreground">
              freq: {insight.frequency}
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium">{insight.title}</h4>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{insight.description}</p>
        {insight.evidence && (
          <blockquote className="border-l-2 border-muted pl-3 text-xs italic text-muted-foreground">
            &ldquo;{insight.evidence}&rdquo;
          </blockquote>
        )}
        {insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {insight.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
