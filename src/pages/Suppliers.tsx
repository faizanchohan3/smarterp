import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, User, Phone, MapPin } from "lucide-react";

const Suppliers = () => {
  const navigate = useNavigate();
  const { data, create, update, remove } = useBusinessData("suppliers");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", alt_phone: "", address: "", photo_url: "" });

  const columns = [
    { key: "photo_url", label: "", render: (v: string, row: any) => (
      <Avatar className="w-8 h-8">
        <AvatarImage src={v || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{row.name?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
    )},
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "alt_phone", label: "Alt Phone" },
    { key: "address", label: "Address" },
    { key: "created_at", label: "Since", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editing ? await update(editing.id, form) : await create(form);
    if (ok) {
      setOpen(false);
      setEditing(null);
      setForm({ name: "", phone: "", alt_phone: "", address: "", photo_url: "" });
    }
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name,
      phone: row.phone || "",
      alt_phone: row.alt_phone || "",
      address: row.address || "",
      photo_url: row.photo_url || "",
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", alt_phone: "", address: "", photo_url: "" });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">Manage your suppliers</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Supplier</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">{editing ? "Edit" : "New"} Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-center pb-2">
                  <ImageUpload
                    currentUrl={form.photo_url}
                    onUpload={(url) => setForm({ ...form, photo_url: url })}
                    folder="suppliers"
                    size="lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Name *
                  </Label>
                  <Input placeholder="Supplier name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="h-11" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </Label>
                    <Input placeholder="Primary phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Alt Phone
                    </Label>
                    <Input placeholder="Alternative phone" value={form.alt_phone} onChange={e => setForm({ ...form, alt_phone: e.target.value })} className="h-11" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Address
                  </Label>
                  <Textarea placeholder="Enter full address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="resize-none" />
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-semibold">
                  {editing ? "Update Supplier" : "Create Supplier"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={(row) => remove(row.id)} onRowClick={(row) => navigate(`/suppliers/${row.id}`)} />
      </div>
    </AppLayout>
  );
};

export default Suppliers;
