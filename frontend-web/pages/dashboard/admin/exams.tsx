import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminExamsPage() {
  useAdminAuth();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState("");
  const [totalMarks, setTotalMarks] = useState("");

  const [selectedExam, setSelectedExam] = useState("");

  const loadData = async () => {
    const [subjectsRes, questionsRes, examsRes] = await Promise.all([
      api.get("/subjects"),
      api.get("/questions"),
      api.get("/exams"),
    ]);

    setSubjects(subjectsRes.data);
    setQuestions(questionsRes.data);
    setExams(examsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createExam = async () => {
    if (!title || !subjectId) {
      alert("Title and Subject required");
      return;
    }

    await api.post("/exams", {
      title,
      subjectId,
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      isPublished: true,
    });

    setTitle("");
    setDuration("");
    setTotalMarks("");

    loadData();
  };

  const attachQuestion = async (examId: string, questionId: string) => {
    await api.post(`/exams/${examId}/questions`, {
      questionId,
    });

    alert("Question attached");
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Exam Management</h1>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Create Exam</h2>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Exam Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

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

        <input
          type="number"
          className="border p-2 w-full mb-3"
          placeholder="Duration (Minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 w-full mb-3"
          placeholder="Total Marks"
          value={totalMarks}
          onChange={(e) => setTotalMarks(e.target.value)}
        />

        <button
          onClick={createExam}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Exam
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Attach Questions To Exam</h2>

        <select
          className="border p-2 w-full mb-4"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">Select Exam</option>

          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>

        {selectedExam &&
          questions.map((question) => (
            <div key={question.id} className="border rounded p-3 mb-3">
              <p className="font-medium">{question.question}</p>

              <button
                onClick={() => attachQuestion(selectedExam, question.id)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
              >
                Attach
              </button>
            </div>
          ))}
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Existing Exams</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Title</th>

              <th className="text-left py-2">Subject</th>

              <th className="text-left py-2">Questions</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="border-b">
                <td className="py-3">{exam.title}</td>

                <td>{exam.subject?.name}</td>

                <td>{exam.examQuestions?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
