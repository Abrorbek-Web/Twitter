import Post from "@/database/post.model";
import User from "@/database/user.model";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mognoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { IPost, IUser } from "@/types";

export async function GET(req: Request, route: { params: { userId: string } }) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const currentUser = session?.user as { _id: string } | null;

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) || 10 : 10; // `limit` noto‘g‘ri bo‘lsa, 10 ni ishlatamiz

    const posts: (IPost & { user: IUser })[] = await Post.find({ user: route.params.userId })
      .populate({
        path: "user",
        model: User,
        select: "name email profileImage _id username",
      })
      .limit(limit) 
      .sort({ createdAt: -1 });
      console.log("Hello");
      

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
      likes: Array.isArray(post.likes) ? post.likes.length : 0, // `likes` mavjudligini tekshiramiz
      comments: Array.isArray(post.comments) ? post.comments.length : 0, // `comments` mavjudligini tekshiramiz
      hasLiked: Array.isArray(post.likes) && currentUser ? post.likes.includes(currentUser._id) : false, // likes mavjudligini tekshiramiz
      _id: post._id,
    }));

    return NextResponse.json(filteredPosts);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
