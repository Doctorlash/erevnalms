import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import api from "../../../services/api";

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

  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  progress: number;
  lastViewed?: string | null;
}

export default function StudentLessonDetailPage() {
  const { user } = useStudentAuth();

  const router = useRouter();

  const { id } = router.query;

  const lessonId = typeof id === "string" ? id : "";

  const [lesson, setLesson] = useState<Lesson | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [completed, setCompleted] = useState(false);

  const [progress, setProgress] = useState(0);

  const [progressLoading, setProgressLoading] = useState(true);

  const [progressError, setProgressError] = useState("");

  /**
   * Load the lesson
   */
  const loadLesson = async () => {
    if (!lessonId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/lessons/${lessonId}`);

      setLesson(response.data);
    } catch (error: any) {
      console.error("Failed to load lesson:", error);

      setError(error?.response?.data?.message || "Unable to load this lesson.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load student's progress for this lesson
   */
  const loadProgress = async () => {
    if (!user?.id || !lessonId) {
      return;
    }

    try {
      setProgressLoading(true);
      setProgressError("");

      const response = await api.get(`/progress/student/${user.id}`);

      const studentProgress: LessonProgress[] = response.data;

      const lessonProgress = studentProgress.find(
        (item) => item.lessonId === lessonId,
      );

      if (lessonProgress) {
        setCompleted(lessonProgress.completed === true);

        setProgress(
          typeof lessonProgress.progress === "number"
            ? lessonProgress.progress
            : 0,
        );
      } else {
        setCompleted(false);
        setProgress(0);
      }
    } catch (error: any) {
      console.error("Failed to load lesson progress:", error);

      setProgressError(
        error?.response?.data?.message ||
          "Unable to load your lesson progress.",
      );
    } finally {
      setProgressLoading(false);
    }
  };

  /**
   * Load lesson when router is ready
   */
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!lessonId) {
      return;
    }

    loadLesson();
  }, [router.isReady, lessonId]);

  /**
   * Load progress after authenticated user
   * and lesson ID are available.
   */
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!user?.id || !lessonId) {
      return;
    }

    loadProgress();
  }, [router.isReady, user?.id, lessonId]);

  /**
   * Mark lesson as completed
   */
  const markLessonComplete = async () => {
    if (!user?.id || !lessonId) {
      setProgressError("Unable to identify your account or this lesson.");

      return;
    }

    if (completed) {
      return;
    }

    try {
      setProgressLoading(true);
      setProgressError("");

      await api.post("/progress/complete", {
        userId: user.id,
        lessonId,
      });

      setCompleted(true);
      setProgress(100);

      alert("Lesson completed successfully!");
    } catch (error: any) {
      console.error("Failed to complete lesson:", error);

      setProgressError(
        error?.response?.data?.message ||
          "Unable to save your lesson progress.",
      );
    } finally {
      setProgressLoading(false);
    }
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center py-20">
          <p className="text-gray-500">Loading lesson...</p>
        </div>
      </StudentLayout>
    );
  }

  /**
   * Error state
   */
  if (error || !lesson) {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Lesson unavailable
            </h1>

            <p className="text-gray-500 mt-3">
              {error || "This lesson could not be found."}
            </p>

            <button
              onClick={() => router.push("/dashboard/student/lessons")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Back to Lessons
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}

        <button
          onClick={() => router.push("/dashboard/student/lessons")}
          className="text-blue-600 hover:underline mb-6"
        >
          ← Back to Lessons
        </button>

        {/* Lesson Header */}

        <div className="bg-white rounded-2xl shadow p-8 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {lesson.topic?.subject?.name && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {lesson.topic.subject.name}
              </span>
            )}

            {lesson.topic?.name && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {lesson.topic.name}
              </span>
            )}

            {lesson.duration && (
              <span className="text-sm text-gray-500">
                {lesson.duration} minutes
              </span>
            )}

            {completed && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                ✓ Completed
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-slate-900">{lesson.title}</h1>

          {lesson.description && (
            <p className="text-lg text-gray-600 mt-4 leading-7">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Lesson Progress */}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Progress
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Track your completion of this lesson.
              </p>
            </div>

            <span className="text-lg font-bold text-blue-600">{progress}%</span>
          </div>

          {/* Progress bar */}

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {progressError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {progressError}
            </div>
          )}

          {/* Completion button */}

          <div className="mt-5">
            {completed ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
                <p className="font-semibold">✓ Lesson completed</p>

                <p className="text-sm mt-1">
                  You have successfully completed this lesson.
                </p>
              </div>
            ) : (
              <button
                onClick={markLessonComplete}
                disabled={progressLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {progressLoading ? "Saving..." : "Mark Lesson Complete"}
              </button>
            )}
          </div>
        </div>

        {/* Video */}

        {lesson.videoUrl && (
          <div className="bg-white rounded-2xl shadow p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Lesson Video
            </h2>

            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg"
            >
              Watch Lesson Video
            </a>
          </div>
        )}

        {/* Lesson Content */}

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Lesson Content
          </h2>

          <article className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-8">
              {lesson.content}
            </div>
          </article>
        </div>

        {/* Bottom completion area */}

        <div className="bg-white rounded-2xl shadow p-8 mt-6 mb-10">
          <h2 className="text-xl font-bold text-slate-900">
            Finished this lesson?
          </h2>

          <p className="text-gray-500 mt-2">
            Once you have finished reading or watching the lesson, mark it as
            complete.
          </p>

          {progressError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3">
              {progressError}
            </div>
          )}

          <button
            onClick={markLessonComplete}
            disabled={completed || progressLoading}
            className={`mt-5 px-6 py-3 rounded-lg font-semibold text-white ${
              completed
                ? "bg-green-600 cursor-default"
                : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            }`}
          >
            {completed
              ? "✓ Lesson Completed"
              : progressLoading
                ? "Saving..."
                : "Mark Lesson Complete"}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
