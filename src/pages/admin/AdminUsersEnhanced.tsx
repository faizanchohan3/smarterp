import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Lock, Key } from "lucide-react";
import { adminResetPassword, adminDeleteUser } from "@/lib/adminApi";

const AdminUsersEnhanced = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    const merged = (profiles || []).map((p) => {
      const userRole = roles?.find((r) => r.user_id === p.user_id);
      return { ...p, role: userRole?.role || "business_admin" };
    });
    setUsers(merged);
  };

  const changePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Enter a password with at least 6 characters", variant: "destructive" });
      return;
    }

    const { error } = await adminResetPassword(selectedUser.user_id, newPassword);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "Password changed successfully" });
    setPasswordDialogOpen(false);
    setNewPassword("");
  };

  const changeUserRole = async () => {
    if (!selectedUser || !newRole) {
      toast({ title: "Error", description: "Please select a role", variant: "destructive" });
      return;
    }

    // Delete old role
    await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);

    // Insert new role
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUser.user_id,
      business_id: selectedUser.business_id || null,
      role: newRole,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Role changed successfully" });
    setChangeRoleDialogOpen(false);
    fetchUsers();
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    const { error } = await adminDeleteUser(userId);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }

    toast({ title: "User deleted successfully", variant: "destructive" });
    fetchUsers();
  };

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (v: string) => (
        <Badge variant={v === "super_admin" ? "default" : "secondary"}>
          {v?.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "user_id",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              setNewPassword("");
              setPasswordDialogOpen(true);
            }}
          >
            <Key className="w-4 h-4" /> Password
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              setNewRole(row.role);
              setChangeRoleDialogOpen(true);
            }}
          >
            <Lock className="w-4 h-4" /> Role
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteUser(row.user_id, row.full_name);
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
        <h1 className="text-2xl font-bold">All Users</h1>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password - {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email: {selectedUser?.email}
              </p>
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button className="w-full" onClick={changePassword}>
                Change Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role - {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="business_admin">Business Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={changeUserRole}>
                Update Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DataTable columns={columns} data={users} />
      </div>
    </AppLayout>
  );
};

export default AdminUsersEnhanced;
