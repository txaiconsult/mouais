"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, User, Briefcase, Coffee, GraduationCap, Ship, Palmtree } from "lucide-react";
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
  { name: 'mardi', label: 'Mardi', icon: Briefcase },
  { name: 'mercredi', label: 'Mercredi', icon: GraduationCap },
  { name: 'jeudi', label: 'Jeudi', icon: Coffee },
  { name: 'vendredi', label: 'Vendredi', icon: Palmtree },
  { name: 'samedi', label: 'Samedi', icon: Ship },
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

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      const preferences = initialData.patientPreferences || '';
      if (preferences.startsWith('only on')) {
        const days = daysOfWeek.filter(day => preferences.includes(day.name)).map(day => day.name);
        setSelectedDays(days);
      }
    }
  }, [initialData, form]);

  const handleDayToggle = (dayName: string) => {
    const newSelectedDays = selectedDays.includes(dayName)
      ? selectedDays.filter((d) => d !== dayName)
      : [...selectedDays, dayName];
    
    setSelectedDays(newSelectedDays);
    const preferences = newSelectedDays.length > 0 ? `only on ${newSelectedDays.join(', ')}` : '';
    form.setValue('patientPreferences', preferences);
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
                      {daysOfWeek.map(day => {
                        const Icon = day.icon;
                        return (
                        <Button
                          key={day.name}
                          type="button"
                          variant={selectedDays.includes(day.name) ? 'primary' : 'outline'}
                          onClick={() => handleDayToggle(day.name)}
                          className="flex flex-col h-20 gap-2"
                        >
                          <Icon className="w-6 h-6" />
                          <span>{day.label}</span>
                        </Button>
                      )})}
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
