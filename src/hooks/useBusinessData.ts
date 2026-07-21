import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isJwtExpired } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type TableName = "customers" | "suppliers" | "employees" | "categories" | "products" | "sales" | "purchases" | "expenses" | "payments" | "ledger_entries" | "salaries" | "sale_items" | "purchase_items" | "gold_rates" | "chart_of_accounts" | "karigars" | "job_cards" | "custom_orders" | "customer_ledger" | "employee_ledger" | "karigar_ledger";

// After a long-idle tab, the access token can expire before Supabase's
// background auto-refresh catches up. Rather than surface a raw "JWT
// expired" toast, try one silent session refresh + retry; if the session
// is truly dead, sign out so the user gets a clean login screen instead.
const withJwtRetry = async <T,>(run: () => Promise<{ data: T; error: any }>): Promise<{ data: T; error: any }> => {
  const result = await run();
  if (result.error && isJwtExpired(result.error)) {
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (!refreshErr) return run();
    await supabase.auth.signOut();
  }
  return result;
};

export function useBusinessData(table: TableName) {
  const { businessId } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data: rows, error } = await withJwtRetry(() => (supabase
      .from(table)
      .select("*") as any)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }));

    if (error) {
      if (!isJwtExpired(error)) toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setData(rows || []);
    }
    setLoading(false);
  }, [businessId, table]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (record: Record<string, any>) => {
    const { error } = await withJwtRetry(() => (supabase.from(table) as any).insert({ ...record, business_id: businessId }));
    if (error) {
      if (!isJwtExpired(error)) toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Created successfully" });
    await fetchData();
    return true;
  };

  const update = async (id: string, record: Record<string, any>) => {
    const { error } = await withJwtRetry(() => (supabase.from(table) as any).update(record).eq("id", id));
    if (error) {
      if (!isJwtExpired(error)) toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Updated successfully" });
    await fetchData();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await withJwtRetry(() => (supabase.from(table) as any).delete().eq("id", id));
    if (error) {
      if (!isJwtExpired(error)) toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Deleted successfully" });
    await fetchData();
    return true;
  };

  return { data, loading, fetch: fetchData, create, update, remove };
}
