import { z } from 'zod';

// Schema for the initial suggestion form (Step 1)
export const formSchema = z.object({
  patientName: z.string().min(2, { message: 'Le nom du patient doit contenir au moins 2 caractères.' }),
  startDate: z.date({ required_error: 'La date de départ est requise.' }),
  patientPreferences: z.string().optional(),
});

// This is not a form schema anymore, but defines the result from the server action
export type SuggestionResult = {
  success: true;
  appointments: { date: string; description: string }[];
  startDate: string;
} | {
  success: false;
  message: string;
};

// Defines the structure for a saved patient record
export interface SavedPatientData {
  patientName: string;
  startDate: string; // ISO string
  patientPreferences?: string;
  appointments: {
    id: string;
    date: string; // ISO string
    description: string;
  }[];
}
