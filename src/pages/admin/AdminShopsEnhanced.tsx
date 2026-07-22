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
import { Trash2, Edit2, Key, RefreshCw, Stethoscope, Loader2 } from "lucide-react";
import { adminResetPassword, adminDiagnoseShop, adminRelinkOwner } from "@/lib/adminApi";

const AdminShopsEnhanced = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [diagShop, setDiagShop] = useState<any>(null);
  const [relinkEmail, setRelinkEmail] = useState("");
  const [relinking, setRelinking] = useState(false);
  const { toast } = useToast();

  const openDiagnostics = async (shop: any) => {
    setDiagShop(shop);
    setRelinkEmail(shop.login_email !== "-" ? shop.login_email : "");
    setDiagData(null);
    setDiagOpen(true);
    setDiagLoading(true);
    const { data, error } = await adminDiagnoseShop(shop.id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      setDiagOpen(false);
    } else {
      setDiagData(data);
    }
    setDiagLoading(false);
  };

  const rebuildRoleLink = async () => {
    if (!diagShop?.user_id) return;
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", diagShop.user_id);
    if (delErr) { toast({ title: "Error", description: delErr.message, variant: "destructive" }); return; }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: diagShop.user_id, business_id: diagShop.id, role: "business_admin" });
    if (insErr) { toast({ title: "Error", description: insErr.message, variant: "destructive" }); return; }
    await supabase.from("profiles").update({ business_id: diagShop.id }).eq("user_id", diagShop.user_id);
    toast({ title: "Role link rebuilt", description: "Ask them to log out and log back in." });
    openDiagnostics(diagShop);
  };

  const relinkToEmail = async () => {
    if (!diagShop || !relinkEmail.trim()) return;
    setRelinking(true);
    const { data, error } = await adminRelinkOwner(diagShop.id, relinkEmail.trim());
    setRelinking(false);
    if (error) { toast({ title: "Error", description: error, variant: "destructive" }); return; }
    toast({ title: "Shop relinked", description: `Now linked to ${data.email}. Ask them to log out and log back in.` });
    fetchShops();
    openDiagnostics({ ...diagShop, user_id: data.linkedUserId });
  };

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
    if (!confirm(`Are you sure you want to delete ${shopName}? This permanently erases ALL its data — products, sales, customers, ledger, everything. This action cannot be undone.`)) {
      return;
    }
    if (!confirm(`Please confirm again: permanently delete "${shopName}" and all its data? There is no way to recover it after this.`)) {
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
          <Button
            size="sm"
            variant="outline"
            title="Diagnose and fix accounts stuck on Pending Approval even though this shop is Approved"
            onClick={(e) => { e.stopPropagation(); openDiagnostics(row); }}
          >
            <Stethoscope className="w-4 h-4" /> Fix Login
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

        {/* Diagnose & fix a stuck login */}
        <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Fix Login — {diagShop?.shop_name}</DialogTitle>
            </DialogHeader>
            {diagLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : diagData ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3 space-y-1 bg-muted/30">
                  <p><strong>Shop status:</strong> {diagData.business.status}</p>
                  <p><strong>businesses.user_id:</strong> {diagData.business.user_id || "— none —"}</p>
                  <p>
                    <strong>Auth account found:</strong>{" "}
                    {diagData.authUser
                      ? <span className="text-success">{diagData.authUser.email}</span>
                      : <span className="text-destructive">No — {diagData.authUserError || "businesses.user_id does not point to a real login"}</span>}
                  </p>
                  <p><strong>user_roles rows:</strong> {diagData.userRoles.length}
                    {diagData.userRoles.length > 1 && <span className="text-destructive"> (duplicates — this is likely the bug)</span>}
                  </p>
                  {diagData.userRoles.map((r: any) => (
                    <p key={r.id} className="text-xs text-muted-foreground pl-3">
                      role={r.role}, business_id={r.business_id === diagShop?.id ? "this shop ✓" : (r.business_id || "null")}
                    </p>
                  ))}
                </div>

                {diagData.authUser ? (
                  <Button className="w-full gap-2" onClick={rebuildRoleLink}>
                    <RefreshCw className="w-4 h-4" /> Rebuild Role Link (clears duplicates)
                  </Button>
                ) : (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      No valid login is linked to this shop. Enter the correct login email to relink it to the real account:
                    </p>
                    <Input placeholder="owner@email.com" value={relinkEmail} onChange={e => setRelinkEmail(e.target.value)} />
                    <Button className="w-full gap-2" disabled={relinking || !relinkEmail.trim()} onClick={relinkToEmail}>
                      {relinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Relink to This Email
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <DataTable columns={columns} data={shops} />
      </div>
    </AppLayout>
  );
};

export default AdminShopsEnhanced;
