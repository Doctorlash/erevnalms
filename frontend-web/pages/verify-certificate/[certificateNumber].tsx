import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

interface CertificateVerification {
  certificateNumber: string;
  verificationCode: string;

  studentName: string;

  programme: "JAMB" | "WAEC";

  cohort: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };

  completionDate: string;
  issuedAt: string;

  status: "ISSUED" | "REVOKED";
  valid: boolean;

  revokedAt?: string | null;
  revocationReason?: string | null;

  platform: string;
}

export default function VerifyCertificatePage() {
  const router = useRouter();

  const { certificateNumber } = router.query;

  const [certificate, setCertificate] =
    useState<CertificateVerification | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !certificateNumber) {
      return;
    }

    const verifyCertificate = async () => {
      try {
        setLoading(true);
        setError("");

        const number = Array.isArray(certificateNumber)
          ? certificateNumber[0]
          : certificateNumber;

        const response = await axios.get<CertificateVerification>(
          `${process.env.NEXT_PUBLIC_API_URL}/certificates/verify/${encodeURIComponent(
            number,
          )}`,
        );

        setCertificate(response.data);
      } catch (err) {
        console.error("Certificate verification failed:", err);

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError(
            "This certificate could not be found. Please check the certificate number and try again.",
          );
        } else {
          setError(
            "Unable to verify this certificate at the moment. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [router.isReady, certificateNumber]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            EREVNA LMS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Certificate Verification
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Verify the authenticity and current status of an Erevna LMS
            certificate.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />

            <p className="mt-4 text-sm text-gray-600">
              Verifying certificate...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Certificate Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && certificate && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div
              className={`px-6 py-8 text-center ${
                certificate.valid ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                  certificate.valid ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {certificate.valid ? (
                  <svg
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5 12 4 4L19 6"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-10 w-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6 6 18"
                    />
                  </svg>
                )}
              </div>

              <h2
                className={`mt-5 text-2xl font-bold ${
                  certificate.valid ? "text-green-800" : "text-red-800"
                }`}
              >
                {certificate.valid
                  ? "Certificate Verified"
                  : "Certificate Revoked"}
              </h2>

              <p
                className={`mt-2 text-sm ${
                  certificate.valid ? "text-green-700" : "text-red-700"
                }`}
              >
                {certificate.valid
                  ? "This certificate is currently valid in the Erevna LMS records."
                  : "This certificate exists in the Erevna LMS records but is no longer valid."}
              </p>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Certificate of Completion
                </p>

                <h3 className="mt-3 text-2xl font-bold text-gray-900">
                  {certificate.studentName}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {certificate.programme} Programme
                </p>
              </div>

              <div className="grid gap-5 border-y py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cohort
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {certificate.cohort.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Programme
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {certificate.programme}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cohort Start
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(certificate.cohort.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cohort End
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(certificate.cohort.endDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Completion Date
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(certificate.completionDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Issue Date
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(certificate.issuedAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Certificate Number
                  </p>

                  <p className="mt-1 break-all rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800">
                    {certificate.certificateNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Verification Code
                  </p>

                  <p className="mt-1 break-all rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800">
                    {certificate.verificationCode}
                  </p>
                </div>
              </div>

              {!certificate.valid && certificate.revocationReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Revocation Reason
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {certificate.revocationReason}
                  </p>

                  {certificate.revokedAt && (
                    <p className="mt-2 text-xs text-red-600">
                      Revoked on {formatDate(certificate.revokedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-5 text-center">
                <p className="text-xs text-gray-500">
                  Verification provided by{" "}
                  <span className="font-semibold">{certificate.platform}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
