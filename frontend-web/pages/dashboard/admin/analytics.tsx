import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface RecentAttempt {
  id: string;
  score: number;
  startedAt?: string;
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  exam?: {
    id: string;
    title: string;
  };
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AnalyticsData {
  users: {
    total: number;
    students: number;
    teachers: number;
  };

  programmes: {
    jambStudents: number;
    waecStudents: number;
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

  cohorts: {
    total: number;
    upcoming: number;
    active: number;
    ended: number;
    memberships: number;
  };

  subscriptions: {
    total: number;
    active: number;
    pending: number;
    expired: number;
  };

  payments: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
    totalRevenue: number;
  };

  performance: {
    averageScore: number;
  };

  recentAttempts: RecentAttempt[];
  recentUsers: RecentUser[];
}

function formatCurrency(value: number) {
  return `₦${Number(value).toLocaleString("en-NG")}`;
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminAnalyticsPage() {
  useAdminAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/analytics/admin");

        setData(response.data);
      } catch (error) {
        console.error("Failed to load admin analytics:", error);

        setError(
          "Unable to load analytics right now. Please refresh the page.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <p className="text-indigo-600 font-semibold">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <h1 className="text-xl font-bold text-slate-900">
            Analytics unavailable
          </h1>

          <p className="text-gray-500 mt-2">
            {error || "No analytics data was returned."}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Analytics</h1>

        <p className="text-gray-500 mt-2">
          Monitor Erevna users, academic activity, cohorts, subscriptions,
          payments and student performance.
        </p>
      </div>

      {/* USERS */}
      <AnalyticsSection title="User Analytics">
        <StatCard title="Total Users" value={data.users.total} />

        <StatCard title="Students" value={data.users.students} />

        <StatCard title="Teachers" value={data.users.teachers} />
      </AnalyticsSection>

      {/* PROGRAMMES */}
      <AnalyticsSection title="Programme Analytics">
        <StatCard title="JAMB Students" value={data.programmes.jambStudents} />

        <StatCard title="WAEC Students" value={data.programmes.waecStudents} />
      </AnalyticsSection>

      {/* ACADEMIC */}
      <AnalyticsSection title="Academic Analytics">
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
      </AnalyticsSection>

      {/* COHORTS */}
      <AnalyticsSection title="Cohort Analytics">
        <StatCard title="Total Cohorts" value={data.cohorts.total} />

        <StatCard title="Upcoming" value={data.cohorts.upcoming} />

        <StatCard title="Active" value={data.cohorts.active} />

        <StatCard title="Ended" value={data.cohorts.ended} />

        <StatCard
          title="Student Memberships"
          value={data.cohorts.memberships}
        />
      </AnalyticsSection>

      {/* SUBSCRIPTIONS */}
      <AnalyticsSection title="Subscription Analytics">
        <StatCard
          title="Total Subscriptions"
          value={data.subscriptions.total}
        />

        <StatCard title="Active" value={data.subscriptions.active} />

        <StatCard title="Pending" value={data.subscriptions.pending} />

        <StatCard title="Expired" value={data.subscriptions.expired} />
      </AnalyticsSection>

      {/* PAYMENTS */}
      <AnalyticsSection title="Payment Analytics">
        <StatCard title="Total Payments" value={data.payments.total} />

        <StatCard title="Paid" value={data.payments.paid} />

        <StatCard title="Pending" value={data.payments.pending} />

        <StatCard title="Failed" value={data.payments.failed} />

        <StatCard title="Refunded" value={data.payments.refunded} />

        <StatCard
          title="Confirmed Revenue"
          value={formatCurrency(data.payments.totalRevenue)}
        />
      </AnalyticsSection>

      {/* PERFORMANCE */}
      <section className="mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Student Performance
          </h2>

          <p className="text-gray-500 mt-2">
            Average score across completed examinations.
          </p>

          <p className="text-5xl font-bold text-indigo-700 mt-4">
            {Number(data.performance.averageScore).toFixed(1)}%
          </p>
        </div>
      </section>

      {/* RECENT EXAM ATTEMPTS */}
      <section className="mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Exam Performance
            </h2>

            <p className="text-gray-500 mt-1">
              The latest completed examination attempts.
            </p>
          </div>

          {data.recentAttempts.length === 0 ? (
            <p className="text-gray-500">No completed exam attempts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Student</th>
                    <th className="py-3 pr-4">Exam</th>
                    <th className="py-3 pr-4">Score</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        {attempt.user
                          ? `${attempt.user.firstName} ${attempt.user.lastName}`
                          : "Unknown Student"}
                      </td>

                      <td className="py-3 pr-4">
                        {attempt.exam?.title || "Unknown Exam"}
                      </td>

                      <td className="py-3 pr-4 font-bold text-indigo-700">
                        {attempt.score}
                      </td>

                      <td className="py-3">
                        {formatDate(
                          attempt.startedAt || attempt.createdAt || "",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* RECENT USERS */}
      <section>
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Recently Registered Users
            </h2>

            <p className="text-gray-500 mt-1">
              The latest users registered on Erevna.
            </p>
          </div>

          {data.recentUsers.length === 0 ? (
            <p className="text-gray-500">No users have registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3">Registered</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {user.firstName} {user.lastName}
                      </td>

                      <td className="py-3 pr-4">{user.email}</td>

                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase">
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

function AnalyticsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-5">{title}</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{children}</div>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-sm text-gray-500 uppercase tracking-wide">{title}</p>

      <p className="text-3xl font-bold text-indigo-700 mt-3">{value}</p>
    </div>
  );
}
