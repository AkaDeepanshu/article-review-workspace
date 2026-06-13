import type { LucideIcon } from "lucide-react";

import { Button } from "easySLR/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Error</CardTitle>
        <CardDescription className="text-destructive/80">
          {message}
        </CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
