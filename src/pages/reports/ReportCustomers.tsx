import { useBusinessData } from "@/hooks/useBusinessData";
import AppLayout from "@/components/layout/AppLayout";
import DataTable from "@/components/shared/DataTable";
import ReportHeader from "@/components/shared/ReportHeader";
import ReportFooter from "@/components/shared/ReportFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const ReportCustomers = () => {
  const { data: customers } = useBusinessData("customers");

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in print-receipt-only">
        <ReportHeader title="Customers Report" />
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Customers Report</h1>
            <p className="text-sm text-muted-foreground">All registered customers</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Customers</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={[
              { key: "name", label: "Name" },
              { key: "phone", label: "Phone" },
              { key: "alt_phone", label: "Alt Phone" },
              { key: "reference", label: "Reference" },
              { key: "reference_phone", label: "Ref. Phone" },
              { key: "address", label: "Address" },
              { key: "created_at", label: "Since", render: (v: string) => new Date(v).toLocaleDateString() },
            ]} data={customers} />
          </CardContent>
        </Card>
        <ReportFooter />
      </div>
    </AppLayout>
  );
};

export default ReportCustomers;
