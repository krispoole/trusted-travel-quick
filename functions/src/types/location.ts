export interface Location {
  id: number;
  name: string;
  city: string;
  state: string;
  subscribers: string[];
  subscriberCount: number;
  lastChecked: Date | null;
  lastAppointmentFound: Date | null;
}
