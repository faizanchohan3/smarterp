import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { ArrowUpCircle, Receipt, Wallet, Printer, Coins, Trash2 } from "lucide-react";
import { TOLA_TO_GRAM, getLatestRate } from "@/lib/gold";

const ReportPayables = () => {
  const navigate = useNavigate();
  const { data: purchases, fetch: fetchPurchases } = useBusinessData("purchases");
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: goldRates } = useBusinessData("gold_rates" as any);
  const { businessId } = useAuth();
  const { toast } = useToast();
  const [goldBySupplier, setGoldBySupplier] = useState<Record<string, number>>({});
  const [viewSupplier, setViewSupplier] = useState<any>(null);

  // Drop-ship debts are owed in GOLD (Cost Weight), not a frozen PKR price —
  // the real balance lives on the supplier ledger's gold_credit/gold_debit, not
  // in the purchases table.
  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await (supabase
        .from("ledger_entries")
        .select("reference_id, gold_credit, gold_debit") as any)
        .eq("business_id", businessId)
        .eq("entry_type", "supplier");
      const grouped: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        grouped[e.reference_id] = (grouped[e.reference_id] || 0) + (Number(e.gold_credit) || 0) - (Number(e.gold_debit) || 0);
      });
      setGoldBySupplier(grouped);
    })();
  }, [businessId]);

  const latestRate: any = getLatestRate(goldRates as any[]);
  const goldRatePerGram = latestRate ? (Number(latestRate.tola_24k) || 0) / TOLA_TO_GRAM : 0;

  const supplierPayables = suppliers.map((s: any) => {
    const supPurchases = purchases.filter((p: any) => p.supplier_id === s.id);
    const total_purchases = supPurchases.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
    const total_paid = supPurchases.reduce((sum: number, p: any) => sum + Number(p.paid_amount), 0);
    const gold_owed = goldBySupplier[s.id] || 0;
    const gold_payable = gold_owed * goldRatePerGram;
    return {
      ...s,
      total_purchases, total_paid,
      remaining: total_purchases - total_paid,
      gold_owed, gold_payable,
      grand_total: (total_purchases - total_paid) + gold_payable,
    };
  }).filter(s => s.total_purchases > 0 || s.gold_owed > 0.0001);

  const totalCashRemaining = supplierPayables.reduce((s, c) => s + c.remaining, 0);
  const totalGoldOwed = supplierPayables.reduce((s, c) => s + c.gold_owed, 0);
  const totalGoldPayable = supplierPayables.reduce((s, c) => s + c.gold_payable, 0);
  const totalPayable = totalCashRemaining + totalGoldPayable;

  const purchasesForSupplier = (supplierId: string) => purchases.filter((p: any) => p.supplier_id === supplierId);

  const deletePurchase = async (purchase: any) => {
    if (!confirm(`Delete purchase ${purchase.invoice_number} (${formatCurrency(purchase.total_amount)})? This restores stock and removes its ledger entries.`)) return;
    const { data: purchaseItems } = await (supabase.from("purchase_items") as any).select("*").eq("purchase_id", purchase.id);
    for (const item of purchaseItems || []) {
      if (item.product_id) {
        const { data: prod } = await (supabase.from("products").select("stock_quantity") as any).eq("id", item.product_id).maybeSingle();
        if (prod) {
          await (supabase.from("products") as any)
            .update({ stock_quantity: Math.max(0, Number(prod.stock_quantity) - Number(item.quantity || 0)) })
            .eq("id", item.product_id);
        }
      }
    }
    await (supabase.from("ledger_entries") as any).delete().eq("business_id", businessId).ilike("description", `%${purchase.invoice_number}%`);
    await (supabase.from("ledger_entries") as any).delete().eq("business_id", businessId).eq("description", `CUST_PURCHASE:${purchase.id}`);
    const { error } = await (supabase.from("purchases") as any).delete().eq("id", purchase.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Purchase deleted" });
    fetchPurchases();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Payables Report" subtitle="What we owe suppliers" />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Payables</h1>
            <p className="text-sm text-muted-foreground">Amounts you owe to suppliers — cash + gold (drop-ship), gold valued at today's rate</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Payable" value={formatCurrency(totalPayable)} icon={ArrowUpCircle} trend="down" />
          <StatCard title="Cash Owed (Purchases)" value={formatCurrency(totalCashRemaining)} icon={Receipt} />
          <StatCard title="Gold Owed" value={`${totalGoldOwed.toFixed(3)} g`} icon={Coins} gradient="amber" />
          <StatCard title="Gold Payable (today's rate)" value={formatCurrency(totalGoldPayable)} icon={Wallet} gradient="amber" />
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Supplier Payables</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Supplier", render: (v, row) => (
                <button
                  type="button"
                  className="text-primary hover:underline underline-offset-2 font-medium text-left"
                  onClick={() => navigate(`/ledger?tab=supplier&id=${row.id}`)}
                >
                  {v} ↗
                </button>
              )},
              { key: "phone", label: "Phone" },
              { key: "remaining", label: "Cash Owed", render: (v: number, row: any) => (
                v > 0 ? (
                  <button type="button" className="text-primary hover:underline underline-offset-2" onClick={() => setViewSupplier(row)}>
                    {formatCurrency(v)}
                  </button>
                ) : formatCurrency(v)
              )},
              { key: "gold_owed", label: "Gold Owed (g)", render: (v: number) => v > 0 ? v.toFixed(3) : "-" },
              { key: "gold_payable", label: "Gold Payable (today)", render: (v: number) => v > 0 ? formatCurrency(v) : "-" },
              { key: "grand_total", label: "Total Owed", render: (v: number) => (
                <span className={v > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{formatCurrency(v)}</span>
              )},
            ]} data={supplierPayables} totals={{
              remaining: formatCurrency(totalCashRemaining),
              gold_owed: `${totalGoldOwed.toFixed(3)} g`,
              gold_payable: formatCurrency(totalGoldPayable),
              grand_total: formatCurrency(totalPayable),
            }} />
            {!latestRate && totalGoldOwed > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Gold rate set nahi hai — Gold Payable (PKR) 0 dikh raha hai. Gold Rates page se aaj ka rate daalo.</p>
            )}
          </CardContent>
        </Card>
        <ReportFooter />

        {/* Raw purchase rows behind a supplier's Cash Owed figure — screen only */}
        <Dialog open={!!viewSupplier} onOpenChange={(o) => !o && setViewSupplier(null)}>
          <DialogContent className="max-w-lg print:hidden">
            <DialogHeader><DialogTitle>Purchases — {viewSupplier?.name}</DialogTitle></DialogHeader>
            {viewSupplier && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50">
                    <th className="text-left p-2.5">Invoice</th>
                    <th className="text-left p-2.5">Date</th>
                    <th className="text-right p-2.5">Total</th>
                    <th className="text-right p-2.5">Paid</th>
                    <th className="p-2.5"></th>
                  </tr></thead>
                  <tbody>
                    {purchasesForSupplier(viewSupplier.id).map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2.5 font-medium">{p.invoice_number}</td>
                        <td className="p-2.5">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-2.5 text-right">{formatCurrency(p.total_amount)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(p.paid_amount)}</td>
                        <td className="p-2.5 text-right">
                          <Button variant="ghost" size="icon" onClick={() => deletePurchase(p)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ReportPayables;
