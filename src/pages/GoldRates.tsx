import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Plus, Printer, Coins, TrendingUp, Calendar } from "lucide-react";
import { tolaRateForKarat } from "@/lib/gold";

const GoldRates = () => {
  const { businessId } = useAuth();
  const { data: rates, fetch, remove } = useBusinessData("gold_rates" as any);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    rate_date: new Date().toISOString().slice(0, 10),
    rate_time: new Date().toTimeString().slice(0, 5),
    rate_type: "morning",
    tola_24k: "",
    tola_22k: "",
    tola_18k: "",
    silver_tola: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!businessId) return;
    const tola24kRate = parseFloat(form.tola_24k) || 0;
    const { error } = await (supabase.from("gold_rates" as any) as any).insert({
      business_id: businessId,
      rate_date: form.rate_date,
      rate_time: form.rate_time || null,
      rate_type: form.rate_type,
      tola_rate: tola24kRate,
      gram_rate: tola24kRate / 11.664,
      tola_24k: tola24kRate,
      tola_22k: parseFloat(form.tola_22k) || 0,
      tola_18k: parseFloat(form.tola_18k) || 0,
      silver_tola: parseFloat(form.silver_tola) || 0,
      notes: form.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Gold rate saved" });
    setOpen(false);
    setForm({ rate_date: new Date().toISOString().slice(0, 10), rate_time: new Date().toTimeString().slice(0, 5), rate_type: "morning", tola_24k: "", tola_22k: "", tola_18k: "", silver_tola: "", notes: "" });
    fetch();
    window.dispatchEvent(new Event("gold-rate-updated"));
  };

  const sorted = [...rates].sort((a: any, b: any) => (a.rate_date < b.rate_date ? 1 : -1));
  const latest = sorted[0];

  const columns = [
    { key: "rate_date", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "rate_time", label: "Time", render: (v: string) => v ? v.slice(0, 5) : "-" },
    { key: "rate_type", label: "Type", render: (v: string) => v?.charAt(0).toUpperCase() + v?.slice(1) },
    { key: "tola_24k", label: "24K / Tola", render: (v: number) => formatCurrency(v) },
    { key: "tola_22k", label: "22K / Tola", render: (v: number) => formatCurrency(v) },
    { key: "tola_18k", label: "18K / Tola", render: (v: number) => formatCurrency(v) },
    { key: "silver_tola", label: "Silver / Tola", render: (v: number) => formatCurrency(v) },
    { key: "notes", label: "Notes", render: (v: string) => v || "-" },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in print-receipt-only">
        <ReportHeader title="Gold Rates Report" subtitle="Daily gold & silver tola rates" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Gold Rates</h1>
            <p className="text-sm text-muted-foreground">Daily gold & silver tola rates</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Rate</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Gold Rate</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Date</label>
                      <Input type="date" value={form.rate_date} onChange={e => setForm({ ...form, rate_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Time</label>
                      <Input type="time" value={form.rate_time} onChange={e => setForm({ ...form, rate_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Rate Type</label>
                    <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.rate_type} onChange={e => setForm({ ...form, rate_type: e.target.value })}>
                      <option value="morning">Morning (6am-12pm)</option>
                      <option value="afternoon">Afternoon (12pm-6pm)</option>
                      <option value="evening">Evening (6pm-12am)</option>
                      <option value="night">Night (12am-6am)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs">24K / Tola</label><Input type="number" value={form.tola_24k} onChange={e => {
                      const v = e.target.value;
                      const n = parseFloat(v) || 0;
                      setForm({
                        ...form,
                        tola_24k: v,
                        tola_22k: n > 0 ? String(tolaRateForKarat(n, 22)) : form.tola_22k,
                        tola_18k: n > 0 ? String(tolaRateForKarat(n, 18)) : form.tola_18k,
                      });
                    }} /></div>
                    <div><label className="text-xs">22K / Tola</label><Input type="number" value={form.tola_22k} onChange={e => setForm({ ...form, tola_22k: e.target.value })} /></div>
                    <div><label className="text-xs">18K / Tola</label><Input type="number" value={form.tola_18k} onChange={e => setForm({ ...form, tola_18k: e.target.value })} /></div>
                    <div className="col-span-2"><label className="text-xs">Silver / Tola</label><Input type="number" value={form.silver_tola} onChange={e => setForm({ ...form, silver_tola: e.target.value })} /></div>
                  </div>
                  <Input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  <Button className="w-full" onClick={handleSubmit}>Save Rate</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Latest 24K" value={latest ? formatCurrency(latest.tola_24k) : "-"} subtitle="per tola" icon={Coins} gradient="amber" />
          <StatCard title="Latest 22K" value={latest ? formatCurrency(latest.tola_22k) : "-"} subtitle="per tola" icon={TrendingUp} gradient="green" />
          <StatCard title="Latest Silver" value={latest ? formatCurrency(latest.silver_tola) : "-"} subtitle="per tola" icon={Coins} gradient="blue" />
          <StatCard title="Records" value={String(rates.length)} icon={Calendar} gradient="purple" />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Rate History</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={sorted} onDelete={(row) => remove(row.id)} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default GoldRates;
