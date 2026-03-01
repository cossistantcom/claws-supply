"use client";

import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UsdMoneyInput } from "./usd-money-input";

export type TemplateMetadataFormValues = {
  title: string;
  slug: string;
  category: CategorySlug;
  description: string;
  priceCents: number;
};

type TemplateMetadataFieldsProps = {
  values: TemplateMetadataFormValues;
  disabled?: boolean;
  slugReadOnly?: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onCategoryChange: (value: CategorySlug) => void;
  onDescriptionChange: (value: string) => void;
  onPriceCentsChange: (value: number) => void;
};

export function TemplateMetadataFields({
  values,
  disabled = false,
  slugReadOnly = false,
  onTitleChange,
  onSlugChange,
  onCategoryChange,
  onDescriptionChange,
  onPriceCentsChange,
}: TemplateMetadataFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="template-title" className="text-xs uppercase tracking-wide">
          Title
        </label>
        <Input
          id="template-title"
          value={values.title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={140}
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="template-slug" className="text-xs uppercase tracking-wide">
          Slug
        </label>
        <Input
          id="template-slug"
          value={values.slug}
          onChange={(event) => onSlugChange(event.target.value)}
          maxLength={120}
          required
          disabled={disabled || slugReadOnly}
          readOnly={slugReadOnly}
        />
        <p className="text-[11px] text-muted-foreground">
          {slugReadOnly
            ? "Slug is immutable after template creation."
            : "Lowercase, URL-safe, hyphenated slug."}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="template-category" className="text-xs uppercase tracking-wide">
          Category
        </label>
        <select
          id="template-category"
          value={values.category}
          onChange={(event) => onCategoryChange(event.target.value as CategorySlug)}
          disabled={disabled}
          className="h-8 w-full rounded-none border border-input bg-transparent px-2.5 text-sm outline-none"
        >
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="template-price" className="text-xs uppercase tracking-wide">
          Price (USD)
        </label>
        <UsdMoneyInput
          id="template-price"
          valueCents={values.priceCents}
          onValueCentsChange={onPriceCentsChange}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="template-description"
          className="text-xs uppercase tracking-wide"
        >
          Body (Markdown)
        </label>
        <Textarea
          id="template-description"
          value={values.description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          maxLength={20_000}
          rows={12}
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}
