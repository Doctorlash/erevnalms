import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import useRequireAuth from "../../../hooks/useRequireAuth";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

interface CommunityUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

interface CommunityComment {
  id: string;
  content: string;
  createdAt: string;
  user: CommunityUser;
}

interface CommunityLike {
  id: string;
  userId: string;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;

  user: CommunityUser;

  subject?: {
    id: string;
    name: string;
  } | null;

  comments: CommunityComment[];

  likes: CommunityLike[];
}

export default function CommunityPostPage() {
  useRequireAuth();

  const { user } = useAuth();
  const router = useRouter();

  const postId =
    typeof router.query.id === "string" ? router.query.id : undefined;

  const [post, setPost] = useState<CommunityPost | null>(null);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [error, setError] = useState("");

  const loadPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/community/${postId}`);

      setPost(res.data);
    } catch (error) {
      console.error("Failed to load post:", error);
      setError("Unable to load this community post.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  const submitComment = async () => {
    if (!user || !postId) return;

    if (!comment.trim()) {
      return;
    }

    try {
      setCommentLoading(true);

      await api.post("/community/comment", {
        postId,
        userId: user.id,
        content: comment.trim(),
      });

      setComment("");

      await loadPost();
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    const alreadyLiked = post.likes.some((like) => like.userId === user.id);

    try {
      setLikeLoading(true);

      if (alreadyLiked) {
        await api.delete("/community/like", {
          data: {
            postId: post.id,
            userId: user.id,
          },
        });
      } else {
        await api.post("/community/like", {
          postId: post.id,
          userId: user.id,
        });
      }

      await loadPost();
    } catch (error) {
      console.error("Failed to update like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading community post...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !post) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Post Unavailable</h1>

          <p className="text-gray-500 mt-3">
            {error || "This community post could not be found."}
          </p>

          <button
            onClick={() => router.push("/dashboard/community")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Community
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isLiked = post.likes.some((like) => like.userId === user?.id);

  return (
    <DashboardLayout>
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/community")}
        className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
      >
        ← Back to Community
      </button>

      {/* ================= POST ================= */}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Author */}
        <div className="flex items-center gap-4 mb-6">
          {post.user.profileImage ? (
            <img
              src={post.user.profileImage}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              {post.user.firstName?.charAt(0)}
              {post.user.lastName?.charAt(0)}
            </div>
          )}

          <div>
            <p className="font-semibold text-gray-900">
              {post.user.firstName} {post.user.lastName}
            </p>

            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-700">
          {post.title}
        </h1>

        {/* Subject */}
        {post.subject && (
          <div className="mt-4">
            <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              {post.subject.name}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="mt-6 text-gray-700 leading-8 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t">
          <button
            onClick={toggleLike}
            disabled={likeLoading}
            className={`font-semibold transition ${
              isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
            }`}
          >
            {isLiked ? "❤️" : "🤍"} {post.likes.length}
          </button>

          <span className="text-gray-600">💬 {post.comments.length}</span>
        </div>
      </div>

      {/* ================= ADD COMMENT ================= */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Join the Discussion
        </h2>

        <textarea
          className="w-full border border-gray-300 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Write your comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={submitComment}
            disabled={commentLoading || !comment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            {commentLoading ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </div>

      {/* ================= COMMENTS ================= */}

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">
          Comments ({post.comments.length})
        </h2>

        {post.comments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No comments yet. Be the first to join the discussion.
          </div>
        ) : (
          <div className="space-y-4">
            {post.comments.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {item.user.profileImage ? (
                    <img
                      src={item.user.profileImage}
                      alt={`${item.user.firstName} ${item.user.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {item.user.firstName?.charAt(0)}
                      {item.user.lastName?.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.user.firstName} {item.user.lastName}
                        </p>
                      </div>

                      <p className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
