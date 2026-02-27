import {
  CATEGORIES,
  type CategorySlug,
  type CategorySort,
  type DiscoverySlug,
} from "@/lib/categories";

type MockTemplateSeller = {
  username: string;
  displayName: string;
  isVerified: boolean;
};

export type MockTemplate = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: CategorySlug;
  priceCents: number;
  currency: "USD";
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  seller: MockTemplateSeller;
};

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    slug: "programmatic-seo-briefing-agent",
    title: "Programmatic SEO Briefing Agent",
    shortDescription:
      "Build SERP-ready outlines, heading maps, and internal linking plans.",
    description:
      "Creates repeatable SEO content briefs with search intent segmentation, entities, and article architecture.",
    category: "marketing-seo",
    priceCents: 3900,
    currency: "USD",
    downloadCount: 972,
    rating: 4.8,
    reviewCount: 143,
    createdAt: "2026-02-20T11:00:00.000Z",
    updatedAt: "2026-02-24T14:20:00.000Z",
    seller: {
      username: "serpops",
      displayName: "SERP Ops",
      isVerified: true,
    },
  },
  {
    slug: "technical-seo-auditor-agent",
    title: "Technical SEO Auditor Agent",
    shortDescription:
      "Find crawl blockers, indexing gaps, and schema implementation misses.",
    description:
      "Runs site-level diagnostics and outputs prioritized action plans for engineering and growth teams.",
    category: "marketing-seo",
    priceCents: 4900,
    currency: "USD",
    downloadCount: 744,
    rating: 4.7,
    reviewCount: 102,
    createdAt: "2026-02-14T09:45:00.000Z",
    updatedAt: "2026-02-21T10:10:00.000Z",
    seller: {
      username: "crawlstack",
      displayName: "Crawl Stack",
      isVerified: true,
    },
  },
  {
    slug: "cold-outreach-personalizer-agent",
    title: "Cold Outreach Personalizer Agent",
    shortDescription:
      "Craft personalized outbound messages using lead and company context.",
    description:
      "Turns lead research into ready-to-send outbound drafts with persona, industry, and trigger-based messaging.",
    category: "sales-prospecting",
    priceCents: 3200,
    currency: "USD",
    downloadCount: 1311,
    rating: 4.9,
    reviewCount: 211,
    createdAt: "2026-02-25T15:35:00.000Z",
    updatedAt: "2026-02-25T15:35:00.000Z",
    seller: {
      username: "revforge",
      displayName: "Rev Forge",
      isVerified: true,
    },
  },
  {
    slug: "account-research-brief-agent",
    title: "Account Research Brief Agent",
    shortDescription:
      "Produce concise account plans before discovery or outbound sequences.",
    description:
      "Builds account briefs from public signals to improve first-touch relevance and demo preparation.",
    category: "sales-prospecting",
    priceCents: 2500,
    currency: "USD",
    downloadCount: 888,
    rating: 4.6,
    reviewCount: 117,
    createdAt: "2026-02-12T13:20:00.000Z",
    updatedAt: "2026-02-18T09:20:00.000Z",
    seller: {
      username: "pipelinepilot",
      displayName: "Pipeline Pilot",
      isVerified: false,
    },
  },
  {
    slug: "ticket-triage-router-agent",
    title: "Ticket Triage Router Agent",
    shortDescription:
      "Classify, prioritize, and route support tickets across specialist queues.",
    description:
      "Automates inbound support triage with severity tags and escalation pathways for better response times.",
    category: "customer-support",
    priceCents: 2800,
    currency: "USD",
    downloadCount: 1164,
    rating: 4.8,
    reviewCount: 156,
    createdAt: "2026-02-19T10:10:00.000Z",
    updatedAt: "2026-02-23T12:30:00.000Z",
    seller: {
      username: "supportmesh",
      displayName: "Support Mesh",
      isVerified: true,
    },
  },
  {
    slug: "help-center-reply-drafter-agent",
    title: "Help Center Reply Drafter Agent",
    shortDescription:
      "Draft consistent answers from your docs, policies, and support playbooks.",
    description:
      "Generates support responses with configurable tone and policy-safe boundaries for frontline teams.",
    category: "customer-support",
    priceCents: 0,
    currency: "USD",
    downloadCount: 603,
    rating: 4.5,
    reviewCount: 79,
    createdAt: "2026-02-09T07:50:00.000Z",
    updatedAt: "2026-02-15T08:12:00.000Z",
    seller: {
      username: "docsfirst",
      displayName: "Docs First",
      isVerified: false,
    },
  },
  {
    slug: "landing-page-copy-sprint-agent",
    title: "Landing Page Copy Sprint Agent",
    shortDescription:
      "Generate positioning, offer angles, and conversion-focused section copy.",
    description:
      "Produces high-clarity landing page drafts mapped to awareness levels and buyer objections.",
    category: "content-copywriting",
    priceCents: 2100,
    currency: "USD",
    downloadCount: 1390,
    rating: 4.8,
    reviewCount: 228,
    createdAt: "2026-02-26T08:25:00.000Z",
    updatedAt: "2026-02-26T08:25:00.000Z",
    seller: {
      username: "copyengine",
      displayName: "Copy Engine",
      isVerified: true,
    },
  },
  {
    slug: "weekly-newsletter-ghostwriter-agent",
    title: "Weekly Newsletter Ghostwriter Agent",
    shortDescription:
      "Ship a weekly newsletter with angles, subject lines, and polished drafts.",
    description:
      "Transforms notes and source links into audience-specific newsletter editions with distribution-ready format.",
    category: "content-copywriting",
    priceCents: 1900,
    currency: "USD",
    downloadCount: 812,
    rating: 4.7,
    reviewCount: 95,
    createdAt: "2026-02-17T16:40:00.000Z",
    updatedAt: "2026-02-22T09:05:00.000Z",
    seller: {
      username: "inkline",
      displayName: "Inkline",
      isVerified: false,
    },
  },
  {
    slug: "youtube-script-packager-agent",
    title: "YouTube Script Packager Agent",
    shortDescription:
      "Turn a topic into intro hooks, full script, and retention checkpoints.",
    description:
      "Builds YouTube scripts optimized for watch-time structure, pacing, and narrative flow.",
    category: "social-youtube",
    priceCents: 3000,
    currency: "USD",
    downloadCount: 1244,
    rating: 4.9,
    reviewCount: 192,
    createdAt: "2026-02-22T19:15:00.000Z",
    updatedAt: "2026-02-25T10:00:00.000Z",
    seller: {
      username: "creatorstack",
      displayName: "Creator Stack",
      isVerified: true,
    },
  },
  {
    slug: "social-repurpose-factory-agent",
    title: "Social Repurpose Factory Agent",
    shortDescription:
      "Repurpose long-form content into posts, threads, shorts, and captions.",
    description:
      "Converts one source asset into multi-platform social packs with channel-specific formats.",
    category: "social-youtube",
    priceCents: 1800,
    currency: "USD",
    downloadCount: 765,
    rating: 4.6,
    reviewCount: 84,
    createdAt: "2026-02-10T12:10:00.000Z",
    updatedAt: "2026-02-17T09:15:00.000Z",
    seller: {
      username: "clipsmith",
      displayName: "Clipsmith",
      isVerified: false,
    },
  },
  {
    slug: "incident-postmortem-assistant-agent",
    title: "Incident Postmortem Assistant Agent",
    shortDescription:
      "Summarize incident timelines and draft clear postmortem write-ups.",
    description:
      "Helps engineering teams convert logs and notes into actionable postmortems with ownership and follow-ups.",
    category: "development-devops",
    priceCents: 4200,
    currency: "USD",
    downloadCount: 678,
    rating: 4.7,
    reviewCount: 91,
    createdAt: "2026-02-13T06:15:00.000Z",
    updatedAt: "2026-02-20T11:25:00.000Z",
    seller: {
      username: "opsrelay",
      displayName: "Ops Relay",
      isVerified: true,
    },
  },
  {
    slug: "pr-review-checklist-agent",
    title: "PR Review Checklist Agent",
    shortDescription:
      "Apply architecture, testing, and security checks to pull requests.",
    description:
      "Standardizes PR quality reviews with configurable checklists and team conventions.",
    category: "development-devops",
    priceCents: 0,
    currency: "USD",
    downloadCount: 1022,
    rating: 4.8,
    reviewCount: 169,
    createdAt: "2026-02-21T14:45:00.000Z",
    updatedAt: "2026-02-24T18:10:00.000Z",
    seller: {
      username: "shipsafe",
      displayName: "ShipSafe",
      isVerified: true,
    },
  },
  {
    slug: "competitor-landscape-scanner-agent",
    title: "Competitor Landscape Scanner Agent",
    shortDescription:
      "Track competitors, positioning shifts, and product launch updates.",
    description:
      "Builds periodic competitor snapshots with notable movements and strategic implications.",
    category: "research-analysis",
    priceCents: 3400,
    currency: "USD",
    downloadCount: 547,
    rating: 4.6,
    reviewCount: 64,
    createdAt: "2026-02-11T11:35:00.000Z",
    updatedAt: "2026-02-18T07:20:00.000Z",
    seller: {
      username: "signalroom",
      displayName: "Signal Room",
      isVerified: false,
    },
  },
  {
    slug: "market-signal-synthesis-agent",
    title: "Market Signal Synthesis Agent",
    shortDescription:
      "Compile weak and strong signals into concise market intelligence briefs.",
    description:
      "Combines trend tracking, source clustering, and summary generation for leadership decisions.",
    category: "research-analysis",
    priceCents: 3600,
    currency: "USD",
    downloadCount: 824,
    rating: 4.8,
    reviewCount: 105,
    createdAt: "2026-02-23T08:00:00.000Z",
    updatedAt: "2026-02-25T07:40:00.000Z",
    seller: {
      username: "northstarlabs",
      displayName: "Northstar Labs",
      isVerified: true,
    },
  },
  {
    slug: "sop-execution-operator-agent",
    title: "SOP Execution Operator Agent",
    shortDescription:
      "Run recurring SOPs with checkpoints, escalations, and completion reports.",
    description:
      "Executes operational checklists with human-in-the-loop approvals and audit-friendly logs.",
    category: "operations-automation",
    priceCents: 3300,
    currency: "USD",
    downloadCount: 915,
    rating: 4.7,
    reviewCount: 118,
    createdAt: "2026-02-15T09:55:00.000Z",
    updatedAt: "2026-02-22T06:30:00.000Z",
    seller: {
      username: "workflowdock",
      displayName: "Workflow Dock",
      isVerified: true,
    },
  },
  {
    slug: "meeting-followup-automation-agent",
    title: "Meeting Follow-up Automation Agent",
    shortDescription:
      "Convert meeting notes into tasks, owners, deadlines, and status nudges.",
    description:
      "Automates post-meeting execution by producing action logs and follow-up drafts.",
    category: "operations-automation",
    priceCents: 1200,
    currency: "USD",
    downloadCount: 756,
    rating: 4.6,
    reviewCount: 88,
    createdAt: "2026-02-08T10:30:00.000Z",
    updatedAt: "2026-02-16T13:45:00.000Z",
    seller: {
      username: "opscalendar",
      displayName: "Ops Calendar",
      isVerified: false,
    },
  },
  {
    slug: "product-page-conversion-agent",
    title: "Product Page Conversion Agent",
    shortDescription:
      "Improve PDP messaging, offer framing, and conversion-focused content.",
    description:
      "Optimizes ecommerce product pages with persuasive structure and purchase-friction fixes.",
    category: "ecommerce-growth",
    priceCents: 2750,
    currency: "USD",
    downloadCount: 1094,
    rating: 4.8,
    reviewCount: 162,
    createdAt: "2026-02-24T13:25:00.000Z",
    updatedAt: "2026-02-24T13:25:00.000Z",
    seller: {
      username: "cartlabs",
      displayName: "Cart Labs",
      isVerified: true,
    },
  },
  {
    slug: "retention-offer-planner-agent",
    title: "Retention Offer Planner Agent",
    shortDescription:
      "Design lifecycle campaigns and retention offers for repeat purchases.",
    description:
      "Builds retention campaign plans using behavioral segments and margin-aware incentives.",
    category: "ecommerce-growth",
    priceCents: 2600,
    currency: "USD",
    downloadCount: 699,
    rating: 4.5,
    reviewCount: 76,
    createdAt: "2026-02-18T07:10:00.000Z",
    updatedAt: "2026-02-20T14:15:00.000Z",
    seller: {
      username: "retentioncraft",
      displayName: "Retention Craft",
      isVerified: false,
    },
  },
  {
    slug: "weekly-cashflow-analyst-agent",
    title: "Weekly Cashflow Analyst Agent",
    shortDescription:
      "Summarize cash movements, runway shifts, and weekly finance highlights.",
    description:
      "Creates concise weekly cashflow updates with trend detection and management-ready commentary.",
    category: "finance-accounting",
    priceCents: 4100,
    currency: "USD",
    downloadCount: 574,
    rating: 4.7,
    reviewCount: 70,
    createdAt: "2026-02-16T15:00:00.000Z",
    updatedAt: "2026-02-23T10:50:00.000Z",
    seller: {
      username: "ledgerloop",
      displayName: "Ledger Loop",
      isVerified: true,
    },
  },
  {
    slug: "expense-policy-auditor-agent",
    title: "Expense Policy Auditor Agent",
    shortDescription:
      "Audit reimbursements against policy and flag anomalies for review.",
    description:
      "Speeds up finance approvals by comparing submitted expenses to policy rules and exceptions.",
    category: "finance-accounting",
    priceCents: 1700,
    currency: "USD",
    downloadCount: 441,
    rating: 4.4,
    reviewCount: 52,
    createdAt: "2026-02-07T09:05:00.000Z",
    updatedAt: "2026-02-14T09:35:00.000Z",
    seller: {
      username: "apflow",
      displayName: "AP Flow",
      isVerified: false,
    },
  },
  {
    slug: "candidate-screening-copilot-agent",
    title: "Candidate Screening Copilot Agent",
    shortDescription:
      "Screen resumes against role scorecards and highlight top-fit candidates.",
    description:
      "Standardizes candidate screening decisions with criteria-based summaries and interview recommendations.",
    category: "hr-recruiting",
    priceCents: 2950,
    currency: "USD",
    downloadCount: 893,
    rating: 4.8,
    reviewCount: 131,
    createdAt: "2026-02-27T09:15:00.000Z",
    updatedAt: "2026-02-27T09:15:00.000Z",
    seller: {
      username: "hiringops",
      displayName: "Hiring Ops",
      isVerified: true,
    },
  },
  {
    slug: "interview-loop-coordinator-agent",
    title: "Interview Loop Coordinator Agent",
    shortDescription:
      "Coordinate interview stages, panel notes, and candidate debrief summaries.",
    description:
      "Keeps interview processes moving with stage tracking, interviewer prompts, and decision recaps.",
    category: "hr-recruiting",
    priceCents: 1500,
    currency: "USD",
    downloadCount: 508,
    rating: 4.5,
    reviewCount: 61,
    createdAt: "2026-02-06T14:15:00.000Z",
    updatedAt: "2026-02-12T09:55:00.000Z",
    seller: {
      username: "talentloop",
      displayName: "Talent Loop",
      isVerified: false,
    },
  },
  {
    slug: "founder-daily-briefing-agent",
    title: "Founder Daily Briefing Agent",
    shortDescription:
      "Generate daily priorities, blockers, and decision cues from active projects.",
    description:
      "Turns fragmented updates into a focused founder operating brief with action-first structure.",
    category: "productivity-assistant",
    priceCents: 0,
    currency: "USD",
    downloadCount: 1208,
    rating: 4.9,
    reviewCount: 217,
    createdAt: "2026-02-26T05:55:00.000Z",
    updatedAt: "2026-02-26T05:55:00.000Z",
    seller: {
      username: "dayzero",
      displayName: "Day Zero",
      isVerified: true,
    },
  },
  {
    slug: "priority-planning-assistant-agent",
    title: "Priority Planning Assistant Agent",
    shortDescription:
      "Convert goals into weekly plans, scoped tasks, and momentum checkpoints.",
    description:
      "Helps operators and solo builders prioritize effectively with realistic execution plans.",
    category: "productivity-assistant",
    priceCents: 1300,
    currency: "USD",
    downloadCount: 833,
    rating: 4.7,
    reviewCount: 99,
    createdAt: "2026-02-18T18:40:00.000Z",
    updatedAt: "2026-02-21T08:25:00.000Z",
    seller: {
      username: "focusframe",
      displayName: "Focus Frame",
      isVerified: false,
    },
  },
];

function sortByPopular(a: MockTemplate, b: MockTemplate) {
  if (a.downloadCount !== b.downloadCount) {
    return b.downloadCount - a.downloadCount;
  }

  if (a.reviewCount !== b.reviewCount) {
    return b.reviewCount - a.reviewCount;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortByLatest(a: MockTemplate, b: MockTemplate) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function applySort(templates: MockTemplate[], sort: CategorySort) {
  return [...templates].sort(sort === "latest" ? sortByLatest : sortByPopular);
}

export function getAllMockTemplates() {
  return [...MOCK_TEMPLATES];
}

export function getLatestTemplates(limit?: number) {
  const sorted = [...MOCK_TEMPLATES].sort(sortByLatest);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getPopularTemplates(limit?: number) {
  const sorted = [...MOCK_TEMPLATES].sort(sortByPopular);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getTemplatesByCategory(
  category: CategorySlug,
  sort: CategorySort = "popular",
  limit?: number,
) {
  const filtered = MOCK_TEMPLATES.filter((template) => template.category === category);
  const sorted = applySort(filtered, sort);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getTemplatesByDiscovery(discovery: DiscoverySlug, limit?: number) {
  const sorted =
    discovery === "latest" ? getLatestTemplates(limit) : getPopularTemplates(limit);
  return sorted;
}

export function getDiscoveryTemplateCount(discovery: DiscoverySlug) {
  return getTemplatesByDiscovery(discovery).length;
}

export function getTemplateBySlug(slug: string) {
  return MOCK_TEMPLATES.find((template) => template.slug === slug);
}

export function getRelatedTemplates(templateSlug: string, limit = 6) {
  const currentTemplate = getTemplateBySlug(templateSlug);
  if (!currentTemplate) {
    return [];
  }

  return getTemplatesByCategory(currentTemplate.category, "popular")
    .filter((template) => template.slug !== currentTemplate.slug)
    .slice(0, limit);
}

export function getTemplateCountByCategory() {
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category.slug, 0]),
  ) as Record<CategorySlug, number>;

  for (const template of MOCK_TEMPLATES) {
    counts[template.category] += 1;
  }

  return counts;
}
