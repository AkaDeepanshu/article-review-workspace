"use client";

import type { ReviewStatus } from "../../../generated/prisma";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "easySLR/components/ui/select";
import { Button } from "easySLR/components/ui/button";
import { api } from "easySLR/trpc/react";

export function BulkActions({
  projectId,
  selectedIds,
  onClear,
}: {
  projectId: string;
  selectedIds: string[];
  onClear: () => void;
}) {
  const utils = api.useUtils();
  const bulkUpdate = api.review.bulkUpdate.useMutation({
    onSuccess: () => {
      void utils.article.list.invalidate();
      onClear();
    },
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>
      <Select
        onValueChange={(status) => {
          bulkUpdate.mutate({
            projectId,
            articleIds: selectedIds,
            status: status as ReviewStatus,
          });
        }}
        disabled={bulkUpdate.isPending}
      >
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="INCLUDED">Included</SelectItem>
          <SelectItem value="EXCLUDED">Excluded</SelectItem>
          <SelectItem value="MAYBE">Maybe</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
