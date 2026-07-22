import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import PrintHeader from "@/components/shared/PrintHeader";
import PrintFooter from "@/components/shared/PrintFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, User, Phone, Briefcase, Wallet, Printer, Plus } from "lucide-react";

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businessId } = useAuth();
  const { toast } = useToast();
  const { data: employees } = useBusinessData("employees");
  const { data: ledgerEntries, fetch: fetchLedger } = useBusinessData("ledger_entries");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [withdrawNote, setWithdrawNote] = useState("");

  const employee = employees.find((e: any) => e.id === id);
  const allLedger = ledgerEntries.filter((e: any) => e.entry_type === "employee" && e.reference_id === id);

  const filteredLedger = allLedger.filter((e: any) => {
    const d = new Date(e.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      return { ...e, running_balance: balance };
    }).reverse();
  };

  const rows = calcRunningBalance(filteredLedger);
  // debit = paid/taken by employee, credit = owed to employee (e.g. accrued salary)
  const totalWithdrawn = filteredLedger.reduce((s: number, e: any) => s + Number(e.debit || 0), 0);
  const totalOwed = filteredLedger.reduce((s: number, e: any) => s + Number(e.credit || 0), 0);

  const recordWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || !businessId || !employee) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const { error } = await (supabase.from("ledger_entries") as any).insert({
      business_id: businessId,
      entry_type: "employee",
      reference_id: employee.id,
      description: withdrawNote.trim() || `Withdrawal - ${withdrawDate}`,
      debit: amt,
      credit: 0,
      balance: 0,
      created_at: new Date(withdrawDate).toISOString(),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Withdrawal recorded" });
    setWithdrawOpen(false);
    setWithdrawAmount("");
    setWithdrawNote("");
    fetchLedger();
  };

  if (!employee) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Employee not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/employees")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PrintHeader title="Employee Ledger" subtitle={employee.full_name} />

        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee.full_name}</h1>
              <p className="text-sm text-muted-foreground">{employee.position || "Employee"} — Details & Ledger</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Record Withdrawal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Withdrawal — {employee.full_name}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input type="number" step="0.01" placeholder="Amount (PKR)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                  <Input type="date" value={withdrawDate} onChange={e => setWithdrawDate(e.target.value)} />
                  <Textarea placeholder="Note (optional)" value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} rows={2} />
                  <Button className="w-full" onClick={recordWithdrawal}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print Ledger
            </Button>
          </div>
        </div>

        <Card className="print:hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{employee.full_name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><User className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-sm">{employee.full_name}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Briefcase className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Position</p><p className="font-medium text-sm">{employee.position || "-"}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-sm">{employee.phone || "-"}</p></div>
                </div>
                {Number(employee.salary) > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Wallet className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">Salary</p><p className="font-medium text-sm">{formatCurrency(employee.salary)}/month</p></div>
                  </div>
                )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          <StatCard title="Total Taken (in range)" value={formatCurrency(totalWithdrawn)} icon={Wallet} trend="down" />
          <StatCard title="Total Owed / Accrued (in range)" value={formatCurrency(totalOwed)} icon={Wallet} />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Ledger{(dateFrom || dateTo) ? ` (${dateFrom || "start"} → ${dateTo || "today"})` : ""}</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              { key: "description", label: "Description" },
              { key: "debit", label: "Taken (Debit)", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "credit", label: "Owed (Credit)", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
              { key: "running_balance", label: "Balance", render: (v: number) => (
                <span className={v < 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(Math.abs(v))}</span>
              )},
            ]} data={rows} />
          </CardContent>
        </Card>

        <PrintFooter />
      </div>
    </AppLayout>
  );
};

export default EmployeeDetail;
