import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function TeacherSubmissionsPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    const res = await api.get(`/assignments/teacher/${user.id}`);

    setAssignments(res.data);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const gradeSubmission = async (submissionId: string) => {
    const score = prompt("Score");

    const feedback = prompt("Feedback");

    if (!score) return;

    await api.post(`/assignments/submissions/${submissionId}/grade`, {
      score: Number(score),
      feedback: feedback || "",
    });

    loadData();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Assignment Submissions</h1>

      {assignments.map((assignment) => (
        <div key={assignment.id} className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-bold mb-4">{assignment.title}</h3>

          {assignment.submissions?.map((submission: any) => (
            <div key={submission.id} className="border p-3 mb-2">
              <p>Student: {submission.student?.firstName}</p>

              <p>Content: {submission.content}</p>

              <p>Score: {submission.score ?? "Not Graded"}</p>

              <button
                onClick={() => gradeSubmission(submission.id)}
                className="bg-green-600 text-white px-3 py-1 rounded mt-2"
              >
                Grade
              </button>
            </div>
          ))}
        </div>
      ))}
    </TeacherLayout>
  );
}
