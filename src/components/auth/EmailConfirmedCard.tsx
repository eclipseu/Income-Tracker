"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import {
  BackgroundDecor,
  CardShell,
  FloatingLogo,
} from "@/components/auth/ResetPasswordCard";
import { CheckCircle2, Loader2, PartyPopper } from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type InitStatus = "loading" | "ready" | "error";

export default function EmailConfirmedCard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [initStatus, setInitStatus] = useState<InitStatus>("loading");
  const [initError, setInitError] = useState("");
  const [sessionValid, setSessionValid] = useState(false);
  const [reloadAttempted, setReloadAttempted] = useState(false);

  useEffect(() => {
    let isActive = true;

    const cleanUrl = () => {
      if (typeof window === "undefined") {
        return;
      }
      const { pathname } = window.location;
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, pathname);
      }
    };

    const extractAuthParams = () => {
      if (typeof window === "undefined") {
        return {} as Record<string, string | null | undefined>;
      }

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
      const searchParams = new URLSearchParams(window.location.search);

      const getParam = (key: string) =>
        hashParams.get(key) ?? searchParams.get(key);

      return {
        access_token: getParam("access_token"),
        refresh_token: getParam("refresh_token"),
        code: searchParams.get("code"),
      };
    };

    const initialize = async () => {
      const params = extractAuthParams();
      let errorMessage = "";
      let sessionReady = false;

      try {
        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) {
            errorMessage = error.message;
          } else {
            sessionReady = true;
          }
        }

        if (!sessionReady && params.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            params.code
          );
          if (error) {
            const normalized = error.message.toLowerCase();
            if (
              normalized.includes("code verifier") ||
              normalized.includes("pkce")
            ) {
              errorMessage =
                "We couldn't complete verification. Open the confirmation link on the same device where you signed up, then try again.";
            } else {
              errorMessage = error.message;
            }
          } else if (data.session) {
            sessionReady = true;
          } else {
            errorMessage =
              "We couldn't find an active session. Try signing in manually.";
          }
        }

        if (!sessionReady) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            errorMessage = error.message;
          } else if (data.session) {
            sessionReady = true;
          } else {
            errorMessage =
              "We couldn't find an active session. Try signing in manually.";
          }
        }
      } catch (err) {
        errorMessage =
          err instanceof Error
            ? err.message
            : "Something went wrong while confirming your email.";
      }

      if (!isActive) {
        return;
      }

      if (errorMessage) {
        setInitError(errorMessage);

        if (!reloadAttempted && typeof window !== "undefined") {
          setReloadAttempted(true);
          window.location.replace(window.location.href);
          return;
        }

        setInitStatus("error");
        return;
      }

      setSessionValid(true);
      cleanUrl();
      setInitStatus("ready");
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [supabase, reloadAttempted]);

  useEffect(() => {
    if (!sessionValid || initStatus !== "ready") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [sessionValid, initStatus, router]);

  const renderContent = () => {
    if (initStatus === "loading") {
      return (
        <CardShell>
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-white/70">
              Confirming your email address…
            </p>
          </div>
        </CardShell>
      );
    }

    if (initStatus === "error") {
      return (
        <CardShell>
          <div className="space-y-5 text-center text-white">
            <p className="text-sm text-[#FFD8D8]">{initError}</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0B1B2B] shadow-lg transition hover:-translate-y-0.5"
            >
              Return to sign in
            </button>
          </div>
        </CardShell>
      );
    }

    return (
      <CardShell>
        <header className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <PartyPopper className="h-8 w-8 text-[#B6F4FF]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Email confirmed!
          </h1>
          <p className="text-sm text-white/70">
            Your account is all set. We&apos;ll take you to your dashboard
            momentarily.
          </p>
        </header>

        <div className="mt-8 space-y-4 text-sm text-white/70">
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#17A2B8]/40 bg-[#17A2B8]/10 px-4 py-3 text-center font-medium text-[#B6F4FF]">
            <CheckCircle2 className="h-5 w-5" />
            <span>Authentication session activated</span>
          </div>
          <p className="text-center text-xs uppercase tracking-[0.4em] text-white/50">
            Redirecting you automatically…
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0B1B2B] shadow-lg transition hover:-translate-y-0.5"
          >
            Enter dashboard now
          </button>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Back to sign in
          </button>
        </div>
      </CardShell>
    );
  };

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3ff] px-4 py-16 text-[#0B1B2B] sm:px-6 ${inter.className}`}
    >
      <BackgroundDecor />
      <div className="relative w-full max-w-md">
        <FloatingLogo />
        {renderContent()}
        <footer className="mt-8 text-center text-xs text-white/60">
          <p>
            Need help?{" "}
            <span className="font-semibold text-white">Contact support</span>.
          </p>
        </footer>
      </div>
    </div>
  );
}
