-- Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business accounts"
  ON public.chart_of_accounts FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own business accounts"
  ON public.chart_of_accounts FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own business accounts"
  ON public.chart_of_accounts FOR UPDATE
  USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own business accounts"
  ON public.chart_of_accounts FOR DELETE
  USING (business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can view all accounts"
  ON public.chart_of_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));
