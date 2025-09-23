"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment } from "@/types/appointment";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Printer, Trash2, Edit, Save, User, CheckCircle, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface AppointmentScheduleProps {
  initialPatientName: string;
  startDate: Date;
  initialAppointments: Appointment[];
  onBack: () => void;
  onPatientNameChange: (name: string) => void;
}

const SHIFT_REGEX = /décalé de (\d+) jour(s?)/;

export default function AppointmentSchedule({ initialPatientName, startDate, initialAppointments, onBack, onPatientNameChange }: AppointmentScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [isNameValidated, setIsNameValidated] = useState(!!initialPatientName);
  const [nameInputError, setNameInputError] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const updateAppointmentDate = (id: string, date: Date | undefined) => {
    if (!date) return;
    setAppointments(
      appointments.map((apt) => (apt.id === id ? { ...apt, date, description: apt.description.replace(SHIFT_REGEX, '').replace(/\(décalé de \d+ jour(s?)\)/, '') } : apt))
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

  const handleValidateName = () => {
    if (patientName.trim().length < 2) {
      setNameInputError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setNameInputError('');
    setIsNameValidated(true);
    onPatientNameChange(patientName);
  };

  const getShiftAmount = (description: string): number | null => {
    const match = description.match(SHIFT_REGEX);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  const cleanDescriptionForDisplay = (description: string): string => {
    return description.replace(SHIFT_REGEX, '').trim();
  }

  const appointmentDates = appointments.map(apt => apt.date);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card className="w-full print-container">
        <CardHeader className="print-bg-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl print-text-black">
                {isNameValidated ? (
                   <>Calendrier pour <span className="text-primary print-text-black">{patientName}</span></>
                ) : (
                  "Étape 2 : Validation"
                )}
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
        <CardContent className="grid md:grid-cols-2 gap-8 print-bg-white">
            <div className="flex flex-col gap-6">
                {!isNameValidated && (
                    <div className="p-4 rounded-lg bg-accent/20 border border-accent/50 no-print">
                    <p className="font-semibold mb-2 text-foreground">Finalisez la planification</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="relative flex-grow w-full">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Nom et prénom du patient" 
                            value={patientName}
                            onChange={(e) => {
                            setPatientName(e.target.value);
                            if (nameInputError) setNameInputError('');
                            }}
                            className="pl-10 w-full"
                        />
                        </div>
                        <Button onClick={handleValidateName} className="w-full sm:w-auto">
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        Valider
                        </Button>
                    </div>
                    {nameInputError && <p className="text-sm font-medium text-destructive mt-2">{nameInputError}</p>}
                    </div>
                )}
                <ul className="space-y-4">
                    <AnimatePresence>
                    {appointments.map((apt) => {
                    const shiftAmount = getShiftAmount(apt.description);
                    const displayDescription = cleanDescriptionForDisplay(apt.description);
                    return (
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
                            <div className="flex items-center gap-4 flex-grow">
                            <div className="flex-shrink-0 bg-primary/20 text-primary rounded-full h-10 w-10 flex items-center justify-center">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-foreground print-text-black capitalize">
                                {format(apt.date, "EEEE d MMMM yyyy", { locale: fr })}
                                </p>
                                <p className="text-sm text-muted-foreground print-text-black">{displayDescription}</p>
                            </div>
                            {shiftAmount !== null && shiftAmount > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1.5 no-print">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                Décalé de {shiftAmount} jour{shiftAmount > 1 ? 's' : ''}
                                </Badge>
                            )}
                            </div>
                            <div className="flex gap-1 no-print">
                            <Button variant="ghost" size="icon" onClick={() => setEditingId(apt.id)}><Edit className="w-4 h-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteAppointment(apt.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        </>
                        )}
                    </motion.li>
                    )})}
                    </AnimatePresence>
                </ul>
            </div>
            <div className="flex items-center justify-center p-4 border-dashed border-2 rounded-lg no-print">
                <Calendar
                    mode="multiple"
                    selected={appointmentDates}
                    month={startDate}
                    locale={fr}
                    className="w-full"
                />
            </div>
        </CardContent>
        <Separator className="my-4 no-print" />
        <CardFooter className="justify-end gap-2 no-print">
          <Button variant="outline" onClick={addAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un RDV
          </Button>
          <Button onClick={handlePrint} disabled={!isNameValidated}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
