import type { ReviewStatus } from "../../../generated/prisma";

import { Badge } from "easySLR/components/ui/badge";
import { cn } from "easySLR/lib/utils";

const STATUS_CONFIG: Record<
  ReviewStatus,
  { variant: "default" | "destructive" | "outline" | "secondary"; className?: string }
> = {
  INCLUDED: {
    variant: "default",
    className: "bg-green-600 hover:bg-green-600/90 text-white border-transparent",
  },
  EXCLUDED: { variant: "destructive" },
  MAYBE: {
    variant: "secondary",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  PENDING: {
    variant: "outline",
    className: "text-muted-foreground",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ReviewStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {status}
    </Badge>
  );
}
