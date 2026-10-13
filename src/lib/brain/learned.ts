/**
 * src/lib/brain/learned.ts
 *
 * PROMPT B3 — KNOWLEDGE BRAIN: Online Learned Q&A Store
 *
 * Persists user-asked questions answered by Gemini, translated to all 4 languages (EN, HI, GU, MR).
 * Provides fuzzy matching for instant offline replay with badge LEARNED.
 */

export interface LearnedEntry {
  id: string;
  q: {
    en: string;
    hi: string;
    gu: string;
    mr: string;
  };
  a: {
    en: string;
    hi: string;
    gu: string;
    mr: string;
  };
  createdAt: number;
  hits: number;
}

const STORAGE_KEY = "kn_learned_entries";
const COUNTER_KEY = "kn_brain_learned_count";

// In-memory fallback
let memoryLearnedEntries: LearnedEntry[] = [];

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getLearnedCount(): number {
  const store = getStorage();
  if (store) {
    const raw = store.getItem(COUNTER_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return memoryLearnedEntries.length;
}

export function incrementLearnedCount(): number {
  const next = getLearnedCount() + 1;
  const store = getStorage();
  if (store) {
    store.setItem(COUNTER_KEY, String(next));
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("kn-learned-updated", { detail: { count: next } }));
    } catch {
      // ignore
    }
  }
  return next;
}

export function getAllLearnedEntries(): LearnedEntry[] {
  const store = getStorage();
  if (store) {
    const raw = store.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LearnedEntry[];
        if (Array.isArray(parsed)) {
          memoryLearnedEntries = parsed;
          return parsed;
        }
      } catch {
        // ignore
      }
    }
  }
  return memoryLearnedEntries;
}

export async function saveLearnedEntry(entry: LearnedEntry): Promise<void> {
  const entries = getAllLearnedEntries();
  const existingIdx = entries.findIndex((e) => e.id === entry.id);

  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.unshift(entry);
    incrementLearnedCount();
  }

  memoryLearnedEntries = entries;
  const store = getStorage();
  if (store) {
    store.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("kn-learned-updated", { detail: { entry } }));
    } catch {
      // ignore
    }
  }
}

/**
 * Clean & tokenize a text string for similarity comparison.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,?!:;'"()\[\]{}।॥-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1),
  );
}

/**
 * Jaccard token similarity between two sentences.
 */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Substring / containment score.
 */
function substringSimilarity(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q) || q.includes(t)) {
    const minLen = Math.min(q.length, t.length);
    const maxLen = Math.max(q.length, t.length);
    return minLen / maxLen;
  }
  return 0;
}

/**
 * Fuzzy search across all learned entries for a query in given language.
 * Returns best matching entry if score >= threshold (default 0.60).
 */
export async function findLearnedMatch(
  query: string,
  lang: string,
  threshold = 0.55,
): Promise<{ entry: LearnedEntry; score: number } | null> {
  const entries = getAllLearnedEntries();
  if (entries.length === 0) return null;

  let bestEntry: LearnedEntry | null = null;
  let highestScore = 0;

  const validLang = (["en", "hi", "gu", "mr"].includes(lang) ? lang : "en") as
    | "en"
    | "hi"
    | "gu"
    | "mr";

  for (const entry of entries) {
    // 1. Primary check in current language
    const targetText = entry.q[validLang] || entry.q.en;
    const jaccard = tokenSimilarity(query, targetText);
    const sub = substringSimilarity(query, targetText);
    const score = Math.max(jaccard, sub * 0.9);

    if (score > highestScore) {
      highestScore = score;
      bestEntry = entry;
    }

    // 2. Also check across all 4 languages in case user asked with mixed script
    for (const l of ["en", "hi", "gu", "mr"] as const) {
      if (l !== validLang && entry.q[l]) {
        const altScore = tokenSimilarity(query, entry.q[l]);
        if (altScore > highestScore) {
          highestScore = altScore;
          bestEntry = entry;
        }
      }
    }
  }

  if (bestEntry && highestScore >= threshold) {
    bestEntry.hits = (bestEntry.hits || 0) + 1;
    void saveLearnedEntry(bestEntry);
    return { entry: bestEntry, score: Math.round(highestScore * 100) / 100 };
  }

  return null;
}

export function clearLearnedEntries(): void {
  memoryLearnedEntries = [];
  const store = getStorage();
  if (store) {
    store.removeItem(STORAGE_KEY);
    store.setItem(COUNTER_KEY, "0");
  }
}
