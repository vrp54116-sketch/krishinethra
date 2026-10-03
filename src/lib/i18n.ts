import { useMemo } from "react";
import { translations } from "./translations";
import { useFarmStore } from "./store";

const SIMPLE_LABELS: Record<string, string> = {
  "MQTT telemetry": "the farm's WhatsApp messages",
  "Edge AI": "the chip that thinks at the farm",
  "AQI": "air cleanliness score",
  "Air Quality (AQI)": "How clean is the air",
  threshold: "limit",
  stale: "sensor gone silent",
  telemetry: "sensor reports",
  "irrigation agent": "automatic water manager",
  confidence: "how sure the AI is",
  "Soil Moisture": "Water in the soil",
  Temperature: "How hot it is",
  Humidity: "Water in the air",
  "Pump Status": "Water pump",
  "Farm Health Score": "How healthy is the farm",
  "AI Daily Report": "Today's farm notes",
  "Quick Actions": "Things you can do now",
  "Farm Reports": "Farm numbers",
  "Water saved": "Water not used",
  "Money saved": "Money kept",
  "Disease Risk": "Chance of crop sickness",
  "Spray Windows": "Good times to spray",
  "Comfort Gauge": "Is the crop comfortable",
  "Risk Matrix": "Crop risk chart",
  "Weather Forecast": "Weather ahead",
  "Rain Skip": "Skip watering when it rains",
  "Irrigation Schedule": "Watering timetable",
  "Pump Run Log": "When the pump ran",
  "Sensor Health": "Are the sensors working",
  "Live Hardware": "Farm device readings",
  "Simulation Mode": "Practice data",
  "Demo Mode": "Practice mode",
  "Trained Model": "AI taught with leaf pictures",
  "Real API": "Live internet data",
  "Science Rules": "Farm science rules",
  "Soil sensor": "Tool that checks soil water",
  "Temperature sensor": "Tool that checks heat",
  "Humidity sensor": "Tool that checks air dampness",
  "Rain sensor": "Tool that notices rain",
  "Pump relay": "Switch that runs the pump",
  "Buzzer alert": "Sound warning",
  "Leaf disease doctor": "Leaf sickness checker",
  "KrishiGPT": "Ask the farm helper",
  "Open-Meteo": "Internet weather service",
  "Mandi prices": "Market prices",
  "Risk matrix": "Crop risk chart",
  "Spray window": "Good time to spray",
  "Jal Agent": "Automatic water manager",
  "Demo data": "Practice numbers",
  "sensor reports": "sensor notes",
  "sensor gone silent": "sensor has stopped sending notes",
  "automatic irrigation": "automatic watering",
  "pump control": "start and stop the pump",
  "cloud dashboard": "farm page on the internet",
  "Telegram alerts": "phone messages from Telegram",
  "Needs internet": "Needs internet connection",
  "Works with NO internet": "Works without internet",
  "Cost Benefit Calculator": "Money saved with better watering",
  "Cost-benefit estimate": "Money saved estimate",
  "Farm size (acres)": "How much land (acres)",
  "Water price (₹ per 1,000 L)": "Price for 1,000 litres of water",
  "Tomato yield (tonnes per acre)": "Tomatoes grown on one acre",
  "Tomato price (₹ per kg)": "Price for one kilo of tomatoes",
  "Saved each month": "Money kept each month",
  "Water used each day": "Water used in one day",
  "Flood irrigation": "Open-field watering",
  "Season yield increase": "Extra crop this season",
  "Hardware payback": "Days to earn back device cost",
  "System Truth — what is real in this product": "What is real in this farm app",
  "Offline resilience": "What works without internet",
  "System Truth": "What is real in this farm app",
  "Each badge names the actual data source; hardware is called live only when the store reports a fresh live connection.": "Each tag shows where the number comes from. Farm devices say live only when sending fresh readings.",
  Critical: "Needs help now",
  Dry: "Needs water",
  Wet: "Too much water",
  Optimal: "Good amount",
  High: "Too high",
  Normal: "Usual",
  Low: "Too low",
  Poor: "Needs cleaner air",
  Moderate: "Fair",
  Good: "Good",
};

const COST_LABELS: Record<string, string> = {
  "dashboard.airQuality": "Air Quality (AQI)",
  "cost.title": "Cost Benefit Calculator",
  "cost.subtitle": "Cost-benefit estimate",
  "cost.farmSize": "Farm size (acres)",
  "cost.waterPrice": "Water price (₹ per 1,000 L)",
  "cost.yield": "Tomato yield (tonnes per acre)",
  "cost.marketPrice": "Tomato price (₹ per kg)",
  "cost.priceSource": "Price source",
  "cost.monthlySaved": "Saved each month",
  "cost.perMonth": "saved / month",
  "cost.dailyWater": "Water used each day",
  "cost.flood": "Flood irrigation",
  "cost.savedEachDay": "saved each day",
  "cost.seasonUplift": "Season yield increase",
  "cost.yieldUpliftDetail": "Estimated extra tomato value this season",
  "cost.hardwarePayback": "Hardware ₹1,500 recovered in {days} days",
  "offline.title": "Offline resilience",
  "offline.works": "Works with NO internet",
  "offline.worksList": "automatic irrigation, buzzer alerts, leaf disease scan, pump control on farm Wi-Fi",
  "offline.needs": "Needs internet",
  "offline.needsList": "KrishiGPT, weather forecast, cloud dashboard, Telegram alerts",
  "truth.title": "System Truth — what is real in this product",
  "truth.subtitle": "Each badge names the actual data source; hardware is called live only when the store reports a fresh live connection.",
  "truth.feature": "Capability",
  "truth.source": "Data source in plain words",
  "truth.howMade": "Source flag",
  "truth.feature.Soil moisture": "Soil moisture",
  "truth.source.Soil moisture": "Soil probes on the farm device",
  "truth.feature.Temperature": "Temperature",
  "truth.source.Temperature": "Temperature sensor on the farm device",
  "truth.feature.Humidity": "Humidity",
  "truth.source.Humidity": "Humidity sensor on the farm device",
  "truth.feature.Rain detection": "Rain detection",
  "truth.source.Rain detection": "Rain sensor on the farm device",
  "truth.feature.Pump state": "Pump state",
  "truth.source.Pump state": "Pump state reported by the farm device",
  "truth.feature.Buzzer alerts": "Buzzer alerts",
  "truth.source.Buzzer alerts": "Buzzer output on the farm device",
  "truth.feature.Relay control": "Relay control",
  "truth.source.Relay control": "Physical relay connected to the pump",
  "truth.feature.Leaf disease doctor": "Leaf disease doctor",
  "truth.source.Leaf disease doctor": "On-device trained TensorFlow.js leaf model",
  "truth.feature.KrishiGPT": "KrishiGPT",
  "truth.source.KrishiGPT": "Gemini API response; requires internet and a configured key",
  "truth.feature.Weather forecast": "Weather forecast",
  "truth.source.Weather forecast": "Open-Meteo forecast API; requires internet",
  "truth.feature.Mandi prices": "Mandi prices",
  "truth.source.Mandi prices": "data.gov.in market API when configured; demo fallback is labeled",
  "truth.feature.Comfort gauge": "Comfort gauge",
  "truth.source.Comfort gauge": "Calculated from sensor values and agronomy rules",
  "truth.feature.Risk matrix": "Risk matrix",
  "truth.source.Risk matrix": "Rule-based crop risk calculation",
  "truth.feature.Spray windows": "Spray windows",
  "truth.source.Spray windows": "Weather and agronomy rules",
  "truth.feature.Jal Agent thresholds": "Jal Agent thresholds",
  "truth.source.Jal Agent thresholds": "Local configured thresholds control automatic irrigation",
  "truth.feature.Demo mode data": "Demo mode data",
  "truth.source.Demo mode data": "Generated sample readings; never hardware measurements",
};

/** Resolve a dot-path like "nav.dashboard" inside a nested object. */
function getPath(obj: unknown, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/**
 * useT() — translation hook wired to settings.language.
 *
 * Fallback chain: selected language → Hindi → English → key itself.
 * (Gujarati / Marathi dictionaries fall back to Hindi where a key
 * is missing, so the shell never renders an empty label.)
 */
export function useT(): (key: string) => string {
  const language = useFarmStore((s) => s.settings.language);
  const eli5Mode = useFarmStore((s) => s.eli5Mode);

  return useMemo(() => {
    const dict = translations[language];
    const hi = translations.hi;
    const fallbackEn = translations.en;
    return (key: string): string => {
      const translated = getPath(dict, key) ?? getPath(hi, key) ?? getPath(fallbackEn, key) ?? COST_LABELS[key] ?? key;
      return eli5Mode ? SIMPLE_LABELS[translated] ?? translated : translated;
    };
  }, [eli5Mode, language]);
}

/** Non-hook version for use outside React components. */
export function translate(
  language: keyof typeof translations,
  key: string,
): string {
  const dict = translations[language];
  return (
    getPath(dict, key) ??
    getPath(translations.hi, key) ??
    getPath(translations.en, key) ??
    key
  );
}
