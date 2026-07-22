import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import StatCard from "@/components/shared/StatCard";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { Printer, Landmark, Scale, Wallet } from "lucide-react";

// Normal-balance sign convention: Assets & Expenses grow with debit;
// Liabilities, Equity & Revenue grow with credit.
const DEBIT_NORMAL = ["asset", "expense"];

const TYPE_LABELS: Record<string, string> = {
  asset: "Assets", liability: "Liabilities", equity: "Equity", revenue: "Revenue", expense: "Expenses",
};
const TYPE_ORDER = ["asset", "liability", "equity", "revenue", "expense"];

const ReportChartOfAccounts = () => {
  const { data: accounts } = useBusinessData("chart_of_accounts");
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");

  const accountLedger = ledgerEntries.filter((e: any) => e.entry_type === "account");
  const filtered = accountLedger.filter((e: any) => {
    const d = new Date(e.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const sortedAccounts = [...accounts].sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
  const activeAccount = accounts.find((a: any) => a.id === selectedAccount);

  // Single-account view: full transaction history with a running balance,
  // like Ledger's per-party detail view.
  const accountEntries = selectedAccount === "all" ? [] : filtered.filter((e: any) => e.account_id === selectedAccount);
  const accountRows = (() => {
    if (!activeAccount) return [];
    let balance = 0;
    const debitNormal = DEBIT_NORMAL.includes(activeAccount.type);
    return [...accountEntries].reverse().map((e: any) => {
      balance += debitNormal ? Number(e.debit || 0) - Number(e.credit || 0) : Number(e.credit || 0) - Number(e.debit || 0);
      return { ...e, running_balance: balance };
    }).reverse();
  })();
  const accountTotalDebit = accountEntries.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const accountTotalCredit = accountEntries.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
  const accountBalance = activeAccount
    ? (DEBIT_NORMAL.includes(activeAccount.type) ? accountTotalDebit - accountTotalCredit : accountTotalCredit - accountTotalDebit)
    : 0;

  const balanceFor = (accountId: string, type: string) => {
    const entries = filtered.filter((e: any) => e.account_id === accountId);
    const debit = entries.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
    const credit = entries.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);
    return { debit, credit, balance: DEBIT_NORMAL.includes(type) ? debit - credit : credit - debit };
  };

  const rowsByType: Record<string, any[]> = {};
  for (const type of TYPE_ORDER) {
    rowsByType[type] = accounts
      .filter((a: any) => a.type === type)
      .map((a: any) => ({ ...a, ...balanceFor(a.id, type) }))
      .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
  }

  const totalByType = (type: string) => rowsByType[type].reduce((s, r) => s + r.balance, 0);
  const totalAssets = totalByType("asset");
  const totalLiabilities = totalByType("liability");
  const totalEquity = totalByType("equity");
  const totalRevenue = totalByType("revenue");
  const totalExpense = totalByType("expense");
  const netIncome = totalRevenue - totalExpense;

  const totalDebits = filtered.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalCredits = filtered.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Chart of Accounts Report" subtitle="Trial balance — account balances by type" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Chart of Accounts Report</h1>
            <p className="text-sm text-muted-foreground">Balances per account (trial balance)</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-56 h-9 text-sm bg-card"><SelectValue placeholder="All Accounts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {sortedAccounts.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center bg-card border rounded-lg px-3 py-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              <span className="text-muted-foreground text-xs">→</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
              )}
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {activeAccount ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard title="Total Debit" value={formatCurrency(accountTotalDebit)} icon={Wallet} />
              <StatCard title="Total Credit" value={formatCurrency(accountTotalCredit)} icon={Wallet} />
              <StatCard title="Balance" value={formatCurrency(Math.abs(accountBalance))} subtitle={accountBalance >= 0 ? "Normal balance" : "Negative"} icon={Scale} trend={accountBalance >= 0 ? "up" : "down"} />
            </div>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">{activeAccount.code} - {activeAccount.name}</CardTitle></CardHeader>
              <CardContent>
                <DataTable columns={[
                  { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
                  { key: "description", label: "Description" },
                  { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
                  { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
                  { key: "running_balance", label: "Balance", render: (v: number) => (
                    <span className={v < 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(Math.abs(v))}</span>
                  )},
                ]} data={accountRows} />
              </CardContent>
            </Card>
          </>
        ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Assets" value={formatCurrency(totalAssets)} icon={Landmark} gradient="blue" />
          <StatCard title="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={Landmark} gradient="red" />
          <StatCard title="Total Equity" value={formatCurrency(totalEquity)} icon={Scale} gradient="purple" />
          <StatCard title="Net Income (Rev − Exp)" value={formatCurrency(netIncome)} icon={Scale} gradient={netIncome >= 0 ? "green" : "red"} trend={netIncome >= 0 ? "up" : "down"} />
        </div>

        {TYPE_ORDER.map(type => (
          rowsByType[type].length > 0 && (
            <Card key={type}>
              <CardHeader className="pb-3"><CardTitle className="text-sm">{TYPE_LABELS[type]}</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50">
                      <th className="text-left p-2.5">Code</th>
                      <th className="text-left p-2.5">Account</th>
                      <th className="text-right p-2.5">Debit</th>
                      <th className="text-right p-2.5">Credit</th>
                      <th className="text-right p-2.5">Balance</th>
                    </tr></thead>
                    <tbody>
                      {rowsByType[type].map((a: any) => (
                        <tr key={a.id} className="border-t">
                          <td className="p-2.5 text-muted-foreground">{a.code}</td>
                          <td className="p-2.5">{a.parent_id ? <span className="pl-3">{a.name}</span> : <strong>{a.name}</strong>}</td>
                          <td className="p-2.5 text-right">{a.debit > 0 ? formatCurrency(a.debit) : "-"}</td>
                          <td className="p-2.5 text-right">{a.credit > 0 ? formatCurrency(a.credit) : "-"}</td>
                          <td className={`p-2.5 text-right font-semibold ${a.balance < 0 ? "text-destructive" : ""}`}>{formatCurrency(a.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/40 font-bold">
                        <td colSpan={4} className="p-2.5 text-right">Total {TYPE_LABELS[type]}</td>
                        <td className="p-2.5 text-right">{formatCurrency(totalByType(type))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ))}

        {accountLedger.length === 0 && (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Abhi tak koi account-level ledger entry nahi hui (jaise Salaries Payable accrual). Jab koi automatic accounting entry banegi, yahan dikhegi.
          </CardContent></Card>
        )}

        <Card className="print:hidden">
          <CardContent className="p-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Total Debits (in range)</span>
            <span className="font-semibold">{formatCurrency(totalDebits)}</span>
          </CardContent>
          <CardContent className="p-4 pt-0 flex justify-between text-sm">
            <span className="text-muted-foreground">Total Credits (in range)</span>
            <span className="font-semibold">{formatCurrency(totalCredits)}</span>
          </CardContent>
        </Card>
        </>
        )}

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportChartOfAccounts;
