"use client"

import { useState } from "react"
import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useToast } from "@/components/ui/use-toast"
import { cities, useLocations } from "@/lib/locations"

export function LocationSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { toast } = useToast()
  const { locations, addLocation } = useLocations()

  // Handle browser geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation is not supported",
        description: "Your browser does not support location services",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast({
          title: "Location found",
          description: "Your location has been detected",
        })
        // Here you would typically reverse geocode the coordinates
        // For now we'll just show a success message
      },
      (error) => {
        toast({
          title: "Error getting location",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const filteredCities = cities.filter(
    (city) => city.name.toLowerCase().includes(search.toLowerCase()) && !locations.find((loc) => loc.id === city.id),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 justify-start text-muted-foreground" onClick={() => setOpen(true)}>
          <Search className="mr-2 h-4 w-4" />
          Search for a location...
        </Button>
        <Button variant="outline" size="icon" onClick={handleGetLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search cities..." value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No cities found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            {filteredCities.map((city) => (
              <CommandItem
                key={city.id}
                onSelect={() => {
                  addLocation(city)
                  setOpen(false)
                }}
              >
                {city.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}

