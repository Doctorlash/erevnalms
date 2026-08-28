/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function TeacherAnnouncementsPage() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [subjects, setSubjects] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const loadData = async () => {
    if (!user) return;

    const announcementsRes = await api.get(`/announcements/teacher/${user.id}`);

    setAnnouncements(announcementsRes.data);

    const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

    setSubjects(subjectsRes.data);
  };

  useEffect(() => {
    // call async loader from inside effect to avoid calling setState synchronously in the effect body
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [user]);

  const createAnnouncement = async () => {
    if (!user) return;

    if (!title.trim()) {
      alert("Please enter an announcement title.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter an announcement message.");
      return;
    }

    try {
      await api.post("/announcements", {
        title: title.trim(),
        message: message.trim(),
        teacherId: user.id,
        subjectId: subjectId || undefined,
      });

      setTitle("");
      setMessage("");
      setSubjectId("");

      await loadData();

      alert("Announcement published successfully.");
    } catch (error: any) {
      console.error("Failed to create announcement:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to publish announcement. Please try again.",
      );
    }
  };
  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Announcements</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <input
          placeholder="Title"
          className="border p-2 w-full mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Message"
          className="border p-2 w-full mb-3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
          onClick={createAnnouncement}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Publish Announcement
        </button>
      </div>

      {announcements.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{item.title}</h3>

          <p>{item.message}</p>
        </div>
      ))}
    </TeacherLayout>
  );
}
