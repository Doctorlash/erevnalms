import { useEffect, useState } from "react";
import StudentLayout from "../../layouts/StudentLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentAssignmentsPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/assignments").then((res) => {
      setAssignments(res.data);
    });
  }, []);

  const submitAssignment = async (assignmentId: string) => {
    const content = prompt("Enter assignment answer");

    if (!content || !user) return;

    await api.post(`/assignments/${assignmentId}/submit`, {
      studentId: user.id,
      content,
    });

    alert("Assignment submitted");
  };

  return (
    <StudentLayout>
      <h1 className="text-3xl font-bold mb-6">Assignments</h1>

      {assignments.map((assignment) => (
        <div key={assignment.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{assignment.title}</h3>

          <p>{assignment.description}</p>

          <button
            onClick={() => submitAssignment(assignment.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
          >
            Submit Assignment
          </button>
        </div>
      ))}
    </StudentLayout>
  );
}
