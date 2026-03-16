'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'complaint', label: 'Complaints' },
  { value: 'feature_request', label: 'Feature Requests' },
  { value: 'switching_trigger', label: 'Switching Triggers' },
  { value: 'opportunity', label: 'Opportunities' },
  { value: 'validation', label: 'Validation' },
  { value: 'gap', label: 'Gaps' },
];

const INTENSITIES = [
  { value: '', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function InsightFilters({
  category,
  intensity,
  onCategoryChange,
  onIntensityChange,
}: {
  category: string;
  intensity: string;
  onCategoryChange: (v: string) => void;
  onIntensityChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Category</p>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <Button
              key={c.value}
              variant="outline"
              size="sm"
              className={cn(
                'h-7 text-xs',
                category === c.value && 'border-primary bg-primary/5 text-primary',
              )}
              onClick={() => onCategoryChange(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Intensity</p>
        <div className="flex flex-wrap gap-1">
          {INTENSITIES.map((i) => (
            <Button
              key={i.value}
              variant="outline"
              size="sm"
              className={cn(
                'h-7 text-xs',
                intensity === i.value && 'border-primary bg-primary/5 text-primary',
              )}
              onClick={() => onIntensityChange(i.value)}
            >
              {i.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
