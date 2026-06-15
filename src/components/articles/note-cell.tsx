"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { ReviewStatus } from "../../../generated/prisma";

import { Button } from "easySLR/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "easySLR/components/ui/popover";
import { Textarea } from "easySLR/components/ui/textarea";
import { api } from "easySLR/trpc/react";

export function NoteCell({
  projectId,
  articleId,
  currentStatus,
  currentNote,
}: {
  projectId: string;
  articleId: string;
  currentStatus: ReviewStatus;
  currentNote: string | null;
}) {
  const [note, setNote] = useState(currentNote ?? "");
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const upsert = api.review.upsert.useMutation({
    onSuccess: () => {
      void utils.article.list.invalidate();
      setOpen(false);
    },
  });

  return (
    <div className="flex items-center gap-1">
      <span className="block max-w-[100px] truncate text-xs text-muted-foreground">
        {currentNote ?? "—"}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon-xs">
              <Pencil className="h-3 w-3" />
            </Button>
          }
        />
        <PopoverContent className="w-64" side="left">
          <div className="space-y-2">
            <p className="text-xs font-medium">Review note</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              className="min-h-[80px] text-xs"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={() =>
                upsert.mutate({
                  projectId,
                  articleId,
                  status: currentStatus,
                  note,
                })
              }
              disabled={upsert.isPending}
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
