import { useParams, useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { postAccountEntries } from "@/lib/accounting";
import { ArrowLeft, Printer, MessageSquare, Wallet, Trash2 } from "lucide-react";
import QRCode from "qrcode";

const TOLA_IN_GRAMS = 11.664;
const RATTI_PER_GRAM = 8;

const amountInWords = (amount: number): string => {
  const num = Math.floor(amount);
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const toWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + toWords(n%100) : "");
    if (n < 100000) return toWords(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + toWords(n%1000) : "");
    if (n < 10000000) return toWords(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + toWords(n%100000) : "");
    return toWords(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + toWords(n%10000000) : "");
  };
  if (num === 0) return "Zero Rupees Only";
  const paisa = Math.round((amount - num) * 100);
  return toWords(num) + " Rupees" + (paisa > 0 ? " and " + toWords(paisa) + " Paisa" : "") + " Only";
};

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopName, ownerName, shopLogo, shopAddress, shopPhone, businessId } = useAuth();
  const { data: sales, fetch: refetchSales } = useBusinessData("sales");
  const { data: customers } = useBusinessData("customers");
  const { data: products } = useBusinessData("products");
  const { toast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayNote, setRepayNote] = useState("");
  const [repayMethod, setRepayMethod] = useState<string>("cash");
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [printNote, setPrintNote] = useState("");

  const sale = sales.find((s: any) => s.id === id);
  const customer = sale ? customers.find((c: any) => c.id === sale.customer_id) : null;

  const getStatus = (paid: number, total: number) => {
    if (total <= 0) return "full";
    if (paid >= total) return "full";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const { data: itemData } = await (supabase.from("sale_items").select("*") as any).eq("sale_id", id);
      setItems(itemData || []);
      const { data: payData } = await (supabase.from("payments").select("*") as any).eq("sale_id", id).order("created_at", { ascending: false });
      setPayments(payData || []);
    };
    fetchAll();
  }, [id]);

  // Safety net: the customer ledger entry is created alongside the sale, but if
  // that insert ever silently failed, the sale would still look correct here
  // while the customer's ledger just never shows the receivable. Detect that gap
  // and offer a one-click repair instead of leaving it invisible.
  const [ledgerMissing, setLedgerMissing] = useState(false);
  useEffect(() => {
    if (!sale?.customer_id || !businessId) { setLedgerMissing(false); return; }
    (async () => {
      const { data } = await (supabase.from("ledger_entries").select("id") as any)
        .eq("business_id", businessId)
        .eq("entry_type", "customer")
        .eq("reference_id", sale.customer_id)
        .ilike("description", `%${sale.invoice_number}%`)
        .limit(1);
      setLedgerMissing(!data || data.length === 0);
    })();
  }, [sale?.id, sale?.customer_id, businessId]);

  const repairLedgerEntry = async () => {
    if (!sale?.customer_id || !businessId) return;
    const { error } = await (supabase.from("ledger_entries") as any).insert({
      business_id: businessId, entry_type: "customer", reference_id: sale.customer_id,
      description: `Sale ${sale.invoice_number}`, debit: Number(sale.final_amount), credit: 0, balance: 0,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (Number(sale.paid_amount) > 0) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId, entry_type: "customer", reference_id: sale.customer_id,
        description: `Payment for ${sale.invoice_number}`, debit: 0, credit: Number(sale.paid_amount), balance: 0,
      });
    }
    toast({ title: "Ledger entry added" });
    setLedgerMissing(false);
  };

  useEffect(() => {
    if (sale && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, sale.invoice_number, { width: 120, margin: 2 }).catch(() => {});
    }
  }, [sale?.id, sale?.invoice_number]);

  const recordRepayment = async () => {
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0 || !sale || !businessId) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const newPaid = Number(sale.paid_amount) + amt;
    const newStatus = newPaid >= Number(sale.final_amount) ? "full" : "partial";

    const { error: upErr } = await (supabase.from("sales") as any)
      .update({ paid_amount: newPaid, payment_status: newStatus })
      .eq("id", sale.id);
    if (upErr) { toast({ title: "Error", description: upErr.message, variant: "destructive" }); return; }

    const noteWithMethod = `${repayNote ? repayNote + " — " : ""}Method: ${repayMethod}`;
    await (supabase.from("payments") as any).insert({
      business_id: businessId,
      type: "customer_payment",
      reference_id: sale.customer_id,
      sale_id: sale.id,
      amount: amt,
      payment_method: repayMethod,
      received_by: receivedBy || null,
      description: repayNote ? `${repayNote} (${repayMethod})` : `Repayment for ${sale.invoice_number} (${repayMethod})`,
    });

    if (sale.customer_id) {
      // compute running balance for this customer's ledger
      const { data: lastEntry } = await (supabase.from("ledger_entries").select("balance") as any)
        .eq("business_id", businessId)
        .eq("entry_type", "customer")
        .eq("reference_id", sale.customer_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const prevBalance = Number(lastEntry?.balance || 0);
      const newBalance = prevBalance - amt;

      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "customer",
        reference_id: sale.customer_id,
        description: `Repayment for ${sale.invoice_number} (${repayMethod})`,
        debit: 0,
        credit: amt,
        balance: newBalance,
      });
    }

    // Chart of Accounts: cash comes in, receivable goes down by the same amount
    postAccountEntries(businessId, `Repayment for ${sale.invoice_number}`, [
      { account: "CASH", debit: amt },
      { account: "RECEIVABLE", credit: amt },
    ]);

    toast({ title: "Repayment recorded" });
    setRepayOpen(false);
    setRepayAmount("");
    setRepayNote("");
    setRepayMethod("cash");
    setReceivedBy("");
    refetchSales();
    const { data: payData } = await (supabase.from("payments").select("*") as any).eq("sale_id", id).order("created_at", { ascending: false });
    setPayments(payData || []);
  };

  // Undo everything this sale caused: restore stock for own-inventory items,
  // and remove every ledger entry it created (sale debit, payments, repayments,
  // supplier gold-owed for drop-ship items) — all reference the invoice number.
  const deleteSale = async () => {
    if (!sale) return;
    if (!window.confirm(`Delete invoice ${sale.invoice_number}? This restores stock and removes its ledger entries. This cannot be undone.`)) return;

    for (const item of items) {
      if (item.product_id && item.in_stock !== false) {
        const { data: prod } = await (supabase.from("products").select("stock_quantity") as any).eq("id", item.product_id).maybeSingle();
        if (prod) {
          await (supabase.from("products") as any).update({
            stock_quantity: Number(prod.stock_quantity) + Number(item.quantity || 0),
          }).eq("id", item.product_id);
        }
      }
    }

    await (supabase.from("ledger_entries") as any)
      .delete()
      .eq("business_id", businessId)
      .ilike("description", `%${sale.invoice_number}%`);

    // sale_items and payments cascade-delete with the sale automatically
    const { error } = await (supabase.from("sales") as any).delete().eq("id", sale.id);
    if (error) { toast({ title: "Error deleting sale", description: error.message, variant: "destructive" }); return; }

    toast({ title: "Sale deleted", description: "Stock restored and ledger entries removed." });
    navigate("/sales");
  };

  if (!sale) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Sale not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/sales")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales
          </Button>
        </div>
      </AppLayout>
    );
  }

  const remaining = Number(sale.final_amount) - Number(sale.paid_amount);
  const computedStatus = getStatus(Number(sale.paid_amount), Number(sale.final_amount));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title={`Invoice ${sale.invoice_number}`} subtitle={`Sales Invoice - ${new Date(sale.created_at).toLocaleDateString()}`} />

        {ledgerMissing && (
          <div className="print:hidden rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">
              ⚠️ Is sale ki entry <strong>customer ke ledger mein missing hai</strong> — receivable amount track nahi ho raha.
            </p>
            <Button size="sm" variant="destructive" onClick={repairLedgerEntry}>Ledger Mein Add Karo</Button>
          </div>
        )}

        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Invoice {sale.invoice_number}</h1>
              <p className="text-sm text-muted-foreground">{new Date(sale.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {customer?.phone && remaining > 0 && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const due = (sale as any).repayment_date ? new Date((sale as any).repayment_date).toLocaleDateString() : "soon";
                  const msg = `Dear ${customer.name}, this is a friendly reminder from ${shopName || "our shop"}. Your remaining balance for invoice ${sale.invoice_number} is ${formatCurrency(remaining)}, due on ${due}. Thank you.`;
                  window.location.href = `sms:${customer.phone}?body=${encodeURIComponent(msg)}`;
                }}
              >
                <MessageSquare className="w-4 h-4" /> SMS Reminder
              </Button>
            )}
            {remaining > 0 && (
              <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2 bg-gradient-gold text-amber-950 hover:opacity-90">
                    <Wallet className="w-4 h-4" /> Record Repayment
                  </Button>
                </DialogTrigger>
                <DialogContent className="print:hidden">
                  <DialogHeader><DialogTitle>Record Repayment for {sale.invoice_number}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Remaining balance: <strong className="text-destructive">{formatCurrency(remaining)}</strong></p>
                    <Input type="number" step="0.01" placeholder="Amount" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} />
                    <Select value={repayMethod} onValueChange={setRepayMethod}>
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
                    <Input placeholder="Note (optional)" value={repayNote} onChange={e => setRepayNote(e.target.value)} />
                    <Button className="w-full" onClick={recordRepayment}>Save Repayment</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={() => setNoteDialogOpen(true)} className="gap-2">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={deleteSale}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>

        {/* ── NOTE DIALOG (before print) ───────────────────────────────────── */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="max-w-md print:hidden">
            <DialogHeader><DialogTitle>Add Note to Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Optional note printed at the bottom of the invoice
              </Label>
              <Textarea
                placeholder="e.g. Gold rate may change. All disputes within shop jurisdiction."
                value={printNote}
                onChange={e => setPrintNote(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setNoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => { setNoteDialogOpen(false); setTimeout(() => window.dispatchEvent(new Event("open-print-dialog")), 350); }}
                >
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── SCREEN VIEW ─────────────────────────────────────────────────── */}
        <Card className="print:hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div className="flex items-center gap-3">
                {shopLogo && <img src={shopLogo} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <h2 className="text-xl font-bold text-primary">{ownerName || shopName || "Shop"}</h2>
                  <p className="text-sm text-muted-foreground">{shopName}</p>
                  {shopAddress && <p className="text-xs text-muted-foreground">{shopAddress}</p>}
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold">{sale.invoice_number}</h3>
                <p className="text-sm text-muted-foreground">{new Date(sale.created_at).toLocaleDateString()}</p>
                <StatusBadge status={computedStatus} className="mt-2" />
                <canvas ref={qrCanvasRef} className="mt-3 mx-auto" />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Bill To</p>
              <p className="font-semibold">{customer?.name || "Walk-in Customer"}</p>
              {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
              {customer?.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
            </div>

            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Particulars</th>
                    <th className="text-right p-3 font-medium">Weight (g)</th>
                    <th className="text-right p-3 font-medium">Rate/gram</th>
                    <th className="text-right p-3 font-medium">Making</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => {
                    const wg = item.weight_unit === "ratti"
                      ? Number(item.weight) / RATTI_PER_GRAM
                      : Number(item.weight);
                    const rpg = Number((sale as any).tola_rate) > 0
                      ? Number((sale as any).tola_rate) / TOLA_IN_GRAMS
                      : 0;
                    const mc = Number(item.polish_waste || 0);
                    const prod = products.find((p: any) => p.id === item.product_id);
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {prod?.image_url
                              ? <img src={prod.image_url} alt="" className="w-8 h-8 rounded object-cover border" />
                              : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                            }
                            <span>{item.product_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">{wg > 0 ? wg.toFixed(3) : "—"}</td>
                        <td className="p-3 text-right">{rpg > 0 ? rpg.toFixed(2) : "—"}</td>
                        <td className="p-3 text-right">{mc > 0 ? formatCurrency(mc) : "—"}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {Number((sale as any).tola_rate) > 0 && (
              <p className="text-xs text-muted-foreground mb-1">Gold Rate: {formatCurrency((sale as any).tola_rate)} / Tola</p>
            )}
            {(sale as any).repayment_date && remaining > 0 && (
              <p className="text-xs text-muted-foreground mb-4">Repayment Due: <strong>{new Date((sale as any).repayment_date).toLocaleDateString()}</strong></p>
            )}

            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(sale.total_amount)}</span></div>
                {Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{formatCurrency(sale.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(sale.final_amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="text-success">{formatCurrency(sale.paid_amount)}</span></div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm font-semibold"><span className="text-muted-foreground">Remaining</span><span className="text-destructive">{formatCurrency(remaining)}</span></div>
                )}
              </div>
            </div>

            {/* ── Internal Profit Summary — screen only, NEVER printed, NEVER shown to customer ── */}
            {(() => {
              const tolaRate = Number((sale as any).tola_rate) || 0;
              let totalCost = 0;
              items.forEach((it: any) => {
                const qty = Number(it.quantity) || 1;
                if (Number(it.cost_weight) > 0 && tolaRate > 0) {
                  totalCost += (Number(it.cost_weight) / TOLA_IN_GRAMS) * tolaRate * qty;
                } else if (Number(it.cost_price) > 0) {
                  totalCost += Number(it.cost_price) * qty;
                }
              });
              if (totalCost <= 0) return null;
              const profit = Number(sale.final_amount) - totalCost;
              return (
                <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Internal Only — Not Shown to Customer</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost (gold weight basis)</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Profit</span>
                    <span className={profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(profit)}</span>
                  </div>
                </div>
              );
            })()}

            {(sale as any).notes_internal && (
              <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3">
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Note — Internal Only, Not Printed</p>
                <p className="text-sm whitespace-pre-wrap">{(sale as any).notes_internal}</p>
              </div>
            )}

            {payments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold mb-2">Repayment History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50">
                      <th className="text-left p-2.5">Date</th><th className="text-right p-2.5">Amount</th>
                      <th className="text-left p-2.5">Method</th><th className="text-left p-2.5">Received By</th>
                    </tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2.5">{new Date(p.created_at).toLocaleString()}</td>
                          <td className="p-2.5 text-right text-success font-medium">{formatCurrency(p.amount)}</td>
                          <td className="p-2.5 capitalize">{(p.payment_method || "-").replace("_", " ")}</td>
                          <td className="p-2.5">{p.received_by || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-8 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>

        {/* ── PRINT INVOICE (Jewellery format) ─────────────────────────────── */}
        <div className="hidden print:block bg-white text-black"
          style={{ fontFamily: "'Times New Roman', serif", padding: "28px 36px", maxWidth: "720px", margin: "0 auto" }}>

          {/* ── Date / Gold Rate / Report No row ── */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "14px" }}>
            <div>
              <span style={{ fontWeight: "600" }}>Date: </span>
              {new Date(sale.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "2-digit", year: "numeric" })}
              {customer && (
                <span style={{ marginLeft: "24px" }}>
                  <span style={{ fontWeight: "600" }}>Customer: </span>{customer.name}
                  {customer.phone ? `  |  ${customer.phone}` : ""}
                </span>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {Number((sale as any).tola_rate) > 0 && (
                <div><span style={{ fontWeight: "600" }}>Gold Rate: </span>{formatCurrency((sale as any).tola_rate)} / Tola</div>
              )}
              <div><span style={{ fontWeight: "600" }}>Report No: </span>{sale.invoice_number}</div>
              <canvas ref={qrCanvasRef} style={{ marginTop: "12px", display: "block", marginLeft: "auto", marginRight: 0 }} />
            </div>
          </div>

          {/* ── Items Table ── */}
          {(() => {
            const tolaRate = Number((sale as any).tola_rate) || 0;
            const ratePerGram = tolaRate > 0 ? tolaRate / TOLA_IN_GRAMS : 0;
            let totalWeightG = 0;
            let totalMaking = 0;
            const rows = items.map((item: any, i: number) => {
              const wg = item.weight_unit === "ratti" ? Number(item.weight) / RATTI_PER_GRAM : Number(item.weight);
              const mc = Number(item.polish_waste || 0);
              totalWeightG += wg * (Number(item.quantity) || 1);
              totalMaking += mc * (Number(item.quantity) || 1);
              const prod = products.find((p: any) => p.id === item.product_id);
              return { i, item, wg, mc, prod };
            });
            return (
              <>
                <table className="print-white-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "0" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#7a1a1a", color: "#fff" }}>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "34px" }}>S. No.</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "left" }}>Product Name</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "78px" }}>Weight (g)</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "80px" }}>Rate/Gram</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "right", width: "95px" }}>Gold Value</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "right", width: "85px" }}>Making</th>
                      <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "right", width: "105px" }}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ i, item, wg, mc, prod }) => (
                      <tr key={item.id} style={{ backgroundColor: "#fff" }}>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", backgroundColor: "#fff" }}>{i + 1}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#fff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {prod?.image_url && (
                              <img src={prod.image_url} alt=""
                                style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }} />
                            )}
                            <span style={{ fontWeight: 600 }}>{item.product_name}{item.purity_karat ? ` (${item.purity_karat}K)` : ""}</span>
                          </div>
                        </td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", backgroundColor: "#fff" }}>{wg > 0 ? wg.toFixed(3) : "-"}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", backgroundColor: "#fff" }}>{ratePerGram > 0 ? ratePerGram.toFixed(2) : "-"}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", backgroundColor: "#fff" }}>
                          {wg > 0 && ratePerGram > 0 ? (wg * ratePerGram).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}
                        </td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", backgroundColor: "#fff" }}>{mc > 0 ? mc.toLocaleString() : "-"}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", fontWeight: 700, backgroundColor: "#fff" }}>{Number(item.total) > 0 ? Number(item.total).toLocaleString() : ""}</td>
                      </tr>
                    ))}
                    {/* Note row — spans all columns */}
                    {printNote && (
                      <tr>
                        <td colSpan={7} style={{ border: "1px solid #ccc", padding: "8px 12px", fontSize: "11px", color: "#444", fontStyle: "italic", backgroundColor: "#fff" }}>
                          <strong style={{ fontStyle: "normal" }}>Note: </strong>{printNote}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ── Totals ── */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginTop: "0" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "55%", border: "none", padding: "0" }}></td>
                      <td style={{ width: "45%", padding: "0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <tbody>
                            <tr>
                              <td style={{ border: "1px solid #ccc", padding: "6px 10px" }}>Total Weight (Gram)</td>
                              <td style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>{totalWeightG.toFixed(3)}</td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid #ccc", padding: "6px 10px" }}>Total Making Charges</td>
                              <td style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>{totalMaking > 0 ? totalMaking.toLocaleString() : "0.00"}</td>
                            </tr>
                            {Number(sale.discount) > 0 && (
                              <tr>
                                <td style={{ border: "1px solid #ccc", padding: "6px 10px" }}>Discount</td>
                                <td style={{ border: "1px solid #ccc", padding: "6px 10px", textAlign: "right" }}>-{Number(sale.discount).toLocaleString()}</td>
                              </tr>
                            )}
                            <tr style={{ backgroundColor: "#fff8f0" }}>
                              <td style={{ border: "2px solid #7a1a1a", padding: "7px 10px", fontWeight: "800", color: "#7a1a1a", fontSize: "13px" }}>Total Amount (PKR)</td>
                              <td style={{ border: "2px solid #7a1a1a", padding: "7px 10px", textAlign: "right", fontWeight: "800", color: "#7a1a1a", fontSize: "13px" }}>{Number(sale.final_amount).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount in Words */}
                <div style={{ marginTop: "10px", fontSize: "12px", borderBottom: "1px solid #ccc", paddingBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Amount in Words: </span>
                  <span style={{ fontStyle: "italic" }}>{amountInWords(Number(sale.final_amount))}</span>
                </div>
              </>
            );
          })()}

        </div>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default SaleDetail;
