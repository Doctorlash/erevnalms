import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
export default function AdminUsersPage() {
  useAdminAuth();

  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    const res = await api.get("/users");

    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (userId: string, role: string) => {
    await api.patch(`/users/${userId}/role/${role}`);

    loadUsers();
  };

  const activateUser = async (userId: string) => {
    await api.patch(`/users/${userId}/activate`);

    loadUsers();
  };

  const deactivateUser = async (userId: string) => {
    await api.patch(`/users/${userId}/deactivate`);

    loadUsers();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="bg-white rounded shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>

              <th className="text-left py-3">Email</th>

              <th className="text-left py-3">Role</th>

              <th className="text-left py-3">Status</th>

              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-3">
                  {user.firstName} {user.lastName}
                </td>

                <td>{user.email}</td>

                <td>{user.role}</td>

                <td>{user.isActive ? "Active" : "Inactive"}</td>

                <td className="space-x-2">
                  <button
                    onClick={() => changeRole(user.id, "TEACHER")}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Teacher
                  </button>

                  <button
                    onClick={() => changeRole(user.id, "STUDENT")}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Student
                  </button>

                  <button
                    onClick={() => changeRole(user.id, "ADMIN")}
                    className="bg-purple-600 text-white px-3 py-1 rounded"
                  >
                    Admin
                  </button>

                  {user.isActive ? (
                    <button
                      onClick={() => deactivateUser(user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateUser(user.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded"
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
