import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Subject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
  isActive: boolean;
}

interface Topic {
  id: string;
  name: string;
  subjectId: string;
}

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string | null;
  difficulty: Difficulty;
  examType: Programme;
  subjectId: string;
  topicId?: string | null;
  subject?: Subject;
  topic?: Topic | null;
}

export default function AdminQuestionsPage() {
  useAdminAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [programme, setProgramme] = useState<Programme>("JAMB");

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [question, setQuestion] = useState("");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");

  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");

  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * ============================================================
   * FILTER SUBJECTS BY PROGRAMME
   * ============================================================
   */
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (subject) => subject.programme === programme && subject.isActive,
    );
  }, [subjects, programme]);

  /**
   * ============================================================
   * LOAD QUESTIONS
   * ============================================================
   */
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setError("");

      const res = await api.get("/questions");

      setQuestions(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  /**
   * ============================================================
   * LOAD SUBJECTS
   * ============================================================
   */
  const loadSubjects = async () => {
    try {
      setError("");

      const res = await api.get("/subjects");

      setSubjects(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load subjects.");
    }
  };

  useEffect(() => {
    loadQuestions();
    loadSubjects();
  }, []);

  /**
   * ============================================================
   * CHANGE PROGRAMME
   * ============================================================
   */
  const handleProgrammeChange = (nextProgramme: Programme) => {
    setProgramme(nextProgramme);

    setSubjectId("");
    setTopicId("");
    setTopics([]);
    setError("");
    setSuccess("");
  };

  /**
   * ============================================================
   * LOAD TOPICS FOR SUBJECT
   * ============================================================
   */
  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId("");
      return;
    }

    const loadTopics = async () => {
      try {
        setLoadingTopics(true);
        setError("");

        const res = await api.get(`/topics/subject/${subjectId}`);

        setTopics(res.data);
        setTopicId("");
      } catch (err: any) {
        setTopics([]);
        setTopicId("");

        setError(
          err?.response?.data?.message ||
            "Unable to load topics for this subject.",
        );
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [subjectId]);

  /**
   * ============================================================
   * CREATE QUESTION
   * ============================================================
   */
  const createQuestion = async () => {
    setError("");
    setSuccess("");

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!question.trim()) {
      setError("Please enter the question.");
      return;
    }

    if (!optionA.trim()) {
      setError("Please enter Option A.");
      return;
    }

    if (!optionB.trim()) {
      setError("Please enter Option B.");
      return;
    }

    if (!optionC.trim()) {
      setError("Please enter Option C.");
      return;
    }

    if (!optionD.trim()) {
      setError("Please enter Option D.");
      return;
    }

    if (!correctAnswer.trim()) {
      setError("Please enter the correct answer.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/questions", {
        question: question.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: correctAnswer.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,

        /**
         * The backend will also validate this against the
         * selected subject programme.
         */
        examType: programme,

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

      setSuccess(`${programme} question created successfully.`);

      await loadQuestions();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to create question.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ============================================================
   * DELETE QUESTION
   * ============================================================
   */
  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/questions/${id}`);

      setSuccess("Question deleted successfully.");

      await loadQuestions();
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(message || "Unable to delete this question.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Question Bank</h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 border border-red-300 px-4 py-3 text-red-700">
            {Array.isArray(error) ? error.join(", ") : error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded bg-green-100 border border-green-300 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create Question</h2>

          {/* PROGRAMME */}
          <label className="block font-medium mb-1">Programme</label>

          <select
            className="border p-2 w-full mb-3"
            value={programme}
            onChange={(e) => handleProgrammeChange(e.target.value as Programme)}
          >
            <option value="JAMB">JAMB</option>
            <option value="WAEC">WAEC</option>
          </select>

          {/* SUBJECT */}
          <label className="block font-medium mb-1">Subject</label>

          <select
            className="border p-2 w-full mb-3"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Select {programme} Subject</option>

            {filteredSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.programme})
              </option>
            ))}
          </select>

          {/* TOPIC */}
          <label className="block font-medium mb-1">Topic</label>

          <select
            className="border p-2 w-full mb-3"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={!subjectId || loadingTopics}
          >
            <option value="">
              {loadingTopics ? "Loading topics..." : "Select Topic"}
            </option>

            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          {/* QUESTION */}
          <textarea
            className="border p-2 w-full mb-3"
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {/* OPTIONS */}
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

          {/* CORRECT ANSWER */}
          <input
            className="border p-2 w-full mb-3"
            placeholder="Correct Answer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />

          {/* EXPLANATION */}
          <textarea
            className="border p-2 w-full mb-3"
            placeholder="Explanation (optional)"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />

          {/* DIFFICULTY */}
          <label className="block font-medium mb-1">Difficulty</label>

          <select
            className="border p-2 w-full mb-4"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>

          <button
            type="button"
            onClick={createQuestion}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : `Create ${programme} Question`}
          </button>
        </div>

        {/* EXISTING QUESTIONS */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Existing Questions</h2>

          {loadingQuestions ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-gray-500">No questions have been created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Question</th>
                    <th className="text-left p-2">Programme</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Topic</th>
                    <th className="text-left p-2">Difficulty</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} className="border-b">
                      <td className="p-2">{q.question}</td>

                      <td className="p-2">{q.examType}</td>

                      <td className="p-2">{q.subject?.name || "—"}</td>

                      <td className="p-2">{q.topic?.name || "—"}</td>

                      <td className="p-2">{q.difficulty}</td>

                      <td className="p-2">
                        <button
                          type="button"
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
