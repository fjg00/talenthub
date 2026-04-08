-- Phase 5: AI Video Interviews
-- Run this in the Supabase SQL Editor

-- Interview status enum
DO $$ BEGIN
  CREATE TYPE public.interview_status AS ENUM ('pending', 'in_progress', 'completed', 'evaluated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  status public.interview_status NOT NULL DEFAULT 'pending',
  overall_score INTEGER,
  overall_feedback TEXT,
  overall_improvements JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview responses table
CREATE TABLE IF NOT EXISTS public.interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  video_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  ai_score INTEGER,
  ai_feedback TEXT,
  ai_improvements JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_responses_interview_id ON public.interview_responses(interview_id);

-- RLS Policies
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses ENABLE ROW LEVEL SECURITY;

-- Interviews: employers can see interviews for their jobs
CREATE POLICY "Employers can view interviews for their jobs"
  ON public.interviews FOR SELECT
  USING (
    job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
    OR candidate_id = auth.uid()
  );

-- Interviews: employers can create interviews for their jobs
CREATE POLICY "Employers can create interviews for their jobs"
  ON public.interviews FOR INSERT
  WITH CHECK (
    job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
  );

-- Interviews: employers can update interviews for their jobs
CREATE POLICY "Employers can update interviews for their jobs"
  ON public.interviews FOR UPDATE
  USING (
    job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
    OR candidate_id = auth.uid()
  );

-- Responses: candidates can insert their own responses
CREATE POLICY "Candidates can insert their responses"
  ON public.interview_responses FOR INSERT
  WITH CHECK (
    interview_id IN (SELECT id FROM public.interviews WHERE candidate_id = auth.uid())
  );

-- Responses: both employer and candidate can view
CREATE POLICY "Users can view relevant responses"
  ON public.interview_responses FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM public.interviews
      WHERE candidate_id = auth.uid()
        OR job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
    )
  );

-- Responses: system can update (for AI scores)
CREATE POLICY "System can update responses"
  ON public.interview_responses FOR UPDATE
  USING (
    interview_id IN (
      SELECT id FROM public.interviews
      WHERE job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
        OR candidate_id = auth.uid()
    )
  );

-- Storage bucket for interview videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-videos',
  'interview-videos',
  false,
  104857600,  -- 100MB max
  ARRAY['video/webm', 'video/mp4', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for interview videos
CREATE POLICY "Users can upload their interview videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'interview-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view relevant interview videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'interview-videos');

CREATE POLICY "Users can delete their own interview videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'interview-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
