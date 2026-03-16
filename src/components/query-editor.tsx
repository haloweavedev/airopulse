'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SearchQuery } from '@/lib/types';

export function QueryEditor({
  projectId,
  queries,
  onUpdate,
}: {
  projectId: string;
  queries: SearchQuery[];
  onUpdate: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newQuery, setNewQuery] = useState('');

  const handleAdd = async () => {
    if (!newQuery.trim()) return;
    await fetch(`/api/projects/${projectId}/queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: newQuery, source: 'manual' }),
    });
    setNewQuery('');
    setAdding(false);
    onUpdate();
  };

  const toggleActive = async (q: SearchQuery) => {
    await fetch(`/api/projects/${projectId}/queries`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, is_active: !q.is_active }),
    });
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/queries?id=${id}`, { method: 'DELETE' });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Search Queries ({queries.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="mr-1 size-3.5" />
          Add Query
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter search query..."
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd}>Save</Button>
          <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {queries.map((q) => (
          <div
            key={q.id}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
              q.is_active ? 'border-border' : 'border-border/50 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground" />
              <span>{q.query}</span>
              <Badge variant="secondary" className="text-[10px]">{q.source}</Badge>
              {q.results_count > 0 && (
                <span className="text-xs text-muted-foreground">{q.results_count} results</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleActive(q)} className="p-1 hover:opacity-70">
                {q.is_active ? (
                  <ToggleRight className="size-5 text-primary" />
                ) : (
                  <ToggleLeft className="size-5 text-muted-foreground" />
                )}
              </button>
              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => handleDelete(q.id)}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
