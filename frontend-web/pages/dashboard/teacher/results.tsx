import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function TeacherResultsPage() {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/exam-attempts/teacher/${user.id}`)
      .then((res) => setAnalytics(res.data))
      .catch(console.error);
  }, [user]);

  if (!analytics) {
    return (
      <TeacherLayout>
        <p>Loading...</p>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Results Analytics</h1>

      {/* Overview Cards */}

      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h3>Total Attempts</h3>
          <p className="text-3xl font-bold">{analytics.totalAttempts}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3>Average Score</h3>
          <p className="text-3xl font-bold">{analytics.averageScore}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3>Highest</h3>
          <p className="text-3xl font-bold">{analytics.highestScore}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3>Lowest</h3>
          <p className="text-3xl font-bold">{analytics.lowestScore}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3>Pass Rate</h3>
          <p className="text-3xl font-bold">{analytics.passRate}%</p>
        </div>
      </div>

      {/* Best/Worst Exam */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Best Performing Exam</h2>

          {analytics.bestExam ? (
            <>
              <p>{analytics.bestExam.title}</p>
              <p>Average Score: {analytics.bestExam.average}</p>
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="bg-red-50 p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">Lowest Performing Exam</h2>

          {analytics.worstExam ? (
            <>
              <p>{analytics.worstExam.title}</p>
              <p>Average Score: {analytics.worstExam.average}</p>
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      {/* Subject Performance */}

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Subject Performance</h2>

        {analytics.subjectPerformance.map((subject: any) => (
          <div
            key={subject.subject}
            className="flex justify-between border-b py-2"
          >
            <span>{subject.subject}</span>

            <span>{subject.average}%</span>
          </div>
        ))}
      </div>

      {/* Top Students */}

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Top Performing Students</h2>

        {analytics.topStudents.length === 0 ? (
          <p>No records available.</p>
        ) : (
          analytics.topStudents.map((student: any) => (
            <div
              key={`${student.studentId}-${student.exam}`}
              className="border-b py-2"
            >
              <p className="font-semibold">{student.name}</p>

              <p>Exam: {student.exam}</p>

              <p>Score: {student.score}</p>
            </div>
          ))
        )}
      </div>

      {/* Weak Students */}

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Students Needing Attention</h2>

        {analytics.weakStudents.length === 0 ? (
          <p>No records available.</p>
        ) : (
          analytics.weakStudents.map((student: any) => (
            <div
              key={`${student.studentId}-${student.exam}`}
              className="border-b py-2"
            >
              <p className="font-semibold">{student.name}</p>

              <p>Exam: {student.exam}</p>

              <p>Score: {student.score}</p>
            </div>
          ))
        )}
      </div>

      {/* All Attempts */}

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Recent Attempts</h2>

        {analytics.attempts.map((attempt: any) => (
          <div key={attempt.id} className="border-b py-3">
            <p className="font-semibold">
              {attempt.user.firstName} {attempt.user.lastName}
            </p>

            <p>Exam: {attempt.exam.title}</p>

            <p>Subject: {attempt.exam.subject.name}</p>

            <p>Score: {attempt.score}</p>
          </div>
        ))}
      </div>
    </TeacherLayout>
  );
}
