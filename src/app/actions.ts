'use server';

import type { z } from 'zod';
import { suggestAppointmentDates } from '@/ai/flows/suggest-appointment-dates';
import type { SuggestionResult } from '@/lib/schema';
import { formSchema } from '@/lib/schema';

export async function getSuggestedAppointments(
  data: z.infer<typeof formSchema>
): Promise<SuggestionResult> {
  const validatedFields = formSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    const { patientName, startDate, patientPreferences } = validatedFields.data;
    
    const result = await suggestAppointmentDates({
      patientName,
      startDate: startDate.toISOString(),
      patientPreferences,
    });

    if (result && result.appointmentDates) {
      return {
        success: true,
        appointments: result.appointmentDates,
        patientName,
        startDate: startDate.toISOString(),
      };
    } else {
      return { success: false, message: "L'IA n'a pas pu suggérer de rendez-vous." };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Une erreur est survenue lors de la communication avec l'IA." };
  }
}
