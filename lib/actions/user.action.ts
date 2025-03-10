"use server";

import User from "@/database/user.model";
import { connectToDatabase } from "../mognoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth-options";

interface CurrentUser {
  _id: string;
  email: string;
  name?: string;
  profileImage?: string;
}


export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    const session = await getServerSession(authOptions);
    const currentUser = session?.currentUser as CurrentUser | null;

    const filteredUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      coverImage: user.coverImage,
      profileImage: user.profileImage,
      username: user.username,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      isFollowing: currentUser ? user.followers?.includes(currentUser._id) : false,
    };

    return filteredUser;
  } catch (error) {
    throw error;
  }
}

