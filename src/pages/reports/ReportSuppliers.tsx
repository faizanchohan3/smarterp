import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const ReportSuppliers = () => {
  const { data: suppliers } = useBusinessData("suppliers");

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Suppliers Report" />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Suppliers Report</h1>
            <p className="text-sm text-muted-foreground">All registered suppliers</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Suppliers</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Name" },
              { key: "phone", label: "Phone" },
              { key: "alt_phone", label: "Alt Phone" },
              { key: "address", label: "Address" },
              { key: "created_at", label: "Since", render: (v: string) => new Date(v).toLocaleDateString() },
            ]} data={suppliers} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportSuppliers;
