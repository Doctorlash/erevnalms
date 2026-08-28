import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";

import api from "../../../services/api";

import { Lesson } from "../../../types/lesson";

export default function TopicLessonsPage() {
  useStudentAuth();

  const router = useRouter();

  const { id } = router.query;

  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/lessons/topic/${id}`)
      .then((res) => {
        setLessons(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <StudentLayout>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Topic Lessons</h1>

        <p className="text-indigo-100">
          Follow each lesson in order and track your learning journey.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Total Lessons</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {lessons.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Learning Mode</h3>

          <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Platform</h3>

          <p className="text-2xl font-bold text-purple-600 mt-2">Erevna LMS</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <p className="text-indigo-600 font-semibold">Loading lessons...</p>
        </div>
      )}

      {/* Lessons */}
      <div className="space-y-5">
        {lessons.map((lesson, index) => (
          <Link key={lesson.id} href={`/dashboard/lessons/${lesson.id}`}>
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="flex">
                {/* Lesson Number */}
                <div className="bg-gradient-to-b from-indigo-600 to-purple-600 text-white w-24 flex items-center justify-center text-3xl font-bold">
                  {index + 1}
                </div>

                {/* Lesson Content */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {lesson.title}
                      </h2>

                      <p className="text-gray-600 mt-3">
                        {lesson.description ||
                          "Interactive lesson content available."}
                      </p>
                    </div>

                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Lesson
                    </span>
                  </div>

                  <div className="flex gap-6 mt-5 text-sm text-gray-500">
                    {lesson.duration && (
                      <span>⏱ {lesson.duration} Minutes</span>
                    )}

                    <span>📖 Learning Material</span>
                  </div>

                  <div className="mt-5 flex justify-between items-center">
                    <span className="text-indigo-600 font-semibold">
                      Open Lesson
                    </span>

                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {!loading && lessons.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Lessons Available
          </h2>

          <p className="text-gray-500">
            Lessons for this topic will appear here when they are created.
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
