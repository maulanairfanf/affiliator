import { auth } from "@/lib/auth";
import { listContents } from "@/lib/db/contents";
import { LibraryClient } from "./client";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await listContents(session.user.id);

  return <LibraryClient contents={contents} />;
}
