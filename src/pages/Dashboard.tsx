import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Receipt, Wallet, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, BellRing } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/currency";
import { formatRateTime } from "@/lib/gold";
import { toast } from "sonner";

const Dashboard = () => {
  const { businessId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ sales: 0, purchases: 0, expenses: 0, profit: 0, receivable: 0, payable: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [latestRate, setLatestRate] = useState<any>(null);

  useEffect(() => {
    if (!businessId) return;
    const fetchRate = async () => {
      const { data } = await (supabase.from("gold_rates" as any) as any)
        .select("*").eq("business_id", businessId)
        .order("rate_date", { ascending: false })
        .order("rate_time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length) setLatestRate(data[0]);
    };
    fetchRate();
    const handler = () => fetchRate();
    window.addEventListener("gold-rate-updated", handler);
    return () => window.removeEventListener("gold-rate-updated", handler);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;

    const fetchStats = async () => {
      const [salesRes, purchasesRes, expensesRes, customersRes] = await Promise.all([
        supabase.from("sales").select("id, invoice_number, customer_id, final_amount, paid_amount, created_at, repayment_date").eq("business_id", businessId),
        supabase.from("purchases").select("total_amount, paid_amount, created_at").eq("business_id", businessId),
        supabase.from("expenses").select("amount, created_at").eq("business_id", businessId),
        supabase.from("customers").select("id, name").eq("business_id", businessId),
      ]);

      // ── Current month window (1st → today). Resets automatically on the 1st. ──
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const inThisMonth = (dateStr?: string) => dateStr ? new Date(dateStr) >= monthStart : false;

      const monthSales = (salesRes.data || []).filter((s: any) => inThisMonth(s.created_at));
      const monthPurchases = (purchasesRes.data || []).filter((p: any) => inThisMonth(p.created_at));
      const monthExpenses = (expensesRes.data || []).filter((e: any) => inThisMonth(e.created_at));

      const totalSales = monthSales.reduce((sum, s: any) => sum + Number(s.final_amount), 0);
      const totalPurchases = monthPurchases.reduce((sum, p: any) => sum + Number(p.total_amount), 0);
      const totalExpenses = monthExpenses.reduce((sum, e: any) => sum + Number(e.amount), 0);

      // Receivable / Payable: FULL all-time totals (not month-limited)
      const receivable = (salesRes.data?.reduce((sum, s) => sum + (Number(s.final_amount) - Number(s.paid_amount)), 0)) || 0;
      const payable = (purchasesRes.data?.reduce((sum, p) => sum + (Number(p.total_amount) - Number(p.paid_amount)), 0)) || 0;

      setStats({
        sales: totalSales,
        purchases: totalPurchases,
        expenses: totalExpenses,
        profit: totalSales - totalPurchases - totalExpenses,
        receivable,
        payable,
      });

      // Repayment due in next 2 days
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 2); cutoff.setHours(23, 59, 59, 999);
      const upcoming = (salesRes.data || []).filter((s: any) => {
        if (!s.repayment_date) return false;
        const rem = Number(s.final_amount) - Number(s.paid_amount);
        if (rem <= 0) return false;
        const d = new Date(s.repayment_date);
        return d >= today && d <= cutoff;
      }).map((s: any) => ({
        ...s,
        customer_name: customersRes.data?.find((c: any) => c.id === s.customer_id)?.name || "Walk-in",
        remaining: Number(s.final_amount) - Number(s.paid_amount),
      }));
      setDueSoon(upcoming);
      if (upcoming.length > 0) {
        const key = `repay-toast-${new Date().toDateString()}`;
        if (!sessionStorage.getItem(key)) {
          toast.warning(`${upcoming.length} customer repayment${upcoming.length > 1 ? "s" : ""} due in next 2 days`, {
            description: upcoming.slice(0, 3).map((u: any) => `${u.customer_name} • ${formatCurrency(u.remaining)}`).join("  |  "),
            duration: 6000,
          });
          sessionStorage.setItem(key, "1");
        }
      }

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const daySales = salesRes.data?.filter(s => (s as any).created_at?.startsWith(dateStr)).reduce((sum, s) => sum + Number(s.final_amount), 0) || 0;
        days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), sales: daySales });
      }
      setChartData(days);
    };

    fetchStats();
  }, [businessId]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl bg-gradient-hero p-5 sm:p-6 text-amber-50 shadow-gold relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back <span className="text-gradient-gold">✨</span>
            </h1>
            <p className="text-sm text-amber-100/80 mt-1">Your gold business at a glance</p>
          </div>
        </div>

        {latestRate && (
          <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-orange-500/10 shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Latest Gold Rate ({new Date(latestRate.rate_date).toLocaleDateString()}{latestRate.rate_time ? ` ${formatRateTime(latestRate.rate_time)}` : ""}{latestRate.rate_type ? ` — ${latestRate.rate_type}` : ""})
                </div>
                <button onClick={() => navigate("/gold-rates")} className="text-xs underline text-amber-700 dark:text-amber-400">Manage</button>
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
                <div className="rounded-lg bg-amber-500/15 px-2 py-1.5"><div className="font-semibold">24K</div><div className="font-bold">{formatCurrency(latestRate.tola_24k)}</div></div>
                <div className="rounded-lg bg-amber-500/15 px-2 py-1.5"><div className="font-semibold">22K</div><div className="font-bold">{formatCurrency(latestRate.tola_22k)}</div></div>
                <div className="rounded-lg bg-amber-500/15 px-2 py-1.5"><div className="font-semibold">21K</div><div className="font-bold">{formatCurrency(latestRate.tola_21k)}</div></div>
                <div className="rounded-lg bg-amber-500/15 px-2 py-1.5"><div className="font-semibold">18K</div><div className="font-bold">{formatCurrency(latestRate.tola_18k)}</div></div>
                <div className="rounded-lg bg-slate-500/15 px-2 py-1.5"><div className="font-semibold">Silver</div><div className="font-bold">{formatCurrency(latestRate.silver_tola)}</div></div>
              </div>
            </CardContent>
          </Card>
        )}

        {dueSoon.length > 0 && (
          <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent shadow-soft">
            <CardContent className="p-3 sm:p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-sm">Upcoming repayments</p>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-bold">
                    {dueSoon.length} due in 2 days
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {dueSoon.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => navigate(`/sales/${s.id}`)}
                      className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 px-2 py-1.5 rounded hover:bg-amber-500/10 cursor-pointer border border-transparent hover:border-amber-500/30 transition-colors"
                    >
                      <span className="truncate"><strong>{s.customer_name}</strong> — {s.invoice_number}</span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap">
                        {formatCurrency(s.remaining)} • {new Date(s.repayment_date).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(() => {
            const monthLabel = `1 ${new Date().toLocaleDateString("en", { month: "short" })} → ${new Date().getDate()} ${new Date().toLocaleDateString("en", { month: "short" })}`;
            return (
              <>
                <StatCard title="Total Sales" value={formatCurrency(stats.sales)} subtitle={monthLabel} icon={ShoppingCart} gradient="gold" onClick={() => navigate("/sales")} />
                <StatCard title="Purchases" value={formatCurrency(stats.purchases)} subtitle={monthLabel} icon={Receipt} gradient="purple" onClick={() => navigate("/purchases")} />
                <StatCard title="Expenses" value={formatCurrency(stats.expenses)} subtitle={monthLabel} icon={Wallet} gradient="red" onClick={() => navigate("/expenses")} />
                <StatCard title="Profit/Loss" value={formatCurrency(stats.profit)} subtitle={monthLabel} icon={stats.profit >= 0 ? TrendingUp : TrendingDown} trend={stats.profit >= 0 ? "up" : "down"} gradient={stats.profit >= 0 ? "green" : "red"} onClick={() => navigate("/reports/profit-loss")} />
                <StatCard title="To Receive" value={formatCurrency(stats.receivable)} subtitle="All-time • From customers" icon={ArrowDownCircle} gradient="teal" onClick={() => navigate("/reports/receivables")} />
                <StatCard title="To Pay" value={formatCurrency(stats.payable)} subtitle="All-time • To suppliers" icon={ArrowUpCircle} gradient="amber" onClick={() => navigate("/reports/payables")} />
              </>
            );
          })()}
        </div>

        <Card className="border-amber-500/20 shadow-soft overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-gold" />
              Sales Overview (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <defs>
                  <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45 100% 60%)" />
                    <stop offset="100%" stopColor="hsl(28 90% 45%)" />
                  </linearGradient>
                </defs>
                <Bar dataKey="sales" fill="url(#goldBar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
