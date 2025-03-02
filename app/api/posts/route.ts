import Post from "@/database/post.model";
import User from "@/database/user.model";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mognoose";

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
console.log("Hello1");

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");

    // `limit` noto‘g‘ri qiymat bo‘lmasligi uchun xavfsiz tarzda ishlov beramiz
    const safeLimit = limitParam ? Number(limitParam) || 10 : 10; // Agar noto‘g‘ri qiymat bo‘lsa, 10 dan foydalanamiz

    const posts = await Post.find({})
      .populate({
        path: "user",
        model: User,
        select: "name email profileImage _id username",
      })
      .limit(safeLimit) // `limit` har doim `number` turida bo‘ladi
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
      likes: Array.isArray(post.likes) ? post.likes.length : 0, // `likes` array ekanligini tekshiramiz
      comments: Array.isArray(post.comments) ? post.comments.length : 0,
      // hasLiked: Array.isArray(post.likes) ? post.likes.some((like: string) => like.toString() === currentUserId) : false,
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