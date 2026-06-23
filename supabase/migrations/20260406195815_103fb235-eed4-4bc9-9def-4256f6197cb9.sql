
-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_admin', 'staff');

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  reference TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  weight_value NUMERIC(12,4),
  weight_unit TEXT CHECK (weight_unit IN ('gram', 'milligram')),
  stock_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'partial' CHECK (payment_status IN ('full', 'partial', 'unpaid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'partial' CHECK (payment_status IN ('full', 'partial', 'unpaid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase items table
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('customer_payment', 'supplier_payment')),
  reference_id UUID,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger entries table
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('customer', 'supplier')),
  reference_id UUID NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT,
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salaries table
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.user_roles
  WHERE user_id = _user_id AND business_id IS NOT NULL
  LIMIT 1
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- BUSINESSES policies
CREATE POLICY "Owners can view own business" ON public.businesses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Super admins can view all businesses" ON public.businesses FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update all businesses" ON public.businesses FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated users can create business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Business members can view their business" ON public.businesses FOR SELECT USING (id = public.get_user_business_id(auth.uid()));

-- Business-scoped data policies (customers, suppliers, employees, categories, products, sales, purchases, expenses, payments, ledger, salaries)
-- Each table: business members can CRUD their own business data

CREATE POLICY "Business members can view customers" ON public.customers FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage customers" ON public.customers FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view suppliers" ON public.suppliers FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage suppliers" ON public.suppliers FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view employees" ON public.employees FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage employees" ON public.employees FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view categories" ON public.categories FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage categories" ON public.categories FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view products" ON public.products FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage products" ON public.products FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view sales" ON public.sales FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage sales" ON public.sales FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view sale_items" ON public.sale_items FOR SELECT USING (sale_id IN (SELECT id FROM public.sales WHERE business_id = public.get_user_business_id(auth.uid())));
CREATE POLICY "Business members can manage sale_items" ON public.sale_items FOR ALL USING (sale_id IN (SELECT id FROM public.sales WHERE business_id = public.get_user_business_id(auth.uid())));

CREATE POLICY "Business members can view purchases" ON public.purchases FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage purchases" ON public.purchases FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view purchase_items" ON public.purchase_items FOR SELECT USING (purchase_id IN (SELECT id FROM public.purchases WHERE business_id = public.get_user_business_id(auth.uid())));
CREATE POLICY "Business members can manage purchase_items" ON public.purchase_items FOR ALL USING (purchase_id IN (SELECT id FROM public.purchases WHERE business_id = public.get_user_business_id(auth.uid())));

CREATE POLICY "Business members can view expenses" ON public.expenses FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage expenses" ON public.expenses FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view payments" ON public.payments FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage payments" ON public.payments FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view ledger" ON public.ledger_entries FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage ledger" ON public.ledger_entries FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

CREATE POLICY "Business members can view salaries" ON public.salaries FOR SELECT USING (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Business members can manage salaries" ON public.salaries FOR ALL USING (business_id = public.get_user_business_id(auth.uid()));

-- Super admin can view all business data
CREATE POLICY "Super admins can view all customers" ON public.customers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all suppliers" ON public.suppliers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all employees" ON public.employees FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all sales" ON public.sales FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all purchases" ON public.purchases FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can view all expenses" ON public.expenses FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
