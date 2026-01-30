-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.user_role AS ENUM ('student', 'startup');
CREATE TYPE public.application_status AS ENUM ('pending', 'scoring', 'reviewing', 'accepted', 'rejected');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'closed', 'filled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Profiles
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  bio TEXT,
  skills TEXT[],
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Workflows
CREATE TABLE public.company_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  email_on_decision BOOLEAN DEFAULT FALSE,
  acceptance_email_body TEXT,
  rejection_email_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  skills_required TEXT[],
  duration TEXT,
  compensation TEXT,
  location_type TEXT DEFAULT 'remote',
  location TEXT,
  status public.job_status DEFAULT 'open',
  deadline TIMESTAMP WITH TIME ZONE,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status public.application_status DEFAULT 'pending',
  score INTEGER,
  score_breakdown JSONB,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

-- Vector indexes for similarity search
CREATE INDEX IF NOT EXISTS jobs_embedding_idx
  ON public.jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS student_profiles_embedding_idx
  ON public.student_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
