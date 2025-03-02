import Post from "@/database/post.model";
import User from "@/database/user.model";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mognoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { CustomSession } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { body, userId } = await req.json();

    if (!body || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const post = await Post.create({ body, user: userId });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const session = (await getServerSession(authOptions)) as CustomSession | null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const posts = await Post.find({})
      .populate({
        path: "user",
        model: User,
        select: "name email profileImage _id username",
      })
      .limit(limit)
      .sort({ createdAt: -1 });

    const filteredPosts = posts.map((post) => ({
      body: post.body,
      createdAt: post.createdAt,
      user: {
        _id: post.user._id,
        name: post.user.name,
        username: post.user.username,
        profileImage: post.user.profileImage,
        email: post.user.email,
      },
      likes: post.likes.length,
      comments: post.comments.length,
      hasLiked: post.likes.some((like: string) => like.toString() === currentUserId),
      _id: post._id,
    }));

    return NextResponse.json(filteredPosts);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const deletedPost = await Post.findByIdAndDelete(postId);
    
    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
