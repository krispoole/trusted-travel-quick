"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
            <span>Email Notifications</span>
            <span className="text-sm text-gray-500">Receive notifications via email</span>
          </Label>
          <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="in-app-notifications" className="flex flex-col space-y-1">
            <span>In-App Notifications</span>
            <span className="text-sm text-gray-500">Receive notifications within the app</span>
          </Label>
          <Switch id="in-app-notifications" checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
        </div>
      </CardContent>
    </Card>
  )
}

