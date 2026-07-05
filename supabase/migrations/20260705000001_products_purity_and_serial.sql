ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purity_karat INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(12,4);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS net_weight NUMERIC(12,4);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serial_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_serial
  ON public.products(business_id, serial_number)
  WHERE serial_number IS NOT NULL;
