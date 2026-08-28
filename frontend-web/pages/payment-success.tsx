import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import api from "../services/api";

export default function PaymentSuccess() {
  const router = useRouter();

  const { reference } = router.query;

  const [loading, setLoading] = useState(true);

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!reference) return;

    api
      .get(`/payments/verify/${reference}`)
      .then(() => {
        setSuccess(true);
      })
      .catch(() => {
        setSuccess(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reference]);

  if (loading) {
    return <div className="p-10">Verifying payment...</div>;
  }

  return (
    <div className="p-10">
      {success ? (
        <>
          <h1 className="text-3xl font-bold">Payment Successful</h1>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
          >
            Go To Dashboard
          </button>
        </>
      ) : (
        <h1 className="text-3xl font-bold">Payment Verification Failed</h1>
      )}
    </div>
  );
}
