import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stat {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface DashboardStatsProps {
  stats: Stat[];
  className?: string;
}

/**
 * Grid of stat cards for the dashboard overview.
 */
export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            {stat.icon && <div className="h-4 w-4 text-muted-foreground">{stat.icon}</div>}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {(stat.description || stat.trend) && (
              <div className="mt-1 flex items-center gap-2">
                {stat.trend && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      stat.trend.isPositive ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {stat.trend.isPositive ? "+" : ""}
                    {stat.trend.value}%
                  </span>
                )}
                {stat.description && (
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
