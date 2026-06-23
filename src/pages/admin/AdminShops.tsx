import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const AdminShops = () => {
  const [shops, setShops] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchShops = async () => {
    const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
    setShops(data || []);
  };

  useEffect(() => { fetchShops(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Shop ${status}` });
    fetchShops();
  };

  const columns = [
    { key: "shop_name", label: "Shop Name" },
    { key: "owner_name", label: "Owner" },
    { key: "phone", label: "Phone" },
    { key: "status", label: "Status", render: (v: string) => (
      <Badge variant={v === "approved" ? "default" : v === "pending" ? "secondary" : "destructive"}>{v}</Badge>
    )},
    { key: "created_at", label: "Registered", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "id", label: "Actions", render: (_: any, row: any) => (
      <div className="flex gap-2">
        {row.status !== "approved" && (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "approved"); }}>Approve</Button>
        )}
        {row.status !== "rejected" && (
          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "rejected"); }}>Reject</Button>
        )}
        {row.status === "approved" && (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "rejected"); }}>Disable</Button>
        )}
      </div>
    )},
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">Manage Shops</h1>
        <DataTable columns={columns} data={shops} />
      </div>
    </AppLayout>
  );
};

export default AdminShops;
