import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer } from "lucide-react";

const ReportExpenses = () => {
  const { data: expenses } = useBusinessData("expenses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = expenses.filter((item: any) => {
    const date = new Date(item.date || item.created_at);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Expenses Report" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Expenses Report</h1>
            <p className="text-sm text-muted-foreground">All business expenses</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-3 items-center bg-card border rounded-lg px-3 py-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Expenses</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "category", label: "Category" },
              { key: "description", label: "Description" },
              { key: "amount", label: "Amount", render: (v: number) => formatCurrency(v) },
              { key: "date", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
            ]} data={filtered} totals={{
              amount: formatCurrency(filtered.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)),
            }} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportExpenses;
