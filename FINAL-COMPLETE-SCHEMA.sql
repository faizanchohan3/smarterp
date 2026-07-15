-- ==================== FINAL COMPLETE SMARTERP SCHEMA ====================
-- This is the COMPLETE schema with ALL columns, ALL fixes, ALL buckets
-- Run this ONCE and your database will be 100% ready
-- Copy everything and paste in Supabase SQL Editor

-- ==================== STEP 1: DROP ALL EXISTING TABLES (CLEAN SLATE) ====================

DROP TABLE IF EXISTS public.custom_orders CASCADE;
DROP TABLE IF EXISTS public.job_cards CASCADE;
DROP TABLE IF EXISTS public.karigar_ledger CASCADE;
DROP TABLE IF EXISTS public.employee_ledger CASCADE;
DROP TABLE IF EXISTS public.salaries CASCADE;
DROP TABLE IF EXISTS public.ledger_entries CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.gold_rates CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.purchase_items CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.karigars CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;

-- ==================== STEP 2: CREATE ALL TABLES WITH ALL COLUMNS ====================

-- BUSINESSES & AUTH
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  owner_id UUID,
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.businesses FOR ALL USING (true);
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.profiles FOR ALL USING (true);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'business_admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.user_roles FOR ALL USING (true);

-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  alt_phone TEXT,
  email TEXT,
  reference TEXT,
  reference_phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  photo_url TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.customers FOR ALL USING (true);
CREATE INDEX idx_customers_business_id ON public.customers(business_id);

-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  alt_phone TEXT,
  email TEXT,
  reference TEXT,
  reference_phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  photo_url TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.suppliers FOR ALL USING (true);
CREATE INDEX idx_suppliers_business_id ON public.suppliers(business_id);

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.categories FOR ALL USING (true);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC(12,4),
  weight_value NUMERIC(12,4),
  weight_unit TEXT DEFAULT 'gram',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(12,4) NOT NULL DEFAULT 0,
  image_url TEXT,
  photo_url TEXT,
  serial_number TEXT,
  purity_karat INTEGER,
  gross_weight NUMERIC(12,4),
  net_weight NUMERIC(12,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.products FOR ALL USING (true);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE UNIQUE INDEX idx_products_business_serial ON public.products(business_id, serial_number) WHERE serial_number IS NOT NULL;

-- EMPLOYEES
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  position TEXT,
  salary NUMERIC(12,2),
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.employees FOR ALL USING (true);
CREATE INDEX idx_employees_business_id ON public.employees(business_id);

-- KARIGARS
CREATE TABLE public.karigars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  specialty TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.karigars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.karigars FOR ALL USING (true);
CREATE INDEX idx_karigars_business_id ON public.karigars(business_id);

-- SALES
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  final_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tola_rate NUMERIC(12,2),
  notes TEXT,
  notes_internal TEXT,
  discount_amount NUMERIC(12,2),
  discount NUMERIC(12,2),
  payment_status TEXT DEFAULT 'unpaid',
  repayment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.sales FOR ALL USING (true);
CREATE INDEX idx_sales_business_id ON public.sales(business_id);
CREATE INDEX idx_sales_invoice_number ON public.sales(invoice_number);

-- SALE ITEMS
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
  weight NUMERIC(12,4),
  weight_unit TEXT DEFAULT 'gram',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  polish_waste NUMERIC(12,2),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  purity_karat INTEGER,
  gross_weight NUMERIC(12,4),
  net_weight NUMERIC(12,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.sale_items FOR ALL USING (true);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

-- PURCHASES
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  purchase_number TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  notes_internal TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'returned', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.purchases FOR ALL USING (true);
CREATE INDEX idx_purchases_business_id ON public.purchases(business_id);
CREATE INDEX idx_purchases_purchase_number ON public.purchases(purchase_number);

-- PURCHASE ITEMS
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
  weight NUMERIC(12,4),
  weight_unit TEXT DEFAULT 'gram',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.purchase_items FOR ALL USING (true);

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  notes_internal TEXT,
  date DATE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.expenses FOR ALL USING (true);
CREATE INDEX idx_expenses_business_id ON public.expenses(business_id);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  custom_order_id UUID,
  reference_id UUID,
  reference_type TEXT,
  type TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  received_by TEXT,
  notes TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.payments FOR ALL USING (true);
CREATE INDEX idx_payments_business_id ON public.payments(business_id);

-- GOLD RATES
CREATE TABLE public.gold_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rate_date DATE NOT NULL,
  rate_time TIME,
  tola_rate NUMERIC(12,2) NOT NULL,
  gram_rate NUMERIC(12,2),
  silver_tola NUMERIC(12,2),
  tola_18k NUMERIC(12,2),
  tola_21k NUMERIC(12,2),
  tola_22k NUMERIC(12,2),
  tola_24k NUMERIC(12,2),
  rate_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gold_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.gold_rates FOR ALL USING (true);
CREATE INDEX idx_gold_rates_business_id ON public.gold_rates(business_id);

-- CHART OF ACCOUNTS
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  description TEXT,
  notes TEXT,
  opening_balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.chart_of_accounts FOR ALL USING (true);
CREATE INDEX idx_chart_of_accounts_business_id ON public.chart_of_accounts(business_id);

-- LEDGER ENTRIES
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  entry_type TEXT,
  reference_type TEXT,
  reference_id UUID,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.ledger_entries FOR ALL USING (true);
CREATE INDEX idx_ledger_entries_business_id ON public.ledger_entries(business_id);

-- SALARIES
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month DATE,
  salary_month DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.salaries FOR ALL USING (true);
CREATE INDEX idx_salaries_business_id ON public.salaries(business_id);

-- EMPLOYEE LEDGER (New - for tracking employee transactions)
CREATE TABLE public.employee_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reference_type TEXT,
  reference_id UUID,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.employee_ledger FOR ALL USING (true);
CREATE INDEX idx_employee_ledger_business_id ON public.employee_ledger(business_id);
CREATE INDEX idx_employee_ledger_employee_id ON public.employee_ledger(employee_id);

-- CUSTOMER LEDGER (New - for tracking customer transactions)
CREATE TABLE public.customer_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reference_type TEXT,
  reference_id UUID,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.customer_ledger FOR ALL USING (true);
CREATE INDEX idx_customer_ledger_business_id ON public.customer_ledger(business_id);
CREATE INDEX idx_customer_ledger_customer_id ON public.customer_ledger(customer_id);

-- KARIGAR LEDGER (New - for tracking karigar transactions)
CREATE TABLE public.karigar_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  karigar_id UUID NOT NULL REFERENCES public.karigars(id) ON DELETE CASCADE,
  reference_type TEXT,
  reference_id UUID,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.karigar_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.karigar_ledger FOR ALL USING (true);
CREATE INDEX idx_karigar_ledger_business_id ON public.karigar_ledger(business_id);
CREATE INDEX idx_karigar_ledger_karigar_id ON public.karigar_ledger(karigar_id);

-- JOB CARDS
CREATE TABLE public.job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  karigar_id UUID REFERENCES public.karigars(id) ON DELETE SET NULL,
  job_number TEXT NOT NULL,
  description TEXT,
  gold_given NUMERIC(12,4),
  gold_given_unit TEXT DEFAULT 'gram',
  given_date DATE,
  date_given DATE,
  weight_unit TEXT DEFAULT 'gram',
  making_charges NUMERIC(12,2) DEFAULT 0,
  karigar_charges NUMERIC(12,2) DEFAULT 0,
  service_type TEXT NOT NULL DEFAULT 'repair',
  service_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_photo_url TEXT,
  customer_phone_snapshot TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'ready', 'returned', 'cancelled')),
  expected_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON public.job_cards FOR ALL USING (true);
CREATE INDEX idx_job_cards_business_id ON public.job_cards(business_id);

-- CUSTOM ORDERS
CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  karigar_id UUID REFERENCES public.karigars(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_cost NUMERIC(12,2) DEFAULT 0,
  description TEXT NOT NULL,
  design_reference_url TEXT,
  estimated_weight NUMERIC(12,4),
  weight_unit TEXT NOT NULL DEFAULT 'gram',
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
CREATE POLICY "Enable all" ON public.custom_orders FOR ALL USING (true);
CREATE INDEX idx_custom_orders_business_id ON public.custom_orders(business_id);

-- ==================== STEP 3: CREATE STORAGE BUCKETS ====================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('customer-photos', 'customer-photos', true),
  ('supplier-photos', 'supplier-photos', true),
  ('product-images', 'product-images', true),
  ('shop-logos', 'shop-logos', true),
  ('job-card-photos', 'job-card-photos', true),
  ('design-reference', 'design-reference', true)
ON CONFLICT DO NOTHING;

-- ==================== STEP 4: CREATE STORAGE POLICIES ====================

DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (true);

-- ==================== STEP 5: CREATE HELPER FUNCTIONS ====================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== DONE ====================
-- ✅ ALL tables created with ALL columns
-- ✅ ALL storage buckets created
-- ✅ ALL policies set
-- ✅ System is 100% ready!
