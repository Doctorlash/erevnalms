/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function RecommendationsPage() {
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    api.get(`/ai-recommendations/${user.id}`).then((res) => setData(res.data));
  }, [user]);

  if (!data) {
    return (
      <StudentLayout>
        <p>Loading...</p>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <h1 className="text-3xl font-bold mb-6">AI Study Recommendations</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="font-bold text-xl mb-3">Weak Topics</h2>

        {data.weakTopics.map((topic: any) => (
          <p key={topic.topic}>
            {topic.topic} ({topic.mistakes} mistakes)
          </p>
        ))}
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-bold text-xl mb-3">Recommended Lessons</h2>

        {data.recommendedLessons.map((lesson: any) => (
          <p key={lesson.lessonId}>{lesson.topic}</p>
        ))}
      </div>
    </StudentLayout>
  );
}
