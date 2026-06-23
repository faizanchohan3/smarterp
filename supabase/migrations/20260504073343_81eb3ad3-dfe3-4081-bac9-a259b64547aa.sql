CREATE TABLE public.gold_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tola_24k NUMERIC NOT NULL DEFAULT 0,
  tola_22k NUMERIC NOT NULL DEFAULT 0,
  tola_21k NUMERIC NOT NULL DEFAULT 0,
  tola_18k NUMERIC NOT NULL DEFAULT 0,
  silver_tola NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gold_rates_business_date ON public.gold_rates(business_id, rate_date DESC);

ALTER TABLE public.gold_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their business gold rates" ON public.gold_rates
  FOR SELECT USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users insert their business gold rates" ON public.gold_rates
  FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users update their business gold rates" ON public.gold_rates
  FOR UPDATE USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users delete their business gold rates" ON public.gold_rates
  FOR DELETE USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE TRIGGER update_gold_rates_updated_at
  BEFORE UPDATE ON public.gold_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();