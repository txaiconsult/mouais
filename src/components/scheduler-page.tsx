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

type FormData = z.infer<typeof formSchema>;

const LOCAL_STORAGE_KEY = 'active-audition-agenda-form';

export default function SchedulerPage() {
  const [view, setView] = useState<"form" | "schedule">("form");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [initialFormData, setInitialFormData] = useState<Partial<FormData>>({});

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

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <header className="mb-8 flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary"><path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <h1 className="text-3xl font-bold font-headline text-foreground">Active Audition Agenda</h1>
      </header>

      <main className="grid grid-cols-1 lg:gap-8 transition-all duration-500 ease-in-out">
        <div className={`transition-all duration-500 ${view === 'schedule' ? 'lg:hidden' : 'lg:block'}`}>
          <AppointmentForm
            onSuggest={handleSuggest}
            isLoading={isLoading}
            initialData={initialFormData}
          />
        </div>
        
        <div className={`transition-all duration-500 ${view === 'schedule' ? 'lg:col-span-2' : ''}`}>
          {view === "form" && (
            <Card className="hidden lg:flex h-full min-h-[500px] w-full items-center justify-center border-2 border-dashed bg-card/50">
              <CardContent className="text-center text-muted-foreground p-6">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold font-headline">En attente d'informations</h2>
                <p>Veuillez remplir le formulaire pour générer le calendrier des rendez-vous.</p>
              </CardContent>
            </Card>
          )}
          {view === "schedule" && startDate && (
            <AppointmentSchedule
              initialPatientName={patientName}
              startDate={startDate}
              initialAppointments={appointments}
              onBack={handleBack}
              onPatientNameChange={handlePatientNameChange}
            />
          )}
        </div>
      </main>
    </div>
  );
}
