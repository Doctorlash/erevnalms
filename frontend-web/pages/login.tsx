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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await studentLogin(email, password);

      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "TEACHER") {
        router.push("/teacher");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Login failed");
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
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md"
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

          <input
            type="email"
            placeholder="Email Address"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-300 p-3 pr-12 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="bg-blue-700 hover:bg-blue-800 transition text-white p-3 rounded-lg w-full font-semibold"
          >
            Login
          </button>

          <p className="text-center text-sm mt-6 text-gray-600">
            Dont have an account?{" "}
            <Link href="/register" className="text-blue-700 font-semibold">
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
