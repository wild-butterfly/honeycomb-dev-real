import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import styles from "./ProfileSettings.module.css";

interface ProfileData {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  job_title?: string;
  department?: string;
  address?: string;
  timezone?: string;
  language?: string;
  role?: string;
}

const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const { companyId } = useCompany();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    job_title: "",
    department: "",
    address: "",
    timezone: "UTC",
    language: "en",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load profile data - reload when company context changes
  useEffect(() => {
    loadProfile();
  }, [companyId]);

  const loadProfile = async () => {
    // Always show loading state when switching companies
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setProfile(null);
        return;
      }

      const data = await api.get<ProfileData>("/me/profile");

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          job_title: data.job_title || "",
          department: data.department || "",
          address: data.address || "",
          timezone: data.timezone || "UTC",
          language: data.language || "en",
        });
        // Clear any error messages when profile loads successfully
        setMessage(null);
      }
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      // Check if it's a permission error (user in different company context)
      const errorMsg = error?.message || String(error);

      if (
        errorMsg.includes("403") ||
        errorMsg.includes("Profile not available")
      ) {
        setMessage({
          type: "error",
          text: "You can only view your profile in your own company context. Please select your company from the dropdown.",
        });
        setProfile(null);
      } else if (
        errorMsg.includes("404") ||
        errorMsg.includes("No admin user found")
      ) {
        setMessage({
          type: "error",
          text: "No admin user found for this company. The company may not be set up correctly.",
        });
        setProfile(null);
      } else {
        // For other errors, clear profile to show error state
        setMessage({
          type: "error",
          text: "Failed to load profile. Please try again.",
        });
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated" });
        setSaving(false);
        return;
      }

      const data = await api.put<{ profile: ProfileData }>(
        "/me/profile",
        formData,
      );

      if (data?.profile) {
        setProfile(data.profile);
        setMessage({ type: "success", text: "Profile updated successfully!" });

        // Update auth context with new name
        if (user && data.profile.full_name) {
          setUser({
            ...user,
            name: data.profile.full_name,
            avatar: data.profile.avatar,
          });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("403") || errorMsg.includes("Access denied")) {
        setMessage({
          type: "error",
          text: "Cannot edit profile in different company context",
        });
      } else {
        setMessage({ type: "error", text: "Failed to update profile" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      setMessage({
        type: "error",
        text: "Only image files are allowed (JPEG, PNG, GIF, WebP)",
      });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated" });
        setUploadingAvatar(false);
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const data = await api.post<{ profile: ProfileData }>(
        "/me/avatar",
        formData,
      );

      if (data?.profile) {
        setProfile(data.profile);
        setMessage({ type: "success", text: "Avatar updated successfully!" });

        // Update auth context with new avatar
        if (user) {
          setUser({ ...user, avatar: data.profile.avatar });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Failed to upload avatar:", error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("403") || errorMsg.includes("Access denied")) {
        setMessage({
          type: "error",
          text: "Cannot modify avatar in different company context",
        });
      } else {
        setMessage({ type: "error", text: "Failed to upload avatar" });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Are you sure you want to delete your avatar?")) {
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated" });
        setUploadingAvatar(false);
        return;
      }

      const data = await api.delete<{ profile: ProfileData }>("/me/avatar");

      if (data?.profile) {
        setProfile(data.profile);
        setMessage({ type: "success", text: "Avatar deleted successfully!" });

        // Update auth context
        if (user) {
          setUser({ ...user, avatar: undefined });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Failed to delete avatar:", error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("403") || errorMsg.includes("Access denied")) {
        setMessage({
          type: "error",
          text: "Cannot modify avatar in different company context",
        });
      } else {
        setMessage({ type: "error", text: "Failed to delete avatar" });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage(null);

    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: "error", text: "New passwords do not match" });
        setChangingPassword(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({
          type: "error",
          text: "Password must be at least 6 characters",
        });
        setChangingPassword(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated" });
        setChangingPassword(false);
        return;
      }

      await api.put("/me/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("403") || errorMsg.includes("Access denied")) {
        setMessage({
          type: "error",
          text: "Cannot change password in different company context",
        });
      } else if (errorMsg.includes("Current password is incorrect")) {
        setMessage({ type: "error", text: "Current password is incorrect" });
      } else {
        setMessage({ type: "error", text: "Failed to change password" });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  // If profile is null after loading, user is in different company context
  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Profile Settings</h1>
          <p>Manage your profile information and preferences</p>
        </div>
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        <div className={styles.emptyState}>
          <h2>Profile Not Available</h2>
          <p>
            You can only view and edit your profile when you are in your own
            company context. Please switch to your company using the company
            switcher in the navigation bar.
          </p>
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatar
    ? profile.avatar.startsWith("http")
      ? profile.avatar
      : `http://localhost:3001${profile.avatar}`
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Profile Settings</h1>
        <p>Manage your profile information and preferences</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>User Avatar</h2>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {(profile?.full_name || user?.name || profile?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className={styles.avatarOverlay}>
                    <div className={styles.spinner}></div>
                  </div>
                )}
              </div>
              <div className={styles.avatarActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className={styles.changeButton}
                >
                  {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                </button>
                {profile?.avatar && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className={styles.deleteButton}
                  >
                    Delete Avatar
                  </button>
                )}
                <p className={styles.avatarHint}>
                  JPG, PNG, GIF or WebP. Max size 5MB.
                </p>
              </div>
            </div>
          </section>

          {/* Personal Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Enter your full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profile?.email || user?.email || ""}
                  readOnly
                  className={`${styles.input} ${styles.readOnly}`}
                  title="Email cannot be changed"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="job_title">Job Title</label>
                <input
                  type="text"
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g., Project Manager"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="e.g., Operations"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <input
                  type="text"
                  id="role"
                  value={profile?.role || user?.role || ""}
                  readOnly
                  className={`${styles.input} ${styles.readOnly}`}
                  title="Role is managed by administrators"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Work Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Work location or office address"
                rows={3}
              />
            </div>
          </section>

          {/* Preferences */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferences</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Istanbul">Istanbul (TRT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className={styles.actions}>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Password Change Section */}
        <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Change Password</h2>

            <div className={styles.passwordGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className={styles.input}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className={styles.input}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className={styles.input}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={changingPassword}
              className={styles.saveButton}
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
