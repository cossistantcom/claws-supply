export const DISCOVERY_PAGES = [
  {
    slug: "latest",
    label: "Latest",
    description: "Newly published OpenClaw templates.",
    seoTitle: "Latest OpenClaw Templates — Claws.supply",
    seoDescription:
      "Browse the newest OpenClaw AI agent templates added to Claws.supply.",
  },
  {
    slug: "popular",
    label: "Popular",
    description: "Most downloaded OpenClaw templates.",
    seoTitle: "Popular OpenClaw Templates — Claws.supply",
    seoDescription:
      "Discover the most downloaded OpenClaw AI agent templates on Claws.supply.",
  },
] as const;

export const CATEGORIES = [
  {
    slug: "marketing-seo",
    label: "Marketing & SEO",
    description:
      "Agents for keyword research, content briefs, on-page SEO, and campaign planning.",
    seoTitle: "Marketing & SEO OpenClaw Templates — Claws.supply",
    seoDescription:
      "Find OpenClaw templates for SEO workflows, growth marketing, and content distribution.",
  },
  {
    slug: "sales-prospecting",
    label: "Sales & Prospecting",
    description:
      "Agents for lead research, outbound personalization, and pipeline support.",
    seoTitle: "Sales & Prospecting OpenClaw Templates — Claws.supply",
    seoDescription:
      "Explore OpenClaw templates for outreach, lead qualification, and sales automation.",
  },
  {
    slug: "customer-support",
    label: "Customer Support",
    description:
      "Agents for ticket triage, response drafting, escalation, and FAQ operations.",
    seoTitle: "Customer Support OpenClaw Templates — Claws.supply",
    seoDescription:
      "Browse OpenClaw support templates for helpdesk triage, macros, and customer replies.",
  },
  {
    slug: "content-copywriting",
    label: "Content & Copywriting",
    description:
      "Agents for blogs, landing pages, newsletters, and high-converting copy systems.",
    seoTitle: "Content & Copywriting OpenClaw Templates — Claws.supply",
    seoDescription:
      "Use OpenClaw copywriting templates for blogs, newsletters, and conversion-focused content.",
  },
  {
    slug: "social-youtube",
    label: "Social Media & YouTube",
    description:
      "Agents for video ideation, social scheduling, hooks, scripts, and repurposing.",
    seoTitle: "Social Media & YouTube OpenClaw Templates — Claws.supply",
    seoDescription:
      "Get OpenClaw templates to plan YouTube videos and social media content pipelines.",
  },
  {
    slug: "development-devops",
    label: "Development & DevOps",
    description:
      "Agents for coding, code review, incident response, deployment checklists, and QA.",
    seoTitle: "Development & DevOps OpenClaw Templates — Claws.supply",
    seoDescription:
      "Find OpenClaw templates for software engineering workflows, testing, and DevOps operations.",
  },
  {
    slug: "research-analysis",
    label: "Research & Analysis",
    description:
      "Agents for market research, competitor tracking, synthesis, and decision briefs.",
    seoTitle: "Research & Analysis OpenClaw Templates — Claws.supply",
    seoDescription:
      "Explore OpenClaw research templates for competitive analysis and insight generation.",
  },
  {
    slug: "operations-automation",
    label: "Operations & Automation",
    description:
      "Agents for SOP execution, workflow orchestration, and recurring operational tasks.",
    seoTitle: "Operations & Automation OpenClaw Templates — Claws.supply",
    seoDescription:
      "Browse OpenClaw templates for automating operations, SOPs, and internal processes.",
  },
  {
    slug: "ecommerce-growth",
    label: "Ecommerce & Growth",
    description:
      "Agents for product research, merchandising, retention, and conversion optimization.",
    seoTitle: "Ecommerce & Growth OpenClaw Templates — Claws.supply",
    seoDescription:
      "Get OpenClaw templates for ecommerce growth, merchandising, and retention playbooks.",
  },
  {
    slug: "finance-accounting",
    label: "Finance & Accounting",
    description:
      "Agents for forecasting, reporting, reconciliations, and finance operations support.",
    seoTitle: "Finance & Accounting OpenClaw Templates — Claws.supply",
    seoDescription:
      "Find OpenClaw templates that support accounting, finance planning, and reporting tasks.",
  },
  {
    slug: "hr-recruiting",
    label: "HR & Recruiting",
    description:
      "Agents for sourcing, interview prep, candidate screening, and onboarding workflows.",
    seoTitle: "HR & Recruiting OpenClaw Templates — Claws.supply",
    seoDescription:
      "Browse OpenClaw templates for recruiting pipelines, screening workflows, and onboarding support.",
  },
  {
    slug: "productivity-assistant",
    label: "Productivity Assistant",
    description:
      "Generalist assistants for planning, prioritization, meeting notes, and daily execution.",
    seoTitle: "Productivity Assistant OpenClaw Templates — Claws.supply",
    seoDescription:
      "Use OpenClaw productivity templates to manage planning, priorities, and day-to-day execution.",
  },
] as const;

export const CATEGORY_SORTS = ["latest", "popular"] as const;

export type DiscoverySlug = (typeof DISCOVERY_PAGES)[number]["slug"];
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type CategorySort = (typeof CATEGORY_SORTS)[number];
export type CategoryDefinition = (typeof CATEGORIES)[number];
export type DiscoveryDefinition = (typeof DISCOVERY_PAGES)[number];

export const RESERVED_CATEGORY_SLUGS = DISCOVERY_PAGES.map(
  (page) => page.slug,
) as readonly string[];

const categorySlugSet = new Set<string>(
  CATEGORIES.map((category) => category.slug),
);
const discoverySlugSet = new Set<string>(
  DISCOVERY_PAGES.map((page) => page.slug),
);

for (const category of CATEGORIES) {
  if (discoverySlugSet.has(category.slug)) {
    throw new Error(
      `Category slug "${category.slug}" collides with a discovery slug.`,
    );
  }
}

export function isCategorySlug(value: string): value is CategorySlug {
  return categorySlugSet.has(value);
}

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function isDiscoverySlug(value: string): value is DiscoverySlug {
  return discoverySlugSet.has(value);
}

export function getDiscoveryBySlug(slug: string) {
  return DISCOVERY_PAGES.find((page) => page.slug === slug);
}

export function isCategorySort(value: string): value is CategorySort {
  return CATEGORY_SORTS.some((sort) => sort === value);
}

export type SectionMenuItem =
  | {
      type: "discovery";
      slug: DiscoverySlug;
      label: string;
      description: string;
    }
  | {
      type: "category";
      slug: CategorySlug;
      label: string;
      description: string;
    };

export function getSectionMenuItems(): SectionMenuItem[] {
  return [
    ...DISCOVERY_PAGES.map((page) => ({
      type: "discovery" as const,
      slug: page.slug,
      label: page.label,
      description: page.description,
    })),
    ...CATEGORIES.map((category) => ({
      type: "category" as const,
      slug: category.slug,
      label: category.label,
      description: category.description,
    })),
  ];
}
