"use client";

import type { ScanStatusDTO } from "@/features/scans/schemas/scan-schema";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
} from "lucide-react";

interface ScanBadgeProps {
  status: ScanStatusDTO;
}

const STATUS_CONFIG: Record<
  ScanStatusDTO,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  RUNNING: {
    label: "Running",
    variant: "default",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  FAILED: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
    icon: <Ban className="h-3 w-3" />,
  },
};

/**
 * Displays a scan status badge with icon and color.
 */
export function ScanBadge({ status }: ScanBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 whitespace-nowrap">
      {config.icon}
      {config.label}
    </Badge>
  );
}
