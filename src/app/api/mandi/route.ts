/**
 * GET /api/mandi — live mandi prices via data.gov.in (Dept. of Consumer Affairs).
 *
 * Query:
 *   ?state=Gujarat        (optional, defaults to no state filter)
 *   ?apiKey=...           (optional override from Settings → Data Sources;
 *                          falls back to DATA_GOV_IN_API_KEY env)
 *   ?resourceId=...       (optional override from Settings → Data Sources;
 *                          falls back to COMMODITY_RESOURCE_ID env)
 *
 * Upstream:
 *   https://api.data.gov.in/resource/{RESOURCE_ID}?api-key={KEY}&format=json&limit=1000&filters[state]={state}
 *
 * Response envelope (ALWAYS HTTP 200 — never throws, never crashes the page):
 *   success:  { ok:true,  fallback:false, count, updatedAt, state, cached, data: LiveMandiRow[] }
 *   fallback: { ok:false, fallback:true,  reason, count:0, data:[] }
 *     reason ∈ "missing-api-key" | "missing-resource-id" | "upstream-error" | "zero-results"
 *   The frontend renders the built-in demo table whenever fallback:true.
 *
 * In-memory cache: per (resourceId, state) for 6 hours to respect API limits.
 * State-spelling resilience: upstream state names are inconsistent
 * ("Keralam" vs "Kerala"), so when the exact `filters[state]` query returns
 * zero rows we retry ONCE without the filter (same limit) and keep rows
 * whose state matches fuzzily (case-insensitive equality or containment).
 * Only if that is still empty do we return the fallback envelope. The retry
 * result is cached under the requested state, so API-limit impact is minimal.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface LiveMandiRow {
  crop: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

type FallbackReason =
  | "missing-api-key"
  | "missing-resource-id"
  | "upstream-error"
  | "zero-results";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const UPSTREAM_TIMEOUT_MS = 12_000;
const UPSTREAM_LIMIT = 1000;

interface CacheEntry {
  at: number;
  payload: {
    count: number;
    updatedAt: string;
    state: string;
    data: LiveMandiRow[];
  };
}

/** Module-global in-memory cache (per server instance). */
const cache = new Map<string, CacheEntry>();

function fallback(reason: FallbackReason, extra?: Record<string, unknown>): Response {
  return Response.json(
    { ok: false, fallback: true, reason, count: 0, data: [], ...extra },
    { status: 200 },
  );
}

/** Case-insensitive field lookup — data.gov.in key casing varies. */
function pick(record: Record<string, unknown>, ...names: string[]): unknown {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) lower[k.toLowerCase()] = v;
  for (const n of names) {
    const v = lower[n.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function num(v: unknown): number {
  if (v === undefined || v === null) return NaN;
  // Prices sometimes arrive as "1,850" or "Rs 1850/Quintal" — strip non-numeric.
  const cleaned = String(v).replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function mapRecord(record: Record<string, unknown>): LiveMandiRow | null {
  const crop = str(pick(record, "commodity"));
  const modalPrice = num(pick(record, "modal_price", "modalprice", "modal price"));
  if (!crop || !Number.isFinite(modalPrice) || modalPrice <= 0) return null;

  const minRaw = num(pick(record, "min_price", "minprice", "min price"));
  const maxRaw = num(pick(record, "max_price", "maxprice", "max price"));
  const minPrice = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : modalPrice;
  const maxPrice = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : modalPrice;

  const date =
    str(pick(record, "arrival_date", "arrivaldate", "date", "updated", "updated_at")) ||
    new Date().toISOString().slice(0, 10);

  return {
    crop,
    state: str(pick(record, "state")),
    district: str(pick(record, "district")),
    market: str(pick(record, "market")),
    minPrice,
    maxPrice,
    modalPrice,
    unit: str(pick(record, "unit")) || "₹/quintal",
    date,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const state = (url.searchParams.get("state") ?? "").trim();

    // Settings → Data Sources values arrive as query overrides so the app
    // also works when env vars are missing (e.g. plain Vercel deploy).
    // Query override wins when present, else the server env var.
    const apiKey =
      (url.searchParams.get("apiKey") ?? "").trim() ||
      (process.env.DATA_GOV_IN_API_KEY ?? "").trim();
    const resourceId =
      (url.searchParams.get("resourceId") ?? "").trim() ||
      (process.env.COMMODITY_RESOURCE_ID ?? "").trim();

    if (!apiKey) return fallback("missing-api-key");
    if (!resourceId) return fallback("missing-resource-id");

    const cacheKey = `${resourceId}::${state.toLowerCase()}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return Response.json(
        {
          ok: true,
          fallback: false,
          count: hit.payload.count,
          updatedAt: hit.payload.updatedAt,
          state: hit.payload.state,
          cached: true,
          data: hit.payload.data,
        },
        { status: 200 },
      );
    }

    const upstream = new URL(
      `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`,
    );
    upstream.searchParams.set("api-key", apiKey);
    upstream.searchParams.set("format", "json");
    upstream.searchParams.set("limit", String(UPSTREAM_LIMIT));
    if (state) upstream.searchParams.set("filters[state]", state);

    let res: Response;
    try {
      res = await fetch(upstream.toString(), {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
    } catch {
      return fallback("upstream-error");
    }

    if (!res.ok) return fallback("upstream-error", { status: res.status });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      return fallback("upstream-error");
    }

    const records = (body as { records?: unknown })?.records;
    let rows: unknown[] = Array.isArray(records) ? records : [];
    let match: "filtered" | "fuzzy-state" = "filtered";

    // Exact state filter hit nothing — retry once unfiltered and fuzzy-match
    // the state client-side (handles upstream quirks like "Keralam").
    if (rows.length === 0 && state) {
      try {
        const retry = new URL(
          `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`,
        );
        retry.searchParams.set("api-key", apiKey);
        retry.searchParams.set("format", "json");
        retry.searchParams.set("limit", String(UPSTREAM_LIMIT));
        const res2 = await fetch(retry.toString(), {
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          headers: { Accept: "application/json" },
        });
        if (res2.ok) {
          const body2: unknown = await res2.json().catch(() => null);
          const rec2 = (body2 as { records?: unknown } | null)?.records;
          if (Array.isArray(rec2)) {
            const want = state.trim().toLowerCase();
            const fuzzy = rec2.filter((r) => {
              if (r === null || typeof r !== "object" || Array.isArray(r)) return false;
              const st = str(
                pick(r as Record<string, unknown>, "state"),
              ).toLowerCase();
              return st !== "" && (st === want || st.includes(want) || want.includes(st));
            });
            if (fuzzy.length > 0) {
              rows = fuzzy;
              match = "fuzzy-state";
            }
          }
        }
      } catch {
        /* retry failed — fall through to the fallback envelope below */
      }
    }

    if (rows.length === 0) {
      return fallback("zero-results");
    }

    const data: LiveMandiRow[] = [];
    for (const r of rows) {
      if (r === null || typeof r !== "object" || Array.isArray(r)) continue;
      const row = mapRecord(r as Record<string, unknown>);
      if (row) data.push(row);
    }

    if (data.length === 0) return fallback("zero-results");

    const payload = {
      count: data.length,
      updatedAt: new Date().toISOString(),
      state,
      match,
      data,
    };
    cache.set(cacheKey, { at: Date.now(), payload });

    return Response.json(
      { ok: true, fallback: false, cached: false, ...payload },
      { status: 200 },
    );
  } catch {
    // NEVER crash the page — any unexpected error degrades to demo data.
    return fallback("upstream-error");
  }
}
