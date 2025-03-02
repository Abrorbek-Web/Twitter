"use client";

import { IPost, IUser } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

  const getPosts = async () => {
    setIsLoading(true);
    const res = await getUserPosts({ id: userId });
    
    if (res?.serverError || res?.validationErrors || !res?.data) {
      setIsLoading(false);
      onError("Something went wrong");
      return;
    }
    
    if (res.data.failure) {
      setIsLoading(false);
      onError(res.data.failure);
      return;
    }
    
    if (res.data.status === 200) {
      setPosts(res.data.posts || []);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    getPosts();
  }, [userId]);

  return isLoading ? (
    <div className="flex justify-center items-center h-24">
      <Loader2 className="animate-spin text-sky-500" />
    </div>
  ) : (
    posts.map((post) => <PostItem key={post._id} post={post} user={user} />)
  );
};

export default PostFeed;
