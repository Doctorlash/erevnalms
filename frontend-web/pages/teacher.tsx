/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import TeacherLayout from "../layouts/TeacherLayout";
import useTeacherAuth from "../hooks/useTeacherAuth";
import api from "../services/api";

interface DashboardData {
  stats: {
    subjects: number;
    topics: number;
    lessons: number;
    questions: number;
    exams: number;
    assignments: number;
    liveClasses: number;
    announcements: number;
  };

  assignedSubjects: any[];
  upcomingClasses: any[];
  recentAssignments: any[];
}

export default function TeacherDashboard() {
  const { user } = useTeacherAuth();

  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/teacher-dashboard/${user.id}`)
      .then((res) => setData(res.data))
      .catch(console.error);
  }, [user]);

  if (!data) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <p className="text-lg font-semibold text-indigo-600">
            Loading dashboard...
          </p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">
          Welcome Back, {user?.firstName}
        </h1>

        <p className="text-indigo-100">
          Manage subjects, lessons, exams, assignments and student performance.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Subjects" value={data.stats.subjects} />
        <StatCard title="Topics" value={data.stats.topics} />
        <StatCard title="Lessons" value={data.stats.lessons} />
        <StatCard title="Questions" value={data.stats.questions} />
        <StatCard title="Exams" value={data.stats.exams} />
        <StatCard title="Assignments" value={data.stats.assignments} />
        <StatCard title="Live Classes" value={data.stats.liveClasses} />
        <StatCard title="Announcements" value={data.stats.announcements} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">
            Assigned Subjects
          </h2>

          {data.assignedSubjects.length === 0 ? (
            <p className="text-gray-500">No subjects assigned.</p>
          ) : (
            <ul className="space-y-3">
              {data.assignedSubjects.map((subject) => (
                <li
                  key={subject.id}
                  className="border rounded-xl p-3 hover:bg-indigo-50"
                >
                  {subject.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-purple-700 mb-4">
            Upcoming Classes
          </h2>

          {data.upcomingClasses.length === 0 ? (
            <p className="text-gray-500">No upcoming classes.</p>
          ) : (
            <div className="space-y-4">
              {data.upcomingClasses.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-4 hover:bg-purple-50"
                >
                  <div className="font-bold text-lg">{item.title}</div>

                  <div className="text-gray-600">{item.subject?.name}</div>

                  <div className="text-sm text-gray-500">
                    {new Date(item.startTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">
          Recent Assignments
        </h2>

        {data.recentAssignments.length === 0 ? (
          <p className="text-gray-500">No assignments created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Title</th>
                  <th className="text-left py-3">Subject</th>
                  <th className="text-left py-3">Due Date</th>
                </tr>
              </thead>

              <tbody>
                {data.recentAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{assignment.title}</td>

                    <td>{assignment.subject?.name}</td>

                    <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
      <h3 className="text-gray-500 text-sm uppercase">{title}</h3>

      <p className="text-4xl font-bold text-indigo-700 mt-2">{value}</p>
    </div>
  );
}
