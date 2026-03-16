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
  FileText, Users, Search, MessageSquare, Lightbulb, BookOpen, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Project, Document, Competitor, SearchQuery, RedditThread, Insight, Feature } from '@/lib/types';

const IMPACT_COLORS: Record<string, string> = {
  critical: 'bg-red-200 text-red-900',
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-slate-100 text-slate-700',
};

const EFFORT_COLORS: Record<string, string> = {
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-green-100 text-green-800',
};

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [threads, setThreads] = useState<RedditThread[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningStep, setRunningStep] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return [];
          return await res.json();
        } catch { return []; }
      };

      const [p, d, c, q, t, i, f] = await Promise.all([
        fetch(`/api/projects/${projectId}`).then(r => r.json()).catch(() => null),
        safeFetch(`/api/projects/${projectId}/documents`),
        safeFetch(`/api/projects/${projectId}/competitors`),
        safeFetch(`/api/projects/${projectId}/queries`),
        safeFetch(`/api/projects/${projectId}/threads`),
        safeFetch(`/api/projects/${projectId}/insights`),
        safeFetch(`/api/projects/${projectId}/features`),
      ]);

      setProject(p);
      setDocuments(Array.isArray(d) ? d : []);
      setCompetitors(Array.isArray(c) ? c : []);
      setQueries(Array.isArray(q) ? q : []);
      setThreads(Array.isArray(t) ? t : []);
      setInsights(Array.isArray(i) ? i : []);
      setFeatures(Array.isArray(f) ? f : []);
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
        if (step === 'pain_points' && data.has_more) {
          toast.info('More threads available — run Extract Pain Points again');
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
  const hasFeatures = features.length > 0;
  const hasReport = !!project.final_report;

  const nextStep = !hasDocs ? null
    : !hasSummary ? 'summarize'
    : !hasCompetitors ? 'competitors'
    : !hasThreads ? 'mine'
    : threads.some((t) => t.analysis_status === 'pending') ? 'pain_points'
    : !hasReport ? 'features'
    : null;

  const isProcessing = ['summarizing', 'identifying_competitors', 'mining', 'analyzing', 'extracting_pain_points', 'synthesizing', 'generating_features'].includes(project.status);

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
          <TabsTrigger value="pain_points" className="gap-1">
            <Lightbulb className="size-3.5" />
            Pain Points ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1">
            <Zap className="size-3.5" />
            Features ({features.length})
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1">
            <BookOpen className="size-3.5" />
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-5">
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
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Pain Points</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{insights.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Features</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{features.length}</p></CardContent>
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

        <TabsContent value="pain_points" className="flex flex-col gap-4">
          {insights.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No pain points yet"
              description="Run the Extract Pain Points step to find what hurts users in mined threads."
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

        <TabsContent value="features" className="flex flex-col gap-4">
          {features.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No features yet"
              description="Run the Generate Features step to map pain points to actionable product features."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={IMPACT_COLORS[feature.impact] || ''}>
                        Impact: {feature.impact}
                      </Badge>
                      <Badge variant="secondary" className={EFFORT_COLORS[feature.effort] || ''}>
                        Effort: {feature.effort}
                      </Badge>
                      {feature.pain_point_ids.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {feature.pain_point_ids.length} pain point{feature.pain_point_ids.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium">{feature.title}</h4>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    {feature.evidence_summary && (
                      <p className="text-xs text-muted-foreground/80 italic">{feature.evidence_summary}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="report">
          {!project.final_report ? (
            <EmptyState
              icon={BookOpen}
              title="No report yet"
              description="Run the Generate Features step to produce a pain-point-driven product research report."
            />
          ) : (
            <ReportViewer report={project.final_report} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
