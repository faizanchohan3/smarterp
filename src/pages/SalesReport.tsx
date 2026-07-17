import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { Printer, Download } from "lucide-react";

const SalesReport = () => {
  const { shopName, ownerName, shopPhone, shopAddress, shopLogo, businessId } = useAuth();
  const { data: sales } = useBusinessData("sales");
  const { data: customers } = useBusinessData("customers");
  const { data: goldRates } = useBusinessData("gold_rates" as any);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const latestRate = [...goldRates]
    .sort((a: any, b: any) => (a.rate_date < b.rate_date ? 1 : -1))[0];

  const filterByDate = (items: any[]) =>
    items.filter((item: any) => {
      const date = new Date(item.created_at);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });

  const filteredSales = filterByDate(sales);

  const totalSales = filteredSales.reduce((s: number, x: any) => s + Number(x.final_amount), 0);
  const totalReceived = filteredSales.reduce((s: number, x: any) => s + Number(x.paid_amount), 0);
  const totalPending = totalSales - totalReceived;
  const totalTransactions = filteredSales.length;

  const getCustomerName = (customerId: string) => {
    if (!customerId) return "Walk-in Customer";
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const getPaymentStatus = (paid: number, total: number) => {
    if (total <= 0) return "N/A";
    if (paid >= total) return "Paid";
    if (paid > 0) return "Partial";
    return "Unpaid";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <ReportHeader title="Sales Report" subtitle="Complete Sales Transactions Summary" />

        {/* Filters */}
        <Card className="print:hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}
                  className="flex-1 gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Total Sales</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalSales)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Total Received</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Transactions</p>
              <p className="text-xl font-bold text-blue-600">{totalTransactions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table - Screen View */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Sales Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-amber-900">
                    <th className="text-left p-3 font-semibold text-amber-900">Invoice #</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Date</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Customer</th>
                    <th className="text-right p-3 font-semibold text-amber-900">Amount</th>
                    <th className="text-right p-3 font-semibold text-amber-900">Received</th>
                    <th className="text-right p-3 font-semibold text-amber-900">Pending</th>
                    <th className="text-left p-3 font-semibold text-amber-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale: any) => (
                    <tr key={sale.id} className="border-b hover:bg-amber-50">
                      <td className="p-3 font-medium text-amber-900">{sale.invoice_number}</td>
                      <td className="p-3">{new Date(sale.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{getCustomerName(sale.customer_id)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(sale.final_amount)}</td>
                      <td className="p-3 text-right text-green-600 font-semibold">{formatCurrency(sale.paid_amount)}</td>
                      <td className="p-3 text-right text-red-600 font-semibold">
                        {formatCurrency(Number(sale.final_amount) - Number(sale.paid_amount))}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          getPaymentStatus(sale.paid_amount, sale.final_amount) === "Paid" ? "bg-green-100 text-green-700" :
                          getPaymentStatus(sale.paid_amount, sale.final_amount) === "Partial" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {getPaymentStatus(sale.paid_amount, sale.final_amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Print View */}
        <div className="hidden print:block bg-white border-4 border-amber-900"
          style={{ fontFamily: "'Times New Roman', serif", padding: "28px 36px", maxWidth: "100%", margin: "0" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", borderBottom: "3px double #7a1a1a", paddingBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {shopLogo && (
                <img src={shopLogo} alt="logo" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
              )}
              <div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#7a1a1a", lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {shopName || "Jewellers"}
                </div>
                {ownerName && (
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#7a1a1a", marginTop: "4px" }}>{ownerName}</div>
                )}
                {shopPhone && (
                  <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>Cell: {shopPhone}</div>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {shopAddress && (
                <div style={{ fontSize: "12px", color: "#333", marginBottom: "4px" }}>{shopAddress}</div>
              )}
              {shopPhone && (
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#7a1a1a" }}>{shopPhone}</div>
              )}
            </div>
          </div>

          {/* Report Title */}
          <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2px solid #7a1a1a" }}>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#7a1a1a", textTransform: "uppercase", letterSpacing: "1px" }}>
              SALES REPORT
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `As of ${new Date().toLocaleDateString("en-PK")}`}
            </div>
            {latestRate && (
              <div style={{ fontSize: "11px", color: "#7a1a1a", marginTop: "4px" }}>
                Gold Rate (24K): PKR {Number(latestRate.tola_24k).toLocaleString("en-PK")} / Tola
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "16px", fontSize: "11px" }}>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
              <div style={{ color: "#666", fontSize: "10px", marginBottom: "4px" }}>Total Sales</div>
              <div style={{ fontWeight: "bold", color: "#7a1a1a" }}>{formatCurrency(totalSales)}</div>
            </div>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
              <div style={{ color: "#666", fontSize: "10px", marginBottom: "4px" }}>Received</div>
              <div style={{ fontWeight: "bold", color: "#007a00" }}>{formatCurrency(totalReceived)}</div>
            </div>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
              <div style={{ color: "#666", fontSize: "10px", marginBottom: "4px" }}>Pending</div>
              <div style={{ fontWeight: "bold", color: "#7a0000" }}>{formatCurrency(totalPending)}</div>
            </div>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
              <div style={{ color: "#666", fontSize: "10px", marginBottom: "4px" }}>Transactions</div>
              <div style={{ fontWeight: "bold", color: "#7a1a1a" }}>{totalTransactions}</div>
            </div>
          </div>

          {/* Sales Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ backgroundColor: "#7a1a1a", color: "#fff" }}>
                <th style={{ textAlign: "left", padding: "6px", borderRight: "1px solid #666" }}>Invoice</th>
                <th style={{ textAlign: "left", padding: "6px", borderRight: "1px solid #666" }}>Date</th>
                <th style={{ textAlign: "left", padding: "6px", borderRight: "1px solid #666" }}>Customer</th>
                <th style={{ textAlign: "right", padding: "6px", borderRight: "1px solid #666" }}>Amount</th>
                <th style={{ textAlign: "right", padding: "6px", borderRight: "1px solid #666" }}>Received</th>
                <th style={{ textAlign: "right", padding: "6px", borderRight: "1px solid #666" }}>Pending</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale: any) => (
                <tr key={sale.id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd", fontWeight: "bold", color: "#7a1a1a" }}>
                    {sale.invoice_number}
                  </td>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd" }}>
                    {new Date(sale.created_at).toLocaleDateString("en-PK")}
                  </td>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd" }}>
                    {getCustomerName(sale.customer_id)}
                  </td>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(sale.final_amount)}
                  </td>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd", textAlign: "right", color: "#007a00", fontWeight: "bold" }}>
                    {formatCurrency(sale.paid_amount)}
                  </td>
                  <td style={{ padding: "6px", borderRight: "1px solid #ddd", textAlign: "right", color: "#7a0000", fontWeight: "bold" }}>
                    {formatCurrency(Number(sale.final_amount) - Number(sale.paid_amount))}
                  </td>
                  <td style={{ padding: "6px", textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
                    {getPaymentStatus(sale.paid_amount, sale.final_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Notes */}
          <div style={{ borderTop: "2px solid #ccc", paddingTop: "12px", marginBottom: "12px", fontSize: "10px", color: "#666" }}>
            <p style={{ margin: "0 0 4px 0" }}>• Generated by SmartERP | {new Date().toLocaleString("en-PK")}</p>
            <p style={{ margin: "0 0 4px 0" }}>• Payment Status: Paid = Fully Received | Partial = Partially Received | Unpaid = No Payment</p>
          </div>

          {/* Footer Bands */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ height: "8px", backgroundColor: "#b91c1c" }}></div>
            <div style={{ height: "8px", backgroundImage: "linear-gradient(to right, #f97316, #eab308)" }}></div>
          </div>
        </div>

        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default SalesReport;
