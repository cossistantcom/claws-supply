export type DocsMenuItem = {
  key: string;
  label: string;
  href: string;
};

export const DOCS_MENU_ITEMS: DocsMenuItem[] = [
  {
    key: "why-claws-supply-exists",
    label: "why claws.supply exists",
    href: "/docs",
  },
  {
    key: "publish-template",
    label: "how to publish a template",
    href: "/docs/publish-template",
  },
  {
    key: "use-template",
    label: "how to use a template",
    href: "/docs/use-template",
  },
  {
    key: "safety",
    label: "why it is safe",
    href: "/docs/safety",
  },
  {
    key: "verified-seller-stripe-connect",
    label: "verified seller + stripe connect",
    href: "/docs/verified-seller-stripe-connect",
  },
];
