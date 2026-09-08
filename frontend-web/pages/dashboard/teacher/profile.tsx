/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import useTeacherAuth from "../../../hooks/useTeacherAuth";
import { useAuth } from "../../../contexts/AuthContext";

import api from "../../../services/api";

interface TeacherProfile {
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

export default function TeacherProfilePage() {
  useTeacherAuth();

  const { user } = useAuth();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    } catch (error: any) {
      console.error("Failed to load teacher profile:", error);

      alert(error?.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const updateField = (field: keyof TeacherProfile, value: string) => {
    setProfile((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const updateProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      await api.patch("/profile/me", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        school: profile.school,
        classLevel: profile.classLevel,
        bio: profile.bio,
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("Profile picture must not exceed 5 MB.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      await api.post("/profile/avatar", formData);

      alert("Profile picture updated successfully.");

      setSelectedFile(null);

      const fileInput = document.getElementById(
        "teacher-profile-picture",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

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

  if (loading || !profile) {
    return (
      <TeacherLayout>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />

            <p className="text-gray-500 mt-4">Loading profile...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

          <p className="text-gray-500 mt-2">
            Manage your teacher information and professional profile.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* PROFILE SUMMARY */}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col items-center">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Teacher profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-emerald-200">
                  {profile.firstName?.charAt(0)?.toUpperCase() || "T"}
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-900 mt-4">
                {profile.firstName} {profile.lastName}
              </h2>

              {profile.email && (
                <p className="text-gray-500 text-sm mt-1 break-all text-center">
                  {profile.email}
                </p>
              )}

              <span className="mt-3 inline-flex px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                Teacher
              </span>

              <div className="w-full mt-6">
                <label
                  htmlFor="teacher-profile-picture"
                  className="block text-sm font-semibold mb-2"
                >
                  Profile Picture
                </label>

                <input
                  id="teacher-profile-picture"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-sm"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                  }
                />

                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG or WebP. Maximum size: 5 MB.
                </p>
              </div>

              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2 break-all w-full">
                  Selected: {selectedFile.name}
                </p>
              )}

              <button
                onClick={uploadAvatar}
                disabled={uploading || !selectedFile}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-semibold"
              >
                {uploading ? "Uploading..." : "Upload Picture"}
              </button>
            </div>

            <hr className="my-6" />

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Email</p>

                <p className="text-slate-900 mt-1 break-all">
                  {profile.email || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Role</p>

                <p className="text-slate-900 mt-1">
                  {profile.role || "TEACHER"}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Account Status
                </p>

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
                    ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Professional Information
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    First Name
                  </label>

                  <input
                    type="text"
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
                    type="text"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    disabled
                    className="border border-gray-200 bg-gray-100 text-gray-500 rounded-xl p-3 w-full cursor-not-allowed"
                    value={profile.email || ""}
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Your email address cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    School / Institution
                  </label>

                  <input
                    type="text"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.school}
                    onChange={(event) =>
                      updateField("school", event.target.value)
                    }
                    placeholder="Enter your school"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Teaching Level
                  </label>

                  <input
                    type="text"
                    className="border border-gray-300 rounded-xl p-3 w-full"
                    value={profile.classLevel}
                    onChange={(event) =>
                      updateField("classLevel", event.target.value)
                    }
                    placeholder="e.g. JSS, SSS, WAEC, JAMB"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Professional Biography
                </label>

                <textarea
                  rows={6}
                  className="border border-gray-300 rounded-xl p-3 w-full"
                  value={profile.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  placeholder="Tell students about yourself, your teaching experience and areas of expertise."
                />
              </div>

              <button
                onClick={updateProfile}
                disabled={saving}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
