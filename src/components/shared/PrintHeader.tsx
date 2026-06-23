import { useAuth } from "@/contexts/AuthContext";
import goldEmblem from "@/assets/gold-emblem.png";

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
}

const PrintHeader = ({ title, subtitle }: PrintHeaderProps) => {
  const { shopName, ownerName, shopLogo, shopAddress, shopPhone } = useAuth();

  return (
    <div className="hidden print:block mb-4 print-receipt-header">
      <div
        className="rounded-xl overflow-hidden border-2"
        style={{
          borderColor: "#b8860b",
          background: "linear-gradient(135deg, #fff8e7 0%, #fde9b9 50%, #f6d77a 100%)",
        }}
      >
        <div className="flex items-center gap-4 p-4">
          {shopLogo ? (
            <img src={shopLogo} alt="Shop" className="w-16 h-16 rounded-xl object-cover border-2" style={{ borderColor: "#b8860b" }} />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg,#f6c453,#b8860b)", color: "#3a2a05" }}
            >
              {(ownerName || "S")[0]?.toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "#3a2a05" }}>
              {ownerName || "Shop Owner"}
            </h1>
            <p className="text-sm font-semibold" style={{ color: "#7a5a10" }}>{shopName || "Business"}</p>
            <div className="text-xs mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "#5a420a" }}>
              {shopAddress && <span>📍 {shopAddress}</span>}
              {shopPhone && <span>📞 {shopPhone}</span>}
            </div>
          </div>

          <img src={goldEmblem} alt="" className="w-16 h-16 object-contain" />
        </div>

        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg,#b8860b,#daa520,#b8860b)", color: "#fff8e7" }}
        >
          <h2 className="text-base font-bold uppercase tracking-wider">{title}</h2>
          <div className="text-xs text-right">
            {subtitle && <div className="font-semibold">{subtitle}</div>}
            <div>{new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
