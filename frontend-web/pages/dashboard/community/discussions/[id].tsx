import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import DashboardLayout from "../../../../layouts/DashboardLayout";
import useRequireAuth from "../../../../hooks/useRequireAuth";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

interface DiscussionUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  role?: string;
}

interface DiscussionReply {
  id: string;
  content: string;
  createdAt: string;
  user: DiscussionUser;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;

  user: DiscussionUser;

  subject?: {
    id: string;
    name: string;
  } | null;

  replies: DiscussionReply[];
}

export default function DiscussionPage() {
  useRequireAuth();

  const { user } = useAuth();
  const router = useRouter();

  const discussionId =
    typeof router.query.id === "string" ? router.query.id : undefined;

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [reply, setReply] = useState("");

  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DISCUSSION
  // =========================================================

  const loadDiscussion = async () => {
    if (!discussionId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/community/discussions/${discussionId}`);

      setDiscussion(response.data);
    } catch (error) {
      console.error("Failed to load discussion:", error);

      setError("Unable to load this discussion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (discussionId) {
      loadDiscussion();
    }
  }, [discussionId]);

  // =========================================================
  // SUBMIT REPLY
  // =========================================================

  const submitReply = async () => {
    if (!user || !discussionId) {
      return;
    }

    if (!reply.trim()) {
      return;
    }

    try {
      setReplyLoading(true);

      await api.post("/community/discussions/reply", {
        threadId: discussionId,
        userId: user.id,
        content: reply.trim(),
      });

      setReply("");

      await loadDiscussion();
    } catch (error: any) {
      console.error("Failed to add reply:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to post reply. Please try again.",
      );
    } finally {
      setReplyLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading discussion...</p>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (error || !discussion) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Discussion Unavailable
          </h1>

          <p className="text-gray-500 mt-3">
            {error || "This discussion could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/community/discussions")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Discussions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <DashboardLayout>
      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => router.push("/dashboard/community/discussions")}
        className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
      >
        ← Back to Discussions
      </button>

      {/* =====================================================
          DISCUSSION
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* AUTHOR */}

        <div className="flex items-center gap-4 mb-6">
          {discussion.user.profileImage ? (
            <img
              src={discussion.user.profileImage}
              alt={`${discussion.user.firstName} ${discussion.user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              {discussion.user.firstName?.charAt(0)}
              {discussion.user.lastName?.charAt(0)}
            </div>
          )}

          <div>
            <p className="font-semibold text-gray-900">
              {discussion.user.firstName} {discussion.user.lastName}
            </p>

            {discussion.user.role && (
              <p className="text-xs text-indigo-600 font-medium">
                {discussion.user.role}
              </p>
            )}

            <p className="text-sm text-gray-500">
              {new Date(discussion.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* TITLE */}

        <h1 className="text-3xl md:text-4xl font-bold text-indigo-700">
          {discussion.title}
        </h1>

        {/* SUBJECT */}

        {discussion.subject && (
          <div className="mt-4">
            <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              {discussion.subject.name}
            </span>
          </div>
        )}

        {/* CONTENT */}

        <div className="mt-6 text-gray-700 leading-8 whitespace-pre-wrap">
          {discussion.content}
        </div>

        {/* REPLY COUNT */}

        <div className="mt-8 pt-6 border-t text-gray-600">
          💬 <span className="font-semibold">{discussion.replies.length}</span>{" "}
          {discussion.replies.length === 1 ? "Reply" : "Replies"}
        </div>
      </div>

      {/* =====================================================
          REPLY FORM
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Join the Discussion
        </h2>

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write your reply..."
          className="w-full border border-gray-300 rounded-xl p-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={submitReply}
            disabled={replyLoading || !reply.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            {replyLoading ? "Posting..." : "Post Reply"}
          </button>
        </div>
      </div>

      {/* =====================================================
          REPLIES
      ===================================================== */}

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">
          Replies ({discussion.replies.length})
        </h2>

        {discussion.replies.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No replies yet. Be the first to respond.
          </div>
        ) : (
          <div className="space-y-4">
            {discussion.replies.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-start gap-4">
                  {/* AVATAR */}

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
                    {/* REPLY HEADER */}

                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.user.firstName} {item.user.lastName}
                        </p>

                        {item.user.role && (
                          <p className="text-xs text-indigo-600 font-medium">
                            {item.user.role}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* REPLY CONTENT */}

                    <p className="mt-3 text-gray-700 whitespace-pre-wrap leading-7">
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
