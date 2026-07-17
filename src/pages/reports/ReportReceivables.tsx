import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { ArrowDownCircle, ShoppingCart, Receipt, Printer } from "lucide-react";

const ReportReceivables = () => {
  const { data: sales } = useBusinessData("sales");
  const { data: customers } = useBusinessData("customers");
  const { data: payments } = useBusinessData("payments");

  const customerReceivables = customers.map((c: any) => {
    const custSales = sales.filter((s: any) => s.customer_id === c.id);
    const total_sales = custSales.reduce((s: number, sale: any) => s + Number(sale.final_amount), 0);
    const sales_paid = custSales.reduce((s: number, sale: any) => s + Number(sale.paid_amount), 0);
    // Include any extra customer payments not tied to a sale (avoid double-count: those tied to a sale already update sale.paid_amount)
    const extraPayments = payments
      .filter((p: any) => p.type === "customer_payment" && p.reference_id === c.id && !p.sale_id)
      .reduce((s: number, p: any) => s + Number(p.amount), 0);
    const total_paid = sales_paid + extraPayments;
    return { ...c, total_sales, total_paid, remaining: total_sales - total_paid };
  }).filter(c => c.total_sales > 0 || c.total_paid > 0);

  const totalReceivable = customerReceivables.reduce((s, c) => s + Math.max(0, c.remaining), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Receivables Report" subtitle="What customers owe us" />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Receivables</h1>
            <p className="text-sm text-muted-foreground">Amounts customers owe you</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Receivable" value={formatCurrency(totalReceivable)} icon={ArrowDownCircle} trend="up" />
          <StatCard title="Total Sales" value={formatCurrency(customerReceivables.reduce((s, c) => s + c.total_sales, 0))} icon={ShoppingCart} />
          <StatCard title="Total Received" value={formatCurrency(customerReceivables.reduce((s, c) => s + c.total_paid, 0))} icon={Receipt} />
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Customer Receivables</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Customer" },
              { key: "phone", label: "Phone" },
              { key: "total_sales", label: "Total Sales", render: (v: number) => formatCurrency(v) },
              { key: "total_paid", label: "Received", render: (v: number) => formatCurrency(v) },
              { key: "remaining", label: "Remaining", render: (v: number) => (
                <span className={v > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{formatCurrency(v)}</span>
              )},
            ]} data={customerReceivables} totals={{
              total_sales: formatCurrency(customerReceivables.reduce((s, c) => s + c.total_sales, 0)),
              total_paid: formatCurrency(customerReceivables.reduce((s, c) => s + c.total_paid, 0)),
              remaining: formatCurrency(customerReceivables.reduce((s, c) => s + Math.max(0, c.remaining), 0)),
            }} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportReceivables;
