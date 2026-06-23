import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

const typeColors: Record<string, string> = {
  asset: "full",
  liability: "unpaid",
  equity: "approved",
  revenue: "full",
  expense: "partial",
};

const ChartOfAccounts = () => {
  const { data, create, update, remove } = useBusinessData("chart_of_accounts");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setCode("");
    setName("");
    setType("");
    setParentId("");
    setDescription("");
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const record = {
      code,
      name,
      type,
      parent_id: parentId && parentId !== "none" ? parentId : null,
      description: description || null,
    };
    const ok = editing ? await update(editing.id, record) : await create(record);
    if (ok) { setOpen(false); resetForm(); }
  };

  const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Account Name" },
    {
      key: "type",
      label: "Type",
      render: (v: string) => (
        <StatusBadge status={typeColors[v] || v} label={v.charAt(0).toUpperCase() + v.slice(1)} />
      ),
    },
    {
      key: "parent_id",
      label: "Parent Account",
      render: (v: string) => {
        if (!v) return "—";
        const parent = data.find((a: any) => a.id === v);
        return parent ? `${parent.code} - ${parent.name}` : "—";
      },
    },
    { key: "description", label: "Description", render: (v: string) => v || "—" },
    {
      key: "is_active",
      label: "Status",
      render: (v: boolean) => (
        <StatusBadge status={v ? "approved" : "rejected"} label={v ? "Active" : "Inactive"} />
      ),
    },
  ];

  const parentAccounts = data.filter((a: any) => !editing || a.id !== editing.id);

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chart of Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage your accounting structure</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Add"} Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Account Code (e.g. 1001)" value={code} onChange={e => setCode(e.target.value)} required />
                <Input placeholder="Account Name" value={name} onChange={e => setName(e.target.value)} required />
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Account Type" /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Parent Account (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent</SelectItem>
                    {parentAccounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                <Button type="submit" className="w-full" disabled={!type}>{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable
          columns={columns}
          data={data}
          onEdit={(row) => {
            setEditing(row);
            setCode(row.code);
            setName(row.name);
            setType(row.type);
            setParentId(row.parent_id || "");
            setDescription(row.description || "");
            setOpen(true);
          }}
          onDelete={(row) => remove(row.id)}
        />
      </div>
    </AppLayout>
  );
};

export default ChartOfAccounts;
