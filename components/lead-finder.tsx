"use client";

import { useState, useEffect, useCallback } from "react";
import { Facehash } from "facehash";

const LEADS = [
  { name: "Sarah Chen", title: "VP Marketing", company: "AcmeCorp", email: "sarah.c@acmecorp.com", score: 94 },
  { name: "Marcus Johnson", title: "CTO", company: "NovaTech", email: "m.johnson@novatech.io", score: 87 },
  { name: "Elena Rodriguez", title: "Head of Growth", company: "Nebula", email: "elena@nebula.co", score: 91 },
  { name: "David Kim", title: "Dir. Partnerships", company: "TechFlow", email: "d.kim@techflow.com", score: 88 },
  { name: "Aisha Patel", title: "VP Sales", company: "CloudScale", email: "a.patel@cloudscale.io", score: 95 },
  { name: "James O'Brien", title: "CEO", company: "PixelForge", email: "james@pixelforge.dev", score: 82 },
  { name: "Yuki Tanaka", title: "CMO", company: "DataPulse", email: "y.tanaka@datapulse.com", score: 90 },
  { name: "Lisa Müller", title: "Head of BD", company: "NeuralNet", email: "l.muller@neuralnet.ai", score: 93 },
  { name: "Raj Kapoor", title: "VP Engineering", company: "Quantum", email: "raj@quantum.tech", score: 86 },
  { name: "Nina Petrov", title: "Dir. Revenue", company: "SalesBolt", email: "nina.p@salesbolt.com", score: 89 },
  { name: "Tom Andersen", title: "Founder", company: "LaunchPad", email: "tom@launchpad.co", score: 92 },
  { name: "Mei Huang", title: "VP Product", company: "Synapse", email: "mei.h@synapse.ai", score: 85 },
];

const SCAN_MESSAGES = [
  "scanning linkedin profiles...",
  "cross-referencing crunchbase data...",
  "analyzing company growth signals...",
  "verifying email deliverability...",
  "scoring lead quality...",
  "checking hiring patterns...",
  "mapping decision-maker org charts...",
  "enriching contact data...",
];

export function LeadFinder() {
  const [visibleLeads, setVisibleLeads] = useState<typeof LEADS>([]);
  const [scanMsg, setScanMsg] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [leadIdx, setLeadIdx] = useState(0);

  const addLead = useCallback(() => {
    setVisibleLeads((prev) => {
      const newLead = LEADS[leadIdx % LEADS.length];
      return [...prev, newLead].slice(-3);
    });
    setLeadIdx((i) => i + 1);
    setTotalFound((n) => n + 1);
    setScanMsg((m) => (m + 1) % SCAN_MESSAGES.length);
  }, [leadIdx]);

  useEffect(() => {
    // Show first lead after 1.5s
    const initial = setTimeout(addLead, 1500);
    return () => clearTimeout(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (totalFound === 0) return;
    const interval = setInterval(addLead, 3000);
    return () => clearInterval(interval);
  }, [addLead, totalFound]);

  return (
    <div className="border-2 border-foreground/90 bg-foreground text-background font-mono text-sm overflow-hidden">
      {/* Terminal header */}
      <div className="border-b border-background/10 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-background animate-pulse-subtle" />
          <span className="font-pixel text-[11px] tracking-wider">
            LEAD DISCOVERY ENGINE v1.0
          </span>
        </div>
        <span className="text-[11px] text-background/40 font-pixel">
          {totalFound} FOUND
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-4 space-y-3 min-h-[280px]">
        {/* Scan status */}
        <div className="text-background/30 text-xs flex items-center">
          <span className="text-background/50 mr-1.5">&gt;</span>
          {SCAN_MESSAGES[scanMsg]}
          <span className="animate-blink ml-1">_</span>
        </div>

        {/* Leads */}
        {visibleLeads.map((lead, i) => (
          <div
            key={`${lead.email}-${totalFound}-${i}`}
            className="flex gap-3 items-start border border-background/5 p-3 animate-slide-in"
          >
            <Facehash
              name={lead.name}
              size={36}
              colors={["#e8e8e8", "#c0c0c0", "#a0a0a0", "#808080", "#505050"]}
              intensity3d="subtle"
              variant="solid"
              interactive={false}
              showInitial
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-[11px]">{lead.name}</span>
                <span className="text-[10px] font-pixel text-background/60">
                  ✓ VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-background/40 mt-0.5">
                {lead.title} @ {lead.company}
              </p>
              <p className="text-[11px] text-background/25 font-mono">
                {lead.email}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 bg-background/10 flex-1 max-w-[100px]">
                  <div
                    className="h-full bg-background/70 transition-all duration-500"
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-background/30 font-pixel">
                  {lead.score}% MATCH
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Footer status */}
        {totalFound > 0 && (
          <div className="text-background/20 text-[11px] pt-2 border-t border-background/5">
            <span className="text-background/40">&gt;</span> {totalFound} qualified leads found
            today &middot; scanning 12,847 more profiles...
          </div>
        )}
      </div>
    </div>
  );
}
