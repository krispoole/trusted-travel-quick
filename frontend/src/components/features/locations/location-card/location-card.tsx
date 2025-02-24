"use client";

import { Card, CardContent, CardHeader } from "@/components/base/card";
import { Button } from "@/components/base/button";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/base/use-toast";
import { useLocations } from "@/lib/stores/locations.store";
import { Timestamp } from "firebase/firestore";
import { Location } from "@/lib/types/common/location.type";

interface LocationCardProps {
  location: Location;
}

export function LocationCard({ location }: LocationCardProps) {
  const { removeLocation } = useLocations();
  const { toast } = useToast();

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Never";
    
    try {
      if (timestamp instanceof Timestamp) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
      }
      
      // Handle serialized timestamp
      const timestampData = timestamp as unknown as { seconds: number; nanoseconds: number };
      if (typeof timestampData.seconds === 'number' && typeof timestampData.nanoseconds === 'number') {
        const date = new Timestamp(timestampData.seconds, timestampData.nanoseconds).toDate();
        return formatDistanceToNow(date, { addSuffix: true });
      }
      
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  // Debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('Location data:', {
      id: location.id,
      name: location.name,
      lastChecked: {
        type: location.lastChecked?.constructor.name,
        value: location.lastChecked,
        isTimestamp: location.lastChecked instanceof Timestamp
      },
      lastAppointmentFound: {
        type: location.lastAppointmentFound?.constructor.name,
        value: location.lastAppointmentFound,
        isTimestamp: location.lastAppointmentFound instanceof Timestamp
      }
    });
  }

  const handleRemove = async () => {
    try {
      await removeLocation(location.id);
      toast({
        title: "Location removed",
        description: `${location.name} has been removed from your selected locations.`,
      });
    } catch (error) {
      toast({
        title: "Error removing location",
        description: error instanceof Error ? error.message : "Failed to remove location",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={handleRemove}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove {location.name}</span>
      </Button>
      <CardHeader>
        <h3 className="text-lg font-semibold">{location.name}</h3>
        <p className="text-sm text-muted-foreground">
          {location.city}, {location.state}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last checked:</span>
            <span>{formatDate(location.lastChecked)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last appointment found:</span>
            <span>{formatDate(location.lastAppointmentFound)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}