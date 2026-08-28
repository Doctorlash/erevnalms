import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

export default function TeacherQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  const [form, setForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
    difficulty: "EASY",
    examType: "JAMB",
    subjectId: "",
    topicId: "",
  });

  const loadData = async () => {
    const questionsRes = await api.get(`/questions/teacher/${user.id}`);

    const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

    const topicsRes = await api.get(`/topics/teacher/${user.id}`);

    setQuestions(questionsRes.data);
    setSubjects(subjectsRes.data);
    setTopics(topicsRes.data);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const createQuestion = async () => {
    try {
      await api.post("/questions", form);

      alert("Question created successfully");

      setForm({
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        explanation: "",
        difficulty: "EASY",
        examType: "JAMB",
        subjectId: "",
        topicId: "",
      });

      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to create question");
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;

    await api.delete(`/questions/${id}`);

    loadData();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Question Bank</h1>

      <div className="bg-white p-6 rounded shadow mb-8">
        <textarea
          placeholder="Question"
          className="border p-2 w-full mb-3"
          rows={3}
          value={form.question}
          onChange={(e) =>
            setForm({
              ...form,
              question: e.target.value,
            })
          }
        />

        <input
          placeholder="Option A"
          className="border p-2 w-full mb-3"
          value={form.optionA}
          onChange={(e) =>
            setForm({
              ...form,
              optionA: e.target.value,
            })
          }
        />

        <input
          placeholder="Option B"
          className="border p-2 w-full mb-3"
          value={form.optionB}
          onChange={(e) =>
            setForm({
              ...form,
              optionB: e.target.value,
            })
          }
        />

        <input
          placeholder="Option C"
          className="border p-2 w-full mb-3"
          value={form.optionC}
          onChange={(e) =>
            setForm({
              ...form,
              optionC: e.target.value,
            })
          }
        />

        <input
          placeholder="Option D"
          className="border p-2 w-full mb-3"
          value={form.optionD}
          onChange={(e) =>
            setForm({
              ...form,
              optionD: e.target.value,
            })
          }
        />

        <input
          placeholder="Correct Answer"
          className="border p-2 w-full mb-3"
          value={form.correctAnswer}
          onChange={(e) =>
            setForm({
              ...form,
              correctAnswer: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Explanation"
          className="border p-2 w-full mb-3"
          rows={2}
          value={form.explanation}
          onChange={(e) =>
            setForm({
              ...form,
              explanation: e.target.value,
            })
          }
        />

        <select
          className="border p-2 w-full mb-3"
          value={form.subjectId}
          onChange={(e) =>
            setForm({
              ...form,
              subjectId: e.target.value,
            })
          }
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
          value={form.topicId}
          onChange={(e) =>
            setForm({
              ...form,
              topicId: e.target.value,
            })
          }
        >
          <option value="">Select Topic</option>

          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 w-full mb-3"
          value={form.difficulty}
          onChange={(e) =>
            setForm({
              ...form,
              difficulty: e.target.value,
            })
          }
        >
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          className="border p-2 w-full mb-3"
          value={form.examType}
          onChange={(e) =>
            setForm({
              ...form,
              examType: e.target.value,
            })
          }
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

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{question.question}</h3>

            <p>Subject: {question.subject?.name}</p>

            <p>Topic: {question.topic?.name || "N/A"}</p>

            <p>Difficulty: {question.difficulty}</p>

            <p>Exam Type: {question.examType}</p>

            <button
              onClick={() => deleteQuestion(question.id)}
              className="bg-red-600 text-white px-3 py-1 rounded mt-3"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </TeacherLayout>
  );
}
