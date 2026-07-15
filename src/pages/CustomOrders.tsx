import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Gem } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import { KARAT_TABLE } from "@/lib/gold";

const CustomOrders = () => {
  const navigate = useNavigate();
  const { businessId } = useAuth();
  const { toast } = useToast();
  const { data, create, fetch: fetchOrders } = useBusinessData("custom_orders" as any);
  const { data: customers } = useBusinessData("customers");
  const { data: karigars } = useBusinessData("karigars" as any);
  const { data: suppliers } = useBusinessData("suppliers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    karigar_id: "",
    supplier_id: "",
    supplier_cost: "",
    description: "",
    design_reference_url: "",
    estimated_weight: "",
    weight_unit: "gram",
    purity_karat: "",
    total_price: "",
    advance_amount: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
  });

  const resetForm = () => setForm({
    customer_id: "", karigar_id: "", supplier_id: "", supplier_cost: "",
    description: "", design_reference_url: "",
    estimated_weight: "", weight_unit: "gram", purity_karat: "", total_price: "",
    advance_amount: "", order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = `CO-${Date.now().toString(36).toUpperCase()}`;
    const advanceAmt = parseFloat(form.advance_amount) || 0;

    const supplierCost = parseFloat(form.supplier_cost) || 0;

    const ok = await create({
      order_number: orderNumber,
      customer_id: form.customer_id || null,
      karigar_id: form.karigar_id || null,
      supplier_id: form.supplier_id || null,
      supplier_cost: supplierCost,
      description: form.description,
      design_reference_url: form.design_reference_url || null,
      estimated_weight: form.estimated_weight ? parseFloat(form.estimated_weight) : null,
      weight_unit: form.weight_unit,
      purity_karat: form.purity_karat ? parseInt(form.purity_karat) : null,
      total_price: parseFloat(form.total_price) || 0,
      advance_amount: advanceAmt,
      paid_amount: 0,
      status: "pending",
      order_date: form.order_date,
      expected_delivery_date: form.expected_delivery_date || null,
    });

    const totalPrice = parseFloat(form.total_price) || 0;

    // Debit customer ledger with the full order price (customer owes this)
    if (ok && totalPrice > 0 && form.customer_id) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "customer",
        reference_id: form.customer_id,
        description: `Custom Order - ${orderNumber}`,
        debit: totalPrice,
        credit: 0,
        balance: 0,
      });
    }

    // Credit the advance received against it
    if (ok && advanceAmt > 0 && form.customer_id) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "customer",
        reference_id: form.customer_id,
        description: `Custom Order Advance - ${orderNumber}`,
        credit: advanceAmt,
        debit: 0,
        balance: 0,
      });
    }

    // Order assigned to a supplier: credit supplier ledger with the agreed cost (we owe them)
    if (ok && supplierCost > 0 && form.supplier_id) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "supplier",
        reference_id: form.supplier_id,
        description: `Custom Order Assigned - ${orderNumber}`,
        credit: supplierCost,
        debit: 0,
        balance: 0,
      });
    }

    if (ok) {
      setOpen(false);
      resetForm();
      fetchOrders();
    }
  };

  const columns = [
    { key: "order_number", label: "Order #" },
    { key: "customer_id", label: "Customer", render: (v: string) => customers.find((c: any) => c.id === v)?.name || "-" },
    { key: "description", label: "Description", render: (v: string) => v.substring(0, 30) + (v.length > 30 ? "..." : "") },
    { key: "total_price", label: "Total Price", render: (v: number) => formatCurrency(v) },
    { key: "id", label: "Balance", render: (_: any, row: any) => {
      const balance = Number(row.total_price) - Number(row.paid_amount);
      return <span className={balance > 0 ? "text-destructive font-medium" : "text-success"}>{formatCurrency(balance)}</span>;
    }},
    { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v} /> },
    { key: "expected_delivery_date", label: "Due Date", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
  ];

  const totalOrders = data.length;
  const totalAdvance = data.reduce((sum: number, o: any) => sum + (Number(o.advance_amount) || 0), 0);
  const pending = data.filter((o: any) => o.status === "pending").length;
  const inProduction = data.filter((o: any) => o.status === "in_production").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Custom Orders</h1>
            <p className="text-muted-foreground mt-1">Manage custom jewellery orders</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="w-4 h-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={form.karigar_id} onValueChange={v => setForm({ ...form, karigar_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign Karigar (optional)" /></SelectTrigger>
                  <SelectContent>
                    {karigars.map((k: any) => <SelectItem key={k.id} value={k.id}>{k.name} ({k.specialty})</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Assign Supplier (optional)" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" step="0.01" placeholder="Supplier Cost (PKR)"
                    value={form.supplier_cost}
                    onChange={e => setForm({ ...form, supplier_cost: e.target.value })}
                    disabled={!form.supplier_id}
                  />
                </div>

                <Textarea placeholder="Order Description / Design Details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} />

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Design Reference Image</label>
                  <ImageUpload currentUrl={form.design_reference_url} onUpload={(url) => setForm({ ...form, design_reference_url: url })} folder="custom_orders" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" step="0.01" placeholder="Estimated Weight" value={form.estimated_weight} onChange={e => setForm({ ...form, estimated_weight: e.target.value })} />
                  <Tabs value={form.weight_unit} onValueChange={v => setForm({ ...form, weight_unit: v })}>
                    <TabsList className="h-9 w-full">
                      <TabsTrigger value="gram" className="text-xs">Gram</TabsTrigger>
                      <TabsTrigger value="milligram" className="text-xs">mg</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Select value={form.purity_karat} onValueChange={v => setForm({ ...form, purity_karat: v })}>
                  <SelectTrigger><SelectValue placeholder="Purity (Karat)" /></SelectTrigger>
                  <SelectContent>
                    {KARAT_TABLE.map((k) => <SelectItem key={k.karat} value={String(k.karat)}>{k.karat}K</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" step="0.01" placeholder="Total Price (PKR)" value={form.total_price} onChange={e => setForm({ ...form, total_price: e.target.value })} required />
                  <Input type="number" step="0.01" placeholder="Advance Amount (PKR)" value={form.advance_amount} onChange={e => setForm({ ...form, advance_amount: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} />
                  <Input type="date" placeholder="Expected Delivery" value={form.expected_delivery_date} onChange={e => setForm({ ...form, expected_delivery_date: e.target.value })} />
                </div>

                <Button type="submit" className="w-full">Create Order</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Orders" value={String(totalOrders)} icon={Gem} gradient="purple" />
          <StatCard title="Pending" value={String(pending)} icon={Gem} gradient="amber" />
          <StatCard title="In Production" value={String(inProduction)} icon={Gem} gradient="orange" />
          <StatCard title="Total Advance" value={formatCurrency(totalAdvance)} icon={Gem} gradient="green" />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">All Orders</h3>
          <DataTable
            columns={columns}
            data={data}
            onRowClick={(row: any) => navigate(`/custom-orders/${row.id}`)}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomOrders;
