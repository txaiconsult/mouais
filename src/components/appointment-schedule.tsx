"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment } from "@/types/appointment";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Printer, Trash2, Edit, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Separator } from "./ui/separator";

interface AppointmentScheduleProps {
  patientName: string;
  startDate: Date;
  initialAppointments: Appointment[];
  onBack: () => void;
}

export default function AppointmentSchedule({ patientName, startDate, initialAppointments, onBack }: AppointmentScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const updateAppointmentDate = (id: string, date: Date | undefined) => {
    if (!date) return;
    setAppointments(
      appointments.map((apt) => (apt.id === id ? { ...apt, date } : apt))
    );
  };
  
  const updateAppointmentDescription = (id: string, description: string) => {
    setAppointments(
      appointments.map((apt) => (apt.id === id ? { ...apt, description } : apt))
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== id));
  };

  const addAppointment = () => {
    const newAppointment: Appointment = {
      id: `manual-${Date.now()}`,
      date: new Date(),
      description: "Nouveau rendez-vous",
    };
    setAppointments([...appointments, newAppointment]);
    setEditingId(newAppointment.id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card className="w-full print-container">
        <CardHeader className="print-bg-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl print-text-black">
                Calendrier pour <span className="text-primary print-text-black">{patientName}</span>
              </CardTitle>
              <CardDescription className="print-text-black">
                Départ des appareils le {format(startDate, "EEEE d MMMM yyyy", { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
               <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour">
                 <ArrowLeft />
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="print-bg-white">
          <ul className="space-y-4">
            <AnimatePresence>
            {appointments.map((apt) => (
              <motion.li
                key={apt.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4"
              >
                {editingId === apt.id ? (
                  <>
                    <Popover onOpenChange={(open) => !open && setEditingId(null)}>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="flex-grow justify-start">
                             {format(apt.date, "EEEE d MMMM yyyy", { locale: fr })}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                           <Calendar mode="single" selected={apt.date} onSelect={(d) => updateAppointmentDate(apt.id, d)} initialFocus locale={fr}/>
                        </PopoverContent>
                     </Popover>
                     <Input
                        value={apt.description}
                        onChange={(e) => updateAppointmentDescription(apt.id, e.target.value)}
                        className="flex-grow"
                      />
                     <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><Save className="h-4 w-4"/></Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 bg-primary/20 text-primary rounded-full h-10 w-10 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground print-text-black capitalize">
                          {format(apt.date, "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground print-text-black">{apt.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 no-print">
                       <Button variant="ghost" size="icon" onClick={() => setEditingId(apt.id)}><Edit className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAppointment(apt.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        </CardContent>
        <Separator className="my-4 no-print" />
        <CardFooter className="justify-end gap-2 no-print">
          <Button variant="outline" onClick={addAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un RDV
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
