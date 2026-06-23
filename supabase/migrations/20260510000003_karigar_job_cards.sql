-- Karigars (craftsmen / artisans)
CREATE TABLE IF NOT EXISTS public.karigars (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  address      TEXT,
  specialty    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.karigars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage karigars" ON public.karigars
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Job Cards (work orders issued to karigars)
CREATE TABLE IF NOT EXISTS public.job_cards (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_number        TEXT NOT NULL,
  karigar_id        UUID REFERENCES karigars(id),
  customer_id       UUID REFERENCES customers(id),
  description       TEXT NOT NULL,
  gold_given        NUMERIC NOT NULL DEFAULT 0,
  gold_given_unit   TEXT NOT NULL DEFAULT 'gram',
  gold_returned     NUMERIC DEFAULT 0,
  gold_returned_unit TEXT DEFAULT 'gram',
  making_charges    NUMERIC DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending',
  given_date        DATE,
  expected_date     DATE,
  returned_date     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage job_cards" ON public.job_cards
  FOR ALL USING (
    business_id IN (SELECT business_id FROM public.user_roles WHERE user_id = auth.uid())
  );
