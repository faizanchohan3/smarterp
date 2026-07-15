import { useAuth } from "@/contexts/AuthContext";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  showQR?: boolean;
  qrImageUrl?: string;
}

const ReportHeader = ({ title, subtitle, showQR, qrImageUrl }: ReportHeaderProps) => {
  const { shopName, ownerName, shopPhone, shopAddress, shopLogo, businessId } = useAuth();

  return (
    <div className="bg-white border-b-4 border-amber-900 print:border-b-4 print:border-amber-900">
      {/* Main Header */}
      <div className="p-6 sm:p-8 border-b-2 border-amber-100">
        <div className="flex justify-between items-start gap-4">
          {/* Left: Logo + Shop Name */}
          <div className="flex gap-4">
            {shopLogo && (
              <img
                src={shopLogo}
                alt="Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-amber-900"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-900 uppercase tracking-wider"
                  style={{ letterSpacing: "1px" }}>
                {shopName || "Jewellers"}
              </h1>
              {ownerName && (
                <p className="text-xs sm:text-sm text-amber-800 font-semibold mt-1">
                  Chief Executive: {ownerName}
                </p>
              )}
              {shopPhone && (
                <p className="text-xs text-gray-600 mt-1">Cell: {shopPhone}</p>
              )}
            </div>
          </div>

          {/* Center: QR Code */}
          {showQR && qrImageUrl && (
            <div className="hidden sm:block">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="w-20 h-20 border border-amber-900"
              />
            </div>
          )}

          {/* Right: Address + Contact */}
          <div className="text-right text-xs sm:text-sm text-gray-700">
            {shopAddress && (
              <div className="mb-2 font-medium text-gray-800">{shopAddress}</div>
            )}
            {shopPhone && (
              <div className="font-semibold text-amber-900">{shopPhone}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">Since 1948</p>
          </div>
        </div>
      </div>

      {/* Report Title Section */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 sm:p-6 border-b-2 border-amber-100">
        <h2 className="text-xl sm:text-2xl font-bold text-amber-900 uppercase tracking-wider text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 text-center mt-2">{subtitle}</p>
        )}
        <p className="text-xs text-gray-500 text-center mt-2">
          {new Date().toLocaleDateString("en-PK", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>
    </div>
  );
};

export default ReportHeader;
