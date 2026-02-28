export function getBaseUrlFromRequest(request: Request): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProtocol && forwardedHost) {
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

