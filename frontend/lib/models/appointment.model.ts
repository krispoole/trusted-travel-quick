export interface Appointment {
    locationId: number;
    startTimestamp: string;
    endTimestamp: string;
    active: boolean;
    duration: number;
    remoteInd: boolean;
  }
  
export interface AppointmentAvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: Appointment[];
    locationName: string;
  }