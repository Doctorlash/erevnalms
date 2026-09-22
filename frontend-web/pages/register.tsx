import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import api from "../services/api";

type Programme = "JAMB" | "WAEC";

interface RegistrationSubject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [selectedProgrammes, setSelectedProgrammes] = useState<Programme[]>([]);

  const [jambSubjects, setJambSubjects] = useState<RegistrationSubject[]>([]);
  const [waecSubjects, setWaecSubjects] = useState<RegistrationSubject[]>([]);

  const [selectedJambSubjects, setSelectedJambSubjects] = useState<string[]>(
    [],
  );

  const [selectedWaecSubjects, setSelectedWaecSubjects] = useState<string[]>(
    [],
  );

  const [loadingJamb, setLoadingJamb] = useState(false);
  const [loadingWaec, setLoadingWaec] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const hasJamb = selectedProgrammes.includes("JAMB");
  const hasWaec = selectedProgrammes.includes("WAEC");

  /*
   * ============================================================
   * FORM INPUT
   * ============================================================
   */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setError("");

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * ============================================================
   * PROGRAMME SELECTION
   * ============================================================
   */

  const toggleProgramme = (programme: Programme) => {
    if (registering) return;

    setError("");
    setSuccess("");

    setSelectedProgrammes((current) => {
      if (current.includes(programme)) {
        return current.filter((item) => item !== programme);
      }

      return [...current, programme];
    });

    if (programme === "JAMB" && hasJamb) {
      setSelectedJambSubjects([]);
    }

    if (programme === "WAEC" && hasWaec) {
      setSelectedWaecSubjects([]);
    }
  };

  /*
   * ============================================================
   * LOAD JAMB SUBJECTS
   * ============================================================
   */

  useEffect(() => {
    if (!hasJamb || jambSubjects.length > 0) {
      return;
    }

    const loadJambSubjects = async () => {
      try {
        setLoadingJamb(true);
        setError("");

        const response = await api.get<RegistrationSubject[]>(
          "/subjects/registration?programme=JAMB",
        );

        setJambSubjects(response.data);
      } catch (err) {
        console.error("Failed to load JAMB subjects:", err);

        setError("Unable to load JAMB subjects right now. Please try again.");
      } finally {
        setLoadingJamb(false);
      }
    };

    loadJambSubjects();
  }, [hasJamb, jambSubjects.length]);

  /*
   * ============================================================
   * LOAD WAEC SUBJECTS
   * ============================================================
   */

  useEffect(() => {
    if (!hasWaec || waecSubjects.length > 0) {
      return;
    }

    const loadWaecSubjects = async () => {
      try {
        setLoadingWaec(true);
        setError("");

        const response = await api.get<RegistrationSubject[]>(
          "/subjects/registration?programme=WAEC",
        );

        setWaecSubjects(response.data);
      } catch (err) {
        console.error("Failed to load WAEC subjects:", err);

        setError("Unable to load WAEC subjects right now. Please try again.");
      } finally {
        setLoadingWaec(false);
      }
    };

    loadWaecSubjects();
  }, [hasWaec, waecSubjects.length]);

  /*
   * ============================================================
   * SUBJECT SELECTION
   * ============================================================
   */

  const toggleJambSubject = (subjectId: string) => {
    if (registering) return;

    setError("");

    setSelectedJambSubjects((current) => {
      if (current.includes(subjectId)) {
        return current.filter((id) => id !== subjectId);
      }

      if (current.length >= 4) {
        setError("You can select a maximum of 4 JAMB subjects.");
        return current;
      }

      return [...current, subjectId];
    });
  };

  const toggleWaecSubject = (subjectId: string) => {
    if (registering) return;

    setError("");

    setSelectedWaecSubjects((current) => {
      if (current.includes(subjectId)) {
        return current.filter((id) => id !== subjectId);
      }

      if (current.length >= 9) {
        setError("You can select a maximum of 9 WAEC subjects.");
        return current;
      }

      return [...current, subjectId];
    });
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validateForm = () => {
    if (!form.firstName.trim()) {
      return "Please enter your first name.";
    }

    if (!form.lastName.trim()) {
      return "Please enter your last name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email address.";
    }

    if (!form.password) {
      return "Please enter a password.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (selectedProgrammes.length === 0) {
      return "Please select at least one programme.";
    }

    if (hasJamb && selectedJambSubjects.length === 0) {
      return "Please select at least one JAMB subject.";
    }

    if (selectedJambSubjects.length > 4) {
      return "You can select a maximum of 4 JAMB subjects.";
    }

    if (hasWaec && selectedWaecSubjects.length === 0) {
      return "Please select at least one WAEC subject.";
    }

    if (selectedWaecSubjects.length > 9) {
      return "You can select a maximum of 9 WAEC subjects.";
    }

    return "";
  };

  /*
   * ============================================================
   * REGISTRATION
   * ============================================================
   */

  const register = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registering) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setRegistering(true);

      await api.post("/auth/register", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        programmes: selectedProgrammes,

        ...(hasJamb
          ? {
              jambSubjectIds: selectedJambSubjects,
            }
          : {}),

        ...(hasWaec
          ? {
              waecSubjectIds: selectedWaecSubjects,
            }
          : {}),
      });

      setSuccess(
        "Registration successful. Your subject requests have been submitted for approval.",
      );

      /*
       * Keep registering=true here.
       *
       * This is intentional. The user should continue seeing
       * the loading state while the success message is displayed
       * and the application redirects to the login page.
       */
      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (err: any) {
      console.error("Registration failed:", err);

      const backendMessage = err?.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        setError(backendMessage.join(" "));
      } else if (typeof backendMessage === "string") {
        setError(backendMessage);
      } else {
        setError(
          "Registration failed. Please check your details and try again.",
        );
      }

      /*
       * Only stop the loading state when registration actually fails.
       */
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:grid md:grid-cols-2">
      {/* ========================================================
          LEFT SIDE
      ========================================================= */}

      <div className="hidden min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-blue-700 p-12 text-white md:flex">
        <Image
          src="/logo4.png"
          alt="Erevna Logo"
          width={220}
          height={220}
          className="mb-8"
        />

        <h1 className="mb-4 text-center text-5xl font-bold">
          Start Your Erevna Journey
        </h1>

        <p className="max-w-lg text-center text-xl leading-relaxed text-gray-200">
          Prepare for JAMB and WAEC with structured learning, expert
          instruction, and quality academic resources.
        </p>
      </div>

      {/* ========================================================
          RIGHT SIDE
      ========================================================= */}

      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <form
          onSubmit={register}
          className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8 md:p-10"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Create Your Account
            </h2>

            <p className="mt-2 text-gray-500">
              Choose your examination programme and subjects.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>

                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>

                <p className="text-sm font-medium text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* ====================================================
              BASIC INFORMATION
          ==================================================== */}

          <div className="mb-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleInputChange}
                placeholder="e.g. Toluwalase"
                autoComplete="given-name"
                disabled={registering}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-500 placeholder:opacity-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter your first name.
              </p>
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleInputChange}
                placeholder="e.g. Ikumawoyi"
                autoComplete="family-name"
                disabled={registering}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-500 placeholder:opacity-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter your surname or family name.
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="e.g. you@example.com"
              autoComplete="email"
              disabled={registering}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-500 placeholder:opacity-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Use an active email address you can access.
            </p>
          </div>

          {/* Password */}
          <div className="mb-8">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleInputChange}
                placeholder="Create a password (minimum 6 characters)"
                autoComplete="new-password"
                disabled={registering}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-900 outline-none transition placeholder:text-gray-500 placeholder:opacity-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={registering}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Your password must contain at least 6 characters.
            </p>
          </div>

          {/* ====================================================
              PROGRAMMES
          ==================================================== */}

          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Choose Your Programme
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                You can select JAMB, WAEC, or both.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* JAMB */}
              <button
                type="button"
                onClick={() => toggleProgramme("JAMB")}
                disabled={registering}
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  hasJamb
                    ? "border-indigo-600 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                } ${registering ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">JAMB</h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Select up to 4 subjects.
                    </p>
                  </div>

                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      hasJamb
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {hasJamb && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>

              {/* WAEC */}
              <button
                type="button"
                onClick={() => toggleProgramme("WAEC")}
                disabled={registering}
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  hasWaec
                    ? "border-purple-600 bg-purple-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                } ${registering ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">WAEC</h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Select up to 9 subjects.
                    </p>
                  </div>

                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      hasWaec
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {hasWaec && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ====================================================
              JAMB SUBJECTS
          ==================================================== */}

          {hasJamb && (
            <div className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    JAMB Subjects
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose the subjects you want to request.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                  {selectedJambSubjects.length} / 4 selected
                </span>
              </div>

              {loadingJamb ? (
                <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-5">
                  <svg
                    className="h-5 w-5 animate-spin text-indigo-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                    />
                  </svg>

                  <p className="font-medium text-indigo-600">
                    Loading JAMB subjects...
                  </p>
                </div>
              ) : jambSubjects.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-center">
                  <p className="text-gray-500">
                    No JAMB subjects are currently available.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Please contact the administrator if you believe this is an
                    error.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {jambSubjects.map((subject) => {
                    const selected = selectedJambSubjects.includes(subject.id);

                    const disabled =
                      !selected && selectedJambSubjects.length >= 4;

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleJambSubject(subject.id)}
                        disabled={registering || disabled}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-100 shadow-sm"
                            : disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                              : "border-gray-200 bg-white hover:border-indigo-400 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m5 12 4 4L19 6"
                                />
                              </svg>
                            )}
                          </div>

                          <span className="font-semibold text-gray-800">
                            {subject.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ====================================================
              WAEC SUBJECTS
          ==================================================== */}

          {hasWaec && (
            <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    WAEC Subjects
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose the subjects you want to request.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
                  {selectedWaecSubjects.length} / 9 selected
                </span>
              </div>

              {loadingWaec ? (
                <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-5">
                  <svg
                    className="h-5 w-5 animate-spin text-purple-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                    />
                  </svg>

                  <p className="font-medium text-purple-600">
                    Loading WAEC subjects...
                  </p>
                </div>
              ) : waecSubjects.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-center">
                  <p className="text-gray-500">
                    No WAEC subjects are currently available.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Please contact the administrator if you believe this is an
                    error.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {waecSubjects.map((subject) => {
                    const selected = selectedWaecSubjects.includes(subject.id);

                    const disabled =
                      !selected && selectedWaecSubjects.length >= 9;

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleWaecSubject(subject.id)}
                        disabled={registering || disabled}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-purple-600 bg-purple-100 shadow-sm"
                            : disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                              : "border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m5 12 4 4L19 6"
                                />
                              </svg>
                            )}
                          </div>

                          <span className="font-semibold text-gray-800">
                            {subject.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ====================================================
              SUBMISSION SUMMARY
          ==================================================== */}

          {selectedProgrammes.length > 0 && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="mb-3 font-bold text-gray-800">
                Registration Summary
              </h3>

              <div className="space-y-2 text-sm">
                {hasJamb && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">JAMB</span>

                    <span className="font-semibold text-gray-800">
                      {selectedJambSubjects.length} subject
                      {selectedJambSubjects.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}

                {hasWaec && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">WAEC</span>

                    <span className="font-semibold text-gray-800">
                      {selectedWaecSubjects.length} subject
                      {selectedWaecSubjects.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====================================================
              REGISTER BUTTON
          ==================================================== */}

          <button
            type="submit"
            disabled={registering}
            className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 font-bold text-white transition-all ${
              registering
                ? "cursor-not-allowed bg-indigo-500"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
            }`}
          >
            {registering ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                  />
                </svg>

                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 5l7 7-7 7M20 12H4"
                  />
                </svg>
              </>
            )}
          </button>

          {/* Login */}
          <p className="mt-6 text-center text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
