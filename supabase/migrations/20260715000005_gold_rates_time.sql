ALTER TABLE public.gold_rates ADD COLUMN IF NOT EXISTS rate_time TIME;
ALTER TABLE public.gold_rates ADD COLUMN IF NOT EXISTS rate_type TEXT CHECK (rate_type IN ('morning','afternoon','evening','night')) DEFAULT 'morning';
