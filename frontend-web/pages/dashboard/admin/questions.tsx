import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminQuestionsPage() {
  useAdminAuth();

  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [question, setQuestion] = useState("");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] = useState("");

  const [explanation, setExplanation] = useState("");

  const [difficulty, setDifficulty] = useState("EASY");

  const [examType, setExamType] = useState("JAMB");

  const loadQuestions = async () => {
    const res = await api.get("/questions");

    setQuestions(res.data);
  };

  const loadSubjects = async () => {
    const res = await api.get("/subjects");

    setSubjects(res.data);
  };

  useEffect(() => {
    loadQuestions();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!subjectId) return;

    api.get(`/topics/subject/${subjectId}`).then((res) => {
      setTopics(res.data);
    });
  }, [subjectId]);

  const createQuestion = async () => {
    await api.post("/questions", {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      examType,
      subjectId,
      topicId: topicId || undefined,
    });

    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("");
    setExplanation("");

    loadQuestions();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;

    await api.delete(`/questions/${id}`);

    loadQuestions();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Question Bank</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Create Question</h2>

        <select
          className="border p-2 w-full mb-3"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 w-full mb-3"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
        >
          <option value="">Select Topic</option>

          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        <textarea
          className="border p-2 w-full mb-3"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Option A"
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Option B"
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Option C"
          value={optionC}
          onChange={(e) => setOptionC(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Option D"
          value={optionD}
          onChange={(e) => setOptionD(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Correct Answer"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
        />

        <textarea
          className="border p-2 w-full mb-3"
          placeholder="Explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />

        <select
          className="border p-2 w-full mb-3"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
        </select>

        <select
          className="border p-2 w-full mb-3"
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
        >
          <option value="JAMB">JAMB</option>
          <option value="WAEC">WAEC</option>
          <option value="NECO">NECO</option>
        </select>

        <button
          onClick={createQuestion}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Question
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Existing Questions</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th>Question</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Exam</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-b">
                <td>{q.question}</td>

                <td>{q.subject?.name}</td>

                <td>{q.difficulty}</td>

                <td>{q.examType}</td>

                <td>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
