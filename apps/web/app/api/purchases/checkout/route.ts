import { jsonSuccess } from "@/lib/api/response";
import { getBaseUrlFromRequest } from "@/lib/api/request";
import {
  handleRouteError,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { createPurchaseCheckoutSchema } from "@/lib/purchases/schemas";
import { createTemplatePurchaseCheckout } from "@/lib/purchases/service";

export async function POST(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    const input = await parseJsonBodyWithSchema(request, createPurchaseCheckoutSchema);
    const result = await createTemplatePurchaseCheckout({
      buyerId: session.user.id,
      input,
      baseUrl: getBaseUrlFromRequest(request),
    });

    return jsonSuccess(result, {
      status: result.flow === "paid" ? 201 : 200,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to start template checkout.",
      code: "PURCHASE_CHECKOUT_ERROR",
      status: 400,
    });
  }
}
