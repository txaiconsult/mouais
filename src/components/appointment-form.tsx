"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Sunrise, Sunset, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formSchema } from "@/lib/schema";
import type { z } from "zod";
import { useEffect, useState } from "react";

type FormData = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSuggest: (data: FormData) => void;
  isLoading: boolean;
  initialData?: Partial<FormData>;
}

const daysOfWeek = [
  { name: 'mardi', label: 'Mardi' },
  { name: 'jeudi', label: 'Jeudi' },
  { name: 'vendredi', label: 'Vendredi' },
  { name: 'samedi', label: 'Samedi' },
];

export default function AppointmentForm({ onSuggest, isLoading, initialData }: AppointmentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientPreferences: "",
      ...initialData,
    },
  });

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      const preferences = initialData.patientPreferences || '';
      if (preferences.startsWith('only on')) {
        const prefs = preferences.replace('only on ', '').split(', ').filter(p => p);
        setSelectedPreferences(prefs);
      } else {
        setSelectedPreferences([]);
      }
    }
  }, [initialData, form]);

  const handlePreferenceToggle = (day: string, time: 'matin' | 'après-midi' | 'toute la journée') => {
    const preference = `${day} ${time}`;
    let newSelectedPrefs = [...selectedPreferences];

    const isAlreadySelected = newSelectedPrefs.includes(preference);

    // First, remove any existing preferences for the same day
    newSelectedPrefs = newSelectedPrefs.filter(p => !p.startsWith(day));

    // If the clicked preference was not the one already selected, add it
    if (!isAlreadySelected) {
      newSelectedPrefs.push(preference);
    }
    
    setSelectedPreferences(newSelectedPrefs);
    const preferencesString = newSelectedPrefs.length > 0 ? `only on ${newSelectedPrefs.join(', ')}` : '';
    form.setValue('patientPreferences', preferencesString, { shouldValidate: true });
  };


  function onSubmit(data: FormData) {
    onSuggest(data);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Étape 1 : Planification</CardTitle>
        <CardDescription className="text-lg">
          Choisissez la date de départ et les jours de rendez-vous souhaités.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-xl">Date de départ des appareils (J0)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-4 text-left font-normal h-14 text-lg",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisissez une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientPreferences"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xl">Jours de rendez-vous préférés (optionnel)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {daysOfWeek.map(day => (
                        <div key={day.name} className="flex flex-col gap-3 p-4 rounded-lg border bg-card/50">
                          <p className="font-medium text-2xl text-center capitalize">{day.label}</p>
                          <div className="grid grid-cols-1 gap-3">
                             <Button
                                type="button"
                                variant={selectedPreferences.includes(`${day.name} toute la journée`) ? 'default' : 'outline'}
                                onClick={() => handlePreferenceToggle(day.name, 'toute la journée')}
                                className="h-14 text-lg flex items-center justify-center gap-3"
                              >
                                <Clock className="w-6 h-6" />
                                <span>Toute la journée</span>
                              </Button>
                            <Button
                              type="button"
                              variant={selectedPreferences.includes(`${day.name} matin`) ? 'default' : 'outline'}
                              onClick={() => handlePreferenceToggle(day.name, 'matin')}
                              className="h-14 text-lg flex items-center justify-center gap-3"
                            >
                              <Sunrise className="w-6 h-6" />
                              <span>Matin</span>
                            </Button>
                            {day.name !== 'samedi' && (
                              <Button
                                type="button"
                                variant={selectedPreferences.includes(`${day.name} après-midi`) ? 'default' : 'outline'}
                                onClick={() => handlePreferenceToggle(day.name, 'après-midi')}
                                className="h-14 text-lg flex items-center justify-center gap-3"
                              >
                                <Sunset className="w-6 h-6" />
                                <span>Après-midi</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-16 text-2xl font-bold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Génération...
                </>
              ) : (
                "Suggérer les rendez-vous"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
