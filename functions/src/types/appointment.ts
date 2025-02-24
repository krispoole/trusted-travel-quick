export interface AppointmentSlot {
  startTime: Date;
  endTime: Date;
  locationId: number;
}

export interface AppointmentResponse {
  availableSlots: AppointmentSlot[];
  success: boolean;
  message?: string;
}
