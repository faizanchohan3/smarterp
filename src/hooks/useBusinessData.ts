import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type TableName = "customers" | "suppliers" | "employees" | "categories" | "products" | "sales" | "purchases" | "expenses" | "payments" | "ledger_entries" | "salaries" | "sale_items" | "purchase_items" | "gold_rates" | "chart_of_accounts" | "karigars" | "job_cards" | "custom_orders" | "customer_ledger" | "employee_ledger" | "karigar_ledger";

export function useBusinessData(table: TableName) {
  const { businessId } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data: rows, error } = await (supabase
      .from(table)
      .select("*") as any)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setData(rows || []);
    }
    setLoading(false);
  }, [businessId, table]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (record: Record<string, any>) => {
    const { error } = await (supabase.from(table) as any).insert({ ...record, business_id: businessId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Created successfully" });
    await fetchData();
    return true;
  };

  const update = async (id: string, record: Record<string, any>) => {
    const { error } = await (supabase.from(table) as any).update(record).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Updated successfully" });
    await fetchData();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase.from(table) as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Deleted successfully" });
    await fetchData();
    return true;
  };

  return { data, loading, fetch: fetchData, create, update, remove };
}
