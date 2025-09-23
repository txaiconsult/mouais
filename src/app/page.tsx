import SchedulerPage from "@/components/scheduler-page";

// Making this component async allows it to await the async SchedulerPage
export default async function Home() {
  return <SchedulerPage />;
}
