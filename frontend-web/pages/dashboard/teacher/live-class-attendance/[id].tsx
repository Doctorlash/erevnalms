import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import TeacherLayout from "../../../../layouts/TeacherLayout";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Attendance {
  id: string;
  studentId: string;
  joinedAt: string;
  student: Student;
}

interface LiveClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  subject?: {
    name: string;
  };
}

export default function LiveClassAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();

  const classId =
    typeof router.query.id === "string" ? router.query.id : undefined;

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !user || !classId) return;

    const loadAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        const [classResponse, attendanceResponse] = await Promise.all([
          api.get(`/live-classes/${classId}`),
          api.get(`/live-classes/${classId}/attendance`),
        ]);

        const classData = classResponse.data;

        // Make sure this class belongs to the logged-in teacher.
        if (classData.teacherId !== user.id) {
          setError("You are not authorized to view this class attendance.");
          return;
        }

        setLiveClass(classData);
        setAttendance(attendanceResponse.data);
      } catch (err) {
        console.error("Failed to load live class attendance:", err);

        setError("Unable to load live class attendance.");
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [router.isReady, user, classId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!user || user.role !== "TEACHER") {
    return null;
  }

  return (
    <TeacherLayout>
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard/teacher/live-classes")}
          className="mb-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Live Classes
        </button>

        <h1 className="text-3xl font-bold text-slate-900">Class Attendance</h1>

        <p className="mt-2 text-gray-600">
          View students who joined this live class.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-500">Loading attendance...</p>
        </div>
      ) : liveClass ? (
        <>
          {/* CLASS INFORMATION */}

          <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-indigo-700">
                  {liveClass.title}
                </h2>

                <p className="mt-1 text-gray-500">
                  {liveClass.subject?.name || "Subject"}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 px-5 py-3 text-center">
                <p className="text-sm text-gray-500">Students Present</p>

                <p className="text-3xl font-bold text-indigo-700">
                  {attendance.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Start Time</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(liveClass.startTime)}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">End Time</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(liveClass.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* ATTENDANCE TABLE */}

          <div className="rounded-2xl bg-white shadow-lg">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Attendance Records
              </h2>
            </div>

            {attendance.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">👥</div>

                <h3 className="mt-3 text-lg font-semibold text-gray-800">
                  No students have joined yet
                </h3>

                <p className="mt-1 text-gray-500">
                  Attendance will appear here when students join the class.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Student
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Email
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Joined At
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b hover:bg-indigo-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {record.student.firstName} {record.student.lastName}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {record.student.email}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(record.joinedAt)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                            Present
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </TeacherLayout>
  );
}
