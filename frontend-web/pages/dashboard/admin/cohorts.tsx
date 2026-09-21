import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";
type CohortStatus = "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";

interface CohortStudent {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED" | "WITHDRAWN";
  joinedAt: string;
  completedAt?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
  };
}

interface Cohort {
  id: string;
  name: string;
  programme: Programme;
  description?: string | null;
  startDate: string;
  endDate: string;
  fee: number;
  status: CohortStatus;
  effectiveStatus?: CohortStatus;
  createdAt: string;
  updatedAt: string;
  students?: CohortStudent[];
  _count?: {
    students?: number;
    payments?: number;
    subscriptions?: number;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  studentProgrammes?: {
    programme: Programme;
  }[];
  studentCohorts?: {
    cohortId: string;
    status: "ACTIVE" | "COMPLETED" | "SUSPENDED" | "WITHDRAWN";
  }[];
}

interface CohortForm {
  name: string;
  programme: Programme;
  description: string;
  startDate: string;
  endDate: string;
  fee: string;
}

const emptyForm: CohortForm = {
  name: "",
  programme: "JAMB",
  description: "",
  startDate: "",
  endDate: "",
  fee: "",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
}

function getStatusClasses(status: CohortStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "UPCOMING":
      return "bg-blue-100 text-blue-700";
    case "ENDED":
      return "bg-slate-100 text-slate-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getMembershipClasses(status: CohortStudent["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "COMPLETED":
      return "bg-blue-100 text-blue-700";
    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";
    case "WITHDRAWN":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getApiErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || fallback
  );
}

function extractArray<T>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    Array.isArray((responseData as { data?: unknown }).data)
  ) {
    return (responseData as { data: T[] }).data;
  }

  return [];
}

export default function AdminCohortsPage() {
  useAdminAuth();

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [form, setForm] = useState<CohortForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState("");

  const [programmeFilter, setProgrammeFilter] = useState<"ALL" | Programme>(
    "ALL",
  );

  const [statusFilter, setStatusFilter] = useState<"ALL" | CohortStatus>("ALL");

  const [search, setSearch] = useState("");

  const loadCohorts = async () => {
    try {
      setError("");

      const response = await api.get("/cohorts");

      setCohorts(extractArray<Cohort>(response.data));
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to load cohorts."));
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);

      const response = await api.get("/users/students");

      setStudents(extractArray<Student>(response.data));
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to load students."));
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadCohortDetails = async (cohortId: string) => {
    try {
      const response = await api.get(`/cohorts/${cohortId}`);

      setSelectedCohort(response.data);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to load cohort details."));
    }
  };

  useEffect(() => {
    void loadCohorts();
  }, []);

  const filteredCohorts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cohorts.filter((cohort) => {
      const matchesSearch =
        !query ||
        cohort.name.toLowerCase().includes(query) ||
        cohort.programme.toLowerCase().includes(query);

      const matchesProgramme =
        programmeFilter === "ALL" || cohort.programme === programmeFilter;

      const effectiveStatus = cohort.effectiveStatus || cohort.status;

      const matchesStatus =
        statusFilter === "ALL" || effectiveStatus === statusFilter;

      return matchesSearch && matchesProgramme && matchesStatus;
    });
  }, [cohorts, search, programmeFilter, statusFilter]);

  const availableStudents = useMemo(() => {
    if (!selectedCohort) {
      return [];
    }

    const cohortStudentIds = new Set(
      (selectedCohort.students || []).map((student) => student.user.id),
    );

    const query = studentSearch.trim().toLowerCase();

    return students.filter((student) => {
      if (cohortStudentIds.has(student.id)) {
        return false;
      }

      if (!student.isActive) {
        return false;
      }

      const hasProgramme = student.studentProgrammes?.some(
        (item) => item.programme === selectedCohort.programme,
      );

      if (!hasProgramme) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(query) || student.email.toLowerCase().includes(query)
      );
    });
  }, [students, selectedCohort, studentSearch]);

  const openCreateForm = () => {
    setEditingCohort(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (cohort: Cohort) => {
    const effectiveStatus = cohort.effectiveStatus || cohort.status;

    if (effectiveStatus === "CANCELLED") {
      setError("Cancelled cohorts cannot be edited.");
      return;
    }

    setEditingCohort(cohort);

    setForm({
      name: cohort.name,
      programme: cohort.programme,
      description: cohort.description || "",
      startDate: toDateTimeLocal(cohort.startDate),
      endDate: toDateTimeLocal(cohort.endDate),
      fee: String(cohort.fee),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCohort(null);
    setForm(emptyForm);
  };

  const handleFormChange = (field: keyof CohortForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Cohort name is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    const startTime = new Date(form.startDate).getTime();
    const endTime = new Date(form.endDate).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      setError("Please provide valid start and end dates.");
      return;
    }

    if (endTime <= startTime) {
      setError("End date must be after the start date.");
      return;
    }

    const fee = Number(form.fee);

    if (!Number.isInteger(fee) || fee < 0) {
      setError("Fee must be a valid whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      programme: form.programme,
      description: form.description.trim() || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      fee,
    };

    try {
      setSaving(true);

      if (editingCohort) {
        await api.patch(`/cohorts/${editingCohort.id}`, payload);

        setSuccess("Cohort updated successfully.");
      } else {
        await api.post("/cohorts", payload);

        setSuccess("Cohort created successfully.");
      }

      setShowForm(false);
      setEditingCohort(null);
      setForm(emptyForm);

      await loadCohorts();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          editingCohort
            ? "Failed to update cohort."
            : "Failed to create cohort.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCohort = async (cohort: Cohort) => {
    const effectiveStatus = cohort.effectiveStatus || cohort.status;

    if (effectiveStatus === "CANCELLED" || effectiveStatus === "ENDED") {
      return;
    }

    const confirmed = window.confirm(
      `Cancel "${cohort.name}"?\n\nThis preserves the cohort history but prevents it from being used as an active cohort.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.patch(`/cohorts/${cohort.id}/cancel`);

      setSuccess("Cohort cancelled successfully.");

      await loadCohorts();

      if (selectedCohort?.id === cohort.id) {
        await loadCohortDetails(cohort.id);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to cancel cohort."));
    }
  };

  const handleOpenCohort = async (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setStudentSearch("");
    setSelectedStudentId("");
    setError("");
    setSuccess("");

    await Promise.all([loadCohortDetails(cohort.id), loadStudents()]);
  };

  const handleAssignStudent = async () => {
    if (!selectedCohort || !selectedStudentId) {
      setError("Select a student first.");
      return;
    }

    try {
      setAssigningStudent(true);
      setError("");
      setSuccess("");

      await api.post(`/cohorts/${selectedCohort.id}/students`, {
        userId: selectedStudentId,
      });

      setSuccess("Student assigned to cohort successfully.");
      setSelectedStudentId("");

      await Promise.all([
        loadCohorts(),
        loadCohortDetails(selectedCohort.id),
        loadStudents(),
      ]);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to assign student."));
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleRemoveStudent = async (student: CohortStudent) => {
    if (!selectedCohort) {
      return;
    }

    const fullName = `${student.user.firstName} ${student.user.lastName}`;

    const confirmed = window.confirm(
      `Remove ${fullName} from "${selectedCohort.name}"?\n\nThis will mark the cohort membership as withdrawn and preserve its history.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingStudentId(student.user.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/cohorts/${selectedCohort.id}/students/${student.user.id}`,
      );

      setSuccess("Student withdrawn from cohort.");

      await Promise.all([loadCohorts(), loadCohortDetails(selectedCohort.id)]);
    } catch (err: any) {
      setError(
        getApiErrorMessage(err, "Failed to remove student from cohort."),
      );
    } finally {
      setRemovingStudentId("");
    }
  };

  const totalStudents = cohorts.reduce(
    (total, cohort) => total + (cohort._count?.students || 0),
    0,
  );

  const activeCohorts = cohorts.filter(
    (cohort) => (cohort.effectiveStatus || cohort.status) === "ACTIVE",
  ).length;

  const upcomingCohorts = cohorts.filter(
    (cohort) => (cohort.effectiveStatus || cohort.status) === "UPCOMING",
  ).length;

  const selectedStatus = selectedCohort
    ? selectedCohort.effectiveStatus || selectedCohort.status
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cohorts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage JAMB and WAEC student cohorts, memberships, fees
              and dates.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Create Cohort
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Cohorts</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {cohorts.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active Cohorts</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {activeCohorts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Upcoming Cohorts</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {upcomingCohorts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cohort Memberships</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalStudents}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cohort name..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Programme
              </label>

              <select
                value={programmeFilter}
                onChange={(event) =>
                  setProgrammeFilter(event.target.value as "ALL" | Programme)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All programmes</option>
                <option value="JAMB">JAMB</option>
                <option value="WAEC">WAEC</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | CohortStatus)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="ENDED">Ended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cohorts table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Cohort List</h2>

              <p className="text-xs text-slate-500">
                {filteredCohorts.length} cohort
                {filteredCohorts.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Loading cohorts...
            </div>
          ) : filteredCohorts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-medium text-slate-700">No cohorts found.</p>

              <p className="mt-1 text-sm text-slate-500">
                Create a cohort or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Cohort</th>
                    <th className="px-5 py-3">Programme</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Fee</th>
                    <th className="px-5 py-3">Students</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCohorts.map((cohort) => {
                    const status = cohort.effectiveStatus || cohort.status;

                    return (
                      <tr
                        key={cohort.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {cohort.name}
                          </div>

                          {cohort.description && (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {cohort.description}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {cohort.programme}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          <div>{formatDate(cohort.startDate)}</div>

                          <div className="text-xs text-slate-400">
                            to {formatDate(cohort.endDate)}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          ₦{cohort.fee.toLocaleString("en-NG")}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {cohort._count?.students || 0}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void handleOpenCohort(cohort)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Students
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditForm(cohort)}
                              disabled={status === "CANCELLED"}
                              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleCancelCohort(cohort)}
                              disabled={
                                status === "CANCELLED" || status === "ENDED"
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Cancel
                            </button>
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

        {/* Create / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCohort ? "Edit Cohort" : "Create Cohort"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {editingCohort
                      ? "Update the cohort details."
                      : "Create a JAMB or WAEC cohort."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Cohort Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleFormChange("name", event.target.value)
                    }
                    placeholder="e.g. September 2026 JAMB Cohort"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Programme
                    </label>

                    <select
                      value={form.programme}
                      onChange={(event) =>
                        handleFormChange("programme", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="JAMB">JAMB</option>
                      <option value="WAEC">WAEC</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Fee (NGN)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.fee}
                      onChange={(event) =>
                        handleFormChange("fee", event.target.value)
                      }
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Start Date
                    </label>

                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) =>
                        handleFormChange("startDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      End Date
                    </label>

                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) =>
                        handleFormChange("endDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      handleFormChange("description", event.target.value)
                    }
                    rows={4}
                    placeholder="Optional cohort description..."
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingCohort
                        ? "Save Changes"
                        : "Create Cohort"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cohort Student Management Modal */}
        {selectedCohort && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedCohort.name}
                    </h2>

                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {selectedCohort.programme}
                    </span>

                    {selectedStatus && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          selectedStatus,
                        )}`}
                      >
                        {selectedStatus}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(selectedCohort.startDate)} —{" "}
                    {formatDate(selectedCohort.endDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCohort(null);
                    setSelectedStudentId("");
                    setStudentSearch("");
                  }}
                  className="self-start rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close cohort details"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Assign student */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Add Student
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Only active students with the {selectedCohort.programme}{" "}
                      programme are shown.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(event) =>
                          setStudentSearch(event.target.value)
                        }
                        placeholder="Search students..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <select
                        value={selectedStudentId}
                        onChange={(event) =>
                          setSelectedStudentId(event.target.value)
                        }
                        disabled={studentsLoading}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                      >
                        <option value="">
                          {studentsLoading
                            ? "Loading students..."
                            : availableStudents.length === 0
                              ? "No eligible students"
                              : "Select a student"}
                        </option>

                        {availableStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} —{" "}
                            {student.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleAssignStudent()}
                      disabled={
                        assigningStudent ||
                        !selectedStudentId ||
                        selectedStatus === "CANCELLED" ||
                        selectedStatus === "ENDED"
                      }
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigningStudent ? "Adding..." : "Add Student"}
                    </button>
                  </div>
                </div>

                {/* Students */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Cohort Students
                      </h3>

                      <p className="text-xs text-slate-500">
                        {selectedCohort.students?.length || 0} membership
                        {(selectedCohort.students?.length || 0) === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>

                  {!selectedCohort.students ||
                  selectedCohort.students.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="font-medium text-slate-700">
                        No students assigned yet.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Use the Add Student section above to assign a student.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-white">
                          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-5 py-3">Student</th>
                            <th className="px-5 py-3">Email</th>
                            <th className="px-5 py-3">Phone</th>
                            <th className="px-5 py-3">Membership</th>
                            <th className="px-5 py-3">Joined</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {selectedCohort.students.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4">
                                <div className="font-semibold text-slate-900">
                                  {student.user.firstName}{" "}
                                  {student.user.lastName}
                                </div>

                                {!student.user.isActive && (
                                  <span className="text-xs text-red-600">
                                    Account inactive
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {student.user.email}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {student.user.phone || "—"}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getMembershipClasses(
                                    student.status,
                                  )}`}
                                >
                                  {student.status}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {formatDate(student.joinedAt)}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRemoveStudent(student)
                                  }
                                  disabled={
                                    removingStudentId === student.user.id
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {removingStudentId === student.user.id
                                    ? "Removing..."
                                    : "Withdraw"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Cohort information */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cohort Fee
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      ₦{selectedCohort.fee.toLocaleString("en-NG")}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(selectedCohort.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payments
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {selectedCohort._count?.payments || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
