-- AI Cache table for storing Gemini API results to avoid re-calling on repeated requests
CREATE TYPE ai_cache_type AS ENUM ('match_score', 'candidate_summary', 'job_optimization');

CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type ai_cache_type NOT NULL,
  entity_id TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_lookup ON ai_cache (type, entity_id);
