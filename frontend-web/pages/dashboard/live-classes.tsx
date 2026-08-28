import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useAuth } from "../../contexts/AuthContext";

import api from "../../services/api";

interface LiveClass {
  id: string;
  title: string;
  description?: string | null;
  subjectId: string;
  teacherId: string;
  meetingLink: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  subject?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function StudentLiveClassesPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadClasses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/live-classes/student/${user.id}`);

      setClasses(response.data);
    } catch (err) {
      console.error("Failed to load live classes:", err);
      setError("Unable to load your live classes.");
    } finally {
      setLoading(false);
    }
  };

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
    const start = new Date(liveClass.startTime);
    const end = new Date(liveClass.endTime);

    if (now < start) {
      return {
        label: "Upcoming",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (now >= start && now <= end) {
      return {
        label: "Live Now",
        className: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Ended",
      className: "bg-gray-100 text-gray-600",
    };
  };

  const upcomingClasses = classes
    .filter((liveClass) => {
      return new Date(liveClass.endTime) >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  const pastClasses = classes
    .filter((liveClass) => {
      return new Date(liveClass.endTime) < new Date();
    })
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Live Classes</h1>

        <p className="mt-2 text-gray-600">
          Join your scheduled live classes and learning sessions.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-500">Loading live classes...</p>
        </div>
      ) : (
        <>
          {/* =====================================================
              UPCOMING CLASSES
          ===================================================== */}

          <section className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Upcoming Classes
              </h2>

              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                {upcomingClasses.length}
              </span>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow">
                <div className="text-4xl">🎥</div>

                <h3 className="mt-3 text-lg font-semibold text-gray-800">
                  No upcoming live classes
                </h3>

                <p className="mt-1 text-gray-500">
                  Your scheduled classes will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {upcomingClasses.map((liveClass) => {
                  const status = getClassStatus(liveClass);

                  return (
                    <div
                      key={liveClass.id}
                      className="rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-indigo-700">
                            {liveClass.title}
                          </h3>

                          <p className="mt-1 text-gray-500">
                            {liveClass.subject?.name || "Subject"}
                          </p>
                        </div>

                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {liveClass.description && (
                        <p className="mt-4 text-gray-600">
                          {liveClass.description}
                        </p>
                      )}

                      <div className="mt-5 space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Teacher:</span>{" "}
                          {liveClass.teacher
                            ? `${liveClass.teacher.firstName} ${liveClass.teacher.lastName}`
                            : "Teacher"}
                        </p>

                        <p>
                          <span className="font-semibold">Starts:</span>{" "}
                          {formatDate(liveClass.startTime)}
                        </p>

                        <p>
                          <span className="font-semibold">Ends:</span>{" "}
                          {formatDate(liveClass.endTime)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => joinClass(liveClass)}
                        disabled={joining === liveClass.id}
                        className={`mt-6 w-full rounded-xl px-5 py-3 font-semibold text-white transition ${
                          status.label === "Live Now"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        } disabled:bg-gray-400`}
                      >
                        {joining === liveClass.id
                          ? "Joining..."
                          : status.label === "Live Now"
                            ? "Join Live Class"
                            : "Open Class"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              PAST CLASSES
          ===================================================== */}

          <section>
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Previous Classes
            </h2>

            {pastClasses.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-500">No previous classes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastClasses.map((liveClass) => (
                  <div
                    key={liveClass.id}
                    className="rounded-xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {liveClass.title}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {liveClass.subject?.name}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        {formatDate(liveClass.startTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </StudentLayout>
  );
}
