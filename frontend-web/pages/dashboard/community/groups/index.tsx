import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardLayout from "../../../../layouts/DashboardLayout";
import useRequireAuth from "../../../../hooks/useRequireAuth";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

interface GroupMember {
  id: string;
  userId: string;
  joinedAt: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;

  members: GroupMember[];
}

export default function StudyGroupsPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [groups, setGroups] = useState<StudyGroup[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD GROUPS
  // =========================================================

  const loadGroups = async () => {
    try {
      setError("");

      const response = await api.get("/community/groups");

      setGroups(response.data);
    } catch (error) {
      console.error("Failed to load study groups:", error);

      setError("Unable to load study groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // =========================================================
  // CREATE GROUP
  // =========================================================

  const createGroup = async () => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter a group name.");
      return;
    }

    try {
      setCreating(true);

      await api.post("/community/groups", {
        name: name.trim(),
        description: description.trim() || undefined,
        createdBy: user.id,
      });

      setName("");
      setDescription("");

      await loadGroups();
    } catch (error: any) {
      console.error("Failed to create study group:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create study group. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // JOIN GROUP
  // =========================================================

  const joinGroup = async (groupId: string) => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      setJoiningGroup(groupId);

      await api.post(`/community/groups/${groupId}/join`, {
        userId: user.id,
      });

      await loadGroups();
    } catch (error: any) {
      console.error("Failed to join study group:", error);

      alert(
        error?.response?.data?.message || "Unable to join this study group.",
      );
    } finally {
      setJoiningGroup(null);
    }
  };

  // =========================================================
  // LEAVE GROUP
  // =========================================================

  const leaveGroup = async (groupId: string) => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      setLeavingGroup(groupId);

      await api.delete(`/community/groups/${groupId}/leave`, {
        data: {
          userId: user.id,
        },
      });

      await loadGroups();
    } catch (error: any) {
      console.error("Failed to leave study group:", error);

      alert(
        error?.response?.data?.message || "Unable to leave this study group.",
      );
    } finally {
      setLeavingGroup(null);
    }
  };

  // =========================================================
  // CHECK MEMBERSHIP
  // =========================================================

  const isMember = (group: StudyGroup) => {
    if (!user) return false;

    return group.members.some((member) => member.userId === user.id);
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <DashboardLayout>
      {/* HEADER */}

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-indigo-700">Study Groups</h1>

            <p className="text-gray-600 mt-2">
              Find other students, form study groups and learn together.
            </p>
          </div>

          <Link
            href="/dashboard/community"
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold"
          >
            ← Community
          </Link>
        </div>
      </div>

      {/* =====================================================
          CREATE GROUP
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Create a Study Group
        </h2>

        <input
          type="text"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <textarea
          placeholder="Describe what this study group is about..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-4 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={createGroup}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {creating ? "Creating..." : "Create Study Group"}
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* =====================================================
          GROUPS
      ===================================================== */}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Loading study groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-700">
            No study groups yet
          </h3>

          <p className="text-gray-500 mt-2">
            Create the first study group and invite other students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => {
            const member = isMember(group);

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* GROUP HEADER */}

                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/dashboard/community/groups/${group.id}`}>
                      <h2 className="text-xl font-bold text-slate-900 hover:text-indigo-600">
                        {group.name}
                      </h2>
                    </Link>

                    <p className="text-sm text-gray-500 mt-1">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 h-fit text-xs font-semibold">
                    {group.members.length}{" "}
                    {group.members.length === 1 ? "Member" : "Members"}
                  </div>
                </div>

                {/* DESCRIPTION */}

                {group.description ? (
                  <p className="mt-4 text-gray-700 leading-7 line-clamp-3">
                    {group.description}
                  </p>
                ) : (
                  <p className="mt-4 text-gray-400 italic">
                    No description provided.
                  </p>
                )}

                {/* MEMBERS PREVIEW */}

                {group.members.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Members
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {group.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {member.user.firstName?.charAt(0)}
                            {member.user.lastName?.charAt(0)}
                          </div>

                          <span className="text-sm text-gray-700">
                            {member.user.firstName}
                          </span>
                        </div>
                      ))}

                      {group.members.length > 5 && (
                        <span className="text-sm text-gray-500 px-2 py-2">
                          +{group.members.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}

                <div className="flex items-center gap-3 mt-6 pt-5 border-t">
                  <Link
                    href={`/dashboard/community/groups/${group.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View Group →
                  </Link>

                  <div className="ml-auto">
                    {member ? (
                      <button
                        type="button"
                        onClick={() => leaveGroup(group.id)}
                        disabled={
                          leavingGroup === group.id ||
                          group.createdBy === user?.id
                        }
                        className="border border-red-300 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 px-4 py-2 rounded-lg font-semibold"
                      >
                        {group.createdBy === user?.id
                          ? "Creator"
                          : leavingGroup === group.id
                            ? "Leaving..."
                            : "Leave"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => joinGroup(group.id)}
                        disabled={joiningGroup === group.id}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        {joiningGroup === group.id
                          ? "Joining..."
                          : "Join Group"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
