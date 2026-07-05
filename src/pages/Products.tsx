import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/currency";
import { Plus } from "lucide-react";
import { KARAT_TABLE, fineWeight } from "@/lib/gold";

const Products = () => {
  const { data, create, update, remove } = useBusinessData("products");
  const { data: categories } = useBusinessData("categories");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", category_id: "", price: "", weight_value: "", weight_unit: "gram", stock_quantity: "", image_url: "",
    purity_karat: "", gross_weight: "", net_weight: "", serial_number: "",
  });

  const generateSerial = () => `SN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const columns = [
    { key: "image_url", label: "", render: (v: string, row: any) => (
      <Avatar className="w-8 h-8 rounded-md">
        <AvatarImage src={v || undefined} className="object-cover" />
        <AvatarFallback className="rounded-md text-xs bg-primary/10 text-primary">{row.name?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
    )},
    { key: "name", label: "Name" },
    { key: "category_id", label: "Category", render: (v: string) => categories.find((c: any) => c.id === v)?.name || "-" },
    { key: "price", label: "Price", render: (v: number) => formatCurrency(v) },
    { key: "stock_quantity", label: "Stock" },
    { key: "purity_karat", label: "Purity", render: (v: number) => v ? `${v}K` : "-" },
    { key: "weight_value", label: "Weight", render: (v: number, row: any) => v ? `${v} ${row.weight_unit}` : "-" },
    { key: "serial_number", label: "Serial #", render: (v: string) => v || "-" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const grossWeight = form.gross_weight ? parseFloat(form.gross_weight) : null;
    const karatValue = form.purity_karat ? parseInt(form.purity_karat) : null;
    const record = {
      name: form.name,
      category_id: form.category_id || null,
      price: parseFloat(form.price) || 0,
      weight_value: form.weight_value ? parseFloat(form.weight_value) : null,
      weight_unit: form.weight_unit,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      image_url: form.image_url || null,
      purity_karat: karatValue,
      gross_weight: grossWeight,
      net_weight: grossWeight && karatValue ? fineWeight(grossWeight, karatValue) : null,
      serial_number: form.serial_number || null,
    };
    const ok = editing ? await update(editing.id, record) : await create(record);
    if (ok) { setOpen(false); setEditing(null); resetForm(); }
  };

  const resetForm = () => setForm({ name: "", category_id: "", price: "", weight_value: "", weight_unit: "gram", stock_quantity: "", image_url: "", purity_karat: "", gross_weight: "", net_weight: "", serial_number: "" });

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name,
      category_id: row.category_id || "",
      price: String(row.price),
      weight_value: row.weight_value ? String(row.weight_value) : "",
      weight_unit: row.weight_unit || "gram",
      stock_quantity: String(row.stock_quantity),
      image_url: row.image_url || "",
      purity_karat: row.purity_karat ? String(row.purity_karat) : "",
      gross_weight: row.gross_weight ? String(row.gross_weight) : "",
      net_weight: row.net_weight ? String(row.net_weight) : "",
      serial_number: row.serial_number || "",
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); setForm(f => ({ ...f, serial_number: generateSerial() })); setOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <ImageUpload
                    currentUrl={form.image_url}
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                    folder="products"
                  />
                </div>
                <Input placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                <Input placeholder="Stock Quantity" type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} required />
                <Input placeholder="Serial Number / Barcode" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                <Select value={form.purity_karat} onValueChange={v => setForm({ ...form, purity_karat: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Purity (Karat)" /></SelectTrigger>
                  <SelectContent>
                    {KARAT_TABLE.map((k) => <SelectItem key={k.karat} value={String(k.karat)}>{k.karat}K</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input placeholder="Gross Weight" type="number" step="0.01" value={form.gross_weight} onChange={e => setForm({ ...form, gross_weight: e.target.value })} />
                  </div>
                  <Tabs value="gram" onValueChange={() => {}}>
                    <TabsList>
                      <TabsTrigger value="gram" disabled>g</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="text-sm text-muted-foreground">
                  Net Weight: {form.gross_weight && form.purity_karat ? fineWeight(parseFloat(form.gross_weight), parseInt(form.purity_karat)).toFixed(4) : "-"} g
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input placeholder="Weight (Legacy)" type="number" step="0.01" value={form.weight_value} onChange={e => setForm({ ...form, weight_value: e.target.value })} />
                  </div>
                  <Tabs value={form.weight_unit} onValueChange={v => setForm({ ...form, weight_unit: v })}>
                    <TabsList>
                      <TabsTrigger value="gram">Gram</TabsTrigger>
                      <TabsTrigger value="milligram">mg</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={(row) => remove(row.id)} />
      </div>
    </AppLayout>
  );
};

export default Products;
