import { NotificationSettings } from "@/components/features/notifications/notification-settings"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      <NotificationSettings />
    </div>
  )
}

