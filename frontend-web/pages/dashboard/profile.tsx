/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";

import StudentLayout from "../../layouts/StudentLayout";
import useStudentAuth from "../../hooks/useStudentAuth";
import { useAuth } from "../../contexts/AuthContext";

import api from "../../services/api";

interface Profile {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  school: string;
  classLevel: string;
  bio: string;
  profileImage: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function ProfilePage() {
  useStudentAuth();

  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const response = await api.get("/profile/me");

      setProfile({
        id: response.data.id,
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        school: response.data.school || "",
        classLevel: response.data.classLevel || "",
        bio: response.data.bio || "",
        profileImage: response.data.profileImage || "",
        role: response.data.role || "",
        isActive: response.data.isActive,
        createdAt: response.data.createdAt,
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      alert("Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);

      await api.patch("/profile/me", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        school: profile.school,
        classLevel: profile.classLevel,
        bio: profile.bio,
        profileImage: profile.profileImage,
      });

      alert("Profile updated successfully.");

      await loadProfile();
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      alert(error?.response?.data?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };
  const uploadAvatar = async () => {
    if (!selectedFile || !user) {
      alert("Please select an image first.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      await api.post("/profile/avatar", formData);

      alert("Profile picture updated successfully.");

      setSelectedFile(null);

      await loadProfile();
    } catch (error: any) {
      console.error("Failed to upload profile picture:", error);

      alert(
        error?.response?.data?.message || "Unable to upload profile picture.",
      );
    } finally {
      setUploading(false);
    }
  };
  const changePassword = async () => {
    if (!password.oldPassword || !password.newPassword) {
      alert("Please enter your current and new password.");
      return;
    }

    try {
      await api.patch("/profile/password", {
        oldPassword: password.oldPassword,
        newPassword: password.newPassword,
      });

      alert("Password changed successfully.");

      setPassword({
        oldPassword: "",
        newPassword: "",
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);

      alert(error?.response?.data?.message || "Unable to change password.");
    }
  };

  if (loading || !profile) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

          <p className="text-gray-500 mt-2">
            Manage your personal information and account settings.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* PROFILE SUMMARY */}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col items-center">
              <img
                src={profile.profileImage || "/default-avatar.png"}
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover border-4 border-indigo-500"
              />

              <h2 className="text-xl font-bold text-slate-900 mt-4">
                {profile.firstName} {profile.lastName}
              </h2>

              {profile.email && (
                <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
              )}

              <input
                type="file"
                accept="image/*"
                className="mt-6 w-full text-sm"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
              />

              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2 break-all">
                  Selected: {selectedFile.name}
                </p>
              )}

              <button
                onClick={uploadAvatar}
                disabled={uploading || !selectedFile}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-semibold"
              >
                {uploading ? "Uploading..." : "Upload Picture"}
              </button>
            </div>

            <hr className="my-6" />

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Email</p>

                <p className="text-slate-900 mt-1">{profile.email || "-"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Role</p>

                <p className="text-slate-900 mt-1">
                  {profile.role || "STUDENT"}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Status</p>

                <p
                  className={`mt-1 font-semibold ${
                    profile.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {profile.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Joined</p>

                <p className="text-slate-900 mt-1">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="lg:col-span-2 space-y-8">
            {/* PERSONAL INFORMATION */}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Personal Information
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    First Name
                  </label>

                  <input
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Last Name
                  </label>

                  <input
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone
                  </label>

                  <input
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    School
                  </label>

                  <input
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.school}
                    onChange={(event) =>
                      updateField("school", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Class Level
                  </label>

                  <input
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.classLevel}
                    onChange={(event) =>
                      updateField("classLevel", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Biography
                </label>

                <textarea
                  className="border border-gray-300 rounded-xl p-3 w-full"
                  rows={5}
                  value={profile.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                />
              </div>

              <button
                disabled={saving}
                onClick={updateProfile}
                className="mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* PROFILE IMAGE URL */}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Profile Image URL
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                You can either upload an image above or provide an image URL
                here.
              </p>

              <input
                className="border border-gray-300 rounded-xl p-3 w-full"
                placeholder="https://example.com/profile.jpg"
                value={profile.profileImage}
                onChange={(event) =>
                  updateField("profileImage", event.target.value)
                }
              />
            </div>

            {/* CHANGE PASSWORD */}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Change Password
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Current Password
                  </label>

                  <input
                    type="password"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    placeholder="Enter your current password"
                    value={password.oldPassword}
                    onChange={(event) =>
                      setPassword({
                        ...password,
                        oldPassword: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    New Password
                  </label>

                  <input
                    type="password"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    placeholder="Enter your new password"
                    value={password.newPassword}
                    onChange={(event) =>
                      setPassword({
                        ...password,
                        newPassword: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={changePassword}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
