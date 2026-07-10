import Link from "next/link";
import { auth } from "@/lib/auth";
import { listSchedules } from "@/lib/db/schedules";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const schedules = await listSchedules(session.user.id);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          New Schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
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
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge>{s.platform}</Badge>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status] || ""}`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{s.product.title}</p>
                  <p className="text-sm text-muted-foreground">
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
      )}
    </div>
  );
}
