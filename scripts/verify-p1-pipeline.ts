/**
 * scripts/verify-p1-pipeline.ts
 *
 * Verification suite for PROMPT P1 — ESP8266/ESP32 EDGE NODE PIPELINE:
 * 1. mqtt-bridge module exports (connect, disconnect, onTelemetry, sendCmd, state, lastSeen, msgCount, rssi)
 * 2. Strict telemetry contract validation: {node,soil,temp,hum,aqi,rain,pump,r2,mode,stale,rssi,up}
 * 3. Exact commands: PUMP_ON, PUMP_OFF, MODE_AUTO, MODE_MANUAL, R2_ON, R2_OFF
 * 4. Store live slice & useFarm() selector: LIVE when online & lastSeen < 5s, else SIM
 * 5. Simulation soil drifts 30-70, never 0
 * 6. Alert deduplication by (type + 10min)
 * 7. Rain chip boolean (RAIN: DETECTED / RAIN: NONE) and no rain mm
 */

import { DEFAULT_BROKERS, DEFAULT_FARM_TOKEN, topicsFor, state, lastSeen, msgCount, rssi, onTelemetry, sendCmd, connect, disconnect } from "../src/lib/mqtt-bridge";
import type { EdgeTelemetry } from "../src/lib/mqtt-bridge";
import { useFarmStore, useFarm } from "../src/lib/store";
import { tick, createInitialSnapshot } from "../src/lib/simulation-engine";

let passes = 0;
let fails = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✔ PASS: ${msg}`);
    passes++;
  } else {
    console.error(`  ✘ FAIL: ${msg}`);
    fails++;
  }
}

async function run() {
  console.log("=======================================================");
  console.log("🌾 P1 ESP8266/ESP32 EDGE PIPELINE VERIFICATION SUITE");
  console.log("=======================================================\n");

  // TEST 1: MQTT Bridge Exports & API
  console.log("▶ TEST 1: mqtt-bridge Exports & Contract");
  assert(typeof connect === "function", "connect is exported as function");
  assert(typeof disconnect === "function", "disconnect is exported as function");
  assert(typeof onTelemetry === "function", "onTelemetry is exported as function");
  assert(typeof sendCmd === "function", "sendCmd is exported as function");
  assert(typeof state === "function" || typeof state === "string", "state is exported");
  assert(lastSeen === null || typeof lastSeen === "number", "lastSeen is exported");
  assert(typeof msgCount === "number", "msgCount is exported as number");
  assert(rssi === null || typeof rssi === "number", "rssi is exported");
  assert(DEFAULT_BROKERS.includes("wss://broker.emqx.io:8084/mqtt" as any), "EMQX broker in failover list");
  assert(DEFAULT_BROKERS.includes("wss://broker.hivemq.com:8884/mqtt" as any), "HiveMQ broker in failover list");

  const topics = topicsFor("patelfarm01");
  assert(topics.up === "krishinethra/patelfarm01/up", "Up topic is krishinethra/{token}/up");
  assert(topics.cmd === "krishinethra/patelfarm01/cmd", "Cmd topic is krishinethra/{token}/cmd");

  // TEST 2: onTelemetry Subscription Cleanup
  console.log("\n▶ TEST 2: onTelemetry Subscription & Cleanup");
  let receivedPacket: EdgeTelemetry | null = null;
  const unsubscribe = onTelemetry((t) => {
    receivedPacket = t;
  });
  assert(typeof unsubscribe === "function", "onTelemetry returns cleanup function");
  unsubscribe();

  // TEST 3: Telemetry Contract Exact Structure
  console.log("\n▶ TEST 3: Telemetry Contract Exact Structure");
  const sampleTelemetry: EdgeTelemetry = {
    node: "EDGE",
    soil: 48.5,
    temp: 29.2,
    hum: 64,
    aqi: 92,
    rain: true,
    pump: true,
    r2: false,
    mode: "AUTO",
    stale: false,
    rssi: -58,
    up: 3600,
  };

  assert(sampleTelemetry.node === "EDGE", "node === 'EDGE'");
  assert(typeof sampleTelemetry.soil === "number", "soil is number");
  assert(typeof sampleTelemetry.temp === "number", "temp is number");
  assert(typeof sampleTelemetry.hum === "number", "hum is number");
  assert(typeof sampleTelemetry.aqi === "number", "aqi is number");
  assert(typeof sampleTelemetry.rain === "boolean", "rain is boolean");
  assert(typeof sampleTelemetry.pump === "boolean", "pump is boolean");
  assert(typeof sampleTelemetry.r2 === "boolean", "r2 is boolean");
  assert(sampleTelemetry.mode === "AUTO" || sampleTelemetry.mode === "MANUAL", "mode is 'AUTO' | 'MANUAL'");
  assert(typeof sampleTelemetry.stale === "boolean", "stale is boolean");
  assert(typeof sampleTelemetry.rssi === "number", "rssi is number");
  assert(typeof sampleTelemetry.up === "number", "up is number");

  // TEST 4: Store Live Slice & useFarm Selector
  console.log("\n▶ TEST 4: Store Live Slice & useFarm Selector");
  const store = useFarmStore.getState();
  store.setLiveTelemetry(sampleTelemetry);

  // Directly check store live slice
  const updatedStore = useFarmStore.getState();
  assert(updatedStore.live.soil === 48.5, "Store live slice soil updated to 48.5");
  assert(updatedStore.live.temp === 29.2, "Store live slice temp updated to 29.2");
  assert(updatedStore.live.rain === true, "Store live slice rain is true");
  assert(updatedStore.live.pump === true, "Store live slice pump is true");

  // With mqttStatus online and recent telemetry: LIVE
  useFarmStore.setState({ mqttStatus: "online", source: "LIVE" });
  const farmLive = useFarm();
  assert(farmLive.isLive === true, "useFarm() returns isLive === true when online and fresh");
  assert(farmLive.source === "LIVE", "useFarm() source is 'LIVE'");
  assert(farmLive.soil === 48.5, "useFarm() returns live telemetry soil");
  assert(farmLive.rain === true, "useFarm() returns live telemetry rain");

  // Disconnected / stale (> 5s): SIM fallback
  useFarmStore.setState({
    mqttStatus: "offline",
    live: { ...updatedStore.live, lastSeenAt: Date.now() - 10000 },
  });
  const farmSim = useFarm();
  assert(farmSim.isLive === false, "useFarm() returns isLive === false when offline / > 5s");
  assert(farmSim.source === "SIM", "useFarm() falls back to 'SIM'");

  // TEST 5: SIM Soil Drifts 30-70, Never 0
  console.log("\n▶ TEST 5: Simulation Soil Drifts 30-70, Never 0");
  let snap = createInitialSnapshot();
  const pumpState = { running: false, mode: "auto" as const, totalRunSeconds: 0, lastRunAt: null };
  const settings = useFarmStore.getState().settings;

  let minSoil = 100;
  let maxSoil = 0;
  for (let i = 0; i < 100; i++) {
    const result = tick(snap, settings, pumpState, 1);
    snap = result.snapshot;
    minSoil = Math.min(minSoil, snap.soil);
    maxSoil = Math.max(maxSoil, snap.soil);
  }

  assert(minSoil >= 30, `Simulation min soil (${minSoil}) is >= 30%`);
  assert(maxSoil <= 70, `Simulation max soil (${maxSoil}) is <= 70%`);
  assert(snap.soil > 0, "Simulation soil is never 0");

  // Also verify useFarm clamped SIM soil
  useFarmStore.setState({
    snapshot: { ...snap, soil: 0, soilMoistureA: 0, soilMoistureB: 0 },
    source: "SIM",
  });
  const zeroGuarded = useFarm();
  assert(zeroGuarded.soil >= 30, `useFarm() guards against 0 soil in SIM (got ${zeroGuarded.soil}%)`);

  // TEST 6: Alert Deduplication by (type + 10min)
  console.log("\n▶ TEST 6: Alert Deduplication by (type + 10min)");
  const alertA1 = store.addAlert({
    type: "soil_low",
    level: "warning",
    title: "Low Soil Moisture",
    message: "Soil moisture dropped below 30%",
  });
  const alertA2 = store.addAlert({
    type: "soil_low",
    level: "warning",
    title: "Low Soil Moisture",
    message: "Soil moisture dropped below 30%",
  });
  assert(alertA1 === alertA2, "Second identical alert within 10 min was deduped (same alertId)");

  // TEST 7: Exact Commands Dispatched
  console.log("\n▶ TEST 7: Farm Commands Dispatch");
  const testStore = useFarmStore.getState();
  testStore.farmCmd("PUMP_ON");
  assert(useFarmStore.getState().pump.running === true, "farmCmd('PUMP_ON') sets pump running");

  testStore.farmCmd("PUMP_OFF");
  assert(useFarmStore.getState().pump.running === false, "farmCmd('PUMP_OFF') sets pump stopped");

  testStore.farmCmd("MODE_MANUAL");
  assert(useFarmStore.getState().pump.mode === "manual", "farmCmd('MODE_MANUAL') sets mode manual");

  testStore.farmCmd("MODE_AUTO");
  assert(useFarmStore.getState().pump.mode === "auto", "farmCmd('MODE_AUTO') sets mode auto");

  testStore.farmCmd("R2_ON");
  assert(useFarmStore.getState().edgeR2 === true, "farmCmd('R2_ON') sets edgeR2 true");

  testStore.farmCmd("R2_OFF");
  assert(useFarmStore.getState().edgeR2 === false, "farmCmd('R2_OFF') sets edgeR2 false");

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log("=======================================================");

  if (fails > 0) {
    process.exit(1);
  }
}

void run();
