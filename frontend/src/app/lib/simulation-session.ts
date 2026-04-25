export type SimulationSession = {
  branchId: string;
  provider: string;
  kind: string;
  target: string;
  timing: string;
  summary: string;
  model: string;
};

export type SimulationSessionSearchParams = {
  branch?: string | string[];
  provider?: string | string[];
  kind?: string | string[];
  target?: string | string[];
  timing?: string | string[];
  summary?: string | string[];
  model?: string | string[];
};

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function nonEmptyEntries(session: Partial<SimulationSession>) {
  return [
    ["branch", session.branchId],
    ["provider", session.provider],
    ["kind", session.kind],
    ["target", session.target],
    ["timing", session.timing],
    ["summary", session.summary],
    ["model", session.model]
  ].filter((entry): entry is [string, string] => Boolean(entry[1] && entry[1].trim()));
}

export function readSimulationSession(
  searchParams?: SimulationSessionSearchParams,
  fallback: Partial<SimulationSession> = {}
): SimulationSession {
  return {
    branchId: firstValue(searchParams?.branch) || fallback.branchId || "",
    provider: firstValue(searchParams?.provider) || fallback.provider || "",
    kind: firstValue(searchParams?.kind) || fallback.kind || "",
    target: firstValue(searchParams?.target) || fallback.target || "",
    timing: firstValue(searchParams?.timing) || fallback.timing || "",
    summary: firstValue(searchParams?.summary) || fallback.summary || "",
    model: firstValue(searchParams?.model) || fallback.model || ""
  };
}

export function buildSimulationSessionQuery(session: Partial<SimulationSession>) {
  const query = new URLSearchParams();

  for (const [key, value] of nonEmptyEntries(session)) {
    query.set(key, value);
  }

  return query.toString();
}

export function withSimulationSession(
  pathname: string,
  session: Partial<SimulationSession>,
  overrides: Partial<SimulationSession> = {}
) {
  const query = buildSimulationSessionQuery({
    ...session,
    ...overrides
  });

  return query ? `${pathname}?${query}` : pathname;
}

export function hasSimulationDraft(session: Partial<SimulationSession>) {
  return Boolean(
    session.provider || session.kind || session.target || session.timing || session.summary || session.model
  );
}

export function withMergedSearchParams(
  pathname: string,
  params: Record<string, string | undefined>
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) {
      query.set(key, value);
    }
  }

  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}
