import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { Plus } from "lucide-react";

const Payments = () => {
  const { data: payments, fetch: fetchPayments } = useBusinessData("payments");
  const { data: customers } = useBusinessData("customers");
  const { data: suppliers } = useBusinessData("suppliers");
  const { businessId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"customer_payment" | "supplier_payment">("customer_payment");
  const [referenceId, setReferenceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [receivedBy, setReceivedBy] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    const { error } = await (supabase.from("payments") as any).insert({
      business_id: businessId,
      type,
      reference_id: referenceId,
      amount: parseFloat(amount) || 0,
      description,
      payment_method: paymentMethod,
      received_by: receivedBy || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    await (supabase.from("ledger_entries") as any).insert({
      business_id: businessId,
      entry_type: type === "customer_payment" ? "customer" : "supplier",
      reference_id: referenceId,
      description: description || `Payment received`,
      debit: type === "supplier_payment" ? parseFloat(amount) : 0,
      credit: type === "customer_payment" ? parseFloat(amount) : 0,
      balance: 0,
    });

    toast({ title: "Payment recorded" });
    setOpen(false);
    setAmount("");
    setDescription("");
    setReferenceId("");
    setReceivedBy("");
    setPaymentMethod("cash");
    fetchPayments();
  };

  const customerPayments = payments.filter((p: any) => p.type === "customer_payment");
  const supplierPayments = payments.filter((p: any) => p.type === "supplier_payment");

  const columns = [
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "reference_id", label: "Name", render: (v: string, row: any) => {
      if (row.type === "customer_payment") return customers.find((c: any) => c.id === v)?.name || "-";
      return suppliers.find((s: any) => s.id === v)?.name || "-";
    }},
    { key: "amount", label: "Amount", render: (v: number) => formatCurrency(v) },
    { key: "payment_method", label: "Method", render: (v: string) => v ? v.replace("_", " ") : "-" },
    { key: "received_by", label: "Received By", render: (v: string) => v || "-" },
    { key: "description", label: "Description" },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">Record & track payments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={type} onValueChange={(v: any) => { setType(v); setReferenceId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_payment">Customer Payment (Incoming)</SelectItem>
                    <SelectItem value="supplier_payment">Supplier Payment (Outgoing)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={referenceId} onValueChange={setReferenceId}>
                  <SelectTrigger><SelectValue placeholder={type === "customer_payment" ? "Select Customer" : "Select Supplier"} /></SelectTrigger>
                  <SelectContent>
                    {(type === "customer_payment" ? customers : suppliers).map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Received By (cashier / staff name)" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <Button type="submit" className="w-full">Record Payment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="incoming">
          <TabsList>
            <TabsTrigger value="incoming">Incoming (Customer)</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing (Supplier)</TabsTrigger>
          </TabsList>
          <TabsContent value="incoming">
            <DataTable columns={columns} data={customerPayments} />
          </TabsContent>
          <TabsContent value="outgoing">
            <DataTable columns={columns} data={supplierPayments} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Payments;
