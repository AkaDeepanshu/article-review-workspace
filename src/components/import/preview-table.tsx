"use client";

import type { RouterOutputs } from "easySLR/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "easySLR/components/ui/table";
import { cn } from "easySLR/lib/utils";

type PreviewResult = RouterOutputs["import"]["parsePreview"];
type Row = PreviewResult["valid"][number];

function borderColor(category: "warnings" | "errors" | "duplicates") {
  if (category === "warnings") return "border-l-amber-500";
  return "border-l-red-500";
}

function RowTable({
  rows,
  category,
  title,
  note,
}: {
  rows: Row[];
  category: "warnings" | "errors" | "duplicates";
  title: string;
  note: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium">
          {title} ({rows.length})
        </h4>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Row</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">PMID</TableHead>
              <TableHead>Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.rowNumber}
                className={cn("border-l-4", borderColor(category))}
              >
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {row.title ?? "—"}
                </TableCell>
                <TableCell>{row.pmid ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {[...row.warnings, ...row.errors].join("; ") || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function PreviewTable({ preview }: { preview: PreviewResult }) {
  const validCount = preview.valid.length;
  const warningCount = preview.warnings.length;
  const errorCount = preview.errors.length;
  const duplicateCount = preview.duplicates.length;

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold">Import Preview</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {validCount} valid · {warningCount} warnings · {errorCount} errors ·{" "}
          {duplicateCount} duplicates
        </p>
      </div>

      <RowTable
        rows={preview.warnings}
        category="warnings"
        title="⚠️ Rows with warnings"
        note="will be imported"
      />
      <RowTable
        rows={preview.errors}
        category="errors"
        title="❌ Rows with errors"
        note="will be skipped"
      />
      <RowTable
        rows={preview.duplicates}
        category="duplicates"
        title="🔁 Duplicate rows"
        note="will be skipped"
      />

      {warningCount === 0 && errorCount === 0 && duplicateCount === 0 && (
        <p className="text-sm text-muted-foreground">
          All {validCount} rows look good — no issues to review.
        </p>
      )}
    </div>
  );
}
