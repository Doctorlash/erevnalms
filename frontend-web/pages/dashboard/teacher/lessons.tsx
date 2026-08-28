import { useEffect, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import useTeacherAuth from "../../../hooks/useTeacherAuth";
import api from "../../../services/api";

type LessonStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  status: LessonStatus;
  isPublished: boolean;
  rejectionReason?: string;
  createdAt: string;
  topic?: {
    id: string;
    name: string;
    subject?: {
      id: string;
      name: string;
    };
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Topic {
  id: string;
  name: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function TeacherLessonsPage() {
  const { user } = useTeacherAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLessons = async () => {
    try {
      setLoading(true);

      const response = await api.get("/lessons/teacher");

      setLessons(response.data);
    } catch (error) {
      console.error("Failed to load lessons:", error);
      alert("Unable to load your lessons.");
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(`/topics/teacher/${user.id}`);

      setTopics(response.data);
    } catch (error) {
      console.error("Failed to load topics:", error);
      alert("Unable to load your assigned topics.");
    }
  };

  useEffect(() => {
    if (!user) return;

    loadLessons();
    loadTopics();
  }, [user]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setVideoUrl("");
    setDuration("");
    setSelectedTopic("");
  };

  const createLesson = async () => {
    if (!title.trim() || !content.trim() || !selectedTopic) {
      alert("Title, topic and content are required.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/lessons", {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        videoUrl: videoUrl.trim() || undefined,
        duration: duration ? Number(duration) : undefined,
        topicId: selectedTopic,
      });

      alert(
        "Lesson created successfully as a draft. Submit it for admin approval when it is ready.",
      );

      resetForm();
      await loadLessons();
    } catch (error: any) {
      console.error("Failed to create lesson:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to create lesson. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const submitForApproval = async (id: string) => {
    const confirmed = confirm("Submit this lesson for administrator approval?");

    if (!confirmed) return;

    try {
      await api.patch(`/lessons/${id}/submit`);

      alert("Lesson submitted for administrator approval.");

      await loadLessons();
    } catch (error: any) {
      console.error("Failed to submit lesson:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to submit lesson for approval.",
      );
    }
  };

  const deleteLesson = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this lesson?");

    if (!confirmed) return;

    try {
      await api.delete(`/lessons/${id}`);

      alert("Lesson deleted.");

      await loadLessons();
    } catch (error: any) {
      console.error("Failed to delete lesson:", error);

      alert(error?.response?.data?.message || "Unable to delete lesson.");
    }
  };

  const getStatusClasses = (status: LessonStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700";

      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";

      case "APPROVED":
        return "bg-green-100 text-green-800";

      case "REJECTED":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: LessonStatus) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "Pending Approval";

      default:
        return status;
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Lessons</h1>

          <p className="text-gray-500 mt-2">
            Create lessons for your assigned subjects and submit them for
            administrator approval.
          </p>
        </div>

        {/* CREATE LESSON */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Create New Lesson
          </h2>

          <div className="space-y-4">
            <input
              className="border border-gray-300 p-3 rounded-lg w-full"
              placeholder="Lesson Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="border border-gray-300 p-3 rounded-lg w-full"
              placeholder="Lesson Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              className="border border-gray-300 p-3 rounded-lg w-full"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">Select Topic</option>

              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.subject?.name
                    ? `${topic.subject.name} — ${topic.name}`
                    : topic.name}
                </option>
              ))}
            </select>

            <input
              className="border border-gray-300 p-3 rounded-lg w-full"
              placeholder="Video URL (optional)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <input
              type="number"
              min="1"
              className="border border-gray-300 p-3 rounded-lg w-full"
              placeholder="Duration in minutes (optional)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <textarea
              rows={14}
              className="border border-gray-300 p-3 rounded-lg w-full"
              placeholder="Write the lesson content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <button
              type="button"
              onClick={createLesson}
              disabled={saving}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {saving ? "Creating..." : "Save Lesson as Draft"}
            </button>
          </div>
        </div>

        {/* LESSON LIST */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              My Created Lessons
            </h2>

            <button
              onClick={loadLessons}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading lessons...</p>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>You have not created any lessons yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {lesson.title}
                        </h3>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                            lesson.status,
                          )}`}
                        >
                          {formatStatus(lesson.status)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-2">
                        Subject: {lesson.topic?.subject?.name || "Unknown"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Topic: {lesson.topic?.name || "Unknown"}
                      </p>

                      {lesson.description && (
                        <p className="text-gray-600 mt-3">
                          {lesson.description}
                        </p>
                      )}

                      {lesson.status === "REJECTED" &&
                        lesson.rejectionReason && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="font-semibold text-red-800">
                              Administrator Feedback
                            </p>

                            <p className="text-red-700 mt-1">
                              {lesson.rejectionReason}
                            </p>
                          </div>
                        )}

                      {lesson.status === "APPROVED" && lesson.approvedBy && (
                        <p className="text-sm text-green-700 mt-3">
                          Approved by {lesson.approvedBy.firstName}{" "}
                          {lesson.approvedBy.lastName}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(lesson.status === "DRAFT" ||
                        lesson.status === "REJECTED") && (
                        <button
                          onClick={() => submitForApproval(lesson.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          Submit for Approval
                        </button>
                      )}

                      {(lesson.status === "DRAFT" ||
                        lesson.status === "REJECTED") && (
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
