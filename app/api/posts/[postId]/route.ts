import { IPost, IUser} from "@/types"
import { connectToDatabase } from "@/lib/mognoose";
import { NextResponse } from "next/server";
import Post from "@/database/post.model"
import User from "@/database/user.model"

export async function GET(req: Request, route: { params: { postId: string } }) {
  try {
    await connectToDatabase();
    const { postId } = route.params;

    const post: (IPost & { user: IUser }) | null = await Post.findById(postId).populate({
      path: "user",
      model: User,
      select: "name email profileImage _id username",
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    const result = error as Error;
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
}
