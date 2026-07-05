CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  karigar_id UUID REFERENCES public.karigars(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  design_reference_url TEXT,
  estimated_weight NUMERIC(12,4),
  weight_unit TEXT NOT NULL DEFAULT 'gram' CHECK (weight_unit IN ('gram', 'milligram')),
  purity_karat INTEGER,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'ready', 'delivered', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivered_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage custom_orders" ON public.custom_orders
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS custom_order_id UUID REFERENCES public.custom_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_custom_order_id ON public.payments(custom_order_id);
