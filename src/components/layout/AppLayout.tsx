import { useState } from "react";
import AppSidebar from "./AppSidebar";
import GoldRateBar from "./GoldRateBar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import goldLogo from "@/assets/gold-logo.png";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { shopName, shopLogo, ownerName } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 bg-gradient-sidebar text-amber-100 border-b border-sidebar-border print:hidden">
          <div className="flex items-center justify-between px-3 py-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-amber-100 hover:bg-white/10 hover:text-amber-100">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-0 bg-transparent">
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 min-w-0">
              {shopLogo ? (
                <Avatar className="w-8 h-8 rounded-lg ring-1 ring-amber-400/40">
                  <AvatarImage src={shopLogo} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-gradient-gold text-amber-950 text-xs font-bold">
                    {(ownerName || "S")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                  <img src={goldLogo} alt="Gold ERP" className="w-6 h-6 object-contain" loading="lazy" width={512} height={512} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-tight">{shopName || "Gold Jewellery ERP"}</p>
                <p className="text-[10px] text-amber-200/70 truncate leading-tight">{ownerName || "Business"}</p>
              </div>
            </div>

            <div className="w-9" />
          </div>
        </header>

        <GoldRateBar />
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
