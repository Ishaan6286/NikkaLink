"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { URLTable } from "@/components/dashboard/URLTable";
import { CreateURLModal } from "@/components/dashboard/CreateURLModal";
import { useURLs } from "@/hooks/useURLs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

export default function URLsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useURLs({
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    query: debouncedSearch || undefined,
  });

  const urls = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} link{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            New NikkaLink
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search URLs or aliases…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-2 items-center">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={sortBy}
              onValueChange={(v) => { if (v) { setSortBy(v); setPage(1); } }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created date</SelectItem>
                <SelectItem value="total_clicks">Total clicks</SelectItem>
                <SelectItem value="short_code">Short code</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(v) => { setSortOrder(v as "asc" | "desc"); setPage(1); }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <URLTable urls={urls} isLoading={isLoading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateURLModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
