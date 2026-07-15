import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const Employees = () => {
  const { data, create, update, remove, fetch: fetchEmployees } = useBusinessData("employees");
  const { businessId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [salaryMonth, setSalaryMonth] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", position: "", salary: "" });

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "position", label: "Position" },
    { key: "salary", label: "Salary (PKR)", render: (v: number) => formatCurrency(v) },
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

    toast({ title: "Salary paid and added to expenses" });
    setSalaryOpen(false);
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
            label: "Pay Salary",
            render: (_: any, row: any) => (
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                setSelectedEmp(row);
                setSalaryMonth(new Date().toISOString().slice(0, 10));
                setSalaryOpen(true);
              }}>Pay</Button>
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
