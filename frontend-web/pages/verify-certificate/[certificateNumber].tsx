import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import api from "../../services/api";

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  subject: string;
  exam: string;
  issuedAt: string;
  platform: string;
}

interface VerificationResponse {
  valid: boolean;
  message?: string;
  certificate?: CertificateData;
}

export default function VerifyCertificatePage() {
  const router = useRouter();

  const { certificateNumber } = router.query;

  const [data, setData] = useState<VerificationResponse | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !certificateNumber) {
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(
          `/certificates/verify/${certificateNumber}`,
        );

        setData(response.data);
      } catch (error) {
        console.error("Certificate verification failed:", error);

        setData({
          valid: false,
          message: "Unable to verify certificate.",
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [router.isReady, certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-indigo-700">
            Verifying Certificate...
          </h1>
        </div>
      </div>
    );
  }

  if (!data?.valid || !data.certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-5">❌</div>

          <h1 className="text-3xl font-bold text-red-600 mb-3">
            Invalid Certificate
          </h1>

          <p className="text-gray-500">
            {data?.message ||
              "This certificate could not be found in the Erevna certificate registry."}
          </p>
        </div>
      </div>
    );
  }

  const certificate = data.certificate;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white text-center p-10">
            <div className="text-6xl mb-4">🏆</div>

            <h1 className="text-4xl font-bold">Certificate Verified</h1>

            <p className="text-indigo-100 mt-2">Erevna Leadership Academy</p>
          </div>

          <div className="p-10">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 text-center">
              <p className="text-green-700 font-bold text-lg">
                ✓ AUTHENTIC CERTIFICATE
              </p>

              <p className="text-green-600 text-sm mt-1">
                This certificate exists in the Erevna certificate registry.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-gray-500 text-sm">Certificate Number</p>

                <p className="text-xl font-bold text-indigo-700">
                  {certificate.certificateNumber}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Student</p>

                <p className="text-2xl font-bold">{certificate.studentName}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Subject</p>

                <p className="font-semibold">{certificate.subject}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Assessment</p>

                <p className="font-semibold">{certificate.exam}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Date Issued</p>

                <p className="font-semibold">
                  {new Date(certificate.issuedAt).toLocaleDateString("en-NG")}
                </p>
              </div>
            </div>

            <div className="border-t mt-8 pt-6 text-center text-sm text-gray-500">
              Officially issued by {certificate.platform}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
