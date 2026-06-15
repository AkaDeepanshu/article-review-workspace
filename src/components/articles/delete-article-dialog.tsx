"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "easySLR/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "easySLR/components/ui/dialog";
import { api } from "easySLR/trpc/react";

export function DeleteArticleDialog({
  projectId,
  articleId,
  articleTitle,
}: {
  projectId: string;
  articleId: string;
  articleTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const deleteArticle = api.article.delete.useMutation({
    onSuccess: () => {
      void utils.article.list.invalidate();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-xs">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete article?</DialogTitle>
          <DialogDescription>
            &ldquo;{articleTitle}&rdquo; will be permanently deleted along with
            all review decisions for this article. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteArticle.mutate({ projectId, articleId })}
            disabled={deleteArticle.isPending}
          >
            {deleteArticle.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
