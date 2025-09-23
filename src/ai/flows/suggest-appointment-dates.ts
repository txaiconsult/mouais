'use server';

/**
 * @fileOverview An AI agent for suggesting appointment dates based on a start date and user preferences.
 *
 * - suggestAppointmentDates - A function that handles the appointment date suggestion process.
 * - SuggestAppointmentDatesInput - The input type for the suggestAppointmentDates function.
 * - SuggestAppointmentDatesOutput - The return type for the suggestAppointmentDates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {format, addDays, isWeekend, nextMonday, getDay, add, isSameDay} from 'date-fns';

const SuggestAppointmentDatesInputSchema = z.object({
  startDate: z
    .string()
    .describe('The starting date (J0) for the appointment sequence in ISO format.'),
  patientPreferences: z
    .string()
    .optional()
    .describe('Optional patient preferences regarding appointment dates (e.g., "not on Tuesdays", "only in the morning").'),
  patientName: z.string().describe('The name of the patient.'),
});
export type SuggestAppointmentDatesInput = z.infer<typeof SuggestAppointmentDatesInputSchema>;

const SuggestAppointmentDatesOutputSchema = z.object({
  appointmentDates: z.array(
    z.object({
      date: z.string().describe('The suggested appointment date in ISO format.'),
      description: z.string().describe('A description of the appointment (e.g., "Appointment #1 (J+7)").'),
    })
  ).describe('An array of suggested appointment dates.'),
});
export type SuggestAppointmentDatesOutput = z.infer<typeof SuggestAppointmentDatesOutputSchema>;

export async function suggestAppointmentDates(input: SuggestAppointmentDatesInput): Promise<SuggestAppointmentDatesOutput> {
  return suggestAppointmentDatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAppointmentDatesPrompt',
  input: {schema: SuggestAppointmentDatesInputSchema},
  output: {schema: SuggestAppointmentDatesOutputSchema},
  prompt: `You are an AI assistant specialized in scheduling follow-up appointments for patients.

You will receive a starting date (J0) and patient preferences. Your task is to suggest four appointment dates based on the following sequence: J+7, J+14, J+21, and J+30.

You must adhere to the following rules:

1.  Calculate the dates exactly 7, 14, 21, and 30 days after the provided starting date (J0).
2.  Consider the patient preferences. If a calculated date conflicts with the preferences, adjust the date to the next available valid day.
3.  If the preferences indicate "not on weekends", ensure that the suggested dates never fall on a Saturday or Sunday. If a calculated date falls on a weekend, move it to the next Monday.
4.  The patient name is {{{patientName}}}.

Here's the input information:

Starting Date (J0): {{{startDate}}}
Patient Preferences: {{{patientPreferences}}}

Return the suggested appointment dates in the following JSON format:

{{$instructions}}
`,
});

const suggestAppointmentDatesFlow = ai.defineFlow(
  {
    name: 'suggestAppointmentDatesFlow',
    inputSchema: SuggestAppointmentDatesInputSchema,
    outputSchema: SuggestAppointmentDatesOutputSchema,
  },
  async input => {
    const startDate = new Date(input.startDate);
    const appointmentDates = [];
    const intervals = [7, 14, 21, 30];
    const descriptions = [
        `Appointment #1 (J+7)`,
        `Appointment #2 (J+14)`,
        `Appointment #3 (J+21)`,
        `Appointment #4 (J+30 & Facturation)`
    ];
    
    const preferences = input.patientPreferences?.toLowerCase() || '';
    const avoidTuesday = preferences.includes('not on mardi');
    const avoidWednesday = preferences.includes('not on mercredi');
    const avoidThursday = preferences.includes('not on jeudi');
    const avoidFriday = preferences.includes('not on vendredi');
    const avoidSaturday = preferences.includes('not on samedi');

    const isDateInvalid = (date: Date): boolean => {
      const day = getDay(date); // Sunday is 0, Monday is 1, ..., Saturday is 6
      
      if (isWeekend(date)) return true; // Always avoid weekends
      if (day === 2 && avoidTuesday) return true;
      if (day === 3 && avoidWednesday) return true;
      if (day === 4 && avoidThursday) return true;
      if (day === 5 && avoidFriday) return true;
      if (day === 6 && avoidSaturday) return true;
      
      return false;
    };

    let lastDate = startDate;

    for (let i = 0; i < intervals.length; i++) {
      let targetDate = addDays(startDate, intervals[i]);
      
      while (isDateInvalid(targetDate)) {
        targetDate = addDays(targetDate, 1);
      }

      appointmentDates.push({
        date: format(targetDate, 'yyyy-MM-dd'),
        description: descriptions[i],
      });
      lastDate = targetDate;
    }

    return {appointmentDates};
  }
);
