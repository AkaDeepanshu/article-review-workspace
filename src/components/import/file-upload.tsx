"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

import { cn } from "easySLR/lib/utils";

export function FileUpload({
  onFileSelect,
  disabled,
}: {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".xlsx")) {
        alert("Please upload an .xlsx file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be under 5MB");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={cn(
        "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">
        Drop Excel file or click to upload
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PubMed export (.xlsx, max 5MB)
      </p>
      <label className="mt-4 inline-block">
        <span className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Browse files
        </span>
        <input
          type="file"
          accept=".xlsx"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
    </div>
  );
}
