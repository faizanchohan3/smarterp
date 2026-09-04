import { useEffect, useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Printer } from "lucide-react";

const TOLA_IN_GRAMS = 11.664;

const Row = ({ label, amount, sub, bold, color }: {
  label: string; amount: number; sub?: string; bold?: boolean; color?: string;
}) => (
  <div className="flex justify-between items-center py-2.5 border-b last:border-0">
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
  const { data: products } = useBusinessData("products");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // sale_items has no business_id column of its own (scoped indirectly via
  // sale_id -> sales.business_id), so it can't go through useBusinessData's
  // generic .eq("business_id", ...) filter -- that throws "column
  // sale_items.business_id does not exist". Fetch it directly instead,
  // scoped through this business's own (already-filtered) sale ids, same
  // as SaleDetail.tsx does for a single sale.
  const [saleItems, setSaleItems] = useState<any[]>([]);
  useEffect(() => {
    const saleIds = sales.map((s: any) => s.id);
    if (saleIds.length === 0) { setSaleItems([]); return; }
    (async () => {
      const { data } = await (supabase.from("sale_items").select("*") as any).in("sale_id", saleIds);
      setSaleItems(data || []);
    })();
  }, [sales]);

  const filterByDate = (items: any[]) => items.filter((item: any) => {
    const date = new Date(item.created_at || item.date);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const filteredSales     = filterByDate(sales);
  const filteredPurchases = filterByDate(purchases);
  const allFilteredExp    = filterByDate(expenses);

  // Purchases → "Record Sale" stores its result as an expenses row
  // (category='purchase_resale', amount=sold price, profit tucked into a
  // JSON description) -- it's revenue/profit on a resale, not an operating
  // expense, so it's split out here rather than counted as one.
  const resaleExpenses  = allFilteredExp.filter((e: any) => e.category === "purchase_resale");
  const regularExpenses = allFilteredExp.filter((e: any) => e.category !== "purchase_resale");

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalInventoryPrice = products.reduce((s: number, p: any) => s + Number(p.price || 0) * Number(p.stock_quantity || 0), 0);
  const totalPurchase       = filteredPurchases.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const totalSale           = filteredSales.reduce((s: number, x: any) => s + Number(x.final_amount || 0), 0);
  const totalExpense        = regularExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  // ── Profit in Purchase (resale of purchased items to another shop/customer) ────
  const totalProfitInPurchase = resaleExpenses.reduce((s: number, e: any) => {
    try { return s + (JSON.parse(e.description || "{}").profit || 0); } catch { return s; }
  }, 0);

  // ── Profit in Sales — actual margin, NOT total sale amount: sale price minus
  // the gold cost basis of what was sold (sale_items.cost_weight, valued at that
  // sale's own gold rate; falls back to a flat cost_price for older rows) ───────
  const filteredSaleIds = new Set(filteredSales.map((s: any) => s.id));
  const saleById = new Map(filteredSales.map((s: any) => [s.id, s]));
  const filteredSaleItems = saleItems.filter((it: any) => filteredSaleIds.has(it.sale_id));
  const totalCostOfGoodsSold = filteredSaleItems.reduce((sum: number, it: any) => {
    const sale = saleById.get(it.sale_id);
    const tolaRate = Number(sale?.tola_rate) || 0;
    const qty = Number(it.quantity) || 1;
    if (Number(it.cost_weight) > 0 && tolaRate > 0) {
      return sum + (Number(it.cost_weight) / TOLA_IN_GRAMS) * tolaRate * qty;
    }
    if (Number(it.cost_price) > 0) return sum + Number(it.cost_price) * qty;
    return sum;
  }, 0);
  const totalProfitInSales = totalSale - totalCostOfGoodsSold;

  // ── Actual Profit = profit in purchase + profit in sales ───────────────────────
  const actualProfit = totalProfitInPurchase + totalProfitInSales;

  // ── Final Profit/Loss = Actual Profit − Expenses ────────────────────────────────
  const finalProfitLoss = actualProfit - totalExpense;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title="Profit & Loss Statement" subtitle="Financial Performance Report" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Profit & Loss</h1>
            <p className="text-sm text-muted-foreground">Simple profit/loss summary for your business</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-3 items-center bg-card border rounded-lg px-3 py-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Final Profit/Loss banner */}
        <div className={`rounded-xl p-5 flex items-center justify-between ${finalProfitLoss >= 0 ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
          <div className="flex items-center gap-3">
            {finalProfitLoss >= 0
              ? <TrendingUp className="w-8 h-8 text-success" />
              : <TrendingDown className="w-8 h-8 text-destructive" />}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Profit / Loss</p>
              <p className={`text-3xl font-bold ${finalProfitLoss >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(finalProfitLoss)}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground hidden sm:block">
            <p>Actual Profit − Total Expense</p>
            <p className="font-semibold text-foreground">
              {formatCurrency(actualProfit)} − {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-0">
            <Row label="Total Inventory Price" amount={totalInventoryPrice} sub="Current stock value (as of today)" />
            <Row label="Total Purchase" amount={totalPurchase} />
            <Row label="Total Sale" amount={totalSale} />
            <Row label="Total Expense" amount={totalExpense} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-success flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              Profit Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <Row
              label="Total Profit in Purchase"
              amount={totalProfitInPurchase}
              sub={`From reselling purchased items (${resaleExpenses.length} resale${resaleExpenses.length === 1 ? "" : "s"})`}
              color={totalProfitInPurchase >= 0 ? "text-success" : "text-destructive"}
            />
            <Row
              label="Total Profit in Sales"
              amount={totalProfitInSales}
              sub="Sale price minus gold cost basis — not total sale amount"
              color={totalProfitInSales >= 0 ? "text-success" : "text-destructive"}
            />
            <Row label="Actual Profit (Total Profit)" amount={actualProfit} bold color={actualProfit >= 0 ? "text-success" : "text-destructive"} />
            <Row label="Total Expense" amount={-totalExpense} color="text-destructive" />
            <Row label="Total Profit / Loss" amount={finalProfitLoss} bold color={finalProfitLoss >= 0 ? "text-success" : "text-destructive"} />
          </CardContent>
        </Card>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportProfitLoss;
