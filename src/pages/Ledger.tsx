import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { data: ledgerEntries, fetch: fetchLedgerEntries } = useBusinessData("ledger_entries");
  const { toast } = useToast();

  // Escape hatch for stray/orphaned entries (e.g. left over from an old flow
  // that no longer exists) that have no page of their own to be deleted from.
  const deleteEntry = async (row: any) => {
    if (row.__total) return;
    if (!confirm(`Delete this ledger entry?\n\n"${row.description}"\n\nThis only removes the ledger row — it does not touch any linked sale/purchase record. This cannot be undone.`)) return;
    const { error } = await (supabase.from("ledger_entries") as any).delete().eq("id", row.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Ledger entry deleted" });
    fetchLedgerEntries();
  };
  const { data: customers } = useBusinessData("customers");
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: karigars } = useBusinessData("karigars");
  const { data: employees } = useBusinessData("employees");
  const [searchParams] = useSearchParams();
  const initialTab = ["customer", "supplier", "karigar", "employee"].includes(searchParams.get("tab") || "")
    ? (searchParams.get("tab") as string) : "customer";
  const initialId = searchParams.get("id") || "all";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selected, setSelected] = useState<Record<string, string>>({
    customer: "all", supplier: "all", karigar: "all", employee: "all",
    [initialTab]: initialId,
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

  // Oldest entry at top, newest at bottom (like a traditional ledger register)
  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    let goldBalance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      goldBalance += Number(e.gold_debit || 0) - Number(e.gold_credit || 0);
      return { ...e, running_balance: balance, running_gold_balance: goldBalance };
    });
  };

  // Append a TOTAL row at the bottom: totals sit directly under their columns
  const withTotalRow = (rows: any[]) => {
    if (rows.length === 0) return rows;
    const td = rows.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
    const tc = rows.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
    const tgd = rows.reduce((s: number, e: any) => s + Number(e.gold_debit || 0), 0);
    const tgc = rows.reduce((s: number, e: any) => s + Number(e.gold_credit || 0), 0);
    return [...rows, {
      id: "__total__", __total: true, description: "TOTAL",
      debit: td, credit: tc, gold_debit: tgd, gold_credit: tgc,
      running_balance: td - tc, running_gold_balance: tgd - tgc,
    }];
  };

  // Gold len-den only applies to suppliers and karigars
  const GOLD_TABS = ["supplier", "karigar"];
  const isGoldTab = (type: string) => GOLD_TABS.includes(type);

  const columnsFor = (type: string) => {
    const { list, label, nameKey } = partyLists[type];
    const goldTab = isGoldTab(type);
    return [
      { key: "created_at", label: "Date", render: (v: string, row: any) =>
        row.__total ? "" : new Date(v).toLocaleDateString() },
      ...(selected[type] === "all" ? [{
        key: "reference_id", label,
        render: (_: string, row: any) => row.__total ? "" : (list.find((p: any) => p.id === row.reference_id)?.[nameKey] || "-"),
      }] : []),
      { key: "description", label: "Description", render: (v: string, row: any) =>
        row.__total ? <span className="font-bold">TOTAL</span> : v },
      { key: "debit", label: "Debit", render: (v: number, row: any) =>
        row.__total
          ? <span className="font-bold border-t-2 border-foreground pt-1 inline-block">{formatCurrency(v)}</span>
          : (Number(v) > 0 ? formatCurrency(v) : "-") },
      { key: "credit", label: "Credit", render: (v: number, row: any) =>
        row.__total
          ? <span className="font-bold border-t-2 border-foreground pt-1 inline-block">{formatCurrency(v)}</span>
          : (Number(v) > 0 ? formatCurrency(v) : "-") },
      ...(goldTab ? [
        { key: "gold_debit", label: "Gold Dr (g)", render: (v: number, row: any) =>
          row.__total
            ? <span className="font-bold border-t-2 border-foreground pt-1 inline-block">{Number(v).toFixed(3)}g</span>
            : (Number(v) > 0 ? `${Number(v).toFixed(3)}g` : "-") },
        { key: "gold_credit", label: "Gold Cr (g)", render: (v: number, row: any) =>
          row.__total
            ? <span className="font-bold border-t-2 border-foreground pt-1 inline-block">{Number(v).toFixed(3)}g</span>
            : (Number(v) > 0 ? `${Number(v).toFixed(3)}g` : "-") },
      ] : []),
      { key: "running_balance", label: "Balance", render: (v: number, row: any) => (
        <div className={row.__total ? "font-bold border-t-2 border-foreground pt-1" : ""}>
          <span className={v > 0 ? "text-destructive font-medium" : "text-success font-medium"}>
            {formatCurrency(Math.abs(v))}{row.__total ? ` ${v >= 0 ? "(Lena)" : "(Dena)"}` : ""}
          </span>
          {goldTab && Math.abs(Number(row.running_gold_balance || 0)) > 0.0001 && (
            <div className="text-xs text-amber-600">
              {Math.abs(Number(row.running_gold_balance)).toFixed(3)}g gold{row.__total ? ` ${Number(row.running_gold_balance) >= 0 ? "(Lena)" : "(Dena)"}` : ""}
            </div>
          )}
        </div>
      )},
    ];
  };

  const activeConfig = partyLists[activeTab];
  const activeEntries = calcRunningBalance(entriesFor(activeTab));
  const totalDebit = activeEntries.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalCredit = activeEntries.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;
  const totalGoldDebit = activeEntries.reduce((s: number, e: any) => s + Number(e.gold_debit || 0), 0);
  const totalGoldCredit = activeEntries.reduce((s: number, e: any) => s + Number(e.gold_credit || 0), 0);
  const netGoldBalance = totalGoldDebit - totalGoldCredit;

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
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* ── TOP SUMMARY: PKR aur Gold alag alag (screen + print) ── */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-primary/30"><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">PKR Debit</p>
              <p className="font-bold">{formatCurrency(totalDebit)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">PKR Credit</p>
              <p className="font-bold">{formatCurrency(totalCredit)}</p>
            </CardContent></Card>
            <Card className="border-primary/30"><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">PKR Balance</p>
              <p className={`font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(Math.abs(netBalance))} <span className="text-xs font-normal">{netBalance >= 0 ? "(Lena)" : "(Dena)"}</span>
              </p>
            </CardContent></Card>
          </div>
          {isGoldTab(activeTab) && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400">Gold Debit</p>
                <p className="font-bold text-amber-700 dark:text-amber-400">{totalGoldDebit.toFixed(3)}g</p>
              </CardContent></Card>
              <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400">Gold Credit</p>
                <p className="font-bold text-amber-700 dark:text-amber-400">{totalGoldCredit.toFixed(3)}g</p>
              </CardContent></Card>
              <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400">Gold Balance</p>
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  {Math.abs(netGoldBalance).toFixed(3)}g <span className="text-xs font-normal">{netGoldBalance >= 0 ? "(Lena)" : "(Dena)"}</span>
                </p>
              </CardContent></Card>
            </div>
          )}
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
                  <DataTable columns={columnsFor(type)} data={withTotalRow(type === activeTab ? activeEntries : calcRunningBalance(entriesFor(type)))} onDelete={deleteEntry} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default Ledger;
