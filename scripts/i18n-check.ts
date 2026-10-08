// Enforcement script for KrishiNethra quadrilingual coverage
// Runs during build and via npm run i18n:check

import { en } from "../src/lib/i18n/dict/en";
import { hi } from "../src/lib/i18n/dict/hi";
import { gu } from "../src/lib/i18n/dict/gu";
import { mr } from "../src/lib/i18n/dict/mr";

interface CheckResult {
  lang: string;
  total: number;
  missingInThis: string[];
  extraInThis: string[];
  emptyValues: string[];
  coveragePct: number;
}

const dicts = { en, hi, gu, mr };
const enKeys = new Set(Object.keys(en));
const totalEnKeys = enKeys.size;

console.log("==================================================");
console.log("   KRISHINETHRA I18N COVERAGE CHECKER");
console.log("==================================================");
console.log(`Baseline English keys: ${totalEnKeys}`);

let hasErrors = false;
const results: CheckResult[] = [];

for (const [lang, dict] of Object.entries(dicts)) {
  const currentKeys = new Set(Object.keys(dict));
  const missingInThis: string[] = [];
  const extraInThis: string[] = [];
  const emptyValues: string[] = [];

  for (const k of enKeys) {
    if (!currentKeys.has(k)) {
      missingInThis.push(k);
    } else if (!dict[k] || dict[k].trim() === "") {
      emptyValues.push(k);
    }
  }

  for (const k of currentKeys) {
    if (!enKeys.has(k)) {
      extraInThis.push(k);
    }
  }

  const validCount = totalEnKeys - missingInThis.length - emptyValues.length;
  const coveragePct = Number(((validCount / totalEnKeys) * 100).toFixed(1));

  results.push({
    lang: lang.toUpperCase(),
    total: currentKeys.size,
    missingInThis,
    extraInThis,
    emptyValues,
    coveragePct,
  });

  if (missingInThis.length > 0 || extraInThis.length > 0 || emptyValues.length > 0) {
    hasErrors = true;
    console.error(`\n❌ [${lang.toUpperCase()}] Errors detected:`);
    if (missingInThis.length > 0) {
      console.error(`  - Missing ${missingInThis.length} keys:`, missingInThis.slice(0, 10));
      if (missingInThis.length > 10) console.error(`    ... and ${missingInThis.length - 10} more.`);
    }
    if (emptyValues.length > 0) {
      console.error(`  - Empty ${emptyValues.length} values:`, emptyValues.slice(0, 10));
    }
    if (extraInThis.length > 0) {
      console.error(`  - Unexpected extra ${extraInThis.length} keys:`, extraInThis.slice(0, 10));
    }
  }
}

console.log("\nLanguage Coverage Summary:");
console.table(
  results.map((r) => ({
    Language: r.lang,
    "Keys Present": r.total,
    "Missing Keys": r.missingInThis.length,
    "Empty Values": r.emptyValues.length,
    "Coverage %": `${r.coveragePct}%`,
    Status: r.coveragePct === 100 ? "PASS ✓" : "FAIL ✗",
  }))
);

if (hasErrors) {
  console.error("\n❌ i18n check FAILED! All 4 dictionaries must have 100% identical non-empty keys.");
  process.exit(1);
} else {
  console.log(`\n✓ PASS: 100% enforced coverage across EN, HI, GU, and MR (${totalEnKeys} keys each).`);
  process.exit(0);
}
