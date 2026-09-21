import { useEffect, useMemo, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";

type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "FAILED" | "REFUNDED";

type Programme = "JAMB" | "WAEC";

interface Cohort {
  id: string;
  name: string;
  programme: Programme;
  description?: string | null;
  startDate: string;
  endDate: string;
  fee: number;
  status?: "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";
}

interface Subscription {
  id: string;
  plan?: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL" | null;
  billingType?: "COHORT" | "LEGACY";
  status: SubscriptionStatus;
  startDate?: string | null;
  endDate?: string | null;
  paymentReference?: string | null;
  cohortId?: string | null;
  studentCohortId?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentReference?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt: string;
  cohortId?: string | null;
  studentCohortId?: string | null;
  subscriptionId?: string | null;
  provider?: string;
}

export default function SubscriptionPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [payingCohortId, setPayingCohortId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // =========================================================
  // NORMALIZE API RESPONSES
  // =========================================================

  const normalizeArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(data?.cohorts)) {
      return data.cohorts;
    }

    if (Array.isArray(data?.subscriptions)) {
      return data.subscriptions;
    }

    if (Array.isArray(data?.payments)) {
      return data.payments;
    }

    return [];
  };

  // =========================================================
  // LOAD COHORTS, SUBSCRIPTIONS AND PAYMENTS
  // =========================================================

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [cohortsResponse, subscriptionsResponse, paymentsResponse] =
          await Promise.all([
            api.get("/cohorts/my"),
            api.get("/subscriptions/my"),
            api.get("/payments/my"),
          ]);

        setCohorts(normalizeArray<Cohort>(cohortsResponse.data));
        setSubscriptions(
          normalizeArray<Subscription>(subscriptionsResponse.data),
        );
        setPayments(normalizeArray<Payment>(paymentsResponse.data));
      } catch (err: any) {
        console.error("Failed to load subscription information:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load your subscription information.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // =========================================================
  // CURRENT ACTIVE SUBSCRIPTIONS
  // =========================================================

  const activeSubscriptions = useMemo(() => {
    const now = new Date();

    return subscriptions.filter((subscription) => {
      if (subscription.status !== "ACTIVE") {
        return false;
      }

      if (!subscription.endDate) {
        return true;
      }

      return new Date(subscription.endDate) > now;
    });
  }, [subscriptions]);

  // =========================================================
  // CURRENT ACTIVE COHORTS
  // =========================================================

  const activeCohorts = useMemo(() => {
    const now = new Date();

    return cohorts.filter((cohort) => {
      if (cohort.status === "CANCELLED" || cohort.status === "ENDED") {
        return false;
      }

      const start = new Date(cohort.startDate);
      const end = new Date(cohort.endDate);

      return start <= now && end > now;
    });
  }, [cohorts]);

  // =========================================================
  // CHECK WHETHER COHORT IS ALREADY PAID
  // =========================================================

  const hasActiveSubscriptionForCohort = (cohortId: string) => {
    return activeSubscriptions.some(
      (subscription) => subscription.cohortId === cohortId,
    );
  };

  // =========================================================
  // INITIALIZE PAYMENT
  // =========================================================

  const subscribeToCohort = async (cohort: Cohort) => {
    if (!user) {
      setPaymentError("You must be logged in to make a payment.");
      return;
    }

    if (!cohort.id) {
      setPaymentError("This cohort could not be identified.");
      return;
    }

    if (cohort.fee <= 0) {
      setPaymentError(
        "This cohort does not currently have a valid payment fee.",
      );
      return;
    }

    if (hasActiveSubscriptionForCohort(cohort.id)) {
      return;
    }

    try {
      setPayingCohortId(cohort.id);
      setPaymentError("");

      /*
       * IMPORTANT:
       * The backend determines the amount from Cohort.fee.
       * Do not send userId, email, amount or plan from the client.
       */
      const response = await api.post("/payments/initialize", {
        cohortId: cohort.id,
      });

      const authorizationUrl =
        response.data?.data?.authorization_url ||
        response.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error("Payment authorization URL was not returned.");
      }

      window.location.href = authorizationUrl;
    } catch (err: any) {
      console.error("Payment initialization failed:", err);

      setPaymentError(
        err?.response?.data?.message ||
          "Payment initialization failed. Please try again.",
      );
    } finally {
      setPayingCohortId(null);
    }
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =========================================================
  // CURRENCY FORMATTER
  // =========================================================

  const formatAmount = (amount?: number | null, currency = "NGN") => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  const paymentStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";

      case "PENDING":
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-700";

      case "FAILED":
      case "REFUNDED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Subscription & Payments
        </h1>

        <p className="text-gray-600 mt-2">
          Manage your cohort enrollment, subscription and payment history.
        </p>
      </div>

      {/* =====================================================
          GENERAL ERROR
      ===================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* =====================================================
          PAYMENT ERROR
      ===================================================== */}

      {paymentError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {paymentError}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-500">
            Loading your subscription information...
          </p>
        </div>
      ) : (
        <>
          {/* =================================================
              ACTIVE SUBSCRIPTIONS
          ================================================= */}

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">
              Active Subscriptions
            </h2>

            {activeSubscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  No active subscription
                </h3>

                <p className="text-gray-500 mt-2">
                  You do not currently have an active paid cohort subscription.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeSubscriptions.map((subscription) => {
                  const cohort = cohorts.find(
                    (item) => item.id === subscription.cohortId,
                  );

                  return (
                    <div
                      key={subscription.id}
                      className="border border-green-200 bg-green-50 rounded-2xl p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            {cohort?.programme || "Programme"}
                          </p>

                          <h3 className="text-xl font-bold text-green-700 mt-1">
                            {cohort?.name || "Cohort Subscription"}
                          </h3>
                        </div>

                        <span className="inline-flex w-fit px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                          ● Active
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mt-5">
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-sm text-gray-500">Started</p>

                          <p className="font-semibold text-gray-900 mt-1">
                            {formatDate(subscription.startDate)}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                          <p className="text-sm text-gray-500">Expires</p>

                          <p className="font-semibold text-gray-900 mt-1">
                            {formatDate(subscription.endDate)}
                          </p>
                        </div>
                      </div>

                      {subscription.amount !== null &&
                        subscription.amount !== undefined && (
                          <div className="bg-white rounded-xl p-4 mt-4">
                            <p className="text-sm text-gray-500">
                              Subscription Amount
                            </p>

                            <p className="font-bold text-gray-900 mt-1">
                              {formatAmount(
                                subscription.amount,
                                subscription.currency || "NGN",
                              )}
                            </p>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =================================================
              CURRENT COHORTS
          ================================================= */}

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">
              Available Cohorts
            </h2>

            {activeCohorts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  No active cohort available
                </h3>

                <p className="text-gray-500 mt-2">
                  There is currently no active cohort available for payment.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeCohorts.map((cohort) => {
                  const alreadySubscribed = hasActiveSubscriptionForCohort(
                    cohort.id,
                  );

                  const isPaying = payingCohortId === cohort.id;

                  return (
                    <div
                      key={cohort.id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-indigo-600">
                            {cohort.programme}
                          </p>

                          <h3 className="text-xl font-bold text-slate-900 mt-1">
                            {cohort.name}
                          </h3>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          Active
                        </span>
                      </div>

                      {cohort.description && (
                        <p className="text-gray-600 mt-4">
                          {cohort.description}
                        </p>
                      )}

                      <div className="mt-5 p-4 rounded-xl bg-gray-50">
                        <p className="text-sm text-gray-500">Cohort Fee</p>

                        <p className="text-3xl font-bold text-slate-900 mt-1">
                          {formatAmount(cohort.fee)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Starts</p>

                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {formatDate(cohort.startDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Ends</p>

                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {formatDate(cohort.endDate)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => subscribeToCohort(cohort)}
                        disabled={alreadySubscribed || isPaying}
                        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-semibold transition"
                      >
                        {alreadySubscribed
                          ? "Already Subscribed"
                          : isPaying
                            ? "Redirecting to Paystack..."
                            : `Pay ${formatAmount(cohort.fee)}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =================================================
              PAYMENT HISTORY
          ================================================= */}

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-5">
              Payment History
            </h2>

            {payments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <p className="text-gray-500">
                  You do not have any payment records yet.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Date
                        </th>

                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Amount
                        </th>

                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Reference
                        </th>

                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Method
                        </th>

                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatAmount(payment.amount, payment.currency)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.paymentReference || "—"}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.paymentMethod || payment.provider || "—"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusClass(
                                payment.status,
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </StudentLayout>
  );
}
