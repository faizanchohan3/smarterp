ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'repair';
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS service_charge NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS item_photo_url TEXT;
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS customer_phone_snapshot TEXT;
