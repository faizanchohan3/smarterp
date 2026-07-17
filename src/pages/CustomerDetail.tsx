import { useParams, useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PrintHeader from "@/components/shared/PrintHeader";
import PrintFooter from "@/components/shared/PrintFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, User, Phone, MapPin, ShoppingCart, Wallet, ArrowDownCircle, BookOpen, Printer, Tag, Pencil } from "lucide-react";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customers } = useBusinessData("customers");
  const { data: sales } = useBusinessData("sales");
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const { data: payments } = useBusinessData("payments");

  const customer = customers.find((c: any) => c.id === id);
  const customerSales = sales.filter((s: any) => s.customer_id === id);
  const customerLedger = ledgerEntries.filter((e: any) => e.entry_type === "customer" && e.reference_id === id);
  const customerPayments = payments.filter((p: any) => p.type === "customer_payment" && p.reference_id === id);

  const totalSales = customerSales.reduce((s: number, sale: any) => s + Number(sale.final_amount), 0);
  const totalPaid = customerSales.reduce((s: number, sale: any) => s + Number(sale.paid_amount), 0);
  const totalPaymentsReceived = customerPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const remaining = totalSales - totalPaid - totalPaymentsReceived;

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      return { ...e, running_balance: balance };
    }).reverse();
  };

  if (!customer) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Customer not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/customers")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PrintHeader title="Customer Ledger" subtitle={customer.name} />

        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-sm text-muted-foreground">Customer Details & Ledger</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/customers/${id}/edit`)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print Ledger
            </Button>
          </div>
        </div>

        {/* Customer Info Card */}
        <Card className="print:hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={customer.photo_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{customer.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><User className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-sm">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">{customer.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alt Phone</p>
                    <p className="font-medium text-sm">{customer.alt_phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-sm">{customer.address || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Tag className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="font-medium text-sm">{customer.reference || "-"} {customer.reference_phone ? `(${customer.reference_phone})` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><BookOpen className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Since</p>
                    <p className="font-medium text-sm">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print-only customer summary */}
        <div className="hidden print:block">
          <p className="text-sm"><strong>Phone:</strong> {customer.phone || "-"} | <strong>Address:</strong> {customer.address || "-"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:hidden">
          <StatCard title="Total Sales" value={formatCurrency(totalSales)} icon={ShoppingCart} />
          <StatCard title="Total Paid" value={formatCurrency(totalPaid + totalPaymentsReceived)} icon={Wallet} trend="up" />
          <StatCard title="Remaining" value={formatCurrency(Math.max(0, remaining))} icon={ArrowDownCircle} trend={remaining > 0 ? "down" : "up"} />
          <StatCard title="Total Invoices" value={String(customerSales.length)} icon={BookOpen} />
        </div>

        {/* Ledger - shows in print */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Customer Ledger</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              { key: "description", label: "Description" },
              { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "running_balance", label: "Balance", render: (v: number) => (
                <span className={v > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(v)}</span>
              )},
            ]} data={calcRunningBalance(customerLedger)} />
          </CardContent>
        </Card>

        {/* Sales History */}
        <Card className="print:hidden">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Sales History</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "invoice_number", label: "Invoice" },
              { key: "final_amount", label: "Amount", render: (v: number) => formatCurrency(v) },
              { key: "paid_amount", label: "Paid", render: (v: number) => formatCurrency(v) },
              { key: "id", label: "Remaining", render: (_: any, row: any) => {
                const rem = Number(row.final_amount) - Number(row.paid_amount);
                return <span className={rem > 0 ? "text-destructive" : "text-success"}>{formatCurrency(rem)}</span>;
              }},
              { key: "payment_status", label: "Status", render: (_: string, row: any) => {
                const status = Number(row.paid_amount) >= Number(row.final_amount) ? "full" : Number(row.paid_amount) > 0 ? "partial" : "unpaid";
                return <StatusBadge status={status} />;
              }},
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
            ]} data={customerSales} onRowClick={(row) => navigate(`/sales/${row.id}`)} />
          </CardContent>
        </Card>

        {/* Payments Received */}
        <Card className="print:hidden">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Payments Received</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              { key: "amount", label: "Amount", render: (v: number) => formatCurrency(v) },
              { key: "description", label: "Description" },
            ]} data={customerPayments} />
          </CardContent>
        </Card>

        <PrintFooter />
      </div>
    </AppLayout>
  );
};

export default CustomerDetail;
