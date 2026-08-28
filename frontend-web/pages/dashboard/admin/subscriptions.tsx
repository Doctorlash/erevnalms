import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface Subscription {
  id: string;

  plan: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL";

  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";

  startDate?: string | null;
  endDate?: string | null;

  paymentReference?: string | null;

  createdAt: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminSubscriptionsPage() {
  useAdminAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/subscriptions");

        setSubscriptions(response.data);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);

        setError("Unable to load subscription information.");
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>

        <p className="text-gray-500 mt-2">
          Monitor student subscription plans and payment records.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      {!loading && (
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <SummaryCard title="Total" value={subscriptions.length} />

          <SummaryCard
            title="Active"
            value={
              subscriptions.filter((item) => item.status === "ACTIVE").length
            }
          />

          <SummaryCard
            title="Pending"
            value={
              subscriptions.filter((item) => item.status === "PENDING").length
            }
          />

          <SummaryCard
            title="Expired"
            value={
              subscriptions.filter((item) => item.status === "EXPIRED").length
            }
          />
        </div>
      )}

      {/* TABLE */}

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">
            All Subscriptions
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-gray-500">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-gray-500">No subscriptions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-4">Student</th>

                  <th className="text-left px-6 py-4">Email</th>

                  <th className="text-left px-6 py-4">Plan</th>

                  <th className="text-left px-6 py-4">Status</th>

                  <th className="text-left px-6 py-4">Start Date</th>

                  <th className="text-left px-6 py-4">End Date</th>

                  <th className="text-left px-6 py-4">Payment Reference</th>
                </tr>
              </thead>

              <tbody>
                {subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="border-b hover:bg-indigo-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {subscription.user.firstName} {subscription.user.lastName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {subscription.user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                        {subscription.plan}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={subscription.status} />
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(subscription.startDate)}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(subscription.endDate)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <p className="text-sm uppercase tracking-wide text-gray-500">{title}</p>

      <p className="text-3xl font-bold text-indigo-700 mt-2">{value}</p>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
