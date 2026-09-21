import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import useStudentAuth from "../hooks/useStudentAuth";
import StudentLayout from "../layouts/StudentLayout";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api";

type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";

type Programme = "JAMB" | "WAEC";

interface Cohort {
  id: string;
  name: string;
  programme: Programme;
  description?: string | null;
  startDate: string;
  endDate: string;
  fee: number;
  status?: "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";
}

interface Subscription {
  id: string;
  plan?: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL" | null;
  billingType?: "COHORT" | "LEGACY";
  status: SubscriptionStatus;
  startDate?: string | null;
  endDate?: string | null;
  paymentReference?: string | null;
  cohortId?: string | null;
  studentCohortId?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdAt: string;
}

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  progress: number;
  completed: boolean;
  lastViewed?: string | null;
  createdAt?: string;
  updatedAt?: string;

  lesson?: {
    id: string;
    title: string;
    description?: string | null;

    topic?: {
      id: string;
      name: string;

      subject?: {
        id: string;
        name: string;
      };
    };
  };
}

interface ProgressStats {
  completedLessons: number;
  averageProgress: number;
  totalLessonsTracked: number;
}

export default function Dashboard() {
  const { user } = useStudentAuth();

  const [stats, setStats] = useState<any>(null);

  const [progressStats, setProgressStats] = useState<ProgressStats | null>(
    null,
  );

  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // =========================================================
  // NORMALIZE API ARRAYS
  // =========================================================

  const normalizeArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(data?.subscriptions)) {
      return data.subscriptions;
    }

    if (Array.isArray(data?.cohorts)) {
      return data.cohorts;
    }

    return [];
  };

  // =========================================================
  // LOAD MAIN DASHBOARD
  // =========================================================

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/student-dashboard/${user.id}`);

        setStats(response.data);
      } catch (error) {
        console.error("Failed to load student dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  // =========================================================
  // LOAD LEARNING PROGRESS
  // =========================================================

  useEffect(() => {
    if (!user) return;

    const loadProgress = async () => {
      try {
        setProgressLoading(true);

        const [progressResponse, statsResponse] = await Promise.all([
          api.get(`/progress/student/${user.id}`),
          api.get(`/progress/student/${user.id}/stats`),
        ]);

        setLessonProgress(progressResponse.data || []);

        setProgressStats(statsResponse.data || null);
      } catch (error) {
        console.error("Failed to load student progress:", error);
      } finally {
        setProgressLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  // =========================================================
  // LOAD COHORT / SUBSCRIPTION STATUS
  // =========================================================

  useEffect(() => {
    if (!user) return;

    const loadSubscriptionStatus = async () => {
      try {
        setSubscriptionLoading(true);

        const [subscriptionsResponse, cohortsResponse] = await Promise.all([
          api.get("/subscriptions/my"),
          api.get("/cohorts/my"),
        ]);

        setSubscriptions(
          normalizeArray<Subscription>(subscriptionsResponse.data),
        );

        setCohorts(normalizeArray<Cohort>(cohortsResponse.data));
      } catch (error) {
        console.error("Failed to load cohort subscription status:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscriptionStatus();
  }, [user]);

  // =========================================================
  // DASHBOARD VALUES
  // =========================================================

  const enrollments = stats?.stats?.enrollments ?? 0;

  const notifications = stats?.notifications?.length ?? 0;

  const certificates = stats?.certificates?.length ?? 0;

  const progress = progressStats?.averageProgress ?? 0;

  const completedLessons = progressStats?.completedLessons ?? 0;

  const totalLessonsTracked = progressStats?.totalLessonsTracked ?? 0;

  // =========================================================
  // CURRENT ACTIVE SUBSCRIPTION
  // =========================================================

  const activeSubscription = useMemo(() => {
    const now = new Date();

    return (
      subscriptions.find((subscription) => {
        if (subscription.status !== "ACTIVE") {
          return false;
        }

        if (!subscription.endDate) {
          return true;
        }

        return new Date(subscription.endDate) > now;
      }) || null
    );
  }, [subscriptions]);

  // =========================================================
  // MOST RECENT PENDING SUBSCRIPTION
  // =========================================================

  const pendingSubscription = useMemo(() => {
    return (
      subscriptions
        .filter((subscription) => subscription.status === "PENDING")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0] || null
    );
  }, [subscriptions]);

  // =========================================================
  // FIND SUBSCRIPTION COHORT
  // =========================================================

  const subscriptionCohort = useMemo(() => {
    if (!activeSubscription?.cohortId) {
      return null;
    }

    return (
      cohorts.find((cohort) => cohort.id === activeSubscription.cohortId) ||
      null
    );
  }, [activeSubscription, cohorts]);

  // =========================================================
  // CONTINUE LEARNING
  // =========================================================

  const continueLearning = lessonProgress
    .filter(
      (item) => item.completed === false && item.progress > 0 && item.lesson,
    )
    .sort((a, b) => {
      const first = new Date(
        a.lastViewed || a.updatedAt || a.createdAt || 0,
      ).getTime();

      const second = new Date(
        b.lastViewed || b.updatedAt || b.createdAt || 0,
      ).getTime();

      return second - first;
    })
    .slice(0, 5);

  // =========================================================
  // RECENTLY COMPLETED
  // =========================================================

  const completedLessonList = lessonProgress
    .filter((item) => item.completed === true && item.lesson)
    .sort((a, b) => {
      const first = new Date(
        a.lastViewed || a.updatedAt || a.createdAt || 0,
      ).getTime();

      const second = new Date(
        b.lastViewed || b.updatedAt || b.createdAt || 0,
      ).getTime();

      return second - first;
    })
    .slice(0, 5);

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading && !stats) {
    return (
      <StudentLayout>
        {" "}
        <div className="flex justify-center items-center py-20">
          {" "}
          <p className="text-gray-500">Loading your dashboard...</p>{" "}
        </div>{" "}
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      {/* =====================================================
WELCOME
===================================================== */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.firstName} 👋
        </h1>

        <p className="text-blue-100 text-lg">
          Continue your learning journey with Erevna LMS.
        </p>
      </div>

      {/* =====================================================
      SUMMARY CARDS
  ===================================================== */}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Subjects" value={enrollments} />

        <DashboardCard title="Completed Lessons" value={completedLessons} />

        <DashboardCard title="Certificates" value={certificates} />

        <DashboardCard title="Notifications" value={notifications} />
      </div>

      {/* =====================================================
      COHORT / SUBSCRIPTION STATUS
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Programme & Subscription
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your current cohort and learning access status.
            </p>
          </div>

          <Link
            href="/dashboard/subscription"
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            Manage Subscription
          </Link>
        </div>

        {subscriptionLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading your subscription status...
          </div>
        ) : activeSubscription ? (
          <div className="mt-5 border border-green-200 bg-green-50 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  {subscriptionCohort?.programme || "Programme"}
                </p>

                <h3 className="text-xl font-bold text-green-700 mt-1">
                  {subscriptionCohort?.name || "Active Cohort"}
                </h3>
              </div>

              <span className="inline-flex w-fit px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                ● Active
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Subscription Started</p>

                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(activeSubscription.startDate)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Access Ends</p>

                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(activeSubscription.endDate)}
                </p>
              </div>
            </div>
          </div>
        ) : pendingSubscription ? (
          <div className="mt-5 border border-yellow-200 bg-yellow-50 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-yellow-800">
                  Payment Processing
                </h3>

                <p className="text-yellow-700 mt-1">
                  Your cohort subscription is currently pending. Please complete
                  or verify your payment.
                </p>
              </div>

              <Link
                href="/dashboard/subscription"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-center"
              >
                View Payment
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 border border-blue-200 bg-blue-50 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-blue-800">
                  No Active Cohort Subscription
                </h3>

                <p className="text-blue-700 mt-1">
                  View available cohorts and complete payment to activate your
                  paid programme access.
                </p>
              </div>

              <Link
                href="/dashboard/subscription"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-center"
              >
                View Cohorts
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
      LEARNING PROGRESS
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">Learning Progress</h2>

            <p className="text-sm text-gray-500 mt-1">
              Based on your actual lesson activity.
            </p>
          </div>

          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
          <div
            className="bg-blue-600 h-5 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Average Progress</p>

            <p className="text-2xl font-bold text-slate-900 mt-1">
              {progress}%
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Completed</p>

            <p className="text-2xl font-bold text-green-600 mt-1">
              {completedLessons}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Lessons Tracked</p>

            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalLessonsTracked}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
      CONTINUE LEARNING
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Continue Learning</h2>

            <p className="text-gray-500 text-sm mt-1">
              Pick up where you left off.
            </p>
          </div>

          <Link
            href="/dashboard/lessons"
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            View All
          </Link>
        </div>

        {progressLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading your learning progress...
          </div>
        ) : continueLearning.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-600">You have no lessons in progress.</p>

            <Link
              href="/dashboard/lessons"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Browse Lessons
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {continueLearning.map((item) => (
              <div
                key={item.id}
                className="border rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900">
                      {item.lesson?.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {item.lesson?.topic?.subject?.name || "Subject"}
                      {" • "}
                      {item.lesson?.topic?.name || "Topic"}
                    </p>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>

                        <span className="font-semibold">{item.progress}%</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, item.progress),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {item.lesson?.id && (
                    <Link
                      href={`/dashboard/lessons/${item.lesson.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-center font-semibold"
                    >
                      Continue
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
      RECENTLY COMPLETED
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Recently Completed</h2>

            <p className="text-gray-500 text-sm mt-1">
              Lessons you have successfully completed.
            </p>
          </div>
        </div>

        {progressLoading ? (
          <div className="py-6 text-center text-gray-500">Loading...</div>
        ) : completedLessonList.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-500">
              You have not completed any lessons yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedLessonList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-xl p-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {item.lesson?.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {item.lesson?.topic?.subject?.name || "Subject"}
                    {" • "}
                    {item.lesson?.topic?.name || "Topic"}
                  </p>

                  {item.lastViewed && (
                    <p className="text-xs text-gray-400 mt-1">
                      Completed: {formatDate(item.lastViewed)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Completed
                  </span>

                  {item.lesson?.id && (
                    <Link
                      href={`/dashboard/lessons/${item.lesson.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
      QUICK ACTIONS
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/subjects"
            className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700 transition"
          >
            📚 Subjects
          </Link>

          <Link
            href="/dashboard/lessons"
            className="bg-green-600 text-white p-4 rounded-xl text-center hover:bg-green-700 transition"
          >
            📖 Lessons
          </Link>

          <Link
            href="/dashboard/cbt"
            className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700 transition"
          >
            🎯 CBT Exams
          </Link>

          <Link
            href="/dashboard/results"
            className="bg-orange-600 text-white p-4 rounded-xl text-center hover:bg-orange-700 transition"
          >
            📊 Results
          </Link>
        </div>
      </div>

      {/* =====================================================
      CERTIFICATES
  ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Certificates</h2>

            <p className="text-sm text-gray-500 mt-1">
              View certificates you have earned from your completed learning
              programmes.
            </p>
          </div>

          <Link
            href="/dashboard/certificates"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition text-center"
          >
            View My Certificates
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
