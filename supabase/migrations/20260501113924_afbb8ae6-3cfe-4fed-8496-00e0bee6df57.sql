ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS weight numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS weight_unit text NOT NULL DEFAULT 'gram';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS repayment_date date;