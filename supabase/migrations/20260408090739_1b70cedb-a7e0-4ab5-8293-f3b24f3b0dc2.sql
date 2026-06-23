
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS reference_phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS photo_url text;
