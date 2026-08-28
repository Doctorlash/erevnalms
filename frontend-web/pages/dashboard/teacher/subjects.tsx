/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";

export default function SubjectsPage() {
  interface Subject {
    id: string;
    name: string;
    description?: string;
  }

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Get user from session/context - TODO: implement user retrieval
  const user: { id: string } | null = null;

  const loadSubjects = async () => {
    if (!user) return;

    const res = await api.get<Subject[]>(`/subjects/teacher/${user!.id}`);
    setSubjects(res.data);
  };
  useEffect(() => {
    loadSubjects();
  }, [user]);

  const createSubject = async () => {
    await api.post("/subjects", {
      name,
      description,
    });

    setName("");
    setDescription("");

    loadSubjects();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Subjects</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <input
          placeholder="Subject Name"
          className="border p-2 w-full mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full mb-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={createSubject}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Subject
        </button>
      </div>

      {subjects.map((subject) => (
        <div key={subject.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{subject.name}</h3>

          <p>{subject.description}</p>
        </div>
      ))}
    </TeacherLayout>
  );
}
