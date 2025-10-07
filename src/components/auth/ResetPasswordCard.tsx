"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type InitStatus = "loading" | "ready" | "error";

export default function ResetPasswordCard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [initStatus, setInitStatus] = useState<InitStatus>("loading");
  const [initError, setInitError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
                "Reset link could not be validated. Open the link on the same device you requested it from, then try again.";
            } else {
              errorMessage = error.message;
            }
          } else if (data.session) {
            sessionReady = true;
          } else {
            errorMessage =
              "Reset link is invalid or has expired. Request a new email.";
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
              "Reset link is invalid or has expired. Request a new email.";
          }
        }
      } catch (err) {
        errorMessage =
          err instanceof Error
            ? err.message
            : "Something went wrong while validating the reset link.";
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

      cleanUrl();
      setInitStatus("ready");
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [supabase, reloadAttempted]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [success, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Password updated! Redirecting to sign in…");
    setPassword("");
    setConfirmPassword("");
  };

  const renderContent = () => {
    if (initStatus === "loading") {
      return (
        <CardShell>
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-white/70">
              Verifying your password reset link…
            </p>
          </div>
        </CardShell>
      );
    }

    if (initStatus === "error") {
      return (
        <CardShell>
          <div className="space-y-4 text-center text-white">
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
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Reset your password
          </h1>
          <p className="text-sm text-white/70">
            Create a new password to secure your BrokeNoMo account.
          </p>
        </header>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <InputField
            id="new-password"
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="new-password"
            required
          />
          <InputField
            id="confirm-new-password"
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            icon={<ShieldCheck className="h-5 w-5" />}
            autoComplete="new-password"
            required
          />

          {error && (
            <div className="rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-4 py-3 text-center text-sm font-medium text-[#FFD8D8]">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#17A2B8]/40 bg-[#17A2B8]/10 px-4 py-3 text-center text-sm font-medium text-[#B6F4FF]">
              <CheckCircle2 className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#17A2B8] via-[#24A0ED] to-[#4361EE] px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_18px_35px_rgba(23,162,184,0.35)] transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating</span>
              </>
            ) : (
              <>
                <span>Save new password</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
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
            Having trouble?{" "}
            <span className="font-semibold text-white">Contact support</span>.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/20 p-[1px] shadow-[0_35px_80px_rgba(11,27,43,0.25)] backdrop-blur-[30px] transition-transform duration-500 hover:-translate-y-1">
      <div className="rounded-[30px] bg-[#0B1B2B]/65 p-8 text-white">
        {children}
      </div>
    </div>
  );
}

export function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-40 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-[#4361EE]/40 via-transparent to-transparent blur-3xl" />
      <div className="absolute -bottom-48 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-[#17A2B8]/40 via-transparent to-transparent blur-3xl" />
      <div className="absolute inset-x-[10%] top-1/3 h-64 rounded-[3rem] bg-white/20 blur-3xl" />
    </div>
  );
}

export function FloatingLogo() {
  return (
    <div className="absolute -top-14 left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-3xl bg-gradient-to-br from-white/80 to-white/10 p-[2px] shadow-[0_24px_60px_rgba(11,27,43,0.15)] backdrop-blur-2xl">
      <div className="flex h-full w-full items-center justify-center rounded-[26px] bg-white/70 backdrop-blur-xl">
        <Image
          src="/logo.jpg"
          alt="BrokoNoMo logo"
          width={48}
          height={48}
          className="opacity-80"
        />
      </div>
    </div>
  );
}

type InputFieldProps = {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
};

function InputField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  required,
}: InputFieldProps) {
  return (
    <label
      htmlFor={id}
      className="block text-left text-xs font-semibold uppercase tracking-[0.4em] text-white/60"
    >
      <span>{label}</span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 transform text-white/60">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition focus:border-[#A5CCF6] focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#4361EE]/20"
        />
      </div>
    </label>
  );
}
