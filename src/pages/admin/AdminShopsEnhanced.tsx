import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Key } from "lucide-react";
import { adminResetPassword } from "@/lib/adminApi";

const AdminShopsEnhanced = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!selectedShop?.user_id || !newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Enter a password with at least 6 characters", variant: "destructive" });
      return;
    }
    const { error } = await adminResetPassword(selectedShop.user_id, newPassword);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    toast({ title: `Password reset for ${selectedShop.shop_name}` });
    setPasswordOpen(false);
    setNewPassword("");
  };

  const fetchShops = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    // Attach the login email for each shop (profiles.user_id -> businesses.user_id)
    const { data: profiles } = await supabase.from("profiles").select("user_id, email");
    const withEmail = (data || []).map((shop: any) => ({
      ...shop,
      login_email: profiles?.find((p: any) => p.user_id === shop.user_id)?.email || "-",
    }));
    setShops(withEmail);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("businesses")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Shop ${status}` });
    fetchShops();
  };

  const updateShop = async () => {
    if (!selectedShop) return;
    const { error } = await supabase
      .from("businesses")
      .update({
        shop_name: editForm.shop_name,
        owner_name: editForm.owner_name,
        phone: editForm.phone,
        address: editForm.address,
      })
      .eq("id", selectedShop.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Shop updated successfully" });
    setEditOpen(false);
    fetchShops();
  };

  const deleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`Are you sure you want to delete ${shopName}? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Shop deleted successfully", variant: "destructive" });
    fetchShops();
  };

  const openEdit = (shop: any) => {
    setSelectedShop(shop);
    setEditForm({
      shop_name: shop.shop_name,
      owner_name: shop.owner_name,
      phone: shop.phone || "",
      address: shop.address || "",
    });
    setEditOpen(true);
  };

  const columns = [
    { key: "shop_name", label: "Shop Name" },
    { key: "owner_name", label: "Owner" },
    { key: "login_email", label: "Login Email" },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "approved" ? "default" : v === "pending" ? "secondary" : "destructive"
          }
        >
          {v}
        </Badge>
      ),
    },
    { key: "created_at", label: "Registered", render: (v: string) => new Date(v).toLocaleDateString() },
    {
      key: "id",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Edit2 className="w-4 h-4" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!row.user_id}
            onClick={(e) => { e.stopPropagation(); setSelectedShop(row); setNewPassword(""); setPasswordOpen(true); }}
          >
            <Key className="w-4 h-4" /> Password
          </Button>
          {row.status !== "approved" && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "approved"); }}>
              Approve
            </Button>
          )}
          {row.status !== "rejected" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "rejected"); }}
            >
              Reject
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteShop(row.id, row.shop_name);
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">Manage Shops</h1>

        {/* Edit Shop Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Shop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Shop Name"
                value={editForm.shop_name || ""}
                onChange={(e) => setEditForm({ ...editForm, shop_name: e.target.value })}
              />
              <Input
                placeholder="Owner Name"
                value={editForm.owner_name || ""}
                onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Textarea
                placeholder="Address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
              <Button className="w-full" onClick={updateShop}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password — {selectedShop?.shop_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Login Email: {selectedShop?.login_email}
              </p>
              <Input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button className="w-full" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DataTable columns={columns} data={shops} />
      </div>
    </AppLayout>
  );
};

export default AdminShopsEnhanced;
