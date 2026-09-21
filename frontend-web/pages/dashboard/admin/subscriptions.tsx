import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";

type BillingType = "COHORT" | "LEGACY";

type Programme = "JAMB" | "WAEC";

type CohortStatus = "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";

interface Subscription {
  id: string;

  plan: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL" | null;

  billingType: BillingType;

  status: SubscriptionStatus;

  startDate?: string | null;
  endDate?: string | null;

  paymentReference?: string | null;

  cohortId?: string | null;
  studentCohortId?: string | null;

  amount?: number | null;
  currency?: string | null;

  createdAt: string;
  updatedAt: string;

  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;

  cohort?: {
    id: string;
    name: string;
    programme: Programme;
    startDate: string;
    endDate: string;
    fee: number;
    status: CohortStatus;
  } | null;
}

interface SubscriptionResponse {
  data?: Subscription[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export default function AdminSubscriptionsPage() {
  useAdminAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | SubscriptionStatus>(
    "ALL",
  );

  const [billingFilter, setBillingFilter] = useState<"ALL" | BillingType>(
    "ALL",
  );

  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<Subscription[] | SubscriptionResponse>(
          "/subscriptions",
        );

        const payload = response.data;

        if (Array.isArray(payload)) {
          setSubscriptions(payload);
        } else if (Array.isArray(payload?.data)) {
          setSubscriptions(payload.data);
        } else {
          setSubscriptions([]);
        }
      } catch (err: any) {
        console.error("Failed to load subscriptions:", err);

        setSubscriptions([]);

        setError(
          err?.response?.data?.message ||
            "Unable to load subscription information.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSubscriptions();
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

  const formatMoney = (amount?: number | null, currency = "NGN") => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    if (currency === "NGN") {
      return `₦${amount.toLocaleString("en-NG")}`;
    }

    return `${currency} ${amount.toLocaleString("en-NG")}`;
  };

  const getStudentName = (subscription: Subscription) => {
    if (!subscription.user) {
      return "Unknown student";
    }

    return `${subscription.user.firstName} ${subscription.user.lastName}`.trim();
  };

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const studentName = getStudentName(subscription).toLowerCase();

      const email = subscription.user?.email?.toLowerCase() || "";

      const cohortName = subscription.cohort?.name?.toLowerCase() || "";

      const reference = subscription.paymentReference?.toLowerCase() || "";

      const programme = subscription.cohort?.programme?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        email.includes(query) ||
        cohortName.includes(query) ||
        reference.includes(query) ||
        programme.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || subscription.status === statusFilter;

      const matchesBilling =
        billingFilter === "ALL" || subscription.billingType === billingFilter;

      return matchesSearch && matchesStatus && matchesBilling;
    });
  }, [subscriptions, search, statusFilter, billingFilter]);

  const activeCount = subscriptions.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const pendingCount = subscriptions.filter(
    (item) => item.status === "PENDING",
  ).length;

  const cohortCount = subscriptions.filter(
    (item) => item.billingType === "COHORT",
  ).length;

  const cancelledCount = subscriptions.filter(
    (item) => item.status === "CANCELLED",
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>

          <p className="mt-2 text-gray-500">
            Monitor student subscriptions, cohort billing, subscription periods
            and payment references.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Unable to load subscriptions</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* SUMMARY */}
        {!loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total" value={subscriptions.length} />

            <SummaryCard title="Active" value={activeCount} />

            <SummaryCard title="Pending" value={pendingCount} />

            <SummaryCard title="Cohort Billing" value={cohortCount} />
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
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ALL" | SubscriptionStatus,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Billing Type
              </label>

              <select
                value={billingFilter}
                onChange={(event) =>
                  setBillingFilter(event.target.value as "ALL" | BillingType)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All billing types</option>

                <option value="COHORT">Cohort</option>

                <option value="LEGACY">Legacy</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  All Subscriptions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredSubscriptions.length} subscription
                  {filteredSubscriptions.length === 1 ? "" : "s"} shown
                </p>
              </div>

              {!loading && cancelledCount > 0 && (
                <span className="text-sm text-slate-500">
                  {cancelledCount} cancelled
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-gray-500">Loading subscriptions...</div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No subscriptions found.
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

                    <th className="px-6 py-4">Billing</th>

                    <th className="px-6 py-4">Amount</th>

                    <th className="px-6 py-4">Status</th>

                    <th className="px-6 py-4">Period</th>

                    <th className="px-6 py-4">Reference</th>

                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="border-b hover:bg-indigo-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {getStudentName(subscription)}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {subscription.user?.email || "No email available"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {subscription.cohort?.name || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {subscription.cohort?.programme ? (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {subscription.cohort.programme}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            subscription.billingType === "COHORT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {subscription.billingType}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatMoney(
                          subscription.amount,
                          subscription.currency || "NGN",
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={subscription.status} />
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{formatDate(subscription.startDate)}</div>

                        <div className="text-xs text-gray-400">
                          to {formatDate(subscription.endDate)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {subscription.paymentReference ? (
                          <span className="font-mono text-xs text-gray-600">
                            {subscription.paymentReference}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubscription(subscription)}
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

        {/* DETAIL MODAL */}
        {selectedSubscription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Subscription Details
                  </h2>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {selectedSubscription.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSubscription(null)}
                  className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close subscription details"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <DetailItem
                  label="Student"
                  value={getStudentName(selectedSubscription)}
                />

                <DetailItem
                  label="Email"
                  value={selectedSubscription.user?.email || "—"}
                />

                <DetailItem
                  label="Programme"
                  value={selectedSubscription.cohort?.programme || "—"}
                />

                <DetailItem
                  label="Cohort"
                  value={selectedSubscription.cohort?.name || "—"}
                />

                <DetailItem
                  label="Cohort Status"
                  value={selectedSubscription.cohort?.status || "—"}
                />

                <DetailItem
                  label="Billing Type"
                  value={selectedSubscription.billingType}
                />

                <DetailItem
                  label="Plan"
                  value={selectedSubscription.plan || "Cohort subscription"}
                />

                <DetailItem
                  label="Amount"
                  value={formatMoney(
                    selectedSubscription.amount,
                    selectedSubscription.currency || "NGN",
                  )}
                />

                <DetailItem
                  label="Status"
                  value={selectedSubscription.status}
                />

                <DetailItem
                  label="Start Date"
                  value={formatDateTime(selectedSubscription.startDate)}
                />

                <DetailItem
                  label="End Date"
                  value={formatDateTime(selectedSubscription.endDate)}
                />

                <DetailItem
                  label="Payment Reference"
                  value={selectedSubscription.paymentReference || "—"}
                  mono
                />

                <DetailItem
                  label="Created"
                  value={formatDateTime(selectedSubscription.createdAt)}
                />

                <DetailItem
                  label="Updated"
                  value={formatDateTime(selectedSubscription.updatedAt)}
                />

                <DetailItem
                  label="Cohort ID"
                  value={selectedSubscription.cohortId || "—"}
                  mono
                />

                <DetailItem
                  label="Student Cohort ID"
                  value={selectedSubscription.studentCohortId || "—"}
                  mono
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      <p className="text-sm uppercase tracking-wide text-gray-500">{title}</p>

      <p className="mt-2 text-3xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const styles: Record<SubscriptionStatus, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
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
