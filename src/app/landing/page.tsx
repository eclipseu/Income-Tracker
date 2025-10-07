import LandingContent from "@/components/landing/LandingContent";
import { redirectIfAuthenticated } from "@/lib/supabase/redirects";

export default async function LandingPage() {
  await redirectIfAuthenticated();

  return <LandingContent />;
}
