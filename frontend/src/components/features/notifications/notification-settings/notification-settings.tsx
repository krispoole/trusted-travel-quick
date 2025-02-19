"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/services/auth/auth"

export function NotificationSettings() {
  const { user, updateSettings } = useAuth()

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={user.emailNotifications}
              onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
            </div>
            <Switch
              checked={user.inAppNotifications}
              onCheckedChange={(checked) => updateSettings({ inAppNotifications: checked })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notification-email">Notification Email</Label>
          <div className="flex gap-2">
            <Input
              id="notification-email"
              type="email"
              placeholder={user.email}
              value={user.notificationEmail || ""}
              onChange={(e) => updateSettings({ notificationEmail: e.target.value })}
            />
            <Button type="submit" onClick={() => {}}>
              Update
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

