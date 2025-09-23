import { z } from 'zod';

export const formSchema = z.object({
  patientName: z.string({ required_error: 'Le nom du patient est requis.'}).min(2, 'Le nom du patient doit contenir au moins 2 caractères.'),
  startDate: z.date({ required_error: 'La date de départ est requise.' }),
  patientPreferences: z.string().optional(),
});

export type SuggestionResult = {
  success: true;
  appointments: { date: string; description: string }[];
  patientName: string;
  startDate: string;
} | {
  success: false;
  message: string;
};
