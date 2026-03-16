'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ArrowUpDown, MessageSquare } from 'lucide-react';
import type { RedditThread } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-secondary text-secondary-foreground',
  analyzed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export function ThreadList({ threads }: { threads: RedditThread[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subreddit</TableHead>
            <TableHead className="max-w-md">Title</TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                <ArrowUpDown className="size-3" />
                Score
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                <MessageSquare className="size-3" />
                Comments
              </span>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {threads.map((thread) => (
            <TableRow key={thread.id}>
              <TableCell className="text-sm font-medium">r/{thread.subreddit}</TableCell>
              <TableCell className="max-w-md truncate text-sm">{thread.title}</TableCell>
              <TableCell className="text-right text-sm">{thread.score}</TableCell>
              <TableCell className="text-right text-sm">{thread.num_comments}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={STATUS_COLORS[thread.analysis_status] || ''}>
                  {thread.analysis_status}
                </Badge>
              </TableCell>
              <TableCell>
                <a
                  href={`https://reddit.com${thread.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70"
                >
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
