import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");

      const merged = (profiles || []).map(p => {
        const userRole = roles?.find(r => r.user_id === p.user_id);
        return { ...p, role: userRole?.role || "business_admin" };
      });
      setUsers(merged);
    };
    fetch();
  }, []);

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "created_at", label: "Joined", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">All Users</h1>
        <DataTable columns={columns} data={users} />
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
