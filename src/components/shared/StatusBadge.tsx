import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  full: "bg-success/10 text-success border-success/20",
  paid: "bg-success/10 text-success border-success/20",
  partial: "bg-warning/10 text-warning border-warning/20",
  unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ready: "bg-success/10 text-success border-success/20",
  returned: "bg-muted text-muted-foreground border-border",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const style = statusStyles[status?.toLowerCase()] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", style, className)}>
      {status}
    </span>
  );
};

export default StatusBadge;
