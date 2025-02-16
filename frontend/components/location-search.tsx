"use client"

import { useState, useEffect } from "react"
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
import { useLocations } from "@/lib/locations"
import { DialogTitle } from "@/components/ui/dialog"

export function LocationSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { toast } = useToast()
  const { locations, selectedLocations, addLocation, fetchLocations, isLoading, error } = useLocations()

  // Fetch locations when component mounts
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const filteredLocations = locations.filter(location => {
    const searchLower = search.toLowerCase()
    const isNotSelected = !selectedLocations.find(sel => sel.id === location.id)
    
    return isNotSelected && (
      location.name.toLowerCase().includes(searchLower) ||
      location.city.toLowerCase().includes(searchLower) ||
      location.state.toLowerCase().includes(searchLower) ||
      location.address.toLowerCase().includes(searchLower)
    )
  })

  if (error) {
    toast({
      title: "Error loading locations",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 justify-start text-muted-foreground" 
          onClick={() => setOpen(true)}
          disabled={isLoading}
        >
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? "Loading locations..." : "Search by city, state, or location name..."}
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search locations</DialogTitle>
        <CommandInput 
          placeholder="Search locations..." 
          value={search} 
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No locations found.</CommandEmpty>
          <CommandGroup heading="Available Locations">
            {filteredLocations.map((location) => (
              <CommandItem
                key={location.id}
                onSelect={() => {
                  addLocation(location)
                  setOpen(false)
                }}
                className="flex flex-col items-start py-3"
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">
                  {location.city}, {location.state}
                  {location.address && ` - ${location.address}`}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}

