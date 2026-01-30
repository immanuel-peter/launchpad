UPDATE public.applications
SET status = 'reviewing'
WHERE status = 'shortlisted';

ALTER TYPE public.application_status RENAME TO application_status_old;

CREATE TYPE public.application_status AS ENUM ('pending', 'scoring', 'reviewing', 'accepted', 'rejected');

ALTER TABLE public.applications
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.application_status USING status::text::public.application_status,
  ALTER COLUMN status SET DEFAULT 'pending';

DROP TYPE public.application_status_old;
