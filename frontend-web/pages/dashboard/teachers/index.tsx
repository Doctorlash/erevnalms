import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import TeacherLayout from "../../../layouts/TeacherLayout";
import { useAuth } from "../../../contexts/AuthContext";
import useTeacherAuth from "../../../hooks/useTeacherAuth";

import api from "../../../services/api";

export default function TeachersPage() {
  useTeacherAuth();

  const { user } = useAuth();

  const router = useRouter();

  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    api.get("/messages/teachers").then((res) => {
      setTeachers(res.data);
    });
  }, []);

  const startChat = async (teacherId: string) => {
    const res = await api.post("/messages/start", {
      studentId: user?.id,
      teacherId,
    });

    router.push(`/dashboard/messages/${res.data.id}`);
  };

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold text-indigo-700 mb-8">Teachers</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <img
                src={teacher.profileImage || "/images/default-avatar.png"}
                className="w-20 h-20 rounded-full object-cover"
              />

              <div>
                <h2 className="font-bold text-xl">
                  {teacher.firstName} {teacher.lastName}
                </h2>

                <p className="text-gray-500">{teacher.school}</p>
              </div>
            </div>

            <p className="mt-4 text-gray-600">
              {teacher.bio || "No biography yet."}
            </p>

            <button
              onClick={() => startChat(teacher.id)}
              className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
            >
              Message Teacher
            </button>
          </div>
        ))}
      </div>
    </TeacherLayout>
  );
}
