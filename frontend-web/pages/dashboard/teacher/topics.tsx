import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function TopicsPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const loadData = async () => {
    if (!user) return;

    try {
      const subjectsRes = await api.get<Subject[]>(
        `/subjects/teacher/${user.id}`,
      );

      const topicsRes = await api.get<Topic[]>(`/topics/teacher/${user.id}`);

      setSubjects(subjectsRes.data);
      setTopics(topicsRes.data);
    } catch (error) {
      console.error("Failed to load topics data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const createTopic = async () => {
    try {
      await api.post("/topics", {
        name,
        description,
        subjectId,
      });

      setName("");
      setDescription("");
      setSubjectId("");

      loadData();
    } catch (error) {
      console.error("Failed to create topic:", error);
      alert("Failed to create topic");
    }
  };

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-bold">Topics</h1>

      <div className="mb-6 rounded bg-white p-6 shadow">
        <input
          placeholder="Topic Name"
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

        <select
          className="mb-3 w-full border p-2"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={createTopic}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Create Topic
        </button>
      </div>

      {topics.map((topic) => (
        <div key={topic.id} className="mb-3 rounded bg-white p-4 shadow">
          <h3 className="font-bold">{topic.name}</h3>

          <p>{topic.description}</p>

          <small>Subject: {topic.subject?.name || "N/A"}</small>
        </div>
      ))}
    </TeacherLayout>
  );
}
