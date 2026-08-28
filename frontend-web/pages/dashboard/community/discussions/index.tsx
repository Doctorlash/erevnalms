import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardLayout from "../../../../layouts/DashboardLayout";
import useRequireAuth from "../../../../hooks/useRequireAuth";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role?: string;
  };

  subject?: {
    id: string;
    name: string;
  } | null;

  replies: {
    id: string;
  }[];
}

interface Subject {
  id: string;
  name: string;
}

export default function DiscussionsPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadDiscussions = async () => {
    try {
      setError("");

      const response = await api.get("/community/discussions");

      setDiscussions(response.data);
    } catch (error) {
      console.error("Failed to load discussions:", error);
      setError("Unable to load discussions.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects");

      setSubjects(response.data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  useEffect(() => {
    loadDiscussions();
    loadSubjects();
  }, []);

  const createDiscussion = async () => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter a title and discussion content.");
      return;
    }

    try {
      setCreating(true);

      await api.post("/community/discussions", {
        userId: user.id,
        title: title.trim(),
        content: content.trim(),
        subjectId: subjectId || undefined,
      });

      setTitle("");
      setContent("");
      setSubjectId("");

      await loadDiscussions();
    } catch (error: any) {
      console.error("Failed to create discussion:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create discussion. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-indigo-700">Discussions</h1>

            <p className="text-gray-600 mt-2">
              Ask questions, share ideas and discuss academic topics with the
              Erevna community.
            </p>
          </div>

          <Link
            href="/dashboard/community"
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold"
          >
            ← Community Feed
          </Link>
        </div>
      </div>

      {/* CREATE DISCUSSION */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Start a Discussion
        </h2>

        <input
          type="text"
          placeholder="Discussion title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a subject (optional)</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <textarea
          placeholder="What would you like to discuss?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={createDiscussion}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {creating ? "Creating..." : "Start Discussion"}
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* DISCUSSIONS */}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Loading discussions...
        </div>
      ) : discussions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-700">
            No discussions yet
          </h3>

          <p className="text-gray-500 mt-2">
            Start the first discussion in the community.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {discussions.map((discussion) => (
            <Link
              key={discussion.id}
              href={`/dashboard/community/discussions/${discussion.id}`}
              className="block"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 hover:text-indigo-600">
                      {discussion.title}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {discussion.user.firstName} {discussion.user.lastName}
                    </p>
                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(discussion.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {discussion.subject && (
                  <div className="mt-3">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {discussion.subject.name}
                    </span>
                  </div>
                )}

                <p className="mt-4 text-gray-700 line-clamp-3">
                  {discussion.content}
                </p>

                <div className="mt-5 pt-4 border-t text-gray-600 font-medium">
                  💬 {discussion.replies.length}{" "}
                  {discussion.replies.length === 1 ? "Reply" : "Replies"}
                  <span className="float-right text-indigo-600">
                    Open Discussion →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
