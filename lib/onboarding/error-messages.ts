interface ErrorLike {
  message?: unknown;
  code?: unknown;
}

function toLowerText(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as ErrorLike).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
}

export function mapCheckoutError(error: unknown): string {
  const value = (error ?? {}) as ErrorLike;
  const message = toLowerText(value.message);
  const code = toLowerText(value.code);

  if (message.includes("unauthorized") || code.includes("unauthorized")) {
    return "You do not have billing access for this organization.";
  }

  if (
    message.includes("reference id is required") ||
    message.includes("organization not found")
  ) {
    return "Organization context expired. Retry and we will restore it.";
  }

  if (message.includes("already subscribed")) {
    return "This organization already has an active subscription.";
  }

  if (
    message.includes("subscription plan not found") ||
    message.includes("no longer available")
  ) {
    return "That plan is unavailable. Refresh and choose an available option.";
  }

  if (message.includes("temporarily unavailable")) {
    return "Discounted tiers are temporarily unavailable. Final tier checkout remains open.";
  }

  if (message.includes("unable to create customer")) {
    return "We could not initialize Stripe checkout. Please retry.";
  }

  return "Checkout failed. Please try again.";
}

export function mapBillingPortalError(error: unknown): string {
  const value = (error ?? {}) as ErrorLike;
  const message = toLowerText(value.message);
  const code = toLowerText(value.code);

  if (message.includes("unauthorized") || code.includes("unauthorized")) {
    return "You do not have billing access for this organization.";
  }

  if (
    message.includes("organization not found") ||
    message.includes("reference id is required")
  ) {
    return "Organization context expired. Refresh and try again.";
  }

  return "Unable to open the Stripe billing portal.";
}
