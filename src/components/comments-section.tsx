"use client";

import { useState } from "react";
import { CommentItem } from "@/components/comment-item";
import { CommentInput } from "@/components/comment-input";
import type { Comment } from "@/types/comment";

interface CommentsSectionProps {
  companyId: string;
  initialComments: Comment[];
}

export function CommentsSection({ companyId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const handleCommentAdded = async () => {
    // Fetch the updated comments list
    try {
      const response = await fetch(`/api/companies/${companyId}/comments`);
      if (response.ok) {
        const updatedComments = await response.json();
        setComments(updatedComments.map((c: any) => ({
          id: c.id,
          sellerCompanyId: c.sellerCompanyId,
          authorName: c.authorName,
          content: c.content,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <CommentInput companyId={companyId} onCommentAdded={handleCommentAdded} />
      </div>

      {comments.length > 0 ? (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-muted/10 px-6 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to add one!
        </div>
      )}
    </>
  );
}
