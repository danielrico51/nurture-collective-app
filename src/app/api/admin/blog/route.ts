import { NextRequest, NextResponse } from "next/server";
import {
  handleBlogStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { createPost, listAllPosts, seedBlogSamplesIfEmpty } from "@/lib/blog/storage";
import type { CreateBlogPostInput } from "@/types/blog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    if (request.nextUrl.searchParams.get("seed") === "true") {
      await seedBlogSamplesIfEmpty();
    }
    const posts = await listAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as CreateBlogPostInput;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const post = await createPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return handleBlogStorageError(error);
  }
}
