"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Bell, LogOut } from "lucide-react"
import { useAuth } from "../../lib/auth/auth-context"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { NotificationSettings } from "../../components/notification-settings"
import { Toast, useToast } from "../../components/ui/toast"
// Mock location data
const locations = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const { toast, showToast, closeToast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    if (search) {
      const filtered = locations.filter((location) => location.toLowerCase().includes(search.toLowerCase()))
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [search])

  const handleAddLocation = (location: string) => {
    if (!selectedLocations.includes(location)) {
      setSelectedLocations([...selectedLocations, location])
      showToast(`Added ${location} to your locations`, "success")
    }
    setSearch("")
    setSuggestions([])
  }

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(selectedLocations.filter((l) => l !== location))
    showToast(`Removed ${location} from your locations`, "info")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search for a location"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
                      {suggestions.map((location) => (
                        <li
                          key={location}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleAddLocation(location)}
                        >
                          {location}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLocations.map((location) => (
                    <Badge key={location} variant="secondary" className="text-sm">
                      {location}
                      <button onClick={() => handleRemoveLocation(location)} className="ml-2 focus:outline-none">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <NotificationSettings />
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  )
}

