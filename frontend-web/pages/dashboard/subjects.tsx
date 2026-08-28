import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

import { Subject } from "../../types/subject";

export default function SubjectsPage() {
  useStudentAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        setSubjects(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <StudentLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl text-white p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">My Subjects</h1>

        <p className="text-indigo-100">
          Explore your subjects, lessons, exams, assignments and learning
          resources.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Total Subjects</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {subjects.length}
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
          <p className="text-indigo-600 font-semibold">Loading subjects...</p>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`}>
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-700 transition">
                    {subject.name}
                  </h2>

                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Subject
                  </span>
                </div>

                <p className="text-gray-600 mb-6 min-h-[60px]">
                  {subject.description ||
                    "Comprehensive learning materials, lessons, assignments and exams available."}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-indigo-600 font-semibold">
                    Open Subject
                  </span>

                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {!loading && subjects.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center mt-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Subjects Available
          </h2>

          <p className="text-gray-500">
            Subjects will appear here once they are assigned to you.
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
