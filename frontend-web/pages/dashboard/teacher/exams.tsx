import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";

export default function TeacherExamsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  const [selectedExam, setSelectedExam] = useState("");

  const [examForm, setExamForm] = useState({
    title: "",
    subjectId: "",
    duration: 60,
    totalMarks: 100,
    isPublished: false,
  });

  const [questionId, setQuestionId] = useState("");

  const loadData = async () => {
    const subjectsRes = await api.get("/subjects");
    const questionsRes = await api.get("/questions");
    const examsRes = await api.get("/exams");

    setSubjects(subjectsRes.data);
    setQuestions(questionsRes.data);
    setExams(examsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createExam = async () => {
    try {
      await api.post("/exams", examForm);

      alert("Exam created");

      setExamForm({
        title: "",
        subjectId: "",
        duration: 60,
        totalMarks: 100,
        isPublished: false,
      });

      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to create exam");
    }
  };

  const addQuestion = async () => {
    if (!selectedExam || !questionId) {
      return alert("Select exam and question");
    }

    try {
      await api.post(`/exams/${selectedExam}/questions`, {
        questionId,
      });

      alert("Question added");

      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to add question");
    }
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Exams Management</h1>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Create Exam</h2>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Exam Title"
          value={examForm.title}
          onChange={(e) =>
            setExamForm({
              ...examForm,
              title: e.target.value,
            })
          }
        />

        <select
          className="border p-2 w-full mb-3"
          value={examForm.subjectId}
          onChange={(e) =>
            setExamForm({
              ...examForm,
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

        <input
          type="number"
          className="border p-2 w-full mb-3"
          placeholder="Duration (minutes)"
          value={examForm.duration}
          onChange={(e) =>
            setExamForm({
              ...examForm,
              duration: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          className="border p-2 w-full mb-3"
          placeholder="Total Marks"
          value={examForm.totalMarks}
          onChange={(e) =>
            setExamForm({
              ...examForm,
              totalMarks: Number(e.target.value),
            })
          }
        />

        <button
          onClick={createExam}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Exam
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add Question To Exam</h2>

        <select
          className="border p-2 w-full mb-3"
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

        <select
          className="border p-2 w-full mb-3"
          value={questionId}
          onChange={(e) => setQuestionId(e.target.value)}
        >
          <option value="">Select Question</option>

          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.question}
            </option>
          ))}
        </select>

        <button
          onClick={addQuestion}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Question
        </button>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{exam.title}</h3>

            <p>Questions: {exam.examQuestions?.length || 0}</p>

            <p>Subject: {exam.subject?.name}</p>
          </div>
        ))}
      </div>
    </TeacherLayout>
  );
}
