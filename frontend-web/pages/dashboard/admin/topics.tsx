import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";

import api from "../../../services/api";

export default function AdminTopicsPage() {
  useAdminAuth();

  const [topics, setTopics] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const loadData = async () => {
    const topicsRes = await api.get("/topics");

    const subjectsRes = await api.get("/subjects");

    setTopics(topicsRes.data);
    setSubjects(subjectsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTopic = async () => {
    if (!name || !subjectId) {
      alert("Topic name and subject required");
      return;
    }

    await api.post("/topics", {
      name,
      description,
      subjectId,
    });

    setName("");
    setDescription("");
    setSubjectId("");

    loadData();
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Topic Management</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Create Topic</h2>

        <input
          type="text"
          placeholder="Topic Name"
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

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="border p-2 w-full mb-3"
        >
          <option value="">Select Subject</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <button
          onClick={createTopic}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Topic
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Existing Topics</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Topic</th>

              <th className="text-left py-3">Subject</th>

              <th className="text-left py-3">Description</th>
            </tr>
          </thead>

          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id} className="border-b">
                <td className="py-3">{topic.name}</td>

                <td>{topic.subject?.name}</td>

                <td>{topic.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
