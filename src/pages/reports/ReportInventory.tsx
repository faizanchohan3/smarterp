import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { Printer, Package, Tag, Scale, ShoppingCart } from "lucide-react";

const ReportInventory = () => {
  const navigate = useNavigate();
  const { data: products } = useBusinessData("products");
  const { data: categories } = useBusinessData("categories");
  const { businessId } = useAuth();
  const [salesByProduct, setSalesByProduct] = useState<Record<string, any[]>>({});
  const [invoiceDialogProduct, setInvoiceDialogProduct] = useState<any>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await (supabase
        .from("sale_items")
        .select("*, sales!inner(id, invoice_number, created_at, business_id)") as any)
        .eq("sales.business_id", businessId);
      const grouped: Record<string, any[]> = {};
      (data || []).forEach((it: any) => {
        if (!it.product_id) return;
        (grouped[it.product_id] ||= []).push(it);
      });
      setSalesByProduct(grouped);
    })();
  }, [businessId]);

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum: number, p: any) => sum + (Number(p.price) * Number(p.stock_quantity)), 0);
  const totalStock = products.reduce((sum: number, p: any) => sum + Number(p.stock_quantity), 0);
  // Gross/Net/Cost weight on a product is PER UNIT — multiply by stock_quantity for the true inventory total
  const totalGrossWeight = products.reduce((sum: number, p: any) => sum + (Number(p.gross_weight) || 0) * Number(p.stock_quantity || 0), 0);
  const totalNetWeight = products.reduce((sum: number, p: any) => sum + (Number(p.net_weight) || 0) * Number(p.stock_quantity || 0), 0);
  const totalCostWeight = products.reduce((sum: number, p: any) => sum + (Number(p.cost_weight) || 0) * Number(p.stock_quantity || 0), 0);

  const categoryBreakdown = categories.map((c: any) => {
    const prods = products.filter((p: any) => p.category_id === c.id);
    return {
      id: c.id,
      name: c.name,
      count: prods.length,
      stock: prods.reduce((s: number, p: any) => s + Number(p.stock_quantity || 0), 0),
      grossWeight: prods.reduce((s: number, p: any) => s + (Number(p.gross_weight) || 0) * Number(p.stock_quantity || 0), 0),
      netWeight: prods.reduce((s: number, p: any) => s + (Number(p.net_weight) || 0) * Number(p.stock_quantity || 0), 0),
      costWeight: prods.reduce((s: number, p: any) => s + (Number(p.cost_weight) || 0) * Number(p.stock_quantity || 0), 0),
    };
  });
  const uncategorizedCount = products.filter((p: any) => !p.category_id).length;

  const getProductSales = (productId: string) => salesByProduct[productId] || [];
  const totalSold = (productId: string) => getProductSales(productId).reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);
  const totalSaleAmount = (productId: string) => getProductSales(productId).reduce((s: number, it: any) => s + Number(it.total || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Inventory Report" subtitle={`Total Products: ${totalProducts}`} />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Inventory Report</h1>
            <p className="text-sm text-muted-foreground">Current stock levels — {totalProducts} products</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 print:grid-cols-6">
          <StatCard title="Total Products" value={String(totalProducts)} icon={Package} gradient="blue" />
          <StatCard title="Categories" value={String(categoryBreakdown.length)} icon={Tag} gradient="purple" />
          <StatCard title="Total Gross Weight" value={`${totalGrossWeight.toFixed(3)} g`} icon={Scale} gradient="amber" />
          <StatCard title="Total Net Weight" value={`${totalNetWeight.toFixed(3)} g`} icon={Scale} gradient="green" />
          <StatCard title="Total Cost Weight" value={`${totalCostWeight.toFixed(3)} g`} icon={Scale} gradient="pink" />
          <StatCard title="Total Stock Value" value={formatCurrency(totalStockValue)} icon={ShoppingCart} gradient="blue" />
        </div>

        {/* Products by Category */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Products by Category</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Category" },
              { key: "count", label: "Products" },
              { key: "stock", label: "Stock Qty" },
              { key: "grossWeight", label: "Gross Weight (g)", render: (v: number) => v.toFixed(3) },
              { key: "netWeight", label: "Net Weight (g)", render: (v: number) => v.toFixed(3) },
              { key: "costWeight", label: "Cost Weight (g)", render: (v: number) => v > 0 ? v.toFixed(3) : "-" },
            ]} data={categoryBreakdown} />
            {uncategorizedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">+ {uncategorizedCount} product(s) without a category</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Products</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Product", render: (v: string, row: any) => (
                <button
                  type="button"
                  className="text-primary font-medium hover:underline text-left print:no-underline print:text-foreground"
                  onClick={() => setInvoiceDialogProduct(row)}
                >
                  {v}
                </button>
              )},
              { key: "category_id", label: "Category", render: (v: string) => categories.find((c: any) => c.id === v)?.name || "-" },
              { key: "stock_quantity", label: "Stock" },
              { key: "gross_weight", label: "Gross Wt/unit (g)", render: (v: number) => v ? Number(v).toFixed(3) : "-" },
              { key: "net_weight", label: "Net Wt/unit (g)", render: (v: number) => v ? Number(v).toFixed(3) : "-" },
              { key: "cost_weight", label: "Cost Wt/unit (g)", render: (v: number) => v ? Number(v).toFixed(4) : "-" },
              { key: "id", label: "Total Sold", render: (_: any, row: any) => totalSold(row.id) || "-" },
              { key: "id", label: "Total Sales", render: (_: any, row: any) => {
                const amt = totalSaleAmount(row.id);
                return amt > 0 ? formatCurrency(amt) : "-";
              }},
            ]} data={products} />
          </CardContent>
        </Card>

        <ReportFooter />

        {/* Invoices for a product — screen only */}
        <Dialog open={!!invoiceDialogProduct} onOpenChange={(o) => !o && setInvoiceDialogProduct(null)}>
          <DialogContent className="max-w-lg print:hidden">
            <DialogHeader><DialogTitle>Sales — {invoiceDialogProduct?.name}</DialogTitle></DialogHeader>
            {invoiceDialogProduct && (
              getProductSales(invoiceDialogProduct.id).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Yeh product abhi tak kisi sale mein nahi becha gaya.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50">
                      <th className="text-left p-2.5">Invoice</th>
                      <th className="text-left p-2.5">Date</th>
                      <th className="text-right p-2.5">Qty</th>
                      <th className="text-right p-2.5">Amount</th>
                    </tr></thead>
                    <tbody>
                      {getProductSales(invoiceDialogProduct.id)
                        .sort((a: any, b: any) => new Date(b.sales.created_at).getTime() - new Date(a.sales.created_at).getTime())
                        .map((it: any) => (
                          <tr key={it.id} className="border-t">
                            <td className="p-2.5">
                              <button
                                type="button"
                                className="text-primary font-medium hover:underline"
                                onClick={() => navigate(`/sales/${it.sales.id}`)}
                              >
                                {it.sales.invoice_number}
                              </button>
                            </td>
                            <td className="p-2.5">{new Date(it.sales.created_at).toLocaleDateString()}</td>
                            <td className="p-2.5 text-right">{it.quantity}</td>
                            <td className="p-2.5 text-right">{formatCurrency(it.total)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ReportInventory;
