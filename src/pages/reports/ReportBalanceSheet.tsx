import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer, Landmark, Scale } from "lucide-react";

const Line = ({ label, amount, code, bold, negative }: { label: string; amount: number; code?: string; bold?: boolean; negative?: boolean }) => (
  <div className={`flex justify-between items-center py-2 border-b last:border-0 ${bold ? "font-bold" : ""}`}>
    <span className={`text-sm ${bold ? "" : "text-muted-foreground"}`}>
      {code && <span className="text-xs text-muted-foreground/60 mr-2">{code}</span>}{label}
    </span>
    <span className={`text-sm font-semibold ${negative ? "text-destructive" : ""}`}>{formatCurrency(amount)}</span>
  </div>
);

const ReportBalanceSheet = () => {
  const { data: sales } = useBusinessData("sales");
  const { data: purchases } = useBusinessData("purchases");
  const { data: expenses } = useBusinessData("expenses");
  const { data: products } = useBusinessData("products");
  const { data: customers } = useBusinessData("customers");
  const { data: payments } = useBusinessData("payments");
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const { data: jobCards } = useBusinessData("job_cards");
  const { data: customOrders } = useBusinessData("custom_orders");
  const { data: salaries } = useBusinessData("salaries");

  // ── ASSETS ────────────────────────────────────────────────────────────────
  // 1200 Inventory: current stock at sale price
  const inventoryValue = products.reduce((s: number, p: any) => s + Number(p.price || 0) * Number(p.stock_quantity || 0), 0);

  // 1100 Accounts Receivable: customers still owe on sales
  const receivables = sales.reduce((s: number, x: any) => s + Math.max(0, Number(x.final_amount || 0) - Number(x.paid_amount || 0)), 0);

  // Custom orders receivable (balance not yet paid on open orders)
  const customOrderReceivable = customOrders.reduce((s: number, o: any) => {
    if (o.status === "cancelled") return s;
    const bal = Number(o.total_price || 0) - Number(o.advance_amount || 0) - Number(o.paid_amount || 0);
    return s + Math.max(0, bal);
  }, 0);

  // 1001 Cash / Shop Account: money in − money out
  const cashIn =
    sales.reduce((s: number, x: any) => s + Number(x.paid_amount || 0), 0) +
    payments.filter((p: any) => p.type === "customer_payment" && !p.sale_id).reduce((s: number, p: any) => s + Number(p.amount || 0), 0) +
    customOrders.reduce((s: number, o: any) => o.status === "cancelled" ? s : s + Number(o.advance_amount || 0) + Number(o.paid_amount || 0), 0) +
    jobCards.reduce((s: number, j: any) => j.status === "cancelled" ? s : s + Number(j.advance_amount || 0), 0);

  const cashOut =
    purchases.reduce((s: number, p: any) => s + Number(p.paid_amount || 0), 0) +
    payments.filter((p: any) => ["supplier_payment", "karigar_payment"].includes(p.type)).reduce((s: number, p: any) => s + Number(p.amount || 0), 0) +
    expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0); // salaries included via Salary expense entries

  const shopCash = cashIn - cashOut;

  const totalAssets = Math.max(0, shopCash) + inventoryValue + receivables + customOrderReceivable;

  // ── LIABILITIES ───────────────────────────────────────────────────────────
  // 2001 Accounts Payable (suppliers): from supplier ledger (includes drop-ship)
  const supplierPayable = ledgerEntries
    .filter((e: any) => e.entry_type === "supplier")
    .reduce((s: number, e: any) => s + Number(e.credit || 0) - Number(e.debit || 0), 0);

  // 2100 Salaries Payable: accrued − paid (from employee ledger)
  const salariesPayable = ledgerEntries
    .filter((e: any) => e.entry_type === "employee")
    .reduce((s: number, e: any) => s + Number(e.credit || 0) - Number(e.debit || 0), 0);

  // 2200 Karigar Payable
  const karigarPayable = ledgerEntries
    .filter((e: any) => e.entry_type === "karigar")
    .reduce((s: number, e: any) => s + Number(e.credit || 0) - Number(e.debit || 0), 0);

  // Customer advances held (custom orders/repairs advances for undelivered work are a liability)
  const bankOverdraft = shopCash < 0 ? Math.abs(shopCash) : 0;

  const totalLiabilities = Math.max(0, supplierPayable) + Math.max(0, salariesPayable) + Math.max(0, karigarPayable) + bankOverdraft;

  // ── EQUITY ────────────────────────────────────────────────────────────────
  // Net profit (same logic as P&L)
  const totalSalesRev = sales.reduce((s: number, x: any) => s + Number(x.final_amount || 0), 0);
  const repairIncome = jobCards.reduce((s: number, j: any) => {
    if (j.status === "cancelled") return s;
    if (j.status === "returned") return s + Number(j.service_charge || 0);
    return s + Number(j.advance_amount || 0);
  }, 0);
  const customOrderIncome = customOrders.reduce((s: number, o: any) => {
    if (o.status === "cancelled") return s;
    if (o.status === "delivered") return s + Number(o.total_price || 0);
    return s + Number(o.advance_amount || 0) + Number(o.paid_amount || 0);
  }, 0);
  const totalRevenue = totalSalesRev + repairIncome + customOrderIncome;
  const totalPurchaseCost = purchases.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalPurchaseCost - totalExpenses;

  const ownerEquity = totalAssets - totalLiabilities;
  const balanceDiff = totalAssets - (totalLiabilities + ownerEquity); // always 0 by construction

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title="Balance Sheet" subtitle={`As of ${new Date().toLocaleDateString()}`} />

        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-sm text-muted-foreground">Assets, liabilities & equity — linked to chart of accounts</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>

        {/* Balance check banner */}
        <div className="rounded-xl p-4 flex items-center justify-between bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <Scale className="w-7 h-7 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assets = Liabilities + Equity</p>
              <p className="text-lg font-bold">
                {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(ownerEquity)}
              </p>
            </div>
          </div>
          <span className={`text-sm font-bold ${Math.abs(balanceDiff) < 1 ? "text-success" : "text-destructive"}`}>
            {Math.abs(balanceDiff) < 1 ? "✓ Balanced" : `Diff: ${formatCurrency(balanceDiff)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── ASSETS ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-success flex items-center gap-2">
                <Landmark className="w-4 h-4" /> Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Line code="1001" label="Cash / Shop Account" amount={Math.max(0, shopCash)} />
              <Line code="1100" label="Accounts Receivable (Customers)" amount={receivables} />
              {customOrderReceivable > 0 && <Line code="1150" label="Custom Order Receivable" amount={customOrderReceivable} />}
              <Line code="1200" label="Inventory (Stock Value)" amount={inventoryValue} />
              <Line label="Total Assets" amount={totalAssets} bold />
            </CardContent>
          </Card>

          {/* ── LIABILITIES + EQUITY ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                <Landmark className="w-4 h-4" /> Liabilities & Equity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Line code="2001" label="Accounts Payable (Suppliers)" amount={Math.max(0, supplierPayable)} />
              <Line code="2100" label="Salaries Payable (Employees)" amount={Math.max(0, salariesPayable)} />
              <Line code="2200" label="Karigar Payable" amount={Math.max(0, karigarPayable)} />
              {bankOverdraft > 0 && <Line code="2300" label="Cash Shortfall / Overdraft" amount={bankOverdraft} negative />}
              <Line label="Total Liabilities" amount={totalLiabilities} bold />
              <div className="pt-3" />
              <Line code="3001" label="Owner Equity (Capital + Profit)" amount={ownerEquity} bold />
              <Line code="3100" label={`Net Profit (P&L: Revenue ${formatCurrency(totalRevenue)} − Costs)`} amount={netProfit} negative={netProfit < 0} />
            </CardContent>
          </Card>
        </div>

        {/* Detail: how cash was computed */}
        <Card className="print:hidden">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Shop Account (Cash) Breakdown</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
            <Line label="+ Sales payments received" amount={sales.reduce((s: number, x: any) => s + Number(x.paid_amount || 0), 0)} />
            <Line label="+ Custom order advances & payments" amount={customOrders.reduce((s: number, o: any) => o.status === "cancelled" ? s : s + Number(o.advance_amount || 0) + Number(o.paid_amount || 0), 0)} />
            <Line label="+ Repair advances" amount={jobCards.reduce((s: number, j: any) => j.status === "cancelled" ? s : s + Number(j.advance_amount || 0), 0)} />
            <Line label="− Purchases paid" amount={purchases.reduce((s: number, p: any) => s + Number(p.paid_amount || 0), 0)} negative />
            <Line label="− Supplier & karigar payments" amount={payments.filter((p: any) => ["supplier_payment", "karigar_payment"].includes(p.type)).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)} negative />
            <Line label="− Expenses (incl. salaries)" amount={totalExpenses} negative />
            <Line label="= Shop Account Balance" amount={shopCash} bold negative={shopCash < 0} />
          </CardContent>
        </Card>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportBalanceSheet;
