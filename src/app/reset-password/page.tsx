import ResetPasswordCard from "@/components/auth/ResetPasswordCard";
import { redirectIfAuthenticated } from "@/lib/supabase/redirects";

export default async function ResetPasswordPage() {
  await redirectIfAuthenticated();

  return <ResetPasswordCard />;
}
