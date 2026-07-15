import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Printer } from "lucide-react";

const Row = ({
  label, amount, sub, bold, color, indent
}: {
  label: string; amount: number; sub?: string; bold?: boolean; color?: string; indent?: boolean;
}) => (
  <div className={`flex justify-between items-center py-2 border-b last:border-0 ${indent ? "pl-4" : ""}`}>
    <div>
      <span className={`text-sm ${bold ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
    <span className={`font-semibold text-sm ${color || ""} ${bold ? "text-base" : ""}`}>
      {formatCurrency(amount)}
    </span>
  </div>
);

const ReportProfitLoss = () => {
  const { data: sales } = useBusinessData("sales");
  const { data: purchases } = useBusinessData("purchases");
  const { data: expenses } = useBusinessData("expenses");
  const { data: salaries } = useBusinessData("salaries");
  const { data: products } = useBusinessData("products");
  const { data: customers } = useBusinessData("customers");
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: jobCards } = useBusinessData("job_cards");
  const { data: customOrders } = useBusinessData("custom_orders");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterByDate = (items: any[]) => items.filter((item: any) => {
    const date = new Date(item.created_at || item.date);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const filteredSales     = filterByDate(sales);
  const filteredPurchases = filterByDate(purchases);
  const allFilteredExp    = filterByDate(expenses);

  // ── Revenue ──────────────────────────────────────────────────────────────────
  const totalSales        = filteredSales.reduce((s: number, x: any) => s + Number(x.final_amount), 0);
  const totalReceived     = filteredSales.reduce((s: number, x: any) => s + Number(x.paid_amount), 0);

  const resaleExpenses    = allFilteredExp.filter((e: any) => e.category === "purchase_resale");
  const totalResalesRevenue = resaleExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalResalesProfit  = resaleExpenses.reduce((s: number, e: any) => {
    try { return s + (JSON.parse(e.description || "{}").profit || 0); } catch { return s; }
  }, 0);

  // ── Repair / Service income ───────────────────────────────────────────────────
  // Returned jobs: full service charge is earned. Open jobs: only the advance received so far.
  const filteredJobs = filterByDate(jobCards);
  const repairIncome = filteredJobs.reduce((s: number, j: any) => {
    if (j.status === "cancelled") return s;
    if (j.status === "returned") return s + Number(j.service_charge || 0);
    return s + Number(j.advance_amount || 0);
  }, 0);
  const returnedJobsCount = filteredJobs.filter((j: any) => j.status === "returned").length;

  // ── Custom order income ───────────────────────────────────────────────────────
  // Delivered orders: full price. Open orders: advance + payments received so far.
  const filteredOrders = filterByDate(customOrders);
  const customOrderIncome = filteredOrders.reduce((s: number, o: any) => {
    if (o.status === "cancelled") return s;
    if (o.status === "delivered") return s + Number(o.total_price || 0);
    return s + Number(o.advance_amount || 0) + Number(o.paid_amount || 0);
  }, 0);

  const totalRevenue = totalSales + totalResalesRevenue + repairIncome + customOrderIncome;

  // ── Costs ─────────────────────────────────────────────────────────────────────
  const totalPurchases     = filteredPurchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalPurchasesPaid = filteredPurchases.reduce((s: number, p: any) => s + Number(p.paid_amount), 0);

  const regularExpenses    = allFilteredExp.filter((e: any) => e.category !== "purchase_resale");
  const totalExpenses      = regularExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalSalaries      = filterByDate(salaries).reduce((s: number, x: any) => s + Number(x.amount), 0);

  const totalCosts = totalPurchases + totalExpenses + totalSalaries;

  // ── Net Profit ────────────────────────────────────────────────────────────────
  const profit = totalRevenue - totalCosts;

  // ── Receivables / Payables ───────────────────────────────────────────────────
  const totalReceivable = customers.reduce((sum: number, c: any) => {
    const custSales = sales.filter((s: any) => s.customer_id === c.id);
    return sum + custSales.reduce((s: number, x: any) => s + Number(x.final_amount) - Number(x.paid_amount), 0);
  }, 0);
  const totalPayable = suppliers.reduce((sum: number, s: any) => {
    const supPur = purchases.filter((p: any) => p.supplier_id === s.id);
    return sum + supPur.reduce((s2: number, p: any) => s2 + Number(p.total_amount) - Number(p.paid_amount), 0);
  }, 0);

  // ── Stock value (informational) ───────────────────────────────────────────────
  const stockValue = products.reduce((s: number, p: any) => s + Number(p.price) * Number(p.stock_quantity), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title="Profit & Loss Statement" subtitle="Financial Performance Report" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Profit & Loss</h1>
            <p className="text-sm text-muted-foreground">Full income statement for your business</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-3 items-center bg-card border rounded-lg px-3 py-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Net Profit banner */}
        <div className={`rounded-xl p-5 flex items-center justify-between ${profit >= 0 ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
          <div className="flex items-center gap-3">
            {profit >= 0
              ? <TrendingUp className="w-8 h-8 text-success" />
              : <TrendingDown className="w-8 h-8 text-destructive" />}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Profit / Loss</p>
              <p className={`text-3xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(profit)}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground hidden sm:block">
            <p>Revenue − Costs</p>
            <p className="font-semibold text-foreground">
              {formatCurrency(totalRevenue)} − {formatCurrency(totalCosts)}
            </p>
          </div>
        </div>

        {/* Income Statement — two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── REVENUE ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-success flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                Revenue (Income)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Row
                label="Product Sales"
                amount={totalSales}
                sub={`Collected: ${formatCurrency(totalReceived)} · Pending: ${formatCurrency(totalSales - totalReceived)}`}
                indent
              />
              {totalResalesRevenue > 0 && (
                <Row
                  label={`Purchase Resales (${resaleExpenses.length})`}
                  amount={totalResalesRevenue}
                  sub={`Profit on resales: ${formatCurrency(totalResalesProfit)}`}
                  indent
                />
              )}
              {repairIncome > 0 && (
                <Row
                  label={`Repair / Service Income (${filteredJobs.length} jobs)`}
                  amount={repairIncome}
                  sub={`${returnedJobsCount} returned (full charge) · open jobs counted by advance`}
                  indent
                />
              )}
              {customOrderIncome > 0 && (
                <Row
                  label={`Custom Order Income (${filteredOrders.length} orders)`}
                  amount={customOrderIncome}
                  sub="Delivered: full price · open orders: advance + payments"
                  indent
                />
              )}
              <Row label="Total Revenue" amount={totalRevenue} bold color="text-success" />
            </CardContent>
          </Card>

          {/* ── COSTS ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                Costs (Deductions from profit)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Row
                label="Product / Purchase Cost"
                amount={totalPurchases}
                sub={`Paid: ${formatCurrency(totalPurchasesPaid)} · Balance due: ${formatCurrency(totalPurchases - totalPurchasesPaid)}`}
                indent
              />
              <Row
                label="Operating Expenses"
                amount={totalExpenses}
                indent
              />
              <Row
                label="Salaries"
                amount={totalSalaries}
                indent
              />
              <Row label="Total Costs" amount={totalCosts} bold color="text-destructive" />
            </CardContent>
          </Card>
        </div>

        {/* Receivables / Payables / Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Collect</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalReceivable)}</p>
              <p className="text-xs text-muted-foreground mt-1">Outstanding from customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Pay</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPayable)}</p>
              <p className="text-xs text-muted-foreground mt-1">Outstanding to suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stock Value</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(stockValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Current inventory value (asset, not profit)</p>
            </CardContent>
          </Card>
        </div>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportProfitLoss;
