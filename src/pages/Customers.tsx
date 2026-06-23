import { useNavigate } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

const Customers = () => {
  const navigate = useNavigate();
  const { data, remove } = useBusinessData("customers");

  const columns = [
    { key: "photo_url", label: "", render: (v: string, row: any) => (
      <Avatar className="w-8 h-8">
        <AvatarImage src={v || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{row.name?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
    )},
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "reference", label: "Reference" },
    { key: "address", label: "Address" },
    { key: "created_at", label: "Since", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground">Click on a customer to view full details</p>
          </div>
          <Button onClick={() => navigate("/customers/new")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          onEdit={(row) => navigate(`/customers/${row.id}/edit`)}
          onDelete={(row) => remove(row.id)}
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
        />
      </div>
    </AppLayout>
  );
};

export default Customers;
