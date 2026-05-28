import { NextRequest, NextResponse } from "next/server";
import { handleBlogStorageError } from "@/lib/api/routeHelpers";
import { getPostBySlug } from "@/lib/blog/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await getPostBySlug(params.slug);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}
