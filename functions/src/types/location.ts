export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  operational: boolean;
  lastChecked: Date | null;
  lastAppointmentFound: Date | null;
}
