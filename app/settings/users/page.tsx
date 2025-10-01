"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";

type SavedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  companyName: string;
};

export default function UsersSettingsPage() {
  const [users, setUsers] = React.useState<SavedUser[]>([]);

  const loadUsers = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("fhs_users");
      const data = raw ? JSON.parse(raw) : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fhs_users") loadUsers();
    };
    const onFocus = () => loadUsers();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadUsers]);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Users</h2>
        <div className="bg-white border rounded p-6">
          {users.length === 0 ? (
            <div className="text-sm text-gray-700">No users yet. Save from Account Info.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Telephone</th>
                    <th className="py-2 pr-4">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{u.firstName} {u.lastName}</td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4">{u.telephone}</td>
                      <td className="py-2 pr-4">{u.companyName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  )
}


