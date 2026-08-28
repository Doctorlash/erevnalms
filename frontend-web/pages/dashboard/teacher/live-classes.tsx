/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function TeacherLiveClassesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [subjects, setSubjects] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    const classesRes = await api.get(`/live-classes/teacher/${user.id}`);

    const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

    setClasses(classesRes.data);
    setSubjects(subjectsRes.data);
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const classesRes = await api.get(`/live-classes/teacher/${user.id}`);
      const subjectsRes = await api.get(`/subjects/teacher/${user.id}`);

      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    };

    fetchData();
  }, [user]);

  const createClass = async () => {
    if (!user) return;

    await api.post("/live-classes", {
      title,
      subjectId,
      teacherId: user.id,
      meetingLink,
      startTime,
      endTime,
    });

    setTitle("");
    setSubjectId("");
    setMeetingLink("");
    setStartTime("");
    setEndTime("");

    loadData();
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold mb-6">Live Classes</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <input
          placeholder="Class Title"
          className="border p-2 w-full mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

        <input
          placeholder="Meeting Link"
          className="border p-2 w-full mb-3"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
        />

        <input
          type="datetime-local"
          className="border p-2 w-full mb-3"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <input
          type="datetime-local"
          className="border p-2 w-full mb-3"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <button
          onClick={createClass}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Live Class
        </button>
      </div>

      {classes.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-bold">{item.title}</h3>

          <p>Subject: {item.subject?.name}</p>

          <p>
            Start:
            {new Date(item.startTime).toLocaleString()}
          </p>

          <p>
            End:
            {new Date(item.endTime).toLocaleString()}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={item.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Join Meeting
            </a>

            <button
              type="button"
              onClick={() =>
                (window.location.href = `/dashboard/teacher/live-class-attendance/${item.id}`)
              }
              className="rounded-lg bg-indigo-100 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-200"
            >
              View Attendance
            </button>
          </div>
        </div>
      ))}
    </TeacherLayout>
  );
}
