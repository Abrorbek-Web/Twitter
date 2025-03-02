"use client";

import { IPost, IUser } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import PostItem from "./post-item";
import useAction from "@/hooks/use-action";
import { getUserPosts } from "@/actions/user.action";

interface Props {
  userId: string;
  user: IUser;
}

const PostFeed = ({ userId, user }: Props) => {
  const { isLoading, setIsLoading, onError } = useAction();
  const [posts, setPosts] = useState<IPost[]>([]);

  // Postlarni olish funksiyasi
  const getPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getUserPosts({ id: userId });

      if (!res?.data || res?.serverError || res?.validationErrors) {
        throw new Error("Something went wrong");
      }

      if (res.data.failure) {
        throw new Error(res.data.failure);
      }

      if (res.data.status === 200) {
        setPosts(res.data.posts || []);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, onError]);

  // useEffect orqali postlarni yuklash
  useEffect(() => {
    getPosts();
  }, [getPosts]);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="animate-spin text-sky-500" />
        </div>
      ) : posts.length > 0 ? (
        posts.map((post) => <PostItem key={post._id} post={post} user={user} />)
      ) : (
        <div className="text-center text-neutral-400 mt-4">No posts found</div>
      )}
    </div>
  );
};

export default PostFeed;
