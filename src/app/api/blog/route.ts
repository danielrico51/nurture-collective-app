import { NextResponse } from "next/server";
import { handleBlogStorageError } from "@/lib/api/routeHelpers";
import { listPublishedPosts } from "@/lib/blog/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await listPublishedPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}
