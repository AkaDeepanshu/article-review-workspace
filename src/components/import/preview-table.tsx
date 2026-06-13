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

function borderColor(row: Row, category: "valid" | "warnings" | "errors" | "duplicates") {
  if (category === "valid") return "border-l-green-500";
  if (category === "warnings") return "border-l-amber-500";
  if (category === "errors" || category === "duplicates") return "border-l-red-500";
  return "";
}

function RowTable({
  rows,
  category,
  title,
}: {
  rows: Row[];
  category: "valid" | "warnings" | "errors" | "duplicates";
  title: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{title} ({rows.length})</h4>
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
                className={cn("border-l-4", borderColor(row, category))}
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
  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      <RowTable rows={preview.valid} category="valid" title="Valid" />
      <RowTable rows={preview.warnings} category="warnings" title="Warnings" />
      <RowTable rows={preview.errors} category="errors" title="Errors" />
      <RowTable rows={preview.duplicates} category="duplicates" title="Duplicates" />
    </div>
  );
}
