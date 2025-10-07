"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Image from "next/image";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type AuthMode = "login" | "signup";

type ModernAuthCardProps = {
  initialMode?: AuthMode;
};

export default function ModernAuthCard({
  initialMode = "login",
}: ModernAuthCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent">(
    "idle"
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode(initialMode);
    setError("");
    setSuccess("");
  }, [initialMode]);

  useEffect(() => {
    if (forgotStatus === "sent") {
      setForgotStatus("idle");
    }
  }, [email, forgotStatus]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
      setLoading(false);
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: origin
        ? {
            emailRedirectTo: `${origin}/confirm-email`,
          }
        : undefined,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "Success! Check your inbox for a confirmation link to activate your account."
    );
    setLoading(false);
    setConfirmPassword("");
  };

  const handleForgotPassword = async () => {
    resetMessages();

    if (!email) {
      setError("Enter your email first to receive a reset link.");
      return;
    }

    setForgotStatus("sending");
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error: forgotError } = await supabase.auth.resetPasswordForEmail(
      email,
      origin
        ? {
            redirectTo: `${origin}/reset-password`,
          }
        : undefined
    );

    if (forgotError) {
      setError(forgotError.message);
      setForgotStatus("idle");
      return;
    }

    setForgotStatus("sent");
    setSuccess("Password reset link sent! Check your inbox.");
  };

  const toggleMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
    setPassword("");
    setConfirmPassword("");
  };

  const renderTitle = mode === "login" ? "Welcome back" : "Create an account";
  const renderDescription =
    mode === "login"
      ? "Track your income effortlessly with your secure dashboard."
      : "Join the community and start managing your income in minutes.";

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3ff] px-4 py-16 text-[#0B1B2B] sm:px-6 ${inter.className}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-[#4361EE]/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-48 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-[#17A2B8]/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-x-[10%] top-1/3 h-64 rounded-[3rem] bg-white/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -top-14 left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-3xl bg-gradient-to-br from-white/80 to-white/10 p-[2px] shadow-[0_24px_60px_rgba(11,27,43,0.15)] backdrop-blur-2xl">
          <div className="flex h-full w-full items-center justify-center rounded-[26px] bg-white/70 backdrop-blur-xl">
            <Image
              src="/logo.jpg"
              alt="BrokeNoMo logo"
              width={48}
              height={48}
              className="opacity-80"
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/20 p-[1px] shadow-[0_35px_80px_rgba(11,27,43,0.25)] backdrop-blur-[30px] transition-transform duration-500 hover:-translate-y-1">
          <div className="rounded-[30px] bg-[#0B1B2B]/65 p-8 text-white">
            <div className="flex justify-center gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              <button
                type="button"
                onClick={() => toggleMode("login")}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  mode === "login"
                    ? "bg-white text-[#0B1B2B] shadow-lg"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleMode("signup")}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  mode === "signup"
                    ? "bg-white text-[#0B1B2B] shadow-lg"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mt-8 space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {renderTitle}
              </h1>
              <p className="text-sm text-white/70">{renderDescription}</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <LabeledInput
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  icon={<Mail className="h-5 w-5" />}
                  required
                />
                <LabeledInput
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  icon={<Lock className="h-5 w-5" />}
                  required
                />
                {mode === "signup" && (
                  <LabeledInput
                    id="confirm-password"
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    required
                  />
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-4 py-3 text-center text-sm font-medium text-[#FFD8D8]">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-[#17A2B8]/40 bg-[#17A2B8]/10 px-4 py-3 text-center text-sm font-medium text-[#B6F4FF]">
                  {success}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-white/70">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#17A2B8] focus:ring-2 focus:ring-[#17A2B8]/50"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-[#B9E9F5] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#B9E9F5]/60"
                  disabled={
                    forgotStatus === "sending" || forgotStatus === "sent"
                  }
                >
                  {forgotStatus === "sending"
                    ? "Sending…"
                    : forgotStatus === "sent"
                    ? "Email sent"
                    : "Forgot password?"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || isPending}
                className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#17A2B8] via-[#24A0ED] to-[#4361EE] px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_18px_35px_rgba(23,162,184,0.35)] transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50"
              >
                {loading || isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{mode === "login" ? "Signing in" : "Creating"}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "login" ? "Sign In" : "Create Account"}
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-white/60">
              <p>
                By continuing, you agree to our
                <span className="mx-1 font-semibold text-white">Terms</span>
                and
                <span className="ml-1 font-semibold text-white">Privacy</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type LabeledInputProps = {
  id: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  required?: boolean;
};

function LabeledInput({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  icon,
  required,
}: LabeledInputProps) {
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
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition focus:border-[#A5CCF6] focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-[#4361EE]/20"
        />
      </div>
    </label>
  );
}
