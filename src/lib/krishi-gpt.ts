/**
 * krishi-gpt.ts
 * KrishiGPT v1.0 — offline rule-based farm chat engine (no external LLM).
 *
 * Pure functions over the live farm state: every answer interpolates REAL
 * current store values (moisture, temp, tank, pump, scans, diary, market,
 * schemes) so it is visibly connected to the farm, and ends with a
 * follow-up suggestion or question.
 *
 * `askKrishiGPT()` returns plain text (spec signature). `askKrishiGPTDetailed()`
 * returns the same text plus clickable action chips the chat UI renders
 * (pump runs, page links, follow-up questions).
 */

import { generateDailyReport, type DashboardAiState } from "./ai-engine";
import { TANK_CAPACITY_L } from "./simulation-engine";
import { MANDI_PRICES, estimateIncome, formatINR } from "./market-data";
import { recommendSchemes } from "./schemes-data";
import { daysSinceLastFertilizer } from "./agronomy";

/** Live farm slice the engine reads. Structurally satisfied by the store. */
export type FarmState = DashboardAiState;

export interface KrishiGptAction {
  id: string;
  label: string;
  kind: "pump10" | "link" | "ask";
  href?: string;
}

export interface KrishiGptAnswer {
  text: string;
  actions: KrishiGptAction[];
}

/** Scrollable quick-question chips shown above the chat input. */
export const QUICK_QUESTIONS: string[] = [
  "Aaj paani dena chahiye?",
  "Fasal ki sthiti batao",
  "Rog kaise theek karein?",
  "Kal mausam kaisa hai?",
  "Fertilizer kab dena hai?",
  "Aaj ki report sunao",
];

/* ------------------------------------------------------------------ */
/* Small formatters                                                    */
/* ------------------------------------------------------------------ */

function f1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function f0(n: number): string {
  return String(Math.round(n));
}

/** 125 sec → "2 min 5 sec", 45 sec → "45 sec". */
function fmtRun(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} min` : `${m} min ${r} sec`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + n);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function diffDays(aISO: string, bISO: string): number {
  const pa = aISO.split("-").map(Number);
  const pb = bISO.split("-").map(Number);
  const a = new Date(pa[0] || 1970, (pa[1] || 1) - 1, pa[2] || 1).getTime();
  const b = new Date(pb[0] || 1970, (pb[1] || 1) - 1, pb[2] || 1).getTime();
  return Math.round((a - b) / 86400000);
}

const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d || 1} ${MON[(m || 1) - 1]} ${y || 1970}`;
}

function fmtClock(ts: number | null): string {
  if (ts == null) return "abhi tak nahi";
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Intent matching (English + Hindi transliteration + Devanagari)       */
/* ------------------------------------------------------------------ */

function has(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWord(q: string, ...words: string[]): boolean {
  return words.some((w) => new RegExp(`\\b${escRe(w)}\\b`).test(q));
}

type Intent =
  | "pump"
  | "tank"
  | "disease"
  | "fertilizer"
  | "market"
  | "scheme"
  | "weather"
  | "water"
  | "report"
  | "help"
  | "fallback";

function detectIntent(q: string): Intent {
  if (has(q, "pump", "motor", "पंप")) return "pump";
  if (has(q, "tank", "tanki", "टंकी", "refill", "litre", "liter", "लीटर")) return "tank";
  if (
    has(
      q,
      "disease", "rog", "pest", "keed", "kida", "keet",
      "peela", "pila", "yellow", "bimari", "spot", "rust",
      "aphid", "whitefly", "fungus", "fungal", "mildew", "blight",
      "patta", "patte", "daag", "dhabba", "ilaaj", "upchaar",
      "रोग", "पीला", "कीट", "पत्ता", "धब्बा", "इलाज",
    )
  )
    return "disease";
  if (
    has(
      q,
      "fertilizer", "fertiliser", "khaad", "khad", "urea", "dap",
      "npk", "vermicompost", "jeevamrut", "jeevamrit", "compost",
      "neem cake", "dose", "poshan",
      "खाद", "उर्वरक",
    )
  )
    return "fertilizer";
  if (
    has(
      q,
      "market", "mandi", "bhav", "bhaav", "bhao", "bhaao",
      "bazar", "bazaar", "price", "rate", "bech", "sell",
      "income", "vyapar",
      "भाव", "बाज़ार", "बाजार", "मंडी",
    )
  )
    return "market";
  if (
    has(
      q,
      "scheme", "yojana", "yojna", "sarkar", "sarkari", "subsidy",
      "loan", "kcc", "bima", "kusum", "pm-kisan", "pmkisan",
      "pmfby", "enam", "sinchayee", "kisan",
      "योजना", "सरकार", "सब्सिडी", "बीमा", "किसान",
    )
  )
    return "scheme";
  if (
    has(
      q,
      "weather", "mausam", "mausum", "maosam", "forecast",
      "barish", "barsaat", "baarish", "rain",
      "garmi", "thand", "sardi", "temperature", "humidity",
      "temp", "aqi", "hawa",
      "मौसम", "बारिश", "तापमान", "आर्द्रता", "हवा",
    )
  )
    return "weather";
  if (
    has(
      q,
      "water", "moisture", "paani", "pani", "sinchai", "sichai",
      "sichayi", "irrigation", "soil", "mitti", "nami",
      "sukha", "sukhi", "geela",
      "पानी", "सिंचाई", "नमी", "मिट्टी",
    )
  )
    return "water";
  if (
    has(
      q,
      "report", "summary", "sthiti", "status", "health",
      "aaj", "today", "din", "fasal",
      "रिपोर्ट", "स्थिति", "आज", "फसल",
    )
  )
    return "report";
  if (
    has(
      q,
      "help", "madad", "sahay", "example", "kaise use",
      "how to", "how do", "namaste", "hello", "ram ram",
      "shuru", "kya pooch", "kya puch", "kya kar sakte",
      "मदद", "नमस्ते",
    ) ||
    hasWord(q, "hi", "hey")
  )
    return "help";
  return "fallback";
}

/* ------------------------------------------------------------------ */
/* Shared live getters                                                 */
/* ------------------------------------------------------------------ */

function moisture(state: FarmState): { a: number; b: number; c: number } {
  const s = state.snapshot;
  const zA = state.zones.find((z) => z.id === "A");
  const zB = state.zones.find((z) => z.id === "B");
  const zC = state.zones.find((z) => z.id === "C");
  return {
    a: zA?.soilMoisture ?? s.soilMoistureA,
    b: zB?.soilMoisture ?? s.soilMoistureB,
    c: zC?.soilMoisture ?? (s.soilMoistureA + s.soilMoistureB) / 2,
  };
}

function cropOf(state: FarmState, id: "A" | "B" | "C", fallback: string): string {
  return state.zones.find((z) => z.id === id)?.crop ?? fallback;
}

function tankLitres(state: FarmState): number {
  return (state.snapshot.tankLevelPercent / 100) * TANK_CAPACITY_L;
}

const pumpAction: KrishiGptAction = { id: "pump10", label: "Turn Pump ON 10s", kind: "pump10" };

function link(id: string, label: string, href: string): KrishiGptAction {
  return { id, label, href, kind: "link" };
}

/* ------------------------------------------------------------------ */
/* Intent answers — every one embeds live numbers + ends with a nudge  */
/* ------------------------------------------------------------------ */

function answerWater(state: FarmState): KrishiGptAnswer {
  const s = state.snapshot;
  const t = state.settings.thresholds;
  const m = moisture(state);
  const tank = s.tankLevelPercent;
  const tankL = tankLitres(state);

  let verdict: string;
  if (tank < 5) {
    verdict = `Tank sirf ${f0(tank)}% hai — pehle tank bharo, tabhi sinchai hogi, warna pump start nahi hoga.`;
  } else if (m.b < 20) {
    verdict = `HAAN, TURANT paani do — Zone B ${f1(m.b)}% par hai (critical, 20% se bhi kam)!`;
  } else if (m.b < t.moistureLow) {
    verdict = `Haan, aaj paani dena chahiye — Zone B ${f1(m.b)}% hai jo ${t.moistureLow}% threshold se kam hai.`;
  } else if (m.b > t.moistureHigh) {
    verdict = `Abhi paani mat do — Zone B ${f1(m.b)}% hai (${t.moistureHigh}% se zyada, khet geela hai).`;
  } else {
    verdict = `Abhi field theek hai — Zone B ${f1(m.b)}% healthy range me hai, kal phir check karenge.`;
  }

  const text =
    `Paani report (LIVE): Zone A (${cropOf(state, "A", "Tomato")}) ${f1(m.a)}%, ` +
    `Zone B (${cropOf(state, "B", "Chili")}) ${f1(m.b)}%, Zone C (${cropOf(state, "C", "Spinach")}) ${f1(m.c)}%. ` +
    `Limit: ${t.moistureLow}% se kam = paani do, ${t.moistureHigh}% se zyada = roko. ${verdict} ` +
    `Pump abhi ${state.pump.running ? "RUNNING hai" : `band hai (${state.pump.mode} mode)`}, ` +
    `tank ${f0(tank)}% (${f1(tankL)}/${TANK_CAPACITY_L} L). Kya main pump 10 second ke liye chala doon?`;

  return { text, actions: [pumpAction, link("goto-irrigation", "Go to Irrigation", "/irrigation")] };
}

function answerDisease(state: FarmState): KrishiGptAnswer {
  const scans = state.scans;
  const score = Math.round(state.farmHealthScore);
  const activePlans = state.sprayPlans.filter((p) => p.status === "active");
  const latest = scans[0];

  if (!latest) {
    const text =
      `Rog report (LIVE): abhi tak koi leaf scan record nahi hai aur koi active rog nahi dikh raha. ` +
      `Farm health ${score}/100 hai. Behtar hoga Camera se patte scan karo taaki rog jaldi pakda jaye. ` +
      `Kya naya leaf scan karna hai?`;
    return {
      text,
      actions: [link("goto-camera", "Scan a Leaf", "/camera"), link("goto-spray", "Spray Planner", "/spray")],
    };
  }

  const conf = f0(latest.confidence * 100);
  const plan = activePlans.find((p) => p.disease.toLowerCase().includes(latest.disease.split(" ")[0].toLowerCase())) ?? activePlans[0];
  const nextStep = plan?.steps.find((st) => !st.done);
  const natural = latest.treatmentNatural[0] ?? "Neem oil 5 ml/L — sham ko spray karo.";
  const planBit = plan
    ? `Active spray plan: ${plan.disease} (Zone ${plan.zone}), Day ${nextStep ? `${nextStep.day} pending — "${nextStep.action}"` : "saare steps pure"}`
    : `Koi active spray plan nahi hai (${activePlans.length} active) — Spray Planner me naya plan banao.`;

  const text =
    `Rog report (LIVE): latest scan "${latest.disease}" — ${latest.severity} severity, ` +
    `${latest.affectedPercent}% patte affected, ${conf}% confidence${latest.resolved ? " (resolved)" : ""}. ` +
    `${planBit}. Ilaaj: ${natural} Farm health abhi ${score}/100 hai. ` +
    (nextStep
      ? `Kya aaj Day ${nextStep.day} wala spray step karna chahenge?`
      : `Kya Spray Planner khol kar schedule dekhna chahenge?`);

  return {
    text,
    actions: [link("goto-spray", "Open Spray Plan", "/spray"), link("goto-camera", "Scan New Leaf", "/camera")],
  };
}

function answerFertilizer(state: FarmState): KrishiGptAnswer {
  const diary = state.diary;
  const fertDates = diary
    .filter((d) => d.type === "fertilizer")
    .map((d) => d.date)
    .sort();
  const last = fertDates.length > 0 ? fertDates[fertDates.length - 1] : null;
  const lastDays = daysSinceLastFertilizer(diary);
  const today = todayISO();

  let dueLine: string;
  if (last == null) {
    dueLine = `diary me koi khaad record nahi hai — 15-din cycle se aaj se gino, pehli dose abhi plan karo`;
  } else {
    const nextDue = addDaysISO(last, 15);
    const d = diffDays(nextDue, today);
    if (d < 0) dueLine = `${-d} din OVERDUE hai (due ${fmtDate(nextDue)} tha) — aaj hi dose do`;
    else if (d === 0) dueLine = `AAJ DUE hai (${fmtDate(nextDue)}) — aaj hi dose do`;
    else dueLine = `${d} din baad (${fmtDate(nextDue)}) due hai`;
  }

  const text =
    `Khad report: pichhli dose ${last ? `${fmtDate(last)} (${lastDays ?? "?"} din pehle)` : "record nahi"}. ` +
    `Agli dose ${dueLine}. Aam sabzi cycle 15 din ka hai. Best time: subah 6-8 ya sham 5-7 baje, geeli mitti me. ` +
    `Exact g/plant dose (vermicompost + NPK) ke liye calculator use karo. Kya fertilizer calculator khol doon?`;

  return { text, actions: [link("goto-fertilizer", "Open Calculator", "/fertilizer")] };
}

function answerWeather(state: FarmState): KrishiGptAnswer {
  const s = state.snapshot;
  const m = moisture(state);
  const tank = s.tankLevelPercent;
  const rainProb = s.humidity > 72 ? 55 : s.humidity > 55 ? 25 : 10;
  const tMax = s.tempC + 2.5;
  const tMin = tMax - 8;

  const rainAdvice =
    s.rainMm > 0.2
      ? `${f1(s.rainMm)} mm barish ho rahi hai — aaj sinchai SKIP karo, muft ka paani!`
      : rainProb >= 50
        ? `Barish chance ~${rainProb}% hai — pump rok kar rakho, kal phir dekho.`
        : `Barish chance sirf ~${rainProb}% hai — moisture ke hisab se sinchai karo (Zone B ${f1(m.b)}%).`;

  const text =
    `Mausam (LIVE sensor): ${f1(s.tempC)}°C, ${f1(s.humidity)}% nami, ${f1(s.rainMm)} mm barish, AQI ${f0(s.aqi)}. ` +
    `Aaj ka offline anumaan: max ~${f1(tMax)}°C / min ~${f1(tMin)}°C, barish chance ~${rainProb}%. ` +
    `${rainAdvice} Tank ${f0(tank)}% bhari hai. Kya sinchai ki final salah moisture se jod kar bataoon?`;

  return { text, actions: [link("goto-climate", "Open Climate", "/climate")] };
}

function answerPump(state: FarmState): KrishiGptAnswer {
  const p = state.pump;
  const s = state.snapshot;
  const m = moisture(state);
  const run = `${fmtRun(p.totalRunSeconds)} (${f0(p.totalRunSeconds)} sec total)`;
  const water = state.totalWaterUsedL.toFixed(2);

  const suggestion =
    s.tankLevelPercent < 5
      ? `Tank ${f0(s.tankLevelPercent)}% hai — pehle refill karo, warna pump start nahi hoga.`
      : p.running
        ? `Pump chal raha hai — nami badh rahi hai, band hone do.`
        : `Zone B ${f1(m.b)}% hai — 10-sec test run karna hai?`;

  const text =
    `Pump (LIVE): abhi ${p.running ? "RUNNING hai" : "band hai"}, mode ${p.mode === "auto" ? "Auto AI" : p.mode}. ` +
    `Aaj kul ${run} chala, ${water} L paani istemal hua, flow ${f1(s.flowRateLpm)} L/min. ` +
    `Last run: ${fmtClock(p.lastRunAt)}. Zone B nami ${f1(m.b)}%, tank ${f0(s.tankLevelPercent)}%. ${suggestion}`;

  return { text, actions: [pumpAction, link("goto-irrigation", "Go to Irrigation", "/irrigation")] };
}

function answerTank(state: FarmState): KrishiGptAnswer {
  const s = state.snapshot;
  const low = state.settings.thresholds.tankLow;
  const tank = s.tankLevelPercent;
  const litres = tankLitres(state);

  const advice =
    tank < 5
      ? `CRITICAL — ${f0(tank)}% par pump NAHI chal sakta. Turant refill karo!`
      : tank < low
        ? `${low}% limit se kam hai — jald refill karo taaki sinchai na ruke.`
        : `${low}% limit se upar hai — refill ki chinta nahi, aaram se sinchai karo.`;

  const text =
    `Tank (LIVE): ${f0(tank)}% bhari = ${f1(litres)}/${TANK_CAPACITY_L} L paani bacha hai. ${advice} ` +
    `Aaj ab tak ${state.totalWaterUsedL.toFixed(2)} L kharch hua hai. Tank full karke pump chalana hai?`;

  return { text, actions: [link("goto-irrigation", "Go to Irrigation", "/irrigation")] };
}

function answerReport(state: FarmState): KrishiGptAnswer {
  const para = generateDailyReport(state);
  const text =
    `${para}\n\nKisi khaas cheez par detail chahiye to poochho — jaise "Zone B ka paani" ya "rog ka ilaaj"?`;
  return { text, actions: [link("goto-reports", "Open Reports", "/reports")] };
}

function answerMarket(state: FarmState): KrishiGptAnswer {
  const profile = state.settings.farmProfile ?? {
    state: "Gujarat",
    farmSizeAcres: 1,
    hasPump: true,
    crops: ["tomato", "chili", "spinach"],
  };
  const wanted = profile.crops.length > 0 ? profile.crops : ["tomato", "chili", "spinach"];
  const found = wanted
    .map((id) => MANDI_PRICES.find((x) => x.id === id.toLowerCase()))
    .filter((x): x is (typeof MANDI_PRICES)[number] => Boolean(x));
  const list = found.length > 0 ? found : MANDI_PRICES.slice(0, 3);

  const bits = list.map((x) => {
    const arrow = x.trend === "up" ? "↑" : x.trend === "down" ? "↓" : "→";
    return `${x.crop} ${formatINR(x.modal)}/qtl ${arrow}${Math.abs(x.changePercent)}% (7-day)`;
  });

  const first = list[0];
  const tip =
    first.trend === "up"
      ? `${first.crop} me tezi hai — taiyar maal 3-4 din me bech do.`
      : first.trend === "down"
        ? `${first.crop} me girawat hai — pakka maal turant harvest karke becho.`
        : `${first.crop} steady hai — 2-3 din ke gap me harvest chalao.`;

  const text =
    `Bazaar bhav (aapki faslein): ${bits.join("; ")}. ${tip} ` +
    `Andaza: 20 kg ${first.crop} ≈ ${formatINR(estimateIncome(20, first.modal))} (modal rate par). ` +
    `Kya Market page par 7-day chart dekhna chahenge?`;

  return { text, actions: [link("goto-market", "Open Market", "/market")] };
}

function answerScheme(state: FarmState): KrishiGptAnswer {
  const profile = state.settings.farmProfile ?? {
    state: "Gujarat",
    farmSizeAcres: 1,
    hasPump: true,
    crops: ["tomato", "chili", "spinach"],
  };
  const top = recommendSchemes(profile)[0];

  const text =
    `Yojana (aapke ${profile.farmSizeAcres}-acre ${profile.state} farm ke liye): TOP pick — ` +
    `${top.scheme.shortName} (${top.scheme.name}): ${top.scheme.benefit} Kyun: ${top.reason} ` +
    `Apply: ${top.scheme.howToApply[0]} Kya top-3 schemes Schemes page par dekhni hain?`;

  return { text, actions: [link("goto-schemes", "Open Schemes", "/schemes")] };
}

function answerHelp(): KrishiGptAnswer {
  const text =
    `Namaste! Main KrishiGPT hoon — aapke LIVE farm data se jawab deta hoon: ` +
    `paani, rog, khaad, mausam, pump, tanki, bazaar bhav, yojana aur daily report. ` +
    `Neeche chips se sawal chunein:\n${QUICK_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n` +
    `Shuruat ke liye — aaj ki report sunau?`;

  return {
    text,
    actions: QUICK_QUESTIONS.map((q, i) => ({ id: `ask-${i}`, label: q, kind: "ask" as const })),
  };
}

function answerFallback(state: FarmState): KrishiGptAnswer {
  const m = moisture(state);
  const text =
    `Ye sawal samajh nahi aaya. I can help with: water (paani), disease (rog), fertilizer (khaad), ` +
    `weather (mausam), pump, tank, market (bhav), schemes (yojana), daily report. / ` +
    `Main inme madad kar sakta hoon: paani, rog, khaad, mausam, pump, tanki, bazaar bhav, yojana, daily report. ` +
    `Abhi LIVE: health ${f0(state.farmHealthScore)}/100, Zone B ${f1(m.b)}% nami, tank ${f0(state.snapshot.tankLevelPercent)}%. ` +
    `Try: "Aaj paani dena chahiye?" — kya paani par salah doon?`;

  return {
    text,
    actions: [
      { id: "ask-water", label: QUICK_QUESTIONS[0], kind: "ask" },
      { id: "ask-report", label: QUICK_QUESTIONS[5], kind: "ask" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Full rule-based answer: live text + clickable action chips. */
export function askKrishiGPTDetailed(question: string, state: FarmState): KrishiGptAnswer {
  const q = question.toLowerCase().trim();
  switch (detectIntent(q)) {
    case "pump":
      return answerPump(state);
    case "tank":
      return answerTank(state);
    case "disease":
      return answerDisease(state);
    case "fertilizer":
      return answerFertilizer(state);
    case "market":
      return answerMarket(state);
    case "scheme":
      return answerScheme(state);
    case "weather":
      return answerWeather(state);
    case "water":
      return answerWater(state);
    case "report":
      return answerReport(state);
    case "help":
      return answerHelp();
    default:
      return answerFallback(state);
  }
}

/** Plain-text answer built from live farm state (offline, no LLM). */
export function askKrishiGPT(question: string, state: FarmState): string {
  return askKrishiGPTDetailed(question, state).text;
}
