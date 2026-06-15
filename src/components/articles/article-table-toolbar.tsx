"use client";

import { useEffect, useRef, useState } from "react";
import type { ReviewStatus } from "../../../generated/prisma";
import { Search } from "lucide-react";

import { Input } from "easySLR/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "easySLR/components/ui/select";
import { toTitleCase } from "easySLR/lib/utils";

export function ArticleTableToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: ReviewStatus | "ALL";
  onStatusChange: (value: ReviewStatus | "ALL") => void;
  sortBy: "year" | "title" | "status";
  onSortByChange: (value: "year" | "title" | "status") => void;
  sortDir: "asc" | "desc";
  onSortDirChange: (value: "asc" | "desc") => void;
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChangeRef.current(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search title or authors…"
          className="pl-9"
        />
      </div>
      <Select
        value={toTitleCase(status)}
        onValueChange={(v) => {
          if (
            v === "ALL" ||
            v === "PENDING" ||
            v === "INCLUDED" ||
            v === "EXCLUDED" ||
            v === "MAYBE"
          ) {
            onStatusChange(v);
          }
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="INCLUDED">Included</SelectItem>
          <SelectItem value="EXCLUDED">Excluded</SelectItem>
          <SelectItem value="MAYBE">Maybe</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={toTitleCase(sortBy)}
        onValueChange={(v) => {
          if (v === "year" || v === "title" || v === "status") onSortByChange(v);
        }}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="year">Year</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={toTitleCase(sortDir)}
        onValueChange={(v) => {
          if (v === "asc" || v === "desc") onSortDirChange(v);
        }}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
