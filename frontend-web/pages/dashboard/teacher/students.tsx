import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

type Enrollment = {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subject: {
    name: string;
  };
  enrolledAt: string;
};

export default function TeacherStudentsPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/enrollments/teacher/${user.id}`)
      .then((res) => {
        setStudents(res.data);
      })
      .catch(console.error);
  }, [user]);

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">My Students</h1>

      <div className="bg-white rounded shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Student</th>

              <th className="text-left py-3">Email</th>

              <th className="text-left py-3">Subject</th>

              <th className="text-left py-3">Enrolled</th>
            </tr>
          </thead>

          <tbody>
            {students.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">
                  {item.user.firstName} {item.user.lastName}
                </td>

                <td>{item.user.email}</td>

                <td>{item.subject.name}</td>

                <td>{new Date(item.enrolledAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TeacherLayout>
  );
}
