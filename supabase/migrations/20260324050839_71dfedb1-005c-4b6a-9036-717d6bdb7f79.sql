
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS current_round integer NOT NULL DEFAULT 1;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS selected_for_round2 boolean NOT NULL DEFAULT false;
