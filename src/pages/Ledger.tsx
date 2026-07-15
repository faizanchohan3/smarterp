import { useState, useEffect } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";

const Ledger = () => {
  const { data: ledgerEntries } = useBusinessData("ledger_entries");
  const { data: customers } = useBusinessData("customers");
  const { data: suppliers } = useBusinessData("suppliers");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const customerEntries = ledgerEntries.filter((e: any) => e.entry_type === "customer" && (!selectedCustomer || selectedCustomer === "all" || e.reference_id === selectedCustomer));
  const supplierEntries = ledgerEntries.filter((e: any) => e.entry_type === "supplier" && (!selectedSupplier || selectedSupplier === "all" || e.reference_id === selectedSupplier));

  const calcRunningBalance = (entries: any[]) => {
    let balance = 0;
    return [...entries].reverse().map((e: any) => {
      balance += Number(e.debit) - Number(e.credit);
      return { ...e, running_balance: balance };
    }).reverse();
  };

  const columns = [
    { key: "created_at", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "description", label: "Description" },
    { key: "debit", label: "Debit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "credit", label: "Credit", render: (v: number) => Number(v) > 0 ? formatCurrency(v) : "-" },
    { key: "running_balance", label: "Balance", render: (v: number) => formatCurrency(v) },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-muted-foreground">Customer & supplier ledger accounts</p>
        </div>
        <Tabs defaultValue="customer">
          <TabsList>
            <TabsTrigger value="customer">Customer Ledger</TabsTrigger>
            <TabsTrigger value="supplier">Supplier Ledger</TabsTrigger>
          </TabsList>
          <TabsContent value="customer" className="space-y-4">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-64"><SelectValue placeholder="All Customers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <DataTable columns={columns} data={calcRunningBalance(customerEntries)} />
          </TabsContent>
          <TabsContent value="supplier" className="space-y-4">
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-64"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <DataTable columns={columns} data={calcRunningBalance(supplierEntries)} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Ledger;
