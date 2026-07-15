import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerForm from "./pages/CustomerForm";
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import SaleDetail from "./pages/SaleDetail";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Ledger from "./pages/Ledger";
import Payments from "./pages/Payments";
import GoldPurityTest from "./pages/GoldPurityTest";
import GoldRates from "./pages/GoldRates";
import GoldRateReport from "./pages/GoldRateReport";
import ReportProfitLoss from "./pages/reports/ReportProfitLoss";
import ReportReceivables from "./pages/reports/ReportReceivables";
import SalesReport from "./pages/SalesReport";
import ReportPayables from "./pages/reports/ReportPayables";
import ReportSales from "./pages/reports/ReportSales";
import ReportPurchases from "./pages/reports/ReportPurchases";
import ReportExpenses from "./pages/reports/ReportExpenses";
import ReportInventory from "./pages/reports/ReportInventory";
import ReportCustomers from "./pages/reports/ReportCustomers";
import ReportSuppliers from "./pages/reports/ReportSuppliers";
import ReportSalaries from "./pages/reports/ReportSalaries";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShopsEnhanced from "./pages/admin/AdminShopsEnhanced";
import AdminUsersEnhanced from "./pages/admin/AdminUsersEnhanced";
import Settings from "./pages/Settings";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Karigars from "./pages/Karigars";
import Repairs from "./pages/Repairs";
import CustomOrders from "./pages/CustomOrders";
import CustomOrderDetail from "./pages/CustomOrderDetail";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, role, businessStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (role === "super_admin") {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/shops" element={<AdminShopsEnhanced />} />
        <Route path="/admin/users" element={<AdminUsersEnhanced />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  if (businessStatus !== "approved") return <PendingApproval />;

  return (
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
