import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

type Programme = "JAMB" | "WAEC";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface SubjectRequest {
  id: string;
  subjectId: string;
  programme: Programme;
  status: RequestStatus;
  rejectionReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  subject?: {
    id: string;
    name: string;
    description?: string | null;
    programme: Programme;
  };
}

export default function SubjectRequestsPage() {
  useStudentAuth();

  const router = useRouter();

  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<SubjectRequest[]>(
        "/subject-requests/my-requests",
      );

      setRequests(response.data);
    } catch (err: any) {
      console.error("Failed to load subject requests:", err);

      if (err?.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          "Unable to load your subject requests right now. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResubmit = async (requestId: string) => {
    try {
      setResubmittingId(requestId);
      setError("");
      setSuccess("");

      await api.patch(`/subject-requests/my-requests/${requestId}/resubmit`);

      setSuccess(
        "Your subject request has been resubmitted and is awaiting admin approval.",
      );

      await loadRequests();
    } catch (err: any) {
      console.error("Failed to resubmit subject request:", err);

      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError(
          "Unable to resubmit this request right now. Please try again.",
        );
      }
    } finally {
      setResubmittingId(null);
    }
  };

  const pendingCount = requests.filter(
    (request) => request.status === "PENDING",
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "APPROVED",
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "REJECTED",
  ).length;

  const getStatusClasses = (status: RequestStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200";

      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getProgrammeClasses = (programme: Programme) => {
    return programme === "JAMB"
      ? "bg-indigo-100 text-indigo-700"
      : "bg-purple-100 text-purple-700";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <StudentLayout>
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl text-white p-8 mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-3">Subject Requests</h1>

            <p className="text-indigo-100 max-w-2xl">
              Track the subjects you have requested and see whether each request
              has been approved, rejected, or is still waiting for review.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/subjects")}
            className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 font-semibold transition"
          >
            My Subjects →
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-medium text-green-600">{success}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <p className="text-gray-500 font-medium">Pending</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <p className="text-gray-500 font-medium">Approved</p>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <p className="text-gray-500 font-medium">Rejected</p>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {rejectedCount}
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Loading Requests
          </h2>
          <p className="text-gray-500">
            Please wait while we load your subject requests...
          </p>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-5xl mb-5">📚</div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">
            No Subject Requests
          </h2>

          <p className="text-gray-500 max-w-xl mx-auto">
            You have not submitted any subject requests yet. Your requests will
            appear here after you register for your examination programme.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-5">
          {requests.map((request) => {
            const subjectName = request.subject?.name || "Subject unavailable";

            return (
              <div
                key={request.id}
                className="bg-white rounded-3xl shadow-lg overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getProgrammeClasses(
                            request.programme,
                          )}`}
                        >
                          {request.programme}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                            request.status,
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-800">
                        {subjectName}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2">
                        Requested on {formatDate(request.requestedAt)}
                      </p>

                      {request.reviewedAt && (
                        <p className="text-sm text-gray-500 mt-1">
                          Reviewed on {formatDate(request.reviewedAt)}
                        </p>
                      )}
                    </div>

                    <div>
                      {request.status === "PENDING" && (
                        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                          <p className="text-sm font-semibold text-yellow-700">
                            Awaiting admin review
                          </p>
                        </div>
                      )}

                      {request.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/subjects/${request.subjectId}`,
                            )
                          }
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-white font-semibold transition"
                        >
                          Open Subject →
                        </button>
                      )}

                      {request.status === "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => handleResubmit(request.id)}
                          disabled={resubmittingId === request.id}
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 text-white font-semibold transition"
                        >
                          {resubmittingId === request.id
                            ? "Resubmitting..."
                            : "Resubmit Request"}
                        </button>
                      )}
                    </div>
                  </div>

                  {request.status === "REJECTED" && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                      <h3 className="font-bold text-red-700 mb-2">
                        Rejection Reason
                      </h3>

                      <p className="text-red-600">
                        {request.rejectionReason ||
                          "No rejection reason was provided."}
                      </p>
                    </div>
                  )}

                  {request.status === "APPROVED" && (
                    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                      <p className="text-green-700 font-medium">
                        This request has been approved. You now have access to
                        this subject.
                      </p>
                    </div>
                  )}

                  {request.status === "PENDING" && (
                    <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                      <p className="text-yellow-700 font-medium">
                        Your request is being reviewed by an administrator. You
                        will be able to access the subject after approval.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
