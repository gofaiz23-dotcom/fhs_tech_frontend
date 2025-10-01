"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }
    // Mock save
    setMessage("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
        <form className="bg-white border rounded p-6" onSubmit={handleSubmit}>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="text-xs text-gray-600">Current Password*</label>
              <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">New Password*</label>
              <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Confirm New Password*</label>
              <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">Save Settings</button>
          </div>
          {message && (
            <div className="text-xs mt-3 text-gray-700">{message}</div>
          )}
        </form>
      </div>
    </SettingsLayout>
  )
}


