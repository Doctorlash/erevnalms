import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type StatusFilter = "ALL" | RequestStatus;
type ProgrammeFilter = "ALL" | Programme;

interface SubjectRequest {
  id: string;
  userId: string;
  subjectId: string;
  programme: Programme;
  status: RequestStatus;
  rejectionReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  subject?: {
    id: string;
    name: string;
    description?: string | null;
    programme: Programme;
  };
}

type ReviewAction = "APPROVE" | "REJECT";

export default function AdminSubjectRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [programmeFilter, setProgrammeFilter] =
    useState<ProgrammeFilter>("ALL");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [bulkReviewing, setBulkReviewing] = useState(false);

  const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(
    null,
  );

  const [rejectionReason, setRejectionReason] = useState("");

  const [bulkRejecting, setBulkRejecting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<SubjectRequest[]>(
        "/subject-requests/admin/all",
      );

      setRequests(response.data);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Failed to load subject requests:", err);

      if (err?.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err?.response?.status === 403) {
        setError("You do not have permission to manage subject requests.");
      } else {
        setError(
          "Unable to load subject requests right now. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      const matchesProgramme =
        programmeFilter === "ALL" || request.programme === programmeFilter;

      return matchesStatus && matchesProgramme;
    });
  }, [requests, statusFilter, programmeFilter]);

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING",
  );

  const approvedRequests = requests.filter(
    (request) => request.status === "APPROVED",
  );

  const rejectedRequests = requests.filter(
    (request) => request.status === "REJECTED",
  );

  const allVisiblePendingSelected =
    filteredRequests.filter((request) => request.status === "PENDING").length >
      0 &&
    filteredRequests
      .filter((request) => request.status === "PENDING")
      .every((request) => selectedIds.includes(request.id));

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

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

  const toggleSelection = (requestId: string) => {
    setSelectedIds((current) => {
      if (current.includes(requestId)) {
        return current.filter((id) => id !== requestId);
      }

      return [...current, requestId];
    });
  };

  const toggleSelectAllVisiblePending = () => {
    const visiblePendingIds = filteredRequests
      .filter((request) => request.status === "PENDING")
      .map((request) => request.id);

    if (visiblePendingIds.length === 0) {
      return;
    }

    if (allVisiblePendingSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visiblePendingIds.includes(id)),
      );
    } else {
      setSelectedIds((current) => [
        ...new Set([...current, ...visiblePendingIds]),
      ]);
    }
  };

  const handleReview = async (
    requestId: string,
    action: ReviewAction,
    reason?: string,
  ) => {
    try {
      setReviewingId(requestId);
      setError("");
      setSuccess("");

      if (action === "REJECT" && !reason?.trim()) {
        setError("A rejection reason is required.");
        return;
      }

      await api.patch(`/subject-requests/admin/${requestId}/review`, {
        action,
        ...(action === "REJECT"
          ? {
              rejectionReason: reason?.trim(),
            }
          : {}),
      });

      setSuccess(
        action === "APPROVE"
          ? "Subject request approved successfully."
          : "Subject request rejected successfully.",
      );

      setRejectionRequestId(null);
      setRejectionReason("");

      await loadRequests();
    } catch (err: any) {
      console.error("Failed to review subject request:", err);

      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError("Unable to review this subject request. Please try again.");
      }
    } finally {
      setReviewingId(null);
    }
  };

  const openRejectionModal = (requestId: string) => {
    setError("");
    setSuccess("");
    setRejectionReason("");
    setRejectionRequestId(requestId);
  };

  const closeRejectionModal = () => {
    if (reviewingId) {
      return;
    }

    setRejectionRequestId(null);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    if (!rejectionRequestId) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    await handleReview(rejectionRequestId, "REJECT", rejectionReason);
  };

  const handleBulkApprove = async () => {
    const pendingSelectedIds = selectedIds.filter((id) =>
      requests.some(
        (request) => request.id === id && request.status === "PENDING",
      ),
    );

    if (pendingSelectedIds.length === 0) {
      setError("Select at least one pending request.");
      return;
    }

    try {
      setBulkReviewing(true);
      setError("");
      setSuccess("");

      await api.patch("/subject-requests/admin/bulk-review", {
        requestIds: pendingSelectedIds,
        action: "APPROVE",
      });

      setSuccess(
        `${pendingSelectedIds.length} subject request${
          pendingSelectedIds.length === 1 ? "" : "s"
        } approved successfully.`,
      );

      setSelectedIds([]);

      await loadRequests();
    } catch (err: any) {
      console.error("Failed to bulk approve subject requests:", err);

      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError("Unable to approve the selected requests. Please try again.");
      }
    } finally {
      setBulkReviewing(false);
    }
  };

  const handleBulkReject = async () => {
    const pendingSelectedIds = selectedIds.filter((id) =>
      requests.some(
        (request) => request.id === id && request.status === "PENDING",
      ),
    );

    if (pendingSelectedIds.length === 0) {
      setError("Select at least one pending request.");
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    try {
      setBulkReviewing(true);
      setError("");
      setSuccess("");

      await api.patch("/subject-requests/admin/bulk-review", {
        requestIds: pendingSelectedIds,
        action: "REJECT",
        rejectionReason: rejectionReason.trim(),
      });

      setSuccess(
        `${pendingSelectedIds.length} subject request${
          pendingSelectedIds.length === 1 ? "" : "s"
        } rejected successfully.`,
      );

      setSelectedIds([]);
      setBulkRejecting(false);
      setRejectionReason("");

      await loadRequests();
    } catch (err: any) {
      console.error("Failed to bulk reject subject requests:", err);

      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError("Unable to reject the selected requests. Please try again.");
      }
    } finally {
      setBulkReviewing(false);
    }
  };

  const openBulkReject = () => {
    const pendingSelectedIds = selectedIds.filter((id) =>
      requests.some(
        (request) => request.id === id && request.status === "PENDING",
      ),
    );

    if (pendingSelectedIds.length === 0) {
      setError("Select at least one pending request.");
      return;
    }

    setError("");
    setSuccess("");
    setRejectionReason("");
    setBulkRejecting(true);
  };

  const closeBulkReject = () => {
    if (bulkReviewing) {
      return;
    }

    setBulkRejecting(false);
    setRejectionReason("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl text-white p-8 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-indigo-200 font-semibold mb-2">
                ADMINISTRATION
              </p>

              <h1 className="text-4xl font-bold mb-3">Subject Requests</h1>

              <p className="text-indigo-100 max-w-3xl">
                Review student subject enrollment requests, approve individual
                requests, reject requests with reasons, or process multiple
                pending requests at once.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 font-semibold transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-red-600">{error}</p>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-green-600">{success}</p>

              <button
                type="button"
                onClick={() => setSuccess("")}
                className="text-green-500 hover:text-green-700 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 font-medium">Total Requests</p>

            <p className="text-4xl font-bold text-indigo-700 mt-2">
              {requests.length}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 font-medium">Pending</p>

            <p className="text-4xl font-bold text-yellow-600 mt-2">
              {pendingRequests.length}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 font-medium">Approved</p>

            <p className="text-4xl font-bold text-green-600 mt-2">
              {approvedRequests.length}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 font-medium">Rejected</p>

            <p className="text-4xl font-bold text-red-600 mt-2">
              {rejectedRequests.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="grid sm:grid-cols-2 gap-5 flex-1">
              <div>
                <label
                  htmlFor="statusFilter"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Status
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="programmeFilter"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Programme
                </label>

                <select
                  id="programmeFilter"
                  value={programmeFilter}
                  onChange={(e) =>
                    setProgrammeFilter(e.target.value as ProgrammeFilter)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">All Programmes</option>
                  <option value="JAMB">JAMB</option>
                  <option value="WAEC">WAEC</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 transition"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="font-bold text-indigo-800">
                  {selectedIds.length} request
                  {selectedIds.length === 1 ? "" : "s"} selected
                </p>

                <p className="text-sm text-indigo-600 mt-1">
                  Bulk actions apply only to pending requests.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={bulkReviewing}
                  className="rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 text-white font-semibold transition"
                >
                  {bulkReviewing ? "Processing..." : "✓ Approve Selected"}
                </button>

                <button
                  type="button"
                  onClick={openBulkReject}
                  disabled={bulkReviewing}
                  className="rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-5 py-3 text-white font-semibold transition"
                >
                  ✕ Reject Selected
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  disabled={bulkReviewing}
                  className="rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-5 py-3 text-gray-700 font-semibold transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requests */}
        {loading ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-5">📋</div>

            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Loading Requests
            </h2>

            <p className="text-gray-500">
              Please wait while the subject requests are loaded.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-5">📭</div>

            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No Requests Found
            </h2>

            <p className="text-gray-500 max-w-xl mx-auto">
              There are no subject requests matching the current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Select all */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisiblePendingSelected}
                  onChange={toggleSelectAllVisiblePending}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />

                <span className="font-semibold text-gray-700">
                  Select all visible pending requests
                </span>
              </label>
            </div>

            {filteredRequests.map((request) => {
              const isSelected = selectedIds.includes(request.id);

              const isReviewing = reviewingId === request.id;

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-3xl shadow-lg overflow-hidden border-2 transition ${
                    isSelected ? "border-indigo-400" : "border-transparent"
                  }`}
                >
                  <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />

                  <div className="p-6">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                      {/* Request information */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {request.status === "PENDING" && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(request.id)}
                              disabled={isReviewing}
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}

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
                              {request.subject?.name || "Subject unavailable"}
                            </h2>

                            {request.user && (
                              <div className="mt-4">
                                <p className="text-sm text-gray-500">Student</p>

                                <p className="font-bold text-gray-800">
                                  {request.user.firstName}{" "}
                                  {request.user.lastName}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {request.user.email}
                                </p>
                              </div>
                            )}

                            <div className="mt-4 text-sm text-gray-500">
                              <p>
                                Requested:{" "}
                                <span className="font-medium text-gray-700">
                                  {formatDate(request.requestedAt)}
                                </span>
                              </p>

                              {request.reviewedAt && (
                                <p className="mt-1">
                                  Reviewed:{" "}
                                  <span className="font-medium text-gray-700">
                                    {formatDate(request.reviewedAt)}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === "PENDING" && (
                        <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                          <button
                            type="button"
                            onClick={() => handleReview(request.id, "APPROVE")}
                            disabled={isReviewing}
                            className="rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 text-white font-semibold transition"
                          >
                            {isReviewing ? "Processing..." : "✓ Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openRejectionModal(request.id)}
                            disabled={isReviewing}
                            className="rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-5 py-3 text-white font-semibold transition"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {request.status === "REJECTED" && (
                      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                        <p className="text-sm font-bold text-red-700 mb-2">
                          Rejection Reason
                        </p>

                        <p className="text-red-600">
                          {request.rejectionReason ||
                            "No rejection reason was provided."}
                        </p>
                      </div>
                    )}

                    {/* Approved information */}
                    {request.status === "APPROVED" && (
                      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                        <p className="font-medium text-green-700">
                          This request has been approved and the student has
                          been enrolled in this subject.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual rejection modal */}
      {rejectionRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Reject Subject Request
                  </h2>

                  <p className="text-gray-500 mt-1">
                    A rejection reason is required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRejectionModal}
                  disabled={!!reviewingId}
                  className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Rejection Reason
              </label>

              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this subject request is being rejected..."
                rows={5}
                disabled={!!reviewingId}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none resize-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeRejectionModal}
                  disabled={!!reviewingId}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitRejection}
                  disabled={!!reviewingId || !rejectionReason.trim()}
                  className="rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 font-semibold text-white"
                >
                  {reviewingId ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk rejection modal */}
      {bulkRejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Reject Selected Requests
                  </h2>

                  <p className="text-gray-500 mt-1">
                    The same rejection reason will be applied to all selected
                    pending requests.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeBulkReject}
                  disabled={bulkReviewing}
                  className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <label
                htmlFor="bulkRejectionReason"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Rejection Reason
              </label>

              <textarea
                id="bulkRejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why these requests are being rejected..."
                rows={5}
                disabled={bulkReviewing}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none resize-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeBulkReject}
                  disabled={bulkReviewing}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleBulkReject}
                  disabled={bulkReviewing || !rejectionReason.trim()}
                  className="rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 font-semibold text-white"
                >
                  {bulkReviewing ? "Rejecting..." : "Reject Selected"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
