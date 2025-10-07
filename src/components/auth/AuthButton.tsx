"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className }: AuthButtonProps = {}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Failed to sign out:", error.message);
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={
        className ??
        "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:hover:bg-red-600"
      }
    >
      {isSigningOut ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
