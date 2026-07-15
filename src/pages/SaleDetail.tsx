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
import { ArrowLeft, Printer, MessageSquare, Wallet } from "lucide-react";
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
                  onClick={() => { setNoteDialogOpen(false); setTimeout(() => window.print(), 350); }}
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

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", borderBottom: "3px double #7a1a1a", paddingBottom: "14px" }}>
            {/* Left: logo + shop name + owner */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {shopLogo && (
                <img src={shopLogo} alt="logo" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
              )}
              <div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#7a1a1a", lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {shopName || ownerName || "Jewellers"}
                </div>
                {ownerName && shopName && (
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Chief Executive</div>
                )}
                {ownerName && (
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#7a1a1a" }}>{ownerName}</div>
                )}
                {shopPhone && (
                  <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>Cell: {shopPhone}</div>
                )}
              </div>
            </div>
            {/* Right: address block */}
            <div style={{ textAlign: "right" }}>
              {shopAddress && (
                <div style={{ fontSize: "12px", color: "#333", marginBottom: "4px" }}>{shopAddress}</div>
              )}
              {shopPhone && (
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#7a1a1a" }}>{shopPhone}</div>
              )}
            </div>
          </div>

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
            const isSingle = rows.length === 1;

            return (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "0" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#7a1a1a", color: "#fff" }}>
                      {isSingle ? (
                        <>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 10px", textAlign: "left" }} colSpan={4}>Particulars</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "110px" }}>Making Charges</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "120px" }}>Amount (PKR)</th>
                        </>
                      ) : (
                        <>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "36px" }}>S. No.</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "left" }}>Particulars</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "90px" }}>Weight (g)</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "90px" }}>Rate/Gram</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "100px" }}>Making</th>
                          <th style={{ border: "1px solid #7a1a1a", padding: "7px 8px", textAlign: "center", width: "110px" }}>Amount (PKR)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ i, item, wg, mc, prod }) => (
                      isSingle ? (
                        <tr key={item.id} style={{ backgroundColor: "#fff8f0" }}>
                          {/* Single item: merged left cell with image + all details */}
                          <td colSpan={4} style={{ border: "1px solid #ccc", padding: "14px 16px", verticalAlign: "top" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                              {prod?.image_url && (
                                <img src={prod.image_url} alt=""
                                  style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd", flexShrink: 0 }} />
                              )}
                              <div style={{ lineHeight: "1.8" }}>
                                <div style={{ fontSize: "15px", fontWeight: "700", color: "#7a1a1a" }}>{item.product_name}</div>
                                {wg > 0 && <div style={{ fontSize: "12px", color: "#555" }}>Weight: <strong>{wg.toFixed(3)} grams</strong></div>}
                                {ratePerGram > 0 && <div style={{ fontSize: "12px", color: "#555" }}>Rate: <strong>{ratePerGram.toFixed(2)}/gram</strong></div>}
                                {wg > 0 && ratePerGram > 0 && (
                                  <div style={{ fontSize: "12px", color: "#555" }}>
                                    Gold Value: <strong>{(wg * ratePerGram).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "14px 10px", textAlign: "center", verticalAlign: "middle", fontWeight: "600" }}>
                            {mc > 0 ? mc.toLocaleString() : "—"}
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: "700", fontSize: "14px" }}>
                            {Number(item.total) > 0 ? Number(item.total).toLocaleString() : ""}
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff8f0" : "#fff" }}>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{i + 1}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {prod?.image_url && (
                                <img src={prod.image_url} alt=""
                                  style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }} />
                              )}
                              <span>{item.product_name}</span>
                            </div>
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{wg > 0 ? wg.toFixed(3) : ""}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{ratePerGram > 0 ? ratePerGram.toFixed(2) : ""}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{mc > 0 ? mc.toLocaleString() : ""}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>{Number(item.total) > 0 ? Number(item.total).toLocaleString() : ""}</td>
                        </tr>
                      )
                    ))}
                    {/* Note row — spans all columns */}
                    {printNote && (
                      <tr>
                        <td colSpan={6} style={{ border: "1px solid #ccc", padding: "8px 12px", fontSize: "11px", color: "#444", fontStyle: "italic", backgroundColor: "#fffbf0" }}>
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

          {/* ── Signatures ── */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px", fontSize: "12px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: "160px", marginBottom: "5px" }} />
              <div>Prepared By</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: "160px", marginBottom: "5px" }} />
              <div>Authorized Signature</div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            marginTop: "24px", background: "linear-gradient(135deg, #7a1a1a 60%, #b8860b 100%)",
            color: "#fff", borderRadius: "0 0 8px 8px", padding: "12px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📍</span>
              <span>{shopAddress || ""}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📞</span>
              <span>{shopPhone || ""}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💎</span>
              <span>Trust is Our Identity</span>
            </div>
          </div>
        </div>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default SaleDetail;
