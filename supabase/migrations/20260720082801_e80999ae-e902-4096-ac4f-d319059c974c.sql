
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('none','free_trial','active','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS lemon_subscription_id text,
  ADD COLUMN IF NOT EXISTS lemon_customer_id text;

CREATE INDEX IF NOT EXISTS profiles_lemon_subscription_id_idx
  ON public.profiles(lemon_subscription_id);
CREATE INDEX IF NOT EXISTS profiles_lemon_customer_id_idx
  ON public.profiles(lemon_customer_id);

-- Update the new-user trigger to start a 7-day free trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    'free_trial',
    now() + interval '7 days'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner');
  RETURN NEW;
END; $function$;

-- Backfill existing profiles with no status
UPDATE public.profiles
SET subscription_status = 'free_trial',
    trial_ends_at = COALESCE(trial_ends_at, created_at + interval '7 days')
WHERE subscription_status = 'none';
