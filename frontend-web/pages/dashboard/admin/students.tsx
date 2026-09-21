import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface StudentProgramme {
  id: string;
  programme: "JAMB" | "WAEC";
}

interface Cohort {
  id: string;
  name: string;
  programme?: "JAMB" | "WAEC";
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface StudentCohort {
  id: string;
  status: string;
  joinedAt?: string;
  completedAt?: string | null;
  cohort?: Cohort | null;
}

interface Subject {
  id: string;
  name: string;
  programme?: "JAMB" | "WAEC";
}

interface Enrollment {
  id: string;
  programme?: "JAMB" | "WAEC";
  type?: "FREE" | "PAID";
  enrolledAt?: string;
  expiresAt?: string | null;
  subject?: Subject | null;
}

interface SubjectRequest {
  id: string;
  programme?: "JAMB" | "WAEC";
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  requestedAt?: string;
  reviewedAt?: string | null;
  subject?: Subject | null;
}

interface Subscription {
  id: string;
  plan?: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL" | null;
  billingType?: "COHORT" | "LEGACY";
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  startDate?: string | null;
  endDate?: string | null;
  amount?: number | null;
  currency?: string;
  paymentReference?: string | null;
  cohort?: Cohort | null;
}

interface Payment {
  id: string;
  amount?: number;
  currency?: string;
  status?: "PENDING" | "PARTIAL" | "PAID" | "FAILED" | "REFUNDED";
  paymentReference?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  cohort?: Cohort | null;
}

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  school?: string | null;
  classLevel?: string | null;
  isActive: boolean;

  studentProgrammes?: StudentProgramme[];
  studentCohorts?: StudentCohort[];
  enrollments?: Enrollment[];
  subjectRequests?: SubjectRequest[];
  subscriptions?: Subscription[];
  payments?: Payment[];
}

type FilterStatus = "ALL" | "ACTIVE" | "INACTIVE";
type FilterProgramme = "ALL" | "JAMB" | "WAEC";

export default function AdminStudentsPage() {
  useAdminAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [programmeFilter, setProgrammeFilter] =
    useState<FilterProgramme>("ALL");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/users/students");

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setStudents(data);
    } catch (err: any) {
      console.error("Failed to load students:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load students. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const deactivateStudent = async (id: string) => {
    try {
      setActionLoading(id);
      setError("");

      await api.patch(`/users/${id}/deactivate`);
      await loadStudents();

      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      console.error("Failed to deactivate student:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to deactivate the student. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const activateStudent = async (id: string) => {
    try {
      setActionLoading(id);
      setError("");

      await api.patch(`/users/${id}/activate`);
      await loadStudents();

      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      console.error("Failed to activate student:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to activate the student. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getProgrammes = (student: Student) => {
    const programmes = student.studentProgrammes || [];

    return programmes.map((item) => item.programme).filter(Boolean);
  };

  const getActiveCohort = (student: Student) => {
    const cohorts = student.studentCohorts || [];

    return (
      cohorts.find((item) => item.status === "ACTIVE") || cohorts[0] || null
    );
  };

  const getEnrolledSubjects = (student: Student) => {
    return (student.enrollments || [])
      .map((enrollment) => enrollment.subject?.name)
      .filter(Boolean) as string[];
  };

  const getRequestCounts = (student: Student) => {
    const requests = student.subjectRequests || [];

    return {
      pending: requests.filter((item) => item.status === "PENDING").length,
      approved: requests.filter((item) => item.status === "APPROVED").length,
      rejected: requests.filter((item) => item.status === "REJECTED").length,
    };
  };

  const getActiveSubscription = (student: Student) => {
    return (
      (student.subscriptions || []).find(
        (subscription) => subscription.status === "ACTIVE",
      ) || null
    );
  };

  const getLatestPayment = (student: Student) => {
    const payments = [...(student.payments || [])];

    payments.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });

    return payments[0] || null;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number | null, currency: string = "NGN") => {
    if (amount === null || amount === undefined) return "—";

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = `${student.firstName || ""} ${
        student.lastName || ""
      }`.trim();

      const matchesSearch =
        !query ||
        fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.phone || "").toLowerCase().includes(query) ||
        (student.school || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && student.isActive) ||
        (statusFilter === "INACTIVE" && !student.isActive);

      const programmes = getProgrammes(student);

      const matchesProgramme =
        programmeFilter === "ALL" || programmes.includes(programmeFilter);

      return matchesSearch && matchesStatus && matchesProgramme;
    });
  }, [students, search, statusFilter, programmeFilter]);

  const statistics = useMemo(() => {
    const active = students.filter((student) => student.isActive).length;
    const inactive = students.filter((student) => !student.isActive).length;

    const jamb = students.filter((student) =>
      getProgrammes(student).includes("JAMB"),
    ).length;

    const waec = students.filter((student) =>
      getProgrammes(student).includes("WAEC"),
    ).length;

    return {
      total: students.length,
      active,
      inactive,
      jamb,
      waec,
    };
  }, [students]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">
            Manage student accounts, programmes, cohorts, subjects,
            subscriptions and payments.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {statistics.total}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {statistics.active}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {statistics.inactive}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">JAMB</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {statistics.jamb}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">WAEC</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {statistics.waec}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone or school..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as FilterStatus)
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={programmeFilter}
              onChange={(event) =>
                setProgrammeFilter(event.target.value as FilterProgramme)
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Programmes</option>
              <option value="JAMB">JAMB</option>
              <option value="WAEC">WAEC</option>
            </select>
          </div>
        </div>

        {/* Students table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Student Accounts</h2>
              <p className="text-sm text-slate-500 mt-1">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No students match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50">
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Student
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Programme
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Cohort
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Subjects
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Subscription
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Payment
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const programmes = getProgrammes(student);
                    const cohort = getActiveCohort(student);
                    const subjects = getEnrolledSubjects(student);
                    const subscription = getActiveSubscription(student);
                    const latestPayment = getLatestPayment(student);

                    return (
                      <tr
                        key={student.id}
                        className="border-b last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {student.firstName || ""} {student.lastName || ""}
                          </div>
                          <div className="text-sm text-slate-500">
                            {student.email}
                          </div>
                          {student.school && (
                            <div className="text-xs text-slate-400 mt-1">
                              {student.school}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {programmes.length > 0 ? (
                              programmes.map((programme) => (
                                <span
                                  key={programme}
                                  className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                                >
                                  {programme}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-sm">
                                None
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {cohort?.cohort ? (
                            <div>
                              <div className="font-medium text-slate-800">
                                {cohort.cohort.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {cohort.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              No cohort
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {subjects.length > 0 ? (
                            <div className="max-w-[220px]">
                              <div className="text-sm text-slate-700">
                                {subjects.slice(0, 3).join(", ")}
                              </div>

                              {subjects.length > 3 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  +{subjects.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              No enrollment
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {subscription ? (
                            <div>
                              <span className="inline-flex px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                                {subscription.status}
                              </span>

                              <div className="text-xs text-slate-500 mt-1">
                                {subscription.billingType === "COHORT"
                                  ? "Cohort"
                                  : "Legacy"}
                              </div>

                              {subscription.endDate && (
                                <div className="text-xs text-slate-400 mt-1">
                                  Ends {formatDate(subscription.endDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              No active subscription
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {latestPayment ? (
                            <div>
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                  latestPayment.status === "PAID"
                                    ? "bg-green-50 text-green-700"
                                    : latestPayment.status === "FAILED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {latestPayment.status || "UNKNOWN"}
                              </span>

                              <div className="text-xs text-slate-500 mt-1">
                                {formatAmount(
                                  latestPayment.amount,
                                  latestPayment.currency || "NGN",
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              No payment
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              student.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {student.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              View
                            </button>

                            {student.isActive ? (
                              <button
                                type="button"
                                onClick={() => deactivateStudent(student.id)}
                                disabled={actionLoading === student.id}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                              >
                                {actionLoading === student.id
                                  ? "Working..."
                                  : "Deactivate"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => activateStudent(student.id)}
                                disabled={actionLoading === student.id}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                              >
                                {actionLoading === student.id
                                  ? "Working..."
                                  : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student details modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedStudent.firstName || ""}{" "}
                  {selectedStudent.lastName || ""}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedStudent.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-500 hover:text-slate-900 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic information */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Student Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedStudent.phone || "—"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">School</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedStudent.school || "—"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Class Level</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedStudent.classLevel || "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Programmes */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Programmes
                </h3>

                <div className="flex flex-wrap gap-2">
                  {getProgrammes(selectedStudent).length > 0 ? (
                    getProgrammes(selectedStudent).map((programme) => (
                      <span
                        key={programme}
                        className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold"
                      >
                        {programme}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      No programme selected
                    </span>
                  )}
                </div>
              </section>

              {/* Cohorts */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Cohort History
                </h3>

                {selectedStudent.studentCohorts &&
                selectedStudent.studentCohorts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.studentCohorts.map((studentCohort) => (
                      <div
                        key={studentCohort.id}
                        className="border rounded-xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {studentCohort.cohort?.name || "Unknown cohort"}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {studentCohort.cohort?.programme || "—"}
                            </p>
                          </div>

                          <span className="inline-flex w-fit px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                            {studentCohort.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                          <div>
                            <span className="text-slate-500">Joined:</span>{" "}
                            {formatDate(studentCohort.joinedAt)}
                          </div>

                          <div>
                            <span className="text-slate-500">Start:</span>{" "}
                            {formatDate(studentCohort.cohort?.startDate)}
                          </div>

                          <div>
                            <span className="text-slate-500">End:</span>{" "}
                            {formatDate(studentCohort.cohort?.endDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No cohort history.</p>
                )}
              </section>

              {/* Enrollments */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Subject Enrollments
                </h3>

                {selectedStudent.enrollments &&
                selectedStudent.enrollments.length > 0 ? (
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm">
                            Subject
                          </th>
                          <th className="text-left px-4 py-3 text-sm">
                            Programme
                          </th>
                          <th className="text-left px-4 py-3 text-sm">Type</th>
                          <th className="text-left px-4 py-3 text-sm">
                            Enrolled
                          </th>
                          <th className="text-left px-4 py-3 text-sm">
                            Expires
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedStudent.enrollments.map((enrollment) => (
                          <tr key={enrollment.id} className="border-t">
                            <td className="px-4 py-3 font-medium">
                              {enrollment.subject?.name || "Unknown subject"}
                            </td>

                            <td className="px-4 py-3">
                              {enrollment.programme ||
                                enrollment.subject?.programme ||
                                "—"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-semibold">
                                {enrollment.type || "—"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              {formatDate(enrollment.enrolledAt)}
                            </td>

                            <td className="px-4 py-3">
                              {formatDate(enrollment.expiresAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    No subject enrollments found.
                  </p>
                )}
              </section>

              {/* Subject requests */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">
                    Subject Requests
                  </h3>

                  {(() => {
                    const counts = getRequestCounts(selectedStudent);

                    return (
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                          Pending: {counts.pending}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">
                          Approved: {counts.approved}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-red-50 text-red-700">
                          Rejected: {counts.rejected}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {selectedStudent.subjectRequests &&
                selectedStudent.subjectRequests.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudent.subjectRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {request.subject?.name || "Unknown subject"}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {request.programme || request.subject?.programme} ·
                            Requested {formatDate(request.requestedAt)}
                          </p>

                          {request.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Reason: {request.rejectionReason}
                            </p>
                          )}
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            request.status === "APPROVED"
                              ? "bg-green-50 text-green-700"
                              : request.status === "REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {request.status || "UNKNOWN"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No subject requests found.</p>
                )}
              </section>

              {/* Subscriptions */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Subscriptions
                </h3>

                {selectedStudent.subscriptions &&
                selectedStudent.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.subscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="border rounded-xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {subscription.billingType === "COHORT"
                                ? subscription.cohort?.name ||
                                  "Cohort Subscription"
                                : "Legacy Subscription"}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {subscription.billingType || "—"}{" "}
                              {subscription.plan
                                ? `· ${subscription.plan}`
                                : ""}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              subscription.status === "ACTIVE"
                                ? "bg-green-50 text-green-700"
                                : subscription.status === "EXPIRED"
                                  ? "bg-slate-100 text-slate-700"
                                  : subscription.status === "CANCELLED"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {subscription.status || "UNKNOWN"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                          <div>
                            <span className="text-slate-500">Amount:</span>{" "}
                            {formatAmount(
                              subscription.amount,
                              subscription.currency || "NGN",
                            )}
                          </div>

                          <div>
                            <span className="text-slate-500">Start:</span>{" "}
                            {formatDate(subscription.startDate)}
                          </div>

                          <div>
                            <span className="text-slate-500">End:</span>{" "}
                            {formatDate(subscription.endDate)}
                          </div>
                        </div>

                        {subscription.paymentReference && (
                          <p className="text-xs text-slate-400 mt-3 break-all">
                            Reference: {subscription.paymentReference}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">
                    No subscription history found.
                  </p>
                )}
              </section>

              {/* Payments */}
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Payment History
                </h3>

                {selectedStudent.payments &&
                selectedStudent.payments.length > 0 ? (
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm">Date</th>
                          <th className="text-left px-4 py-3 text-sm">
                            Amount
                          </th>
                          <th className="text-left px-4 py-3 text-sm">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-sm">
                            Cohort
                          </th>
                          <th className="text-left px-4 py-3 text-sm">
                            Reference
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedStudent.payments.map((payment) => (
                          <tr key={payment.id} className="border-t">
                            <td className="px-4 py-3">
                              {formatDate(payment.createdAt)}
                            </td>

                            <td className="px-4 py-3 font-medium">
                              {formatAmount(
                                payment.amount,
                                payment.currency || "NGN",
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  payment.status === "PAID"
                                    ? "bg-green-50 text-green-700"
                                    : payment.status === "FAILED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {payment.status || "UNKNOWN"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              {payment.cohort?.name || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs break-all">
                              {payment.paymentReference || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400">No payment history found.</p>
                )}
              </section>

              {/* Account action */}
              <section className="border-t pt-5 flex justify-end">
                {selectedStudent.isActive ? (
                  <button
                    type="button"
                    onClick={() => deactivateStudent(selectedStudent.id)}
                    disabled={actionLoading === selectedStudent.id}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === selectedStudent.id
                      ? "Deactivating..."
                      : "Deactivate Student"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => activateStudent(selectedStudent.id)}
                    disabled={actionLoading === selectedStudent.id}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === selectedStudent.id
                      ? "Activating..."
                      : "Activate Student"}
                  </button>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
