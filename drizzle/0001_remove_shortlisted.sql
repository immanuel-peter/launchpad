-- This migration handles removing 'shortlisted' from the enum
-- For fresh databases (where enum was created without 'shortlisted'), this is a no-op

DO $$
BEGIN
  -- Check if 'shortlisted' exists in the enum (meaning this is an upgrade from old schema)
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'shortlisted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
  ) THEN
    -- Update any rows with 'shortlisted' status (cast to text to avoid enum validation)
    UPDATE public.applications
    SET status = 'reviewing'::public.application_status
    WHERE status::text = 'shortlisted';
    
    -- Rename old enum
    ALTER TYPE public.application_status RENAME TO application_status_old;
    
    -- Create new enum without 'shortlisted'
    CREATE TYPE public.application_status AS ENUM ('pending', 'scoring', 'reviewing', 'accepted', 'rejected');
    
    -- Update column to use new enum
    ALTER TABLE public.applications
      ALTER COLUMN status DROP DEFAULT,
      ALTER COLUMN status TYPE public.application_status USING status::text::public.application_status,
      ALTER COLUMN status SET DEFAULT 'pending';
    
    -- Drop old enum
    DROP TYPE public.application_status_old;
  ELSE
    -- Enum already doesn't have 'shortlisted', so this migration is a no-op
    RAISE NOTICE 'Enum already does not contain ''shortlisted'', skipping migration';
  END IF;
END $$;
