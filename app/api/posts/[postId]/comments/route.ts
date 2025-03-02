import Comment from "@/database/comment.model";
import Post from "@/database/post.model"
import User from "@/database/user.model"
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mognoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { IPost, IUser, IComment } from "@/types"

export async function GET(req: Request, route: { params: { postId: string } }) {
  try {
    await connectToDatabase();
    const { postId } = route.params;

    const session = await getServerSession(authOptions);
    const currentUser = session?.user as { _id: string } | null;

    const post: (IPost & { comments: (IComment & { user: IUser })[] }) | null =
      await Post.findById(postId).populate({
        path: "comments",
        model: Comment,
        populate: {
          path: "user",
          model: User,
          select: "name email profileImage _id username",
        },
        options: { sort: { likes: -1 } },
      });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const filteredComments = post.comments.map((item) => ({
      body: item.body,
      createdAt: item.createdAt,
      user: {
        _id: item.user._id,
        name: item.user.name,
        username: item.user.username,
        profileImage: item.user.profileImage,
        email: item.user.email,
      },
      likes: item.likes.length,
      hasLiked: currentUser ? item.likes.includes(currentUser._id) : false,
      _id: item._id,
    }));

    return NextResponse.json(filteredComments);
  } catch (error) {
    const result = error as Error;
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
}
