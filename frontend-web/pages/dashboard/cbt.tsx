import { useEffect, useState } from "react";
import Link from "next/link";

import useRequireAuth from "../../hooks/useRequireAuth";

import api from "../../services/api";
import StudentLayout from "@/layouts/StudentLayout";

export default function CBTPage() {
  useRequireAuth();

  const [exams, setExams] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/exams")
      .then((res) => {
        setExams(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <StudentLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">CBT Examination Centre</h1>

        <p className="text-indigo-100">
          Practice for WAEC, NECO, JAMB and internal assessments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Available Exams</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {exams.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Exam Mode</h3>

          <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Platform</h3>

          <p className="text-2xl font-bold text-purple-600 mt-2">Erevna CBT</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <p className="text-indigo-600 font-semibold">
            Loading examinations...
          </p>
        </div>
      )}

      {/* Exam List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {exams.map((exam) => (
          <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}>
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {exam.title}
                </h2>

                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Questions</p>

                    <p className="text-2xl font-bold text-indigo-700">
                      {exam.examQuestions?.length ?? 0}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Duration</p>

                    <p className="text-2xl font-bold text-purple-700">
                      {exam.duration || 0} mins
                    </p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total Marks</p>

                    <p className="text-2xl font-bold text-pink-700">
                      {exam.totalMarks || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Status</p>

                    <p className="text-lg font-bold text-green-700">Ready</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <span className="text-indigo-600 font-semibold">
                    Start Examination
                  </span>

                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {!loading && exams.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Exams Available
          </h2>

          <p className="text-gray-500">
            Published examinations will appear here.
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
