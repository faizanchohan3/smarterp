import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer } from "lucide-react";

const ReportPurchases = () => {
  const { data: purchases } = useBusinessData("purchases");
  const { data: suppliers } = useBusinessData("suppliers");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = purchases.filter((item: any) => {
    const date = new Date(item.created_at);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const getStatus = (paid: number, total: number) => {
    if (total <= 0) return "full";
    if (paid >= total) return "full";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Purchases Report" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Purchases Report</h1>
            <p className="text-sm text-muted-foreground">All purchase transactions</p>
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
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Purchases</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "invoice_number", label: "Invoice" },
              { key: "supplier_id", label: "Supplier", render: (v: string) => suppliers.find((s: any) => s.id === v)?.name || "-" },
              { key: "total_amount", label: "Amount", render: (v: number) => formatCurrency(v) },
              { key: "paid_amount", label: "Paid", render: (v: number) => formatCurrency(v) },
              { key: "id", label: "Remaining", render: (_: any, row: any) => {
                const rem = Number(row.total_amount) - Number(row.paid_amount);
                return <span className={rem > 0 ? "text-destructive" : "text-success"}>{formatCurrency(rem)}</span>;
              }},
              { key: "payment_status", label: "Status", render: (_: string, row: any) => <StatusBadge status={getStatus(Number(row.paid_amount), Number(row.total_amount))} /> },
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
            ]} data={filtered} totals={{
              total_amount: formatCurrency(filtered.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0)),
              paid_amount: formatCurrency(filtered.reduce((s: number, p: any) => s + Number(p.paid_amount || 0), 0)),
              id: formatCurrency(filtered.reduce((s: number, p: any) => s + (Number(p.total_amount || 0) - Number(p.paid_amount || 0)), 0)),
            }} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportPurchases;
