import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface AnalyticsData {
  users: {
    total: number;
    students: number;
    teachers: number;
  };

  academic: {
    subjects: number;
    lessons: number;
    assignments: number;
    exams: number;
    attempts: number;
    completedAttempts: number;
    enrollments: number;
    certificates: number;
  };

  performance: {
    averageScore: number;
  };

  recentAttempts: any[];
  recentUsers: any[];
}

export default function AdminAnalyticsPage() {
  useAdminAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get("/analytics/admin");

        setData(response.data);
      } catch (error) {
        console.error("Failed to load admin analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <p className="text-indigo-600 font-semibold">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Analytics</h1>

        <p className="text-gray-500 mt-2">
          Monitor Erevna academic activity, users, engagement and performance.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5">User Analytics</h2>

        <div className="grid md:grid-cols-3 gap-5">
          <StatCard title="Total Users" value={data.users.total} />

          <StatCard title="Students" value={data.users.students} />

          <StatCard title="Teachers" value={data.users.teachers} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5">Academic Analytics</h2>

        <div className="grid md:grid-cols-4 gap-5">
          <StatCard title="Subjects" value={data.academic.subjects} />

          <StatCard title="Lessons" value={data.academic.lessons} />

          <StatCard title="Assignments" value={data.academic.assignments} />

          <StatCard title="Exams" value={data.academic.exams} />

          <StatCard title="Exam Attempts" value={data.academic.attempts} />

          <StatCard
            title="Completed Attempts"
            value={data.academic.completedAttempts}
          />

          <StatCard title="Enrollments" value={data.academic.enrollments} />

          <StatCard title="Certificates" value={data.academic.certificates} />
        </div>
      </section>

      <section className="mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-3">Student Performance</h2>

          <p className="text-gray-500">Average completed exam score</p>

          <p className="text-5xl font-bold text-indigo-700 mt-3">
            {Number(data.performance.averageScore).toFixed(1)}%
          </p>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Recent Exam Performance</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Student</th>

                <th className="text-left py-3">Exam</th>

                <th className="text-left py-3">Score</th>

                <th className="text-left py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {data.recentAttempts.map((attempt) => (
                <tr key={attempt.id} className="border-b">
                  <td className="py-3">
                    {attempt.user?.firstName} {attempt.user?.lastName}
                  </td>

                  <td>{attempt.exam?.title}</td>

                  <td className="font-bold text-indigo-700">{attempt.score}</td>

                  <td>
                    {attempt.createdAt
                      ? new Date(attempt.createdAt).toLocaleDateString("en-NG")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-sm text-gray-500 uppercase">{title}</p>

      <p className="text-4xl font-bold text-indigo-700 mt-3">{value}</p>
    </div>
  );
}
