import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, CheckCircle, Clock } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalShops: 0, pending: 0, approved: 0, totalUsers: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data: businesses } = await supabase.from("businesses").select("status");
      const totalShops = businesses?.length || 0;
      const pending = businesses?.filter(b => b.status === "pending").length || 0;
      const approved = businesses?.filter(b => b.status === "approved").length || 0;

      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });

      setStats({ totalShops, pending, approved, totalUsers: count || 0 });
    };
    fetch();
  }, []);

  const cards = [
    { title: "Total Shops", value: stats.totalShops, icon: Building2, color: "text-primary" },
    { title: "Pending Approval", value: stats.pending, icon: Clock, color: "text-warning" },
    { title: "Approved Shops", value: stats.approved, icon: CheckCircle, color: "text-success" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-info" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
