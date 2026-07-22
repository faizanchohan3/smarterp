import { lazy, Suspense } from "react";
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
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const CustomerForm = lazy(() => import("./pages/CustomerForm"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Employees = lazy(() => import("./pages/Employees"));
const Categories = lazy(() => import("./pages/Categories"));
const Products = lazy(() => import("./pages/Products"));
const Sales = lazy(() => import("./pages/Sales"));
const SaleDetail = lazy(() => import("./pages/SaleDetail"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Ledger = lazy(() => import("./pages/Ledger"));
const Payments = lazy(() => import("./pages/Payments"));
const GoldPurityTest = lazy(() => import("./pages/GoldPurityTest"));
const GoldRates = lazy(() => import("./pages/GoldRates"));
const GoldRateReport = lazy(() => import("./pages/GoldRateReport"));
const ReportProfitLoss = lazy(() => import("./pages/reports/ReportProfitLoss"));
const ReportBalanceSheet = lazy(() => import("./pages/reports/ReportBalanceSheet"));
const ReportGoldProfit = lazy(() => import("./pages/reports/ReportGoldProfit"));
const ReportReceivables = lazy(() => import("./pages/reports/ReportReceivables"));
const SalesReport = lazy(() => import("./pages/SalesReport"));
const ReportPayables = lazy(() => import("./pages/reports/ReportPayables"));
const ReportSales = lazy(() => import("./pages/reports/ReportSales"));
const ReportPurchases = lazy(() => import("./pages/reports/ReportPurchases"));
const ReportExpenses = lazy(() => import("./pages/reports/ReportExpenses"));
const ReportInventory = lazy(() => import("./pages/reports/ReportInventory"));
const ReportCustomers = lazy(() => import("./pages/reports/ReportCustomers"));
const ReportSuppliers = lazy(() => import("./pages/reports/ReportSuppliers"));
const ReportSalaries = lazy(() => import("./pages/reports/ReportSalaries"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminShopsEnhanced = lazy(() => import("./pages/admin/AdminShopsEnhanced"));
const AdminUsersEnhanced = lazy(() => import("./pages/admin/AdminUsersEnhanced"));
const Settings = lazy(() => import("./pages/Settings"));
const ChartOfAccounts = lazy(() => import("./pages/ChartOfAccounts"));
const Karigars = lazy(() => import("./pages/Karigars"));
const Repairs = lazy(() => import("./pages/Repairs"));
const CustomOrders = lazy(() => import("./pages/CustomOrders"));
const CustomOrderDetail = lazy(() => import("./pages/CustomOrderDetail"));

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
