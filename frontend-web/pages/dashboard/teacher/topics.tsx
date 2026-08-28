import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

export default function TopicsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const loadData = async () => {
    const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

    const topicsRes = await api.get(`/topics/teacher/${user.id}`);

    setSubjects(subjectsRes.data);
    setTopics(topicsRes.data);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const createTopic = async () => {
    await api.post("/topics", {
      name,
      description,
      subjectId,
    });

    setName("");
    setDescription("");

    loadData();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Topics</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <input
          placeholder="Topic Name"
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

        <select
          className="border p-2 w-full mb-3"
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
          onClick={createTopic}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Topic
        </button>
      </div>

      {topics.map((topic) => (
        <div key={topic.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{topic.name}</h3>

          <p>{topic.description}</p>

          <small>Subject: {topic.subject?.name}</small>
        </div>
      ))}
    </TeacherLayout>
  );
}
