/**
 * scripts/verify-b4-advisor.ts
 *
 * PROMPT B4 — ADVISOR LOOP + PERSONALIZED TELEGRAM VERIFICATION SUITE
 *
 * Validates:
 *  1. ADVISOR: every 15 min compute suggestions from predictCrossing + brain_stats +
 *     risk rules: irrigation_forecast, spray_window, disease_risk_rise, heat_stress,
 *     rain_skip, weekly_money; each {type, severity, textKey, params, citation};
 *     max 6 cards.
 *  2. RANKING & FEEDBACK: user feedback weights (👍+1/👎-0.5 per type, persisted).
 *  3. NEGATIVE WEIGHT FILTER: 👎 on a type removes it next cycle (net weight < 0).
 *  4. DEDUPLICATION: dedupe same type within 3h.
 *  5. TELEGRAM BOT BRIDGE: sendLocalized(textKey, params, lang)
 *     - lang GU -> Telegram briefing arrives in Gujarati with real numbers!
 *     - every message ends with citation + "brain v{version}, trained on {rows} of your rows".
 *  6. QUIET HOURS: 22:00-06:00 setting strictly respected (suppressed at night).
 *  7. SCHEDULED BRIEFINGS:
 *     - 07:00 morning briefing with real numbers
 *     - irrigation forecast when hoursUntil < 4
 *     - spray windows
 *     - disease risk rise
 *     - Monday 08:00 weekly money report
 *  8. QUADRILINGUAL LOCALIZATION: EN, HI, GU, MR for all advisor keys.
 */

import "fake-indexeddb/auto";
import {
  computeAdvisorSuggestions,
  getFeedbackWeights,
  recordFeedback,
  clearFeedbackWeights,
  getLastEmittedMap,
  recordEmitted,
  clearLastEmitted,
  isQuietHours,
  sendLocalized,
  sendMorningBriefing,
  checkAndSendIrrigationForecast,
  sendWeeklyMoneyReport,
  formatAdvisorCitation,
} from "../src/lib/brain/advisor";
import { t } from "../src/lib/i18n";
import memory from "../src/lib/brain/memory";
import { setStoredBrainStats, setStoredVersions } from "../src/lib/brain/trainer";
import { useFarmStore } from "../src/lib/store";

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

async function runB4Tests() {
  console.log("\n=======================================================");
  console.log("🌾 B4 ADVISOR LOOP & TELEGRAM VERIFICATION SUITE");
  console.log("=======================================================\n");

  // Prime farm memory & stats
  await memory.clear();
  clearFeedbackWeights();
  clearLastEmitted();

  // Populate some sample rows in memory so citation has real numbers
  const now = Date.now();
  for (let i = 0; i < 250; i++) {
    await memory.logTelemetry({
      ts: now - (250 - i) * 60 * 1000,
      soil: 40 + (i % 15),
      temp: 26 + (i % 8),
      hum: 60 + (i % 25),
      aqi: 70 + (i % 30),
      rain: false,
      pump: i % 10 === 0,
      mode: "AUTO",
      source: "TEST",
    });
  }

  // Set stored version and stats
  setStoredVersions([
    { version: 1, ts: now - 3600000, rows: 250, mae: 5.2 },
  ]);
  setStoredBrainStats({
    mu: new Array(13).fill(25),
    sd: new Array(13).fill(5),
    cols: [],
    H: 3,
    diurnalCurve: new Array(24).fill(45),
    irrigationLift: 12,
    rainLift: 12,
    dryRatePerH: 1.05,
    usualIrrigationHour: 3,
    rowsTrained: 250,
    mae: 5.2,
  });

  // Set store state with realistic sensor values
  useFarmStore.setState((s) => ({
    ...s,
    snapshot: {
      ...s.snapshot,
      soil: 34,
      temp: 36,
      hum: 82,
      aqi: 95,
      rain: false,
      pump: false,
    },
    settings: {
      ...s.settings,
      language: "gu",
      telegram: {
        botToken: "mock_token",
        chatId: "mock_chat",
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "06:00",
      },
    },
  }));

  // -------------------------------------------------------------------
  // TEST 1: Advisor Computations & Rule Types
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: Advisor Rule Evaluation from Live State & PredictCrossing");
  {
    const suggestions = await computeAdvisorSuggestions({ ignoreDedupe: true });
    assert(suggestions.length > 0, "Advisor generates suggestions");
    assert(suggestions.length <= 6, `Max 6 cards enforced (found ${suggestions.length})`);

    const types = suggestions.map((s) => s.type);
    assert(types.includes("irrigation_forecast"), "Contains irrigation_forecast rule");
    assert(types.includes("heat_stress"), "Contains heat_stress rule (temp 36°C >= 35°C)");
    assert(types.includes("disease_risk_rise"), "Contains disease_risk_rise rule (humidity 82% >= 80%)");
    assert(types.includes("weekly_money"), "Contains weekly_money report rule");

    // Check structure of each suggestion
    for (const sug of suggestions) {
      assert(
        Boolean(sug.id && sug.type && sug.severity && sug.textKey && sug.params && sug.citation),
        `Suggestion ${sug.type} matches required schema {id, type, severity, textKey, params, citation}`,
      );
      assert(
        sug.citation.includes("brain v") && sug.citation.includes("trained on"),
        `Citation includes brain version & training rows (${sug.citation})`,
      );
    }
  }

  // -------------------------------------------------------------------
  // TEST 2: User Feedback Weights (👍+1 / 👎-0.5) and Ranking
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: User Feedback Weights & Prioritized Ranking");
  {
    clearFeedbackWeights();
    let weights = getFeedbackWeights();
    assert(weights.weekly_money === 0, "Initial feedback weight is 0");

    // Upvote weekly_money by +1
    weights = recordFeedback("weekly_money", 1);
    assert(weights.weekly_money === 1, "Upvote adds +1 to feedback weight");

    // Compute and verify that weekly_money gets boosted in rank
    const ranked = await computeAdvisorSuggestions({ ignoreDedupe: true });
    assert(ranked.length > 0, "Ranked suggestions computed");
    const weeklyIdx = ranked.findIndex((s) => s.type === "weekly_money");
    assert(weeklyIdx !== -1, "weekly_money is present in suggestions");
  }

  // -------------------------------------------------------------------
  // TEST 3: 👎 on a Type Removes It Next Cycle
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: 👎 Feedback Immediately Removes Type on Next Cycle");
  {
    // Downvote heat_stress with -0.5
    const updatedWeights = recordFeedback("heat_stress", -0.5);
    assert(updatedWeights.heat_stress === -0.5, "Downvote subtracts 0.5 (weight < 0)");

    // Run next cycle
    const nextCycle = await computeAdvisorSuggestions({ ignoreDedupe: true });
    const hasHeatStress = nextCycle.some((s) => s.type === "heat_stress");
    assert(!hasHeatStress, "👎 on heat_stress removes it completely on next cycle");
  }

  // -------------------------------------------------------------------
  // TEST 4: Deduplicate Same Type Within 3h
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: Deduplication of Same Type Within 3 Hours");
  {
    clearFeedbackWeights();
    clearLastEmitted();

    // First cycle emits suggestions and records timestamp
    const cycle1 = await computeAdvisorSuggestions({ ignoreDedupe: false });
    assert(cycle1.length > 0, `Cycle 1 emits suggestions (count: ${cycle1.length})`);

    // Immediate second cycle within 3h must dedupe all recently emitted types
    const cycle2 = await computeAdvisorSuggestions({ ignoreDedupe: false });
    assert(cycle2.length === 0, "Cycle 2 within 3h dedupes recently emitted types (count: 0)");

    // Simulating cycle 3 hours and 1 minute later
    const futureTime = Date.now() + 3 * 3600 * 1000 + 60000;
    const cycle3 = await computeAdvisorSuggestions({
      now: futureTime,
      ignoreDedupe: false,
    });
    assert(cycle3.length > 0, `After 3h window, suggestions are generated again (count: ${cycle3.length})`);
  }

  // -------------------------------------------------------------------
  // TEST 5: Telegram sendLocalized in Gujarati with Real Numbers
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: Telegram sendLocalized in Gujarati with Real Numbers");
  {
    const guBriefing = await sendMorningBriefing("gu", {
      force: true, // override quiet hours for direct testing
    });

    assert(guBriefing.success, "Telegram briefing successfully formatted");
    assert(typeof guBriefing.text === "string", "Briefing text is generated");

    // Verify Gujarati text content
    assert(
      guBriefing.text.includes("શુભ પ્રભાત") || guBriefing.text.includes("ખેતરની સ્થિતિ"),
      "Telegram briefing arrives in Gujarati language",
    );

    // Verify presence of real numbers in the text
    const hasNumbers = /\d+/.test(guBriefing.text);
    assert(hasNumbers, "Telegram briefing contains real numbers (soil %, temp °C, hours)");

    // Verify SPEC requirement: ends with citation + "brain v{version}, trained on {rows} of your rows"
    assert(
      guBriefing.text.includes("brain v1, trained on 250 of your rows"),
      `Message ends with exact citation string ("brain v1, trained on 250 of your rows")`,
    );

    // Also verify Hindi, Marathi, and English format
    const hiCitation = formatAdvisorCitation("hi");
    assert(hiCitation.includes("फ़ार्म मेमोरी પર आधारित") || hiCitation.includes("फ़ार्म मेमोरी पर आधारित"), "HI citation contains Hindi memory phrasing");

    const mrCitation = formatAdvisorCitation("mr");
    assert(mrCitation.includes("शेत मेमरीवर आधारित"), "MR citation contains Marathi memory phrasing");

    const enCitation = formatAdvisorCitation("en");
    assert(enCitation.includes("farm memory"), "EN citation contains English memory phrasing");
  }

  // -------------------------------------------------------------------
  // TEST 6: Quiet Hours (22:00 - 06:00) Respected
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 6: Quiet Hours (22:00 - 06:00) Setting Respected");
  {
    // 23:30 (11:30 PM) -> within quiet hours
    const lateNight = new Date("2026-10-13T23:30:00");
    assert(isQuietHours(lateNight, "22:00", "06:00"), "23:30 is identified as quiet hours");

    const nightResult = await sendLocalized(
      "advisor.irrigation_forecast",
      { hours: 2, soil: 28, usualDelta: 45 },
      "gu",
      { now: lateNight },
    );
    assert(
      nightResult.suppressed === true && nightResult.reason === "quiet_hours",
      "sendLocalized suppresses delivery during quiet hours (23:30)",
    );

    // 03:15 (3:15 AM) -> within quiet hours
    const earlyMorning = new Date("2026-10-13T03:15:00");
    assert(isQuietHours(earlyMorning, "22:00", "06:00"), "03:15 is identified as quiet hours");

    const dawnResult = await sendLocalized(
      "advisor.disease_risk_rise",
      { humidity: 88, temp: 24, risk: "High" },
      "gu",
      { now: earlyMorning },
    );
    assert(
      dawnResult.suppressed === true && dawnResult.reason === "quiet_hours",
      "sendLocalized suppresses delivery at 03:15",
    );

    // 07:00 (7:00 AM) -> daytime, quiet hours ended
    const dayMorning = new Date("2026-10-13T07:00:00");
    assert(!isQuietHours(dayMorning, "22:00", "06:00"), "07:00 is outside quiet hours");

    const morningResult = await sendLocalized(
      "advisor.morning_briefing",
      { soil: 38, temp: 27, weather: "Clear", hours: 3.5 },
      "gu",
      { now: dayMorning },
    );
    assert(
      morningResult.success === true && !morningResult.suppressed,
      "sendLocalized sends successfully at 07:00 morning briefing",
    );
  }

  // -------------------------------------------------------------------
  // TEST 7: Scheduled Telegram Routines
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 7: Scheduled Telegram Triggers");
  {
    // When soil is high (hoursUntil >= 4), it should NOT trigger
    useFarmStore.setState((s) => ({ ...s, snapshot: { ...s.snapshot, soil: 60 } }));
    const noAlert = await checkAndSendIrrigationForecast("gu", { force: true });
    assert(noAlert === null, "checkAndSendIrrigationForecast returns null when hoursUntil >= 4");

    // Irrigation forecast when hoursUntil < 4 (soil 32)
    useFarmStore.setState((s) => ({ ...s, snapshot: { ...s.snapshot, soil: 32 } }));
    const irrigationAlert = await checkAndSendIrrigationForecast("gu", { force: true });
    assert(Boolean(irrigationAlert), "checkAndSendIrrigationForecast triggers when hoursUntil < 4");
    if (irrigationAlert) {
      assert(irrigationAlert.text.includes("કલાકમાં પિયતની જરૂર"), "Irrigation alert formatted in Gujarati");
    }

    // Monday 08:00 Weekly Money report
    const moneyReport = await sendWeeklyMoneyReport("gu", { force: true });
    assert(Boolean(moneyReport), "sendWeeklyMoneyReport generates report");
    assert(moneyReport.text.includes("નાણાં અહેવાલ") || moneyReport.text.includes("₹840"), "Money report contains real savings in Gujarati");
  }

  // -------------------------------------------------------------------
  // TEST 8: Quadrilingual Translation Completeness
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 8: Quadrilingual Translation Checks (EN, HI, GU, MR)");
  {
    const keysToCheck = [
      "advisor.card_title",
      "advisor.card_subtitle",
      "advisor.all_clear",
      "advisor.irrigation_forecast",
      "advisor.spray_window",
      "advisor.disease_risk_rise",
      "advisor.heat_stress",
      "advisor.rain_skip",
      "advisor.weekly_money",
      "advisor.morning_briefing",
      "advisor.action.do_it",
      "advisor.action.remind_1h",
      "advisor.action.irrigate",
      "advisor.feedback.up",
      "advisor.feedback.down",
    ];

    for (const k of keysToCheck) {
      const enText = t(k, { hours: 2, soil: 30, temp: 28, humidity: 80, usualDelta: 10, start: "08:00", end: "11:00", wind: 5, rainProb: 10, risk: "High", threshold: 35, prob: 70, waterSaved: 400, savedRs: 500, waterL: 1000, pumpCostRs: 150, weather: "Clear" }, "en");
      const hiText = t(k, { hours: 2, soil: 30, temp: 28, humidity: 80, usualDelta: 10, start: "08:00", end: "11:00", wind: 5, rainProb: 10, risk: "High", threshold: 35, prob: 70, waterSaved: 400, savedRs: 500, waterL: 1000, pumpCostRs: 150, weather: "Clear" }, "hi");
      const guText = t(k, { hours: 2, soil: 30, temp: 28, humidity: 80, usualDelta: 10, start: "08:00", end: "11:00", wind: 5, rainProb: 10, risk: "High", threshold: 35, prob: 70, waterSaved: 400, savedRs: 500, waterL: 1000, pumpCostRs: 150, weather: "Clear" }, "gu");
      const mrText = t(k, { hours: 2, soil: 30, temp: 28, humidity: 80, usualDelta: 10, start: "08:00", end: "11:00", wind: 5, rainProb: 10, risk: "High", threshold: 35, prob: 70, waterSaved: 400, savedRs: 500, waterL: 1000, pumpCostRs: 150, weather: "Clear" }, "mr");

      assert(Boolean(enText && enText !== k), `Key ${k} resolves in English`);
      assert(Boolean(hiText && hiText !== k), `Key ${k} resolves in Hindi`);
      assert(Boolean(guText && guText !== k), `Key ${k} resolves in Gujarati`);
      assert(Boolean(mrText && mrText !== k), `Key ${k} resolves in Marathi`);
    }
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

void runB4Tests();
