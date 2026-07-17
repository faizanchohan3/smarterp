import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const Employees = () => {
  const navigate = useNavigate();
  const { data, loading: empLoading, create, update, remove, fetch: fetchEmployees } = useBusinessData("employees");
  const { data: salaries, fetch: fetchSalaries } = useBusinessData("salaries");
  const { data: ledgerEntries, loading: ledgerLoading, fetch: fetchLedger } = useBusinessData("ledger_entries");
  const { businessId } = useAuth();
  const { toast } = useToast();
  const accrualRan = useRef(false);

  // ── Monthly salary accrual ──────────────────────────────────────────────
  // On the 1st of each month (first visit that month), credit each employee's
  // ledger with their salary (amount owed) and post the total to the
  // "Salaries Payable" liability account in chart of accounts.
  useEffect(() => {
    if (!businessId || empLoading || ledgerLoading || accrualRan.current) return;
    if (data.length === 0) return;
    accrualRan.current = true;

    (async () => {
      const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      let accruedTotal = 0;

      for (const emp of data) {
        const sal = Number(emp.salary) || 0;
        if (sal <= 0) continue;
        const already = ledgerEntries.some((e: any) =>
          e.entry_type === "employee" && e.reference_id === emp.id && e.description === `Salary Due - ${monthKey}`);
        if (!already) {
          await (supabase.from("ledger_entries") as any).insert({
            business_id: businessId,
            entry_type: "employee",
            reference_id: emp.id,
            description: `Salary Due - ${monthKey}`,
            debit: 0,
            credit: sal,
            balance: 0,
          });
          accruedTotal += sal;
        }
      }

      // Post the accrued total to the Salaries Payable liability account
      if (accruedTotal > 0) {
        const { data: accts } = await (supabase.from("chart_of_accounts") as any)
          .select("id").eq("business_id", businessId).eq("name", "Salaries Payable").limit(1);
        let acctId = accts?.[0]?.id;
        if (!acctId) {
          const { data: newAcct } = await (supabase.from("chart_of_accounts") as any).insert({
            business_id: businessId, code: "2100", name: "Salaries Payable",
            type: "liability", description: "Monthly salaries owed to employees",
          }).select().single();
          acctId = newAcct?.id;
        }
        if (acctId) {
          await (supabase.from("ledger_entries") as any).insert({
            business_id: businessId,
            entry_type: "account",
            account_id: acctId,
            reference_id: acctId,
            description: `Salaries Payable - ${monthKey}`,
            debit: 0,
            credit: accruedTotal,
            balance: 0,
          });
        }
        fetchLedger();
      }
    })();
  }, [businessId, empLoading, ledgerLoading, data, ledgerEntries]);
  const [open, setOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [salaryMonth, setSalaryMonth] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", position: "", salary: "" });

  // Is this employee's salary paid for the current month?
  const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const isPaidThisMonth = (empId: string) =>
    salaries.some((s: any) => s.employee_id === empId && String(s.salary_month || "").slice(0, 7) === currentMonthKey);

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "position", label: "Position" },
    { key: "salary", label: "Salary (PKR)", render: (v: number) => formatCurrency(v) },
    { key: "id", label: "This Month", render: (_: string, row: any) => (
      isPaidThisMonth(row.id)
        ? <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">Paid</span>
        : <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">Unpaid</span>
    )},
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const record = { ...form, salary: parseFloat(form.salary) || 0 };
    const ok = editing ? await update(editing.id, record) : await create(record);
    if (ok) { setOpen(false); setEditing(null); setForm({ full_name: "", phone: "", position: "", salary: "" }); }
  };

  const handlePaySalary = async () => {
    if (!selectedEmp || !businessId) return;
    // Create salary record
    const { error: salErr } = await (supabase.from("salaries") as any).insert({
      business_id: businessId,
      employee_id: selectedEmp.id,
      amount: selectedEmp.salary,
      salary_month: salaryMonth,
    });
    if (salErr) { toast({ title: "Error", description: salErr.message, variant: "destructive" }); return; }

    // Auto-add to expenses
    await (supabase.from("expenses") as any).insert({
      business_id: businessId,
      category: "Salary",
      description: `Salary for ${selectedEmp.full_name} - ${salaryMonth}`,
      amount: selectedEmp.salary,
    });

    // Record in employee ledger (payment made to employee)
    await (supabase.from("ledger_entries") as any).insert({
      business_id: businessId,
      entry_type: "employee",
      reference_id: selectedEmp.id,
      description: `Salary Paid - ${salaryMonth}`,
      debit: Number(selectedEmp.salary) || 0,
      credit: 0,
      balance: 0,
    });

    // Record in payments so it shows on the Payments page too
    await (supabase.from("payments") as any).insert({
      business_id: businessId,
      type: "employee_payment",
      reference_id: selectedEmp.id,
      amount: Number(selectedEmp.salary) || 0,
      description: `Salary - ${salaryMonth}`,
      payment_method: "cash",
    });

    // Settle the Salaries Payable liability account (debit)
    const { data: accts } = await (supabase.from("chart_of_accounts") as any)
      .select("id").eq("business_id", businessId).eq("name", "Salaries Payable").limit(1);
    if (accts?.[0]?.id) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "account",
        account_id: accts[0].id,
        reference_id: accts[0].id,
        description: `Salary Paid: ${selectedEmp.full_name} - ${salaryMonth}`,
        debit: Number(selectedEmp.salary) || 0,
        credit: 0,
        balance: 0,
      });
    }

    toast({ title: "Salary paid — added to expenses, ledger & payments" });
    setSalaryOpen(false);
    fetchSalaries();
    fetchLedger();
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ full_name: row.full_name, phone: row.phone || "", position: row.position || "", salary: String(row.salary) });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Employees</h1>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); setForm({ full_name: "", phone: "", position: "", salary: "" }); setOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Employee</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <Input placeholder="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
                  <Input placeholder="Salary" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                  <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DataTable
          columns={[...columns, {
            key: "id",
            label: "Actions",
            render: (_: any, row: any) => (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEmp(row);
                  setSalaryMonth(new Date().toISOString().slice(0, 10));
                  setSalaryOpen(true);
                }}>Pay</Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ledger?tab=employee&id=${row.id}`);
                }}><BookOpen className="w-3.5 h-3.5" /> Ledger</Button>
              </div>
            ),
          }]}
          data={data}
          onEdit={openEdit}
          onDelete={(row) => remove(row.id)}
        />

        <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Pay Salary</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Pay <strong>{selectedEmp?.full_name}</strong> — PKR {Number(selectedEmp?.salary).toLocaleString()}</p>
              <Input type="date" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} placeholder="Select date" />
              <Button className="w-full" onClick={handlePaySalary}>Confirm Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Employees;
