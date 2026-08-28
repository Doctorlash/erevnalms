/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import { useAuth } from "../../contexts/AuthContext";
import useStudentAuth from "../../hooks/useStudentAuth";

import api from "../../services/api";

export default function CertificatesPage() {
  useStudentAuth();

  const { user } = useAuth();

  const [certificates, setCertificates] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/certificates/student/${user.id}`)
      .then((res) => {
        setCertificates(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  }, [user]);
  const downloadCertificate = async (certificateId: string) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `Erevna-Certificate-${certificateId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Certificate download failed:", error);

      alert("Unable to download certificate.");
    }
  };

  return (
    <StudentLayout>
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Certificate Centre</h1>

        <p className="text-indigo-100">
          View and manage all certificates earned on Erevna LMS.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Certificates Earned</h3>

          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {certificates.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Status</h3>

          <p className="text-2xl font-bold text-green-600 mt-2">Verified</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-gray-500">Platform</h3>

          <p className="text-2xl font-bold text-purple-600 mt-2">Erevna LMS</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          Loading certificates...
        </div>
      )}

      {/* Empty State */}
      {!loading && certificates.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="text-6xl mb-4">🏆</div>

          <h2 className="text-2xl font-bold mb-3">No Certificates Yet</h2>

          <p className="text-gray-500">
            Complete lessons and examinations to earn certificates.
          </p>
        </div>
      )}

      {/* Certificates */}
      <div className="grid lg:grid-cols-2 gap-8">
        {certificates.map((certificate) => (
          <div
            key={certificate.id}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border"
          >
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Certificate of Achievement</h2>

              <p className="text-indigo-100 mt-2">
                Erevna Learning Management System
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-5">
                <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                  VERIFIED CERTIFICATE
                </span>
              </div>

              <p className="mb-3">
                <strong>Certificate Number:</strong>
              </p>

              <p className="text-indigo-700 font-bold text-lg mb-5">
                {certificate.certificateNumber}
              </p>

              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">Student</p>

                  <p className="font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Subject</p>

                  <p className="font-semibold">
                    {certificate.subject?.name || "General"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Exam</p>

                  <p className="font-semibold">
                    {certificate.exam?.title || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Issued Date</p>

                  <p className="font-semibold">
                    {new Date(certificate.issuedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition"
                  onClick={() => downloadCertificate(certificate.id)}
                >
                  Download PDF
                </button>

                <button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition"
                  onClick={() => {
                    window.open(
                      `/verify-certificate/${certificate.certificateNumber}`,
                      "_blank",
                    );
                  }}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </StudentLayout>
  );
}
