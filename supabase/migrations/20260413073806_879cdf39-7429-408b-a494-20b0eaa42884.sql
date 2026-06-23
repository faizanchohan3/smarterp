
-- Add logo_url and address to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address text;

-- Add polish_waste and tola_rate to sale_items for gold pricing
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS polish_waste numeric NOT NULL DEFAULT 0;

-- Add tola_rate to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tola_rate numeric NOT NULL DEFAULT 0;
