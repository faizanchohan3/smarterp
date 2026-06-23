import { useState, useEffect, useRef } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const DEFAULT_ACCOUNTS: { code: string; name: string; type: string; description: string; children?: { code: string; name: string; description: string }[] }[] = [
  {
    code: "1000", name: "Assets", type: "asset", description: "All business assets",
    children: [
      { code: "1001", name: "Cash in Hand", description: "Physical cash held in shop" },
      { code: "1002", name: "Bank Account", description: "Business bank account balance" },
      { code: "1003", name: "Accounts Receivable", description: "Money owed by customers" },
      { code: "1004", name: "Gold Inventory", description: "Gold stock (bars, coins, raw)" },
      { code: "1005", name: "Silver Inventory", description: "Silver stock" },
      { code: "1006", name: "Diamond & Gemstone Inventory", description: "Diamonds and precious stones" },
      { code: "1007", name: "Finished Goods Inventory", description: "Ready-to-sell jewellery" },
      { code: "1008", name: "Work in Progress (Karigar)", description: "Jewellery under production with karigars" },
      { code: "1009", name: "Advance to Suppliers", description: "Advances paid to suppliers" },
      { code: "1010", name: "Advance to Karigar", description: "Advances given to karigars" },
      { code: "1011", name: "Security Deposits", description: "Deposits paid for rent, utilities, etc." },
      { code: "1012", name: "Furniture & Fixtures", description: "Display counters, safes, furniture" },
      { code: "1013", name: "Equipment & Machinery", description: "Jewellery-making tools and machinery" },
      { code: "1014", name: "Vehicles", description: "Business vehicles" },
    ],
  },
  {
    code: "2000", name: "Liabilities", type: "liability", description: "All business liabilities",
    children: [
      { code: "2001", name: "Accounts Payable", description: "Money owed to suppliers" },
      { code: "2002", name: "Customer Advances", description: "Advance payments received from customers" },
      { code: "2003", name: "Loans Payable", description: "Outstanding business loans" },
      { code: "2004", name: "Salaries Payable", description: "Unpaid employee salaries" },
      { code: "2005", name: "Tax Payable", description: "Pending tax obligations (GST, income tax)" },
      { code: "2006", name: "Accrued Expenses", description: "Expenses incurred but not yet paid" },
    ],
  },
  {
    code: "3000", name: "Equity", type: "equity", description: "Owner's equity and capital",
    children: [
      { code: "3001", name: "Owner's Capital", description: "Capital invested by owner" },
      { code: "3002", name: "Owner's Drawings", description: "Cash/goods withdrawn by owner" },
      { code: "3003", name: "Retained Earnings", description: "Accumulated profits reinvested" },
    ],
  },
  {
    code: "4000", name: "Revenue", type: "revenue", description: "All income sources",
    children: [
      { code: "4001", name: "Gold Jewellery Sales", description: "Revenue from gold jewellery sales" },
      { code: "4002", name: "Silver Jewellery Sales", description: "Revenue from silver jewellery sales" },
      { code: "4003", name: "Diamond Sales", description: "Revenue from diamond/gemstone sales" },
      { code: "4004", name: "Making Charges Income", description: "Labour/making charges billed to customers" },
      { code: "4005", name: "Repair & Service Income", description: "Jewellery repair and servicing revenue" },
      { code: "4006", name: "Old Gold Purchase Profit", description: "Profit on old gold exchanges" },
      { code: "4007", name: "Hallmarking Income", description: "Revenue from hallmarking services" },
      { code: "4008", name: "Discount Given", description: "Discounts given to customers (contra revenue)" },
      { code: "4009", name: "Sales Returns", description: "Returns/refunds on sales (contra revenue)" },
    ],
  },
  {
    code: "5000", name: "Expenses", type: "expense", description: "All business expenses",
    children: [
      { code: "5001", name: "Gold Purchase", description: "Cost of gold purchased" },
      { code: "5002", name: "Silver Purchase", description: "Cost of silver purchased" },
      { code: "5003", name: "Diamond & Gemstone Purchase", description: "Cost of diamonds and gemstones" },
      { code: "5004", name: "Making Charges (Karigar)", description: "Labour charges paid to karigars" },
      { code: "5005", name: "Polishing & Finishing", description: "Polishing, rhodium plating, finishing costs" },
      { code: "5006", name: "Hallmarking Expenses", description: "BIS hallmarking fees" },
      { code: "5007", name: "Salaries & Wages", description: "Employee salaries and wages" },
      { code: "5008", name: "Rent", description: "Shop/office rent" },
      { code: "5009", name: "Electricity & Utilities", description: "Electricity, water, gas bills" },
      { code: "5010", name: "Insurance", description: "Business/stock/employee insurance" },
      { code: "5011", name: "Security Expenses", description: "CCTV, guards, alarm systems" },
      { code: "5012", name: "Packaging & Gift Wrapping", description: "Boxes, pouches, gift wrapping costs" },
      { code: "5013", name: "Advertising & Marketing", description: "Ads, social media, promotions" },
      { code: "5014", name: "Transport & Delivery", description: "Shipping and delivery charges" },
      { code: "5015", name: "Office Supplies", description: "Stationery, printing, office supplies" },
      { code: "5016", name: "Telephone & Internet", description: "Phone and internet bills" },
      { code: "5017", name: "Professional Fees", description: "Legal, audit, and consultancy fees" },
      { code: "5018", name: "Bank Charges", description: "Bank fees, transaction charges, locker rent" },
      { code: "5019", name: "Depreciation", description: "Depreciation on fixed assets" },
      { code: "5020", name: "Repair & Maintenance", description: "Repairs to equipment, shop, vehicles" },
      { code: "5021", name: "Gold Wastage / Melting Loss", description: "Losses from gold melting and wastage" },
      { code: "5022", name: "Miscellaneous Expenses", description: "Other miscellaneous expenses" },
    ],
  },
];

const ChartOfAccounts = () => {
  const { data, create, update, remove, loading, fetch: refetch } = useBusinessData("chart_of_accounts");
  const { businessId } = useAuth();
  const { toast } = useToast();
  const seeded = useRef(false);

  useEffect(() => {
    if (loading || !businessId || data.length > 0 || seeded.current) return;
    seeded.current = true;
    (async () => {
      toast({ title: "Setting up accounts", description: "Creating default chart of accounts..." });
      for (const group of DEFAULT_ACCOUNTS) {
        const { data: parentRows, error: parentErr } = await (supabase.from("chart_of_accounts") as any)
          .insert({ code: group.code, name: group.name, type: group.type, description: group.description, business_id: businessId })
          .select("id");
        if (parentErr || !parentRows?.[0]) continue;
        const parentId = parentRows[0].id;
        if (group.children?.length) {
          const children = group.children.map(c => ({
            code: c.code, name: c.name, type: group.type, description: c.description,
            parent_id: parentId, business_id: businessId,
          }));
          await (supabase.from("chart_of_accounts") as any).insert(children);
        }
      }
      toast({ title: "Chart of Accounts ready", description: "55 default accounts created for your jewellery business." });
      await refetch();
    })();
  }, [loading, businessId, data.length]);
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
