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
import { Plus, Printer } from "lucide-react";
import { KARAT_TABLE, fineWeight } from "@/lib/gold";

const Products = () => {
  const { data, create, update, remove } = useBusinessData("products");
  const { data: categories } = useBusinessData("categories");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", category_id: "", price: "", weight_value: "", weight_unit: "gram", stock_quantity: "", image_url: "",
    purity_karat: "", gross_weight: "", net_weight: "", serial_number: "", cost_weight: "",
  });

  const filteredData = categoryFilter === "all" ? data : data.filter((p: any) => p.category_id === categoryFilter);

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
    { key: "stock_quantity", label: "Stock", render: (v: number) => (
      Number(v) <= 0
        ? <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">Out of Stock</span>
        : <span className="font-medium">{v}</span>
    )},
    { key: "purity_karat", label: "Purity", render: (v: number) => v ? `${v}K` : "-" },
    { key: "weight_value", label: "Weight", render: (v: number, row: any) => v ? `${v} ${row.weight_unit}` : "-" },
    { key: "cost_weight", label: "Cost Wt (g)", render: (v: number) => v ? Number(v).toFixed(4) : "-" },
    { key: "serial_number", label: "Serial #", render: (v: string) => v || "-" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const grossWeight = form.gross_weight ? parseFloat(form.gross_weight) : null;
    const karatValue = form.purity_karat ? parseInt(form.purity_karat) : null;
    const netWeightCalc = grossWeight && karatValue ? fineWeight(grossWeight, karatValue) : null;

    const record = {
      name: form.name,
      category_id: form.category_id || null,
      price: parseFloat(form.price) || 0,
      weight: grossWeight,
      weight_value: grossWeight,
      weight_unit: form.weight_unit,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      image_url: form.image_url || null,
      purity_karat: karatValue,
      gross_weight: grossWeight,
      net_weight: netWeightCalc,
      serial_number: form.serial_number || null,
      cost_weight: form.cost_weight ? parseFloat(form.cost_weight) : null,
    };

    const ok = editing ? await update(editing.id, record) : await create(record);
    if (ok) { setOpen(false); setEditing(null); resetForm(); }
  };

  const resetForm = () => setForm({ name: "", category_id: "", price: "", weight_value: "", weight_unit: "gram", stock_quantity: "", image_url: "", purity_karat: "", gross_weight: "", net_weight: "", serial_number: "", cost_weight: "" });

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
      cost_weight: row.cost_weight ? String(row.cost_weight) : "",
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); resetForm(); setForm(f => ({ ...f, serial_number: generateSerial() })); setOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image */}
                <div className="flex justify-center pb-2">
                  <ImageUpload currentUrl={form.image_url} onUpload={(url) => setForm({ ...form, image_url: url })} folder="product-images" />
                </div>

                {/* Basic Info */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">BASIC INFO</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="text-sm" />
                    <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">PRICING & STOCK</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Price (PKR)" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="text-sm" />
                    <Input placeholder="Stock Qty" type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} required className="text-sm" />
                  </div>
                </div>

                {/* Purity & Weight */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">PURITY & WEIGHT</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Select value={form.purity_karat} onValueChange={v => setForm({ ...form, purity_karat: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Purity" /></SelectTrigger>
                      <SelectContent>
                        {KARAT_TABLE.map((k) => <SelectItem key={k.karat} value={String(k.karat)}>{k.karat}K</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Gross Weight (g)" type="number" step="0.01" value={form.gross_weight} onChange={e => setForm({ ...form, gross_weight: e.target.value })} className="text-sm" />
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Net Weight: {form.gross_weight && form.purity_karat ? fineWeight(parseFloat(form.gross_weight), parseInt(form.purity_karat)).toFixed(4) : "—"} g
                  </div>
                </div>

                {/* Cost Weight — internal only, never shown to customer */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">COST (INTERNAL ONLY — NEVER PRINTED)</p>
                  <Input
                    placeholder="Cost Weight (g) — fine gold weight for profit calculation"
                    type="number" step="0.0001"
                    value={form.cost_weight}
                    onChange={e => setForm({ ...form, cost_weight: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Apna Kaat nikaal ke fine weight yahan type karo. Customer ko sirf Gross Weight (upar) dikhega.
                  </p>
                </div>

                {/* Serial & ID */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">IDENTIFICATION</p>
                  <Input placeholder="Serial Number / Barcode" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="text-sm" />
                </div>

                <Button type="submit" className="w-full mt-4">{editing ? "Update" : "Create"} Product</Button>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          onEdit={openEdit}
          onDelete={(row) => remove(row.id)}
          rowClassName={(row) => Number(row.stock_quantity) <= 0 ? "opacity-50 bg-muted/40 line-through-none" : ""}
          pageSize={20}
        />
      </div>
    </AppLayout>
  );
};

export default Products;
