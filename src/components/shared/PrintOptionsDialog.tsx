import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Printer, FileText } from "lucide-react";

const LS_TOP = "print_top_margin_mm";
const LS_BOTTOM = "print_bottom_margin_mm";

// Injects a temporary stylesheet that hides branded header/footer and applies
// the letterhead pad margins, then prints, then cleans up.
const printWithoutBranding = (topMm: number, bottomMm: number) => {
  const style = document.createElement("style");
  style.id = "no-branding-print-style";
  style.innerHTML = `@media print {
    .print-branding { display: none !important; }
    @page { margin-top: ${topMm}mm !important; margin-bottom: ${bottomMm}mm !important; }
  }`;
  document.head.appendChild(style);
  const cleanup = () => {
    document.getElementById("no-branding-print-style")?.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  setTimeout(cleanup, 3000); // fallback cleanup
};

// Global dialog — mounted once in AppLayout. Any page can open it with:
//   window.dispatchEvent(new Event("open-print-dialog"))
const PrintOptionsDialog = () => {
  const [open, setOpen] = useState(false);
  const [topMm, setTopMm] = useState(() => localStorage.getItem(LS_TOP) || "45");
  const [bottomMm, setBottomMm] = useState(() => localStorage.getItem(LS_BOTTOM) || "25");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-print-dialog", handler);
    return () => window.removeEventListener("open-print-dialog", handler);
  }, []);

  const printBranded = () => {
    setOpen(false);
    setTimeout(() => window.print(), 150);
  };

  const printOwnPad = () => {
    localStorage.setItem(LS_TOP, topMm);
    localStorage.setItem(LS_BOTTOM, bottomMm);
    setOpen(false);
    setTimeout(() => printWithoutBranding(parseFloat(topMm) || 0, parseFloat(bottomMm) || 0), 150);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Print Options</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Button className="w-full gap-2 h-12" onClick={printBranded}>
            <Printer className="w-4 h-4" />
            Print with Branded Header & Footer
          </Button>

          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" /> Own Letterhead Pad (no header/footer)
            </p>

            {/* ── A4 Live Preview + Drag Sliders ── */}
            <div className="flex gap-3">
              {/* Mini A4 page preview (210×297 ratio) */}
              <div className="relative w-[105px] h-[148px] shrink-0 border-2 border-foreground/30 rounded-sm bg-white dark:bg-slate-100 overflow-hidden shadow-sm">
                {/* Pad header zone */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-200/80 border-b border-dashed border-red-400 flex items-center justify-center"
                  style={{ height: `${Math.min(50, (parseFloat(topMm) || 0) / 297 * 148)}px` }}
                >
                  <span className="text-[7px] text-red-700 font-semibold">PAD HEADER</span>
                </div>
                {/* Data area */}
                <div
                  className="absolute left-1 right-1 flex flex-col gap-[3px] py-1"
                  style={{
                    top: `${Math.min(50, (parseFloat(topMm) || 0) / 297 * 148)}px`,
                    bottom: `${Math.min(40, (parseFloat(bottomMm) || 0) / 297 * 148)}px`,
                  }}
                >
                  <div className="h-[5px] bg-slate-300 rounded-sm w-3/4" />
                  <div className="h-[4px] bg-slate-200 rounded-sm" />
                  <div className="h-[4px] bg-slate-200 rounded-sm" />
                  <div className="h-[4px] bg-slate-200 rounded-sm" />
                  <div className="h-[4px] bg-slate-200 rounded-sm w-5/6" />
                  <div className="h-[4px] bg-slate-200 rounded-sm w-2/3" />
                </div>
                {/* Pad footer zone */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-red-200/80 border-t border-dashed border-red-400 flex items-center justify-center"
                  style={{ height: `${Math.min(40, (parseFloat(bottomMm) || 0) / 297 * 148)}px` }}
                >
                  <span className="text-[7px] text-red-700 font-semibold">PAD FOOTER</span>
                </div>
              </div>

              {/* Drag sliders */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Top space</label>
                    <span className="text-xs font-bold">{topMm} mm</span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="1" value={topMm}
                    onChange={e => setTopMm(e.target.value)}
                    className="w-full h-2 accent-red-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-muted-foreground">Bottom space</label>
                    <span className="text-xs font-bold">{bottomMm} mm</span>
                  </div>
                  <input
                    type="range" min="0" max="80" step="1" value={bottomMm}
                    onChange={e => setBottomMm(e.target.value)}
                    className="w-full h-2 accent-red-600 cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input type="number" min="0" className="h-8 text-xs" value={topMm} onChange={e => setTopMm(e.target.value)} />
                  <Input type="number" min="0" className="h-8 text-xs" value={bottomMm} onChange={e => setBottomMm(e.target.value)} />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Slider ko drag karke pad ke header/footer ki jagah set karein — preview mein red area
              chhoda jayega, grey area par data print hoga. Ek dafa set karo, hamesha yaad rahega.
            </p>
            <Button variant="outline" className="w-full gap-2" onClick={printOwnPad}>
              <Printer className="w-4 h-4" />
              Print WITHOUT Header/Footer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintOptionsDialog;
