"use client";

import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment } from "@/types/appointment";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Printer, Trash2, Edit, Save, User, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Separator } from "./ui/separator";

interface AppointmentScheduleProps {
  initialPatientName: string;
  startDate: Date;
  initialAppointments: Appointment[];
  onBack: () => void;
  onPatientNameChange: (name: string) => void;
}

export default function AppointmentSchedule({ initialPatientName, startDate, initialAppointments, onBack, onPatientNameChange }: AppointmentScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [isNameValidated, setIsNameValidated] = useState(!!initialPatientName);
  const [nameInputError, setNameInputError] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const getBaseDescription = (index: number, total: number): string => {
    if (index === total - 1) {
        return `Rendez-vous #${index + 1} & Facturation`;
    }
    return `Rendez-vous #${index + 1}`;
  }

  const updateAppointmentDate = (id: string, newDate: Date | undefined) => {
    if (!newDate) return;

    const newAppointments = [...appointments];
    const modifiedIndex = newAppointments.findIndex(apt => apt.id === id);

    if (modifiedIndex === -1) return;

    // --- Recalculate from the modified appointment onwards ---
    let previousDate = modifiedIndex > 0 ? newAppointments[modifiedIndex - 1].date : startDate;
    const intervals = [7, 7, 7, 9];

    for (let i = modifiedIndex; i < newAppointments.length; i++) {
        const currentApt = newAppointments[i];
        let currentDate = i === modifiedIndex ? newDate : addDays(previousDate, intervals[i -1]);

        // Retain original time preference if present
        let timePreference = '';
        const descMatch = currentApt.description.match(/-\s(Matin|Après-midi|Toute la journée)$/);
        if (descMatch) {
            timePreference = ` - ${descMatch[1]}`;
        }
        
        const totalDaysFromJ0 = differenceInDays(currentDate, startDate);
        const daysFromPrevious = differenceInDays(currentDate, previousDate);

        let intervalLabel = `(J+${totalDaysFromJ0} au total)`;
        if (i > 0) {
            intervalLabel = `(+${daysFromPrevious} jours) ${intervalLabel}`;
        }

        const baseDesc = getBaseDescription(i, newAppointments.length);
        const newDescription = `${baseDesc} ${intervalLabel}${timePreference}`;
        
        newAppointments[i] = {
            ...currentApt,
            date: currentDate,
            description: newDescription,
        };
        
        previousDate = currentDate;
    }

    setAppointments(newAppointments);
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

  const cleanDescriptionForDisplay = (description: string): [string, string | null] => {
      const shiftMatch = description.match(/\(décalé de \d+ jour(s?)\)/);
      let mainDesc = description.replace(/\(décalé de \d+ jour(s?)\)/, '').trim();
      return [mainDesc, shiftMatch ? shiftMatch[0] : null];
  }


  const appointmentDates = appointments.map(apt => apt.date);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="w-full print-container">
                    <CardHeader className="print-bg-white text-center">
                    <div className="flex justify-end items-start no-print absolute top-4 right-4">
                        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour">
                        <ArrowLeft />
                        </Button>
                    </div>
                    <CardTitle className="font-headline text-3xl print-text-black">
                        {isNameValidated ? (
                            <>Voici le parcours de suivi de <span className="text-primary print-text-black">{patientName}</span> !</>
                        ) : (
                            "Étape 2 : Votre parcours de suivi"
                        )}
                    </CardTitle>
                    <CardDescription className="print-text-black text-lg">
                        Départ des appareils le {format(startDate, "d MMMM yyyy", { locale: fr })}
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="print-bg-white px-4 md:px-6">
                        {!isNameValidated && (
                            <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 no-print mb-8 text-center max-w-2xl mx-auto">
                            <h3 className="font-semibold text-xl mb-3 text-primary">Finalisez pour imprimer</h3>
                            <p className="text-muted-foreground mb-4">Entrez le nom du patient pour personnaliser et valider le calendrier.</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-md mx-auto">
                                <div className="relative flex-grow w-full">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Nom et prénom du patient" 
                                    value={patientName}
                                    onChange={(e) => {
                                    setPatientName(e.target.value);
                                    if (nameInputError) setNameInputError('');
                                    }}
                                    className="pl-10 w-full h-12 text-base"
                                />
                                </div>
                                <Button onClick={handleValidateName} className="w-full sm:w-auto h-12 text-base">
                                <CheckCircle className="mr-2 h-5 w-5"/>
                                Valider
                                </Button>
                            </div>
                            {nameInputError && <p className="text-sm font-medium text-destructive mt-2">{nameInputError}</p>}
                            </div>
                        )}
                        
                        <div className="relative pl-8">
                        {/* Vertical line for the timeline */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border no-print"></div>

                        <ul className="space-y-6">
                            <AnimatePresence>
                            {appointments.map((apt, index) => {
                                const [displayDescription, shiftInfo] = cleanDescriptionForDisplay(apt.description);
                                return (
                                <motion.li
                                    key={apt.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="relative"
                                >
                                    {editingId === apt.id ? (
                                    <div className="p-4 rounded-lg border-2 border-primary bg-card flex flex-col gap-4">
                                        <div className="flex gap-4 items-center">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <Button variant="outline" className="flex-grow justify-start h-12 text-base">
                                                    {format(apt.date, "EEEE d MMMM yyyy", { locale: fr })}
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={apt.date} onSelect={(d) => updateAppointmentDate(apt.id, d)} initialFocus locale={fr}/>
                                                </PopoverContent>
                                            </Popover>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><Save className="h-5 w-5"/></Button>
                                        </div>
                                        <Input
                                            value={apt.description}
                                            onChange={(e) => updateAppointmentDescription(apt.id, e.target.value)}
                                            className="flex-grow h-12 text-base"
                                        />
                                    </div>
                                    ) : (
                                    <div className="p-4 rounded-lg border bg-card/80 flex items-center justify-between gap-4 group">
                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center no-print">
                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-lg text-foreground print-text-black capitalize">
                                            {format(apt.date, "EEEE d MMMM yyyy", { locale: fr })}
                                            </p>
                                            <p className="text-base text-muted-foreground print-text-black">
                                                {displayDescription}
                                                {shiftInfo && <span className="text-xs text-amber-700 ml-2 no-print bg-amber-100 px-1.5 py-0.5 rounded-full">{shiftInfo}</span>}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingId(apt.id)}><Edit className="w-4 h-4"/></Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteAppointment(apt.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                                        </div>
                                    </div>
                                    )}
                                </motion.li>
                                )})}
                            </AnimatePresence>
                        </ul>
                        </div>
                    </CardContent>
                    <Separator className="my-6 no-print" />
                    <CardFooter className="justify-center md:justify-end gap-3 no-print p-6">
                    <Button variant="outline" size="lg" onClick={addAppointment} className="text-base">
                        <Plus className="mr-2 h-5 w-5" />
                        Ajouter un RDV manuel
                    </Button>
                    <Button size="lg" onClick={handlePrint} disabled={!isNameValidated} className="text-base font-bold">
                        <Printer className="mr-2 h-5 w-5" />
                        Imprimer le parcours
                    </Button>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="hidden lg:block no-print">
                 <Card>
                    <CardHeader className="text-center pb-2">
                        <CardTitle>Calendrier</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="multiple"
                            selected={appointmentDates}
                            month={startDate}
                            locale={fr}
                            className="w-full"
                            classNames={{ 
                                caption_label: "text-lg", 
                                day: "h-10 w-10", 
                                head_cell: "w-10",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Calendar View for Print */}
            <div className="hidden print-block mt-8 col-span-3">
                <h3 className="text-center text-xl font-bold mb-4 print-text-black">Calendrier de suivi pour {patientName}</h3>
                <div className="flex justify-center">
                     <Calendar
                        mode="multiple"
                        selected={appointmentDates}
                        month={startDate}
                        locale={fr}
                        classNames={{ 
                            caption_label: "text-lg", 
                            day: "h-10 w-10", 
                            head_cell: "w-10",
                            day_selected: "bg-primary text-primary-foreground",
                        }}
                    />
                </div>
            </div>
        </div>
    </motion.div>
  );
}

    