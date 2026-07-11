import { auth } from "@/lib/auth";
import { LibraryClient } from "./client";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return <LibraryClient />;
}
