import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentLayout from "../../../layouts/StudentLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!router.isReady) return;

    const reference =
      typeof router.query.reference === "string"
        ? router.query.reference
        : null;

    if (!reference) {
      setStatus("error");
      setMessage("Payment reference was not found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/payments/verify/${reference}`);

        if (response.data?.success) {
          setStatus("success");

          setMessage(
            "Your payment was successful and your subscription is now active.",
          );

          setTimeout(() => {
            router.replace("/dashboard/subscription");
          }, 2500);

          return;
        }

        throw new Error("Payment verification failed.");
      } catch (error: any) {
        console.error("Payment verification failed:", error);

        setStatus("error");

        setMessage(
          error?.response?.data?.message ||
            "We could not verify your payment. Please contact support if money was deducted.",
        );
      }
    };

    verifyPayment();
  }, [router.isReady, router.query.reference]);

  return (
    <StudentLayout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />

              <h1 className="text-2xl font-bold text-slate-900">
                Verifying Payment
              </h1>

              <p className="text-gray-500 mt-3">
                Please wait while we confirm your Paystack payment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
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
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                !
              </div>

              <h1 className="text-2xl font-bold text-red-700">
                Payment Verification Failed
              </h1>

              <p className="text-gray-600 mt-3">{message}</p>

              <button
                type="button"
                onClick={() => router.push("/dashboard/subscription")}
                className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                Back to Subscription
              </button>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
