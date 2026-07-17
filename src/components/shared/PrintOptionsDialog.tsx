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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Top space (mm)</label>
                <Input type="number" min="0" value={topMm} onChange={e => setTopMm(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bottom space (mm)</label>
                <Input type="number" min="0" value={bottomMm} onChange={e => setBottomMm(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Apne pad ke header/footer ki height ke hisaab se space set karein.
              Ek dafa set karne par poore system mein yaad rahega.
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
