import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../../../layouts/AdminLayout";
import api from "../../../../services/api";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
type Programme = "JAMB" | "WAEC";

interface TeacherProfile {
  qualification?: string | null;
  specialization?: string | null;
  experience?: string | null;
  officeHours?: string | null;
  about?: string | null;
  linkedin?: string | null;
  website?: string | null;
  twitter?: string | null;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  teacherProfile?: TeacherProfile | null;
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

export default function TeacherApplicationDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [application, setApplication] = useState<TeacherApplication | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadApplication = async () => {
    if (!id || typeof id !== "string") {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/teacher-applications/admin/${id}`);

      setApplication(response.data);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : "Unable to load this application.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      loadApplication();
    }
  }, [router.isReady, id]);

  const approveApplication = async () => {
    if (!application) {
      return;
    }

    const confirmed = window.confirm(
      `Approve ${application.teacher.firstName} ${application.teacher.lastName} to teach ${application.subject.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await api.patch(`/teacher-applications/admin/${application.id}/approve`);

      await loadApplication();
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
      setProcessing(false);
    }
  };

  const rejectApplication = async () => {
    if (!application) {
      return;
    }

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
      setProcessing(true);
      setError("");

      await api.patch(`/teacher-applications/admin/${application.id}/reject`, {
        rejectionReason: trimmedReason,
      });

      await loadApplication();
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
      setProcessing(false);
    }
  };

  const statusClasses = (status: ApplicationStatus) => {
    switch (status) {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">Loading application...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!application) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-800">
              Application not found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "This application could not be loaded."}
            </p>

            <Link
              href="/dashboard/admin/teacher-applications"
              className="mt-5 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const profile = application.teacher.teacherProfile;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/admin/teacher-applications"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Applications
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Application
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review the teacher's application and qualifications before making
              a decision.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusClasses(
              application.status,
            )}`}
          >
            {application.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Teacher Information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {application.teacher.firstName}{" "}
                    {application.teacher.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 text-sm text-gray-900">
                    {application.teacher.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account Status
                  </p>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      application.teacher.isActive
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {application.teacher.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Application Date
                  </p>

                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(application.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Professional Profile
              </h2>

              {!profile ? (
                <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    This teacher has not completed a teacher profile yet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Qualification
                      </p>

                      <p className="mt-1 text-sm text-gray-900">
                        {profile.qualification || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Specialization
                      </p>

                      <p className="mt-1 text-sm text-gray-900">
                        {profile.specialization || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Experience
                      </p>

                      <p className="mt-1 text-sm text-gray-900">
                        {profile.experience || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Office Hours
                      </p>

                      <p className="mt-1 text-sm text-gray-900">
                        {profile.officeHours || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      About
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {profile.about || "Not provided"}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        LinkedIn
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-900">
                        {profile.linkedin || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Website
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-900">
                        {profile.website || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Twitter
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-900">
                        {profile.twitter || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Subject Requested
              </h2>

              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {application.subject.name}
                    </h3>

                    <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {application.programme}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      application.subject.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {application.subject.isActive
                      ? "Active Subject"
                      : "Inactive Subject"}
                  </span>
                </div>

                {application.subject.description && (
                  <p className="mt-5 text-sm leading-6 text-gray-600">
                    {application.subject.description}
                  </p>
                )}
              </div>
            </section>

            {application.status === "REJECTED" &&
              application.rejectionReason && (
                <section className="rounded-xl border border-red-200 bg-red-50 p-6">
                  <h2 className="text-lg font-semibold text-red-900">
                    Rejection Reason
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-800">
                    {application.rejectionReason}
                  </p>
                </section>
              )}
          </div>

          <aside>
            <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Application Decision
              </h2>

              {application.status === "PENDING" ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Review the teacher's profile and requested subject before
                    approving or rejecting this application.
                  </p>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={approveApplication}
                      disabled={processing}
                      className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing ? "Processing..." : "Approve Application"}
                    </button>

                    <button
                      type="button"
                      onClick={rejectApplication}
                      disabled={processing}
                      className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject Application
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-800">
                    This application has already been{" "}
                    {application.status.toLowerCase()}.
                  </p>

                  {application.reviewedAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Reviewed on{" "}
                      {new Date(application.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Application ID
                </h3>

                <p className="mt-1 break-all text-xs text-gray-500">
                  {application.id}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
