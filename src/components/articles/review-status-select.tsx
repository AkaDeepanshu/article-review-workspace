"use client";

import type { ReviewStatus } from "../../../generated/prisma";

import { StatusBadge } from "easySLR/components/articles/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "easySLR/components/ui/dropdown-menu";
import { api } from "easySLR/trpc/react";

const STATUSES: ReviewStatus[] = [
  "PENDING",
  "INCLUDED",
  "EXCLUDED",
  "MAYBE",
];

export function ReviewStatusSelect({
  projectId,
  articleId,
  currentStatus,
}: {
  projectId: string;
  articleId: string;
  currentStatus: ReviewStatus;
}) {
  const utils = api.useUtils();

  const upsert = api.review.upsert.useMutation({
    onSettled: () => {
      void utils.article.list.invalidate();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer outline-none">
        <StatusBadge status={currentStatus} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() =>
              upsert.mutate({ projectId, articleId, status })
            }
            disabled={upsert.isPending}
          >
            <StatusBadge status={status} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
