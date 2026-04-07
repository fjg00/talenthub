-- ============================================
-- TalentHub: Supabase Setup SQL
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. Create enums (must match Drizzle schema)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('candidate', 'employer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM ('open', 'not_looking', 'open_to_offers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'candidate',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  experience_years INTEGER,
  education TEXT,
  location TEXT,
  cv_url TEXT,
  linkedin_url TEXT,
  phone TEXT,
  availability_status availability_status DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  company_description TEXT,
  company_website TEXT,
  company_size company_size,
  industry TEXT,
  location TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trigger function: auto-create profile + role-specific profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
  v_full_name TEXT;
  v_email TEXT;
  v_company TEXT;
BEGIN
  -- Extract metadata from signup
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'candidate'
  );
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',       -- OAuth providers use 'name'
    split_part(NEW.email, '@', 1)
  );
  v_email := COALESCE(NEW.email, '');

  -- Create the base profile
  INSERT INTO public.profiles (id, role, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    v_role,
    v_full_name,
    v_email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create role-specific profile
  IF v_role = 'employer' THEN
    v_company := NEW.raw_user_meta_data->>'company_name';
    INSERT INTO public.employer_profiles (user_id, company_name)
    VALUES (NEW.id, v_company);
  ELSE
    INSERT INTO public.candidate_profiles (user_id, linkedin_url)
    VALUES (
      NEW.id,
      -- If signed up via LinkedIn, store their profile URL
      CASE
        WHEN NEW.raw_app_meta_data->>'provider' = 'linkedin_oidc'
        THEN NEW.raw_user_meta_data->>'custom_claims'
        ELSE NULL
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- candidate_profiles: candidates manage their own, employers can view any
CREATE POLICY "Candidates can view own profile"
  ON public.candidate_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can view candidate profiles"
  ON public.candidate_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- employer_profiles: employers manage their own, candidates can view any
CREATE POLICY "Employers can view own profile"
  ON public.employer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can view employer profiles"
  ON public.employer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'candidate'
    )
  );

CREATE POLICY "Employers can update own profile"
  ON public.employer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Storage bucket for CVs (run separately if bucket doesn't exist)
-- Note: You may need to create the bucket via Dashboard > Storage > New Bucket
-- Name: cv-uploads, Private, Max file size: 10MB

-- Storage policies for cv-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760,  -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload CVs to their own folder
CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own CVs
CREATE POLICY "Users can view own CV"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own CVs
CREATE POLICY "Users can delete own CV"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- Done! Your database is ready.
--
-- Next steps:
-- 1. Go to Authentication > Providers and enable:
--    - Email (already enabled by default)
--    - Google
--    - LinkedIn (OIDC)
-- 2. Go to Authentication > URL Configuration:
--    - Site URL: http://localhost:3000
--    - Redirect URLs: http://localhost:3000/api/auth/callback
-- 3. Fill in .env.local with your project credentials
-- 4. Run: npm run dev
-- ============================================
