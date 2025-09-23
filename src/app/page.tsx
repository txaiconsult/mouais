import SchedulerPage from "@/components/scheduler-page";

// Petite fonction pour créer une pause
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function Home() {
  // On attend 2 secondes (2000 millisecondes)
  await sleep(2000);

  return <SchedulerPage />;
}
