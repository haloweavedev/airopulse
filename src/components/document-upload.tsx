'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Loader2, Type } from 'lucide-react';
import type { Document } from '@/lib/types';

export function DocumentUpload({
  projectId,
  documents,
  onUpdate,
}: {
  projectId: string;
  documents: Document[];
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteName, setPasteName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
      }
      await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });
      onUpdate();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [projectId, onUpdate]);

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    try {
      await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pasteName || 'Pasted text', text: pasteText }),
      });
      setPasteText('');
      setPasteName('');
      setShowPaste(false);
      onUpdate();
    } catch (err) {
      console.error('Paste failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    await fetch(`/api/projects/${projectId}/documents?id=${docId}`, { method: 'DELETE' });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <label
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            Drop .docx, .pdf, or .txt files here, or click to browse
          </span>
          <input
            type="file"
            className="hidden"
            accept=".docx,.pdf,.txt,.md"
            multiple
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowPaste(!showPaste)}>
          <Type className="mr-1 size-3.5" />
          Paste Text
        </Button>
      </div>

      {showPaste && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Input
              placeholder="Document name (optional)"
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
            />
            <Textarea
              placeholder="Paste your product document text here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePaste} disabled={uploading || !pasteText.trim()}>
                {uploading ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPaste(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uploaded Documents ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-muted-foreground">
                    ({(doc.size_bytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => handleDelete(doc.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
