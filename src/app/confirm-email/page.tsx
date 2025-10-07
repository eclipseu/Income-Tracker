import EmailConfirmedCard from "@/components/auth/EmailConfirmedCard";
import { redirectIfAuthenticated } from "@/lib/supabase/redirects";

export default async function ConfirmEmailPage() {
  await redirectIfAuthenticated();

  return <EmailConfirmedCard />;
}
