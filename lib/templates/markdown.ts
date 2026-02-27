export function normalizeTemplateDescription(markdown: string): string {
  const trimmed = markdown.trim();

  // Auto-demote h1/h2 headings to h3 for marketplace descriptions.
  return trimmed.replace(/^(#{1,2})(\s+)/gm, "###$2");
}
