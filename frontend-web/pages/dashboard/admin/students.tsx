import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminStudentsPage() {
  useAdminAuth();

  const [students, setStudents] = useState<any[]>([]);

  const loadStudents = async () => {
    const res = await api.get("/users/students");

    setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const deactivateStudent = async (id: string) => {
    await api.patch(`/users/${id}/deactivate`);

    loadStudents();
  };

  const activateStudent = async (id: string) => {
    await api.patch(`/users/${id}/activate`);

    loadStudents();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Students</h1>

      <div className="bg-white rounded shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="py-3">
                  {student.firstName} {student.lastName}
                </td>

                <td>{student.email}</td>

                <td>{student.isActive ? "Active" : "Inactive"}</td>

                <td>
                  {student.isActive ? (
                    <button
                      onClick={() => deactivateStudent(student.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateStudent(student.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
