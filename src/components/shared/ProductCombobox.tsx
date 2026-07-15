import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ProductComboboxProps {
  products: any[];
  value: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
}

const ProductCombobox = ({ products, value, onSelect, placeholder = "Search product..." }: ProductComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = products.find((p) => p.id === value);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.serial_number?.toLowerCase().includes(q) ||
      String(p.purity_karat || "").includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate">
            {selected ? `${selected.name} (${selected.gross_weight || selected.weight_value || 0}g)` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2 gap-2">
          <Search className="h-4 w-4 opacity-50 shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type name, serial # or karat..."
            className="h-7 border-0 p-0 focus-visible:ring-0 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No product found</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 rounded-sm px-2 py-2 text-sm text-left hover:bg-accent ${value === p.id ? "bg-accent" : ""}`}
            >
              <Check className={`h-4 w-4 shrink-0 ${value === p.id ? "opacity-100" : "opacity-0"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  {p.purity_karat ? <span>{p.purity_karat}K</span> : null}
                  <span>{p.gross_weight || p.weight_value || 0}g</span>
                  {p.serial_number ? <span className="truncate">#{p.serial_number}</span> : null}
                  <span>Stock: {p.stock_quantity ?? 0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductCombobox;
