"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/types/appointment";
import AppointmentForm from "@/components/appointment-form";
import AppointmentSchedule from "@/components/appointment-schedule";
import { getSuggestedAppointments } from "@/app/actions";
import type { z } from "zod";
import { formSchema } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Logo } from "./logo";
import Loading from "@/app/loading";

type FormData = z.infer<typeof formSchema>;

const LOCAL_STORAGE_KEY = 'active-audition-agenda-form';

export default function SchedulerPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [view, setView] = useState<"form" | "schedule">("form");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [initialFormData, setInitialFormData] = useState<Partial<FormData>>({});

  useEffect(() => {
    // Simulate loading for 2 seconds
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.startDate) {
          parsedData.startDate = new Date(parsedData.startDate);
        }
        setInitialFormData(parsedData);
        // Do not set patientName from localStorage initially to follow the new flow
      }
    } catch (error) {
      console.error("Failed to load form data from localStorage", error);
    }
  }, []);

  const handleSuggest = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Save form data without patient name
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...data, startDate: data.startDate.toISOString() }));

      const result = await getSuggestedAppointments(data);
      if (result.success) {
        // We don't have patient name yet
        setPatientName(''); 
        setStartDate(new Date(result.startDate));
        const suggestedAppointments = result.appointments.map(
          (apt, index) => ({
            id: `${Date.now()}-${index}`,
            date: new Date(apt.date),
            description: apt.description,
          })
        );
        setAppointments(suggestedAppointments);
        setView("schedule");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de suggestion",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur inattendue",
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePatientNameChange = (name: string) => {
    setPatientName(name);
    // Persist patient name along with other form data
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if(savedData) {
      const parsedData = JSON.parse(savedData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...parsedData, patientName: name }));
    }
  };

  const handleBack = () => {
    // When going back, restore the full form data including name if it exists
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
       if (parsedData.startDate) {
          parsedData.startDate = new Date(parsedData.startDate);
        }
      setInitialFormData(parsedData);
    }
    setView("form");
  };

  if (isInitializing) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8 flex flex-col items-center">
      <main className="w-full max-w-5xl flex-grow transition-all duration-500 ease-in-out">
        {view === 'form' ? (
            <AppointmentForm
              onSuggest={handleSuggest}
              isLoading={isLoading}
              initialData={initialFormData}
            />
        ) : startDate && (
            <AppointmentSchedule
              initialPatientName={patientName}
              startDate={startDate}
              initialAppointments={appointments}
              onBack={handleBack}
              onPatientNameChange={handlePatientNameChange}
            />
        )}
      </main>
      <footer className="mt-12 flex flex-col items-center justify-center gap-2">
        <Logo className="w-[150px] h-auto opacity-60" />
        <p className="text-xs text-muted-foreground">Agenda de suivi auditif</p>
      </footer>
    </div>
  );
}
