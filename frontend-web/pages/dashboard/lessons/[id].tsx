import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import api from "../../../services/api";

import { Lesson } from "../../../types/lesson";

interface LessonWithRelations extends Lesson {
  topic?: {
    id: string;
    name: string;
    description?: string | null;
    subject?: {
      id: string;
      name: string;
      programme?: "JAMB" | "WAEC";
    } | null;
  } | null;

  Subject?: {
    id: string;
    name: string;
    programme?: "JAMB" | "WAEC";
  } | null;
}

export default function LessonPage() {
  useStudentAuth();

  const router = useRouter();
  const { id } = router.query;

  const lessonId = typeof id === "string" ? id : "";

  const [lesson, setLesson] = useState<LessonWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lessonId) return;

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<LessonWithRelations>(
          `/lessons/${lessonId}`,
        );

        setLesson(response.data);
      } catch (err: any) {
        console.error("Failed to load lesson:", err);

        if (err?.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (err?.response?.status === 403) {
          setError("You do not have access to this lesson.");
        } else if (err?.response?.status === 404) {
          setError("This lesson could not be found.");
        } else {
          setError("Unable to load this lesson right now. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-gray-600">Loading lesson...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !lesson) {
    return (
      <StudentLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold text-red-700">
            Unable to Open Lesson
          </h1>

          <p className="mb-6 text-red-600">{error || "Lesson not found."}</p>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </StudentLayout>
    );
  }

  const subject = lesson.topic?.subject || lesson.Subject || null;

  const topic = lesson.topic;

  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/subjects"
            className="transition hover:text-indigo-600"
          >
            My Subjects
          </Link>

          <span>/</span>

          {subject && (
            <>
              <Link
                href={`/dashboard/subjects/${subject.id}`}
                className="transition hover:text-indigo-600"
              >
                {subject.name}
              </Link>

              <span>/</span>
            </>
          )}

          {topic && (
            <>
              <Link
                href={`/dashboard/topics/${topic.id}`}
                className="transition hover:text-indigo-600"
              >
                {topic.name}
              </Link>

              <span>/</span>
            </>
          )}

          <span className="font-medium text-gray-700">Lesson</span>
        </div>

        {/* Lesson Header */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-8 text-white shadow-xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {subject?.programme && (
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                {subject.programme}
              </span>
            )}

            {lesson.isPremium && (
              <span className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-yellow-900">
                Premium
              </span>
            )}
          </div>

          <h1 className="mb-3 text-3xl font-bold md:text-4xl">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="max-w-3xl text-base leading-7 text-indigo-100 md:text-lg">
              {lesson.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-indigo-100">
            {topic && (
              <span>
                <strong className="text-white">Topic:</strong> {topic.name}
              </span>
            )}

            {lesson.duration !== null && lesson.duration !== undefined && (
              <span>
                <strong className="text-white">Duration:</strong>{" "}
                {lesson.duration} minutes
              </span>
            )}
          </div>
        </div>

        {/* Video */}
        {lesson.videoUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl bg-black shadow-lg">
            <video
              controls
              className="aspect-video w-full"
              src={lesson.videoUrl}
            >
              Your browser does not support video playback.
            </video>
          </div>
        )}

        {/* Lesson Content */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-8 border-b border-gray-200 pb-5">
            <h2 className="text-2xl font-bold text-gray-900">Lesson Content</h2>

            <p className="mt-1 text-sm text-gray-500">
              Study this lesson carefully before proceeding to the next topic.
            </p>
          </div>

          <div className="whitespace-pre-wrap text-base leading-8 text-gray-700">
            {lesson.content}
          </div>
        </article>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap justify-between gap-4">
          {topic ? (
            <Link
              href={`/dashboard/topics/${topic.id}`}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to Topic
            </Link>
          ) : (
            <Link
              href="/dashboard/subjects"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to Subjects
            </Link>
          )}

          <Link
            href="/dashboard/subjects"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            My Subjects
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
