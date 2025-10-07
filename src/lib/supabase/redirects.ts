import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Redirects authenticated users to the provided destination, preserving
 * anonymous access to marketing/authentication routes for signed-out users.
 */
export async function redirectIfAuthenticated(destination = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(destination);
  }
}
