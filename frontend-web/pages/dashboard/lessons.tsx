import { useEffect, useMemo, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  videoUrl?: string | null;
  duration?: number | null;
  status: string;
  isPublished: boolean;
  createdAt: string;

  topic?: {
    id: string;
    name: string;

    subject?: {
      id: string;
      name: string;
    };
  };

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function StudentLessonsPage() {
  const { user } = useStudentAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/lessons");

      setLessons(response.data);
    } catch (err: any) {
      console.error("Failed to load lessons:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load lessons. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    loadLessons();
  }, [user]);

  /*
   * Extract unique subjects from lessons.
   */
  const subjects = useMemo(() => {
    const subjectMap = new Map<string, string>();

    lessons.forEach((lesson) => {
      const subject = lesson.topic?.subject;

      if (subject) {
        subjectMap.set(subject.id, subject.name);
      }
    });

    return Array.from(subjectMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [lessons]);

  /*
   * Filter lessons by search and subject.
   */
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        !searchTerm ||
        lesson.title.toLowerCase().includes(searchTerm) ||
        lesson.description?.toLowerCase().includes(searchTerm) ||
        lesson.topic?.name.toLowerCase().includes(searchTerm) ||
        lesson.topic?.subject?.name.toLowerCase().includes(searchTerm);

      const matchesSubject =
        selectedSubject === "ALL" ||
        lesson.topic?.subject?.id === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [lessons, search, selectedSubject]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />

            <p className="text-gray-500 mt-4">Loading your lessons...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lessons</h1>

        <p className="text-gray-500 mt-2">
          Explore approved lessons and continue your learning journey.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <p>{error}</p>

          <button
            onClick={loadLessons}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Lessons
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lesson, topic or subject..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Subjects</option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Available Lessons
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredLessons.length}{" "}
            {filteredLessons.length === 1 ? "lesson" : "lessons"} found
          </p>
        </div>

        {(search || selectedSubject !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedSubject("ALL");
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-5xl mb-4">📚</div>

          <h2 className="text-xl font-bold text-slate-900">No lessons found</h2>

          <p className="text-gray-500 mt-2">
            {lessons.length === 0
              ? "There are no published lessons available yet."
              : "Try changing your search or subject filter."}
          </p>
        </div>
      ) : (
        /* Lesson cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                    {lesson.topic?.subject?.name || "Subject"}
                  </span>

                  {lesson.duration && (
                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                      {lesson.duration} min
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold leading-tight">
                  {lesson.title}
                </h3>

                <p className="text-blue-100 text-sm mt-2">
                  {lesson.topic?.name || "Topic"}
                </p>
              </div>

              {/* Card body */}
              <div className="p-6 flex-1 flex flex-col">
                {lesson.description ? (
                  <p className="text-gray-600 text-sm leading-6 line-clamp-3">
                    {lesson.description}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">
                    No description provided.
                  </p>
                )}

                {/* Lesson metadata */}
                <div className="mt-5 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>📖</span>

                    <span>Topic: {lesson.topic?.name || "Not specified"}</span>
                  </div>

                  {lesson.videoUrl && (
                    <div className="flex items-center gap-2">
                      <span>🎥</span>

                      <span>Video available</span>
                    </div>
                  )}

                  {lesson.createdBy && (
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>

                      <span>
                        {lesson.createdBy.firstName} {lesson.createdBy.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="mt-auto pt-6">
                  <a
                    href={`/dashboard/student/lessons/${lesson.id}`}
                    className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition"
                  >
                    Start Lesson
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
