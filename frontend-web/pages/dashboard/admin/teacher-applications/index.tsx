import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../../../layouts/AdminLayout";
import api from "../../../../services/api";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
type Programme = "JAMB" | "WAEC";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  teacherProfile?: {
    qualification?: string | null;
    specialization?: string | null;
    experience?: string | null;
    about?: string | null;
  } | null;
}

interface Subject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
  isActive: boolean;
  teacherId?: string | null;
}

interface TeacherApplication {
  id: string;
  subjectId: string;
  teacherId: string;
  programme: Programme;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  teacher: Teacher;
  subject: Subject;
}

const statusOptions: Array<{
  label: string;
  value: "ALL" | ApplicationStatus;
}> = [
  { label: "All Applications", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminTeacherApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [status, setStatus] = useState<"ALL" | ApplicationStatus>("PENDING");
  const [programme, setProgramme] = useState<"ALL" | Programme>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = status === "ALL" ? {} : { status };

      const response = await api.get("/teacher-applications/admin/all", {
        params,
      });

      setApplications(response.data || []);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : "Unable to load teacher applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [status]);

  const filteredApplications = applications.filter((application) => {
    if (programme === "ALL") {
      return true;
    }

    return application.programme === programme;
  });

  const approveApplication = async (application: TeacherApplication) => {
    const confirmed = window.confirm(
      `Approve ${application.teacher.firstName} ${application.teacher.lastName} to teach ${application.subject.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(application.id);
      setError("");

      await api.patch(`/teacher-applications/admin/${application.id}/approve`);

      await loadApplications();
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : "Unable to approve this application.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectApplication = async (application: TeacherApplication) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this application:",
    );

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("A rejection reason is required.");
      return;
    }

    try {
      setProcessingId(application.id);
      setError("");

      await api.patch(`/teacher-applications/admin/${application.id}/reject`, {
        rejectionReason: trimmedReason,
      });

      await loadApplications();
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : "Unable to reject this application.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClasses = (applicationStatus: ApplicationStatus) => {
    switch (applicationStatus) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";

      case "APPROVED":
        return "bg-green-100 text-green-800";

      case "REJECTED":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Teacher Subject Applications
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Review teacher requests to teach JAMB and WAEC subjects.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    status === option.value
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="programme"
                className="text-sm font-medium text-gray-700"
              >
                Programme
              </label>

              <select
                id="programme"
                value={programme}
                onChange={(event) =>
                  setProgramme(event.target.value as "ALL" | Programme)
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Programmes</option>
                <option value="JAMB">JAMB</option>
                <option value="WAEC">WAEC</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading applications...
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No applications found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              There are no applications matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Teacher
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Programme
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Requested
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredApplications.map((application) => {
                    const isProcessing = processingId === application.id;

                    return (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {application.teacher.firstName}{" "}
                              {application.teacher.lastName}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {application.teacher.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-gray-900">
                            {application.subject.name}
                          </p>

                          {application.subject.description && (
                            <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                              {application.subject.description}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {application.programme}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              application.status,
                            )}`}
                          >
                            {application.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-600">
                          {new Date(
                            application.requestedAt,
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboard/admin/teacher-applications/${application.id}`}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              View
                            </Link>

                            {application.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    approveApplication(application)
                                  }
                                  disabled={isProcessing}
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? "..." : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => rejectApplication(application)}
                                  disabled={isProcessing}
                                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredApplications.length}
                </span>{" "}
                application
                {filteredApplications.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
