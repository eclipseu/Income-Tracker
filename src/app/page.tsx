import LandingContent from "@/components/landing/LandingContent";
import { redirectIfAuthenticated } from "@/lib/supabase/redirects";

export default async function Home() {
  await redirectIfAuthenticated();

  return <LandingContent />;
}
