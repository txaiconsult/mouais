
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment } from "@/types/appointment";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, Info, BrainCircuit, Clock } from "lucide-react";
import { motion } from "framer-motion";

const PRINT_STORAGE_KEY = 'schedulewise-print-data';

interface PrintData {
  patientName: string;
  startDate: string;
  appointments: Appointment[];
}

const cleanDescriptionForDisplay = (description: string): [string, string | null] => {
  const shiftMatch = description.match(/\(décalé de [+-]?\d+ jour(s?)\)/);
  let mainDesc = description.replace(/\(décalé de [+-]?\d+ jour(s?)\)/, '').trim();
  return [mainDesc, shiftMatch ? shiftMatch[0] : null];
}

export default function PrintPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(PRINT_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Dates need to be reconstructed
        parsed.appointments = parsed.appointments.map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
        }));
        parsed.startDate = new Date(parsed.startDate);
        setData(parsed);
      } else {
        // If there's no data, redirect to home
        router.push('/');
      }
    } catch (error) {
      console.error("Failed to load print data from localStorage", error);
      router.push('/');
    }
  }, [router]);

  if (!data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Chargement des données...</p>
      </div>
    );
  }

  const { patientName, startDate, appointments } = data;

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8 flex items-center justify-center">
      <motion.div 
        className="w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center relative pt-8">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="no-print">
                <ArrowLeft />
                <span className="sr-only">Retour</span>
              </Button>
            </div>
            <CardTitle className="font-headline text-3xl md:text-4xl">
              Votre parcours de suivi, <span className="text-primary">{patientName}</span>
            </CardTitle>
            <CardDescription className="text-lg md:text-xl">
              Départ des appareils le {format(new Date(startDate), "d MMMM yyyy", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <div className="relative pl-8 mb-12">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border -z-10"></div>
              <ul className="space-y-10">
                {appointments.map((apt) => {
                  const [displayDescription, shiftInfo] = cleanDescriptionForDisplay(apt.description);
                  return (
                    <li key={apt.id} className="relative">
                      <div className="p-4 rounded-lg border bg-card/80 flex items-start gap-4">
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                              <p className="font-semibold text-lg text-foreground capitalize">
                                {format(new Date(apt.date), "EEEE d MMMM yyyy", { locale: fr })}
                              </p>
                              
                          </div>
                           <div className="flex justify-center sm:justify-end">
                                <span className="border-b-2 border-dotted border-current w-[150px]"></span>
                           </div>
                          <p className="text-base text-muted-foreground mt-2">
                            {displayDescription}
                            {shiftInfo && <span className="text-xs text-amber-700 ml-2 bg-amber-100 px-1.5 py-0.5 rounded-full">{shiftInfo}</span>}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                <h3 className="font-headline text-2xl text-primary mb-2 flex items-center gap-2"><BrainCircuit className="w-6 h-6"/>Suivi J+7, J+14, J+21 et J+30 — pour une adaptation réussie</h3>
                <p className="text-muted-foreground mb-6"><strong>Un départ progressif pour une réussite commune :</strong> Nous débutons volontairement avec un réglage en <i>sous-correction</i> pour une phase d'accoutumance en douceur. Le véritable succès vient de notre collaboration : vos retours et nos réglages précis nous permettront d'atteindre ensemble votre cible auditive optimale.</p>

                <ul className="space-y-4 mb-6">
                    <li className="flex items-start gap-3">
                        <div className="font-bold text-primary pt-1">J+7:</div>
                        <p className="text-foreground">premiers retours, confort, prise en main et entretien; légère montée vers la cible.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="font-bold text-primary pt-1">J+14:</div>
                        <p className="text-foreground">affiner clarté et réduction du bruit selon vos situations (travail, famille, téléphone).</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="font-bold text-primary pt-1">J+21:</div>
                        <p className="text-foreground">validations en conditions réelles, équilibre entre les deux oreilles; on s’approche du réglage final.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="font-bold text-primary pt-1">J+30:</div>
                        <p className="text-foreground">bilan, stabilisation et plan de suivi périodique.</p>
                    </li>
                </ul>

                <h4 className="font-headline text-xl text-primary mb-2 flex items-center gap-2"><Info className="w-5 h-5"/>Pourquoi c’est important</h4>
                <p className="text-muted-foreground mb-4">Votre participation active à ces rendez-vous est la clé pour atteindre rapidement un confort d'écoute optimal et une meilleure compréhension au quotidien.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-background/50 p-4 rounded-lg">
                        <p className="font-semibold text-foreground">Porter vos aides chaque jour</p>
                        <p className="text-sm text-muted-foreground">autant que possible.</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                        <p className="font-semibold text-foreground">Noter 2–3 situations à améliorer</p>
                        <p className="text-sm text-muted-foreground">entre chaque visite.</p>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg">
                        <p className="font-semibold text-foreground">En cas d’imprévu, n'hésitez jamais à nous appeler pour reprogrammer</p>
                        <p className="text-sm text-muted-foreground">l’important est de garder la progression.</p>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

    

    