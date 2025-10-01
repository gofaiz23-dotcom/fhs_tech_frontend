"use client";
import SettingsLayout from "../_components/SettingsLayout";
import { useRouter } from "next/navigation";
import React from "react";

type AccountFormState = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  companyName: string;
  password: string;
};

export default function AccountInfoPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<AccountFormState>({
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    companyName: "",
    password: "",
  });

  const onChange = (key: keyof AccountFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("fhs_users") || "[]");
    const user = {
      id: Date.now(),
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      telephone: form.telephone,
      companyName: form.companyName,
    };
    localStorage.setItem("fhs_users", JSON.stringify([user, ...existing]));
    setForm({ firstName: "", lastName: "", email: "", telephone: "", companyName: "", password: "" });
    router.push("/settings/users");
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Account Info</h2>
        <form className="bg-white border rounded p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">First Name*</label>
              <input value={form.firstName} onChange={onChange("firstName")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Last Name*</label>
              <input value={form.lastName} onChange={onChange("lastName")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Email*</label>
              <input type="email" value={form.email} onChange={onChange("email")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Telephone*</label>
              <input value={form.telephone} onChange={onChange("telephone")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Company Name*</label>
              <input value={form.companyName} onChange={onChange("companyName")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-gray-600 mb-2">To save these settings, please enter your password.</div>
            <input type="password" value={form.password} onChange={onChange("password")} className="w-full border rounded px-3 py-2 text-sm" required />
          </div>

          <div className="mt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">Save Settings</button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}


