import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import { useAuth } from "../contexts/AuthContext";

export default function TeacherLoginPage() {
  const { teacherLogin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await teacherLogin(email, password);

      if (user.role !== "TEACHER") {
        setError("This account is not a teacher account.");
        return;
      }

      await router.push("/teacher");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Teacher login failed. Please check your credentials.",
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
          Erevna Teacher Portal
        </h1>

        <p className="text-xl text-center max-w-lg text-gray-200">
          Empower students through teaching, mentorship and academic excellence.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Image
              src="/logo2.png"
              alt="Erevna Logo"
              width={90}
              height={90}
              className="mx-auto mb-4"
            />

            <h2 className="text-3xl font-bold text-slate-900">Teacher Login</h2>

            <p className="text-gray-500 mt-2">
              Login to access your teaching dashboard
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Teacher Email Address"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-300 p-3 pr-12 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 transition text-white p-3 rounded-lg w-full font-semibold"
          >
            {loading ? "Signing in..." : "Teacher Login"}
          </button>

          <p className="text-center text-sm mt-6 text-gray-600">
            Not registered as a teacher?{" "}
            <Link
              href="/teacher-register"
              className="text-blue-700 font-semibold"
            >
              Apply here
            </Link>
          </p>
          <p className="text-center text-sm mt-2 text-gray-600">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </p>
          <p className="text-center text-sm mt-3">
            <Link href="/login" className="text-gray-500 hover:text-blue-700">
              Student Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
