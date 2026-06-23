import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import PrintHeader from "@/components/shared/PrintHeader";
import PrintFooter from "@/components/shared/PrintFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer } from "lucide-react";

const ReportInventory = () => {
  const { data: products } = useBusinessData("products");

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum: number, p: any) => sum + (Number(p.price) * Number(p.stock_quantity)), 0);
  const totalStock = products.reduce((sum: number, p: any) => sum + Number(p.stock_quantity), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <PrintHeader title="Inventory Report" subtitle={`Total Products: ${totalProducts}`} />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Inventory Report</h1>
            <p className="text-sm text-muted-foreground">Current stock levels — {totalProducts} products</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Stock Units</p>
              <p className="text-2xl font-bold">{totalStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Stock Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Products</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Product" },
              { key: "price", label: "Price", render: (v: number) => formatCurrency(v) },
              { key: "stock_quantity", label: "Stock" },
              { key: "id", label: "Stock Value", render: (_: any, row: any) => formatCurrency(Number(row.price) * Number(row.stock_quantity)) },
            ]} data={products} />
          </CardContent>
        </Card>
        <PrintFooter />
      </div>
    </AppLayout>
  );
};

export default ReportInventory;
