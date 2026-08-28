import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";

import useStudentAuth from "../../hooks/useStudentAuth";

import { useAuth } from "../../contexts/AuthContext";

import api from "../../services/api";

import Link from "next/link";

export default function ResultsPage() {
  useStudentAuth();

  const { user } = useAuth();

  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/exam-attempts/user/${user.id}`)
      .then((res) => setAttempts(res.data))
      .catch(console.error);
  }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-3xl font-bold mb-6">My Results</h1>

      {attempts.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">No exam attempts yet.</div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-white p-6 rounded shadow">
              <h2 className="font-bold text-lg">{attempt.exam?.title}</h2>

              <p>Score: {attempt.score}</p>

              <p>Status: {attempt.completed ? "Completed" : "In Progress"}</p>

              <Link
                href={`/dashboard/results/${attempt.id}`}
                className="text-blue-600"
              >
                View Result
              </Link>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
