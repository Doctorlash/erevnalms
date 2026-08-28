import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";

import useStudentAuth from "../../hooks/useStudentAuth";

import { useAuth } from "../../contexts/AuthContext";

import api from "../../services/api";

export default function ProgressPage() {
  useStudentAuth();

  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/progress/student/${user.id}/stats`)
      .then((res) => setStats(res.data));
  }, [user]);

  return (
    <StudentLayout>
      <h1 className="text-3xl font-bold mb-6">Learning Progress</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p>Completed Lessons: {stats?.completedLessons ?? 0}</p>

        <p>Average Progress: {stats?.averageProgress ?? 0}%</p>

        <p>Lessons Tracked: {stats?.totalLessonsTracked ?? 0}</p>
      </div>
    </StudentLayout>
  );
}
