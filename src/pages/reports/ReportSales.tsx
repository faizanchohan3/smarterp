import { useState, useEffect } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer, ShoppingCart, Wallet, ArrowDownCircle, FileText } from "lucide-react";

const ReportSales = () => {
  const { data: sales } = useBusinessData("sales");
  const { data: customers } = useBusinessData("customers");
  const { data: products } = useBusinessData("products");
  const { data: rates } = useBusinessData("gold_rates");
  const { shopName, ownerName, shopLogo, shopAddress, shopPhone, businessId } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemsBySale, setItemsBySale] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await (supabase.from("sale_items").select("*, sales!inner(business_id)") as any).eq("sales.business_id", businessId);
      const grouped: Record<string, any[]> = {};
      (data || []).forEach((it: any) => { (grouped[it.sale_id] ||= []).push(it); });
      setItemsBySale(grouped);
    })();
  }, [businessId]);

  const filtered = sales.filter((item: any) => {
    const date = new Date(item.created_at);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalAmount = filtered.reduce((s: number, x: any) => s + Number(x.final_amount || 0), 0);
  const totalPaid = filtered.reduce((s: number, x: any) => s + Number(x.paid_amount || 0), 0);
  const totalRemaining = totalAmount - totalPaid;

  const sortedRates = [...rates].sort((a: any, b: any) => (a.rate_date < b.rate_date ? 1 : -1));
  const latestRate = sortedRates[0];

  const getStatus = (paid: number, total: number) => {
    if (total <= 0) return "full";
    if (paid >= total) return "full";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ==================== ON-SCREEN VIEW ==================== */}
        <div className="print:hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Sales Report</h1>
              <p className="text-sm text-muted-foreground">All sales transactions</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex gap-2 items-center bg-card border rounded-lg px-3 py-1.5">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
                <span className="text-muted-foreground text-xs">→</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto h-8 text-sm border-0 p-0 focus-visible:ring-0" />
              </div>
              <Button variant="outline" className="gap-2" onClick={() => window.dispatchEvent(new Event("open-print-dialog"))}>
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Total Sales" value={formatCurrency(totalAmount)} subtitle={`${filtered.length} invoices`} icon={ShoppingCart} gradient="blue" />
            <StatCard title="Received" value={formatCurrency(totalPaid)} icon={Wallet} gradient="green" />
            <StatCard title="Remaining" value={formatCurrency(totalRemaining)} icon={ArrowDownCircle} gradient="amber" />
            <StatCard title="Invoices" value={String(filtered.length)} icon={FileText} gradient="purple" />
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Sales</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={[
                { key: "invoice_number", label: "Invoice" },
                { key: "customer_id", label: "Customer", render: (v: string) => customers.find((c: any) => c.id === v)?.name || "Walk-in" },
                { key: "id", label: "Weight (g)", render: (_: any, row: any) => {
                  const its = itemsBySale[row.id] || [];
                  const total = its.reduce((s: number, it: any) => {
                    const wg = it.weight_unit === "ratti" ? Number(it.weight) / 8 : Number(it.weight);
                    return s + wg;
                  }, 0);
                  return total > 0 ? <span className="font-medium">{total.toFixed(3)}</span> : <span className="text-muted-foreground">—</span>;
                }},
                { key: "id", label: "Making", render: (_: any, row: any) => {
                  const its = itemsBySale[row.id] || [];
                  const total = its.reduce((s: number, it: any) =>
                    s + (it.polish_unit === "pkr" ? Number(it.polish_waste || 0) : 0), 0);
                  return total > 0 ? formatCurrency(total) : <span className="text-muted-foreground">—</span>;
                }},
                { key: "final_amount", label: "Amount", render: (v: number) => formatCurrency(v) },
                { key: "paid_amount", label: "Paid", render: (v: number) => formatCurrency(v) },
                { key: "id", label: "Remaining", render: (_: any, row: any) => {
                  const rem = Number(row.final_amount) - Number(row.paid_amount);
                  return <span className={rem > 0 ? "text-destructive" : "text-success"}>{formatCurrency(rem)}</span>;
                }},
                { key: "payment_status", label: "Status", render: (_: string, row: any) => <StatusBadge status={getStatus(Number(row.paid_amount), Number(row.final_amount))} /> },
                { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
              ]} data={filtered} />
            </CardContent>
          </Card>
        </div>

        {/* ==================== PRINT-ONLY (YAQOOB-STYLE TEMPLATE) ==================== */}
        <div className="hidden print:block print-receipt-only">
          {/* Branded header — left logo+owner, center emblem, right Urdu-style red banner */}
          <div className="border-2 rounded-md overflow-hidden" style={{ borderColor: "#c0392b" }}>
            <div className="grid grid-cols-3 gap-2 p-3 items-center" style={{ background: "#fff" }}>
              {/* LEFT: Shop name + owner + phone */}
              <div className="border-r pr-3" style={{ borderColor: "#e5b8b3" }}>
                <h1 className="text-xl font-extrabold uppercase tracking-tight" style={{ color: "#c0392b", borderBottom: "2px solid #c0392b", display: "inline-block", paddingBottom: "2px" }}>
                  {shopName || "JEWELLERS"}
                </h1>
                <p className="text-[10px] mt-1" style={{ color: "#666" }}>Chief Executive</p>
                <p className="text-base font-bold" style={{ color: "#222" }}>{ownerName || "Owner"}</p>
                {shopPhone && <p className="text-sm font-semibold" style={{ color: "#222" }}>Cell: {shopPhone}</p>}
              </div>

              {/* CENTER: Logo / emblem */}
              <div className="flex items-center justify-center">
                {shopLogo ? (
                  <img src={shopLogo} alt="Logo" className="h-20 w-20 object-contain" />
                ) : (
                  <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl" style={{ background: "linear-gradient(135deg,#daa520,#b8860b)" }}>
                    {(shopName || "S")[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* RIGHT: Red banner block (replaces Urdu graphic) */}
              <div className="text-right">
                <div className="inline-block px-3 py-1 text-white font-extrabold text-lg tracking-wide" style={{ background: "#c0392b" }}>
                  {shopName ? shopName.toUpperCase() : "JEWELLERS"}
                </div>
                {shopAddress && (
                  <div className="mt-1 inline-block px-3 py-0.5 text-white text-[11px] font-semibold" style={{ background: "#e74c3c" }}>
                    {shopAddress}
                  </div>
                )}
                {shopPhone && (
                  <div className="mt-1 text-sm font-bold" style={{ color: "#c0392b" }}>{shopPhone}</div>
                )}
                <div className="mt-1 text-[10px] font-semibold" style={{ color: "#7a1a10" }}>
                  Finest Jewellery • Pure Gold & Silver
                </div>
              </div>
            </div>

            {/* Date / Gold Rate strip */}
            <div className="grid grid-cols-2 px-4 py-2 text-sm" style={{ background: "#fdecea", borderTop: "1px solid #c0392b" }}>
              <div><strong style={{ color: "#c0392b" }}>Date:</strong> {new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })} {dateFrom && `(From: ${dateFrom})`} {dateTo && `(To: ${dateTo})`}</div>
              <div className="text-right">
                <strong style={{ color: "#c0392b" }}>Gold Rate / Tola:</strong>{" "}
                {latestRate ? `24K ${formatCurrency(latestRate.tola_24k)} • 22K ${formatCurrency(latestRate.tola_22k)}` : "—"}
              </div>
            </div>
          </div>

          {/* Report title */}
          <div className="text-center my-3">
            <h2 className="text-lg font-extrabold uppercase tracking-widest inline-block px-6 py-1 text-white" style={{ background: "#c0392b" }}>
              Sales Report
            </h2>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 mb-3 text-xs text-center">
            <div className="border rounded p-2" style={{ borderColor: "#c0392b" }}><div className="font-semibold" style={{ color: "#c0392b" }}>Total Sales</div><div className="font-bold">{formatCurrency(totalAmount)}</div></div>
            <div className="border rounded p-2" style={{ borderColor: "#c0392b" }}><div className="font-semibold" style={{ color: "#c0392b" }}>Received</div><div className="font-bold">{formatCurrency(totalPaid)}</div></div>
            <div className="border rounded p-2" style={{ borderColor: "#c0392b" }}><div className="font-semibold" style={{ color: "#c0392b" }}>Remaining</div><div className="font-bold">{formatCurrency(totalRemaining)}</div></div>
            <div className="border rounded p-2" style={{ borderColor: "#c0392b" }}><div className="font-semibold" style={{ color: "#c0392b" }}>Invoices</div><div className="font-bold">{filtered.length}</div></div>
          </div>

          {/* Centered data table */}
          <div className="mx-auto" style={{ maxWidth: "100%" }}>
            <table className="w-full text-xs border-collapse" style={{ border: "1px solid #c0392b" }}>
              <thead>
                <tr style={{ background: "#c0392b", color: "#fff" }}>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Invoice</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Particulars</th>
                  <th className="p-2 text-center">Wt (g)</th>
                  <th className="p-2 text-right">Making</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Remaining</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="text-center p-4 text-muted-foreground">No sales found</td></tr>
                ) : filtered.map((s: any, i: number) => {
                  const rem = Number(s.final_amount) - Number(s.paid_amount);
                  const cleared = rem <= 0;
                  const its = itemsBySale[s.id] || [];
                  const RATTI_PER_G = 8;
                  const totalWg = its.reduce((sum: number, it: any) => {
                    const wg = it.weight_unit === "ratti" ? Number(it.weight) / RATTI_PER_G : Number(it.weight);
                    return sum + wg;
                  }, 0);
                  const totalMc = its.reduce((sum: number, it: any) =>
                    sum + (it.polish_unit === "pkr" ? Number(it.polish_waste || 0) : 0), 0);
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#fdecea" }}>
                      <td className="p-2 border-t" style={{ borderColor: "#f1b7b1" }}>{i + 1}</td>
                      <td className="p-2 border-t font-semibold" style={{ borderColor: "#f1b7b1" }}>{s.invoice_number}</td>
                      <td className="p-2 border-t" style={{ borderColor: "#f1b7b1" }}>{customers.find((c: any) => c.id === s.customer_id)?.name || "Walk-in"}</td>
                      <td className="p-2 border-t" style={{ borderColor: "#f1b7b1" }}>
                        <div className="flex flex-col gap-0.5">
                          {its.map((it: any) => (
                            <div key={it.id} className="text-[10px] leading-tight">
                              <span className="font-medium">{it.product_name}</span>
                              {Number(it.quantity) > 1 && <span className="text-gray-500"> ×{it.quantity}</span>}
                              {Number(it.weight) > 0 && (
                                <span className="text-gray-500"> · {it.weight_unit === "ratti"
                                  ? (Number(it.weight) / RATTI_PER_G).toFixed(3)
                                  : Number(it.weight).toFixed(3)}g</span>
                              )}
                              {it.polish_unit === "pkr" && Number(it.polish_waste) > 0 && (
                                <span className="text-gray-500"> · Mkng: {Number(it.polish_waste).toLocaleString()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border-t text-center" style={{ borderColor: "#f1b7b1" }}>
                        {totalWg > 0 ? totalWg.toFixed(3) : "—"}
                      </td>
                      <td className="p-2 border-t text-right" style={{ borderColor: "#f1b7b1" }}>
                        {totalMc > 0 ? totalMc.toLocaleString() : "—"}
                      </td>
                      <td className="p-2 border-t" style={{ borderColor: "#f1b7b1" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="p-2 border-t text-right" style={{ borderColor: "#f1b7b1" }}>{formatCurrency(s.final_amount)}</td>
                      <td className="p-2 border-t text-right" style={{ borderColor: "#f1b7b1" }}>{formatCurrency(s.paid_amount)}</td>
                      <td className="p-2 border-t text-right font-semibold" style={{ borderColor: "#f1b7b1", color: cleared ? "#15803d" : "#c0392b" }}>{formatCurrency(Math.max(0, rem))}</td>
                      <td className="p-2 border-t text-center capitalize" style={{ borderColor: "#f1b7b1" }}>{getStatus(Number(s.paid_amount), Number(s.final_amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#fdecea", fontWeight: 700 }}>
                  <td colSpan={4} className="p-2 text-right" style={{ borderTop: "2px solid #c0392b", color: "#c0392b" }}>TOTALS</td>
                  <td className="p-2 text-center" style={{ borderTop: "2px solid #c0392b" }}>
                    {Object.values(itemsBySale).flat().reduce((sum: number, it: any) => {
                      const wg = it.weight_unit === "ratti" ? Number(it.weight) / 8 : Number(it.weight);
                      return sum + wg;
                    }, 0).toFixed(3)}g
                  </td>
                  <td className="p-2 text-right" style={{ borderTop: "2px solid #c0392b" }}>
                    {Object.values(itemsBySale).flat().reduce((sum: number, it: any) =>
                      sum + (it.polish_unit === "pkr" ? Number(it.polish_waste || 0) : 0), 0).toLocaleString()}
                  </td>
                  <td className="p-2" style={{ borderTop: "2px solid #c0392b" }}></td>
                  <td className="p-2 text-right" style={{ borderTop: "2px solid #c0392b" }}>{formatCurrency(totalAmount)}</td>
                  <td className="p-2 text-right" style={{ borderTop: "2px solid #c0392b" }}>{formatCurrency(totalPaid)}</td>
                  <td className="p-2 text-right" style={{ borderTop: "2px solid #c0392b", color: "#c0392b" }}>{formatCurrency(totalRemaining)}</td>
                  <td style={{ borderTop: "2px solid #c0392b" }}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature footer */}
          <div className="mt-10 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="border-t-2 pt-1" style={{ borderColor: "#222" }}>Customer Signature</div>
            </div>
            <div className="text-right">
              <div className="border-t-2 pt-1 inline-block px-8" style={{ borderColor: "#222" }}>Authorized Signature</div>
            </div>
          </div>

          {/* Bottom red strip — terms placeholder */}
          <div className="mt-6 text-white text-[10px] font-semibold px-3 py-2 text-center" style={{ background: "linear-gradient(90deg,#c0392b,#e67e22,#c0392b)" }}>
            Rates fluctuate as per market • Promised delivery dates are subject to availability • All disputes within shop jurisdiction
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportSales;
