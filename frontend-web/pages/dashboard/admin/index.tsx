import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface DashboardData {
  statistics: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;

    totalSubjects: number;
    totalLessons: number;
    totalAssignments: number;
    totalLiveClasses: number;

    totalSubscriptions: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;

    freeSubscriptions: number;
    basicSubscriptions: number;
    premiumSubscriptions: number;
    schoolSubscriptions: number;

    totalExams: number;
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  };

  recentUsers: any[];

  recentAttempts: any[];

  recentSubscriptions: any[];
}

export default function AdminDashboard() {
  useAdminAuth();

  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/admin-dashboard");

        setData(res.data);
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      }
    };

    loadDashboard();
  }, []);

  if (!data) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <p className="text-indigo-600 font-semibold text-lg">
            Loading dashboard...
          </p>
        </div>
      </AdminLayout>
    );
  }

  const stats = data.statistics;

  return (
    <AdminLayout>
      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Erevna Admin Control Center</h1>

        <p className="text-indigo-100">
          Monitor platform growth, users, courses, exams and subscriptions.
        </p>
      </div>

      {/* =====================================================
          PLATFORM STATISTICS
      ===================================================== */}

      <h2 className="text-2xl font-bold text-slate-900 mb-5">
        Platform Statistics
      </h2>

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Users" value={stats.totalUsers} />

        <StatCard title="Students" value={stats.totalStudents} />

        <StatCard title="Teachers" value={stats.totalTeachers} />

        <StatCard title="Subjects" value={stats.totalSubjects} />

        <StatCard title="Lessons" value={stats.totalLessons} />

        <StatCard title="Assignments" value={stats.totalAssignments} />

        <StatCard title="Live Classes" value={stats.totalLiveClasses} />

        <StatCard title="Total Exams" value={stats.totalExams} />

        <StatCard title="Exam Attempts" value={stats.totalAttempts} />

        <StatCard title="Average Score" value={`${stats.averageScore}%`} />

        <StatCard title="Pass Rate" value={`${stats.passRate}%`} />
      </div>

      {/* =====================================================
          SUBSCRIPTION ANALYTICS
      ===================================================== */}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Subscription Analytics
          </h2>

          <p className="text-gray-500 mt-1">
            Monitor Erevna subscriptions and plan distribution.
          </p>
        </div>

        <a
          href="/admin/subscriptions"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          View Subscriptions
        </a>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Subscriptions"
          value={stats.totalSubscriptions}
        />

        <StatCard title="Active" value={stats.activeSubscriptions} />

        <StatCard title="Pending" value={stats.pendingSubscriptions} />

        <StatCard title="Expired" value={stats.expiredSubscriptions} />
      </div>

      {/* PLAN BREAKDOWN */}

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-10">
        <h3 className="text-xl font-bold text-slate-900 mb-6">
          Subscription Plans
        </h3>

        <div className="grid md:grid-cols-4 gap-5">
          <PlanCard title="Free" value={stats.freeSubscriptions} />

          <PlanCard title="Basic" value={stats.basicSubscriptions} />

          <PlanCard title="Premium" value={stats.premiumSubscriptions} />

          <PlanCard title="School" value={stats.schoolSubscriptions} />
        </div>
      </div>

      {/* =====================================================
          RECENT SUBSCRIPTIONS
      ===================================================== */}

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-indigo-700">
            Recent Subscriptions
          </h2>

          <a
            href="/admin/subscriptions"
            className="text-indigo-600 font-semibold hover:underline"
          >
            View all
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Student</th>
                <th className="text-left py-3">Plan</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Started</th>
                <th className="text-left py-3">Expires</th>
              </tr>
            </thead>

            <tbody>
              {data.recentSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="border-b hover:bg-indigo-50"
                >
                  <td className="py-3 font-medium">
                    {subscription.user?.firstName} {subscription.user?.lastName}
                  </td>

                  <td>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {subscription.plan}
                    </span>
                  </td>

                  <td>
                    <StatusBadge status={subscription.status} />
                  </td>

                  <td>
                    {subscription.startDate
                      ? new Date(subscription.startDate).toLocaleDateString(
                          "en-NG",
                        )
                      : "—"}
                  </td>

                  <td>
                    {subscription.endDate
                      ? new Date(subscription.endDate).toLocaleDateString(
                          "en-NG",
                        )
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          RECENT USERS
      ===================================================== */}

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">
          Recent Users
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Role</th>
              </tr>
            </thead>

            <tbody>
              {data.recentUsers.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-indigo-50">
                  <td className="py-3 font-medium">
                    {user.firstName} {user.lastName}
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          RECENT EXAM ATTEMPTS
      ===================================================== */}

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-purple-700 mb-6">
          Recent Exam Attempts
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Student</th>
                <th className="text-left py-3">Exam</th>
                <th className="text-left py-3">Score</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {data.recentAttempts.map((attempt: any) => (
                <tr key={attempt.id} className="border-b hover:bg-purple-50">
                  <td className="py-3 font-medium">
                    {attempt.user.firstName} {attempt.user.lastName}
                  </td>

                  <td>{attempt.exam.title}</td>

                  <td>
                    <span className="font-bold text-indigo-700">
                      {attempt.score}
                    </span>
                  </td>

                  <td>
                    {attempt.completed ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        Completed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition">
      <h3 className="text-gray-500 text-sm uppercase tracking-wide">{title}</h3>

      <p className="text-4xl font-bold text-indigo-700 mt-3">{value}</p>
    </div>
  );
}

/* =========================================================
   PLAN CARD
========================================================= */

function PlanCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="border rounded-2xl p-5 bg-gray-50">
      <p className="text-gray-500 text-sm">{title}</p>

      <p className="text-3xl font-bold text-indigo-700 mt-2">{value}</p>

      <p className="text-xs text-gray-500 mt-1">subscriptions</p>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
