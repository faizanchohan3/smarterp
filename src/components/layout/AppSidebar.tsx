import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Truck, Package, Tag, ShoppingCart, Receipt,
  Wallet, BookOpen, CreditCard, UserCog, LogOut, Building2,
  BarChart3, TrendingUp, ArrowDownCircle, ArrowUpCircle, ClipboardList,
  ChevronDown, Sparkles, FlaskConical, Coins, Settings, FileSpreadsheet,
  Hammer, Wrench, Gem
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import goldLogo from "@/assets/gold-logo.png";

const shopMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "from-amber-400 to-orange-500" },
  { label: "Customers", icon: Users, path: "/customers", color: "from-sky-400 to-blue-500" },
  { label: "Suppliers", icon: Truck, path: "/suppliers", color: "from-emerald-400 to-teal-500" },
  { label: "Employees", icon: UserCog, path: "/employees", color: "from-violet-400 to-purple-500" },
  { label: "Categories", icon: Tag, path: "/categories", color: "from-pink-400 to-rose-500" },
  { label: "Products", icon: Package, path: "/products", color: "from-cyan-400 to-blue-500" },
  { label: "Gold Purity Test", icon: FlaskConical, path: "/gold-purity-test", color: "from-yellow-400 to-amber-600" },
  { label: "Gold Rates", icon: Coins, path: "/gold-rates", color: "from-amber-500 to-yellow-600" },
  { label: "Gold Rate Report", icon: FileSpreadsheet, path: "/gold-rate-report", color: "from-yellow-500 to-amber-600" },
  { label: "Sales", icon: ShoppingCart, path: "/sales", color: "from-amber-400 to-yellow-500" },
  { label: "Sales Report", icon: BarChart3, path: "/sales-report", color: "from-amber-500 to-orange-500" },
  { label: "Purchases", icon: Receipt, path: "/purchases", color: "from-fuchsia-400 to-pink-500" },
  { label: "Expenses", icon: Wallet, path: "/expenses", color: "from-rose-400 to-red-500" },
  { label: "Ledger", icon: BookOpen, path: "/ledger", color: "from-indigo-400 to-violet-500" },
  { label: "Payments", icon: CreditCard, path: "/payments", color: "from-teal-400 to-cyan-500" },
  { label: "Chart of Accounts", icon: FileSpreadsheet, path: "/chart-of-accounts", color: "from-slate-400 to-gray-500" },
];

const serviceMenuItems = [
  { label: "Karigars", icon: Hammer, path: "/karigars" },
  { label: "Repairs", icon: Wrench, path: "/repairs" },
  { label: "Custom Orders", icon: Gem, path: "/custom-orders" },
];

const reportMenuItems = [
  { label: "Profit & Loss", icon: TrendingUp, path: "/reports/profit-loss" },
  { label: "Balance Sheet", icon: FileSpreadsheet, path: "/reports/balance-sheet" },
  { label: "Receivables", icon: ArrowDownCircle, path: "/reports/receivables" },
  { label: "Payables", icon: ArrowUpCircle, path: "/reports/payables" },
  { label: "Sales Report", icon: ShoppingCart, path: "/reports/sales" },
  { label: "Purchases Report", icon: Receipt, path: "/reports/purchases" },
  { label: "Expenses Report", icon: Wallet, path: "/reports/expenses" },
  { label: "Inventory", icon: Package, path: "/reports/inventory" },
  { label: "Customers", icon: Users, path: "/reports/customers" },
  { label: "Suppliers", icon: Truck, path: "/reports/suppliers" },
  { label: "Salaries", icon: ClipboardList, path: "/reports/salaries" },
];

const adminMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", color: "from-amber-400 to-orange-500" },
  { label: "Shops", icon: Building2, path: "/admin/shops", color: "from-sky-400 to-blue-500" },
  { label: "Users", icon: Users, path: "/admin/users", color: "from-violet-400 to-purple-500" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const { role, signOut, user, shopName, ownerName, shopLogo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = role === "super_admin";
  const menuItems = isAdmin ? adminMenuItems : shopMenuItems;
  const isReportsOpen = location.pathname.startsWith("/reports");
  const isServiceOpen = location.pathname.startsWith("/karigars") || location.pathname.startsWith("/repairs") || location.pathname.startsWith("/custom-orders");
  const [reportsOpen, setReportsOpen] = useState(isReportsOpen);
  const [serviceOpen, setServiceOpen] = useState(isServiceOpen);

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const NavButton = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.path}
        onClick={() => go(item.path)}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative overflow-hidden",
          isActive
            ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-100 font-semibold shadow-inner"
            : "text-sidebar-muted hover:text-amber-100 hover:bg-white/5"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-gradient-to-b from-amber-300 to-orange-500" />
        )}
        <span className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-300 bg-gradient-to-br",
          isActive
            ? `${item.color} text-white shadow-lg shadow-amber-500/30`
            : "bg-white/5 text-sidebar-muted group-hover:scale-110 group-hover:text-amber-200 group-hover:shadow-md"
        )}>
          <item.icon className="w-4 h-4" />
        </span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 h-full bg-gradient-sidebar flex flex-col border-r border-sidebar-border print:hidden">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {shopLogo ? (
            <Avatar className="w-11 h-11 rounded-xl ring-2 ring-amber-400/40 shadow-gold">
              <AvatarImage src={shopLogo} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-gradient-gold text-amber-950 font-bold">
                {(ownerName || "S")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-11 h-11 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold ring-2 ring-amber-300/30">
              <img src={goldLogo} alt="Gold ERP" className="w-9 h-9 object-contain" loading="lazy" width={512} height={512} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-amber-100 truncate tracking-wide">
              {isAdmin ? "Admin Panel" : (shopName || "Gold ERP")}
            </h1>
            <p className="text-[11px] text-amber-200/60 truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isAdmin ? "Super Admin" : (ownerName || "Jewellery System")}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavButton key={item.path} item={item} />
        ))}

        {!isAdmin && (
          <Collapsible open={serviceOpen} onOpenChange={setServiceOpen}>
            <CollapsibleTrigger className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isServiceOpen
                ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-100 font-semibold"
                : "text-sidebar-muted hover:text-amber-100 hover:bg-white/5"
            )}>
              <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br",
                isServiceOpen ? "from-purple-400 to-fuchsia-600 text-white shadow-lg" : "bg-white/5"
              )}>
                <Wrench className="w-4 h-4" />
              </span>
              Repairs & Orders
              <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform", serviceOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
              {serviceMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all",
                      isActive
                        ? "bg-amber-500/20 text-amber-100 font-semibold"
                        : "text-sidebar-muted hover:bg-white/5 hover:text-amber-100"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isAdmin && (
          <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
            <CollapsibleTrigger className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isReportsOpen
                ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-100 font-semibold"
                : "text-sidebar-muted hover:text-amber-100 hover:bg-white/5"
            )}>
              <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br",
                isReportsOpen ? "from-fuchsia-400 to-purple-600 text-white shadow-lg" : "bg-white/5"
              )}>
                <BarChart3 className="w-4 h-4" />
              </span>
              Reports
              <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform", reportsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
              {reportMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all",
                      isActive
                        ? "bg-amber-500/20 text-amber-100 font-semibold"
                        : "text-sidebar-muted hover:bg-white/5 hover:text-amber-100"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-[11px] text-amber-200/60 truncate">{user?.email}</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => go("/settings")}
            className={cn(
              "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1",
              location.pathname === "/settings"
                ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-100 font-semibold"
                : "text-sidebar-muted hover:text-amber-100 hover:bg-white/5"
            )}
          >
            <span className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br transition-all",
              location.pathname === "/settings"
                ? "from-slate-400 to-slate-600 text-white shadow-lg"
                : "bg-white/5 text-sidebar-muted group-hover:text-amber-200"
            )}>
              <Settings className="w-4 h-4" />
            </span>
            Settings
          </button>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-200 hover:bg-rose-500/15 hover:text-rose-100 transition-all"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/15">
            <LogOut className="w-4 h-4" />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
