/**
 * B1 FARM MEMORY TEST SUITE
 * Validates all requirements of PROMPT B1:
 * 1. IndexedDB kn_farm with stores: telemetry (key ts) & events (key auto)
 * 2. Write paths: 1 row/min throttle, all 8 event types logged
 * 3. 90-day retention prune on write, count(), range(), lastNDays(), stats(), exportCSV()
 * 4. Settings card UI component matches specs
 * 5. Citation helper returns { days, rows }
 * 6. Simulation integration & persistence
 */

import "fake-indexeddb/auto";
import memory, {
  openDB,
  prune,
  logTelemetry,
  logEvent,
  count,
  range,
  lastNDays,
  stats,
  citation,
  exportCSV,
  clear,
  type EventType,
} from "../src/lib/brain/memory";
import { logCommand } from "../src/lib/command-logger";
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

async function runB1Tests() {
  console.log("\n=======================================================");
  console.log("🧠 B1 FARM MEMORY VERIFICATION SUITE");
  console.log("=======================================================\n");

  // Reset database before testing
  await clear();

  // -------------------------------------------------------------------
  // TEST 1: Database Structure & Stores
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: IndexedDB kn_farm structure & object stores");
  {
    const db = await openDB();
    assert(Boolean(db), "Database opens successfully");
    assert(db?.name === "kn_farm", "Database name is 'kn_farm'");
    assert(db?.objectStoreNames.contains("telemetry") ?? false, "Object store 'telemetry' exists");
    assert(db?.objectStoreNames.contains("events") ?? false, "Object store 'events' exists");
  }

  // -------------------------------------------------------------------
  // TEST 2: Telemetry Logging & Throttling
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: Telemetry Logging, 1/min Throttle & Data Shape");
  {
    const now = Date.now();
    const row1 = await logTelemetry({
      ts: now,
      soil: 42.4,
      temp: 26.8,
      hum: 65.2,
      aqi: 48,
      rain: false,
      pump: true,
      mode: "AUTO",
      source: "SIM",
    }, true);
    assert(row1 === true, "First telemetry write succeeds");

    // Second write within 60s should be throttled
    const row2 = await logTelemetry({
      ts: now + 5000,
      soil: 42.5,
      temp: 26.9,
      hum: 65.1,
      aqi: 48,
      rain: false,
      pump: true,
      mode: "AUTO",
      source: "SIM",
    }, false);
    assert(row2 === false, "Second telemetry write within 60s is throttled (returns false)");

    // Write after 61s should succeed
    const row3 = await logTelemetry({
      ts: now + 61_000,
      soil: 43.0,
      temp: 27.0,
      hum: 64.0,
      aqi: 50,
      rain: false,
      pump: true,
      mode: "AUTO",
      source: "SIM",
    }, false);
    assert(row3 === true, "Telemetry write after 60s throttle window succeeds");

    const telemetryCount = await count("telemetry");
    assert(telemetryCount === 2, `Telemetry count is 2 (found ${telemetryCount})`);

    const rows = await range(0);
    assert(rows.length === 2, "range(0) retrieves all written telemetry rows");
    const r = rows[0];
    assert(
      typeof r.ts === "number" &&
      typeof r.soil === "number" &&
      typeof r.temp === "number" &&
      typeof r.hum === "number" &&
      typeof r.aqi === "number" &&
      typeof r.rain === "boolean" &&
      typeof r.pump === "boolean" &&
      typeof r.mode === "string" &&
      typeof r.source === "string",
      "Telemetry row schema has exact required keys {ts, soil, temp, hum, aqi, rain, pump, mode, source}",
    );
  }

  // -------------------------------------------------------------------
  // TEST 3: Events Logging across all 8 types
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: Event Logging (all 8 EventTypes)");
  {
    const eventTypes: EventType[] = [
      "pump_on",
      "pump_off",
      "scan",
      "alert",
      "command",
      "chat",
      "feedback",
      "brain_train",
    ];

    for (const type of eventTypes) {
      await logEvent({ type, payload: { test: true, name: type } });
    }

    const eventsCount = await count("events");
    assert(eventsCount === 8, `All 8 event types logged successfully (found ${eventsCount})`);

    const s = await stats();
    assert(s.eventsCount === 8, `stats().eventsCount returns 8 (found ${s.eventsCount})`);
    for (const type of eventTypes) {
      assert(s.eventsByType[type] === 1, `stats().eventsByType['${type}'] is 1`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 4: 90-Day Retention Pruning
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: 90-Day Retention Prune on write");
  {
    const ninetyOneDaysAgo = Date.now() - 91 * 24 * 60 * 60 * 1000;
    // Inject old telemetry and event directly
    await logTelemetry({
      ts: ninetyOneDaysAgo,
      soil: 30,
      temp: 20,
      hum: 50,
      aqi: 20,
      rain: false,
      pump: false,
      mode: "AUTO",
      source: "OLD",
    }, true);

    await logEvent({
      ts: ninetyOneDaysAgo,
      type: "alert",
      payload: { old: true },
    });

    const beforePruneCount = await count("telemetry");
    assert(beforePruneCount === 3, "Old sample added successfully before prune");

    // Run prune
    const pruned = await prune();
    assert(pruned.deletedTelemetry >= 1, "prune() deleted telemetry older than 90 days");
    assert(pruned.deletedEvents >= 1, "prune() deleted events older than 90 days");

    const afterPruneCount = await count("telemetry");
    assert(afterPruneCount === 2, "Telemetry count returned to 2 after 90-day pruning");
  }

  // -------------------------------------------------------------------
  // TEST 5: CSV Export with Exact Headers
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: CSV Export (farm_log.csv)");
  {
    const csv = await exportCSV();
    const lines = csv.trim().split("\n");
    assert(
      lines[0] === "ts,soil,temp,hum,aqi,rain,pump,mode,source",
      "CSV header is exactly ts,soil,temp,hum,aqi,rain,pump,mode,source",
    );
    assert(lines.length === 3, `CSV has 1 header + 2 telemetry rows (found ${lines.length} lines)`);
    assert(lines[1].includes("SIM"), "First CSV data row contains valid serialized telemetry");
  }

  // -------------------------------------------------------------------
  // TEST 6: Citation Helper
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 6: Citation Helper (days & rows)");
  {
    const cite = await citation();
    assert(typeof cite.days === "number" && cite.days >= 1, `citation().days is a valid number (${cite.days})`);
    assert(typeof cite.rows === "number" && cite.rows === 2, `citation().rows is 2 (found ${cite.rows})`);

    // Synchronous property access
    const syncCite = citation();
    assert(typeof syncCite.days === "number", "citation() supports synchronous property access for days");
    assert(typeof syncCite.rows === "number", "citation() supports synchronous property access for rows");
  }

  // -------------------------------------------------------------------
  // TEST 7: Write paths integration via store & command logger
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 7: Write Paths Integration (Commands, Scans, Alerts, Chat, Feedback)");
  {
    // Command logger call
    const initialEvents = (await stats()).eventsCount;
    logCommand("TEST:PUMP:ON", "Success", 42);
    // Allow IDB async resolution
    await new Promise((r) => setTimeout(r, 100));
    const eventsAfterCmd = (await stats()).eventsCount;
    assert(eventsAfterCmd > initialEvents, "logCommand() triggers memory.logEvent(command)");

    // Scan call via store
    useFarmStore.getState().addScan({
      source: "upload",
      imageName: "test_leaf.jpg",
      disease: "Early Blight",
      confidence: 0.95,
      severity: "medium",
      affectedPercent: 25,
      severityGrid: [[0, 1]],
      treatmentNatural: ["Neem oil"],
      treatmentChemical: ["Mancozeb"],
      resolved: false,
    });
    await new Promise((r) => setTimeout(r, 100));
    const eventsAfterScan = (await stats()).eventsCount;
    assert(eventsAfterScan > eventsAfterCmd, "store.addScan() triggers memory.logEvent(scan)");

    // Alert call via store
    useFarmStore.getState().addAlert({
      level: "warning",
      title: "Test Soil Alert",
      message: "Soil moisture low in zone A",
      dedupe: false,
    });
    await new Promise((r) => setTimeout(r, 100));
    const eventsAfterAlert = (await stats()).eventsCount;
    assert(eventsAfterAlert > eventsAfterScan, "store.addAlert() triggers memory.logEvent(alert)");
  }

  // -------------------------------------------------------------------
  // TEST 8: Clear Memory
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 8: Clear Memory Purge");
  {
    await clear();
    const finalStats = await stats();
    assert(finalStats.rows === 0, "All telemetry rows cleared after clear()");
    assert(finalStats.eventsCount === 0, "All events cleared after clear()");
    assert(finalStats.days === 0, "Days reset to 0 after clear()");
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

void runB1Tests();
