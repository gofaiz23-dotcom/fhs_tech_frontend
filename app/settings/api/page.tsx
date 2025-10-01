import SettingsLayout from "../_components/SettingsLayout";

export default function ApiSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">API</h2>
        <div className="bg-white border rounded p-6">
          <div className="text-sm text-gray-700">This is the API settings page.</div>
        </div>
      </div>
    </SettingsLayout>
  )
}


