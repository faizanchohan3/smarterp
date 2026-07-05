import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import PrintHeader from "@/components/shared/PrintHeader";
import PrintFooter from "@/components/shared/PrintFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, Printer } from "lucide-react";

const CustomOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { businessId } = useAuth();
  const { toast } = useToast();
  const { data: orders } = useBusinessData("custom_orders" as any);
  const { data: customers } = useBusinessData("customers");

  const order = orders.find((o: any) => o.id === id);
  const customer = order ? customers.find((c: any) => c.id === order.customer_id) : null;

  const [payments, setPayments] = useState<any[]>([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [status, setStatus] = useState(order?.status || "pending");

  useEffect(() => {
    if (!id) return;
    const fetchPayments = async () => {
      const { data, error } = await (supabase.from("payments") as any)
        .select("*")
        .eq("custom_order_id", id)
        .order("created_at", { ascending: false });
      if (!error) setPayments(data || []);
    };
    fetchPayments();
  }, [id]);

  const balance = order ? Number(order.total_price) - Number(order.paid_amount) : 0;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }

    const { error: paymentErr } = await (supabase.from("payments") as any).insert({
      custom_order_id: id,
      amount,
      payment_method: "cash",
      received_by: "Admin",
      created_at: new Date().toISOString(),
    });

    if (!paymentErr) {
      const newPaidAmount = Number(order.paid_amount) + amount;
      await (supabase.from("custom_orders") as any)
        .update({ paid_amount: newPaidAmount })
        .eq("id", id);

      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "customer",
        reference_id: order.customer_id,
        description: `Payment for Custom Order ${order.order_number}`,
        debit: 0,
        credit: amount,
        balance: 0,
      });

      setPaymentDialog(false);
      setPaymentAmount("");
      toast({ title: "Payment recorded successfully" });
    } else {
      toast({ title: "Error", description: paymentErr.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await (supabase.from("custom_orders") as any)
      .update({ status: newStatus })
      .eq("id", id);
    setStatus(newStatus);
    toast({ title: `Status updated to ${newStatus}` });
  };

  if (!order) return (
    <AppLayout>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="outline" onClick={() => navigate("/custom-orders")} className="mt-4">Back to Orders</Button>
      </div>
    </AppLayout>
  );

  const newBalance = Number(order.total_price) - Number(order.paid_amount);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => navigate("/custom-orders")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        {/* PRINT HEADER */}
        <div className="hidden print:block mb-4">
          <PrintHeader title={`Custom Order: ${order.order_number}`} subtitle={`Order Date: ${new Date(order.order_date).toLocaleDateString()}`} />
        </div>

        {/* HEADER */}
        <div className="flex items-start justify-between border-b pb-4 print:pb-0 print:border-0">
          <div>
            <h1 className="text-3xl font-bold text-primary">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">Customer: {customer?.name || "N/A"}</p>
            <p className="text-sm text-muted-foreground">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
          </div>
          <div className="text-right space-y-2 print:hidden">
            <div className="flex items-center justify-end gap-2">
              <StatusBadge status={status} />
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 w-full">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* ORDER DETAILS */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Order Details</h3>
            <div className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">Description:</span> {order.description}</div>
              <div><span className="text-muted-foreground">Purity:</span> {order.purity_karat ? `${order.purity_karat}K` : "-"}</div>
              <div><span className="text-muted-foreground">Est. Weight:</span> {order.estimated_weight ? `${order.estimated_weight} ${order.weight_unit}` : "-"}</div>
              {order.design_reference_url && (
                <div>
                  <img src={order.design_reference_url} alt="Design" className="w-32 h-32 rounded border mt-2" />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Financial Summary</h3>
            <div className="space-y-2 text-sm border rounded-lg p-3 bg-muted/30">
              <div className="flex justify-between">
                <span>Total Price:</span>
                <span className="font-semibold">{formatCurrency(order.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Advance Paid:</span>
                <span className="font-semibold">{formatCurrency(order.advance_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Payments:</span>
                <span className="font-semibold">{formatCurrency(order.paid_amount - order.advance_amount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Balance Due:</span>
                <span className={newBalance > 0 ? "text-destructive" : "text-success"}>{formatCurrency(newBalance)}</span>
              </div>
              {newBalance > 0 && (
                <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full mt-2">Record Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRecordPayment} className="space-y-4">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`Balance Due: ${formatCurrency(newBalance)}`}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                      <Button type="submit" className="w-full">Record Payment</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* PAYMENTS HISTORY */}
        {payments.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Payment History</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Method</th>
                    <th className="p-2 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/50">
                      <td className="p-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-semibold">{formatCurrency(payment.amount)}</td>
                      <td className="p-2">{payment.payment_method || "Cash"}</td>
                      <td className="p-2 text-right">{formatCurrency(order.total_price - (payments.slice(0, idx + 1).reduce((sum: number, p: any) => sum + p.amount, 0) + order.advance_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EXPECTED DELIVERY */}
        {order.expected_delivery_date && (
          <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-4 print:hidden">
            <p className="text-sm">
              <strong>Expected Delivery:</strong> {new Date(order.expected_delivery_date).toLocaleDateString()}
              {customer?.phone && (
                <a href={`sms:${customer.phone}?body=Your%20custom%20order%20${order.order_number}%20is%20expected%20on%20${new Date(order.expected_delivery_date).toLocaleDateString()}.%20Balance%20Due:%20${formatCurrency(newBalance)}`} className="ml-4 text-xs text-blue-600 hover:underline">
                  Send SMS Reminder
                </a>
              )}
            </p>
          </div>
        )}

        {/* PRINT FOOTER */}
        <div className="hidden print:block mt-8">
          <PrintFooter />
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomOrderDetail;
