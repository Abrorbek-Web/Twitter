import Post from "@/database/post.model"
import User from "@/database/user.model"
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mognoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { IPost, IUser} from "@/types"

export async function GET(req: Request, route: { params: { userId: string } }) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const currentUser = session?.user as { _id: string } | null;

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");

    const posts: (IPost & { user: IUser })[] = await Post.find({ user: route.params.userId })
      .populate({
        path: "user",
        model: User,
        select: "name email profileImage _id username",
      })
      .limit(Number(limit))
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
      hasLiked: currentUser ? post.likes.includes(currentUser._id) : false,
      _id: post._id,
    }));

    return NextResponse.json(filteredPosts);
  } catch (error) {
    const result = error as Error;
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
}
