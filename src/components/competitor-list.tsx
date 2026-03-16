'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Globe, Star } from 'lucide-react';
import type { Competitor } from '@/lib/types';

export function CompetitorList({
  projectId,
  competitors,
  onUpdate,
}: {
  projectId: string;
  competitors: Competitor[];
  onUpdate: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await fetch(`/api/projects/${projectId}/competitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, website }),
    });
    setName('');
    setDescription('');
    setWebsite('');
    setAdding(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/competitors?id=${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const togglePrimary = async (comp: Competitor) => {
    await fetch(`/api/projects/${projectId}/competitors`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: comp.id, is_primary: !comp.is_primary }),
    });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Competitors ({competitors.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="mr-1 size-3.5" />
          Add
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            <Input placeholder="Competitor name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2">
        {competitors.map((comp) => (
          <div
            key={comp.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <button onClick={() => togglePrimary(comp)} className="hover:opacity-80">
                <Star className={`size-4 ${comp.is_primary ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comp.name}</span>
                  {comp.is_primary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                </div>
                {comp.description && <p className="text-xs text-muted-foreground">{comp.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {comp.website && (
                <a href={comp.website} target="_blank" rel="noopener noreferrer" className="p-1 hover:opacity-70">
                  <Globe className="size-3.5 text-muted-foreground" />
                </a>
              )}
              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => handleDelete(comp.id)}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
