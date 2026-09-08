import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

import { Subject } from "../../types/subject";

interface StudentEnrollment {
  enrollmentId: string;
  programme: "JAMB" | "WAEC";
  enrolledAt: string;
  subject: Subject;
}

export default function SubjectsPage() {
  useStudentAuth();

  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMySubjects = async () => {
      try {
        setLoading(true);
        setError("");

        /**
         * This endpoint returns only subjects the authenticated
         * student is enrolled in.
         *
         * Backend response:
         * {
         *   enrollmentId,
         *   programme,
         *   enrolledAt,
         *   subject
         * }
         *
         * Do NOT change this to /subjects.
         * /subjects is ADMIN only.
         */
        const response = await api.get<StudentEnrollment[]>(
          "/subjects/my-subjects",
        );

        setEnrollments(response.data);
      } catch (err) {
        console.error("Failed to load student subjects:", err);

        setEnrollments([]);
        setError("Unable to load your subjects right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMySubjects();
  }, []);

  return (
    <StudentLayout>
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl text-white p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">My Subjects</h1>

        <p className="text-indigo-100">
          Access the subjects you are enrolled in and continue your learning
          journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Enrolled Subjects</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {enrollments.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Learning Status</h3>

          <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Platform</h3>

          <p className="text-2xl font-bold text-purple-600 mt-2">Erevna LMS</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <p className="text-indigo-600 font-semibold">
            Loading your subjects...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {/* Subjects */}
      {!loading && !error && enrollments.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const subject = enrollment.subject;

            return (
              <Link
                key={enrollment.enrollmentId}
                href={`/dashboard/subjects/${subject.id}`}
                className="block h-full"
              >
                <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group h-full">
                  <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

                  <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-700 transition">
                        {subject.name}
                      </h2>

                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Enrolled
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="inline-flex bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {enrollment.programme}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-6 min-h-[60px]">
                      {subject.description ||
                        "Learning materials, lessons, assignments and exams are available inside this subject."}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-indigo-600 font-semibold">
                        Open Subject
                      </span>

                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                        →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && enrollments.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">📚</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Subjects Yet
          </h2>

          <p className="text-gray-500 max-w-xl mx-auto">
            You are not currently enrolled in any subjects. Your subjects will
            appear here once your enrollment has been approved.
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
