import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const query = new URLSearchParams();

    Object.entries(router.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          query.append(key, item);
        });
      } else if (typeof value === "string") {
        query.set(key, value);
      }
    });

    const queryString = query.toString();

    router.replace(
      `/dashboard/payment/callback${queryString ? `?${queryString}` : ""}`,
    );
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />

        <h1 className="text-xl font-bold text-slate-900">Processing Payment</h1>

        <p className="text-gray-500 mt-2">
          Taking you to payment verification...
        </p>
      </div>
    </div>
  );
}
