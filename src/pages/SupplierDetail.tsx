import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import PrintHeader from "@/components/shared/PrintHeader";
import PrintFooter from "@/components/shared/PrintFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, User, Phone, MapPin, Wallet, Coins, Printer } from "lucide-react";

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const supplier = suppliers.find((s: any) => s.id === id);
  const allLedger = ledgerEntries.filter((e: any) => e.entry_type === "supplier" && e.reference_id === id);

  const filteredLedger = allLedger.filter((e: any) => {
    const d = new Date(e.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0, goldBalance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      goldBalance += Number(e.gold_debit || 0) - Number(e.gold_credit || 0);
      return { ...e, running_balance: balance, running_gold_balance: goldBalance };
    }).reverse();
  };

  const rows = calcRunningBalance(filteredLedger);
  const totalDebit = filteredLedger.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalCredit = filteredLedger.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
  const netBalance = totalDebit - totalCredit; // negative = we owe supplier
  const totalGoldDebit = filteredLedger.reduce((s: number, e: any) => s + Number(e.gold_debit || 0), 0);
  const totalGoldCredit = filteredLedger.reduce((s: number, e: any) => s + Number(e.gold_credit || 0), 0);
  const netGold = totalGoldDebit - totalGoldCredit;

  if (!supplier) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Supplier not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Suppliers
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PrintHeader title="Supplier Ledger" subtitle={supplier.name} />

        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              <p className="text-sm text-muted-foreground">Supplier Details & Ledger</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print Ledger
          </Button>
        </div>

        <Card className="print:hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={supplier.photo_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{supplier.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><User className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-sm">{supplier.name}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-sm">{supplier.phone || "-"}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Address</p><p className="font-medium text-sm">{supplier.address || "-"}</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="print:hidden flex items-center gap-2 bg-card border rounded-lg px-3 py-2 w-fit">
          <span className="text-xs text-muted-foreground">Date Range:</span>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
          <span className="text-muted-foreground text-xs">→</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
          <StatCard title="Debit" value={formatCurrency(totalDebit)} icon={Wallet} />
          <StatCard title="Credit" value={formatCurrency(totalCredit)} icon={Wallet} />
          <StatCard title="Balance" value={formatCurrency(Math.abs(netBalance))} subtitle={netBalance >= 0 ? "Lena" : "Dena"} icon={Wallet} trend={netBalance >= 0 ? "up" : "down"} />
          <StatCard title="Gold Balance" value={`${Math.abs(netGold).toFixed(3)}g`} subtitle={netGold >= 0 ? "Lena" : "Dena"} icon={Coins} gradient="amber" />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Ledger{(dateFrom || dateTo) ? ` (${dateFrom || "start"} → ${dateTo || "today"})` : ""}</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              { key: "description", label: "Description" },
              { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "gold_debit", label: "Gold Dr (g)", render: (v: number) => Number(v) > 0 ? `${Number(v).toFixed(3)}g` : "-" },
              { key: "gold_credit", label: "Gold Cr (g)", render: (v: number) => Number(v) > 0 ? `${Number(v).toFixed(3)}g` : "-" },
              { key: "running_balance", label: "Balance", render: (v: number) => (
                <span className={v > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(Math.abs(v))}</span>
              )},
            ]} data={rows} />
          </CardContent>
        </Card>

        <PrintFooter />
      </div>
    </AppLayout>
  );
};

export default SupplierDetail;
