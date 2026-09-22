import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import api from "../services/api";

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const registerTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/register-teacher", form);

      setSuccess(
        "Your teacher registration has been submitted successfully. Your account must be approved by an administrator before you can log in.",
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Teacher registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-900 via-slate-900 to-blue-700 text-white p-12">
        <Image
          src="/logo3.png"
          alt="Erevna Logo"
          width={220}
          height={220}
          className="mb-8"
        />

        <h1 className="text-5xl font-bold mb-4 text-center">
          Join Erevna as a Teacher
        </h1>

        <p className="text-xl text-center max-w-lg text-gray-200">
          Help students achieve academic excellence through teaching, mentorship
          and leadership.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-10">
        <form
          onSubmit={registerTeacher}
          className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Image
              src="/logo4.png"
              alt="Erevna Logo"
              width={90}
              height={90}
              className="mx-auto mb-4"
            />

            <h2 className="text-3xl font-bold text-slate-900">
              Teacher Registration
            </h2>

            <p className="text-gray-500 mt-2">
              Submit your application to become an Erevna teacher
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              Teacher accounts require administrator approval before login is
              permitted.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {Array.isArray(error) ? error.join(", ") : error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {success}

              <button
                type="button"
                onClick={() => router.push("/teacher-login")}
                className="block mt-3 font-semibold underline"
              >
                Go to Teacher Login
              </button>
            </div>
          )}

          <input
            placeholder="First Name"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
          />

          <input
            placeholder="Last Name"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-3 rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 transition text-white p-3 rounded-lg w-full font-semibold"
          >
            {loading
              ? "Submitting Application..."
              : "Submit Teacher Application"}
          </button>

          <p className="text-center text-sm mt-6 text-gray-600">
            Already have an approved teacher account?{" "}
            <Link href="/teacher-login" className="text-blue-700 font-semibold">
              Teacher Login
            </Link>
          </p>

          <p className="text-center text-sm mt-3 text-gray-500">
            Are you a student?{" "}
            <Link href="/register" className="text-blue-700 font-semibold">
              Student Registration
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
