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
  const { data: karigars } = useBusinessData("karigars");
  const { data: employees } = useBusinessData("employees");
  const [activeTab, setActiveTab] = useState("customer");
  const [selected, setSelected] = useState<Record<string, string>>({
    customer: "all", supplier: "all", karigar: "all", employee: "all",
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const partyLists: Record<string, { list: any[]; label: string; nameKey: string; title: string }> = {
    customer: { list: customers, label: "Customer", nameKey: "name", title: "Customer Ledger Report" },
    supplier: { list: suppliers, label: "Supplier", nameKey: "name", title: "Supplier Ledger Report" },
    karigar:  { list: karigars, label: "Karigar", nameKey: "name", title: "Karigar Ledger Report" },
    employee: { list: employees, label: "Employee", nameKey: "full_name", title: "Employee Ledger Report" },
  };

  const filterByDate = (entries: any[]) => entries.filter((e: any) => {
    const d = new Date(e.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const entriesFor = (type: string) => filterByDate(ledgerEntries.filter((e: any) =>
    e.entry_type === type && (selected[type] === "all" || e.reference_id === selected[type])));

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      return { ...e, running_balance: balance };
    }).reverse();
  };

  const columnsFor = (type: string) => {
    const { list, label, nameKey } = partyLists[type];
    return [
      { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
      ...(selected[type] === "all" ? [{
        key: "reference_id", label,
        render: (_: string, row: any) => list.find((p: any) => p.id === row.reference_id)?.[nameKey] || "-",
      }] : []),
      { key: "description", label: "Description" },
      { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
      { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
      { key: "running_balance", label: "Balance", render: (v: number) => (
        <span className={v > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(Math.abs(v))}</span>
      )},
    ];
  };

  const activeConfig = partyLists[activeTab];
  const activeEntries = calcRunningBalance(entriesFor(activeTab));
  const totalDebit = activeEntries.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalCredit = activeEntries.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;

  const selectedName = selected[activeTab] === "all"
    ? `All ${activeConfig.label}s`
    : activeConfig.list.find((p: any) => p.id === selected[activeTab])?.[activeConfig.nameKey] || "";
  const dateRangeLabel = dateFrom || dateTo ? ` (${dateFrom || "start"} → ${dateTo || "today"})` : "";

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <ReportHeader title={activeConfig.title} subtitle={`${selectedName}${dateRangeLabel}`} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Ledger</h1>
            <p className="text-sm text-muted-foreground">Customer, supplier, karigar & employee ledgers</p>
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
          <TabsList className="print:hidden flex-wrap h-auto">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="karigar">Karigar</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
          </TabsList>
          {Object.keys(partyLists).map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <Select value={selected[type]} onValueChange={v => setSelected({ ...selected, [type]: v })}>
                <SelectTrigger className="w-64 print:hidden"><SelectValue placeholder={`All ${partyLists[type].label}s`} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {partyLists[type].label}s</SelectItem>
                  {partyLists[type].list.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p[partyLists[type].nameKey]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Card>
                <CardContent className="pt-4">
                  <DataTable columns={columnsFor(type)} data={type === activeTab ? activeEntries : calcRunningBalance(entriesFor(type))} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
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
