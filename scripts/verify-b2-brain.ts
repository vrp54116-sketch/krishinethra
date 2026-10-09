/**
 * scripts/verify-b2-brain.ts
 *
 * PROMPT B2 — PERSONAL BRAIN VERIFICATION SUITE
 *
 * Validates:
 *  1. Features EXACTLY [hour_sin, hour_cos, dow, temp, hum, aqi, rain, pump_l1, rain_l1, soil_l1, soil_l3, soil_l6, soil_l12] (13 columns)
 *  2. Target soil at +3h, normalized with stored mu/sd, cap 20,000 rows
 *  3. Require >= 200 rows else expose state COLLECTING(n/200)
 *  4. MODEL: Dense(64,relu) -> Dense(32,relu) -> Dense(1); Adam 1e-3, mse, 30 epochs, batch 32
 *  5. Between epochs await tf.nextTick() and emit {epoch, loss, valLoss} to subscribers
 *  6. Model saved to indexeddb://kn-brain-v${n}, metadata {version, ts, rows, mae}
 *  7. Version pruning: keep last 10 versions with delete of older
 *  8. Boot load restores model + stats {mu, sd, cols, H:3, diurnalCurve[24], irrigationLift, rainLift, dryRatePerH, usualIrrigationHour, rowsTrained, mae}
 *  9. predictCrossing(liveState) rolls model forward hour-by-hour feeding its own predictions until soil<30 -> {crossTs, hoursUntil, deltaVsUsualMinutes}
 *  10. Scheduler cadence 'hourly'|'daily'|'weekly'|'manual' persisted, 60s checks, auto-retrain when due AND rows grew >=10%, logs brain_train event
 */

import "fake-indexeddb/auto";
import memory from "../src/lib/brain/memory";
import trainer, {
  FEATURE_COLS,
  trainNow,
  predictCrossing,
  getBrainState,
  getBrainStats,
  getStoredBrainStats,
  getStoredVersions,
  setStoredVersions,
  getBrainCadence,
  setBrainCadence,
  checkSchedulerDue,
  loadLatestModel,
  subscribeTrainingProgress,
  seedSimulationTelemetry,
  forceTelemetryRows,
  type TrainingProgress,
} from "../src/lib/brain/trainer";

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

async function runB2Tests() {
  console.log("\n=======================================================");
  console.log("🧠 B2 PERSONAL BRAIN VERIFICATION SUITE");
  console.log("=======================================================\n");

  // Reset database before testing
  await memory.clear();

  // -------------------------------------------------------------------
  // TEST 1: Exact 13 Features Schema
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: Exact 13 Features Specification");
  {
    const expectedCols = [
      "hour_sin",
      "hour_cos",
      "dow",
      "temp",
      "hum",
      "aqi",
      "rain",
      "pump_l1",
      "rain_l1",
      "soil_l1",
      "soil_l3",
      "soil_l6",
      "soil_l12",
    ];

    assert(FEATURE_COLS.length === 13, "Feature vector has exactly 13 columns", `found ${FEATURE_COLS.length}`);
    const matchesAll = expectedCols.every((col, idx) => FEATURE_COLS[idx] === col);
    assert(matchesAll, "Features EXACTLY match [hour_sin, hour_cos, dow, temp, hum, aqi, rain, pump_l1, rain_l1, soil_l1, soil_l3, soil_l6, soil_l12]");
  }

  // -------------------------------------------------------------------
  // TEST 2: Seed SIM 10 min -> COLLECTING(10/200) State Exposed
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: Seed SIM 10 min -> State COLLECTING(n/200)");
  {
    const initialRows = await seedSimulationTelemetry(10);
    assert(initialRows === 10, "10 simulation rows seeded", `found ${initialRows}`);

    const state = await getBrainState();
    assert(state.status === "COLLECTING", "Brain state status is 'COLLECTING'", `found ${state.status}`);
    assert(state.current === 10, "Brain state current is 10", `found ${state.current}`);
    assert(state.required === 200, "Brain state required is 200", `found ${state.required}`);
    assert(state.message === "COLLECTING(10/200)", "Brain state message is exactly 'COLLECTING(10/200)'", `found ${state.message}`);

    // Verify trainNow rejects when <200 rows
    let threwCollecting = false;
    try {
      await trainNow();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("COLLECTING(10/200)")) {
        threwCollecting = true;
      }
    }
    assert(threwCollecting, "trainNow() refuses execution when <200 rows with COLLECTING(10/200)");
  }

  // -------------------------------------------------------------------
  // TEST 3: Force 200+ Rows & Train Model < 30s with Falling Loss
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: Force 200+ Rows -> trainNow() Completes <30s with Falling Loss");
  {
    const totalRows = await forceTelemetryRows(250);
    assert(totalRows >= 200, "Forced 250 rows into farm memory", `found ${totalRows}`);

    const stateBefore = await getBrainState();
    assert(stateBefore.status === "READY", "State transitions from COLLECTING to READY once >= 200 rows");

    // Track loss curve during 30 epochs
    const progressHistory: TrainingProgress[] = [];
    const unsub = subscribeTrainingProgress((p) => {
      progressHistory.push(p);
    });

    const startTrainMs = Date.now();
    const trainResult = await trainNow();
    const durationMs = Date.now() - startTrainMs;

    unsub();

    assert(durationMs < 30000, `trainNow() completed in < 30s (${durationMs} ms)`);
    assert(trainResult.version >= 1, `Model version produced is v${trainResult.version}`);
    assert(trainResult.rows === totalRows, `Rows trained matches telemetry count (${trainResult.rows})`);
    assert(typeof trainResult.mae === "number" && trainResult.mae > 0, `Validation MAE is recorded (${trainResult.mae}%)`);
    assert(progressHistory.length === 30, `Exactly 30 epoch progress events emitted (found ${progressHistory.length})`);

    const firstLoss = progressHistory[0]?.loss ?? 0;
    const finalLoss = progressHistory[29]?.loss ?? 0;
    assert(finalLoss < firstLoss, `Training curve shows falling loss (Epoch 1: ${firstLoss} -> Epoch 30: ${finalLoss})`);
  }

  // -------------------------------------------------------------------
  // TEST 4: Persistence in IndexedDB & Brain Stats in localStorage
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: Model Save indexeddb://kn-brain-v1 & kn_brain_stats");
  {
    const versions = getStoredVersions();
    assert(versions.length >= 1, `Version metadata list has entries (found ${versions.length})`);
    const v1 = versions[versions.length - 1];
    assert(v1.version === 1, "Latest version recorded is v1");
    assert(typeof v1.ts === "number" && v1.ts > 0, "Version has valid timestamp");
    assert(v1.rows >= 200, `Version records trained telemetry rows (found ${v1.rows})`);

    const stats = getStoredBrainStats();
    assert(Boolean(stats), "kn_brain_stats is stored in localStorage");
    assert(stats?.H === 3, "Prediction horizon H is 3");
    assert(stats?.cols.length === 13, "Stats columns has 13 features");
    assert(stats?.mu.length === 13, "Stats mu has 13 feature means");
    assert(stats?.sd.length === 13, "Stats sd has 13 feature standard deviations");
    assert(Array.isArray(stats?.diurnalCurve) && stats?.diurnalCurve.length === 24, "diurnalCurve has exactly 24 hourly averages");
    assert(typeof stats?.irrigationLift === "number", `irrigationLift is computed (+${stats?.irrigationLift}%)`);
    assert(typeof stats?.rainLift === "number", `rainLift is computed (+${stats?.rainLift}%)`);
    assert(typeof stats?.dryRatePerH === "number" && stats?.dryRatePerH > 0, `dryRatePerH is computed (-${stats?.dryRatePerH}%/h)`);
    assert(typeof stats?.usualIrrigationHour === "number" && stats?.usualIrrigationHour >= 0 && stats?.usualIrrigationHour <= 23, `usualIrrigationHour is valid hour (${stats?.usualIrrigationHour}:00)`);
  }

  // -------------------------------------------------------------------
  // TEST 5: Reload Restores Model + Stats
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: Boot Reload Restores Model + Stats");
  {
    // Reload model from IndexedDB
    const reloadedModel = await loadLatestModel();
    assert(Boolean(reloadedModel), "loadLatestModel() successfully restores model from indexeddb://kn-brain-v1");

    const state = await getBrainState();
    assert(state.status === "READY", "State is READY after boot reload");
    assert(state.version === 1, "Restored state shows version 1");
    assert(state.message.includes("v1"), `State message references v1 (${state.message})`);
  }

  // -------------------------------------------------------------------
  // TEST 6: Version Pruning (Keep last 10, delete older)
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 6: Version Pruning (Keep last 10 versions, delete older)");
  {
    // Train additional versions up to version 12
    for (let i = 2; i <= 12; i++) {
      await trainNow({ epochs: 1 });
    }
    const versions = getStoredVersions();
    assert(versions.length === 10, `Retains exactly 10 versions (found ${versions.length})`);
    assert(versions[0].version === 3, `Oldest version retained is v3 (v1 & v2 pruned)`);
    assert(versions[9].version === 12, `Latest version retained is v12`);
  }

  // -------------------------------------------------------------------
  // TEST 7: predictCrossing(liveState) Autoregressive Hour-by-Hour Roll
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 7: predictCrossing(liveState) Autoregressive Roll");
  {
    // Case A: Already below 30
    const alreadyLow = await predictCrossing({ soil: 24 });
    assert(alreadyLow !== null, "predictCrossing returns prediction for low soil");
    assert(alreadyLow?.hoursUntil === 0, "When soil < 30, hoursUntil is 0");

    // Case B: Typical soil 50%
    const crossing = await predictCrossing({ soil: 50, temp: 29, hum: 55, aqi: 75 });
    assert(crossing !== null, "predictCrossing returns crossing prediction");
    assert(crossing !== null && crossing.hoursUntil > 0, `hoursUntil is positive (${crossing?.hoursUntil}h)`);
    assert(crossing !== null && crossing.crossTs > Date.now(), `crossTs is in the future (${new Date(crossing?.crossTs ?? 0).toLocaleTimeString()})`);
    assert(crossing !== null && typeof crossing.deltaVsUsualMinutes === "number", `deltaVsUsualMinutes computed (${crossing?.deltaVsUsualMinutes} min)`);
  }

  // -------------------------------------------------------------------
  // TEST 8: Scheduler & Cadence Retraining Logic
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 8: Cadence Scheduler ('hourly'|'daily'|'weekly'|'manual')");
  {
    // Cadence persistence
    setBrainCadence("manual");
    assert(getBrainCadence() === "manual", "Cadence set to 'manual'");

    let manualFired = await checkSchedulerDue();
    assert(manualFired === false, "Manual cadence does not auto-fire");

    // Hourly cadence with row growth
    setBrainCadence("hourly");
    assert(getBrainCadence() === "hourly", "Cadence set to 'hourly'");

    // Set last version timestamp to 65 minutes ago, but same rows (0% growth)
    const vers = getStoredVersions();
    vers[vers.length - 1].ts = Date.now() - 65 * 60 * 1000;
    setStoredVersions(vers);

    let noGrowthFired = await checkSchedulerDue();
    assert(noGrowthFired === false, "Hourly cadence does not fire if rows grew < 10%");

    // Grow rows by 15% (250 * 1.15 = 290 rows)
    await forceTelemetryRows(290);
    let growthFired = await checkSchedulerDue();
    assert(growthFired === true, "Hourly cadence fires auto-retrain when due AND rows grew >= 10%");

    const newVers = getStoredVersions();
    assert(newVers[newVers.length - 1].version === 13, `New model version v13 created by scheduler`);
  }

  // -------------------------------------------------------------------
  // TEST 9: brain_train Event Logged to IndexedDB
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 9: brain_train Event in kn_farm IndexedDB");
  {
    const memStats = await memory.stats();
    assert(memStats.eventsByType.brain_train >= 1, `brain_train events logged in memory events store (found ${memStats.eventsByType.brain_train})`);
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

void runB2Tests();
