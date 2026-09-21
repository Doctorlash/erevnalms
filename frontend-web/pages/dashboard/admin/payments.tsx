import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "FAILED" | "REFUNDED";

interface Payment {
  id: string;

  userId: string;

  cohortId?: string | null;
  studentCohortId?: string | null;
  subscriptionId?: string | null;

  amount: number;
  currency: string;

  status: PaymentStatus;

  paymentReference?: string | null;
  paymentMethod?: string | null;

  paidAt?: string | null;

  createdAt: string;
  updatedAt: string;

  provider: string;
  providerTransactionId?: string | null;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  cohort?: {
    id: string;
    name: string;
    programme: "JAMB" | "WAEC";
    startDate: string;
    endDate: string;
    fee: number;
    status: "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";
  } | null;
}

interface PaymentResponse {
  data?: Payment[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export default function AdminPaymentsPage() {
  useAdminAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>(
    "ALL",
  );

  const [cohortFilter, setCohortFilter] = useState("ALL");

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Payment[] | PaymentResponse>("/payments");

      const payload = response.data;

      if (Array.isArray(payload)) {
        setPayments(payload);
      } else if (Array.isArray(payload?.data)) {
        setPayments(payload.data);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.error("Failed to load payments:", err);

      setPayments([]);

      setError(
        err?.response?.data?.message || "Unable to load payment records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) {
      return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatMoney = (amount: number, currency?: string | null) => {
    const safeCurrency = currency || "NGN";

    if (safeCurrency === "NGN") {
      return `₦${amount.toLocaleString("en-NG")}`;
    }

    return `${safeCurrency} ${amount.toLocaleString("en-NG")}`;
  };

  const cohorts = useMemo(() => {
    const map = new Map<string, string>();

    payments.forEach((payment) => {
      if (payment.cohort) {
        map.set(payment.cohort.id, payment.cohort.name);
      }
    });

    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const studentName = payment.user
        ? `${payment.user.firstName} ${payment.user.lastName}`.toLowerCase()
        : "";

      const email = payment.user?.email?.toLowerCase() || "";

      const reference = payment.paymentReference?.toLowerCase() || "";

      const providerReference =
        payment.providerTransactionId?.toLowerCase() || "";

      const cohortName = payment.cohort?.name?.toLowerCase() || "";

      const programme = payment.cohort?.programme?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        email.includes(query) ||
        reference.includes(query) ||
        providerReference.includes(query) ||
        cohortName.includes(query) ||
        programme.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || payment.status === statusFilter;

      const matchesCohort =
        cohortFilter === "ALL" || payment.cohortId === cohortFilter;

      return matchesSearch && matchesStatus && matchesCohort;
    });
  }, [payments, search, statusFilter, cohortFilter]);

  const totalPaid = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((total, payment) => total + payment.amount, 0);

  const paidCount = payments.filter(
    (payment) => payment.status === "PAID",
  ).length;

  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING",
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payments</h1>

            <p className="mt-2 text-gray-500">
              View and audit student payment transactions across Erevna cohorts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Unable to load payments</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* SUMMARY */}
        {!loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Payments"
              value={payments.length.toString()}
            />

            <SummaryCard title="Successful" value={paidCount.toString()} />

            <SummaryCard title="Pending" value={pendingCount.toString()} />

            <SummaryCard
              title="Successful Value"
              value={`₦${totalPaid.toLocaleString("en-NG")}`}
            />
          </div>
        )}

        {/* FILTERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student, email, cohort or reference..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Payment Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | PaymentStatus)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All statuses</option>

                <option value="PAID">Paid</option>

                <option value="PENDING">Pending</option>

                <option value="PARTIAL">Partial</option>

                <option value="FAILED">Failed</option>

                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Cohort
              </label>

              <select
                value={cohortFilter}
                onChange={(event) => setCohortFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All cohorts</option>

                {cohorts.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PAYMENT TABLE */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Payment Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredPayments.length} payment
              {filteredPayments.length === 1 ? "" : "s"} shown
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-gray-500">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No payment records found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-4">Student</th>

                    <th className="px-6 py-4">Cohort</th>

                    <th className="px-6 py-4">Programme</th>

                    <th className="px-6 py-4">Amount</th>

                    <th className="px-6 py-4">Status</th>

                    <th className="px-6 py-4">Method</th>

                    <th className="px-6 py-4">Paid Date</th>

                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b hover:bg-indigo-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {payment.user
                            ? `${payment.user.firstName} ${payment.user.lastName}`
                            : "Unknown student"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {payment.user?.email || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {payment.cohort?.name || "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {payment.cohort?.programme ? (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {payment.cohort.programme}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.paymentMethod || payment.provider || "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(payment.paidAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAYMENT DETAIL MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Payment Details
                  </h2>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {selectedPayment.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close payment details"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <DetailItem
                  label="Student"
                  value={
                    selectedPayment.user
                      ? `${selectedPayment.user.firstName} ${selectedPayment.user.lastName}`
                      : "Unknown student"
                  }
                />

                <DetailItem
                  label="Email"
                  value={selectedPayment.user?.email || "—"}
                />

                <DetailItem
                  label="Cohort"
                  value={selectedPayment.cohort?.name || "—"}
                />

                <DetailItem
                  label="Programme"
                  value={selectedPayment.cohort?.programme || "—"}
                />

                <DetailItem
                  label="Cohort Status"
                  value={selectedPayment.cohort?.status || "—"}
                />

                <DetailItem
                  label="Amount"
                  value={formatMoney(
                    selectedPayment.amount,
                    selectedPayment.currency,
                  )}
                />

                <DetailItem label="Status" value={selectedPayment.status} />

                <DetailItem
                  label="Payment Provider"
                  value={selectedPayment.provider || "—"}
                />

                <DetailItem
                  label="Payment Method"
                  value={selectedPayment.paymentMethod || "—"}
                />

                <DetailItem
                  label="Payment Reference"
                  value={selectedPayment.paymentReference || "—"}
                  mono
                />

                <DetailItem
                  label="Provider Transaction ID"
                  value={selectedPayment.providerTransactionId || "—"}
                  mono
                />

                <DetailItem
                  label="Created"
                  value={formatDateTime(selectedPayment.createdAt)}
                />

                <DetailItem
                  label="Paid At"
                  value={formatDateTime(selectedPayment.paidAt)}
                />

                <DetailItem
                  label="Cohort ID"
                  value={selectedPayment.cohortId || "—"}
                  mono
                />

                <DetailItem
                  label="Student Cohort ID"
                  value={selectedPayment.studentCohortId || "—"}
                  mono
                />

                <DetailItem
                  label="Subscription ID"
                  value={selectedPayment.subscriptionId || "—"}
                  mono
                />
              </div>

              <div className="border-t border-slate-200 px-6 py-5">
                <p className="text-xs text-slate-500">
                  Gateway response data is intentionally not displayed. This
                  audit view only exposes safe payment fields returned by the
                  backend.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function formatMoney(amount: number, currency?: string | null) {
  const safeCurrency = currency || "NGN";

  if (safeCurrency === "NGN") {
    return `₦${amount.toLocaleString("en-NG")}`;
  }

  return `${safeCurrency} ${amount.toLocaleString("en-NG")}`;
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <p className="text-sm uppercase tracking-wide text-gray-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    PARTIAL: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-semibold text-slate-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
