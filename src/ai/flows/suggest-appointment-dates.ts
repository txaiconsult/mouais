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
import {format, addDays, isWeekend, getDay, isSameDay} from 'date-fns';

const SuggestAppointmentDatesInputSchema = z.object({
  startDate: z
    .string()
    .describe('The starting date (J0) for the appointment sequence in ISO format.'),
  patientPreferences: z
    .string()
    .optional()
    .describe('Optional patient preferences regarding appointment days and times (e.g., "only on mardi matin, jeudi après-midi, vendredi toute la journée").'),
  patientName: z.string().describe('The name of the patient.'),
});
export type SuggestAppointmentDatesInput = z.infer<typeof SuggestAppointmentDatesInputSchema>;

const SuggestAppointmentDatesOutputSchema = z.object({
  appointmentDates: z.array(
    z.object({
      date: z.string().describe('The suggested appointment date in ISO format.'),
      description: z.string().describe('A description of the appointment (e.g., "Appointment #1 (J+7) - Matin").'),
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

You will receive a starting date (J0) and optional patient preferences for preferred appointment days and times (matin/après-midi/toute la journée). Your task is to suggest four appointment dates based on the following sequence: J+7, J+14, J+21, and J+30.

You must adhere to the following rules:

1.  Calculate the dates exactly 7, 14, 21, and 30 days after the provided starting date (J0).
2.  If the patient has specified preferred days and times (e.g., "only on mardi matin, jeudi après-midi"), you MUST adjust each calculated date to the next available preferred day.
3.  When a date is adjusted, you must use the time preference (matin, après-midi, or toute la journée) in the appointment description.
4.  If no preferred days are given, ensure that the suggested dates do not fall on a Saturday or Sunday. If a calculated date falls on a weekend, move it to the next Monday.
5.  If a date has been adjusted, reflect this in the description (e.g., by indicating the base interval like "base J+7").
6.  The patient name is {{{patientName}}}.

Here's the input information:

Starting Date (J0): {{{startDate}}}
Patient Preferences: {{{patientPreferences}}}

Return the suggested appointment dates in the following JSON format:

{{$instructions}}
`,
});

const dayNameToIndex: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

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
    const baseDescriptions = [
        `Rendez-vous #1`,
        `Rendez-vous #2`,
        `Rendez-vous #3`,
        `Rendez-vous #4 & Facturation`
    ];
    
    const preferences = input.patientPreferences?.toLowerCase() || '';
    let preferredSlots: {day: number, time: 'matin' | 'après-midi' | 'toute la journée'}[] | null = null;

    if (preferences.startsWith('only on')) {
      preferredSlots = [];
      const prefParts = preferences.replace('only on ', '').split(', ');
      prefParts.forEach(part => {
        const parts = part.split(' ');
        const dayName = parts[0];
        const time = parts.slice(1).join(' ') as 'matin' | 'après-midi' | 'toute la journée';
        if (dayName in dayNameToIndex && (time === 'matin' || time === 'après-midi' || time === 'toute la journée')) {
          preferredSlots!.push({ day: dayNameToIndex[dayName], time });
        }
      });
    }

    const isDateInvalid = (date: Date): boolean => {
      const day = getDay(date);
      if (preferredSlots && preferredSlots.length > 0) {
        return !preferredSlots.some(slot => slot.day === day);
      }
      return isWeekend(date);
    };

    for (let i = 0; i < intervals.length; i++) {
      const initialTargetDate = addDays(startDate, intervals[i]);
      let targetDate = new Date(initialTargetDate);
      
      while (isDateInvalid(targetDate)) {
        targetDate = addDays(targetDate, 1);
      }

      const wasAdjusted = !isSameDay(initialTargetDate, targetDate);
      const intervalLabel = wasAdjusted ? `(base J+${intervals[i]})` : `(J+${intervals[i]})`;
      let description = `${baseDescriptions[i]} ${intervalLabel}`;
      
      if (preferredSlots && preferredSlots.length > 0) {
        const day = getDay(targetDate);
        const slotsForDay = preferredSlots.filter(slot => slot.day === day);
        if (slotsForDay.length > 0) {
          // Priority: all day > morning > afternoon
          const chosenSlot = slotsForDay.find(s => s.time === 'toute la journée') || slotsForDay.find(s => s.time === 'matin') || slotsForDay[0];
          const timeCapitalized = chosenSlot.time.charAt(0).toUpperCase() + chosenSlot.time.slice(1).replace(' la ', ' la ');
          description += ` - ${timeCapitalized}`;
        }
      }

      appointmentDates.push({
        date: format(targetDate, 'yyyy-MM-dd'),
        description: description,
      });
    }

    return {appointmentDates};
  }
);
