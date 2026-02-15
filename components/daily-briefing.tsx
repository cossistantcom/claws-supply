"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Facehash } from "facehash";

/* ── Acts ── */

const ACTS = ["wake", "strategy", "results", "tomorrow"] as const;
type Act = (typeof ACTS)[number];

const ACT_DURATIONS: Record<Act, number> = {
  wake: 3800,
  strategy: 4500,
  results: 5500,
  tomorrow: 3800,
};

/* ── Lead data ── */

const LEADS = [
  { name: "Jamie Park", title: "Head of Revenue", company: "Ramp", score: 96 },
  { name: "Sofia Reyes", title: "VP Growth", company: "Deel", score: 91 },
  { name: "Alex Chen", title: "Dir. Sales", company: "Brex", score: 88 },
];

/* ── Animation variants ── */

const screen = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const item = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ── Main component ── */

export function DailyBriefing() {
  const [actIndex, setActIndex] = useState(0);
  const act = ACTS[actIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      setActIndex((i) => (i + 1) % ACTS.length);
    }, ACT_DURATIONS[act]);
    return () => clearTimeout(timer);
  }, [act, actIndex]);

  return (
    <div className="h-full flex flex-col text-white font-mono">
      {/* Status bar */}
      <div className="flex items-center justify-between px-7 pt-[42px] sm:pt-[48px] pb-2 shrink-0">
        <span className="text-[9px] sm:text-[10px] text-white/40 font-pixel tracking-wider">
          7:32
        </span>
        <div className="flex items-center gap-1.5 text-white/30">
          <SignalBars />
          <WifiBars />
          <BatteryIcon />
        </div>
      </div>

      {/* Screen content */}
      <div className="flex-1 overflow-hidden px-4 sm:px-5 pb-10">
        <AnimatePresence mode="wait">
          {act === "wake" && <WakeScreen key="wake" />}
          {act === "strategy" && <StrategyScreen key="strategy" />}
          {act === "results" && <ResultsScreen key="results" />}
          {act === "tomorrow" && <TomorrowScreen key="tomorrow" />}
        </AnimatePresence>
      </div>

      {/* Act indicator dots */}
      <div className="absolute bottom-[18px] sm:bottom-[20px] left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {ACTS.map((a, i) => (
          <div
            key={a}
            className={`w-1 h-1 rounded-full transition-colors duration-300 ${
              i === actIndex ? "bg-white/60" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Status bar icons ── */

function SignalBars() {
  return (
    <svg width="12" height="9" viewBox="0 0 16 10" fill="currentColor">
      <rect x="0" y="7" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="4.5" width="3" height="5.5" rx="0.5" />
      <rect x="9" y="2" width="3" height="8" rx="0.5" />
      <rect x="13.5" y="0" width="2.5" height="10" rx="0.5" />
    </svg>
  );
}

function WifiBars() {
  return (
    <svg width="11" height="9" viewBox="0 0 14 10" fill="currentColor">
      <path d="M7 9.5a1 1 0 100-2 1 1 0 000 2z" />
      <path
        d="M4.05 6.95a4.24 4.24 0 015.9 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M1.7 4.6a7.42 7.42 0 0110.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="18" height="9" viewBox="0 0 22 10" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="18"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" />
      <rect x="19.5" y="3" width="2" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/* ── Act 1: Wake up ── */

function WakeScreen() {
  return (
    <motion.div
      variants={screen}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col pt-2"
    >
      <motion.p
        variants={item}
        className="text-[9px] text-white/25 font-pixel tracking-wider mb-1"
      >
        TUESDAY, FEB 11
      </motion.p>

      <motion.h3
        variants={item}
        className="text-[15px] sm:text-[17px] font-pixel tracking-wider mb-5"
      >
        Good morning.
      </motion.h3>

      <motion.div
        variants={item}
        className="border border-white/[0.08] p-3.5 sm:p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-white/50 animate-pulse-subtle" />
          <span className="text-[8px] sm:text-[9px] font-pixel tracking-wider text-white/35">
            WHILE YOU SLEPT
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] sm:text-[11px] text-white/60">
              Leads found
            </span>
            <span className="text-[12px] sm:text-[13px] font-pixel">12</span>
          </div>
          <div className="h-px bg-white/[0.04]" />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] sm:text-[11px] text-white/60">
              Pipeline added
            </span>
            <span className="text-[12px] sm:text-[13px] font-pixel">
              +$47,200
            </span>
          </div>
          <div className="h-px bg-white/[0.04]" />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] sm:text-[11px] text-white/60">
              High-priority
            </span>
            <span className="text-[12px] sm:text-[13px] font-pixel">3</span>
          </div>
        </div>
      </motion.div>

      <motion.p
        variants={item}
        className="text-[8px] sm:text-[9px] text-white/15 font-pixel tracking-wider mt-3"
      >
        TAP TO VIEW DETAILS
      </motion.p>
    </motion.div>
  );
}

/* ── Act 2: Today's strategy ── */

function StrategyScreen() {
  return (
    <motion.div
      variants={screen}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col pt-2"
    >
      <motion.p
        variants={item}
        className="text-[9px] text-white/25 font-pixel tracking-wider mb-4"
      >
        TODAY&apos;S PLAN
      </motion.p>

      <div className="space-y-3.5">
        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            Targeting Series A fintech companies that are scaling their sales
            org.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            3 target accounts posted Head of Sales roles this week. Moving them
            up.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            Warm path to Ramp&apos;s Head of Revenue through your YC batch.
            Prioritizing.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Running outreach sequences on 8 verified contacts from yesterday.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Act 3: Results ── */

function ResultsScreen() {
  return (
    <motion.div
      variants={screen}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col pt-2"
    >
      <motion.div
        variants={item}
        className="flex items-center justify-between mb-3"
      >
        <span className="text-[9px] text-white/25 font-pixel tracking-wider">
          TODAY&apos;S LEADS
        </span>
        <span className="text-[9px] text-white/40 font-pixel">12 NEW</span>
      </motion.div>

      <div className="space-y-2">
        {LEADS.map((lead) => (
          <motion.div
            key={lead.name}
            variants={item}
            className="border border-white/[0.06] p-2.5 sm:p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                <Facehash
                  name={lead.name}
                  size={26}
                  colors={[
                    "#e8e8e8",
                    "#c0c0c0",
                    "#a0a0a0",
                    "#808080",
                    "#505050",
                  ]}
                  intensity3d="subtle"
                  variant="solid"
                  interactive={false}
                  showInitial
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-pixel tracking-wide">
                    {lead.name}
                  </span>
                  <span className="text-[9px] font-pixel text-white/35">
                    {lead.score}%
                  </span>
                </div>
                <p className="text-[9px] text-white/35 mt-0.5">
                  {lead.title} · {lead.company}
                </p>
                <div className="mt-1.5 h-[2px] bg-white/[0.06]">
                  <motion.div
                    className="h-full bg-white/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${lead.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={item}
        className="mt-auto pt-3 flex items-center justify-between"
      >
        <span className="text-[8px] sm:text-[9px] text-white/25 font-pixel tracking-wider">
          PIPELINE
        </span>
        <span className="text-[11px] sm:text-[12px] font-pixel text-white/70">
          +$47.2K TODAY
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ── Act 4: Tomorrow ── */

function TomorrowScreen() {
  return (
    <motion.div
      variants={screen}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col pt-2"
    >
      <motion.p
        variants={item}
        className="text-[9px] text-white/25 font-pixel tracking-wider mb-4"
      >
        TOMORROW
      </motion.p>

      <div className="space-y-3.5">
        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            Already working on it.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            SaaStr attendee list just dropped. Cross-referencing with your ICP
            now.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed">
            15+ warm leads queued for 8am.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2.5">
          <span className="text-[10px] text-white/20 shrink-0 mt-0.5 font-pixel">
            &gt;
          </span>
          <p className="text-[10px] sm:text-[11px] text-white/30 leading-relaxed">
            Anything you want me to adjust?
            <span className="animate-blink ml-0.5">_</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
