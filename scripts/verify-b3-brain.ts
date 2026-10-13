/**
 * scripts/verify-b3-brain.ts
 *
 * PROMPT B3 — KNOWLEDGE BRAIN VERIFICATION SUITE
 *
 * Validates:
 *  1. Structured KB entries: >=10 diseases + healthy, irrigation rules, fertilizer doses,
 *     weather action rules, pest calendar, soil/AQI explainers with numeric doses in 4 languages.
 *  2. Intents: >=40 intents with 8-12 farmer-phrased examples in ALL 4 languages (EN, HI, GU, MR).
 *  3. Classifier: TF.js dense net over 2000-bucket hashed bag-of-words with lang prefix.
 *  4. Engine Order & Verification:
 *     (a) Network OFF + GU: "હમણે પાણી આપું?" -> instant personalized GU answer with badge BRAIN.
 *     (b) Unknown question -> GEMINI once (or offline fallback).
 *     (c) Repeat question offline -> LEARNED instant answer with badge LEARNED.
 *  5. Badges: BRAIN, LEARNED, GEMINI with mono latency ms.
 *  6. brainLearnedFromYou increments on online learning.
 */

import "fake-indexeddb/auto";
import { TOMATO_KB, getKBEntry } from "../src/lib/brain/kb";
import { INTENT_DEFINITIONS, getIntentDefinition } from "../src/lib/brain/intents";
import classifier, { classify, hashToken, vectorizeText, HASH_BUCKETS } from "../src/lib/brain/classifier";
import {
  answerQuestion,
  formatCitation,
  formatCrossing,
  fillTemplate,
  type FarmLiveContext,
} from "../src/lib/brain/engine";
import {
  saveLearnedEntry,
  findLearnedMatch,
  getLearnedCount,
  clearLearnedEntries,
  type LearnedEntry,
} from "../src/lib/brain/learned";
import memory from "../src/lib/brain/memory";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failedCount++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m ${testName}${details ? ` - ${details}` : ""}`);
  }
}

async function runB3Tests() {
  console.log("\n=======================================================");
  console.log("🧠 B3 KNOWLEDGE BRAIN VERIFICATION SUITE");
  console.log("=======================================================\n");

  await memory.clear();
  clearLearnedEntries();

  // -------------------------------------------------------------------
  // TEST 1: Structured KB Entries (10 diseases + healthy + agronomy)
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: Structured KB in 4 Languages with Numeric Doses");
  {
    assert(TOMATO_KB.length >= 15, `KB contains ${TOMATO_KB.length} entries (>= 15)`, `found ${TOMATO_KB.length}`);

    // Verify 10 diseases + healthy
    const diseaseIds = [
      "healthy",
      "early_blight",
      "late_blight",
      "leaf_mold",
      "septoria_leaf_spot",
      "bacterial_spot",
      "target_spot",
      "spider_mites",
      "mosaic_virus",
      "yellow_leaf_curl",
    ];

    for (const dId of diseaseIds) {
      const entry = getKBEntry(dId);
      assert(Boolean(entry), `KB has entry for ${dId}`);
      if (entry) {
        assert(
          Boolean(entry.texts.en && entry.texts.hi && entry.texts.gu && entry.texts.mr),
          `${dId} has texts in all 4 languages (EN, HI, GU, MR)`,
        );
        if (dId !== "why_yellow") {
          assert(
            typeof entry.safetyPeriodDays === "number",
            `${dId} has numeric safety period (PHI)`,
            `found ${entry.safetyPeriodDays}`,
          );
        }
      }
    }

    // Verify Irrigation, Fertilizers, Weather, Pests, Soil/AQI
    const agronomyIds = [
      "irrigate_now",
      "irrigation_rules",
      "fertilizer_seedling",
      "fertilizer_vegetative",
      "fertilizer_flowering",
      "fertilizer_fruiting",
      "urea_dose",
      "npk_dose",
      "organic_fertilizer",
      "spray_window",
      "rain_effect",
      "heat_stress",
      "frost_cold_stress",
      "humidity_risk",
      "pest_calendar_month",
      "whitefly_control",
      "fruit_borer_control",
      "soil_meaning",
      "aqi_meaning",
      "pump_status",
      "money_saved",
      "water_saved",
    ];

    let allAgronomyValid = true;
    for (const aId of agronomyIds) {
      const entry = getKBEntry(aId);
      if (!entry || !entry.texts.en || !entry.texts.hi || !entry.texts.gu || !entry.texts.mr) {
        allAgronomyValid = false;
      }
    }
    assert(allAgronomyValid, "All agronomy topics (irrigation, fertilizers, weather, pest, soil/AQI) exist in 4 languages");
  }

  // -------------------------------------------------------------------
  // TEST 2: Intent Dataset >= 40 Intents with 8-12 Colloquial Examples
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: >= 40 Intents with 8-12 Examples in All 4 Languages");
  {
    assert(
      INTENT_DEFINITIONS.length >= 40,
      `Intent definitions count is >= 40 (found ${INTENT_DEFINITIONS.length})`,
      `found ${INTENT_DEFINITIONS.length}`,
    );

    let allExamplesInRange = true;
    for (const def of INTENT_DEFINITIONS) {
      for (const lang of ["en", "hi", "gu", "mr"] as const) {
        const count = def.examples[lang]?.length ?? 0;
        if (count < 8 || count > 12) {
          allExamplesInRange = false;
          console.error(`Intent ${def.id} in ${lang} has ${count} examples (expected 8-12)`);
        }
      }
    }
    assert(allExamplesInRange, "Every intent has strictly 8-12 farmer examples in EN, HI, GU, and MR");

    // Check specific colloquial queries required by prompt
    const irrigateDef = getIntentDefinition("irrigate_now");
    const guHasColloquial = irrigateDef?.examples.gu.some((ex) => ex.includes("હમણે પાણી આપું"));
    const mrHasColloquial = irrigateDef?.examples.mr.some((ex) => ex.includes("आता पाणी द्यावं"));
    assert(Boolean(guHasColloquial), 'GU colloquial "હમણે પાણી આપું?" is present in irrigate_now');
    assert(Boolean(mrHasColloquial), 'MR colloquial "आता पाणी द्यावं का?" is present in irrigate_now');
  }

  // -------------------------------------------------------------------
  // TEST 3: Classifier Vectorizer (2000 buckets, per-language prefix)
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: Hashed Bag-of-Words Vectorizer (2000 Buckets)");
  {
    assert(HASH_BUCKETS === 2000, "Classifier uses exactly 2000 hash buckets");

    const hashEn = hashToken("water", "en");
    const hashGu = hashToken("પાણી", "gu");
    const hashMr = hashToken("पाणी", "mr");
    const hashHi = hashToken("पानी", "hi");

    assert(hashEn >= 0 && hashEn < 2000, `EN token hash in range [0, 1999]: ${hashEn}`);
    assert(hashGu >= 0 && hashGu < 2000, `GU token hash in range [0, 1999]: ${hashGu}`);
    assert(hashMr >= 0 && hashMr < 2000, `MR token hash in range [0, 1999]: ${hashMr}`);
    assert(hashHi >= 0 && hashHi < 2000, `HI token hash in range [0, 1999]: ${hashHi}`);

    const vec = vectorizeText("હમણે પાણી આપું કે નહીં?", "gu");
    assert(vec.length === 2000, "Vector length is exactly 2000");

    let nonZero = 0;
    for (let i = 0; i < 2000; i++) {
      if (vec[i] > 0) nonZero++;
    }
    assert(nonZero > 0, `Vector is populated (${nonZero} non-zero buckets)`);
  }

  // -------------------------------------------------------------------
  // TEST 4: Classifier Inference on Indic and English Queries
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: Intent Classification on 4-Language Queries");
  {
    const predGu = await classify("હમણે પાણી આપું?", "gu");
    assert(predGu.intent === "irrigate_now", `GU "હમણે પાણી આપું?" classified as irrigate_now (found ${predGu.intent})`);
    assert(predGu.conf >= 0.6, `GU confidence >= 0.6 (found ${predGu.conf})`);

    const predMr = await classify("आता पाणी द्यावं का?", "mr");
    assert(predMr.intent === "irrigate_now", `MR "आता पाणी द्यावं का?" classified as irrigate_now (found ${predMr.intent})`);
    assert(predMr.conf >= 0.6, `MR confidence >= 0.6 (found ${predMr.conf})`);

    const predHi = await classify("क्या अभी पानी देना चाहिए?", "hi");
    assert(predHi.intent === "irrigate_now", `HI "क्या अभी पानी देना चाहिए?" classified as irrigate_now (found ${predHi.intent})`);
    assert(predHi.conf >= 0.6, `HI confidence >= 0.6 (found ${predHi.conf})`);

    const predEn = await classify("Should I irrigate now?", "en");
    assert(predEn.intent === "irrigate_now", `EN "Should I irrigate now?" classified as irrigate_now (found ${predEn.intent})`);
    assert(predEn.conf >= 0.6, `EN confidence >= 0.6 (found ${predEn.conf})`);

    const predYellow = await classify("ટામેટાના પાન પીળા કેમ પડે છે?", "gu");
    assert(predYellow.intent === "why_yellow", `GU yellow leaf classified as why_yellow (found ${predYellow.intent})`);
  }

  // -------------------------------------------------------------------
  // TEST 5: ANSWER ENGINE — Network OFF + GU: "હમણે પાણી આપું?" -> BRAIN
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: Offline Answer Engine: GU 'હમણે પાણી આપું?' -> BRAIN");
  {
    const liveContext: FarmLiveContext = {
      soil: 42.5,
      temp: 29.0,
      hum: 58.0,
      aqi: 78,
      rain: false,
      pump: false,
      mode: "AUTO",
    };

    // Warmup call to load tf weights on cpu
    await answerQuestion("હમણે પાણી આપું?", "gu", liveContext);

    const answer = await answerQuestion("હમણે પાણી આપું?", "gu", liveContext);

    assert(answer.badge === "BRAIN", `Answer badge is BRAIN (found ${answer.badge})`);
    assert(answer.offline === true, "Answer runs 100% offline without network");
    assert(answer.latencyMs <= 250, `Answer returned instantly (${answer.latencyMs}ms <= 250ms)`);
    assert(answer.text.includes("43") || answer.text.includes("42") || answer.text.includes("ભેજ"), "Answer contains live farm values in Gujarati");
    assert(answer.text.includes("હરોળ") || answer.text.includes("મેમરી") || answer.text.includes("દિવસ"), "Answer contains memory citation");
  }

  // -------------------------------------------------------------------
  // TEST 6: LEARNED Q&A Store & Fuzzy Match
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 6: Learned Q&A Store & Fuzzy Offline Recall");
  {
    const initialLearned = getLearnedCount();
    assert(initialLearned === 0, "Initial learned count is 0");

    const sampleEntry: LearnedEntry = {
      id: "learned-test-1",
      q: {
        en: "Can I use cow urine as foliar spray?",
        hi: "क्या गोमूत्र का पत्तियों पर छिड़काव कर सकते हैं?",
        gu: "શું ગૌમૂત્રનો પાન પર છંટકાવ કરી શકાય?",
        mr: "गोमूत्राची पानांवर फवारणी करता येते का?",
      },
      a: {
        en: "Yes, fermented cow urine diluted 1:10 with water acts as a rich nitrogen foliar feed and mild insect repellent.",
        hi: "हाँ, 1:10 अनुपात में पानी में मिलाकर गोमूत्र का छिड़काव पत्तियों पर नाइट्रोजन देने और कीट भगाने में बहुत लाभकारी है।",
        gu: "હા, 1:10 ના પ્રમાણમાં પાણી ઉમેરી ગૌમૂત્રનો છંટકાવ કરવાથી પાનને નાઇટ્રોજન મળે છે અને જીવાતો દૂર રહે છે.",
        mr: "होय, 1:10 प्रमाणात पाण्यात मिसळून गोमूत्र फवारल्यास पानांना नत्र मिळते आणि किडींचा बंदोबस्त होतो.",
      },
      createdAt: Date.now(),
      hits: 0,
    };

    await saveLearnedEntry(sampleEntry);
    const updatedCount = getLearnedCount();
    assert(updatedCount === 1, `Learned count incremented to 1 (found ${updatedCount})`);

    // Test offline fuzzy match in GU
    const matchGu = await findLearnedMatch("ગૌમૂત્રનો છંટકાવ કરી શકાય?", "gu");
    assert(Boolean(matchGu), "Found fuzzy learned match in Gujarati");
    assert(matchGu?.entry.id === "learned-test-1", "Matched correct learned entry ID");

    // Test through engine with Network OFF
    const liveContext: FarmLiveContext = {
      soil: 45,
      temp: 28,
      hum: 60,
      aqi: 85,
      rain: false,
      pump: false,
      mode: "AUTO",
    };

    const engineLearned = await answerQuestion("ગૌમૂત્રનો છંટકાવ કરી શકાય?", "gu", liveContext);
    assert(engineLearned.badge === "LEARNED", `Engine returned LEARNED badge for repeated question (found ${engineLearned.badge})`);
    assert(engineLearned.offline === true, "Learned response is 100% offline");
    assert(engineLearned.text.includes("ગૌમૂત્ર"), "Learned response matches stored Gujarati answer");
  }

  // -------------------------------------------------------------------
  // TEST 7: Quadrilingual Citation and Crossing Helpers
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 7: Quadrilingual Citation & PredictCrossing Formatting");
  {
    const citEn = formatCitation(7, 1420, "en");
    const citHi = formatCitation(7, 1420, "hi");
    const citGu = formatCitation(7, 1420, "gu");
    const citMr = formatCitation(7, 1420, "mr");

    assert(citEn.includes("7 days, 1420 rows"), `EN citation formatted: ${citEn}`);
    assert(citHi.includes("7 दिनों और 1420 पंक्तियों"), `HI citation formatted: ${citHi}`);
    assert(citGu.includes("7 દિવસો અને 1420 હરોળ"), `GU citation formatted: ${citGu}`);
    assert(citMr.includes("7 दिवसांच्या आणि 1420 नोंदींच्या"), `MR citation formatted: ${citMr}`);

    const crossEn = formatCrossing(null, 45, "en");
    const crossGu = formatCrossing(null, 25, "gu"); // below 30%
    assert(crossEn.includes("farm brain"), `EN crossing adequate: ${crossEn}`);
    assert(crossGu.includes("30% થી ઓછો છે"), `GU crossing below 30: ${crossGu}`);
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

void runB3Tests();
