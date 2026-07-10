import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSchedules, createSchedule, deleteSchedule } from "@/lib/db/schedules";
import { getProduct } from "@/lib/db/products";
import { getContent } from "@/lib/db/contents";
import { createScheduleSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await listSchedules(session.user.id);
    return NextResponse.json({ data: schedules });
  } catch (error) {
    console.error("Failed to list schedules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, contentId, platform, scheduledAt } = parsed.data;

    const product = await getProduct(productId);
    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const content = await getContent(contentId);
    if (!content || content.userId !== session.user.id) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const schedule = await createSchedule({
      userId: session.user.id,
      productId,
      contentId,
      platform,
      scheduledAt: new Date(scheduledAt),
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    await deleteSchedule(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
