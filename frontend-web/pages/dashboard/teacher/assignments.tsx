import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    maxScore: 100,
  });

  const loadData = async () => {
    if (!user) return;

    const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

    const assignmentsRes = await api.get(`/assignments/teacher/${user.id}`);

    setSubjects(subjectsRes.data);
    setAssignments(assignmentsRes.data);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const createAssignment = async () => {
    if (!user) return;

    await api.post("/assignments", {
      ...form,
      teacherId: user.id,
    });

    setForm({
      title: "",
      description: "",
      subjectId: "",
      dueDate: "",
      maxScore: 100,
    });

    loadData();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Assignments</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <input
          className="border p-2 w-full mb-3"
          placeholder="Title"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
        />

        <textarea
          className="border p-2 w-full mb-3"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
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

        <input
          type="date"
          className="border p-2 w-full mb-3"
          value={form.dueDate}
          onChange={(e) =>
            setForm({
              ...form,
              dueDate: e.target.value,
            })
          }
        />

        <input
          type="number"
          className="border p-2 w-full mb-3"
          value={form.maxScore}
          onChange={(e) =>
            setForm({
              ...form,
              maxScore: Number(e.target.value),
            })
          }
        />

        <button
          onClick={createAssignment}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Assignment
        </button>
      </div>

      {assignments.map((assignment) => (
        <div key={assignment.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{assignment.title}</h3>

          <p>{assignment.description}</p>

          <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>

          <p>Submissions: {assignment.submissions?.length || 0}</p>
        </div>
      ))}
    </TeacherLayout>
  );
}
