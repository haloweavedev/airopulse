export type ProjectStatus =
  | 'draft'
  | 'summarizing'
  | 'identifying_competitors'
  | 'mining'
  | 'analyzing'
  | 'synthesizing'
  | 'complete'
  | 'error';

export type DocumentType = 'docx' | 'pdf' | 'txt' | 'paste';

export type InsightCategory =
  | 'complaint'
  | 'feature_request'
  | 'switching_trigger'
  | 'opportunity'
  | 'validation'
  | 'gap';

export type InsightIntensity = 'low' | 'medium' | 'high';

export type AnalysisStatus = 'pending' | 'analyzed' | 'error';

export type QuerySource = 'ai' | 'manual';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  product_summary: string | null;
  final_report: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  type: DocumentType;
  raw_text: string;
  size_bytes: number;
  created_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  website: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface SearchQuery {
  id: string;
  project_id: string;
  query: string;
  source: QuerySource;
  is_active: boolean;
  results_count: number;
  last_searched: string | null;
  created_at: string;
}

export interface RedditThread {
  id: string;
  project_id: string;
  query_id: string;
  reddit_id: string;
  subreddit: string;
  title: string;
  selftext: string | null;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  thread_json: Record<string, unknown>;
  analysis_status: AnalysisStatus;
  created_at: string;
}

export interface Insight {
  id: string;
  project_id: string;
  thread_id: string;
  category: InsightCategory;
  title: string;
  description: string;
  evidence: string | null;
  intensity: InsightIntensity;
  frequency: number;
  tags: string[];
  created_at: string;
}

export interface PipelineRun {
  id: string;
  project_id: string;
  step: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  model_used: string;
  duration_ms: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ProjectWithCounts extends Project {
  document_count: number;
  insight_count: number;
}

export const PIPELINE_STEPS = [
  { key: 'upload', label: 'Upload Documents', description: 'Upload product docs' },
  { key: 'summarize', label: 'Summarize', description: 'AI generates product summary' },
  { key: 'competitors', label: 'Identify Competitors', description: 'AI identifies competitors & generates queries' },
  { key: 'mine', label: 'Mine Reddit', description: 'Search & fetch Reddit threads' },
  { key: 'analyze', label: 'Analyze Threads', description: 'AI extracts insights from threads' },
  { key: 'synthesize', label: 'Synthesize Report', description: 'AI generates final report' },
] as const;

export type PipelineStep = typeof PIPELINE_STEPS[number]['key'];
