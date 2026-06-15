"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { ReviewStatus } from "../../../generated/prisma";
import { FileText } from "lucide-react";

import { ArticleTableToolbar } from "easySLR/components/articles/article-table-toolbar";
import { BulkActions } from "easySLR/components/articles/bulk-actions";
import { DeleteArticleDialog } from "easySLR/components/articles/delete-article-dialog";
import { NoteCell } from "easySLR/components/articles/note-cell";
import { ReviewStatusSelect } from "easySLR/components/articles/review-status-select";
import { useProjectActions } from "easySLR/components/layout/project-actions-context";
import { EmptyState, ErrorState } from "easySLR/components/ui/empty-state";
import { TableSkeleton } from "easySLR/components/ui/page-skeletons";
import { Button } from "easySLR/components/ui/button";
import { Checkbox } from "easySLR/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "easySLR/components/ui/select";
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

function resetPagination(
  setCurrentCursor: (v: string | undefined) => void,
  setCursorStack: (v: string[]) => void,
) {
  setCurrentCursor(undefined);
  setCursorStack([]);
}

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
  const [pageSize, setPageSize] = useState(25);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );

  const projectActions = useProjectActions();
  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const queryInput = {
    projectId,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    sortBy,
    sortDir,
    limit: pageSize,
    cursor: currentCursor,
  };

  const { data, isLoading, error, refetch } = api.article.list.useQuery(
    queryInput,
  );

  useEffect(() => {
    projectActions?.setActiveFilters({
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      sortBy,
      sortDir,
    });
  }, [search, status, sortBy, sortDir, projectActions?.setActiveFilters]);

  function handleSearchChange(value: string) {
    if (value !== search) {
      resetPagination(setCurrentCursor, setCursorStack);
    }
    setSearch(value);
  }

  function handleStatusChange(value: ReviewStatus | "ALL") {
    setStatus(value);
    resetPagination(setCurrentCursor, setCursorStack);
  }

  function handleSortByChange(value: "year" | "title" | "status") {
    setSortBy(value);
    resetPagination(setCurrentCursor, setCursorStack);
  }

  function handleSortDirChange(value: "asc" | "desc") {
    setSortDir(value);
    resetPagination(setCurrentCursor, setCursorStack);
  }

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
          <NoteCell
            projectId={projectId}
            articleId={row.original.id}
            currentStatus={row.original.review.status}
            currentNote={row.original.review.note}
          />
        ),
      },
      {
        id: "actions",
        header: () => <span className="w-[80px]" />,
        cell: ({ row }) =>
          isOwner ? (
            <DeleteArticleDialog
              projectId={projectId}
              articleId={row.original.id}
              articleTitle={row.original.title}
            />
          ) : null,
      },
    ],
    [projectId, isOwner],
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

  if (isLoading && !data) return <TableSkeleton />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const showPagination =
    cursorStack.length > 0 || !!data?.nextCursor;

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
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDir={sortDir}
        onSortDirChange={handleSortDirChange}
      />

      {data && data.items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {data.items.length} articles
          {showPagination ? ` · Page ${cursorStack.length + 1}` : ""}
        </p>
      )}

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
        <>
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

          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              Page {cursorStack.length + 1}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newStack = [...cursorStack];
                    newStack.pop();
                    setCursorStack(newStack);
                    setCurrentCursor(
                      newStack.length > 0
                        ? newStack[newStack.length - 1]
                        : undefined,
                    );
                  }}
                  disabled={cursorStack.length === 0 || isLoading}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!data?.nextCursor) return;
                    setCursorStack([...cursorStack, data.nextCursor]);
                    setCurrentCursor(data.nextCursor);
                  }}
                  disabled={!data?.nextCursor || isLoading}
                >
                  Next →
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    resetPagination(setCurrentCursor, setCursorStack);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
