import { auth } from "@/lib/auth";
import { countProducts } from "@/lib/db/products";
import { countContents } from "@/lib/db/contents";
import { countSchedules } from "@/lib/db/schedules";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [productCount, contentCount, pendingSchedules, publishedCount] = await Promise.all([
    countProducts(userId),
    countContents(userId),
    countSchedules(userId, "pending"),
    countSchedules(userId, "published"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Products</p>
          <p className="text-3xl font-bold">{productCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Generated Content</p>
          <p className="text-3xl font-bold">{contentCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-3xl font-bold">{pendingSchedules}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-3xl font-bold">{publishedCount}</p>
        </Card>
      </div>
    </div>
  );
}
