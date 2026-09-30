-- ============================================================================
-- JobMate: Evidence Graph, Requirements & Claim Verification Architecture
-- Additive Schema Migration (Preserves all existing tables and data)
-- ============================================================================

-- 1. Enable pgvector extension if not already present
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Evidence Snapshots Table
CREATE TABLE IF NOT EXISTS evidence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'github', 'resume', 'manual_artifact'
  source_identifier TEXT NOT NULL, -- repo name, file path, etc.
  source_version TEXT, -- commit SHA, document hash
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'stale', 'archived'
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_candidate ON evidence_snapshots(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_hash ON evidence_snapshots(content_hash);

-- 3. Core Evidence Items Table (With pgvector embeddings & L0-L7 evidence hierarchy)
CREATE TABLE IF NOT EXISTS candidate_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'manual',
  evidence_level TEXT NOT NULL DEFAULT 'L4_SOURCE_CODE',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  title TEXT NOT NULL DEFAULT 'Evidence',
  content TEXT NOT NULL DEFAULT '',
  source_id TEXT,
  source_url TEXT,
  source_uri TEXT,
  repository TEXT,
  file_path TEXT,
  line_start INT,
  line_end INT,
  commit_sha TEXT,
  pull_request_number INT,
  technologies TEXT[] DEFAULT '{}',
  concepts TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '[]'::jsonb,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  verified BOOLEAN NOT NULL DEFAULT false,
  content_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(768),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure additive columns exist on pre-existing candidate_evidence table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'candidate_id') THEN
    ALTER TABLE candidate_evidence ADD COLUMN candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'evidence_level') THEN
    ALTER TABLE candidate_evidence ADD COLUMN evidence_level TEXT NOT NULL DEFAULT 'L4_SOURCE_CODE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'verification_status') THEN
    ALTER TABLE candidate_evidence ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'source_uri') THEN
    ALTER TABLE candidate_evidence ADD COLUMN source_uri TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'repository') THEN
    ALTER TABLE candidate_evidence ADD COLUMN repository TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'file_path') THEN
    ALTER TABLE candidate_evidence ADD COLUMN file_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'line_start') THEN
    ALTER TABLE candidate_evidence ADD COLUMN line_start INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'line_end') THEN
    ALTER TABLE candidate_evidence ADD COLUMN line_end INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'commit_sha') THEN
    ALTER TABLE candidate_evidence ADD COLUMN commit_sha TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'pull_request_number') THEN
    ALTER TABLE candidate_evidence ADD COLUMN pull_request_number INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'content_hash') THEN
    ALTER TABLE candidate_evidence ADD COLUMN content_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidate_evidence' AND column_name = 'observed_at') THEN
    ALTER TABLE candidate_evidence ADD COLUMN observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

UPDATE candidate_evidence SET candidate_id = user_id WHERE candidate_id IS NULL AND user_id IS NOT NULL;
UPDATE candidate_evidence SET user_id = candidate_id WHERE user_id IS NULL AND candidate_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_evidence_candidate ON candidate_evidence(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evidence_tech ON candidate_evidence USING GIN(technologies);
CREATE INDEX IF NOT EXISTS idx_candidate_evidence_level ON candidate_evidence(evidence_level);
CREATE INDEX IF NOT EXISTS idx_candidate_evidence_status ON candidate_evidence(verification_status);

-- 4. Evidence Relationships Graph
CREATE TABLE IF NOT EXISTS evidence_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_evidence_id UUID NOT NULL REFERENCES candidate_evidence(id) ON DELETE CASCADE,
  target_evidence_id UUID NOT NULL REFERENCES candidate_evidence(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'SUPPORTS', 'DERIVED_FROM', 'EXTENDS', 'CONFLICTS_WITH', 'SUPERSEDES'
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_rel_source ON evidence_relationships(source_evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_rel_target ON evidence_relationships(target_evidence_id);

-- 5. Evidence Conflicts Table
CREATE TABLE IF NOT EXISTS evidence_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL, -- 'TIMELINE_MISMATCH', 'METRIC_UNSUPPORTED', 'TECH_UNVERIFIED', 'SOURCE_DISCREPANCY'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  claim_id UUID,
  evidence_ids UUID[] DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'resolved', 'ignored'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_evidence_conflicts_candidate ON evidence_conflicts(candidate_id);

-- 6. Job Requirements Table
CREATE TABLE IF NOT EXISTS job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical', -- 'technical', 'responsibility', 'seniority', 'domain', 'education'
  normalized_skills TEXT[] DEFAULT '{}',
  importance TEXT NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high'
  evidence_needed TEXT[] DEFAULT '{}',
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_req_job ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_req_candidate ON job_requirements(candidate_id);

-- 7. Requirement Evidence Matches & Proof Coverage
CREATE TABLE IF NOT EXISTS requirement_evidence_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_evidence_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'absent', -- 'supported', 'partially_supported', 'user_asserted', 'conflicted', 'stale', 'absent'
  proof_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  evidence_diversity INT NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_req_evidence_matches_req ON requirement_evidence_matches(requirement_id);

-- 8. Evidence Acquisition Requests & Career Gap Plans
CREATE TABLE IF NOT EXISTS evidence_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  target_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  current_coverage_pct DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  target_coverage_pct DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES evidence_plans(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  missing_skill TEXT NOT NULL,
  expected_artifacts TEXT[] DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'verified', 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_evidence_tasks_plan ON evidence_tasks(plan_id);

-- 9. AI Execution Tracing & Telemetry Table
CREATE TABLE IF NOT EXISTS ai_execution_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_name TEXT NOT NULL,
  attempt INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  status TEXT NOT NULL, -- 'running', 'success', 'failed', 'retrying'
  model TEXT,
  provider TEXT,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  total_cost_usd DOUBLE PRECISION DEFAULT 0.0,
  error_message TEXT,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  evidence_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_traces_run ON ai_execution_traces(run_id);
CREATE INDEX IF NOT EXISTS idx_ai_traces_candidate ON ai_execution_traces(candidate_id);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE evidence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_evidence_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_execution_traces ENABLE ROW LEVEL SECURITY;

-- 11. Strict Isolation RLS Policies
DROP POLICY IF EXISTS "Users can only access own evidence snapshots" ON evidence_snapshots;
CREATE POLICY "Users can only access own evidence snapshots"
  ON evidence_snapshots FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own evidence items" ON candidate_evidence;
CREATE POLICY "Users can only access own evidence items"
  ON candidate_evidence FOR ALL
  USING (auth.uid() = candidate_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access own evidence relationships" ON evidence_relationships;
CREATE POLICY "Users can only access own evidence relationships"
  ON evidence_relationships FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own evidence conflicts" ON evidence_conflicts;
CREATE POLICY "Users can only access own evidence conflicts"
  ON evidence_conflicts FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own job requirements" ON job_requirements;
CREATE POLICY "Users can only access own job requirements"
  ON job_requirements FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own requirement matches" ON requirement_evidence_matches;
CREATE POLICY "Users can only access own requirement matches"
  ON requirement_evidence_matches FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own evidence plans" ON evidence_plans;
CREATE POLICY "Users can only access own evidence plans"
  ON evidence_plans FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own evidence tasks" ON evidence_tasks;
CREATE POLICY "Users can only access own evidence tasks"
  ON evidence_tasks FOR ALL
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Users can only access own AI execution traces" ON ai_execution_traces;
CREATE POLICY "Users can only access own AI execution traces"
  ON ai_execution_traces FOR ALL
  USING (auth.uid() = candidate_id);
