import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminResultsPage() {
  useAdminAuth();

  const [attempts, setAttempts] = useState<any[]>([]);

  const loadResults = async () => {
    const res = await api.get("/exam-attempts");

    setAttempts(res.data);
  };

  useEffect(() => {
    loadResults();
  }, []);

  const completedAttempts = attempts.filter((a) => a.completed);

  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + a.score, 0) /
            completedAttempts.length,
        )
      : 0;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Exam Results</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-gray-500">Total Attempts</h3>

          <p className="text-3xl font-bold">{attempts.length}</p>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h3 className="text-gray-500">Completed Exams</h3>

          <p className="text-3xl font-bold">{completedAttempts.length}</p>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h3 className="text-gray-500">Average Score</h3>

          <p className="text-3xl font-bold">{averageScore}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Attempts</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Student</th>

              <th className="text-left py-3">Exam</th>

              <th className="text-left py-3">Score</th>

              <th className="text-left py-3">Status</th>

              <th className="text-left py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b">
                <td className="py-3">
                  {attempt.user?.firstName} {attempt.user?.lastName}
                </td>

                <td>{attempt.exam?.title}</td>

                <td>{attempt.score}</td>

                <td>{attempt.completed ? "Completed" : "In Progress"}</td>

                <td>{new Date(attempt.startedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
