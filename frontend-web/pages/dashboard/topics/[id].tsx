import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import api from "../../../services/api";

import { Topic } from "../../../types/topic";
import { Lesson } from "../../../types/lesson";

interface TopicWithSubject extends Topic {
  subject?: {
    id: string;
    name: string;
    description?: string;
    programme?: "JAMB" | "WAEC";
  };
}

export default function TopicLessonsPage() {
  useStudentAuth();

  const router = useRouter();

  const [topic, setTopic] = useState<TopicWithSubject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const topicId =
      typeof router.query.id === "string" ? router.query.id : null;

    if (!topicId) {
      setLoading(false);
      setError("Invalid topic.");
      return;
    }

    const loadTopicAndLessons = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * STUDENT TOPIC ENDPOINT
         *
         * The backend verifies that the authenticated student
         * is enrolled in the topic's subject.
         */
        const topicResponse = await api.get<TopicWithSubject>(
          `/topics/student/${topicId}`,
        );

        setTopic(topicResponse.data);

        /*
         * Load only published lessons belonging to this topic.
         *
         * The lessons service returns:
         * - APPROVED lessons
         * - Published lessons
         */
        const lessonsResponse = await api.get<Lesson[]>(
          `/lessons/topic/${topicId}`,
        );

        setLessons(lessonsResponse.data);
      } catch (err: any) {
        console.error("Failed to load topic and lessons:", err);

        setTopic(null);
        setLessons([]);

        const status = err?.response?.status;

        if (status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (status === 403) {
          setError("You do not have permission to access this topic.");
        } else if (status === 404) {
          setError("This topic could not be found.");
        } else {
          setError("Unable to load this topic right now. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadTopicAndLessons();
  }, [router.isReady, router.query.id]);

  const handleBackToSubjects = () => {
    router.push("/dashboard/subjects");
  };

  const handleBackToTopicSubject = () => {
    if (!topic?.subjectId) {
      router.push("/dashboard/subjects");
      return;
    }

    router.push(`/dashboard/subjects/${topic.subjectId}`);
  };

  return (
    <StudentLayout>
      {/* =========================
          LOADING STATE
      ========================== */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">📖</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            Loading Topic
          </h2>

          <p className="text-gray-500">
            Please wait while we load the topic and lessons...
          </p>
        </div>
      )}

      {/* =========================
          ERROR STATE
      ========================== */}
      {!loading && error && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">🔒</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            Unable to Open Topic
          </h2>

          <p className="text-gray-500 max-w-xl mx-auto mb-6">{error}</p>

          <button
            type="button"
            onClick={handleBackToSubjects}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            ← Back to My Subjects
          </button>
        </div>
      )}

      {/* =========================
          TOPIC CONTENT
      ========================== */}
      {!loading && !error && topic && (
        <>
          {/* =========================
              BREADCRUMB
          ========================== */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6">
            <Link
              href="/dashboard/subjects"
              className="hover:text-indigo-600 transition"
            >
              My Subjects
            </Link>

            <span>›</span>

            {topic.subjectId && (
              <button
                type="button"
                onClick={handleBackToTopicSubject}
                className="hover:text-indigo-600 transition"
              >
                {topic.subject?.name || "Subject"}
              </button>
            )}

            <span>›</span>

            <span className="text-gray-800 font-medium">{topic.name}</span>
          </div>

          {/* =========================
              TOPIC HERO
          ========================== */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    Learning Topic
                  </span>

                  {topic.subject?.programme && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                      {topic.subject.programme}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {topic.name}
                </h1>

                <p className="text-indigo-100 max-w-3xl text-lg">
                  {topic.description ||
                    "Work through the lessons below to build your understanding of this topic."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackToTopicSubject}
                className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-3 font-semibold transition"
              >
                ← Back to Subject
              </button>
            </div>
          </div>

          {/* =========================
              TOPIC STATISTICS
          ========================== */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Lessons</h3>

                  <p className="text-4xl font-bold text-indigo-700 mt-2">
                    {lessons.length}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
                  📚
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Status</h3>

                  <p className="text-2xl font-bold text-green-600 mt-2">
                    Active
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                  ✓
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Subject</h3>

                  <p className="text-xl font-bold text-purple-600 mt-2">
                    {topic.subject?.name || "—"}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">
                  🎓
                </div>
              </div>
            </div>
          </div>

          {/* =========================
              LESSONS HEADER
          ========================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Lessons</h2>

              <p className="text-gray-500 mt-1">
                Select a lesson below to begin learning.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToTopicSubject}
              className="text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              ← Back to Subject
            </button>
          </div>

          {/* =========================
              LESSONS
          ========================== */}
          {lessons.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {lessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  href={`/dashboard/lessons/${lesson.id}`}
                  className="block h-full"
                >
                  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full group">
                    <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Lesson {index + 1}
                        </span>

                        {lesson.duration && (
                          <span className="text-gray-400 text-sm">
                            {lesson.duration} mins
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-indigo-700 transition">
                        {lesson.title}
                      </h3>

                      <p className="text-gray-600 mb-6">
                        {lesson.description ||
                          "Open this lesson to access the learning content."}
                      </p>

                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-semibold text-indigo-600">
                          Open Lesson
                        </span>

                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* =========================
              EMPTY LESSON STATE
          ========================== */}
          {lessons.length === 0 && (
            <div className="bg-white rounded-3xl p-10 shadow-lg text-center">
              <div className="text-5xl mb-5">📚</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                No Lessons Available
              </h2>

              <p className="text-gray-500 max-w-xl mx-auto mb-6">
                There are currently no approved and published lessons available
                for this topic. Please check back later.
              </p>

              <button
                type="button"
                onClick={handleBackToTopicSubject}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                ← Back to Subject
              </button>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}
