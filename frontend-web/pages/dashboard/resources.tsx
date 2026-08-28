import { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import api from "../../services/api";

type ResourceType = "PDF" | "VIDEO" | "AUDIO";

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function StudentResourcesPage() {
  useStudentAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ResourceType>("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/resources");

        setResources(response.data);
      } catch (err) {
        console.error("Failed to load resources:", err);
        setError("Unable to load learning resources.");
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const subjects = useMemo(() => {
    const subjectMap = new Map<string, string>();

    resources.forEach((resource) => {
      if (resource.subject) {
        subjectMap.set(resource.subject.id, resource.subject.name);
      }
    });

    return Array.from(subjectMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [resources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.subject?.name.toLowerCase().includes(query);

      const matchesType = typeFilter === "ALL" || resource.type === typeFilter;

      const matchesSubject =
        subjectFilter === "ALL" || resource.subject?.id === subjectFilter;

      return matchesSearch && matchesType && matchesSubject;
    });
  }, [resources, search, typeFilter, subjectFilter]);

  const getIcon = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return "📄";
      case "VIDEO":
        return "🎥";
      case "AUDIO":
        return "🎧";
      default:
        return "📚";
    }
  };

  const getTypeStyle = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return "bg-red-50 text-red-600 border-red-100";

      case "VIDEO":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";

      case "AUDIO":
        return "bg-purple-50 text-purple-600 border-purple-100";

      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-8 text-white shadow-xl md:p-10">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Erevna Learning Library
            </p>

            <h1 className="text-3xl font-bold md:text-5xl">Resource Centre</h1>

            <p className="mt-4 text-base leading-relaxed text-indigo-100 md:text-lg">
              Access your learning materials in one place. Watch lessons, listen
              to audio classes and download study documents whenever you need
              them.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        </section>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Total Resources
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {resources.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Documents</p>

            <p className="mt-2 text-3xl font-bold text-red-500">
              {resources.filter((resource) => resource.type === "PDF").length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Video Lessons</p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {resources.filter((resource) => resource.type === "VIDEO").length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Audio Classes</p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {resources.filter((resource) => resource.type === "AUDIO").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search resources
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, subject..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Resource type
              </label>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "ALL" | ResourceType)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">All Resources</option>
                <option value="PDF">PDF</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subject
              </label>

              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">All Subjects</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="font-medium text-slate-500">
              Loading your learning resources...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredResources.length === 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
            <div className="mb-5 text-6xl">📚</div>

            <h2 className="text-2xl font-bold text-slate-900">
              No Resources Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-500">
              {resources.length === 0
                ? "Your teachers have not uploaded learning resources yet."
                : "Try changing your search or filters."}
            </p>
          </div>
        )}

        {/* Resource Grid */}
        {!loading && filteredResources.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredResources.map((resource) => (
              <article
                key={resource.id}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl"
              >
                {/* Card Header */}
                <div className="relative flex items-center justify-between bg-gradient-to-br from-slate-50 to-white p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm ring-1 ring-slate-100 transition group-hover:scale-105">
                    {getIcon(resource.type)}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${getTypeStyle(
                      resource.type,
                    )}`}
                  >
                    {resource.type}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      {resource.subject?.name || "General Resource"}
                    </span>
                  </div>

                  <h2 className="line-clamp-2 text-xl font-bold text-slate-900">
                    {resource.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-relaxed text-slate-500">
                    {resource.description ||
                      "Learning material provided by your teacher."}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>

                    {resource.fileSize && (
                      <span>{formatFileSize(resource.fileSize)}</span>
                    )}
                  </div>

                  {/* Action */}
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 hover:shadow-lg"
                  >
                    {resource.type === "PDF"
                      ? "Open PDF"
                      : resource.type === "VIDEO"
                        ? "Watch Lesson"
                        : "Listen to Class"}

                    <span>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
