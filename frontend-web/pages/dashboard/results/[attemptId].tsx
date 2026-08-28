import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import api from "../../../services/api";

export default function ResultPage() {
  const router = useRouter();

  const { attemptId } = router.query;

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!attemptId) return;

    api
      .get(`/exam-attempts/${attemptId}/result`)
      .then((res) => setResult(res.data))
      .catch(console.error);
  }, [attemptId]);

  if (!result) {
    return (
      <StudentLayout>
        <p>Loading result...</p>
      </StudentLayout>
    );
  }

  const totalQuestions = result.answers?.length || 0;

  const correctAnswers =
    result.answers?.filter((a: any) => a.isCorrect).length || 0;

  const wrongAnswers = totalQuestions - correctAnswers;

  const percentage =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  const passed = percentage >= 50;

  return (
    <StudentLayout>
      {/* Hero */}
      <div
        className={`rounded-3xl p-8 mb-8 text-white shadow-xl ${
          passed
            ? "bg-gradient-to-r from-green-600 to-emerald-600"
            : "bg-gradient-to-r from-red-600 to-pink-600"
        }`}
      >
        <h1 className="text-4xl font-bold mb-2">Examination Result</h1>

        <p>
          {passed
            ? "Congratulations! You passed this examination."
            : "Keep learning and try again."}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-gray-500">Score</h3>

          <p className="text-4xl font-bold text-indigo-700">{result.score}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-gray-500">Percentage</h3>

          <p className="text-4xl font-bold text-purple-700">{percentage}%</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-gray-500">Correct</h3>

          <p className="text-4xl font-bold text-green-600">{correctAnswers}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-gray-500">Wrong</h3>

          <p className="text-4xl font-bold text-red-600">{wrongAnswers}</p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Examination Status</h2>

        <div className="flex items-center gap-4">
          <span
            className={`px-4 py-2 rounded-full text-white font-semibold ${
              passed ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {passed ? "PASSED" : "FAILED"}
          </span>

          <span className="text-gray-600">
            Submitted:{" "}
            {result.submittedAt
              ? new Date(result.submittedAt).toLocaleString()
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Exam Details */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Examination Information</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Exam Title</p>

            <p>{result.exam?.title}</p>
          </div>

          <div>
            <p className="font-semibold">Questions Attempted</p>

            <p>{totalQuestions}</p>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Question Review</h2>

        <div className="space-y-4">
          {result.answers?.map((answer: any, index: number) => (
            <div
              key={answer.id}
              className={`border rounded-2xl p-5 ${
                answer.isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <h3 className="font-bold mb-3">
                {index + 1}. {answer.question.question}
              </h3>

              <p>
                <strong>Your Answer:</strong> {answer.selectedAnswer}
              </p>

              <p>
                <strong>Correct Answer:</strong> {answer.question.correctAnswer}
              </p>

              <p
                className={`font-bold mt-2 ${
                  answer.isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {answer.isCorrect ? "Correct" : "Incorrect"}
              </p>

              {answer.question.explanation && (
                <div className="mt-3 bg-white p-3 rounded-lg">
                  <strong>Explanation:</strong>

                  <p>{answer.question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Section */}
      {passed && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-3">Certificate Eligibility</h2>

          <p className="mb-4">
            You are eligible for a certificate based on this result.
          </p>

          <Link href="/dashboard/certificates">
            <button className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold">
              View Certificates
            </button>
          </Link>
        </div>
      )}
    </StudentLayout>
  );
}
