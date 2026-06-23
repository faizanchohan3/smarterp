-- Add customer purchase support to purchases table
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'supplier',
  ADD COLUMN IF NOT EXISTS add_to_stock BOOLEAN NOT NULL DEFAULT true;

-- Create purchase_sales table: tracks when a purchased item is later resold
CREATE TABLE IF NOT EXISTS purchase_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  sold_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sold_to TEXT NOT NULL DEFAULT 'customer',   -- 'customer' or 'vendor'
  customer_id UUID REFERENCES customers(id),
  vendor_name TEXT,
  notes TEXT,
  profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE purchase_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can manage purchase_sales"
  ON purchase_sales FOR ALL
  USING (
    business_id IN (
      SELECT get_user_business_id(auth.uid())
    )
  );
