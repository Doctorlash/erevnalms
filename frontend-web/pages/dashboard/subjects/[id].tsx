import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import api from "../../../services/api";

import { Topic } from "../../../types/topic";
import { Subject } from "../../../types/subject";

interface StudentSubjectResponse {
  enrollmentId: string;
  programme: "JAMB" | "WAEC";
  enrolledAt: string;
  subject: Subject;
}

export default function SubjectTopicsPage() {
  useStudentAuth();

  const router = useRouter();

  const [enrollment, setEnrollment] = useState<StudentSubjectResponse | null>(
    null,
  );

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const subjectId =
      typeof router.query.id === "string" ? router.query.id : null;

    if (!subjectId) {
      setLoading(false);
      setError("Invalid subject.");
      return;
    }

    const loadSubjectAndTopics = async () => {
      try {
        setLoading(true);
        setError("");

        /**
         * Student-only endpoint.
         *
         * The backend verifies that the authenticated student
         * is enrolled in this subject.
         *
         * Do NOT use /subjects/:id.
         * That endpoint is ADMIN only.
         */
        const subjectResponse = await api.get<StudentSubjectResponse>(
          `/subjects/student/${subjectId}`,
        );

        setEnrollment(subjectResponse.data);

        /**
         * Student-only topic endpoint.
         *
         * The backend verifies the student's enrollment
         * before returning the topics.
         */
        const topicsResponse = await api.get<Topic[]>(
          `/topics/student/subject/${subjectId}`,
        );

        setTopics(topicsResponse.data);
      } catch (err: any) {
        console.error("Failed to load subject and topics:", err);

        setEnrollment(null);
        setTopics([]);

        const status = err?.response?.status;

        if (status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (status === 403) {
          setError(
            "You are not enrolled in this subject or you do not have permission to access it.",
          );
        } else if (status === 404) {
          setError("This subject could not be found.");
        } else {
          setError("Unable to load this subject right now. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSubjectAndTopics();
  }, [router.isReady, router.query.id]);

  const handleBackToSubjects = () => {
    router.push("/dashboard/subjects");
  };

  const subject = enrollment?.subject;

  return (
    <StudentLayout>
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">📚</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            Loading Subject
          </h2>

          <p className="text-gray-500">
            Please wait while we load your subject and topics...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">🔒</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            Unable to Open Subject
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

      {/* Subject Content */}
      {!loading && !error && enrollment && subject && (
        <>
          {/* Subject Hero */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    Enrolled Subject
                  </span>

                  <span className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm font-semibold">
                    Active
                  </span>

                  <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-sm font-semibold">
                    {enrollment.programme}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {subject.name}
                </h1>

                <p className="text-indigo-100 max-w-3xl text-lg">
                  {subject.description ||
                    "Follow the topics in this subject and build your mastery one lesson at a time."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackToSubjects}
                className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-3 font-semibold transition"
              >
                ← My Subjects
              </button>
            </div>
          </div>

          {/* Subject Information */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Topics */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Total Topics</h3>

                  <p className="text-4xl font-bold text-indigo-700 mt-2">
                    {topics.length}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
                  📖
                </div>
              </div>
            </div>

            {/* Learning Status */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Learning Status</h3>

                  <p className="text-2xl font-bold text-green-600 mt-2">
                    Active
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                  ✓
                </div>
              </div>
            </div>

            {/* Programme */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 font-medium">Programme</h3>

                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {enrollment.programme}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">
                  🎓
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Information */}
          {subject.teacher && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                  {subject.teacher.firstName?.charAt(0)}
                  {subject.teacher.lastName?.charAt(0)}
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Your Teacher
                  </p>

                  <h3 className="text-xl font-bold text-gray-800">
                    {subject.teacher.firstName} {subject.teacher.lastName}
                  </h3>

                  <p className="text-gray-500">Subject Instructor</p>
                </div>
              </div>
            </div>
          )}

          {/* Topics Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Topics</h2>

              <p className="text-gray-500 mt-1">
                Continue your learning through the topics below.
              </p>
            </div>

            <Link
              href="/dashboard/subjects"
              className="text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              ← My Subjects
            </Link>
          </div>

          {/* Topics List */}
          {topics.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {topics.map((topic, index) => (
                <Link
                  key={topic.id}
                  href={`/dashboard/topics/${topic.id}`}
                  className="block h-full"
                >
                  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full group">
                    <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

                    <div className="p-6 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-4 gap-3">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Topic {index + 1}
                        </span>

                        <span className="text-gray-400 text-sm">
                          Learning Module
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-indigo-700 transition">
                        {topic.name}
                      </h3>

                      <p className="text-gray-600 mb-6">
                        {topic.description ||
                          "Open this topic to access the lessons and learning materials available to you."}
                      </p>

                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-semibold text-indigo-600">
                          Open Topic
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

          {/* Empty Topics State */}
          {topics.length === 0 && (
            <div className="bg-white rounded-3xl p-10 shadow-lg text-center">
              <div className="text-5xl mb-5">📖</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                No Topics Available
              </h2>

              <p className="text-gray-500 max-w-xl mx-auto">
                There are currently no topics available for this subject. Please
                check back later.
              </p>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
}
