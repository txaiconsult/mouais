import SchedulerPage from "@/components/scheduler-page";

// Making this component async allows it to await the async SchedulerPage
export default async function Home() {
  // Artificial delay to ensure the loading animation is visible
  await new Promise(resolve => setTimeout(resolve, 2000));
  return <SchedulerPage />;
}
