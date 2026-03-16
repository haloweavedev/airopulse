'use client';

import { PIPELINE_STEPS, type ProjectStatus } from '@/lib/types';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  draft: -1,
  summarizing: 0,
  identifying_competitors: 1,
  mining: 2,
  analyzing: 3,
  extracting_pain_points: 3,
  synthesizing: 4,
  generating_features: 4,
  complete: 5,
  error: -1,
};

function getStepState(stepIndex: number, status: ProjectStatus, hasData: {
  hasDocs: boolean;
  hasSummary: boolean;
  hasCompetitors: boolean;
  hasThreads: boolean;
  hasInsights: boolean;
  hasReport: boolean;
}) {
  const activeIndex = STATUS_TO_STEP_INDEX[status] ?? -1;

  // Check if step is complete based on data
  const completedSteps = [
    hasData.hasDocs,
    hasData.hasSummary,
    hasData.hasCompetitors,
    hasData.hasThreads,
    hasData.hasInsights,
    hasData.hasReport,
  ];

  if (completedSteps[stepIndex]) return 'complete';
  if (stepIndex === activeIndex) return 'active';
  return 'pending';
}

export function PipelineStatus({
  status,
  hasDocs,
  hasSummary,
  hasCompetitors,
  hasThreads,
  hasInsights,
  hasReport,
}: {
  status: ProjectStatus;
  hasDocs: boolean;
  hasSummary: boolean;
  hasCompetitors: boolean;
  hasThreads: boolean;
  hasInsights: boolean;
  hasReport: boolean;
}) {
  const data = { hasDocs, hasSummary, hasCompetitors, hasThreads, hasInsights, hasReport };

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, i) => {
        const state = getStepState(i, status, data);
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              {state === 'complete' ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                  <Check className="size-3.5 text-primary-foreground" />
                </div>
              ) : state === 'active' ? (
                <div className="flex size-6 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                  <Circle className="size-2 text-muted-foreground/30" />
                </div>
              )}
              <span className={cn(
                'hidden text-xs sm:inline',
                state === 'complete' && 'font-medium text-foreground',
                state === 'active' && 'font-medium text-primary',
                state === 'pending' && 'text-muted-foreground',
              )}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={cn(
                'mx-1 h-px w-4 sm:w-8',
                state === 'complete' ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
