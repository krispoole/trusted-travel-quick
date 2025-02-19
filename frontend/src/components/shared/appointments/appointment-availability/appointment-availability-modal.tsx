'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { AppointmentAvailabilityModalProps } from "@/lib/types";

export function AppointmentAvailabilityModal({
  isOpen,
  onClose,
  appointments,
  locationName,
}: AppointmentAvailabilityModalProps) {
  const sortedAppointments = [...appointments].sort((a, b) => 
    parseISO(a.startTimestamp).getTime() - parseISO(b.startTimestamp).getTime()
  );
  
  const displayedAppointments = sortedAppointments.slice(0, 3);
  const remainingCount = Math.max(0, appointments.length - 3);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appointments Available at {locationName}</DialogTitle>
          <DialogDescription>
            Select an appointment time to schedule your interview
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {displayedAppointments.map((apt) => (
            <Button
              key={apt.startTimestamp}
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => {
                window.open(`https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?locationId=${apt.locationId}&timestamp=${apt.startTimestamp}`, '_blank');
                onClose();
              }}
            >
              {format(parseISO(apt.startTimestamp), "MMMM d, yyyy 'at' h:mm a")}
              <span className="ml-2 text-muted-foreground">
                ({apt.duration} mins)
              </span>
            </Button>
          ))}
          {remainingCount > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              +{remainingCount} more appointments available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}