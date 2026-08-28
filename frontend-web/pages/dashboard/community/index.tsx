import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardLayout from "../../../layouts/DashboardLayout";
import useRequireAuth from "../../../hooks/useRequireAuth";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

interface Subject {
  id: string;
  name: string;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
  };

  subject?: {
    id: string;
    name: string;
  } | null;

  likes: {
    id: string;
    userId: string;
  }[];

  comments: {
    id: string;
  }[];
}

export default function CommunityPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    try {
      setError("");

      const response = await api.get("/community");

      setPosts(response.data);
    } catch (error) {
      console.error("Failed to load community posts", error);

      setError("Unable to load community posts.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects");

      setSubjects(response.data);
    } catch (error) {
      console.error("Failed to load subjects", error);
    }
  };

  useEffect(() => {
    loadPosts();
    loadSubjects();
  }, []);

  const createPost = async () => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter both a title and content.");
      return;
    }

    try {
      setCreating(true);

      await api.post("/community", {
        userId: user.id,
        title: title.trim(),
        content: content.trim(),
        subjectId: subjectId || undefined,
      });

      setTitle("");
      setContent("");
      setSubjectId("");

      await loadPosts();
    } catch (error) {
      console.error("Failed to create post", error);

      alert("Failed to create post. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleLike = async (postId: string, alreadyLiked: boolean) => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      if (alreadyLiked) {
        await api.delete("/community/like", {
          data: {
            postId,
            userId: user.id,
          },
        });
      } else {
        await api.post("/community/like", {
          postId,
          userId: user.id,
        });
      }

      await loadPosts();
    } catch (error: any) {
      console.error("Failed to update like", error);

      const message =
        error?.response?.data?.message || "Unable to update like.";

      alert(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Community Forum</h1>

        <p className="text-gray-600 mt-2">
          Learn, discuss and connect with other Erevna students.
        </p>
      </div>

      {/* ================= CREATE POST ================= */}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Create a Post</h2>

        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a subject (optional)</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={createPost}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {creating ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* ================= POSTS ================= */}

      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            Loading community posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-700">
              No posts yet
            </h3>

            <p className="text-gray-500 mt-2">
              Be the first person to start a discussion.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const alreadyLiked =
              !!user && post.likes.some((like) => like.userId === user.id);

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* Header */}

                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/dashboard/community/${post.id}`}>
                      <h2 className="font-bold text-xl text-slate-900 hover:text-indigo-600">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-gray-500 mt-1">
                      {post.user.firstName} {post.user.lastName}
                    </p>
                  </div>

                  <div className="text-sm text-gray-400 whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Subject */}

                {post.subject && (
                  <div className="mt-3">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {post.subject.name}
                    </span>
                  </div>
                )}

                {/* Content */}

                <Link href={`/dashboard/community/${post.id}`}>
                  <p className="mt-4 text-gray-700 leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </Link>

                {/* Actions */}

                <div className="flex items-center gap-6 mt-5 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id, alreadyLiked)}
                    className={`font-semibold transition ${
                      alreadyLiked
                        ? "text-indigo-700"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                  >
                    {alreadyLiked ? "💙" : "👍"} {post.likes.length}
                  </button>

                  <Link
                    href={`/dashboard/community/${post.id}`}
                    className="text-gray-600 hover:text-indigo-600 font-semibold"
                  >
                    💬 {post.comments.length}
                  </Link>

                  <Link
                    href={`/dashboard/community/${post.id}`}
                    className="ml-auto text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    View Discussion →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
