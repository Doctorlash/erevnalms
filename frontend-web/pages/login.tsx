import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { studentLogin } = useAuth();

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoggingIn(true);

      const user = await studentLogin(email.trim(), password);

      if (user.role === "ADMIN") {
        await router.push("/admin");
      } else if (user.role === "TEACHER") {
        await router.push("/teacher");
      } else {
        await router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      const backendMessage = error?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else if (error?.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (error?.response?.status === 403) {
        setError(
          "Your account is currently not allowed to log in. Please contact support.",
        );
      } else {
        setError(
          "Unable to connect to the server right now. Please check your internet connection and try again.",
        );
      }
    } finally {
      setLoggingIn(false);
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
          Erevna Leadership Academy
        </h1>

        <p className="text-xl text-center max-w-lg text-gray-200">
          Excellence in Learning, Leadership and Academic Success.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Image
              src="/logo2.png"
              alt="Logo"
              width={90}
              height={90}
              className="mx-auto mb-4"
            />

            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>

            <p className="text-gray-500 mt-2">Login to continue learning</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={loggingIn}
              className="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Enter the email address you used when registering.
            </p>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loggingIn}
                className="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 p-3 pr-14 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loggingIn}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Enter the password associated with your account.
            </p>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loggingIn}
            className="bg-blue-700 hover:bg-blue-800 transition text-white p-3 rounded-lg w-full font-semibold flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loggingIn ? (
              <>
                <span
                  className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />

                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* Login Status */}
          {loggingIn && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Connecting to Erevna. Please wait...
            </p>
          )}

          <p className="text-center text-sm mt-6 text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-blue-700 font-semibold hover:underline"
            >
              Register
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
        </form>
      </div>
    </div>
  );
}
