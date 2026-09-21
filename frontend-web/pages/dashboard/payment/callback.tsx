import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import StudentLayout from "../../../layouts/StudentLayout";
import useRequireAuth from "../../../hooks/useRequireAuth";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

type Status = "loading" | "success" | "error";

export default function PaymentCallbackPage() {
  useRequireAuth();

  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!router.isReady || !user) {
      return;
    }

    /*
     * Paystack may return either:
     * ?reference=...
     * or ?trxref=...
     *
     * We support both.
     */
    const reference =
      typeof router.query.reference === "string"
        ? router.query.reference
        : typeof router.query.trxref === "string"
          ? router.query.trxref
          : null;

    if (!reference) {
      setStatus("error");
      setMessage("Payment reference was not found.");
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      try {
        setStatus("loading");
        setMessage("Verifying your payment...");

        const response = await api.get(
          `/payments/verify/${encodeURIComponent(reference)}`,
        );

        if (cancelled) {
          return;
        }

        /*
         * A successful HTTP response from the verification endpoint
         * represents a verified payment response from the backend.
         */
        if (response.status >= 200 && response.status < 300 && response.data) {
          setStatus("success");

          setMessage(
            "Your payment has been verified successfully. Your cohort subscription and approved subject access have been updated.",
          );

          setTimeout(() => {
            if (!cancelled) {
              router.replace("/dashboard/subscription");
            }
          }, 2500);

          return;
        }

        throw new Error("Payment verification failed.");
      } catch (error: any) {
        console.error("Payment verification failed:", error);

        if (cancelled) {
          return;
        }

        setStatus("error");

        setMessage(
          error?.response?.data?.message ||
            "We could not verify your payment. If money was deducted from your account, please contact support and provide your payment reference.",
        );
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.reference, router.query.trxref, user]);

  return (
    <StudentLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 max-w-lg w-full text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />

              <h1 className="text-2xl font-bold text-slate-900">
                Verifying Payment
              </h1>

              <p className="text-gray-500 mt-3">
                Please wait while we confirm your Paystack payment.
              </p>

              <p className="text-sm text-gray-400 mt-5">
                Do not close this page.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-3xl text-green-700">
                ✓
              </div>

              <h1 className="text-2xl font-bold text-green-700">
                Payment Successful
              </h1>

              <p className="text-gray-600 mt-3">{message}</p>

              <p className="text-sm text-gray-400 mt-5">
                Redirecting to your subscription...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-3xl text-red-700">
                !
              </div>

              <h1 className="text-2xl font-bold text-red-700">
                Payment Verification Failed
              </h1>

              <p className="text-gray-600 mt-3">{message}</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/subscription")}
                  className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Back to Subscription
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200"
                >
                  Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
