'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lightbulb, Clock } from 'lucide-react';
import type { ProjectWithCounts } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  summarizing: 'bg-blue-100 text-blue-800',
  identifying_competitors: 'bg-blue-100 text-blue-800',
  mining: 'bg-amber-100 text-amber-800',
  analyzing: 'bg-purple-100 text-purple-800',
  synthesizing: 'bg-purple-100 text-purple-800',
  complete: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.draft;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:border-primary/50 hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{project.name}</CardTitle>
            <Badge variant="secondary" className={statusColor}>
              {project.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {project.document_count} docs
            </span>
            <span className="flex items-center gap-1">
              <Lightbulb className="size-3.5" />
              {project.insight_count} insights
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Clock className="size-3.5" />
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
