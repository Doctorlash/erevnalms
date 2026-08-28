import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import api from "../../../services/api";

import { Topic } from "../../../types/topic";

export default function SubjectTopicsPage() {
  useStudentAuth();

  const router = useRouter();
  const { id } = router.query;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/topics/subject/${id}`)
      .then((res) => {
        setTopics(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <StudentLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Subject Learning Path</h1>

        <p className="text-indigo-100">
          Follow topics in order and build mastery one lesson at a time.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Total Topics</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {topics.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Learning Status</h3>

          <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Progress Path</h3>

          <p className="text-2xl font-bold text-purple-600 mt-2">Structured</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <p className="text-indigo-600 font-semibold">Loading topics...</p>
        </div>
      )}

      {/* Topics */}
      <div className="grid md:grid-cols-2 gap-6">
        {topics.map((topic, index) => (
          <Link key={topic.id} href={`/dashboard/topics/${topic.id}`}>
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Topic {index + 1}
                  </span>

                  <span className="text-gray-400 text-sm">Learning Module</span>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  {topic.name}
                </h2>

                <p className="text-gray-600 mb-6">
                  {topic.description ||
                    "Interactive lessons, assignments, exams and learning materials are available inside this topic."}
                </p>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-indigo-600">
                    Open Topic
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
      {!loading && topics.length === 0 && (
        <div className="bg-white rounded-3xl p-10 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Topics Available
          </h2>

          <p className="text-gray-500">
            Topics for this subject will appear here when they are created.
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
