export function toTemplateEditUrl(templateUrl: string): string {
  const parsed = new URL(templateUrl);
  parsed.pathname = `${parsed.pathname.replace(/\/+$/, "")}/edit`;
  return parsed.toString();
}
