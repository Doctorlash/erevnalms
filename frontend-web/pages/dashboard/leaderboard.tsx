import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import api from "../../services/api";

export default function LeaderboardPage() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    api.get("/leaderboards").then((res) => setStudents(res.data));
  }, []);

  return (
    <StudentLayout>
      <h1 className="text-3xl font-bold mb-6">Student Leaderboard</h1>

      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Average Score</th>
              <th>Exams Taken</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => (
              <tr key={student.id} className="border-t">
                <td>{index + 1}</td>

                <td>
                  {student.firstName} {student.lastName}
                </td>

                <td>{student.averageScore}</td>

                <td>{student.examsTaken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StudentLayout>
  );
}
