"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import {
  CalendarCheck,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const features = [
  {
    title: "Calendar-native tracking",
    description:
      "Glanceable daily insights with colored net badges and quick drill downs.",
    icon: CalendarCheck,
  },
  {
    title: "Smart summaries",
    description:
      "Animated profit analytics keep you on top of your month in seconds.",
    icon: CircleDollarSign,
  },
  {
    title: "Bank-grade security",
    description:
      "Supabase auth and fine-tuned access flows protect every transaction.",
    icon: ShieldCheck,
  },
];

export default function LandingContent() {
  return (
    <div
      className={`${inter.className} relative min-h-screen overflow-hidden bg-[#eef3ff] text-[#0B1B2B]`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#4361EE]/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-36 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-[#17A2B8]/45 via-transparent to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-[4rem] bg-white/20 blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-6 pb-24 pt-20 text-center sm:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#4361EE] shadow-[0_15px_40px_rgba(67,97,238,0.18)] backdrop-blur-xl">
          <Sparkles className="h-4 w-4" />
          <span>Finance, refined</span>
        </span>

        <div className="space-y-6">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-[#0B1B2B] sm:text-5xl md:text-6xl">
            A serene command center for your income and expenses
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[#1B2A38]/70 sm:text-lg">
            Bring clarity to every peso with calendar-native tracking, rich
            summaries, and a delightful interface inspired by Apple and Material
            You.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/login?mode=signup"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#17A2B8] via-[#24A0ED] to-[#4361EE] px-8 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_20px_45px_rgba(23,162,184,0.28)] transition hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/30 px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#0B1B2B] shadow-[0_12px_30px_rgba(11,27,43,0.12)] backdrop-blur-xl transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8]"
          >
            Sign in
          </Link>
        </div>

        <div className="relative w-full max-w-5xl">
          <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-white/60 via-white/20 to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-[36px] border border-white/50 bg-white/30 p-[1px] shadow-[0_35px_90px_rgba(11,27,43,0.25)] backdrop-blur-2xl">
            <div className="grid gap-8 rounded-[32px] bg-[#0B1B2B]/75 p-8 text-left text-white sm:grid-cols-2 sm:items-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Live insights at a glance
                </h2>
                <p className="text-sm text-white/70">
                  See daily cash flow, monthly profit, and transaction
                  highlights inside a beautifully organized dashboard that feels
                  effortless.
                </p>
                <ul className="space-y-3 text-sm text-white/80">
                  <li>
                    • Animated monthly profit pulses so you never miss a trend.
                  </li>
                  <li>
                    • Slide-over transaction review with elegant confirmations.
                  </li>
                  <li>• Export-ready data for your accountant in one click.</li>
                </ul>
              </div>
              <div className="relative rounded-[30px] border border-white/20 bg-white/10 p-6 shadow-[0_25px_60px_rgba(15,33,51,0.45)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/55">
                      October 2025
                    </p>
                    <p className="mt-2 text-lg font-semibold">Net Profit</p>
                    <p className="text-3xl font-semibold text-[#A5CCF6]">
                      ₱128,450
                    </p>
                  </div>
                  <div className="rounded-3xl bg-[#17A2B8]/15 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#93E9F6]">
                      MoM Growth
                    </p>
                    <p className="text-xl font-semibold text-white">+18%</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs text-white/70">
                  {"SMTWTFS".split("").map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                  {[...Array(28)].map((_, index) => (
                    <div
                      key={index}
                      className="flex aspect-square items-center justify-center rounded-2xl bg-white/10 text-white/80"
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group overflow-hidden rounded-[28px] border border-white/40 bg-white/35 p-[1px] shadow-[0_25px_60px_rgba(11,27,43,0.18)] backdrop-blur-2xl transition hover:-translate-y-1"
            >
              <div className="rounded-[26px] bg-white/90 p-6 text-left text-[#0B1B2B]">
                <feature.icon className="h-10 w-10 text-[#17A2B8] transition group-hover:scale-110" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-[#1B2A38]/65">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
