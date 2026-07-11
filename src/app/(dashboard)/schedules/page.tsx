"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleItem {
  id: string;
  platform: string;
  status: string;
  scheduledAt: string;
  product: { title: string; imageUrl: string | null } | null;
  content: { content: string };
}

interface FetchResult {
  data: ScheduleItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const statusColor: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
];

export default function SchedulesPage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = useCallback(
    async (pageNum: number, append: boolean) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (statusFilter !== "all") params.set("status", statusFilter);
        params.set("page", String(pageNum));
        params.set("pageSize", "20");

        const res = await fetch(`/api/schedules?${params}`);
        const result: FetchResult = await res.json();

        if (append) {
          setItems((prev) => [...prev, ...result.data]);
        } else {
          setItems(result.data);
        }
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchItems(1, false);
  }, [fetchItems]);

  function handleLoadMore() {
    fetchItems(page + 1, true);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">
            {total} schedule{total !== 1 ? "s" : ""} — closest first
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48"
          />
          <Select
            items={statusOptions}
            value={statusFilter}
            onValueChange={(v) => v && setStatusFilter(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link
            href="/schedules/new"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            New
          </Link>
        </div>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">No schedules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a schedule to auto-publish your content.
          </p>
          <Link
            href="/schedules/new"
            className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            New Schedule
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge>{s.platform}</Badge>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status] || ""}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{s.product?.title || "Riddle"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.scheduledAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : `Load More (${total - items.length} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
