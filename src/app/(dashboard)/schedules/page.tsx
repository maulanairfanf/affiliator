"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  content: { content: string; title?: string | null };
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
  const [isLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function fetchItems(pageNum: number, append: boolean) {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(pageNum));
    params.set("pageSize", "20");

    fetch(`/api/schedules?${params}`)
      .then((res) => res.json())
      .then((result: FetchResult) => {
        setItems((prev) => (append ? [...prev, ...result.data] : result.data));
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchItems(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, startDate, endDate]);

  function handleLoadMore() {
    fetchItems(page + 1, true);
  }

  async function handlePostNow(id: string) {
    try {
      await fetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: "pending", scheduledAt: new Date().toISOString() } : i
        )
      );
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch {
      // silent
    }
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
        <Link
          href="/schedules/new"
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          New Schedule
        </Link>
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="space-y-1 sm:flex-1">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="By product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
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
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </Card>

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
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold">
                      {s.content?.title || s.product?.title || "Riddle"}
                    </p>
                    {s.product?.title && s.content?.title && (
                      <p className="text-xs text-muted-foreground">{s.product.title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{s.content?.title ? "Content" : "Riddle"}</Badge>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status] || ""}`}
                      >
                        {s.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.scheduledAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="xs"
                      onClick={() => handlePostNow(s.id)}
                    >
                      Post Now
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </Button>
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
