import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { Printer } from "lucide-react";

const Ledger = () => {
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const { data: customers } = useBusinessData("customers");
  const { data: suppliers } = useBusinessData("suppliers");
  const [activeTab, setActiveTab] = useState("customer");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterByDate = (entries: any[]) => entries.filter((e: any) => {
    const d = new Date(e.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const customerEntries = filterByDate(ledgerEntries.filter((e: any) =>
    e.entry_type === "customer" && (selectedCustomer === "all" || e.reference_id === selectedCustomer)));
  const supplierEntries = filterByDate(ledgerEntries.filter((e: any) =>
    e.entry_type === "supplier" && (selectedSupplier === "all" || e.reference_id === selectedSupplier)));

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      return { ...e, running_balance: balance };
    }).reverse();
  };

  const partyName = (entry: any, list: any[]) => list.find((p: any) => p.id === entry.reference_id)?.name || "-";

  const customerColumns = [
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    ...(selectedCustomer === "all" ? [{ key: "reference_id", label: "Customer", render: (_: string, row: any) => partyName(row, customers) }] : []),
    { key: "description", label: "Description" },
    { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "running_balance", label: "Balance", render: (v: number) => (
      <span className={v > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(v)}</span>
    )},
  ];

  const supplierColumns = [
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    ...(selectedSupplier === "all" ? [{ key: "reference_id", label: "Supplier", render: (_: string, row: any) => partyName(row, suppliers) }] : []),
    { key: "description", label: "Description" },
    { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "running_balance", label: "Balance", render: (v: number) => (
      <span className={v > 0 ? "text-success font-medium" : "text-destructive font-medium"}>{formatCurrency(v)}</span>
    )},
  ];

  const custWithBalance = calcRunningBalance(customerEntries);
  const supWithBalance = calcRunningBalance(supplierEntries);

  const activeEntries = activeTab === "customer" ? custWithBalance : supWithBalance;
  const totalDebit = activeEntries.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalCredit = activeEntries.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;

  const reportSubtitle = activeTab === "customer"
    ? (selectedCustomer === "all" ? "All Customers" : customers.find((c: any) => c.id === selectedCustomer)?.name || "")
    : (selectedSupplier === "all" ? "All Suppliers" : suppliers.find((s: any) => s.id === selectedSupplier)?.name || "");
  const dateRangeLabel = dateFrom || dateTo ? ` (${dateFrom || "start"} → ${dateTo || "today"})` : "";

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <ReportHeader
          title={activeTab === "customer" ? "Customer Ledger Report" : "Supplier Ledger Report"}
          subtitle={`${reportSubtitle}${dateRangeLabel}`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Ledger</h1>
            <p className="text-sm text-muted-foreground">Customer & supplier ledger accounts</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex gap-2 items-center bg-card border rounded-lg px-3 py-1.5">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Print summary */}
        <div className="hidden print:block">
          <div className="flex justify-between text-sm border rounded-lg p-3 mb-2">
            <span><strong>Total Debit:</strong> {formatCurrency(totalDebit)}</span>
            <span><strong>Total Credit:</strong> {formatCurrency(totalCredit)}</span>
            <span><strong>Net Balance:</strong> {formatCurrency(Math.abs(netBalance))} {netBalance >= 0 ? "(Receivable)" : "(Payable)"}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="print:hidden">
            <TabsTrigger value="customer">Customer Ledger</TabsTrigger>
            <TabsTrigger value="supplier">Supplier Ledger</TabsTrigger>
          </TabsList>
          <TabsContent value="customer" className="space-y-4">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-64 print:hidden"><SelectValue placeholder="All Customers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={customerColumns} data={custWithBalance} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="supplier" className="space-y-4">
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-64 print:hidden"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={supplierColumns} data={supWithBalance} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* On-screen totals */}
        <div className="grid grid-cols-3 gap-3 print:hidden">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Debit</p><p className="font-bold">{formatCurrency(totalDebit)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Credit</p><p className="font-bold">{formatCurrency(totalCredit)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Net Balance</p><p className={`font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(Math.abs(netBalance))}</p></CardContent></Card>
        </div>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default Ledger;
