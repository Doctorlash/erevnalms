import { useEffect, useState } from "react";
import axios from "axios";

import StudentLayout from "../../layouts/StudentLayout";
import { useAuth } from "../../contexts/AuthContext";

interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  programme: "JAMB" | "WAEC";
  completionDate: string;
  issuedAt: string;
  status: "ISSUED" | "REVOKED";
  revokedAt?: string | null;
  revocationReason?: string | null;
  cohort?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  studentCohort?: {
    id: string;
    status: string;
    completedAt?: string | null;
  };
}

export default function CertificatesPage() {
  const { user } = useAuth();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get<Certificate[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/certificates/student/${user.id}`,
        );

        setCertificates(response.data);
      } catch (err) {
        console.error("Failed to load certificates:", err);
        setError("Unable to load your certificates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user?.id]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  const downloadCertificate = async (certificate: Certificate) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/certificates/${certificate.id}/pdf`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `erevna-certificate-${certificate.certificateNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Certificate download failed:", err);

      alert("Unable to download the certificate. Please try again.");
    }
  };

  const verificationUrl = (certificateNumber: string) => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/verify-certificate/${encodeURIComponent(
      certificateNumber,
    )}`;
  };

  const copyVerificationLink = async (certificateNumber: string) => {
    const url = verificationUrl(certificateNumber);

    try {
      await navigator.clipboard.writeText(url);
      alert("Verification link copied.");
    } catch {
      alert("Unable to copy the verification link. Please copy it manually.");
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>

          <p className="mt-1 text-sm text-gray-600">
            View and download certificates earned through your Erevna programme.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Loading certificates...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && certificates.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3.75 19.5 7.5v5.25c0 4.25-3.125 7.75-7.5 8.75-4.375-1-7.5-4.5-7.5-8.75V7.5L12 3.75Z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No certificates yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Complete your cohort requirements, including lessons, assignments,
              and required final examinations, to become eligible for a
              certificate.
            </p>
          </div>
        )}

        {!loading && !error && certificates.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {certificates.map((certificate) => {
              const isIssued = certificate.status === "ISSUED";

              return (
                <div
                  key={certificate.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="border-b bg-gray-50 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Certificate of Completion
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                          {certificate.programme} Programme
                        </h2>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isIssued
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isIssued ? "ISSUED" : "REVOKED"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Cohort
                      </p>

                      <p className="mt-1 text-base font-semibold text-gray-900">
                        {certificate.cohort?.name ?? "Programme Cohort"}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Completion Date
                        </p>

                        <p className="mt-1 text-sm text-gray-800">
                          {formatDate(certificate.completionDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Issued Date
                        </p>

                        <p className="mt-1 text-sm text-gray-800">
                          {formatDate(certificate.issuedAt)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Certificate Number
                      </p>

                      <p className="mt-1 break-all font-mono text-sm text-gray-800">
                        {certificate.certificateNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Verification Code
                      </p>

                      <p className="mt-1 break-all font-mono text-sm text-gray-800">
                        {certificate.verificationCode}
                      </p>
                    </div>

                    {!isIssued && certificate.revocationReason && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                          Revocation Reason
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          {certificate.revocationReason}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => downloadCertificate(certificate)}
                        disabled={!isIssued}
                        className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Download Certificate
                      </button>

                      <a
                        href={`/verify-certificate/${encodeURIComponent(
                          certificate.certificateNumber,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Verify Certificate
                      </a>
                    </div>

                    {isIssued && (
                      <button
                        type="button"
                        onClick={() =>
                          copyVerificationLink(certificate.certificateNumber)
                        }
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Copy Verification Link
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
