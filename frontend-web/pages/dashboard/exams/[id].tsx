import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function ExamPage() {
  useStudentAuth();

  const { user } = useAuth();

  const router = useRouter();

  const { id } = router.query;

  const [exam, setExam] = useState<any>(null);

  const [attemptId, setAttemptId] = useState("");

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!id || !user) return;

    api.get(`/exams/${id}`).then((res) => {
      setExam(res.data);

      setTimeLeft((res.data.duration || 0) * 60);
    });

    api
      .post("/exam-attempts/start", {
        examId: id,
        userId: user.id,
      })
      .then((res) => {
        setAttemptId(res.data.id);
      });
  }, [id, user]);

  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitExam();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const saveAnswer = async (questionId: string, selectedAnswer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }));

    await api.post("/exam-attempts/answer", {
      attemptId,
      questionId,
      selectedAnswer,
    });
  };

  const submitExam = async () => {
    try {
      await api.post(`/exam-attempts/${attemptId}/finish`);

      router.push(`/dashboard/results/${attemptId}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (!exam) {
    return (
      <StudentLayout>
        <p>Loading examination...</p>
      </StudentLayout>
    );
  }

  const questions = exam.examQuestions;

  const question = questions[currentQuestion]?.question;

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const minutes = Math.floor(timeLeft / 60);

  const seconds = timeLeft % 60;

  return (
    <StudentLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-6 mb-8">
        <h1 className="text-3xl font-bold">{exam.title}</h1>

        <p className="mt-2">Complete all questions before time runs out.</p>
      </div>

      {/* Top Bar */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-gray-500">Question</h3>

          <p className="text-2xl font-bold">
            {currentQuestion + 1}/{questions.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-gray-500">Progress</h3>

          <p className="text-2xl font-bold text-indigo-600">
            {Math.round(progress)}%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-gray-500">Time Left</h3>

          <p className="text-2xl font-bold text-red-600">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-full h-4 mb-8">
        <div
          className="bg-gradient-to-r from-indigo-600 to-pink-600 h-4 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">
          {currentQuestion + 1}. {question.question}
        </h2>

        <div className="space-y-4">
          {[
            question.optionA,
            question.optionB,
            question.optionC,
            question.optionD,
          ].map((option, index) => (
            <label
              key={index}
              className={`block border rounded-xl p-4 cursor-pointer transition ${
                answers[question.id] === option
                  ? "border-indigo-600 bg-indigo-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                className="mr-3"
                checked={answers[question.id] === option}
                onChange={() => saveAnswer(question.id, option)}
              />

              {option}
            </label>
          ))}
        </div>
      </div>

      {/* Navigation Palette */}
      <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
        <h3 className="font-bold mb-4">Question Navigator</h3>

        <div className="flex flex-wrap gap-2">
          {questions.map((item: any, index: number) => (
            <button
              key={item.question.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg font-bold ${
                answers[item.question.id]
                  ? "bg-green-500 text-white"
                  : currentQuestion === index
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between">
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          className="bg-gray-600 text-white px-6 py-3 rounded-xl"
        >
          Previous
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
          >
            Next Question
          </button>
        ) : (
          <button
            onClick={submitExam}
            className="bg-green-600 text-white px-6 py-3 rounded-xl"
          >
            Submit Exam
          </button>
        )}
      </div>
    </StudentLayout>
  );
}
