export type DocsMenuItem = {
  key: string;
  label: string;
  href: string;
};

export const DOCS_MENU_ITEMS: DocsMenuItem[] = [
  {
    key: "why-claws-supply-exists",
    label: "why claws exists",
    href: "/docs",
  },
  {
    key: "publish-template",
    label: "publish template",
    href: "/docs/publish-template",
  },
  {
    key: "sell-templates-pricing",
    label: "sell + pricing",
    href: "/docs/sell-templates-pricing",
  },
  {
    key: "use-template",
    label: "use template",
    href: "/docs/use-template",
  },
  {
    key: "safety",
    label: "safety",
    href: "/docs/safety",
  },
  {
    key: "verified-seller-stripe-connect",
    label: "verified + stripe",
    href: "/docs/verified-seller-stripe-connect",
  },
];
