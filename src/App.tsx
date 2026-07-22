import { Suspense } from "react";
import { lazyRetry } from "@/lib/lazyRetry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Every other page is loaded on demand (route-based code splitting) instead
// of all ~40 pages being bundled into one huge upfront JS file — that was
// the biggest contributor to the app feeling slow, especially on first load
// and on slower connections, since the browser had to download and parse
// every page's code before showing even the login/dashboard screen.
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const Customers = lazyRetry(() => import("./pages/Customers"));
const CustomerDetail = lazyRetry(() => import("./pages/CustomerDetail"));
const CustomerForm = lazyRetry(() => import("./pages/CustomerForm"));
const Suppliers = lazyRetry(() => import("./pages/Suppliers"));
const Employees = lazyRetry(() => import("./pages/Employees"));
const Categories = lazyRetry(() => import("./pages/Categories"));
const Products = lazyRetry(() => import("./pages/Products"));
const Sales = lazyRetry(() => import("./pages/Sales"));
const SaleDetail = lazyRetry(() => import("./pages/SaleDetail"));
const Purchases = lazyRetry(() => import("./pages/Purchases"));
const Expenses = lazyRetry(() => import("./pages/Expenses"));
const Ledger = lazyRetry(() => import("./pages/Ledger"));
const Payments = lazyRetry(() => import("./pages/Payments"));
const GoldPurityTest = lazyRetry(() => import("./pages/GoldPurityTest"));
const GoldRates = lazyRetry(() => import("./pages/GoldRates"));
const GoldRateReport = lazyRetry(() => import("./pages/GoldRateReport"));
const ReportProfitLoss = lazyRetry(() => import("./pages/reports/ReportProfitLoss"));
const ReportBalanceSheet = lazyRetry(() => import("./pages/reports/ReportBalanceSheet"));
const ReportGoldProfit = lazyRetry(() => import("./pages/reports/ReportGoldProfit"));
const ReportReceivables = lazyRetry(() => import("./pages/reports/ReportReceivables"));
const SalesReport = lazyRetry(() => import("./pages/SalesReport"));
const ReportPayables = lazyRetry(() => import("./pages/reports/ReportPayables"));
const ReportSales = lazyRetry(() => import("./pages/reports/ReportSales"));
const ReportPurchases = lazyRetry(() => import("./pages/reports/ReportPurchases"));
const ReportExpenses = lazyRetry(() => import("./pages/reports/ReportExpenses"));
const ReportInventory = lazyRetry(() => import("./pages/reports/ReportInventory"));
const ReportCustomers = lazyRetry(() => import("./pages/reports/ReportCustomers"));
const ReportSuppliers = lazyRetry(() => import("./pages/reports/ReportSuppliers"));
const ReportSalaries = lazyRetry(() => import("./pages/reports/ReportSalaries"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminShopsEnhanced = lazyRetry(() => import("./pages/admin/AdminShopsEnhanced"));
const AdminUsersEnhanced = lazyRetry(() => import("./pages/admin/AdminUsersEnhanced"));
const Settings = lazyRetry(() => import("./pages/Settings"));
const ChartOfAccounts = lazyRetry(() => import("./pages/ChartOfAccounts"));
const Karigars = lazyRetry(() => import("./pages/Karigars"));
const Repairs = lazyRetry(() => import("./pages/Repairs"));
const CustomOrders = lazyRetry(() => import("./pages/CustomOrders"));
const CustomOrderDetail = lazyRetry(() => import("./pages/CustomOrderDetail"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const AppRoutes = () => {
  const { user, role, businessStatus, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </Suspense>
    );
  }

  if (role === "super_admin") {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/shops" element={<AdminShopsEnhanced />} />
          <Route path="/admin/users" element={<AdminUsersEnhanced />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (businessStatus !== "approved") return <PendingApproval />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/:id" element={<SaleDetail />} />
        <Route path="/sales-report" element={<SalesReport />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/gold-purity-test" element={<GoldPurityTest />} />
        <Route path="/gold-rates" element={<GoldRates />} />
        <Route path="/gold-rate-report" element={<GoldRateReport />} />
        <Route path="/reports" element={<Navigate to="/reports/profit-loss" replace />} />
        <Route path="/reports/profit-loss" element={<ReportProfitLoss />} />
        <Route path="/reports/balance-sheet" element={<ReportBalanceSheet />} />
        <Route path="/reports/gold-profit" element={<ReportGoldProfit />} />
        <Route path="/reports/receivables" element={<ReportReceivables />} />
        <Route path="/reports/payables" element={<ReportPayables />} />
        <Route path="/reports/sales" element={<ReportSales />} />
        <Route path="/reports/purchases" element={<ReportPurchases />} />
        <Route path="/reports/expenses" element={<ReportExpenses />} />
        <Route path="/reports/inventory" element={<ReportInventory />} />
        <Route path="/reports/customers" element={<ReportCustomers />} />
        <Route path="/reports/suppliers" element={<ReportSuppliers />} />
        <Route path="/reports/salaries" element={<ReportSalaries />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/karigars" element={<Karigars />} />
        <Route path="/repairs" element={<Repairs />} />
        <Route path="/custom-orders" element={<CustomOrders />} />
        <Route path="/custom-orders/:id" element={<CustomOrderDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
