import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminSubjectsPage() {
  useAdminAuth();

  const [subjects, setSubjects] = useState<any[]>([]);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const loadSubjects = async () => {
    const res = await api.get("/subjects");

    setSubjects(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const createSubject = async () => {
    if (!name) {
      alert("Subject name required");
      return;
    }

    await api.post("/subjects", {
      name,
      description,
    });

    setName("");
    setDescription("");

    loadSubjects();
  };

  const deleteSubject = async (id: string) => {
    const confirmDelete = confirm("Delete this subject?");

    if (!confirmDelete) return;

    await api.delete(`/subjects/${id}`);

    loadSubjects();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Subject Management</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Create Subject</h2>

        <input
          type="text"
          placeholder="Subject Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <button
          onClick={createSubject}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Subject
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Existing Subjects</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>

              <th className="text-left py-3">Description</th>

              <th className="text-left py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id} className="border-b">
                <td className="py-3">{subject.name}</td>

                <td>{subject.description}</td>

                <td>
                  <button
                    onClick={() => deleteSubject(subject.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
