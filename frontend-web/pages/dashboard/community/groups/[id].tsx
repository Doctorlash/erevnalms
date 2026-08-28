import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardLayout from "../../../../layouts/DashboardLayout";
import useRequireAuth from "../../../../hooks/useRequireAuth";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";

interface GroupUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  role?: string;
}

interface GroupMember {
  id: string;
  userId: string;
  joinedAt: string;
  user: GroupUser;
}

interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
}

export default function StudyGroupPage() {
  useRequireAuth();

  const { user } = useAuth();
  const router = useRouter();

  const groupId =
    typeof router.query.id === "string" ? router.query.id : undefined;

  const [group, setGroup] = useState<StudyGroup | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD GROUP
  // =========================================================

  const loadGroup = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/community/groups/${groupId}`);

      setGroup(response.data);
    } catch (error) {
      console.error("Failed to load study group:", error);

      setError("Unable to load this study group.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    loadGroup();
  }, [router.isReady, groupId]);

  // =========================================================
  // JOIN GROUP
  // =========================================================

  const joinGroup = async () => {
    if (!user || !groupId) {
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/community/groups/${groupId}/join`, {
        userId: user.id,
      });

      await loadGroup();
    } catch (error: any) {
      console.error("Failed to join group:", error);

      alert(
        error?.response?.data?.message || "Unable to join this study group.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LEAVE GROUP
  // =========================================================

  const leaveGroup = async () => {
    if (!user || !groupId || !group) {
      return;
    }

    if (group.createdBy === user.id) {
      alert("The group creator cannot leave the group.");
      return;
    }

    try {
      setActionLoading(true);

      await api.delete(`/community/groups/${groupId}/leave`, {
        data: {
          userId: user.id,
        },
      });

      await loadGroup();
    } catch (error: any) {
      console.error("Failed to leave group:", error);

      alert(
        error?.response?.data?.message || "Unable to leave this study group.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading study group...</p>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !group) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Study Group Unavailable
          </h1>

          <p className="text-gray-500 mt-3">
            {error || "This study group could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/community/groups")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Study Groups
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // MEMBERSHIP
  // =========================================================

  const isMember =
    !!user && group.members.some((member) => member.userId === user.id);

  const isCreator = !!user && group.createdBy === user.id;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <DashboardLayout>
      {/* BACK */}

      <Link
        href="/dashboard/community/groups"
        className="inline-block mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
      >
        ← Back to Study Groups
      </Link>

      {/* =====================================================
          GROUP HEADER
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-indigo-700">
              {group.name}
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Created on {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* GROUP ACTION */}

          <div>
            {isCreator ? (
              <div className="bg-indigo-50 text-indigo-700 px-5 py-3 rounded-xl font-semibold">
                Group Creator
              </div>
            ) : isMember ? (
              <button
                type="button"
                onClick={leaveGroup}
                disabled={actionLoading}
                className="border border-red-300 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 px-5 py-3 rounded-xl font-semibold"
              >
                {actionLoading ? "Leaving..." : "Leave Group"}
              </button>
            ) : (
              <button
                type="button"
                onClick={joinGroup}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-semibold"
              >
                {actionLoading ? "Joining..." : "Join Group"}
              </button>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}

        <div className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-bold text-gray-900">About this group</h2>

          {group.description ? (
            <p className="mt-3 text-gray-700 leading-8 whitespace-pre-wrap">
              {group.description}
            </p>
          ) : (
            <p className="mt-3 text-gray-400 italic">
              No description has been provided for this group.
            </p>
          )}
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-indigo-50 rounded-xl p-5">
            <p className="text-sm text-indigo-600 font-medium">Total Members</p>

            <p className="text-3xl font-bold text-indigo-800 mt-1">
              {group.members.length}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5">
            <p className="text-sm text-slate-600 font-medium">Your Status</p>

            <p className="text-xl font-bold text-slate-800 mt-1">
              {isCreator ? "Creator" : isMember ? "Member" : "Not a member"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          MEMBERS
      ===================================================== */}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>

          <span className="text-sm text-gray-500">
            {group.members.length}{" "}
            {group.members.length === 1 ? "member" : "members"}
          </span>
        </div>

        {group.members.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            This group has no members yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.members.map((member) => {
              const memberIsCreator = member.userId === group.createdBy;

              return (
                <div key={member.id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center gap-4">
                    {/* AVATAR */}

                    {member.user.profileImage ? (
                      <img
                        src={member.user.profileImage}
                        alt={`${member.user.firstName} ${member.user.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {member.user.firstName?.charAt(0)}
                        {member.user.lastName?.charAt(0)}
                      </div>
                    )}

                    {/* NAME */}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>

                      {member.user.role && (
                        <p className="text-xs text-gray-500">
                          {member.user.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CREATOR BADGE */}

                  <div className="mt-4">
                    {memberIsCreator ? (
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Group Creator
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        Member
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          GROUP INFORMATION
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900">About Study Groups</h2>

        <p className="text-gray-600 mt-3 leading-7">
          Study groups allow Erevna students to learn together, exchange ideas
          and support one another academically.
        </p>

        {!isMember && !isCreator && (
          <p className="text-indigo-600 font-medium mt-3">
            Join this group to become part of the learning community.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
