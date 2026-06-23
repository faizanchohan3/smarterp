ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sale_id uuid;
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);