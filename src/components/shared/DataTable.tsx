import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ShoppingBag } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onSell?: (row: any) => void;
  onRowClick?: (row: any) => void;
  totals?: Record<string, React.ReactNode>;
  totalsLabel?: string;
  rowClassName?: (row: any) => string;
}

const DataTable = ({ columns, data, onEdit, onDelete, onSell, onRowClick, totals, totalsLabel = "Total", rowClassName }: DataTableProps) => {
  const hasActions = onEdit || onDelete || onSell;
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            {hasActions && <TableHead className="w-32">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={row.id || i} className={`${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} ${rowClassName ? rowClassName(row) : ""}`} onClick={() => onRowClick?.(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? "-"}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {onSell && (
                        <Button variant="ghost" size="icon" title="Record Sale" onClick={() => onSell(row)}>
                          <ShoppingBag className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
        {totals && data.length > 0 && (
          <tfoot className="bg-muted/40 font-bold border-t-2">
            <tr>
              {columns.map((col, idx) => (
                <td key={col.key} className="px-4 py-2 text-sm">
                  {idx === 0 ? totalsLabel : (totals[col.key] ?? "")}
                </td>
              ))}
              {hasActions && <td />}
            </tr>
          </tfoot>
        )}
      </Table>
    </div>
  );
};

export default DataTable;
