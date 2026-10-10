const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(RUN_ID_HEADER)?.trim() || undefined;
}

export function getLovableAiGatewayResponseHeaders(providerHeaders: HeadersInit | undefined, init?: HeadersInit) {
  const headers = new Headers(init);
  const exposed = new Set((headers.get("Access-Control-Expose-Headers") ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  new Headers(providerHeaders).forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) {
      headers.set(name, value);
      exposed.add(name);
    }
  });
  if (exposed.size) headers.set("Access-Control-Expose-Headers", [...exposed].join(", "));
  return headers;
}

export async function withLovableAiGatewayRunIdHeader(
  response: Response,
  gateway: { getRunId: () => string | undefined },
  init?: HeadersInit,
) {
  const headers = getLovableAiGatewayResponseHeaders(response.headers, init);
  const runId = gateway.getRunId();
  if (runId) headers.set(RUN_ID_HEADER, runId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}