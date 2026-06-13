"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { ReviewStatus } from "../../../generated/prisma";
import { FileText, Trash2 } from "lucide-react";

import { ReviewStatusSelect } from "easySLR/components/articles/review-status-select";
import { ArticleTableToolbar } from "easySLR/components/articles/article-table-toolbar";
import { BulkActions } from "easySLR/components/articles/bulk-actions";
import { EmptyState, ErrorState } from "easySLR/components/ui/empty-state";
import { TableSkeleton } from "easySLR/components/ui/page-skeletons";
import { Button } from "easySLR/components/ui/button";
import { Checkbox } from "easySLR/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "easySLR/components/ui/table";
import { api, type RouterOutputs } from "easySLR/trpc/react";

type ArticleItem = RouterOutputs["article"]["list"]["items"][number];

export function ArticleTable({
  projectId,
  isOwner,
  onImportClick,
}: {
  projectId: string;
  isOwner: boolean;
  onImportClick?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"year" | "title" | "status">("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const utils = api.useUtils();
  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const queryInput = {
    projectId,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    sortBy,
    sortDir,
    limit: 50,
  };

  const { data, isLoading, error, refetch } = api.article.list.useQuery(
    queryInput,
  );

  const deleteArticle = api.article.delete.useMutation({
    onSuccess: () => void utils.article.list.invalidate(),
  });

  const columns = useMemo<ColumnDef<ArticleItem>[]>(
    () => [
      {
        id: "select",
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="max-w-md truncate font-medium">
            {row.original.title}
          </div>
        ),
      },
      {
        accessorKey: "firstAuthor",
        header: () => <span className="w-[150px]">First Author</span>,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {(getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "year",
        header: () => <span className="w-[80px]">Year</span>,
        cell: ({ getValue }) => (
          <span className="text-sm">{(getValue() as number | null) ?? "—"}</span>
        ),
      },
      {
        accessorKey: "journal",
        header: () => <span className="w-[180px]">Journal</span>,
        cell: ({ getValue }) => (
          <span className="block max-w-[180px] truncate text-sm text-muted-foreground">
            {(getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: () => <span className="w-[120px]">Status</span>,
        cell: ({ row }) => (
          <ReviewStatusSelect
            projectId={projectId}
            articleId={row.original.id}
            currentStatus={row.original.review.status}
          />
        ),
      },
      {
        id: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="block max-w-[120px] truncate text-xs text-muted-foreground">
            {row.original.review.note ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="w-[80px]" />,
        cell: ({ row }) =>
          isOwner ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                if (confirm("Delete this article?")) {
                  deleteArticle.mutate({
                    projectId,
                    articleId: row.original.id,
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          ) : null,
      },
    ],
    [projectId, isOwner, deleteArticle],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { rowSelection },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    manualSorting: true,
  });

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <BulkActions
          projectId={projectId}
          selectedIds={selectedIds}
          onClear={() => setRowSelection({})}
        />
      )}

      <ArticleTableToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
      />

      {!data?.items.length ? (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Import articles from a PubMed Excel export to start screening."
          action={
            isOwner && onImportClick ? (
              <Button onClick={onImportClick}>Import Articles</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
