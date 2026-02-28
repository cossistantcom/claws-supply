export class AdsServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "AdsServiceError";
    this.code = options?.code ?? "ADS_SERVICE_ERROR";
    this.status = options?.status ?? 400;
  }
}

