import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";

import DashboardCard from "../components/DashboardCard";
import useAdminAuth from "../hooks/useAdminAuth";
import api from "../services/api";

export default function AdminPage() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/admin-dashboard").then((res) => setStats(res.data.statistics));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <DashboardCard title="Users" value={stats?.totalUsers ?? 0} />

        <DashboardCard title="Students" value={stats?.totalStudents ?? 0} />

        <DashboardCard title="Teachers" value={stats?.totalTeachers ?? 0} />

        <DashboardCard title="Subjects" value={stats?.totalSubjects ?? 0} />
      </div>
    </AdminLayout>
  );
}
