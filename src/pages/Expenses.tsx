import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { postAccountEntries } from "@/lib/accounting";
import { Plus } from "lucide-react";

const expenseCategories = ["Rent", "Utilities", "Salary", "Transport", "Office Supplies", "Misc"];

const Expenses = () => {
  const { data, create, remove } = useBusinessData("expenses");
  const { businessId } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount) || 0;
    const ok = await create({ ...form, amount });
    if (ok) {
      // Chart of Accounts: expense paid out of Cash
      if (businessId) {
        postAccountEntries(businessId, `${form.category}${form.description ? `: ${form.description}` : ""}`, [
          { account: "MISC_EXPENSE", debit: amount },
          { account: "CASH", credit: amount },
        ]);
      }
      setOpen(false); setForm({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    }
  };

  const totalExpenses = data.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const columns = [
    { key: "date", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", render: (v: number) => formatCurrency(v) },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalExpenses)}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <Button type="submit" className="w-full">Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} onDelete={(row) => remove(row.id)} />
      </div>
    </AppLayout>
  );
};

export default Expenses;
