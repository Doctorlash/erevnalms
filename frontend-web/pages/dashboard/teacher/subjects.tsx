/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

interface Subject {
  id: string;
  name: string;
  description?: string;
}

export default function SubjectsPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadSubjects = async () => {
    if (!user) return;

    try {
      const res = await api.get<Subject[]>(`/subjects/teacher/${user.id}`);

      setSubjects(res.data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const createSubject = async () => {
    try {
      await api.post("/subjects", {
        name,
        description,
      });

      setName("");
      setDescription("");

      loadSubjects();
    } catch (error) {
      console.error("Failed to create subject:", error);
      alert("Failed to create subject");
    }
  };

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-bold">Subjects</h1>

      <div className="mb-6 rounded bg-white p-6 shadow">
        <input
          placeholder="Subject Name"
          className="mb-3 w-full border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="mb-3 w-full border p-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          type="button"
          onClick={createSubject}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Create Subject
        </button>
      </div>

      {subjects.map((subject) => (
        <div key={subject.id} className="mb-3 rounded bg-white p-4 shadow">
          <h3 className="font-bold">{subject.name}</h3>

          <p>{subject.description}</p>
        </div>
      ))}
    </TeacherLayout>
  );
}
