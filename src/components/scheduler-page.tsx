"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/types/appointment";
import AppointmentForm from "@/components/appointment-form";
import AppointmentSchedule from "@/components/appointment-schedule";
import { getSuggestedAppointments } from "@/app/actions";
import type { z } from "zod";
import { formSchema, type SavedPatientData } from "@/lib/schema";
import { Logo } from "./logo";
import Loading from "@/app/loading";

type FormData = z.infer<typeof formSchema>;

const PATIENTS_STORAGE_KEY = 'active-audition-patients';
const LAST_FORM_STORAGE_KEY = 'active-audition-agenda-form';

export default function SchedulerPage() {
  const [isClient, setIsClient] = useState(false);
  const [view, setView] = useState<"form" | "schedule">("form");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [initialFormData, setInitialFormData] = useState<Partial<FormData>>({});
  const [savedPatients, setSavedPatients] = useState<SavedPatientData[]>([]);

  // Load data from localStorage on client-side mount
  useEffect(() => {
    setIsClient(true); 
    try {
      // Load last used form data
      const lastFormData = localStorage.getItem(LAST_FORM_STORAGE_KEY);
      if (lastFormData) {
        const parsedData = JSON.parse(lastFormData);
        if (parsedData.startDate) {
          parsedData.startDate = new Date(parsedData.startDate);
        }
        setInitialFormData(parsedData);
      }

      // Load all saved patients
      loadAllPatients();

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const loadAllPatients = () => {
    const allPatientsData = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (allPatientsData) {
      const patients = JSON.parse(allPatientsData);
      setSavedPatients(Object.values(patients).sort((a: any, b: any) => a.patientName.localeCompare(b.patientName)));
    } else {
      setSavedPatients([]);
    }
  }
  
  const savePatientData = (patientData: SavedPatientData) => {
    try {
      const allPatientsData = localStorage.getItem(PATIENTS_STORAGE_KEY);
      const allPatients = allPatientsData ? JSON.parse(allPatientsData) : {};
      allPatients[patientData.patientName.toLowerCase()] = patientData;
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allPatients));
      
      // Refresh patient list in UI
      loadAllPatients();

    } catch (error) {
      console.error("Failed to save patient data", error);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer les données du patient.",
      });
    }
  }

  const handleDeletePatient = (patientNameToDelete: string) => {
    try {
      const allPatientsData = localStorage.getItem(PATIENTS_STORAGE_KEY);
      const allPatients = allPatientsData ? JSON.parse(allPatientsData) : {};
      delete allPatients[patientNameToDelete.toLowerCase()];
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allPatients));
      
      // Refresh patient list in UI
      loadAllPatients();

      toast({
        title: "Patient supprimé",
        description: `Le patient ${patientNameToDelete} a été supprimé avec succès.`,
      });

    } catch (error) {
      console.error("Failed to delete patient data", error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer les données du patient.",
      });
    }
  }

  const handleSuggest = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Save form data for pre-filling next time
      localStorage.setItem(LAST_FORM_STORAGE_KEY, JSON.stringify({ ...data, startDate: data.startDate.toISOString() }));

      const result = await getSuggestedAppointments(data);
      if (result.success) {
        const suggestedAppointments = result.appointments.map(
          (apt, index) => ({
            id: `${Date.now()}-${index}`,
            date: new Date(apt.date),
            description: apt.description,
          })
        );
        
        // Set state for schedule view
        setPatientName(data.patientName); 
        setStartDate(new Date(result.startDate));
        setAppointments(suggestedAppointments);
        
        // Save the newly generated schedule
        savePatientData({
          ...data,
          startDate: result.startDate,
          appointments: suggestedAppointments.map(a => ({...a, date: a.date.toISOString()}))
        });

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

  const handleLoadPatient = (patientData: SavedPatientData) => {
    // Also save the loaded patient data as the "last used form data" for consistency
    localStorage.setItem(LAST_FORM_STORAGE_KEY, JSON.stringify({
      patientName: patientData.patientName,
      startDate: patientData.startDate,
      patientPreferences: patientData.patientPreferences,
    }));
    
    setPatientName(patientData.patientName);
    setStartDate(new Date(patientData.startDate));
    setAppointments(patientData.appointments.map(apt => ({...apt, date: new Date(apt.date) })));
    setView('schedule');
  };

  const handleScheduleUpdate = (updatedAppointments: Appointment[]) => {
     if (!patientName || !startDate) return;

     setAppointments(updatedAppointments);

     const savedData = localStorage.getItem(LAST_FORM_STORAGE_KEY);
     const lastFormData = savedData ? JSON.parse(savedData) : {};
     
     savePatientData({
       patientName,
       startDate: startDate.toISOString(),
       patientPreferences: lastFormData.patientPreferences || '',
       appointments: updatedAppointments.map(a => ({...a, date: a.date.toISOString()}))
     });
  };

  const handleBack = () => {
    const savedData = localStorage.getItem(LAST_FORM_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
       if (parsedData.startDate) {
          parsedData.startDate = new Date(parsedData.startDate);
        }
      setInitialFormData(parsedData);
    }
    loadAllPatients(); // Refresh patient list when going back to form
    setView("form");
  };

  if (!isClient) {
    return <Loading />; 
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8 flex flex-col items-center">
      <main className="w-full max-w-5xl flex-grow transition-all duration-500 ease-in-out">
        {view === 'form' ? (
            <AppointmentForm
              onSuggest={handleSuggest}
              onLoadPatient={handleLoadPatient}
              onDeletePatient={handleDeletePatient}
              isLoading={isLoading}
              initialData={initialFormData}
              savedPatients={savedPatients}
            />
        ) : startDate && (
            <AppointmentSchedule
              patientName={patientName}
              startDate={startDate}
              initialAppointments={appointments}
              onBack={handleBack}
              onScheduleUpdate={handleScheduleUpdate}
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
