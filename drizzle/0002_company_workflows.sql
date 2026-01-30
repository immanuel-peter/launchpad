-- This migration adds the company_workflows table
-- It's idempotent - if the table already exists (from 0000_init.sql), it will be skipped

CREATE TABLE IF NOT EXISTS public.company_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  email_on_decision BOOLEAN DEFAULT FALSE,
  acceptance_email_body TEXT,
  rejection_email_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
