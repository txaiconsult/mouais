"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Sunrise, Sunset, Clock, RotateCcw, CheckCircle } from "lucide-react";
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
import { AnimatePresence, motion } from "framer-motion";

type FormData = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSuggest: (data: FormData) => void;
  isLoading: boolean;
  initialData?: Partial<FormData>;
}

type TimePreference = 'matin' | 'après-midi' | 'toute la journée';

const daysOfWeek = [
  { name: 'mardi', label: 'Mardi' },
  { name: 'jeudi', label: 'Jeudi' },
  { name: 'vendredi', label: 'Vendredi' },
  { name: 'samedi', label: 'Samedi' },
];

const preferenceLabels: Record<TimePreference, string> = {
  'matin': 'Matin',
  'après-midi': 'Après-midi',
  'toute la journée': 'Journée'
};

export default function AppointmentForm({ onSuggest, isLoading, initialData }: AppointmentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientPreferences: "",
      ...initialData,
    },
  });
  
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, TimePreference>>({});
  const [activeDay, setActiveDay] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.patientPreferences) {
      const prefs = initialData.patientPreferences.replace('only on ', '').split(', ').filter(p => p);
      const newSelectedPrefs: Record<string, TimePreference> = {};
      prefs.forEach(p => {
        const [day, ...timeParts] = p.split(' ');
        const time = timeParts.join(' ') as TimePreference;
        if (day && time) {
          newSelectedPrefs[day] = time;
        }
      });
      setSelectedPreferences(newSelectedPrefs);
      form.reset(initialData);
    } else {
      setSelectedPreferences({});
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handlePreferenceChange = (day: string, time: TimePreference) => {
    const newSelectedPrefs = { ...selectedPreferences };

    if (newSelectedPrefs[day] === time) {
      delete newSelectedPrefs[day];
    } else {
      newSelectedPrefs[day] = time;
    }
    
    setSelectedPreferences(newSelectedPrefs);
    
    const preferencesString = Object.entries(newSelectedPrefs)
      .map(([day, time]) => `${day} ${time}`)
      .join(', ');
      
    form.setValue('patientPreferences', preferencesString ? `only on ${preferencesString}` : '', { shouldValidate: true });
  };
  
  function onSubmit(data: FormData) {
    onSuggest(data);
  }

  const handleResetPreferences = () => {
    setSelectedPreferences({});
    setActiveDay(null);
    form.setValue('patientPreferences', '', { shouldValidate: true });
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
                        disabled={(date) => date < new Date("1900-01-01")}
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
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-xl">Jours de rendez-vous préférés (optionnel)</FormLabel>
                    {Object.keys(selectedPreferences).length > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleResetPreferences} className="text-sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-2">
                      {daysOfWeek.map(day => (
                        <div 
                          key={day.name} 
                          className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card/80 gap-3 cursor-pointer"
                          onClick={() => setActiveDay(activeDay === day.name ? null : day.name)}
                        >
                           <span className="text-xl font-semibold capitalize">{day.label}</span>
                           <AnimatePresence>
                           {activeDay === day.name && (
                             <motion.div 
                                className="flex w-full gap-1"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {day.name !== 'samedi' && (
                                  <Button
                                    type="button"
                                    variant={selectedPreferences[day.name] === 'toute la journée' ? 'default' : 'outline'}
                                    onClick={() => handlePreferenceChange(day.name, 'toute la journée')}
                                    className="h-12 text-xs flex-1 flex flex-col gap-1 items-center justify-center px-1"
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>Journée</span>
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant={selectedPreferences[day.name] === 'matin' ? 'default' : 'outline'}
                                  onClick={() => handlePreferenceChange(day.name, 'matin')}
                                  className="h-12 text-xs flex-1 flex flex-col gap-1 items-center justify-center px-1"
                                >
                                  <Sunrise className="w-4 h-4" />
                                  <span>Matin</span>
                                </Button>
                                {day.name !== 'samedi' && (
                                  <Button
                                    type="button"
                                    variant={selectedPreferences[day.name] === 'après-midi' ? 'default' : 'outline'}
                                    onClick={() => handlePreferenceChange(day.name, 'après-midi')}
                                    className="h-12 text-xs flex-1 flex flex-col gap-1 items-center justify-center px-1"
                                  >
                                    <Sunset className="w-4 h-4" />
                                    <span>A-midi</span>
                                  </Button>
                                )}
                             </motion.div>
                           )}
                           </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AnimatePresence>
              {Object.keys(selectedPreferences).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-lg border bg-muted/50 text-sm"
                >
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Récapitulatif des préférences :
                  </h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                    {Object.entries(selectedPreferences).map(([day, time]) => (
                       <li key={day} className="capitalize">
                        {daysOfWeek.find(d => d.name === day)?.label}: {preferenceLabels[time]}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full h-16 text-2xl font-bold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Génération...
                </>
              ) : (
                "Générer le parcours"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
