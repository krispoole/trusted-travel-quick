"use client";

import { Card, CardContent, CardHeader } from "@/components/base/card";
import { Button } from "@/components/base/button";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/base/use-toast";
import { useLocations } from "@/lib/stores/locations.store";
import { Timestamp } from "firebase/firestore";

interface ActiveLocation {
  id: string | number;
  name: string;
  city: string;
  state: string;
  lastChecked: Timestamp | null;
  lastAppointmentFound: Timestamp | null;
  subscriberCount: number;
  subscribers: string[];
}

interface LocationCardProps {
  location: ActiveLocation;
}

export function LocationCard({ location }: LocationCardProps) {
  const { removeLocation } = useLocations();
  const { toast } = useToast();

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "Never";

    try {
      let date: Date;

      // Case 1: Firebase Timestamp instance
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      }
      // Case 2: Serialized timestamp object
      else if (
        typeof timestamp === 'object' && 
        timestamp !== null &&
        'seconds' in timestamp &&
        'nanoseconds' in timestamp
      ) {
        // Ensure we're working with numbers
        const seconds = typeof (timestamp as {seconds: number | string}).seconds === 'number'
          ? (timestamp as {seconds: number}).seconds
          : parseInt((timestamp as {seconds: string}).seconds);
        const nanoseconds = typeof (timestamp as {nanoseconds: number | string}).nanoseconds === 'number'
          ? (timestamp as {nanoseconds: number}).nanoseconds
          : parseInt((timestamp as {nanoseconds: string}).nanoseconds);

        if (isNaN(seconds) || isNaN(nanoseconds)) {
          console.error("Invalid timestamp values:", timestamp);
          return "Invalid date";
        }

        date = new Timestamp(seconds, nanoseconds).toDate();
      }
      // Case 3: Unknown format
      else {
        console.error("Unexpected timestamp format:", timestamp);
        return "Invalid date";
      }

      // Validate the resulting date
      if (isNaN(date.getTime())) {
        console.error("Invalid date object created:", date);
        return "Invalid date";
      }

      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting timestamp:", e, "Value:", timestamp);
      return "Error";
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
      await removeLocation(Number(location.id));
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subscribers:</span>
            <span>{location.subscriberCount || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}