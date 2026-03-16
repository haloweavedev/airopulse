export type ProjectStatus =
  | 'draft'
  | 'summarizing'
  | 'identifying_competitors'
  | 'mining'
  | 'analyzing'
  | 'extracting_pain_points'
  | 'synthesizing'
  | 'generating_features'
  | 'complete'
  | 'error';

export type DocumentType = 'docx' | 'pdf' | 'txt' | 'paste';

export type InsightCategory =
  | 'complaint'
  | 'feature_request'
  | 'switching_trigger'
  | 'opportunity'
  | 'validation'
  | 'gap'
  | 'pain_point';

export type InsightIntensity = 'low' | 'medium' | 'high' | 'critical';

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
  source_url: string | null;
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

export interface Feature {
  id: string;
  project_id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  pain_point_ids: string[];
  evidence_summary: string;
  created_at: string;
}

export interface ProjectWithCounts extends Project {
  document_count: number;
  insight_count: number;
}

export const PIPELINE_STEPS = [
  { key: 'upload', label: 'Upload Documents', description: 'Upload product docs' },
  { key: 'summarize', label: 'Summarize', description: 'AI generates product summary' },
  { key: 'competitors', label: 'Research Competitors', description: 'AI discovers real competitors via web search' },
  { key: 'mine', label: 'Mine Reddit', description: 'Search & fetch Reddit threads' },
  { key: 'pain_points', label: 'Extract Pain Points', description: 'AI extracts pain points from threads' },
  { key: 'features', label: 'Generate Features', description: 'AI maps pain points to actionable features' },
] as const;

export type PipelineStep = typeof PIPELINE_STEPS[number]['key'];
