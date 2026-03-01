export class PurchaseServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "PurchaseServiceError";
    this.code = options?.code ?? "PURCHASE_SERVICE_ERROR";
    this.status = options?.status ?? 400;
  }
}
