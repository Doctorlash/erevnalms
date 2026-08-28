import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminTeachersPage() {
  useAdminAuth();

  const [teachers, setTeachers] = useState<any[]>([]);

  const loadTeachers = async () => {
    const res = await api.get("/users/teachers");

    setTeachers(res.data);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const deactivateTeacher = async (id: string) => {
    await api.patch(`/users/${id}/deactivate`);

    loadTeachers();
  };

  const activateTeacher = async (id: string) => {
    await api.patch(`/users/${id}/activate`);

    loadTeachers();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Teachers</h1>

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
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-b">
                <td className="py-3">
                  {teacher.firstName} {teacher.lastName}
                </td>

                <td>{teacher.email}</td>

                <td>{teacher.isActive ? "Active" : "Inactive"}</td>

                <td>
                  {teacher.isActive ? (
                    <button
                      onClick={() => deactivateTeacher(teacher.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateTeacher(teacher.id)}
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
