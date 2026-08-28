import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  videoUrl?: string | null;
  duration?: number | null;

  isPublished: boolean;
  isPremium: boolean;

  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

  rejectionReason?: string | null;

  createdAt: string;
  updatedAt: string;

  approvedAt?: string | null;

  topic?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

type LessonFilter =
  | "ALL"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT";

export default function AdminLessonsPage() {
  useAdminAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<LessonFilter>("PENDING_APPROVAL");

  /*

* ============================================================
* LOAD ALL LESSONS
* ============================================================
  */

  const loadLessons = async () => {
    try {
      setLoading(true);

      const response = await api.get("/lessons/admin");

      setLessons(response.data);
    } catch (error: any) {
      console.error("Failed to load lessons:", error);

      alert(error?.response?.data?.message || "Unable to load lessons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  /*

* ============================================================
* FILTER LESSONS
* ============================================================
  */

  const filteredLessons = useMemo(() => {
    if (filter === "ALL") {
      return lessons;
    }

    return lessons.filter((lesson) => lesson.status === filter);
  }, [lessons, filter]);

  /*

* ============================================================
* STATISTICS
* ============================================================
  */

  const totalLessons = lessons.length;

  const pendingLessons = lessons.filter(
    (lesson) => lesson.status === "PENDING_APPROVAL",
  ).length;

  const approvedLessons = lessons.filter(
    (lesson) => lesson.status === "APPROVED",
  ).length;

  const rejectedLessons = lessons.filter(
    (lesson) => lesson.status === "REJECTED",
  ).length;

  const draftLessons = lessons.filter(
    (lesson) => lesson.status === "DRAFT",
  ).length;

  /*

* ============================================================
* APPROVE LESSON
* ============================================================
  */

  const approveLesson = async (lesson: Lesson) => {
    const confirmed = confirm(
      `Approve "${lesson.title}" and publish it for students?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(lesson.id);

      await api.patch(`/lessons/${lesson.id}/approve`);

      alert("Lesson approved and published successfully.");

      setSelectedLesson(null);
      setRejectionReason("");

      await loadLessons();
    } catch (error: any) {
      console.error("Failed to approve lesson:", error);

      alert(error?.response?.data?.message || "Unable to approve this lesson.");
    } finally {
      setProcessingId(null);
    }
  };

  /*

* ============================================================
* REJECT LESSON
* ============================================================
  */

  const rejectLesson = async (lesson: Lesson) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting this lesson.");

      return;
    }

    const confirmed = confirm(`Reject "${lesson.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(lesson.id);

      await api.patch(`/lessons/${lesson.id}/reject`, {
        reason: rejectionReason.trim(),
      });

      alert("Lesson rejected successfully.");

      setSelectedLesson(null);
      setRejectionReason("");

      await loadLessons();
    } catch (error: any) {
      console.error("Failed to reject lesson:", error);

      alert(error?.response?.data?.message || "Unable to reject this lesson.");
    } finally {
      setProcessingId(null);
    }
  };

  /*

* ============================================================
* DELETE LESSON
* ============================================================
  */

  const deleteLesson = async (lesson: Lesson) => {
    const confirmed = confirm(
      `Are you sure you want to permanently delete "${lesson.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(lesson.id);

      await api.delete(`/lessons/${lesson.id}`);

      alert("Lesson deleted successfully.");

      setSelectedLesson(null);

      await loadLessons();
    } catch (error: any) {
      console.error("Failed to delete lesson:", error);

      alert(error?.response?.data?.message || "Unable to delete this lesson.");
    } finally {
      setProcessingId(null);
    }
  };

  /*

* ============================================================
* STATUS STYLING
* ============================================================
  */

  const statusClasses = (status: Lesson["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";

      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "DRAFT":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* ============================================================
   * STATUS LABEL
   * ============================================================
   */

  const statusLabel = (status: Lesson["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "Pending Approval";

      case "APPROVED":
        return "Approved";

      case "REJECTED":
        return "Rejected";

      case "DRAFT":
        return "Draft";

      default:
        return status;
    }
  };

  /*

* ============================================================
* DATE FORMAT
* ============================================================
  */

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  /*

* ============================================================
* OPEN REVIEW MODAL
* ============================================================
  */

  const openReview = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setRejectionReason("");
  };

  /*

* ============================================================
* CLOSE REVIEW MODAL
* ============================================================
  */

  const closeReview = () => {
    setSelectedLesson(null);
    setRejectionReason("");
  };

  /*

* ============================================================
* PAGE
* ============================================================
  */

  return (
    <AdminLayout>
      {" "}
      <div className="mb-8">
        {" "}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-3xl font-bold text-slate-900">
              Lesson Management{" "}
            </h1>
            <p className="text-gray-500 mt-2">
              Review, approve, reject and manage lessons submitted by teachers.
            </p>
          </div>
          <button
            onClick={loadLessons}
            disabled={loading}
            className="border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {/* ========================================================
      STATISTICS
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <button
          onClick={() => setFilter("ALL")}
          className={`text-left bg-white rounded-xl shadow p-5 border-2 ${
            filter === "ALL" ? "border-blue-500" : "border-transparent"
          }`}
        >
          <p className="text-sm text-gray-500">Total Lessons</p>

          <p className="text-3xl font-bold mt-2 text-slate-900">
            {totalLessons}
          </p>
        </button>

        <button
          onClick={() => setFilter("PENDING_APPROVAL")}
          className={`text-left bg-white rounded-xl shadow p-5 border-2 ${
            filter === "PENDING_APPROVAL"
              ? "border-yellow-500"
              : "border-transparent"
          }`}
        >
          <p className="text-sm text-gray-500">Pending</p>

          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {pendingLessons}
          </p>
        </button>

        <button
          onClick={() => setFilter("APPROVED")}
          className={`text-left bg-white rounded-xl shadow p-5 border-2 ${
            filter === "APPROVED" ? "border-green-500" : "border-transparent"
          }`}
        >
          <p className="text-sm text-gray-500">Approved</p>

          <p className="text-3xl font-bold mt-2 text-green-600">
            {approvedLessons}
          </p>
        </button>

        <button
          onClick={() => setFilter("REJECTED")}
          className={`text-left bg-white rounded-xl shadow p-5 border-2 ${
            filter === "REJECTED" ? "border-red-500" : "border-transparent"
          }`}
        >
          <p className="text-sm text-gray-500">Rejected</p>

          <p className="text-3xl font-bold mt-2 text-red-600">
            {rejectedLessons}
          </p>
        </button>

        <button
          onClick={() => setFilter("DRAFT")}
          className={`text-left bg-white rounded-xl shadow p-5 border-2 ${
            filter === "DRAFT" ? "border-gray-500" : "border-transparent"
          }`}
        >
          <p className="text-sm text-gray-500">Drafts</p>

          <p className="text-3xl font-bold mt-2 text-gray-600">
            {draftLessons}
          </p>
        </button>
      </div>
      {/* ========================================================
      FILTER BAR
      ======================================================== */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("PENDING_APPROVAL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "PENDING_APPROVAL"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({pendingLessons})
          </button>

          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "APPROVED"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Approved ({approvedLessons})
          </button>

          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "REJECTED"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rejected ({rejectedLessons})
          </button>

          <button
            onClick={() => setFilter("DRAFT")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "DRAFT"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Drafts ({draftLessons})
          </button>
        </div>
      </div>
      {/* ========================================================
      LESSON TABLE
      ======================================================== */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            {filter === "ALL"
              ? "All Lessons"
              : `${statusLabel(filter)} Lessons`}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredLessons.length} lesson
            {filteredLessons.length === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading lessons...
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No lessons found
            </h3>

            <p className="text-gray-500 mt-2">
              There are currently no lessons in this category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4">Lesson</th>

                  <th className="text-left px-6 py-4">Subject</th>

                  <th className="text-left px-6 py-4">Topic</th>

                  <th className="text-left px-6 py-4">Teacher</th>

                  <th className="text-left px-6 py-4">Status</th>

                  <th className="text-left px-6 py-4">Submitted</th>

                  <th className="text-left px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {lesson.title}
                        </p>

                        {lesson.description && (
                          <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {lesson.topic?.subject?.name || "-"}
                    </td>

                    <td className="px-6 py-4">{lesson.topic?.name || "-"}</td>

                    <td className="px-6 py-4">
                      {lesson.createdBy ? (
                        <div>
                          <p className="font-medium">
                            {lesson.createdBy.firstName}{" "}
                            {lesson.createdBy.lastName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {lesson.createdBy.email}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(
                          lesson.status,
                        )}`}
                      >
                        {statusLabel(lesson.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(lesson.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openReview(lesson)}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Review
                        </button>

                        {lesson.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() => approveLesson(lesson)}
                            disabled={processingId === lesson.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm"
                          >
                            {processingId === lesson.id ? "..." : "Approve"}
                          </button>
                        )}

                        <button
                          onClick={() => deleteLesson(lesson)}
                          disabled={processingId === lesson.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ========================================================
      REVIEW MODAL
      ======================================================== */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}

            <div className="border-b px-6 py-5 flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedLesson.title}
                  </h2>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(
                      selectedLesson.status,
                    )}`}
                  >
                    {statusLabel(selectedLesson.status)}
                  </span>
                </div>

                <p className="text-gray-500 mt-2">
                  {selectedLesson.topic?.subject?.name || "-"} →{" "}
                  {selectedLesson.topic?.name || "-"}
                </p>
              </div>

              <button
                onClick={closeReview}
                className="text-gray-400 hover:text-gray-900 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}

            <div className="overflow-y-auto p-6">
              {/* Lesson metadata */}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Teacher</p>

                  <p className="font-semibold mt-1">
                    {selectedLesson.createdBy
                      ? `${selectedLesson.createdBy.firstName} ${selectedLesson.createdBy.lastName}`
                      : "-"}
                  </p>

                  {selectedLesson.createdBy?.email && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedLesson.createdBy.email}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Subject</p>

                  <p className="font-semibold mt-1">
                    {selectedLesson.topic?.subject?.name || "-"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Topic</p>

                  <p className="font-semibold mt-1">
                    {selectedLesson.topic?.name || "-"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Duration</p>

                  <p className="font-semibold mt-1">
                    {selectedLesson.duration
                      ? `${selectedLesson.duration} minutes`
                      : "Not specified"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Submitted</p>

                  <p className="font-semibold mt-1">
                    {formatDate(selectedLesson.createdAt)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Last Updated</p>

                  <p className="font-semibold mt-1">
                    {formatDate(selectedLesson.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Description */}

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Description</h3>

                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  {selectedLesson.description || "No description provided."}
                </div>
              </div>

              {/* Full Lesson Content */}

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Full Lesson Content</h3>

                <div className="border rounded-lg p-6 bg-white whitespace-pre-wrap leading-7 text-gray-700 max-h-[500px] overflow-y-auto">
                  {selectedLesson.content}
                </div>
              </div>

              {/* Video */}

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Video</h3>

                {selectedLesson.videoUrl ? (
                  <a
                    href={selectedLesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {selectedLesson.videoUrl}
                  </a>
                ) : (
                  <p className="text-gray-500">No video attached.</p>
                )}
              </div>

              {/* Approval Information */}

              {selectedLesson.status === "APPROVED" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-8">
                  <h3 className="font-bold text-green-800">
                    Approval Information
                  </h3>

                  <p className="text-green-700 mt-2">
                    Approved on: {formatDate(selectedLesson.approvedAt)}
                  </p>

                  {selectedLesson.approvedBy && (
                    <p className="text-green-700 mt-1">
                      Approved by: {selectedLesson.approvedBy.firstName}{" "}
                      {selectedLesson.approvedBy.lastName}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Information */}

              {selectedLesson.status === "REJECTED" &&
                selectedLesson.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-8">
                    <h3 className="font-bold text-red-800">Rejection Reason</h3>

                    <p className="text-red-700 mt-2 whitespace-pre-wrap">
                      {selectedLesson.rejectionReason}
                    </p>
                  </div>
                )}

              {/* Rejection Form */}

              {selectedLesson.status === "PENDING_APPROVAL" && (
                <div className="border-t pt-6">
                  <h3 className="font-bold text-lg mb-2">Reject Lesson</h3>

                  <p className="text-sm text-gray-500 mb-3">
                    Explain clearly what the teacher needs to correct before
                    resubmitting the lesson.
                  </p>

                  <textarea
                    rows={5}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Example: Please improve the explanation of IPv4 addressing and add practical examples..."
                    className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Footer */}

            <div className="border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end bg-gray-50">
              <button
                onClick={closeReview}
                className="border border-gray-300 bg-white px-5 py-2 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>

              {selectedLesson.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    onClick={() => rejectLesson(selectedLesson)}
                    disabled={processingId === selectedLesson.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                  >
                    {processingId === selectedLesson.id
                      ? "Processing..."
                      : "Reject Lesson"}
                  </button>

                  <button
                    onClick={() => approveLesson(selectedLesson)}
                    disabled={processingId === selectedLesson.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                  >
                    {processingId === selectedLesson.id
                      ? "Processing..."
                      : "Approve & Publish"}
                  </button>
                </>
              )}

              {selectedLesson.status !== "PENDING_APPROVAL" && (
                <button
                  onClick={() => deleteLesson(selectedLesson)}
                  disabled={processingId === selectedLesson.id}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  Delete Lesson
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
