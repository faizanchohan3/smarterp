import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Printer } from "lucide-react";

const GoldRateReport = () => {
  const { shopName, ownerName, shopPhone, shopAddress, shopLogo, businessId } = useAuth();
  const { data: rates } = useBusinessData("gold_rates" as any);

  const today = new Date().toISOString().slice(0, 10);
  const todayRates = rates
    .filter((r: any) => r.rate_date === today)
    .sort((a: any, b: any) => (a.rate_time || "00:00").localeCompare(b.rate_time || "00:00"));

  const latestRate = todayRates.length > 0 ? todayRates[todayRates.length - 1] : null;

  const getRateTypeLabel = (type: string) => {
    switch (type) {
      case "morning": return "Morning (6am-12pm)";
      case "afternoon": return "Afternoon (12pm-6pm)";
      case "evening": return "Evening (6pm-12am)";
      case "night": return "Night (12am-6am)";
      default: return type?.charAt(0).toUpperCase() + type?.slice(1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center print:hidden mb-4">
          <h1 className="text-2xl font-bold">Gold Rate Report</h1>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </div>

        {/* Professional Letterhead Template */}
        <div className="bg-white border-4 border-amber-900 print:border-4 print:border-amber-900">
          {/* Header Section */}
          <div className="border-b-4 border-amber-900 p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
              {/* Left: Logo + Shop Name */}
              <div className="flex gap-4">
                {shopLogo && (
                  <img src={shopLogo} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-amber-900" />
                )}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-900 uppercase tracking-wider" style={{ letterSpacing: "2px" }}>
                    {shopName || "Jewellers"}
                  </h2>
                  {ownerName && (
                    <p className="text-sm text-amber-800 font-semibold mt-1">Proprietor: {ownerName}</p>
                  )}
                  {shopPhone && (
                    <p className="text-xs text-gray-600 mt-1">Cell: {shopPhone}</p>
                  )}
                </div>
              </div>

              {/* Right: Address */}
              <div className="text-right text-xs sm:text-sm text-gray-700">
                {shopAddress && (
                  <div className="mb-2 font-medium">{shopAddress}</div>
                )}
                {shopPhone && (
                  <div className="font-semibold text-amber-900">{shopPhone}</div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mt-4 pt-2 border-t border-amber-900">
              <h3 className="text-lg sm:text-xl font-bold text-amber-900">GOLD RATE REPORT</h3>
              <p className="text-xs text-gray-600 mt-1">{new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          {/* Latest Rate - Prominent Display */}
          {latestRate ? (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 sm:p-8 border-b border-amber-200">
              <div className="mb-4">
                <p className="text-xs uppercase text-amber-700 font-semibold tracking-wider">Latest Rate</p>
                <div className="flex justify-between items-baseline mt-2">
                  <div>
                    <p className="text-gray-600 text-sm">{getRateTypeLabel(latestRate.rate_type)}</p>
                    {latestRate.rate_time && (
                      <p className="text-xs text-gray-500">Time: {latestRate.rate_time.slice(0, 5)}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{new Date(latestRate.rate_date).toLocaleDateString("en-PK")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border border-amber-200">
                  <p className="text-xs uppercase text-amber-700 font-semibold mb-1">24K / Tola</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-900">{formatCurrency(latestRate.tola_24k)}</p>
                </div>
                <div className="bg-white p-4 rounded border border-amber-200">
                  <p className="text-xs uppercase text-amber-700 font-semibold mb-1">22K / Tola</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-900">{formatCurrency(latestRate.tola_22k)}</p>
                </div>
                <div className="bg-white p-4 rounded border border-amber-200">
                  <p className="text-xs uppercase text-amber-700 font-semibold mb-1">18K / Tola</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-900">{formatCurrency(latestRate.tola_18k)}</p>
                </div>
                <div className="bg-white p-4 rounded border border-amber-200">
                  <p className="text-xs uppercase text-amber-700 font-semibold mb-1">Silver / Tola</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-900">{formatCurrency(latestRate.silver_tola)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No rates recorded today</p>
            </div>
          )}

          {/* Today's All Rates */}
          {todayRates.length > 0 && (
            <div className="p-6 sm:p-8 border-b border-amber-200">
              <h4 className="text-sm font-bold text-amber-900 uppercase mb-4 tracking-wider">Today's Rate Updates</h4>
              <div className="space-y-3">
                {todayRates.map((rate: any, i: number) => (
                  <div key={rate.id} className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-0">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-800">{i + 1}. {getRateTypeLabel(rate.rate_type)}</p>
                      {rate.rate_time && (
                        <p className="text-xs text-gray-500">Time: {rate.rate_time.slice(0, 5)}</p>
                      )}
                    </div>
                    <div className="text-right text-sm font-semibold text-amber-900">
                      <div>24K: {formatCurrency(rate.tola_24k)}</div>
                      <div className="text-xs text-gray-600">22K: {formatCurrency(rate.tola_22k)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white p-4 text-xs text-center">
            <p className="mb-1">Rate Subject to Change • Not Responsible for Printing Errors</p>
            <p>Generated: {new Date().toLocaleTimeString("en-PK")}</p>
          </div>
        </div>

        {/* Daily Rate Table for Reference */}
        <div className="print:hidden">
          <h3 className="text-lg font-semibold mt-8 mb-4">Complete Today's Records</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b">
                  <th className="text-left p-3 font-semibold text-amber-900">#</th>
                  <th className="text-left p-3 font-semibold text-amber-900">Time</th>
                  <th className="text-left p-3 font-semibold text-amber-900">Type</th>
                  <th className="text-right p-3 font-semibold text-amber-900">24K</th>
                  <th className="text-right p-3 font-semibold text-amber-900">22K</th>
                  <th className="text-right p-3 font-semibold text-amber-900">18K</th>
                  <th className="text-right p-3 font-semibold text-amber-900">Silver</th>
                </tr>
              </thead>
              <tbody>
                {todayRates.map((rate: any, i: number) => (
                  <tr key={rate.id} className="border-b hover:bg-amber-50">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{rate.rate_time?.slice(0, 5) || "-"}</td>
                    <td className="p-3 capitalize">{rate.rate_type}</td>
                    <td className="p-3 text-right">{formatCurrency(rate.tola_24k)}</td>
                    <td className="p-3 text-right">{formatCurrency(rate.tola_22k)}</td>
                    <td className="p-3 text-right">{formatCurrency(rate.tola_18k)}</td>
                    <td className="p-3 text-right">{formatCurrency(rate.silver_tola)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GoldRateReport;
