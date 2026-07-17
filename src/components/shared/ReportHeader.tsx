import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
}

const ReportHeader = ({ title, subtitle }: ReportHeaderProps) => {
  const { shopName, ownerName, shopPhone, shopAddress, shopLogo } = useAuth();
  const whatsappQrRef = useRef<HTMLCanvasElement>(null);

  // Generate WhatsApp QR code
  useEffect(() => {
    if (whatsappQrRef.current && shopPhone) {
      const whatsappUrl = `https://wa.me/${shopPhone.replace(/\D/g, '')}`;
      QRCode.toCanvas(whatsappQrRef.current, whatsappUrl, {
        width: 100,
        margin: 1,
        color: {
          dark: "#25D366",
          light: "#fff"
        }
      }).catch(() => {});
    }
  }, [shopPhone]);

  return (
    <div className="bg-white print:bg-white print-branding">
      {/* Red Professional Header */}
      <div className="bg-red-700 text-white p-6 sm:p-8 print:bg-red-700">
        <div className="flex justify-between items-start gap-6">
          {/* Left: Logo + Shop Name */}
          <div className="flex gap-4 flex-1">
            {shopLogo && (
              <img
                src={shopLogo}
                alt="Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-white"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest leading-tight">
                {shopName || "Jewellers"}
              </h1>
              <p className="text-sm sm:text-base mt-2 font-semibold opacity-95">
                {ownerName || "Business Report"}
              </p>
              {shopAddress && (
                <p className="text-xs sm:text-sm mt-1 opacity-90">{shopAddress}</p>
              )}
              {shopPhone && (
                <p className="text-xs sm:text-sm mt-1 opacity-90">📞 {shopPhone}</p>
              )}
            </div>
          </div>

          {/* Right: WhatsApp QR Code */}
          {shopPhone && (
            <div className="flex flex-col items-center gap-2">
              <canvas ref={whatsappQrRef} className="border-2 border-white p-1 bg-white"></canvas>
              <p className="text-xs font-semibold text-center">Chat on WhatsApp</p>
            </div>
          )}
        </div>

        {/* Report Title - Professional Alignment */}
        <div className="mt-6 pt-4 border-t-2 border-red-600">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm sm:text-base mt-2 opacity-90 font-medium">{subtitle}</p>
            )}
            <p className="text-xs sm:text-sm mt-3 opacity-85">
              Generated: {new Date().toLocaleDateString("en-PK", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-1 bg-gradient-to-r from-red-700 via-red-600 to-red-700"></div>
    </div>
  );
};

export default ReportHeader;
