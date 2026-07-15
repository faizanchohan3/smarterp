import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen } from "lucide-react";

const Karigars = () => {
  const navigate = useNavigate();
  const { data, create, update, remove } = useBusinessData("karigars" as any);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", specialty: "" });

  const columns = [
    { key: "name", label: "Name" },
    { key: "specialty", label: "Specialty" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "id", label: "Ledger", render: (_: string, row: any) => (
      <Button size="sm" variant="outline" className="gap-1" onClick={(e) => {
        e.stopPropagation();
        navigate(`/ledger?tab=karigar&id=${row.id}`);
      }}><BookOpen className="w-3.5 h-3.5" /> Ledger</Button>
    )},
  ];

  const resetForm = () => setForm({ name: "", phone: "", address: "", specialty: "" });

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ name: row.name, phone: row.phone || "", address: row.address || "", specialty: row.specialty || "" });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const record = { name: form.name, phone: form.phone || null, address: form.address || null, specialty: form.specialty || null };
    const ok = editing ? await update(editing.id, record) : await create(record);
    if (ok) { setOpen(false); setEditing(null); resetForm(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Karigars</h1>
            <p className="text-muted-foreground mt-1">Manage craftsmen and artisans</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Karigar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Karigar" : "Add New Karigar"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input placeholder="Specialty (e.g., Stone Setting, Polishing)" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={data}
          onEdit={openEdit}
          onDelete={(id) => remove(id)}
        />
      </div>
    </AppLayout>
  );
};

export default Karigars;
