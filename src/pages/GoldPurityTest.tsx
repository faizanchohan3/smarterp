import { useState, useEffect } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlaskConical, Sparkles, AlertCircle, Printer, Download, CheckCircle2, Zap } from "lucide-react";

const TOLA_TO_GRAM = 11.664;

// ─── Calibrated density → karat lookup table ────────────────────────────────
// Do NOT use linear formula — gold alloys vary; use nearest-match lookup only.
const KARAT_TABLE = [
  { density: 6.5,  karat: 6  },
  { density: 7.0,  karat: 8  },
  { density: 8.0,  karat: 10 },
  { density: 9.0,  karat: 12 },
  { density: 10.5, karat: 14 },
  { density: 12.0, karat: 16 },
  { density: 14.0, karat: 18 },
  { density: 16.5, karat: 20 },
  { density: 17.5, karat: 22 },
  { density: 19.3, karat: 24 },
];

const nearestKarat = (density: number) =>
  KARAT_TABLE.reduce((best, entry) =>
    Math.abs(density - entry.density) < Math.abs(density - best.density) ? entry : best
  );

const purityColor = (k: number) => k >= 20 ? "text-green-600" : k >= 14 ? "text-yellow-600" : "text-red-600";
const purityBorderBg = (k: number) =>
  k >= 20 ? "border-green-300 bg-green-50 dark:bg-green-950/20" :
  k >= 14 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" :
  "border-red-300 bg-red-50 dark:bg-red-950/20";
const purityBadge = (k: number) =>
  k >= 20 ? "bg-green-100 text-green-800 ring-green-400" :
  k >= 14 ? "bg-yellow-100 text-yellow-800 ring-yellow-400" :
  "bg-red-100 text-red-800 ring-red-400";
const purityLabel = (k: number) => k >= 20 ? "High Purity" : k >= 14 ? "Medium Purity" : "Low Purity";

interface TestResult {
  invoiceNo: string;
  dateTime: string;
  productName: string;
  customerName: string;
  w1: number;
  w2: number;
  density: number;
  karat: number;
  purityPct: number;
  pureWeight: number;
  goldRate: number;
  goldValue: number;
}

const GoldPurityTest = () => {
  const { data: goldRates } = useBusinessData("gold_rates");
  const { shopName, ownerName, shopLogo, shopAddress, shopPhone } = useAuth();
  const [productName, setProductName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [autoRateDate, setAutoRateDate] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");

  // Auto-fill rate from the latest gold_rates record (tola_24k ÷ 11.664 = per gram)
  useEffect(() => {
    if (!goldRates || goldRates.length === 0) return;
    const latest = [...goldRates].sort((a: any, b: any) =>
      a.rate_date < b.rate_date ? 1 : -1
    )[0];
    if (latest?.tola_24k) {
      const perGram = Number((Number(latest.tola_24k) / TOLA_TO_GRAM).toFixed(2));
      setGoldRate(String(perGram));
      setAutoRateDate(latest.rate_date);
    }
  }, [goldRates]);

  const calculate = () => {
    setError("");
    const wa = parseFloat(w1);
    const ww = parseFloat(w2);
    const rate = parseFloat(goldRate);

    if (!productName.trim()) { setError("Product Name is required."); return; }
    if (!wa || isNaN(wa)) { setError("Enter a valid Weight in Air (W1)."); return; }
    if (!ww || isNaN(ww)) { setError("Enter a valid Weight in Water (W2)."); return; }
    if (wa <= ww) { setError("Weight in Air must be greater than Weight in Water."); return; }
    if (!rate || rate <= 0) { setError("Enter a valid 24K Gold Rate per gram (or add today's rate in the Gold Rates module)."); return; }

    const density = wa / (wa - ww);
    const { karat } = nearestKarat(density);
    const purityPct = Number(((karat / 24) * 100).toFixed(2));
    const pureWeight = Number((wa * (purityPct / 100)).toFixed(4));
    const goldValue = Number((pureWeight * rate).toFixed(2));

    setResult({
      invoiceNo: `GP-${Date.now().toString(36).toUpperCase()}`,
      dateTime: new Date().toLocaleString("en-PK", { dateStyle: "full", timeStyle: "medium" }),
      productName: productName.trim(),
      customerName: customerName.trim() || "Walk-in Customer",
      w1: wa, w2: ww,
      density: Number(density.toFixed(4)),
      karat, purityPct, pureWeight,
      goldRate: rate, goldValue,
    });
  };

  return (
    <AppLayout>
      {/* ─── Screen UI (hidden when printing) ──────────────────────────────── */}
      <div className="space-y-6 animate-fade-in max-w-4xl print:hidden">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <FlaskConical className="w-6 h-6 text-amber-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gold Purity Test</h1>
            <p className="text-sm text-muted-foreground">
              Archimedes water displacement — calibrated karat lookup table
            </p>
          </div>
        </div>

        {/* Input form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Test Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Gold Ring, Necklace" value={productName}
                  onChange={e => setProductName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Name</Label>
                <Input placeholder="Optional" value={customerName}
                  onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Weight in Air — W1 (grams) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.001" placeholder="e.g. 11.664" value={w1}
                  onChange={e => setW1(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Weight in Water — W2 (grams) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.001" placeholder="e.g. 11.024" value={w2}
                  onChange={e => setW2(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Current 24K Gold Rate per gram <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type="number" step="0.01" placeholder="e.g. 7500" value={goldRate}
                    onChange={e => { setGoldRate(e.target.value); setAutoRateDate(""); }} />
                  {autoRateDate && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-amber-600 font-medium pointer-events-none">
                      <Zap className="w-3 h-3" />
                      Auto · {new Date(autoRateDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {autoRateDate && (
                  <p className="text-xs text-muted-foreground">
                    Fetched from Gold Rates module (24K tola ÷ 11.664). Edit to override.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={calculate} className="w-full sm:w-auto gap-2">
              <Sparkles className="w-4 h-4" /> Calculate Purity
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <>
            {/* Purity banner */}
            <div className={`rounded-xl border-2 p-6 ${purityBorderBg(result.karat)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Density</p>
                    <p className="text-3xl font-bold">{result.density}</p>
                    <p className="text-xs text-muted-foreground">g/cm³</p>
                  </div>
                  <div className="w-px h-14 bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Estimated Karat</p>
                    <p className={`text-5xl font-black ${purityColor(result.karat)}`}>{result.karat}K</p>
                  </div>
                  <div className="w-px h-14 bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Purity</p>
                    <p className={`text-3xl font-bold ${purityColor(result.karat)}`}>{result.purityPct}%</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ring-1 ${purityBadge(result.karat)}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {purityLabel(result.karat)}
                  </span>
                  <p className="text-xs text-muted-foreground">Purity = ({result.karat}/24) × 100</p>
                </div>
              </div>
            </div>

            {/* Value breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Pure Gold Weight</p>
                  <p className="text-2xl font-bold">{result.pureWeight} g</p>
                  <p className="text-xs text-muted-foreground">{result.w1}g × {result.purityPct}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">24K Rate / gram</p>
                  <p className="text-2xl font-bold">{result.goldRate.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20">
                <CardContent className="pt-5 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Estimated Gold Value</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {result.goldValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.pureWeight}g × {result.goldRate}</p>
                </CardContent>
              </Card>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" /> Print Invoice
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>

            {/* Karat reference table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Density → Karat Reference Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {KARAT_TABLE.map(entry => {
                    const active = entry.karat === result.karat;
                    return (
                      <div key={entry.karat}
                        className={`rounded-lg p-2 text-center border transition-all ${
                          active
                            ? "ring-2 ring-primary border-primary bg-primary/10 scale-110 shadow-md"
                            : "bg-muted/30 border-transparent"
                        }`}>
                        <p className={`text-sm font-bold ${purityColor(entry.karat)}`}>{entry.karat}K</p>
                        <p className="text-xs text-muted-foreground">{entry.density}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Highlighted cell = matched karat for density {result.density}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─── PRINTABLE INVOICE (hidden on screen, shown only when printing) ── */}
      {result && (
        <div className="hidden print:block w-full bg-white text-black"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif", padding: "36px 48px", maxWidth: "680px", margin: "0 auto" }}>

          {/* ── Shop / Laboratory Header ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: "16px",
            borderBottom: "3px solid #b8860b", paddingBottom: "16px", marginBottom: "20px",
          }}>
            {shopLogo ? (
              <img src={shopLogo} alt="logo" style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "2px solid #b8860b" }} />
            ) : (
              <div style={{
                width: "64px", height: "64px", borderRadius: "8px", flexShrink: 0,
                background: "linear-gradient(135deg,#f6c453,#b8860b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "26px", fontWeight: "bold", color: "#3a2a05",
              }}>
                {(shopName || ownerName || "G")[0]?.toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#3a2a05", letterSpacing: "0.5px" }}>
                {shopName || ownerName || "Gold Laboratory"}
              </div>
              <div style={{ fontSize: "13px", color: "#b8860b", fontWeight: "600", marginTop: "2px" }}>
                Gold Purity Laboratory
              </div>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                {shopAddress && <span>📍 {shopAddress}</span>}
                {shopAddress && shopPhone && <span style={{ margin: "0 8px" }}>|</span>}
                {shopPhone && <span>📞 {shopPhone}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                background: "linear-gradient(135deg,#f6c453,#b8860b)",
                color: "#3a2a05", borderRadius: "8px", padding: "6px 14px",
                fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px",
              }}>CERTIFICATE</div>
            </div>
          </div>

          {/* ── Title bar ── */}
          <div style={{
            background: "linear-gradient(90deg,#b8860b,#daa520,#b8860b)",
            color: "#fff8e7", textAlign: "center",
            padding: "10px 0", borderRadius: "6px",
            fontSize: "15px", fontWeight: "bold", letterSpacing: "2px",
            marginBottom: "20px",
          }}>
            GOLD PURITY TEST CERTIFICATE
          </div>

          {/* ── Invoice meta ── */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "20px", lineHeight: "1.9" }}>
            <div>
              <div><strong>Invoice No:</strong> {result.invoiceNo}</div>
              <div><strong>Date &amp; Time:</strong> {result.dateTime}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><strong>Customer:</strong> {result.customerName}</div>
              <div><strong>Product / Item:</strong> {result.productName}</div>
            </div>
          </div>

          {/* ── Main results table ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "20px" }}>
            <thead>
              <tr style={{ background: "#f5f0e8" }}>
                <th style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "left", color: "#5a420a" }}>Description</th>
                <th style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "right", color: "#5a420a" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "#fff" }}>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", fontWeight: "600" }}>Total Weight</td>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "right" }}>{result.w1} grams</td>
              </tr>
              <tr style={{ background: "#fafaf7" }}>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", fontWeight: "600" }}>Estimated Karat</td>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "right",
                  color: result.karat >= 20 ? "#16a34a" : result.karat >= 14 ? "#ca8a04" : "#dc2626",
                  fontWeight: "700", fontSize: "15px",
                }}>
                  {result.karat}K &nbsp;({result.purityPct}% pure)
                </td>
              </tr>
              <tr style={{ background: "#fff" }}>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", fontWeight: "600" }}>Pure Karat Weight</td>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "right" }}>{result.pureWeight} grams</td>
              </tr>
              <tr style={{ background: "#fafaf7" }}>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", fontWeight: "600" }}>24K Gold Rate</td>
                <td style={{ border: "1px solid #ccc", padding: "9px 14px", textAlign: "right" }}>
                  {result.goldRate.toLocaleString()} per gram
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: "linear-gradient(90deg,#fff8e7,#fde9b9)" }}>
                <td style={{ border: "2px solid #b8860b", padding: "12px 14px", fontWeight: "800", fontSize: "15px", color: "#3a2a05" }}>
                  TOTAL PAYMENT
                </td>
                <td style={{ border: "2px solid #b8860b", padding: "12px 14px", textAlign: "right", fontWeight: "800", fontSize: "18px", color: "#b8860b" }}>
                  {result.goldValue.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── Purity verdict badge ── */}
          <div style={{
            border: `2px solid ${result.karat >= 20 ? "#16a34a" : result.karat >= 14 ? "#ca8a04" : "#dc2626"}`,
            borderRadius: "6px", padding: "10px 16px", textAlign: "center",
            backgroundColor: result.karat >= 20 ? "#f0fdf4" : result.karat >= 14 ? "#fefce8" : "#fef2f2",
            marginBottom: "20px", fontSize: "13px", color: "#333",
          }}>
            Purity Grade: <strong>{result.karat}K</strong> &nbsp;·&nbsp;
            {result.purityPct}% Pure Gold &nbsp;·&nbsp;
            <strong>{purityLabel(result.karat).toUpperCase()}</strong>
          </div>

          {/* ── Note ── */}
          <p style={{ fontSize: "10.5px", color: "#888", borderTop: "1px solid #e5e5e5", paddingTop: "10px", lineHeight: "1.6", marginBottom: "30px", fontStyle: "italic" }}>
            This certificate is issued based on the Archimedes specific gravity method using a calibrated karat lookup table.
            Results are estimates for reference only and should be confirmed by assay for commercial transactions.
          </p>

          {/* ── Signatures ── */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: "180px", marginBottom: "6px", marginTop: "36px" }} />
              <div style={{ fontWeight: "600" }}>Lab Officer / Tested By</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #333", width: "180px", marginBottom: "6px", marginTop: "36px" }} />
              <div style={{ fontWeight: "600" }}>Customer Signature</div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default GoldPurityTest;
