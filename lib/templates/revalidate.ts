import { revalidatePath } from "next/cache";

type RevalidateTemplatePathsInput = {
  slug: string;
  category: string;
  previousCategory?: string | null;
};

export function revalidateTemplatePublicPaths(input: RevalidateTemplatePathsInput) {
  const categories = new Set<string>();
  categories.add(input.category);

  if (input.previousCategory && input.previousCategory.trim().length > 0) {
    categories.add(input.previousCategory);
  }

  revalidatePath("/");
  revalidatePath("/openclaw/templates/latest");
  revalidatePath("/openclaw/templates/popular");
  revalidatePath(`/openclaw/template/${input.slug}`);
  revalidatePath("/sitemap.xml");

  for (const category of categories) {
    revalidatePath(`/openclaw/templates/${category}`);
  }
}
