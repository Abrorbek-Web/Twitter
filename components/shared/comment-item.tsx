"use client";

import { IComment, IUser } from "@/types";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { sliceText } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { FaHeart } from "react-icons/fa";
import { AiFillDelete } from "react-icons/ai";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useAction from "@/hooks/use-action";
import {
  deleteComment,
  likeComment,
  unlikeComment,
} from "@/actions/comment.action";

interface Props {
  comment: IComment;
  user: IUser;
}

const CommentItem = ({ comment, user }: Props) => {
  const { onError } = useAction();
  const [isLiking, setIsLiking] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const router = useRouter();

  const onLike = async () => {
    setIsLiking(true);
    let res;
    if (!comment.hasLiked) {
      res = await likeComment({ id: comment._id });
    } else {
      res = await unlikeComment({ id: comment._id });
    }
    setIsLiking(false);

    if (res?.serverError || res?.validationErrors || !res?.data) {
      return onError("Something went wrong");
    }
    if (res.data.failure) {
      return onError(res.data.failure);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    const res = await deleteComment({ id: comment._id });
    setIsDeleting(false);

    if (res?.serverError || res?.validationErrors || !res?.data) {
      return onError("Something went wrong");
    }
    if (res.data.failure) {
      return onError(res.data.failure);
    }
  };

  const goToProfile = (evt: React.MouseEvent<HTMLDivElement>) => {
    evt.stopPropagation();
    router.push(`/profile/${user._id}`);
  };

  return (
    <div className="border-b-[1px] border-neutral-800 p-5 cursor-pointer hover:bg-neutral-900 transition relative">
      <div className="flex flex-row items-center gap-3">
        <Avatar onClick={goToProfile}>
          <AvatarImage src={comment?.user.profileImage} />
          <AvatarFallback>{comment?.user.name[0]}</AvatarFallback>
        </Avatar>

        <div>
          <div
            className="flex flex-row items-center gap-2"
            onClick={goToProfile}
          >
            <p className="text-white font-semibold cursor-pointer hover:underline">
              {comment?.user.name}
            </p>
            <span className="text-neutral-500 cursor-pointer hover:underline hidden md:block">
              {comment.user.username
                ? `@${sliceText(comment.user.username, 20)}`
                : sliceText(comment.user.email, 20)}
            </span>
            <span className="text-neutral-500 text-sm">
              {comment.createdAt &&
                formatDistanceToNowStrict(new Date(comment.createdAt))}
            </span>
          </div>
          <div className="text-white mt-1">{comment.body}</div>

          <div className="flex flex-row items-center mt-3 gap-10">
            <button
              className="flex flex-row items-center text-neutral-500 gap-2 transition hover:text-red-500"
              onClick={onLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="animate-spin text-red-500" size={20} />
              ) : (
                <FaHeart size={20} color={comment.hasLiked ? "red" : ""} />
              )}
              <p>{comment.likes || 0}</p>
            </button>

            {comment.user._id === user._id && (
              <button
                className="flex flex-row items-center text-neutral-500 gap-2 transition hover:text-red-500"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin text-red-500" size={20} />
                ) : (
                  <AiFillDelete size={20} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
