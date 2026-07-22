import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import BarcodeScanner from "@/components/shared/BarcodeScanner";
import ProductCombobox from "@/components/shared/ProductCombobox";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Plus, Trash2, Printer, ShoppingCart, Wallet, ArrowDownCircle, Scan } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import { TOLA_TO_GRAM, RATTI_PER_GRAM, fineWeight, getLatestRate, formatRateTime } from "@/lib/gold";

const TOLA_IN_GRAMS = TOLA_TO_GRAM;
const RATTI_IN_GRAMS = RATTI_PER_GRAM;

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  weight: number;
  weight_unit: string;
  making_charges: number;
  making_unit: string; // "pkr" | "gram" | "ratti"
  unit_price: number;
  total: number;
  purity_karat?: number | null;
  gross_weight?: number;
  net_weight?: number;
  in_stock?: boolean; // true = have in inventory, false = drop-ship from supplier
  supplier_id?: string; // supplier to buy from if not in stock
  cost_price?: number; // cost from supplier for drop-ship items
  cost_weight?: number; // fine gold weight (grams) for profit calc — internal only, never printed
}

const getMakingChargesPKR = (value: number, unit: string, tolaRate: number): number => {
  const rpg = tolaRate / TOLA_IN_GRAMS;
  if (unit === "gram") return value * rpg;
  if (unit === "ratti") return (value / RATTI_IN_GRAMS) * rpg;
  return value; // "pkr"
};

const Sales = () => {
  const navigate = useNavigate();
  const { data: sales, fetch: fetchSales } = useBusinessData("sales");
  const { data: customers, fetch: fetchCustomers } = useBusinessData("customers");
  const { data: products } = useBusinessData("products");
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: goldRates } = useBusinessData("gold_rates" as any);
  const latestRate: any = getLatestRate(goldRates as any[]);
  const [karat, setKarat] = useState<string>("22k");

  const applyKaratRate = (k: string) => {
    if (!latestRate) return;
    const map: Record<string, number> = {
      "24k": Number(latestRate.tola_24k) || 0,
      "22k": Number(latestRate.tola_22k) || 0,
      "21k": Number(latestRate.tola_21k) || 0,
      "18k": Number(latestRate.tola_18k) || 0,
      "silver": Number(latestRate.silver_tola) || 0,
    };
    const r = map[k] || 0;
    if (r > 0) {
      setTolaRate(String(r));
      recalculateAllItems(r);
    }
  };
  const { businessId, shopName, ownerName, shopLogo, shopAddress, shopPhone } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scannerOpenForRow, setScannerOpenForRow] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", alt_phone: "", reference: "", reference_phone: "", address: "", photo_url: "" });

  const handleCreateCustomer = async () => {
    if (!businessId || !newCust.name.trim()) {
      toast({ title: "Customer name required", variant: "destructive" });
      return;
    }
    const { data: created, error } = await (supabase.from("customers") as any).insert({
      business_id: businessId,
      name: newCust.name.trim(),
      phone: newCust.phone || null,
      alt_phone: newCust.alt_phone || null,
      reference: newCust.reference || null,
      reference_phone: newCust.reference_phone || null,
      address: newCust.address || null,
      photo_url: newCust.photo_url || null,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await fetchCustomers();
    setCustomerId(created.id);
    setNewCustOpen(false);
    setNewCust({ name: "", phone: "", alt_phone: "", reference: "", reference_phone: "", address: "", photo_url: "" });
    toast({ title: `Customer "${created.name}" created & selected` });
  };
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [tolaRate, setTolaRate] = useState("");
  const [repaymentDate, setRepaymentDate] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  const addItem = () => setItems([...items, { product_id: "", product_name: "", quantity: 1, weight: 0, weight_unit: "gram", making_charges: 0, making_unit: "pkr", unit_price: 0, total: 0, purity_karat: null, gross_weight: 0, net_weight: 0, in_stock: true, supplier_id: "", cost_price: 0, cost_weight: 0 }]);

  const goldPerUnitCalc = (weightStr: string | number, weightUnit: string, rate: number) => {
    const weight = parseFloat(String(weightStr)) || 0;
    const wg = weightUnit === "ratti" ? weight / RATTI_PER_GRAM : weight;
    return (wg / TOLA_IN_GRAMS) * rate;
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "product_id") {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated[index].product_name = prod.name;
        updated[index].weight = Number(prod.weight_value) || 0;
        updated[index].weight_unit = prod.weight_unit === "milligram" ? "ratti" : "gram";
        updated[index].purity_karat = prod.purity_karat || null;
        updated[index].gross_weight = Number(prod.gross_weight) || 0;
        updated[index].net_weight = prod.gross_weight && prod.purity_karat ? fineWeight(Number(prod.gross_weight), prod.purity_karat) : 0;
        updated[index].cost_weight = Number(prod.cost_weight) || 0;
      }
    }
    const rate = parseFloat(tolaRate) || 0;
    const item = updated[index];
    const qty = parseFloat(String(item.quantity)) || 1;
    const mcPKR = getMakingChargesPKR(parseFloat(String(item.making_charges)) || 0, item.making_unit, rate);
    if (rate > 0) {
      const gold = goldPerUnitCalc(item.weight, item.weight_unit, rate);
      updated[index].unit_price = gold + mcPKR;
      updated[index].total = (gold + mcPKR) * qty;
    } else {
      const base = field === "unit_price" ? (parseFloat(String(value)) || 0) : (parseFloat(String(item.unit_price)) || 0);
      updated[index].total = (base + mcPKR) * qty;
    }
    setItems(updated);
  };

  const recalculateAllItems = (rate: number) => {
    if (rate <= 0) return;
    const updated = items.map(item => {
      const gold = goldPerUnitCalc(item.weight, item.weight_unit, rate);
      const mcPKR = getMakingChargesPKR(parseFloat(String(item.making_charges)) || 0, item.making_unit, rate);
      const pricePerUnit = gold + mcPKR;
      return { ...item, unit_price: pricePerUnit, total: pricePerUnit * item.quantity };
    });
    setItems(updated);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleBarcodeScan = (code: string) => {
    if (scannerOpenForRow === null) return;
    const matched = products.find((p: any) => p.serial_number === code);
    if (!matched) {
      toast({ title: "No product found", description: `Code: ${code}`, variant: "destructive" });
      return;
    }
    if (Number(matched.stock_quantity) <= 0) {
      toast({ title: "Out of stock", description: `${matched.name} ka stock 0 hai`, variant: "destructive" });
      return;
    }
    updateItem(scannerOpenForRow, "product_id", matched.id);
    setScannerOpenForRow(null);
  };

  const totalWeightGrams = items.reduce((sum, item) => {
    const wg = item.weight_unit === "ratti"
      ? (parseFloat(String(item.weight)) || 0) / RATTI_IN_GRAMS
      : (parseFloat(String(item.weight)) || 0);
    return sum + wg * (parseFloat(String(item.quantity)) || 1);
  }, 0);

  const rate = parseFloat(tolaRate) || 0;
  const ratePerGram = rate / TOLA_IN_GRAMS;
  const totalGoldValue = totalWeightGrams * ratePerGram;
  const totalMakingCharges = items.reduce((sum, item) => {
    const mcPKR = getMakingChargesPKR(parseFloat(String(item.making_charges)) || 0, item.making_unit, rate);
    return sum + mcPKR * (parseFloat(String(item.quantity)) || 1);
  }, 0);

  const totalAmount = totalGoldValue + totalMakingCharges;
  const finalAmount = totalAmount - (parseFloat(discount) || 0);
  const paid = parseFloat(paidAmount) || 0;

  const getPaymentStatus = (paidAmt: number, totalAmt: number) => {
    if (totalAmt <= 0) return "full";
    if (paidAmt >= totalAmt) return "full";
    if (paidAmt > 0) return "partial";
    return "unpaid";
  };

  const paymentStatus = getPaymentStatus(paid, finalAmount);

  const handleSubmit = async () => {
    if (!businessId || items.length === 0) return;
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const actualCustomerId = customerId && customerId !== "walk-in" ? customerId : null;

    const { data: sale, error } = await (supabase.from("sales") as any).insert({
      business_id: businessId,
      customer_id: actualCustomerId,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      discount: parseFloat(discount) || 0,
      final_amount: finalAmount,
      paid_amount: paid,
      payment_status: paymentStatus,
      tola_rate: parseFloat(tolaRate) || 0,
      repayment_date: repaymentDate || null,
      notes_internal: saleNote.trim() || null,
    }).select().single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const { error: itemErr } = await (supabase.from("sale_items") as any).insert(
      items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: parseFloat(String(item.quantity)) || 0,
        unit_price: item.unit_price,
        total: item.total,
        polish_waste: getMakingChargesPKR(
          parseFloat(String(item.making_charges)) || 0,
          item.making_unit,
          parseFloat(tolaRate) || 0
        ),
        weight: parseFloat(String(item.weight)) || 0,
        weight_unit: item.weight_unit,
        purity_karat: item.purity_karat || null,
        gross_weight: item.gross_weight || 0,
        net_weight: item.net_weight || 0,
        cost_weight: Number(item.cost_weight) || 0,
        cost_price: item.in_stock === false && Number(item.cost_weight) > 0
          ? (Number(item.cost_weight) / TOLA_IN_GRAMS) * (parseFloat(tolaRate) || 0)
          : 0,
        in_stock: item.in_stock !== false,
      }))
    );
    if (itemErr) { toast({ title: "Error saving items", description: itemErr.message, variant: "destructive" }); return; }

    // Handle drop-ship items (not in stock) — what we owe the supplier is GOLD
    // (Cost Weight), not a fixed PKR price frozen at today's rate. It's tracked
    // purely as a gold balance on the supplier ledger; Payables values it live
    // using the current gold rate (Cost Weight x current rate), so price moves
    // between now and settlement don't get baked in as a wrong debt.
    const dropShipItems = items.filter(item => !item.in_stock && item.supplier_id && Number(item.cost_weight) > 0);
    for (const dropShipItem of dropShipItems) {
      const costWeightGrams = (Number(dropShipItem.cost_weight) || 0) * (parseFloat(String(dropShipItem.quantity)) || 1);

      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "supplier",
        reference_id: dropShipItem.supplier_id,
        description: `Drop-ship: ${dropShipItem.product_name} (${costWeightGrams.toFixed(3)}g gold owed) - ${invoiceNumber}`,
        debit: 0,
        credit: 0,
        gold_debit: 0,
        gold_credit: costWeightGrams,
        balance: 0,
      });
    }

    // Handle regular items (in stock)
    for (const item of items) {
      if (item.product_id && item.in_stock) {
        const prod = products.find((p: any) => p.id === item.product_id);
        if (prod) {
          await (supabase.from("products") as any).update({
            stock_quantity: Math.max(0, Number(prod.stock_quantity) - item.quantity),
          }).eq("id", item.product_id);
        }
      }
    }

    // Customer ledger entry — if this silently fails, the sale would look fine
    // everywhere but the customer's ledger would just never show the receivable,
    // so surface any error instead of swallowing it.
    if (actualCustomerId) {
      const { error: ledgerErr } = await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId, entry_type: "customer", reference_id: actualCustomerId,
        description: `Sale ${invoiceNumber}`, debit: finalAmount, credit: 0, balance: 0,
      });
      if (ledgerErr) {
        toast({ title: "Sale saved, but ledger entry failed", description: `${ledgerErr.message} — open the invoice and use "Ledger Mein Add Karo" to fix.`, variant: "destructive" });
      } else if (paid > 0) {
        const { error: payLedgerErr } = await (supabase.from("ledger_entries") as any).insert({
          business_id: businessId, entry_type: "customer", reference_id: actualCustomerId,
          description: `Payment for ${invoiceNumber}`, debit: 0, credit: paid, balance: 0,
        });
        if (payLedgerErr) {
          toast({ title: "Payment ledger entry failed", description: payLedgerErr.message, variant: "destructive" });
        }
      }
    }

    toast({ title: "Sale created successfully" });
    setOpen(false);
    setItems([]);
    setCustomerId("");
    setDiscount("0");
    setPaidAmount("");
    setTolaRate("");
    setRepaymentDate("");
    setSaleNote("");
    fetchSales();
  };

  // Deleting a sale must undo everything it caused: give back stock for items
  // that were sold from own inventory, and remove the ledger entries it created
  // (customer debit/payment, any later repayments, and supplier gold-owed entries
  // for drop-ship items) — all of them reference the invoice number in their
  // description, so that's how we find them again.
  const deleteSale = async (sale: any) => {
    if (!window.confirm(`Delete invoice ${sale.invoice_number}? This restores stock and removes its ledger entries. This cannot be undone.`)) return;

    const { data: saleItemRows } = await (supabase.from("sale_items").select("*") as any).eq("sale_id", sale.id);

    for (const item of saleItemRows || []) {
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
    fetchSales();
  };

  const salesWithStatus = sales.map((s: any) => ({
    ...s,
    computed_status: getPaymentStatus(Number(s.paid_amount), Number(s.final_amount)),
  }));

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "customer_id", label: "Customer", render: (v: string) => {
      const cust = customers.find((c: any) => c.id === v);
      if (!cust) return "Walk-in";
      return (
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline font-medium"
          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${cust.id}`); }}
        >
          {cust.name}
        </button>
      );
    }},
    { key: "final_amount", label: "Amount", render: (v: number) => formatCurrency(v) },
    { key: "paid_amount", label: "Paid", render: (v: number) => formatCurrency(v) },
    { key: "id", label: "Remaining", render: (_: any, row: any) => {
      const rem = Number(row.final_amount) - Number(row.paid_amount);
      return <span className={rem > 0 ? "text-destructive font-medium" : "text-success"}>{formatCurrency(rem)}</span>;
    }},
    { key: "computed_status", label: "Status", render: (v: string) => <StatusBadge status={v} /> },
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  const totalSalesAmount = sales.reduce((s: number, x: any) => s + Number(x.final_amount || 0), 0);
  const totalReceived = sales.reduce((s: number, x: any) => s + Number(x.paid_amount || 0), 0);
  const totalRemaining = totalSalesAmount - totalReceived;

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">

        {/* ── PRINT-ONLY HEADER ─────────────────────────────────────────── */}
        <div className="hidden print:flex items-center justify-between border-b-2 pb-4 mb-4" style={{ borderColor: "#7a1a1a" }}>
          <div className="flex items-center gap-3">
            {shopLogo && (
              <img src={shopLogo} alt="logo" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px" }} />
            )}
            <div>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#7a1a1a", textTransform: "uppercase", letterSpacing: "1px" }}>
                {shopName || "Jewellers"}
              </div>
              {ownerName && (
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#555" }}>{ownerName}</div>
              )}
              {shopPhone && (
                <div style={{ fontSize: "12px", color: "#333" }}>Cell: {shopPhone}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#7a1a1a" }}>Sales Report</div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            {shopAddress && (
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{shopAddress}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-sm text-muted-foreground">Manage invoices & sales</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 flex-1 sm:flex-none"><Plus className="w-4 h-4" /> New Sale</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader><DialogTitle>Create Sale Invoice</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex gap-1.5">
                      <div className="flex-1">
                        <Select value={customerId} onValueChange={setCustomerId}>
                          <SelectTrigger><SelectValue placeholder="Customer (optional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                            {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="outline" size="icon" title="Create new customer" onClick={() => setNewCustOpen(true)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      type="date"
                      value={repaymentDate}
                      onChange={e => setRepaymentDate(e.target.value)}
                      title="Repayment Due Date"
                    />
                  </div>

                  <Textarea
                    placeholder="Note (internal reference only — never printed on invoice)"
                    value={saleNote}
                    onChange={e => setSaleNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />

                  {/* ── Quick Create Customer ── */}
                  <Dialog open={newCustOpen} onOpenChange={setNewCustOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <ImageUpload currentUrl={newCust.photo_url} onUpload={(url) => setNewCust({ ...newCust, photo_url: url })} folder="customers" size="sm" />
                        </div>
                        <Input placeholder="Customer Name *" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Phone" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
                          <Input placeholder="Alternative Phone" value={newCust.alt_phone} onChange={e => setNewCust({ ...newCust, alt_phone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Reference Name" value={newCust.reference} onChange={e => setNewCust({ ...newCust, reference: e.target.value })} />
                          <Input placeholder="Reference Phone" value={newCust.reference_phone} onChange={e => setNewCust({ ...newCust, reference_phone: e.target.value })} />
                        </div>
                        <Input placeholder="Address" value={newCust.address} onChange={e => setNewCust({ ...newCust, address: e.target.value })} />
                        <Button className="w-full" onClick={handleCreateCustomer}>Create & Select Customer</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {latestRate && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                      <div className="font-semibold mb-1">
                        Latest Gold Rate ({new Date(latestRate.rate_date).toLocaleDateString()}
                        {latestRate.rate_time ? ` ${formatRateTime(latestRate.rate_time)}` : ""}
                        {latestRate.rate_type ? ` — ${latestRate.rate_type}` : ""}) — pick one to auto-fill:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { k: "24k", label: `24K ${formatCurrency(latestRate.tola_24k)}` },
                          { k: "22k", label: `22K ${formatCurrency(latestRate.tola_22k)}` },
                          { k: "21k", label: `21K ${formatCurrency(latestRate.tola_21k)}` },
                          { k: "18k", label: `18K ${formatCurrency(latestRate.tola_18k)}` },
                          { k: "silver", label: `Silver ${formatCurrency(latestRate.silver_tola)}` },
                        ].map(o => (
                          <Button key={o.k} type="button" size="sm" variant={karat === o.k ? "default" : "outline"} className="h-7 text-[11px]" onClick={() => { setKarat(o.k); applyKaratRate(o.k); }}>{o.label}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Input
                    placeholder="1 Tola Gold Rate (PKR) — auto from selection or enter custom"
                    type="number"
                    value={tolaRate}
                    onChange={e => {
                      setTolaRate(e.target.value);
                      recalculateAllItems(parseFloat(e.target.value) || 0);
                    }}
                  />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">Items</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="w-3 h-3" /> Add Item</Button>
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <div className="flex gap-2 items-end">
                          <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpenForRow(i)} title="Scan barcode or QR code"><Scan className="w-4 h-4" /></Button>
                          <div className="flex-1">
                            <ProductCombobox
                              products={products.filter((p: any) => p.business_id === businessId && Number(p.stock_quantity) > 0)}
                              value={item.product_id}
                              onSelect={(v) => updateItem(i, "product_id", v)}
                              placeholder="Search product..."
                            />
                          </div>
                          <Input className="w-16" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Weight (Gold)</label>
                            <div className="flex gap-1">
                              <Input type="text" inputMode="decimal" placeholder="0" className="flex-1"
                                value={item.weight === 0 ? "" : String(item.weight)}
                                onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ""); updateItem(i, "weight", v === "" ? 0 : v); }} />
                              <Tabs value={item.weight_unit} onValueChange={v => updateItem(i, "weight_unit", v)}>
                                <TabsList className="h-9">
                                  <TabsTrigger value="gram" className="text-xs px-2">g</TabsTrigger>
                                  <TabsTrigger value="ratti" className="text-xs px-2">r</TabsTrigger>
                                </TabsList>
                              </Tabs>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Making Charges</label>
                            <div className="flex gap-1">
                              <Input type="number" placeholder="0" className="flex-1"
                                value={item.making_charges === 0 ? "" : String(item.making_charges)}
                                onChange={e => updateItem(i, "making_charges", parseFloat(e.target.value) || 0)} />
                              <Tabs value={item.making_unit} onValueChange={v => updateItem(i, "making_unit", v)}>
                                <TabsList className="h-9">
                                  <TabsTrigger value="pkr" className="text-xs px-1.5">PKR</TabsTrigger>
                                  <TabsTrigger value="gram" className="text-xs px-1.5">g</TabsTrigger>
                                  <TabsTrigger value="ratti" className="text-xs px-1.5">r</TabsTrigger>
                                </TabsList>
                              </Tabs>
                            </div>
                            {item.making_unit !== "pkr" && rate > 0 && item.making_charges > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                = {formatCurrency(getMakingChargesPKR(item.making_charges, item.making_unit, rate))} PKR
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Drop-Ship Toggle */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`in-stock-${i}`}
                              checked={item.in_stock !== false}
                              onChange={e => updateItem(i, "in_stock", e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor={`in-stock-${i}`} className="text-xs text-muted-foreground cursor-pointer">
                              Have this item in stock?
                            </label>
                          </div>

                          {/* Own-stock cost weight (internal — never printed) */}
                          {item.in_stock !== false && (
                            <div className="grid grid-cols-2 gap-2 items-end">
                              <div>
                                <label className="text-xs text-muted-foreground">Cost Weight (g) — internal</label>
                                <Input
                                  type="number" step="0.0001" placeholder="0" className="h-8"
                                  value={item.cost_weight || ""}
                                  onChange={e => updateItem(i, "cost_weight", parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              {rate > 0 && Number(item.cost_weight) > 0 && (
                                <p className="text-xs text-success font-medium pb-1.5">
                                  💰 Profit: {formatCurrency((item.total || 0) - ((Number(item.cost_weight) / TOLA_IN_GRAMS) * rate * (item.quantity || 1)))}
                                </p>
                              )}
                            </div>
                          )}

                          {item.in_stock === false && (
                            <div className="space-y-2 bg-amber-50/50 p-2 rounded border border-amber-200">
                              <p className="text-xs font-semibold text-amber-900">Drop-Ship: Will buy from supplier</p>
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={item.supplier_id || ""} onValueChange={v => updateItem(i, "supplier_id", v)}>
                                  <SelectTrigger className="h-8"><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                  <SelectContent>
                                    {suppliers.length === 0 ? (
                                      <SelectItem value="none" disabled>No suppliers found</SelectItem>
                                    ) : (
                                      suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                    )}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="Cost Weight (g)"
                                  className="h-8"
                                  value={item.cost_weight || ""}
                                  onChange={e => updateItem(i, "cost_weight", parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              {rate > 0 && Number(item.cost_weight) > 0 && (
                                <p className="text-xs text-amber-800">
                                  Owed to supplier: {(Number(item.cost_weight) * (item.quantity || 1)).toFixed(3)}g gold
                                  <span className="text-amber-600"> (≈ {formatCurrency((Number(item.cost_weight) / TOLA_IN_GRAMS) * rate * (item.quantity || 1))} at today's rate, for reference only)</span>
                                </p>
                              )}
                              {rate > 0 && Number(item.cost_weight) > 0 && (
                                <p className="text-xs text-success font-medium">
                                  💰 Profit: {formatCurrency((item.total || 0) - ((Number(item.cost_weight) / TOLA_IN_GRAMS) * rate * (item.quantity || 1)))}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end text-sm">
                          <span className="font-semibold text-primary">Item Total: {formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > 0 && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Weight</span>
                        <span className="font-medium text-foreground">{totalWeightGrams.toFixed(3)} g</span>
                      </div>
                      {ratePerGram > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Gold Value <span className="text-xs">({totalWeightGrams.toFixed(3)}g × {ratePerGram.toFixed(2)})</span></span>
                          <span className="font-medium text-foreground">{formatCurrency(totalGoldValue)}</span>
                        </div>
                      )}
                      {totalMakingCharges > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Making Charges</span>
                          <span className="font-medium text-foreground">{formatCurrency(totalMakingCharges)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-1.5 mt-1">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Discount</span>
                        <Input className="w-24 ml-auto h-7 text-sm" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
                      </div>
                      <div className="flex justify-between font-bold text-base border-t pt-1.5">
                        <span>Total</span>
                        <span>{formatCurrency(finalAmount)}</span>
                      </div>
                      <Input placeholder="Paid Amount" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                      <p className="text-xs text-muted-foreground">
                        Remaining: <span className={finalAmount - paid > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{formatCurrency(Math.max(0, finalAmount - paid))}</span>
                        {" "}({paymentStatus})
                      </p>
                    </div>
                  )}

                  <Button className="w-full" onClick={handleSubmit} disabled={items.length === 0}>Create Sale</Button>
                </div>
              </DialogContent>
            </Dialog>
            <BarcodeScanner open={scannerOpenForRow !== null} onOpenChange={() => setScannerOpenForRow(null)} onScan={handleBarcodeScan} />

          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Sales" value={formatCurrency(totalSalesAmount)} subtitle={`${sales.length} invoices`} icon={ShoppingCart} gradient="blue" />
          <StatCard title="Received" value={formatCurrency(totalReceived)} icon={Wallet} gradient="green" />
          <StatCard title="Remaining" value={formatCurrency(totalRemaining)} icon={ArrowDownCircle} gradient="amber" />
          <StatCard title="Invoices" value={String(sales.length)} icon={Printer} gradient="purple" />
        </div>
        <DataTable
          columns={columns}
          data={salesWithStatus}
          onRowClick={(row) => navigate(`/sales/${row.id}`)}
          onDelete={deleteSale}
        />
      </div>
    </AppLayout>
  );
};

export default Sales;
