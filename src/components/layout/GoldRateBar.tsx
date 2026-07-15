import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Coins, X, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatRateTime } from "@/lib/gold";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gold-rate-bar-hidden";

const GoldRateBar = () => {
  const { businessId } = useAuth();
  const [rate, setRate] = useState<any>(null);
  const [hidden, setHidden] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === "1");

  const fetchLatest = async () => {
    if (!businessId) return;
    const { data } = await (supabase.from("gold_rates" as any) as any)
      .select("*")
      .eq("business_id", businessId)
      .order("rate_date", { ascending: false })
      .order("rate_time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length) setRate(data[0]);
  };

  useEffect(() => {
    fetchLatest();
    const handler = () => fetchLatest();
    window.addEventListener("gold-rate-updated", handler);
    return () => window.removeEventListener("gold-rate-updated", handler);
  }, [businessId]);

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  };

  if (hidden) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-2 rounded-full shadow-lg print:hidden hover:scale-105 transition"
        title="Show Gold Rate"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="sticky top-0 z-30 print:hidden bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-amber-950 border-b border-amber-700 shadow">
      <div className="px-3 py-1.5 flex items-center gap-3 text-xs sm:text-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 font-bold whitespace-nowrap">
          <Coins className="w-4 h-4" /> TODAY'S GOLD RATE
        </div>
        {rate ? (
          <div className="flex items-center gap-3 font-semibold whitespace-nowrap">
            <span className="bg-white/30 px-2 py-0.5 rounded">24K: {formatCurrency(rate.tola_24k)}/tola</span>
            <span className="bg-white/30 px-2 py-0.5 rounded">22K: {formatCurrency(rate.tola_22k)}/tola</span>
            <span className="bg-white/30 px-2 py-0.5 rounded hidden sm:inline">21K: {formatCurrency(rate.tola_21k)}/tola</span>
            <span className="bg-white/30 px-2 py-0.5 rounded hidden md:inline">18K: {formatCurrency(rate.tola_18k)}/tola</span>
            <span className="bg-white/30 px-2 py-0.5 rounded hidden lg:inline">Silver: {formatCurrency(rate.silver_tola)}/tola</span>
            <span className="text-amber-900/70 hidden sm:inline">
              (Updated: {new Date(rate.rate_date).toLocaleDateString()}{rate.rate_time ? ` ${formatRateTime(rate.rate_time)}` : ""}{rate.rate_type ? ` — ${rate.rate_type}` : ""})
            </span>
          </div>
        ) : (
          <span className="italic opacity-80">No rates yet — add from Gold Rates page</span>
        )}
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 hover:bg-white/30 text-amber-950" onClick={toggle} title="Hide">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default GoldRateBar;
