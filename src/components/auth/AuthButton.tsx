"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className }: AuthButtonProps = {}) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className={
        className ??
        "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      }
    >
      Sign Out
    </button>
  );
}
