/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TeacherLayout from "../../../layouts/TeacherLayout";
import useTeacherAuth from "../../../hooks/useTeacherAuth";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

type ResourceType = "PDF" | "VIDEO" | "AUDIO";

interface Subject {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  createdAt: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function TeacherResourcesPage() {
  useTeacherAuth();

  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PDF" as ResourceType,
    subjectId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadResources();
    loadSubjects();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);

      const response = await api.get("/resources/teacher");

      setResources(response.data);
    } catch (err) {
      console.error("Failed to load resources:", err);
      setError("Unable to load your resources.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects");

      setSubjects(response.data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    if (file.type === "application/pdf") {
      setForm((previous) => ({
        ...previous,
        type: "PDF",
      }));
    } else if (file.type.startsWith("video/")) {
      setForm((previous) => ({
        ...previous,
        type: "VIDEO",
      }));
    } else if (file.type.startsWith("audio/")) {
      setForm((previous) => ({
        ...previous,
        type: "AUDIO",
      }));
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a resource title.");
      return;
    }

    if (!form.subjectId) {
      setError("Please select a subject.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("type", form.type);
      formData.append("subjectId", form.subjectId);
      formData.append("file", selectedFile);

      await api.post("/resources", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Resource uploaded successfully.");

      setForm({
        title: "",
        description: "",
        type: "PDF",
        subjectId: "",
      });

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setShowUpload(false);

      await loadResources();
    } catch (err: any) {
      console.error("Resource upload failed:", err);

      setError(err?.response?.data?.message || "Unable to upload resource.");
    } finally {
      setUploading(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/resources/${resourceId}`);

      setResources((previous) =>
        previous.filter((resource) => resource.id !== resourceId),
      );

      setSuccess("Resource deleted successfully.");
    } catch (err: any) {
      console.error("Delete failed:", err);

      setError(err?.response?.data?.message || "Unable to delete resource.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resourceIcon = (type: ResourceType) => {
    if (type === "PDF") return "📄";
    if (type === "VIDEO") return "🎥";
    return "🎧";
  };

  return (
    <TeacherLayout>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Teacher Workspace
            </p>

            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Resource Centre
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              Upload and manage learning materials for your students, including
              videos, PDFs and audio lessons.
            </p>
          </div>

          <button
            onClick={() => {
              setShowUpload(true);
              setError("");
              setSuccess("");
            }}
            className="rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            + Upload Resource
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">
              Total Resources
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {resources.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">PDFs</p>

            <p className="mt-2 text-3xl font-bold text-red-500">
              {resources.filter((resource) => resource.type === "PDF").length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Videos</p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {resources.filter((resource) => resource.type === "VIDEO").length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">Audio</p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {resources.filter((resource) => resource.type === "AUDIO").length}
            </p>
          </div>
        </div>

        {/* Resources */}
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">My Resources</h2>

            <p className="mt-1 text-slate-500">
              Learning materials you have uploaded.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
              <div className="mb-4 text-5xl">📚</div>

              <h3 className="text-xl font-bold text-slate-800">
                No resources yet
              </h3>

              <p className="mt-2 text-slate-500">
                Upload your first learning material for your students.
              </p>

              <button
                onClick={() => setShowUpload(true)}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Upload Resource
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                      {resourceIcon(resource.type)}
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {resource.type}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {resource.description || "No description provided."}
                  </p>

                  <div className="mt-5 space-y-2 text-sm">
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">
                        Subject:
                      </span>{" "}
                      {resource.subject?.name || "Unknown"}
                    </p>

                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">
                        Size:
                      </span>{" "}
                      {formatFileSize(resource.fileSize)}
                    </p>

                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-700">
                        Uploaded:
                      </span>{" "}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Open
                    </a>

                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Upload Resource
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add a learning material to your students' Resource Centre.
                  </p>
                </div>

                <button
                  onClick={() => setShowUpload(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-6 p-6 md:p-8">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resource Title
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="e.g. Introduction to Algebra"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subject
                </label>

                <select
                  required
                  value={form.subjectId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subjectId: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select subject</option>

                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Briefly describe this resource..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* File */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Learning File
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <div className="text-4xl">{selectedFile ? "📎" : "☁️"}</div>

                  <p className="mt-3 font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : "Choose a file"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    PDF, video or audio
                  </p>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.mp4,.webm,.mov,.mp3,.wav,.m4a"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resource Type
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {(["PDF", "VIDEO", "AUDIO"] as ResourceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          type,
                        })
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        form.type === type
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {uploading ? "Uploading Resource..." : "Upload Resource"}
              </button>
            </form>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
