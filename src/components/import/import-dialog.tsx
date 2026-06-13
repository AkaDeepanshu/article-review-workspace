"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileUpload } from "easySLR/components/import/file-upload";
import { ImportSummary } from "easySLR/components/import/import-summary";
import { PreviewTable } from "easySLR/components/import/preview-table";
import { fileToBase64 } from "easySLR/lib/file-to-base64";
import { Button } from "easySLR/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "easySLR/components/ui/dialog";
import { Progress } from "easySLR/components/ui/progress";
import { api, type RouterOutputs } from "easySLR/trpc/react";

type PreviewResult = RouterOutputs["import"]["parsePreview"];
type Step = "upload" | "preview" | "summary";

export function ImportDialog({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [summary, setSummary] = useState<{
    imported: number;
    skippedDuplicates: number;
    errors: number;
  } | null>(null);

  const utils = api.useUtils();

  const parsePreview = api.import.parsePreview.useMutation({
    onSuccess: (data) => {
      setPreview(data);
      setStep("preview");
    },
    onError: (err) => toast.error(err.message),
  });

  const confirmImport = api.import.confirmImport.useMutation({
    onSuccess: (result) => {
      void utils.article.list.invalidate();
      setSummary({
        imported: result.imported,
        skippedDuplicates: result.skippedDuplicates,
        errors: preview?.errors.length ?? 0,
      });
      setStep("summary");
      toast.success(`${result.imported} articles imported`);
    },
    onError: (err) => toast.error(err.message),
  });

  const importableRows = preview ? [...preview.valid, ...preview.warnings] : [];

  function handleClose() {
    setStep("upload");
    setPreview(null);
    setSummary(null);
    onClose();
  }

  const isProcessing = parsePreview.isPending || confirmImport.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${
          step === "upload" ? "max-w-2xl" : "sm:max-w-3xl"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Import Articles</DialogTitle>
          <DialogDescription>
            Upload a PubMed Excel export to preview and import articles.
          </DialogDescription>
        </DialogHeader>

        {isProcessing && (
          <Progress value={confirmImport.isPending ? 66 : 33} className="h-1" />
        )}

        {step === "upload" && (
          <FileUpload
            disabled={parsePreview.isPending}
            onFileSelect={async (file) => {
              const base64 = await fileToBase64(file);
              parsePreview.mutate({ projectId, fileBase64: base64 });
            }}
          />
        )}

        {step === "preview" && preview && <PreviewTable preview={preview} />}

        {step === "summary" && summary && <ImportSummary {...summary} />}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={() =>
                  confirmImport.mutate({
                    projectId,
                    rows: importableRows,
                  })
                }
                disabled={
                  confirmImport.isPending || importableRows.length === 0
                }
              >
                {confirmImport.isPending
                  ? "Importing…"
                  : `Confirm import (${importableRows.length})`}
              </Button>
            </>
          )}
          {step === "summary" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
