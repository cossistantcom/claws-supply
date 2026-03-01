function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function slugifyTemplateTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripMarkdown(markdown: string): string {
  return collapseWhitespace(
    markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/[#>*_~\-]+/g, " ")
      .replace(/\r?\n/g, " "),
  );
}

export function deriveTemplateExcerptFromMarkdown(
  markdown: string,
  maxLength = 240,
): string {
  const plain = stripMarkdown(markdown);

  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
