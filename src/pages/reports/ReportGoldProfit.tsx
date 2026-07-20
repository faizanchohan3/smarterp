import { useState, useEffect } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer, TrendingUp, ShoppingCart, Wallet } from "lucide-react";

const TOLA_IN_GRAMS = 11.664;

const ReportGoldProfit = () => {
  const { data: sales } = useBusinessData("sales");
  const { data: customers } = useBusinessData("customers");
  const { businessId } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemsBySale, setItemsBySale] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await (supabase.from("sale_items").select("*, sales!inner(business_id)") as any).eq("sales.business_id", businessId);
      const grouped: Record<string, any[]> = {};
      (data || []).forEach((it: any) => { (grouped[it.sale_id] ||= []).push(it); });
      setItemsBySale(grouped);
    })();
  }, [businessId]);

  // Only sales that have at least one item with a cost basis (cost_weight or cost_price)
  const salesWithCost = sales.filter((s: any) => {
    const its = itemsBySale[s.id] || [];
    return its.some((it: any) => Number(it.cost_weight) > 0 || Number(it.cost_price) > 0);
  });

  const filtered = salesWithCost.filter((s: any) => {
    const date = new Date(s.created_at);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const computeCost = (sale: any) => {
    const its = itemsBySale[sale.id] || [];
    const tolaRate = Number(sale.tola_rate) || 0;
    return its.reduce((s: number, it: any) => {
      const qty = Number(it.quantity) || 1;
      if (Number(it.cost_weight) > 0 && tolaRate > 0) {
        return s + (Number(it.cost_weight) / TOLA_IN_GRAMS) * tolaRate * qty;
      }
      if (Number(it.cost_price) > 0) {
        return s + Number(it.cost_price) * qty;
      }
      return s;
    }, 0);
  };

  const rows = filtered.map((s: any) => {
    const cost = computeCost(s);
    const profit = Number(s.final_amount) - cost;
    return { ...s, gold_cost: cost, gold_profit: profit };
  });

  const totalSalesAmt = rows.reduce((s: number, r: any) => s + Number(r.final_amount || 0), 0);
  const totalCost = rows.reduce((s: number, r: any) => s + r.gold_cost, 0);
  const totalProfit = rows.reduce((s: number, r: any) => s + r.gold_profit, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title="Gold Profit Report" subtitle="Internal — cost & profit by gold weight (never shown to customer)" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Gold Profit Report</h1>
            <p className="text-sm text-muted-foreground">Internal only — cost & profit based on gold weight, never shown to customer</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-3 items-center bg-card border rounded-lg px-3 py-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Sale Amount" value={formatCurrency(totalSalesAmt)} subtitle={`${rows.length} invoices`} icon={ShoppingCart} gradient="blue" />
          <StatCard title="Total Cost (Gold Basis)" value={formatCurrency(totalCost)} icon={Wallet} gradient="amber" />
          <StatCard title="Total Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} gradient={totalProfit >= 0 ? "green" : "red"} trend={totalProfit >= 0 ? "up" : "down"} />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Sales with Gold Cost Basis</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "invoice_number", label: "Invoice" },
              { key: "customer_id", label: "Customer", render: (v: string) => customers.find((c: any) => c.id === v)?.name || "Walk-in" },
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              { key: "final_amount", label: "Sale Amount", render: (v: number) => formatCurrency(v) },
              { key: "gold_cost", label: "Cost", render: (v: number) => formatCurrency(v) },
              { key: "gold_profit", label: "Profit", render: (v: number) => (
                <span className={v >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>{formatCurrency(v)}</span>
              )},
            ]} data={rows} totals={{
              final_amount: formatCurrency(totalSalesAmt),
              gold_cost: formatCurrency(totalCost),
              gold_profit: formatCurrency(totalProfit),
            }} />
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Koi sale nahi mili jis mein Cost Weight (ya drop-ship Cost Price) diya gaya ho. Products mein "Cost Weight" field bharo, phir Sales mein wo item becho.
              </p>
            )}
          </CardContent>
        </Card>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportGoldProfit;
