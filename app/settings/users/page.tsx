"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { useUsersStore } from "../../lib/stores/usersStore";

type SavedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  companyName: string;
};

export default function UsersSettingsPage() {
  const { users } = useUsersStore();

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Users</h2>
        <div className="bg-white dark:bg-slate-700 border dark:border-slate-600 rounded p-6">
          {users.length === 0 ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">No users yet. Save from Account Info.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-300 border-b dark:border-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Telephone</th>
                    <th className="py-2 pr-4">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b dark:border-slate-600 last:border-b-0">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{u.firstName} {u.lastName}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{u.email}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{u.telephone}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{u.companyName}</td>
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


