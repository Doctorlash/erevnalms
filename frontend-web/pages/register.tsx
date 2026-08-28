import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import api from "../services/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const register = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);

      alert("Registration successful");

      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-900 via-slate-900 to-blue-700 text-white p-12">
        <Image
          src="/logo2.png"
          alt="Erevna Logo"
          width={220}
          height={220}
          className="mb-8"
        />

        <h1 className="text-5xl font-bold mb-4 text-center">
          Join Erevna Leadership Academy
        </h1>

        <p className="text-xl text-center max-w-lg text-gray-200">
          Build your future through excellence, leadership, knowledge and
          academic success.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-10">
        <form
          onSubmit={register}
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

            <h2 className="text-3xl font-bold text-slate-900">
              Create Account
            </h2>

            <p className="text-gray-500 mt-2">
              Start your learning journey today
            </p>
          </div>

          <input
            placeholder="First Name"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.firstName}
            onChange={(e) =>
              setForm({
                ...form,
                firstName: e.target.value,
              })
            }
          />

          <input
            placeholder="Last Name"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.lastName}
            onChange={(e) =>
              setForm({
                ...form,
                lastName: e.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Email Address"
            className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-3 rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 transition text-white p-3 rounded-lg w-full font-semibold"
          >
            Create Account
          </button>

          <p className="text-center text-sm mt-6 text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 font-semibold">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
