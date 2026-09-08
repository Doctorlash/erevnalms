import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

type Programme = "JAMB" | "WAEC";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Enrollment {
  id: string;
  userId: string;
  subjectId: string;
  enrolledAt: string;
  user: Student;
}

interface Subject {
  id: string;
  name: string;
  description?: string | null;
  programme: Programme;
  isActive: boolean;
  teacher?: Teacher | null;
  _count?: {
    enrollments: number;
    topics: number;
  };
}

export default function AdminSubjectsPage() {
  useAdminAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([]);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [programme, setProgramme] = useState<Programme | "">("");

  const [loading, setLoading] = useState(true);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [enrollingStudent, setEnrollingStudent] = useState(false);

  const loadSubjects = async () => {
    try {
      const res = await api.get<Subject[]>("/subjects");

      setSubjects(res.data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await api.get<Teacher[]>("/users/teachers");

      setTeachers(res.data);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get<Student[]>("/users/students");

      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const loadEnrolledStudents = async (subjectId: string) => {
    try {
      const res = await api.get<Enrollment[]>(
        `/enrollments/subject/${subjectId}`,
      );

      setEnrolledStudents(res.data);
    } catch (error) {
      console.error("Failed to load enrolled students:", error);

      setEnrolledStudents([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([loadSubjects(), loadTeachers(), loadStudents()]);

      setLoading(false);
    };

    loadData();
  }, []);

  const createSubject = async () => {
    if (!name.trim()) {
      alert("Subject name is required.");
      return;
    }

    if (!programme) {
      alert("Please select whether this subject is for JAMB or WAEC.");
      return;
    }

    try {
      setCreatingSubject(true);

      await api.post("/subjects", {
        name: name.trim(),
        description: description.trim(),
        programme,
      });

      setName("");
      setDescription("");
      setProgramme("");

      await loadSubjects();

      alert(`${programme} subject created successfully.`);
    } catch (error: any) {
      console.error("Failed to create subject:", error);

      const message = error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to create subject.",
      );
    } finally {
      setCreatingSubject(false);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    const confirmed = confirm(
      "Delete this subject? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/subjects/${subjectId}`);

      if (selectedSubject?.id === subjectId) {
        setSelectedSubject(null);
        setEnrolledStudents([]);
      }

      await loadSubjects();
    } catch (error: any) {
      console.error("Failed to delete subject:", error);

      const message = error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to delete subject.",
      );
    }
  };

  const selectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);

    setSelectedTeacher(subject.teacher?.id || "");

    setSelectedStudent("");

    await loadEnrolledStudents(subject.id);
  };

  const assignTeacher = async () => {
    if (!selectedSubject) {
      alert("Select a subject first.");
      return;
    }

    if (!selectedTeacher) {
      alert("Select a teacher.");
      return;
    }

    try {
      setSavingTeacher(true);

      await api.patch(
        `/subjects/${selectedSubject.id}/assign-teacher/${selectedTeacher}`,
      );

      await loadSubjects();

      const teacher = teachers.find((item) => item.id === selectedTeacher);

      setSelectedSubject((current) =>
        current
          ? {
              ...current,
              teacher: teacher || null,
            }
          : current,
      );

      alert("Teacher assigned successfully.");
    } catch (error: any) {
      console.error("Failed to assign teacher:", error);

      const message = error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to assign teacher.",
      );
    } finally {
      setSavingTeacher(false);
    }
  };

  const enrollStudent = async () => {
    if (!selectedSubject) {
      alert("Select a subject first.");
      return;
    }

    if (!selectedStudent) {
      alert("Select a student.");
      return;
    }

    try {
      setEnrollingStudent(true);

      await api.post("/enrollments", {
        userId: selectedStudent,
        subjectId: selectedSubject.id,
      });

      setSelectedStudent("");

      await loadEnrolledStudents(selectedSubject.id);

      await loadSubjects();
    } catch (error: any) {
      console.error("Failed to enroll student:", error);

      const message = error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to enroll student.",
      );
    } finally {
      setEnrollingStudent(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!selectedSubject) return;

    const confirmed = confirm("Remove this student from the subject?");

    if (!confirmed) return;

    try {
      await api.delete(`/enrollments/${studentId}/${selectedSubject.id}`);

      await loadEnrolledStudents(selectedSubject.id);

      await loadSubjects();
    } catch (error: any) {
      console.error("Failed to remove student:", error);

      alert("Failed to remove student.");
    }
  };

  const enrolledStudentIds = new Set(
    enrolledStudents.map((enrollment) => enrollment.userId),
  );

  const availableStudents = students.filter(
    (student) => !enrolledStudentIds.has(student.id),
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Subject Management</h1>

        <p className="mt-2 text-gray-500">
          Create JAMB and WAEC subjects and control which teachers and students
          have access to each subject.
        </p>
      </div>

      {/* CREATE SUBJECT */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold text-gray-800">Create Subject</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="subject-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Subject Name
            </label>

            <input
              id="subject-name"
              type="text"
              placeholder="e.g. Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="subject-programme"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Programme
            </label>

            <select
              id="subject-programme"
              value={programme}
              onChange={(e) => setProgramme(e.target.value as Programme | "")}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select programme</option>
              <option value="JAMB">JAMB</option>
              <option value="WAEC">WAEC</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="subject-description"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Description
            </label>

            <input
              id="subject-description"
              type="text"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={createSubject}
          disabled={creatingSubject}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creatingSubject ? "Creating Subject..." : "Create Subject"}
        </button>
      </div>

      {/* SUBJECT LIST */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Existing Subjects
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              JAMB and WAEC subjects are managed separately.
            </p>
          </div>

          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              JAMB
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              WAEC
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-indigo-600">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p className="text-gray-500">No subjects have been created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-3">Subject</th>

                  <th className="px-3 py-3">Programme</th>

                  <th className="px-3 py-3">Teacher</th>

                  <th className="px-3 py-3">Students</th>

                  <th className="px-3 py-3">Topics</th>

                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b">
                    <td className="px-3 py-4">
                      <div className="font-semibold text-gray-800">
                        {subject.name}
                      </div>

                      <div className="text-sm text-gray-500">
                        {subject.description || "No description"}
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      {subject.programme === "JAMB" ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          JAMB
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          WAEC
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      {subject.teacher ? (
                        <span>
                          {subject.teacher.firstName} {subject.teacher.lastName}
                        </span>
                      ) : (
                        <span className="text-red-500">Not assigned</span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      {subject._count?.enrollments ?? 0}
                    </td>

                    <td className="px-3 py-4">{subject._count?.topics ?? 0}</td>

                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => selectSubject(subject)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteSubject(subject.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANAGEMENT PANEL */}
      {selectedSubject && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  Manage: {selectedSubject.name}
                </h2>

                <span
                  className={
                    selectedSubject.programme === "JAMB"
                      ? "rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"
                      : "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                  }
                >
                  {selectedSubject.programme}
                </span>
              </div>

              <p className="mt-1 text-gray-500">
                Control teacher assignment and student enrollment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSubject(null);
                setEnrolledStudents([]);
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>

          {/* TEACHER ASSIGNMENT */}
          <div className="mb-8 rounded-xl border border-gray-200 p-5">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Assign Teacher
            </h3>

            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-3"
              >
                <option value="">Select teacher</option>

                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} — {teacher.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={assignTeacher}
                disabled={savingTeacher}
                className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {savingTeacher ? "Assigning..." : "Assign Teacher"}
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Current teacher:{" "}
              <span className="font-semibold">
                {selectedSubject.teacher
                  ? `${selectedSubject.teacher.firstName} ${selectedSubject.teacher.lastName}`
                  : "None"}
              </span>
            </p>
          </div>

          {/* STUDENT ENROLLMENT */}
          <div className="mb-8 rounded-xl border border-gray-200 p-5">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Enroll Student
            </h3>

            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-3"
              >
                <option value="">Select student</option>

                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} — {student.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={enrollStudent}
                disabled={enrollingStudent || availableStudents.length === 0}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {enrollingStudent ? "Enrolling..." : "Enroll Student"}
              </button>
            </div>

            {availableStudents.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">
                All available students are already enrolled in this subject.
              </p>
            )}
          </div>

          {/* ENROLLED STUDENTS */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Enrolled Students
              </h3>

              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                {enrolledStudents.length} enrolled
              </span>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <p className="text-gray-500">
                  No students are enrolled in this subject yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-3">Student</th>

                      <th className="px-3 py-3">Email</th>

                      <th className="px-3 py-3">Enrolled</th>

                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrolledStudents.map((enrollment) => (
                      <tr key={enrollment.id} className="border-b">
                        <td className="px-3 py-4 font-semibold">
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </td>

                        <td className="px-3 py-4">{enrollment.user.email}</td>

                        <td className="px-3 py-4 text-sm text-gray-500">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </td>

                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => removeStudent(enrollment.userId)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
