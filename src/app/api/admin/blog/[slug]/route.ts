import { NextRequest, NextResponse } from "next/server";
import {
  handleBlogStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { deletePost, getPostBySlug, updatePost } from "@/lib/blog/storage";
import type { UpdateBlogPostInput } from "@/types/blog";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const post = await getPostBySlug(params.slug, { includeDrafts: true });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as UpdateBlogPostInput;
    const post = await updatePost(params.slug, body);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const removed = await deletePost(params.slug);
    if (!removed) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}
