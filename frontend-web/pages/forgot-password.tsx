import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import api from "../services/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(
        response.data?.message ||
          "If an account exists with this email, a password reset message has been sent.",
      );
    } catch (error: any) {
      console.error("Forgot password error:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to process your request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Forgot Password?
            </h1>

            <p className="text-gray-500 mt-3">
              Enter your email address and we will send you instructions to
              reset your password.
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-semibold"
            >
              ← Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          © {new Date().getFullYear()} Erevna LMS
        </p>
      </div>
    </div>
  );
}
