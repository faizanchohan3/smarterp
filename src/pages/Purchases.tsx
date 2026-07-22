import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { postAccountEntries } from "@/lib/accounting";
import { Plus, Trash2, Package, Archive } from "lucide-react";

const Purchases = () => {
  const navigate = useNavigate();
  const { data: purchases, fetch: fetchPurchases } = useBusinessData("purchases");
  const { data: suppliers } = useBusinessData("suppliers");
  const { data: customers } = useBusinessData("customers");
  const { data: products, fetch: fetchProducts } = useBusinessData("products");
  const { data: categories } = useBusinessData("categories");
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const { data: expenseData, fetch: fetchExpenses } = useBusinessData("expenses");
  const { businessId } = useAuth();
  const { toast } = useToast();

  // --- Create form ---
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"supplier" | "customer">("supplier");
  const [supplierId, setSupplierId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // --- Add-to-stock dialog ---
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [pendingPurchaseId, setPendingPurchaseId] = useState("");
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  // category selected per NEW item (index → category_id)
  const [itemCategories, setItemCategories] = useState<Record<number, string>>({});

  // --- Edit dialog ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [editPaidAmount, setEditPaidAmount] = useState("");

  // --- Sold dialog ---
  const [soldOpen, setSoldOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [soldPrice, setSoldPrice] = useState("");
  const [soldToType, setSoldToType] = useState<"customer" | "vendor">("customer");
  const [soldToCustomerId, setSoldToCustomerId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [soldNotes, setSoldNotes] = useState("");

  // ─── Form helpers ────────────────────────────────────────────────────────────

  const addItem = () =>
    setItems([...items, { product_id: "", product_name: "", quantity: 1, weight: 0, weight_unit: "gram", unit_price: 0, total: 0 }]);

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === "product_id") {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated[index].product_name = prod.name;
        updated[index].unit_price = Number(prod.price);
      }
    }
    // Typing a custom name clears the product link
    if (field === "product_name") {
      updated[index].product_id = "";
    }
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  // Auto round-off — a clean total (e.g. 12000 or 12100), not an odd figure
  // like 12038 from raw gold-weight math.
  const totalAmount = Math.round(items.reduce((sum: number, i: any) => sum + i.total, 0) / 100) * 100;
  const paid = parseFloat(paidAmount) || 0;

  const resetForm = () => {
    setItems([]);
    setSupplierId("");
    setFormCustomerId("");
    setPaidAmount("");
    setSourceType("supplier");
  };

  // ─── Create purchase ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!businessId || items.length === 0) return;
    if (items.some((i: any) => !i.product_name?.trim())) {
      toast({ title: "Missing product name", description: "Enter a name for each item.", variant: "destructive" });
      return;
    }
    const invoiceNumber = `PUR-${Date.now().toString(36).toUpperCase()}`;
    const paymentStatus = paid >= totalAmount ? "full" : paid > 0 ? "partial" : "unpaid";

    const { data: purchase, error } = await (supabase.from("purchases") as any)
      .insert({
        business_id: businessId,
        supplier_id: sourceType === "supplier" ? supplierId || null : null,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        paid_amount: paid,
        payment_status: paymentStatus,
      })
      .select()
      .single();

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    await (supabase.from("purchase_items") as any).insert(
      items.map((item: any) => ({ purchase_id: purchase.id, ...item }))
    );

    // Customer purchase (shop buying an item FROM the customer, e.g. a trade-in/
    // exchange): the shop now owes the customer for it, so this must be a
    // CREDIT — same convention as supplier purchases (credit = we owe them).
    // Paying them back reduces that, so it's a debit, mirroring a Sale's debit
    // (customer owes shop) / payment-credit pattern in reverse. This is what
    // lets a trade-in and a subsequent Sale net out correctly on the same
    // customer's ledger instead of both looking like separate amounts owed
    // to the shop.
    // description = "CUST_PURCHASE:<purchaseId>" so we can find which customer bought what.
    if (sourceType === "customer" && formCustomerId) {
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId,
        entry_type: "customer",
        reference_id: formCustomerId,
        description: `CUST_PURCHASE:${purchase.id}`,
        debit: 0,
        credit: totalAmount,
        balance: 0,
      });
      if (paid > 0) {
        await (supabase.from("ledger_entries") as any).insert({
          business_id: businessId, entry_type: "customer", reference_id: formCustomerId,
          description: `Paid to customer for ${invoiceNumber}`, debit: paid, credit: 0, balance: 0,
        });
      }
    }

    if (sourceType === "supplier" && supplierId) {
      const totalWeightG = items.reduce((s: number, it: any) => s + (parseFloat(String(it.weight)) || 0) * (parseFloat(String(it.quantity)) || 1), 0);
      await (supabase.from("ledger_entries") as any).insert({
        business_id: businessId, entry_type: "supplier", reference_id: supplierId,
        description: `Purchase ${invoiceNumber}${totalWeightG > 0 ? ` (${totalWeightG.toFixed(3)}g)` : ""}`,
        debit: 0, credit: totalAmount, gold_debit: 0, gold_credit: totalWeightG, balance: 0,
      });
      if (paid > 0) {
        await (supabase.from("ledger_entries") as any).insert({
          business_id: businessId, entry_type: "supplier", reference_id: supplierId,
          description: `Payment for ${invoiceNumber}`, debit: paid, credit: 0, balance: 0,
        });
      }
    }

    // Chart of Accounts: cost of goods acquired, against whatever was paid
    // now (Cash) and whatever's still owed (Accounts Payable) — same shape
    // whether the item came from a supplier or a customer trade-in.
    postAccountEntries(businessId, `Purchase ${invoiceNumber}`, [
      { account: "GOLD_PURCHASE", debit: totalAmount },
      { account: "CASH", credit: paid },
      { account: "PAYABLE", credit: totalAmount - paid },
    ]);

    setPendingPurchaseId(purchase.id);
    setPendingItems([...items]);
    setOpen(false);
    resetForm();
    setStockDialogOpen(true);
  };

  // ─── Stock decision ──────────────────────────────────────────────────────────

  const handleStockDecision = async (addToStock: boolean) => {
    if (addToStock) {
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        if (item.product_id) {
          // Existing product — just increment stock
          const prod = products.find((p: any) => p.id === item.product_id);
          if (prod) {
            await (supabase.from("products") as any)
              .update({ stock_quantity: Number(prod.stock_quantity) + item.quantity })
              .eq("id", item.product_id);
          }
        } else if (item.product_name?.trim()) {
          // New product typed manually — create it with the selected category
          const categoryId = itemCategories[i] || null;
          await (supabase.from("products") as any).insert({
            business_id: businessId,
            name: item.product_name.trim(),
            price: item.unit_price,
            stock_quantity: item.quantity,
            category_id: categoryId,
          });
        }
      }
    }
    setStockDialogOpen(false);
    setItemCategories({});
    toast({ title: addToStock ? "Items added to inventory" : "Transaction recorded (no stock change)" });
    fetchPurchases();
    fetchProducts();
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    if (!editingPurchase) return;
    const newPaid = parseFloat(editPaidAmount) || 0;
    const paymentStatus =
      newPaid >= Number(editingPurchase.total_amount) ? "full" : newPaid > 0 ? "partial" : "unpaid";
    const { error } = await (supabase.from("purchases") as any)
      .update({ paid_amount: newPaid, payment_status: paymentStatus })
      .eq("id", editingPurchase.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Purchase updated" });
    setEditOpen(false);
    fetchPurchases();
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (purchase: any) => {
    if (!confirm("Delete this purchase record? This removes the stock it added and its ledger entries.")) return;
    const { data: purchaseItems } = await (supabase.from("purchase_items") as any)
      .select("*").eq("purchase_id", purchase.id);
    if (purchaseItems) {
      for (const item of purchaseItems) {
        if (item.product_id) {
          const prod = products.find((p: any) => p.id === item.product_id);
          if (prod && Number(prod.stock_quantity) > 0) {
            await (supabase.from("products") as any)
              .update({ stock_quantity: Math.max(0, Number(prod.stock_quantity) - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }
    }

    // Remove the ledger entries this purchase created. Supplier-source purchases
    // and their payment both reference the invoice number in their description;
    // customer-source purchases instead tag the debit entry as "CUST_PURCHASE:<id>".
    await (supabase.from("ledger_entries") as any)
      .delete()
      .eq("business_id", businessId)
      .ilike("description", `%${purchase.invoice_number}%`);
    await (supabase.from("ledger_entries") as any)
      .delete()
      .eq("business_id", businessId)
      .eq("description", `CUST_PURCHASE:${purchase.id}`);

    // purchase_items and payments cascade-delete with the purchase automatically
    await (supabase.from("purchases") as any).delete().eq("id", purchase.id);
    toast({ title: "Purchase deleted", description: "Stock and ledger entries reversed." });
    fetchPurchases();
    fetchExpenses();
  };

  // ─── Sold ────────────────────────────────────────────────────────────────────
  // Stored in expenses table (category='purchase_resale') — no CHECK constraint on category field.
  // amount = sold price (revenue), profit stored in description JSON.

  const handleSold = async () => {
    if (!selectedPurchase || !soldPrice) return;
    const soldPriceNum = parseFloat(soldPrice);
    const profit = soldPriceNum - Number(selectedPurchase.total_amount);
    const buyerName = soldToType === "customer"
      ? customers.find((c: any) => c.id === soldToCustomerId)?.name || "Customer"
      : vendorName;

    const { error } = await (supabase.from("expenses") as any).insert({
      business_id: businessId,
      category: "purchase_resale",
      amount: soldPriceNum,
      date: new Date().toISOString().split("T")[0],
      description: JSON.stringify({
        purchase_id: selectedPurchase.id,
        profit,
        sold_to: soldToType,
        buyer_name: buyerName,
        customer_id: soldToType === "customer" ? soldToCustomerId || null : null,
        vendor_name: soldToType === "vendor" ? vendorName || null : null,
        notes: soldNotes || null,
      }),
    });

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    toast({
      title: `Sale recorded! ${profit >= 0 ? "Profit" : "Loss"}: ${formatCurrency(Math.abs(profit))}`,
      description: profit >= 0 ? "Profitable transaction" : "Sold below purchase cost",
    });
    setSoldOpen(false);
    setSoldPrice("");
    setSoldToType("customer");
    setSoldToCustomerId("");
    setVendorName("");
    setSoldNotes("");
    fetchExpenses();
  };

  // ─── Display helpers ─────────────────────────────────────────────────────────

  // Find which customer this purchase was bought from (via ledger_entries lookup)
  const getSource = (purchase: any) => {
    const custLedger = ledgerEntries.find(
      (e: any) => e.description === `CUST_PURCHASE:${purchase.id}`
    );
    if (custLedger) {
      const customer = customers.find((c: any) => c.id === custLedger.reference_id);
      return { type: "customer" as const, name: customer?.name || "Customer", id: customer?.id || null };
    }
    const supplier = suppliers.find((s: any) => s.id === purchase.supplier_id);
    return { type: "supplier" as const, name: supplier?.name || "-", id: supplier?.id || null };
  };

  // Find the resale expense record for a given purchase
  const getResale = (purchaseId: string) =>
    expenseData.find((e: any) => {
      if (e.category !== "purchase_resale") return false;
      try { return JSON.parse(e.description || "{}").purchase_id === purchaseId; } catch { return false; }
    });

  const parseResaleProfit = (expense: any): number => {
    try { return JSON.parse(expense.description || "{}").profit || 0; } catch { return 0; }
  };

  const profitPreview = soldPrice && selectedPurchase
    ? parseFloat(soldPrice) - Number(selectedPurchase.total_amount)
    : null;

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    {
      key: "supplier_id", label: "From",
      render: (_: any, row: any) => {
        const src = getSource(row);
        // Customer purchases open the customer's detail/ledger page;
        // supplier purchases open that supplier's ledger.
        const goToLedger = () => {
          if (!src.id) return;
          if (src.type === "customer") navigate(`/customers/${src.id}`);
          else navigate(`/ledger?tab=supplier&id=${src.id}`);
        };
        return (
          <span className="flex flex-col leading-tight">
            <span className={`text-xs font-semibold ${src.type === "customer" ? "text-blue-600" : "text-muted-foreground"}`}>
              {src.type === "customer" ? "Customer" : "Supplier"}
            </span>
            {src.id ? (
              <button
                type="button"
                className="text-sm text-primary hover:underline underline-offset-2 text-left font-medium"
                onClick={(e) => { e.stopPropagation(); goToLedger(); }}
              >
                {src.name} ↗
              </button>
            ) : (
              <span className="text-sm">{src.name}</span>
            )}
          </span>
        );
      },
    },
    { key: "total_amount", label: "Amount", render: (v: number) => formatCurrency(v) },
    { key: "paid_amount", label: "Paid", render: (v: number) => formatCurrency(v) },
    {
      key: "payment_status", label: "Status",
      render: (v: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          v === "full" ? "bg-success/10 text-success"
          : v === "partial" ? "bg-warning/10 text-warning"
          : "bg-destructive/10 text-destructive"
        }`}>{v}</span>
      ),
    },
    {
      key: "id", label: "Sale / Profit",
      render: (_: any, row: any) => {
        const resale = getResale(row.id);
        if (!resale) return <span className="text-xs text-muted-foreground">—</span>;
        const profit = parseResaleProfit(resale);
        return (
          <span className={`text-xs font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
          </span>
        );
      },
    },
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchases</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Purchase</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Purchase Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4">

                <div className="space-y-2">
                  <Label>Purchase From</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm"
                      variant={sourceType === "supplier" ? "default" : "outline"}
                      onClick={() => setSourceType("supplier")}>Supplier</Button>
                    <Button type="button" size="sm"
                      variant={sourceType === "customer" ? "default" : "outline"}
                      onClick={() => setSourceType("customer")}>Customer</Button>
                  </div>
                </div>

                {sourceType === "supplier" ? (
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select Supplier (optional)" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.phone ? ` — ${c.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>
                  {items.map((item: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                      <div className="flex gap-2 items-center">
                        {/* Product name — always editable, type freely or auto-filled by dropdown */}
                        <Input
                          className="flex-1"
                          placeholder="Product name (type directly)"
                          value={item.product_name}
                          onChange={e => updateItem(i, "product_name", e.target.value)}
                        />
                        <Button variant="ghost" size="icon"
                          onClick={() => setItems(items.filter((_: any, idx: number) => idx !== i))}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {/* Optional: pick from existing products to auto-fill name + price */}
                      {products.length > 0 && (
                        <Select value={item.product_id} onValueChange={v => updateItem(i, "product_id", v)}>
                          <SelectTrigger className="h-8 text-xs text-muted-foreground">
                            <SelectValue placeholder="Or pick from existing products (auto-fills price)" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — {formatCurrency(p.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Qty</p>
                          <Input type="number" placeholder="1" value={item.quantity}
                            onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Weight (g)</p>
                          <Input type="number" step="0.001" placeholder="0" value={item.weight || ""}
                            onChange={e => updateItem(i, "weight", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                          <Input type="number" placeholder="0" value={item.unit_price}
                            onChange={e => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Total</p>
                          <p className="font-semibold text-sm pt-2">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span><span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <Input placeholder="Paid Amount" type="number" value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)} />
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={items.length === 0}>
                  Create Purchase
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={purchases}
          onEdit={(row) => {
            setEditingPurchase(row);
            setEditPaidAmount(String(row.paid_amount));
            setEditOpen(true);
          }}
          onDelete={handleDelete}
        />

        {/* ── Add-to-stock dialog ── */}
        <Dialog open={stockDialogOpen} onOpenChange={() => {}}>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Items to Inventory?</DialogTitle></DialogHeader>

            {/* Items summary with category picker for new (custom-name) products */}
            <div className="space-y-2">
              {pendingItems.map((item: any, i: number) => (
                <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.product_name || "—"}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                  </div>
                  {item.product_id ? (
                    <p className="text-xs text-success">Already in products — stock will be updated</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">New product — select a category (optional):</p>
                      <Select
                        value={itemCategories[i] || ""}
                        onValueChange={v => setItemCategories(prev => ({ ...prev, [i]: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="No category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1 gap-2" onClick={() => handleStockDecision(true)}>
                <Package className="w-4 h-4" /> Add to Stock
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => handleStockDecision(false)}>
                <Archive className="w-4 h-4" /> Just Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Edit dialog ── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Update Purchase</DialogTitle></DialogHeader>
            {editingPurchase && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-medium">{editingPurchase.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{formatCurrency(editingPurchase.total_amount)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Paid Amount</Label>
                  <Input type="number" value={editPaidAmount}
                    onChange={e => setEditPaidAmount(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleEdit}>Update</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Sold dialog ── */}
        <Dialog open={soldOpen} onOpenChange={setSoldOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Record Sale of Purchased Item</DialogTitle></DialogHeader>
            {selectedPurchase && (
              <div className="space-y-4">

                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-medium">{selectedPurchase.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Cost</span>
                    <span className="font-medium">{formatCurrency(selectedPurchase.total_amount)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Sold Price</Label>
                  <Input type="number" placeholder="Enter sold price" value={soldPrice}
                    onChange={e => setSoldPrice(e.target.value)} />
                  {soldPrice && profitPreview !== null && (
                    <p className={`text-xs font-medium ${profitPreview >= 0 ? "text-success" : "text-destructive"}`}>
                      {profitPreview >= 0 ? "Profit" : "Loss"}: {formatCurrency(Math.abs(profitPreview))}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Sold To</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm"
                      variant={soldToType === "customer" ? "default" : "outline"}
                      onClick={() => setSoldToType("customer")}>Customer</Button>
                    <Button type="button" size="sm"
                      variant={soldToType === "vendor" ? "default" : "outline"}
                      onClick={() => setSoldToType("vendor")}>Other Vendor</Button>
                  </div>
                </div>

                {soldToType === "customer" ? (
                  <div className="space-y-1">
                    <Label>Customer</Label>
                    <Select value={soldToCustomerId} onValueChange={setSoldToCustomerId}>
                      <SelectTrigger><SelectValue placeholder="Select Customer (optional)" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label>Vendor Name</Label>
                    <Input placeholder="Enter vendor name" value={vendorName}
                      onChange={e => setVendorName(e.target.value)} />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Any notes..." value={soldNotes}
                    onChange={e => setSoldNotes(e.target.value)} />
                </div>

                <Button className="w-full" onClick={handleSold} disabled={!soldPrice}>
                  Record Sale
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default Purchases;
