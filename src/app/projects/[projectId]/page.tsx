'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PipelineStatus } from '@/components/pipeline-status';
import { DocumentUpload } from '@/components/document-upload';
import { CompetitorList } from '@/components/competitor-list';
import { QueryEditor } from '@/components/query-editor';
import { ThreadList } from '@/components/thread-list';
import { InsightCard } from '@/components/insight-card';
import { InsightFilters } from '@/components/insight-filters';
import { ReportViewer } from '@/components/report-viewer';
import { EmptyState } from '@/components/empty-state';
import {
  ArrowLeft, Play, Loader2, Trash2,
  FileText, Users, Search, MessageSquare, Lightbulb, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Project, Document, Competitor, SearchQuery, RedditThread, Insight } from '@/lib/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [threads, setThreads] = useState<RedditThread[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningStep, setRunningStep] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [pRes, dRes, cRes, qRes, tRes, iRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/documents`),
        fetch(`/api/projects/${projectId}/competitors`),
        fetch(`/api/projects/${projectId}/queries`),
        fetch(`/api/projects/${projectId}/threads`),
        fetch(`/api/projects/${projectId}/insights`),
      ]);

      const [p, d, c, q, t, i] = await Promise.all([
        pRes.json(), dRes.json(), cRes.json(), qRes.json(), tRes.json(), iRes.json(),
      ]);

      setProject(p);
      setDocuments(Array.isArray(d) ? d : []);
      setCompetitors(Array.isArray(c) ? c : []);
      setQueries(Array.isArray(q) ? q : []);
      setThreads(Array.isArray(t) ? t : []);
      setInsights(Array.isArray(i) ? i : []);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadInsights = useCallback(async () => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (intensityFilter) params.set('intensity', intensityFilter);
    const res = await fetch(`/api/projects/${projectId}/insights?${params}`);
    const data = await res.json();
    setInsights(Array.isArray(data) ? data : []);
  }, [projectId, categoryFilter, intensityFilter]);

  useEffect(() => {
    if (!loading) loadInsights();
  }, [categoryFilter, intensityFilter, loadInsights, loading]);

  const runStep = async (step: string) => {
    setRunning(true);
    setRunningStep(step);
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Pipeline step failed');
      } else {
        toast.success(`${step} complete`);
        if (step === 'analyze' && data.has_more) {
          toast.info('More threads available — run analyze again');
        }
      }
      await loadAll();
    } catch (err) {
      toast.error('Pipeline step failed');
      console.error(err);
    } finally {
      setRunning(false);
      setRunningStep('');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this project and all its data?')) return;
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return <EmptyState icon={FileText} title="Project not found" description="This project doesn't exist." />;
  }

  const hasDocs = documents.length > 0;
  const hasSummary = !!project.product_summary;
  const hasCompetitors = competitors.length > 0;
  const hasThreads = threads.length > 0;
  const hasInsights = insights.length > 0;
  const hasReport = !!project.final_report;

  const nextStep = !hasDocs ? null
    : !hasSummary ? 'summarize'
    : !hasCompetitors ? 'competitors'
    : !hasThreads ? 'mine'
    : threads.some((t) => t.analysis_status === 'pending') ? 'analyze'
    : !hasReport ? 'synthesize'
    : null;

  const isProcessing = ['summarizing', 'identifying_competitors', 'mining', 'analyzing', 'synthesizing'].includes(project.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStep && (
            <Button onClick={() => runStep(nextStep)} disabled={running || isProcessing}>
              {running ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Play className="mr-1 size-4" />
              )}
              {running ? `Running ${runningStep}...` : `Run: ${nextStep}`}
            </Button>
          )}
          {hasReport && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <PipelineStatus
        status={project.status}
        hasDocs={hasDocs}
        hasSummary={hasSummary}
        hasCompetitors={hasCompetitors}
        hasThreads={hasThreads}
        hasInsights={hasInsights}
        hasReport={hasReport}
      />

      {project.error_message && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            Error: {project.error_message}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FileText className="size-3.5" />
            Docs ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1">
            <Users className="size-3.5" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="threads" className="gap-1">
            <MessageSquare className="size-3.5" />
            Threads ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1">
            <Lightbulb className="size-3.5" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1">
            <BookOpen className="size-3.5" />
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Documents</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{documents.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Competitors</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{competitors.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Threads Mined</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{threads.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Insights</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{insights.length}</p></CardContent>
            </Card>
          </div>

          {hasSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.product_summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUpload projectId={projectId} documents={documents} onUpdate={loadAll} />
        </TabsContent>

        <TabsContent value="competitors" className="flex flex-col gap-6">
          <CompetitorList projectId={projectId} competitors={competitors} onUpdate={loadAll} />
          <QueryEditor projectId={projectId} queries={queries} onUpdate={loadAll} />
        </TabsContent>

        <TabsContent value="threads">
          {threads.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No threads yet"
              description="Run the mining step to search Reddit and fetch threads."
            />
          ) : (
            <ThreadList threads={threads} />
          )}
        </TabsContent>

        <TabsContent value="insights" className="flex flex-col gap-4">
          {insights.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No insights yet"
              description="Run the analyze step to extract insights from mined threads."
            />
          ) : (
            <>
              <InsightFilters
                category={categoryFilter}
                intensity={intensityFilter}
                onCategoryChange={setCategoryFilter}
                onIntensityChange={setIntensityFilter}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="report">
          {!project.final_report ? (
            <EmptyState
              icon={BookOpen}
              title="No report yet"
              description="Run the synthesize step to generate a comprehensive competitive intelligence report."
            />
          ) : (
            <ReportViewer report={project.final_report} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
