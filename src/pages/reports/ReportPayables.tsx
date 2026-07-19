import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { ArrowUpCircle, Receipt, Wallet, Printer } from "lucide-react";

const ReportPayables = () => {
  const navigate = useNavigate();
  const { data: purchases } = useBusinessData("purchases");
  const { data: suppliers } = useBusinessData("suppliers");

  const supplierPayables = suppliers.map((s: any) => {
    const supPurchases = purchases.filter((p: any) => p.supplier_id === s.id);
    const total_purchases = supPurchases.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
    const total_paid = supPurchases.reduce((sum: number, p: any) => sum + Number(p.paid_amount), 0);
    return { ...s, total_purchases, total_paid, remaining: total_purchases - total_paid };
  }).filter(s => s.total_purchases > 0);

  const totalPayable = supplierPayables.reduce((s, c) => s + c.remaining, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Payables Report" subtitle="What we owe suppliers" />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Payables</h1>
            <p className="text-sm text-muted-foreground">Amounts you owe to suppliers</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Payable" value={formatCurrency(totalPayable)} icon={ArrowUpCircle} trend="down" />
          <StatCard title="Total Purchases" value={formatCurrency(supplierPayables.reduce((s, c) => s + c.total_purchases, 0))} icon={Receipt} />
          <StatCard title="Total Paid" value={formatCurrency(supplierPayables.reduce((s, c) => s + c.total_paid, 0))} icon={Wallet} />
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
              { key: "total_purchases", label: "Total Purchases", render: (v: number) => formatCurrency(v) },
              { key: "total_paid", label: "Paid", render: (v: number) => formatCurrency(v) },
              { key: "remaining", label: "Remaining", render: (v: number) => (
                <span className={v > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{formatCurrency(v)}</span>
              )},
            ]} data={supplierPayables} totals={{
              total_purchases: formatCurrency(supplierPayables.reduce((s, c) => s + c.total_purchases, 0)),
              total_paid: formatCurrency(supplierPayables.reduce((s, c) => s + c.total_paid, 0)),
              remaining: formatCurrency(totalPayable),
            }} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportPayables;
