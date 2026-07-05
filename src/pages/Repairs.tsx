import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ImageUpload from "@/components/shared/ImageUpload";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Plus, Wrench } from "lucide-react";
import StatCard from "@/components/shared/StatCard";

const Repairs = () => {
  const { businessId } = useAuth();
  const { toast } = useToast();
  const { data, create, update, remove } = useBusinessData("job_cards" as any);
  const { data: customers } = useBusinessData("customers");
  const { data: karigars } = useBusinessData("karigars" as any);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    customer_id: "",
    customer_phone_snapshot: "",
    karigar_id: "",
    service_type: "repair",
    description: "",
    gold_given: "",
    gold_given_unit: "gram",
    service_charge: "",
    advance_amount: "",
    given_date: new Date().toISOString().split("T")[0],
    expected_date: "",
    item_photo_url: "",
  });

  const resetForm = () => setForm({
    customer_id: "", customer_phone_snapshot: "", karigar_id: "", service_type: "repair",
    description: "", gold_given: "", gold_given_unit: "gram", service_charge: "",
    advance_amount: "", given_date: new Date().toISOString().split("T")[0],
    expected_date: "", item_photo_url: "",
  });

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      customer_id: row.customer_id || "",
      customer_phone_snapshot: row.customer_phone_snapshot || "",
      karigar_id: row.karigar_id || "",
      service_type: row.service_type || "repair",
      description: row.description,
      gold_given: String(row.gold_given || 0),
      gold_given_unit: row.gold_given_unit || "gram",
      service_charge: String(row.service_charge || 0),
      advance_amount: String(row.advance_amount || 0),
      given_date: row.given_date || new Date().toISOString().split("T")[0],
      expected_date: row.expected_date || "",
      item_photo_url: row.item_photo_url || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const record = {
      customer_id: form.customer_id || null,
      customer_phone_snapshot: form.customer_phone_snapshot || null,
      karigar_id: form.karigar_id || null,
      service_type: form.service_type,
      description: form.description,
      gold_given: parseFloat(form.gold_given) || 0,
      gold_given_unit: form.gold_given_unit,
      service_charge: parseFloat(form.service_charge) || 0,
      advance_amount: parseFloat(form.advance_amount) || 0,
      given_date: form.given_date || null,
      expected_date: form.expected_date || null,
      item_photo_url: form.item_photo_url || null,
      status: editing ? editing.status : "pending",
    };

    if (editing) {
      await update(editing.id, record);
    } else {
      const jobNumber = `JC-${Date.now().toString(36).toUpperCase()}`;
      const ok = await create({ ...record, job_number: jobNumber });

      if (ok && form.advance_amount && parseFloat(form.advance_amount) > 0 && form.customer_id) {
        await (supabase.from("ledger_entries") as any).insert({
          business_id: businessId,
          entry_type: "customer",
          reference_id: form.customer_id,
          description: `Repair Advance - ${jobNumber}`,
          credit: parseFloat(form.advance_amount),
          debit: 0,
          balance: 0,
        });
      }
    }
    setOpen(false);
    setEditing(null);
    resetForm();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await update(id, { status });
  };

  const columns = [
    { key: "job_number", label: "Job #" },
    { key: "customer_id", label: "Customer", render: (v: string) => customers.find((c: any) => c.id === v)?.name || "Walk-in" },
    { key: "service_type", label: "Service" },
    { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v} /> },
    { key: "gold_given", label: "Gold", render: (v: number, row: any) => `${v} ${row.gold_given_unit}` },
    { key: "service_charge", label: "Charge", render: (v: number) => formatCurrency(v) },
    { key: "advance_amount", label: "Advance", render: (v: number) => formatCurrency(v) },
    { key: "expected_date", label: "Due Date", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
  ];

  const pending = data.filter((j: any) => j.status === "pending").length;
  const inProgress = data.filter((j: any) => j.status === "in_progress").length;
  const ready = data.filter((j: any) => j.status === "ready").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Repairs & Service</h1>
            <p className="text-muted-foreground mt-1">Manage repair jobs and service orders</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }} className="gap-2">
                <Plus className="w-4 h-4" />
                New Repair Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Repair Ticket" : "Create Repair Ticket"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.customer_id} onValueChange={v => { setForm({ ...form, customer_id: v, customer_phone_snapshot: customers.find((c: any) => c.id === v)?.phone || "" }); }}>
                    <SelectTrigger><SelectValue placeholder="Customer (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Phone" value={form.customer_phone_snapshot} onChange={e => setForm({ ...form, customer_phone_snapshot: e.target.value })} />
                </div>

                <Select value={form.karigar_id} onValueChange={v => setForm({ ...form, karigar_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign Karigar (optional)" /></SelectTrigger>
                  <SelectContent>
                    {karigars.map((k: any) => <SelectItem key={k.id} value={k.id}>{k.name} ({k.specialty})</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Service Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="resizing">Resizing</SelectItem>
                    <SelectItem value="polishing">Polishing</SelectItem>
                    <SelectItem value="stone_setting">Stone Setting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea placeholder="Description of item and work to be done" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />

                <div className="flex justify-center">
                  <ImageUpload currentUrl={form.item_photo_url} onUpload={(url) => setForm({ ...form, item_photo_url: url })} folder="job_cards" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Gold Given</label>
                    <Input type="number" step="0.01" placeholder="0" value={form.gold_given} onChange={e => setForm({ ...form, gold_given: e.target.value })} />
                  </div>
                  <div>
                    <Tabs value={form.gold_given_unit} onValueChange={v => setForm({ ...form, gold_given_unit: v })}>
                      <TabsList className="h-9 w-full">
                        <TabsTrigger value="gram" className="text-xs">Gram</TabsTrigger>
                        <TabsTrigger value="milligram" className="text-xs">mg</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" step="0.01" placeholder="Service Charge (PKR)" value={form.service_charge} onChange={e => setForm({ ...form, service_charge: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Advance (PKR)" value={form.advance_amount} onChange={e => setForm({ ...form, advance_amount: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={form.given_date} onChange={e => setForm({ ...form, given_date: e.target.value })} />
                  <Input type="date" placeholder="Expected Date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} />
                </div>

                <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Repairs" value={String(data.length)} icon={Wrench} gradient="blue" />
          <StatCard title="Pending" value={String(pending)} icon={Wrench} gradient="amber" />
          <StatCard title="In Progress" value={String(inProgress)} icon={Wrench} gradient="orange" />
          <StatCard title="Ready" value={String(ready)} icon={Wrench} gradient="green" />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">All Repair Tickets</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  {columns.map((col) => <th key={col.key} className="text-left p-2 font-medium">{col.label}</th>)}
                  <th className="text-left p-2 font-medium">Status Action</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    {columns.map((col) => (
                      <td key={col.key} className="p-2">
                        {col.render ? col.render((row as any)[col.key], row) : String((row as any)[col.key])}
                      </td>
                    ))}
                    <td className="p-2">
                      <Select value={row.status} onValueChange={(status) => handleStatusChange(row.id, status)}>
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(row.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Repairs;
