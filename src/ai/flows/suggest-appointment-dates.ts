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
import {format, addDays, isWeekend, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday} from 'date-fns';

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
    let appointmentDates = [];
    let currentDate = addDays(startDate, 7);

    for (let i = 1; i <= 4; i++) {
      if (input.patientPreferences?.toLowerCase().includes('not on weekends')) {
        if (isWeekend(currentDate)) {
          currentDate = nextMonday(currentDate);
        }
      }

      // Apply specific day restrictions if the preferences include "not on [day]"
      if (input.patientPreferences?.toLowerCase().includes('not on monday')) {
        if (currentDate.getDay() === 1) {
          currentDate = nextTuesday(currentDate);
        }
      }
      if (input.patientPreferences?.toLowerCase().includes('not on tuesday')) {
        if (currentDate.getDay() === 2) {
          currentDate = nextWednesday(currentDate);
        }
      }
      if (input.patientPreferences?.toLowerCase().includes('not on wednesday')) {
        if (currentDate.getDay() === 3) {
          currentDate = nextThursday(currentDate);
        }
      }
      if (input.patientPreferences?.toLowerCase().includes('not on thursday')) {
        if (currentDate.getDay() === 4) {
          currentDate = nextFriday(currentDate);
        }
      }
      if (input.patientPreferences?.toLowerCase().includes('not on friday')) {
        if (currentDate.getDay() === 5) {
          currentDate = addDays(currentDate, 3); // Skip to Monday
        }
      }

      let description = '';
      switch (i) {
        case 1:
          description = `Appointment #1 (J+7)`;
          break;
        case 2:
          description = `Appointment #2 (J+14)`;
          break;
        case 3:
          description = `Appointment #3 (J+21)`;
          break;
        case 4:
          description = `Appointment #4 (J+30 & Facturation)`;
          break;
      }

      appointmentDates.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        description: description,
      });

      if (i === 1) {
        currentDate = addDays(startDate, 14);
      } else if (i === 2) {
        currentDate = addDays(startDate, 21);
      } else {
        currentDate = addDays(startDate, 30);
      }
    }

    return {appointmentDates};
  }
);
