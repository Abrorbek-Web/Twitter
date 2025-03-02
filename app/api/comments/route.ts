import Comment from "@/database/comment.model";
import Notification from "@/database/notification.model";
import Post from "@/database/post.model";
import User from "@/database/user.model";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mognoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// interface SessionUser {
//   id?: string;
//   _id?: mongoose.Types.ObjectId;
//   email?: string;
// }

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { body, postId, userId } = await req.json();

    if (!body || !postId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await Comment.create({ body, post: postId, user: userId });

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment._id } },
      { new: true }
    );

    if (!post || !post.user) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await Notification.create({
      user: String(post.user),
      body: "Someone replied to your post!",
    });

    await User.findByIdAndUpdate(post.user, { hasNewNotifications: true });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = user._id.toString();
    const { commentId } = await req.json();

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (!comment.likes.includes(currentUserId)) {
      comment.likes.push(new mongoose.Types.ObjectId(currentUserId));
      await comment.save();

      await Notification.create({
        user: String(comment.user),
        body: "Someone liked your comment!",
      });

      await User.findByIdAndUpdate(comment.user, { hasNewNotifications: true });
    }

    return NextResponse.json({ message: "Comment liked" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = user._id.toString();
    const { commentId } = await req.json();

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    comment.likes = comment.likes.filter(
      (like: mongoose.Types.ObjectId) => like.toString() !== currentUserId
    );
    await comment.save();

    return NextResponse.json({ message: "Comment unliked" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
