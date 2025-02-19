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
import { useLocations } from "@/lib/stores/locations.store"
import type { Location } from "@/lib/types/common/location.type"
import { DialogTitle } from "@/components/ui/dialog"
import { findMatchingStates, getStateName, sortStatesByRelevance } from "@/lib/states"
import { AppointmentAvailabilityModal } from "@/components/shared/appointments/appointment-availability/appointment-availability-modal"
import { LocationService } from "@/lib/services/location.service"
import { Appointment } from "@/lib/types/common/appointment.type"
export function LocationSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { toast } = useToast()
  const { 
    locations, 
    selectedLocations, 
    addLocation, 
    fetchLocations, 
    loadSelectedLocations,
    isLoading, 
    error 
  } = useLocations()
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  
  const locationService = new LocationService()

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchLocations(),
          loadSelectedLocations()
        ]);
      } catch (error) {
        toast({
          title: "Error loading locations",
          description: error instanceof Error ? error.message : "Failed to load locations",
          variant: "destructive",
        });
      }
    };

    loadData();
    // Empty dependency array since these functions are stable (from zustand)
  }, []); 

  const getFilteredLocations = () => {
    if (!search.trim()) {
      return groupLocationsByState(locations);
    }

    const searchLower = search.toLowerCase();
    const matchingStates = findMatchingStates(search);
    const sortedStates = sortStatesByRelevance([...matchingStates], search);
    
    const filteredLocations = locations.filter(location => {
      const isNotSelected = !selectedLocations.find(sel => sel.id === location.id);
      const matchesSearch = 
        location.name.toLowerCase().includes(searchLower) ||
        location.city.toLowerCase().includes(searchLower) ||
        sortedStates.includes(location.state) ||
        (location.address || '').toLowerCase().includes(searchLower);

      return isNotSelected && matchesSearch;
    });

    // Group by state but maintain the sorted state order
    const grouped = groupLocationsByState(filteredLocations);
    return grouped.sort((a, b) => {
      const aIndex = sortedStates.indexOf(a.stateAbbr);
      const bIndex = sortedStates.indexOf(b.stateAbbr);
      if (aIndex === -1 && bIndex === -1) return a.state.localeCompare(b.state);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const groupLocationsByState = (locs: Location[]) => {
    const grouped = locs.reduce((acc, location) => {
      const state = location.state || 'Other';
      if (!acc[state]) {
        acc[state] = [];
      }
      acc[state].push(location);
      return acc;
    }, {} as Record<string, Location[]>);

    return Object.entries(grouped)
      .map(([stateAbbr, locations]) => ({
        state: getStateName(stateAbbr),
        stateAbbr,
        locations: locations.sort((a, b) => a.city.localeCompare(b.city))
      }))
      .sort((a, b) => a.state.localeCompare(b.state));
  };

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location)
    const response = await locationService.checkAppointmentAvailability(location.id)
    
    if (response.availableSlots.length > 0) {
      setSelectedAppointments(response.availableSlots)
      setIsModalOpen(true)
    } else {
      try {
        await addLocation(location)
        toast({
          title: "Location added",
          description: "Location has been added to your dashboard for monitoring.",
        })
        setOpen(false)
      } catch (error) {
        toast({
          title: "Error adding location",
          description: error instanceof Error ? error.message : "Failed to add location",
          variant: "destructive",
        })
      }
    }
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
          {getFilteredLocations().map(({ state, stateAbbr, locations }) => (
            <CommandGroup key={stateAbbr} heading={state}>
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  onSelect={() => {
                    handleLocationSelect(location)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start py-3"
                >
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {location.city}, {stateAbbr}
                    {location.address && ` - ${location.address}`}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <AppointmentAvailabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointments={selectedAppointments}
        locationName={selectedLocation?.name ?? ''}
      />
    </div>
  )
}
