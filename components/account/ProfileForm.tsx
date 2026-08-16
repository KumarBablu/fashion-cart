"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string | Date;
};

export default function ProfileForm({ initialProfile }: { initialProfile: UserProfile }) {
  const { success, error } = useToast();
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email);
  const [phone, setPhone] = useState(initialProfile.phone || "");

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (showPasswordChange && newPassword) {
      if (newPassword !== confirmPassword) {
        error("Password Mismatch", "New passwords do not match.");
        return;
      }
      if (newPassword.length < 8) {
        error("Password too short", "Password must be at least 8 characters.");
        return;
      }
      if (!currentPassword) {
        error("Current Password Required", "Please enter your current password to set a new password.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          currentPassword: showPasswordChange ? currentPassword : "",
          newPassword: showPasswordChange ? newPassword : "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success("Profile Updated! ✨", "Your personal details have been saved.");
        if (showPasswordChange && newPassword) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordChange(false);
        }
      } else {
        error("Update Failed", data.error || "Could not update profile.");
      }
    } catch {
      error("Network Error", "Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <div
        className="p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
        }}
      >
        <h3 className="font-display text-lg font-bold">Personal Information</h3>
        <p className="text-xs text-dim -mt-2">Update your basic contact details and preferences.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Member Since
            </label>
            <div
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-dim"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            >
              {new Date(initialProfile.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Password Security Section */}
      <div
        className="p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Password & Security</h3>
            <p className="text-xs text-dim mt-0.5">Manage your account login credentials.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordChange((p) => !p)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {showPasswordChange ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showPasswordChange && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
                style={{
                  backgroundColor: "var(--fc-bg)",
                  borderColor: "var(--fc-border)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
                style={{
                  backgroundColor: "var(--fc-bg)",
                  borderColor: "var(--fc-border)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
                style={{
                  backgroundColor: "var(--fc-bg)",
                  borderColor: "var(--fc-border)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:scale-105 amethyst-btn disabled:opacity-50"
        >
          {saving ? "Saving Changes…" : "Save Profile Details ✨"}
        </button>
      </div>
    </form>
  );
}
