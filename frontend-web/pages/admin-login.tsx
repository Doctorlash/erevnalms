import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { useAuth } from "../contexts/AuthContext";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
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
      const user = await adminLogin(email, password);

      if (user.role !== "ADMIN") {
        setError("This account is not an administrator account.");
        return;
      }

      await router.push("/admin");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Admin login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-2xl"
        >
          <div className="text-center mb-8">
            <Image
              src="/logo2.png"
              alt="Erevna Logo"
              width={90}
              height={90}
              className="mx-auto mb-4"
            />

            <h1 className="text-3xl font-bold text-slate-900">
              Administrator Login
            </h1>

            <p className="text-gray-500 mt-2">
              Secure access to the Erevna administration portal
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            This portal is restricted to authorized administrators.
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Administrator Email"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-slate-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-300 p-3 pr-12 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 transition text-white p-3 rounded-lg w-full font-semibold"
          >
            {loading ? "Authenticating..." : "Secure Admin Login"}
          </button>

          <p className="text-center text-sm mt-6 text-gray-500">
            Authorized administrators only
          </p>
        </form>
      </div>
    </div>
  );
}
