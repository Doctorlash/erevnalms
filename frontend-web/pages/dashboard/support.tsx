import { FormEvent, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

const supportCategories = [
  {
    value: "ACCOUNT",
    label: "Account & Profile",
  },
  {
    value: "ENROLLMENT",
    label: "Enrollment",
  },
  {
    value: "SUBJECT",
    label: "Subject Access",
  },
  {
    value: "PAYMENT",
    label: "Payment & Subscription",
  },
  {
    value: "LESSON",
    label: "Lessons & Learning",
  },
  {
    value: "RESOURCE",
    label: "Resources",
  },
  {
    value: "TECHNICAL",
    label: "Technical Problem",
  },
  {
    value: "GENERAL",
    label: "General Support",
  },
];

export default function StudentSupportPage() {
  useStudentAuth();

  const [category, setCategory] = useState("GENERAL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submitSupportRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setError("Please enter a subject for your support request.");
      return;
    }

    if (!trimmedMessage) {
      setError("Please describe the issue you need help with.");
      return;
    }

    try {
      setSending(true);

      await api.post("/contact/support", {
        subject: `[${supportCategories.find((item) => item.value === category)?.label || "General Support"}] ${trimmedSubject}`,
        message: trimmedMessage,
      });

      setSubject("");
      setMessage("");
      setCategory("GENERAL");

      setSuccess(
        "Your support request has been sent successfully. Our team will review it and get back to you.",
      );
    } catch (err: any) {
      console.error("Failed to submit support request:", err);

      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please log in again and try again.",
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to submit a student support request.",
        );
      } else if (status === 400) {
        const backendMessage = err?.response?.data?.message;

        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(" ")
            : backendMessage || "Please check your request and try again.",
        );
      } else {
        setError(
          "Unable to send your support request right now. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/dashboard" className="hover:text-blue-600 transition">
              Dashboard
            </Link>

            <span>/</span>

            <span className="text-gray-700">Support</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">Contact Support</h1>

          <p className="text-gray-500 mt-2">
            Need help with your account, enrollment, lessons, resources, or
            another part of Erevna? Send us a support request.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* SUPPORT INFORMATION */}

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-5">
                🎧
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-3">
                How can we help?
              </h2>

              <p className="text-gray-600 leading-7 mb-6">
                Tell us what you are experiencing and provide enough detail for
                our support team to understand the problem.
              </p>

              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-800">
                    Account problems
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Login, profile, password, or account issues.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">
                    Learning problems
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Subject access, lessons, resources, or learning issues.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">
                    Payment problems
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Payment, subscription, or enrollment-related issues.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-lg p-6 mt-6 text-white">
              <h3 className="font-bold text-lg mb-2">
                Already submitted a request?
              </h3>

              <p className="text-slate-300 text-sm leading-6">
                Keep your issue description clear and specific so the
                administration team can resolve it as quickly as possible.
              </p>
            </div>
          </div>

          {/* SUPPORT FORM */}

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900">
                  Submit a Support Request
                </h2>

                <p className="text-gray-500 mt-2">
                  Your account information is automatically attached to this
                  request.
                </p>
              </div>

              {/* SUCCESS */}

              {success && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-800">
                  <div className="flex gap-3">
                    <span className="text-xl">✓</span>

                    <div>
                      <p className="font-semibold">
                        Request submitted successfully
                      </p>

                      <p className="text-sm mt-1">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
                  <div className="flex gap-3">
                    <span className="text-xl">!</span>

                    <div>
                      <p className="font-semibold">Unable to submit request</p>

                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={submitSupportRequest} className="space-y-6">
                {/* CATEGORY */}

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    What do you need help with?
                  </label>

                  <select
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={sending}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    {supportCategories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBJECT */}

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Example: I cannot access my Mathematics lesson"
                    maxLength={150}
                    disabled={sending}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    {subject.length}/150 characters
                  </p>
                </div>

                {/* MESSAGE */}

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Describe your problem
                  </label>

                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Please explain what happened and what you were trying to do..."
                    rows={7}
                    maxLength={3000}
                    disabled={sending}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    {message.length}/3000 characters
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Sending Request..." : "Send Support Request"}
                  </button>

                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-gray-300 px-6 py-3.5 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
