import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useAuth } from "../../contexts/AuthContext";

import api from "../../services/api";

interface Subscription {
  id: string;
  plan: "FREE" | "BASIC" | "PREMIUM" | "SCHOOL";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  startDate?: string | null;
  endDate?: string | null;
  paymentReference?: string | null;
  createdAt: string;
}

export default function SubscriptionPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD USER SUBSCRIPTIONS
  // =========================================================

  const loadSubscriptions = async () => {
    if (!user) return;

    try {
      setLoadingSubscriptions(true);
      setError("");

      const response = await api.get(`/subscriptions/user/${user.id}`);

      setSubscriptions(response.data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);

      setError("Unable to load your subscription information.");
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  // =========================================================
  // FIND CURRENT ACTIVE SUBSCRIPTION
  // =========================================================

  const activeSubscription = subscriptions.find((subscription) => {
    if (subscription.status !== "ACTIVE") {
      return false;
    }

    if (!subscription.endDate) {
      return false;
    }

    return new Date(subscription.endDate) > new Date();
  });

  // =========================================================
  // SUBSCRIBE
  // =========================================================

  const subscribe = async (plan: "BASIC" | "PREMIUM" | "SCHOOL") => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/payments/initialize", {
        userId: user.id,
        email: user.email,
        plan,
      });

      const authorizationUrl = response.data?.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error("Payment authorization URL was not returned.");
      }

      window.location.href = authorizationUrl;
    } catch (error: any) {
      console.error("Payment initialization failed:", error);

      alert(
        error?.response?.data?.message ||
          "Payment initialization failed. Please try again.",
      );
    } finally {
      setLoading(false);
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
  // RENDER
  // =========================================================

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Subscription</h1>

        <p className="text-gray-600 mt-2">
          Manage your Erevna learning subscription.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* =====================================================
          CURRENT SUBSCRIPTION
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Current Subscription
        </h2>

        {loadingSubscriptions ? (
          <p className="text-gray-500">Loading subscription information...</p>
        ) : activeSubscription ? (
          <div className="border border-green-200 bg-green-50 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>

                <h3 className="text-2xl font-bold text-green-700">
                  {activeSubscription.plan}
                </h3>
              </div>

              <div className="inline-flex w-fit px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                ● Active
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Started</p>

                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(activeSubscription.startDate)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Expires</p>

                <p className="font-semibold text-gray-900 mt-1">
                  {formatDate(activeSubscription.endDate)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 bg-gray-50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-800">Free Plan</h3>

            <p className="text-gray-500 mt-2">
              You currently do not have an active paid subscription.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          PLANS
      ===================================================== */}

      <h2 className="text-2xl font-bold text-slate-900 mb-5">
        Available Plans
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* FREE */}

        <div className="bg-white p-6 rounded-2xl shadow-lg border">
          <h2 className="text-xl font-bold text-slate-900">Free</h2>

          <p className="text-2xl font-bold mt-3">
            ₦0
            <span className="text-sm font-normal text-gray-500">/month</span>
          </p>

          <p className="text-gray-600 mt-3">
            Basic access to the Erevna learning platform.
          </p>

          <button
            disabled
            className="mt-6 w-full bg-gray-400 text-white px-4 py-3 rounded-xl font-semibold"
          >
            Free Plan
          </button>
        </div>

        {/* BASIC */}

        <div className="bg-white p-6 rounded-2xl shadow-lg border">
          <h2 className="text-xl font-bold text-slate-900">Basic</h2>

          <p className="text-2xl font-bold mt-3">
            ₦2,500
            <span className="text-sm font-normal text-gray-500">/month</span>
          </p>

          <p className="text-gray-600 mt-3">
            More learning resources and structured academic preparation.
          </p>

          <button
            onClick={() => subscribe("BASIC")}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-semibold transition"
          >
            {loading
              ? "Processing..."
              : activeSubscription?.plan === "BASIC"
                ? "Current Plan"
                : "Subscribe"}
          </button>
        </div>

        {/* PREMIUM */}

        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-500">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Premium</h2>

            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              Recommended
            </span>
          </div>

          <p className="text-2xl font-bold mt-3">
            ₦5,000
            <span className="text-sm font-normal text-gray-500">/month</span>
          </p>

          <p className="text-gray-600 mt-3">
            Full access to premium learning resources and advanced preparation.
          </p>

          <button
            onClick={() => subscribe("PREMIUM")}
            disabled={loading}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-semibold transition"
          >
            {loading
              ? "Processing..."
              : activeSubscription?.plan === "PREMIUM"
                ? "Current Plan"
                : "Subscribe"}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
