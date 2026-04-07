-- ============================================
-- TalentHub Phase 3: Jobs + Applications Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'remote');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE currency AS ENUM ('USD', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('applied', 'reviewed', 'shortlisted', 'interview', 'offered', 'rejected', 'hired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  job_type job_type,
  experience_level experience_level,
  skills JSONB DEFAULT '[]'::jsonb,
  salary_min INTEGER,
  salary_max INTEGER,
  currency currency DEFAULT 'USD',
  deadline TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url TEXT,
  status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);

-- 4. Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for jobs

-- Employers can do everything with their own jobs
CREATE POLICY "Employers can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = employer_id);

-- Candidates can view published jobs
CREATE POLICY "Candidates can view published jobs"
  ON public.jobs FOR SELECT
  USING (status = 'published');

-- 6. RLS Policies for applications

-- Candidates can view their own applications
CREATE POLICY "Candidates can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = candidate_id);

-- Candidates can apply to published jobs
CREATE POLICY "Candidates can apply to jobs"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = candidate_id
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_id AND status = 'published'
    )
  );

-- Employers can view applications for their jobs
CREATE POLICY "Employers can view applications for own jobs"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_id AND employer_id = auth.uid()
    )
  );

-- Employers can update application status for their jobs
CREATE POLICY "Employers can update applications for own jobs"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_id AND employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_id AND employer_id = auth.uid()
    )
  );

-- ============================================
-- Done! Jobs & Applications tables are ready.
-- ============================================
