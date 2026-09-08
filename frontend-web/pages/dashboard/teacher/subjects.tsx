import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";

interface TeacherSubject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
  isActive: boolean;
  _count?: {
    topics?: number;
    lessons?: number;
  };
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/subjects/my-subjects/teacher");

      setSubjects(response.data || []);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message.join(", "));
      } else {
        setError(
          typeof message === "string"
            ? message
            : "Unable to load your assigned subjects.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  return (
    <TeacherLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>

            <p className="mt-2 text-sm text-gray-600">
              These are the JAMB and WAEC subjects currently assigned to you.
            </p>
          </div>

          <a
            href="/dashboard/teacher/applications"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Apply for a Subject
          </a>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-gray-500">
                Loading your subjects...
              </p>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-7 w-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              No subjects assigned yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              You don't currently have any subjects assigned to you. Apply for
              JAMB or WAEC subjects and wait for an administrator to review your
              application.
            </p>

            <a
              href="/dashboard/teacher/applications"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Subject Applications
            </a>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Assigned Subjects
              </h2>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {subjects.length}{" "}
                {subjects.length === 1 ? "subject" : "subjects"}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subject.name}
                      </h3>

                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {subject.programme}
                      </span>
                    </div>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Assigned
                    </span>
                  </div>

                  {subject.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Topics</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {subject._count?.topics ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Lessons</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {subject._count?.lessons ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TeacherLayout>
  );
}
