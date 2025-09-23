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
import {format, addDays, isWeekend, getDay} from 'date-fns';

const SuggestAppointmentDatesInputSchema = z.object({
  startDate: z
    .string()
    .describe('The starting date (J0) for the appointment sequence in ISO format.'),
  patientPreferences: z
    .string()
    .optional()
    .describe('Optional patient preferences regarding appointment dates (e.g., "only on tuesdays, thursdays").'),
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

You will receive a starting date (J0) and optional patient preferences for preferred appointment days. Your task is to suggest four appointment dates based on the following sequence: J+7, J+14, J+21, and J+30.

You must adhere to the following rules:

1.  Calculate the dates exactly 7, 14, 21, and 30 days after the provided starting date (J0).
2.  If the patient has specified preferred days (e.g., "only on tuesdays, thursdays"), you MUST adjust each calculated date to the next available preferred day.
3.  If no preferred days are given, ensure that the suggested dates do not fall on a Saturday or Sunday. If a calculated date falls on a weekend, move it to the next Monday.
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
    let preferredDays: number[] | null = null;

    if (preferences.startsWith('only on')) {
      preferredDays = [];
      if (preferences.includes('mardi')) preferredDays.push(2);
      if (preferences.includes('mercredi')) preferredDays.push(3);
      if (preferences.includes('jeudi')) preferredDays.push(4);
      if (preferences.includes('vendredi')) preferredDays.push(5);
      if (preferences.includes('samedi')) preferredDays.push(6);
    }
    
    const isDateInvalid = (date: Date): boolean => {
      const day = getDay(date); // Sunday is 0, Monday is 1, ..., Saturday is 6

      if (preferredDays) {
        // If there are preferred days, any day not in the list is invalid
        return !preferredDays.includes(day);
      }
      
      // If no preferred days, just avoid weekends (Sunday=0, Saturday=6)
      return day === 0 || day === 6;
    };

    for (let i = 0; i < intervals.length; i++) {
      let targetDate = addDays(startDate, intervals[i]);
      
      // Keep adding a day until the date is valid
      while (isDateInvalid(targetDate)) {
        targetDate = addDays(targetDate, 1);
      }

      appointmentDates.push({
        date: format(targetDate, 'yyyy-MM-dd'),
        description: descriptions[i],
      });
    }

    return {appointmentDates};
  }
);
