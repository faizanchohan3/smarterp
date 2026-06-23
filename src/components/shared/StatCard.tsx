import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
  gradient?: "blue" | "green" | "red" | "amber" | "purple" | "pink" | "gold" | "teal";
}

const gradients: Record<string, string> = {
  gold: "from-amber-400 via-yellow-500 to-orange-500",
  blue: "from-sky-500 via-blue-600 to-indigo-600",
  green: "from-emerald-400 via-emerald-500 to-teal-600",
  red: "from-rose-500 via-red-500 to-pink-600",
  amber: "from-amber-400 via-orange-500 to-red-500",
  purple: "from-violet-500 via-purple-600 to-fuchsia-600",
  pink: "from-pink-400 via-rose-500 to-red-500",
  teal: "from-teal-400 via-cyan-500 to-blue-600",
};

const shadowGlow: Record<string, string> = {
  gold: "hover:shadow-amber-500/40",
  blue: "hover:shadow-blue-500/40",
  green: "hover:shadow-emerald-500/40",
  red: "hover:shadow-rose-500/40",
  amber: "hover:shadow-orange-500/40",
  purple: "hover:shadow-purple-500/40",
  pink: "hover:shadow-pink-500/40",
  teal: "hover:shadow-cyan-500/40",
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className, onClick, gradient = "gold" }: StatCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden border-0 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        "bg-gradient-to-br",
        gradients[gradient],
        shadowGlow[gradient],
        onClick && "cursor-pointer active:scale-[0.98]",
        className,
      )}
    >
      {/* shine overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/80 truncate">{title}</p>
            <p
              className={cn(
                "text-base sm:text-xl lg:text-2xl font-extrabold drop-shadow-sm break-words leading-tight",
                trend === "down" && "text-white",
              )}
              title={value}
            >
              {value}
            </p>
            {subtitle && <p className="text-[11px] text-white/70 truncate">{subtitle}</p>}
          </div>
          <div className="p-2.5 rounded-xl shrink-0 bg-white/20 backdrop-blur-sm border border-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
