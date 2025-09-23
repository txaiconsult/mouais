"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, User, Sunrise, Sunset } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
  { name: 'mercredi', label: 'Mercredi' },
  { name: 'jeudi', label: 'Jeudi' },
  { name: 'vendredi', label: 'Vendredi' },
  { name: 'samedi', label: 'Samedi' },
];

export default function AppointmentForm({ onSuggest, isLoading, initialData }: AppointmentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
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
      }
    }
  }, [initialData, form]);

  const handlePreferenceToggle = (preference: string) => {
    const newSelectedPrefs = selectedPreferences.includes(preference)
      ? selectedPreferences.filter((p) => p !== preference)
      : [...selectedPreferences, preference];
    
    setSelectedPreferences(newSelectedPrefs);
    const preferencesString = newSelectedPrefs.length > 0 ? `only on ${newSelectedPrefs.join(', ')}` : '';
    form.setValue('patientPreferences', preferencesString);
  };

  function onSubmit(data: FormData) {
    onSuggest(data);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Planification</CardTitle>
        <CardDescription>
          Renseignez les informations pour générer les suggestions de rendez-vous.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du patient</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Ex: Jean Dupont" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de départ des appareils (J0)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisissez une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormLabel>Jours de rendez-vous préférés (optionnel)</FormLabel>
                  <FormControl>
                    <div className="space-y-4 pt-2">
                      {daysOfWeek.map(day => (
                        <div key={day.name} className="flex flex-col gap-2 p-3 rounded-lg border bg-card/50">
                          <p className="font-medium text-center capitalize">{day.label}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={selectedPreferences.includes(`${day.name} matin`) ? 'primary' : 'outline'}
                              onClick={() => handlePreferenceToggle(`${day.name} matin`)}
                              className="flex items-center gap-2"
                            >
                              <Sunrise className="w-4 h-4" />
                              <span>Matin</span>
                            </Button>
                            <Button
                              type="button"
                              variant={selectedPreferences.includes(`${day.name} après-midi`) ? 'primary' : 'outline'}
                              onClick={() => handlePreferenceToggle(`${day.name} après-midi`)}
                              className="flex items-center gap-2"
                            >
                              <Sunset className="w-4 h-4" />
                              <span>Après-midi</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
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
