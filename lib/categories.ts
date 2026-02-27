export const CATEGORIES = [
  {
    slug: "marketing",
    label: "Marketing",
    description: "SEO, content, ads, social media agents",
  },
  {
    slug: "sales",
    label: "Sales",
    description: "Outreach, lead gen, CRM automation agents",
  },
  {
    slug: "development",
    label: "Development",
    description: "Coding, devops, testing agents",
  },
  {
    slug: "writing",
    label: "Writing",
    description: "Copywriting, blogging, documentation agents",
  },
  {
    slug: "research",
    label: "Research",
    description: "Data analysis, market research, competitive intel agents",
  },
  {
    slug: "customer-support",
    label: "Customer Support",
    description: "Helpdesk, FAQ, ticket triage agents",
  },
  {
    slug: "design",
    label: "Design",
    description: "UI/UX, branding, creative direction agents",
  },
  {
    slug: "productivity",
    label: "Productivity",
    description: "Task management, scheduling, workflow agents",
  },
  {
    slug: "finance",
    label: "Finance",
    description: "Accounting, forecasting, financial analysis agents",
  },
  {
    slug: "other",
    label: "Other",
    description: "Agents that don't fit other categories",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
