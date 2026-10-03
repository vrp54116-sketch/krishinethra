import type { LayersModel, Tensor } from "@tensorflow/tfjs";

export interface RiskResult {
  level: "High" | "Low" | "none";
  isHigh: boolean;
  text: string;
  toString(): string;
  valueOf(): string;
}

function makeRisk(level: "High" | "Low" | "none", isHigh: boolean, text: string): RiskResult {
  return {
    level,
    isHigh,
    text,
    toString() {
      return this.text;
    },
    valueOf() {
      return this.text;
    },
  };
}

export interface DiseaseInfoItem {
  friendly: string;
  scientific: string;
  natural: string;
  chemical: string;
  prevention: string[];
  risk: (tempC: number, humPct: number) => RiskResult;
}

/**
 * 11 Class labels in EXACT training order (Teachable Machine export)
 */
export const CLASS_LABELS = [
  "Tomato___healthy",
  "Tomato___Tomato_mosaic_virus",
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
  "Tomato___Target_Spot",
  "Tomato___Spider_mites Two-spotted_spider_mite",
  "Tomato___Septoria_leaf_spot",
  "Tomato___Leaf_Mold",
  "Tomato___Late_blight",
  "Tomato___Early_blight",
  "Tomato___Bacterial_spot",
  "Not A Leaf",
] as const;

export type ClassLabel = (typeof CLASS_LABELS)[number];

export const DISEASE_INFO: Record<string, DiseaseInfoItem> = {
  Tomato___healthy: {
    friendly: "Healthy Leaf",
    scientific: "Solanum lycopersicum",
    natural: "No action needed. Continue current care, regular scouting, and balanced irrigation.",
    chemical: "None required",
    prevention: [
      "Keep 60 cm spacing",
      "Water at base, not overhead",
      "Mulch to stop soil splash",
    ],
    risk: () => makeRisk("none", false, "none"),
  },
  Tomato___Early_blight: {
    friendly: "Early Blight",
    scientific: "Alternaria solani",
    natural: "Neem oil 5 ml/L weekly + remove and burn infected lower leaves",
    chemical: "Mancozeb 2 g/L, 7-day pre-harvest interval",
    prevention: [
      "Mulch soil",
      "Stake plants for airflow",
      "Rotate crops next season",
    ],
    risk: (tempC, humPct) => {
      const isHigh = tempC > 24 && humPct > 70;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires temp > 24°C & hum > 70%)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Late_blight: {
    friendly: "Late Blight",
    scientific: "Phytophthora infestans",
    natural: "Copper oxychloride 3 g/L every 7 days + destroy infected plants immediately",
    chemical: "Chlorothalonil 2 g/L in severe outbreaks",
    prevention: [
      "Never water overhead",
      "Resistant varieties",
      "Wide spacing",
    ],
    risk: (tempC, humPct) => {
      const isHigh = humPct > 85 && tempC >= 10 && tempC <= 25;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires hum > 85% & temp 10–25°C)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Leaf_Mold: {
    friendly: "Leaf Mold",
    scientific: "Passalora fulva",
    natural: "Increase ventilation + reduce humidity + Trichoderma viride soil drench",
    chemical: "Chlorothalonil 2 g/L",
    prevention: [
      "Prune lower leaves",
      "Ventilate greenhouse",
      "Resistant varieties",
    ],
    risk: (tempC, humPct) => {
      const isHigh = humPct > 80 && tempC > 20;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires hum > 80% & temp > 20°C)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Septoria_leaf_spot: {
    friendly: "Septoria Leaf Spot",
    scientific: "Septoria lycopersici",
    natural: "Remove and burn infected leaves + mulch to stop splash",
    chemical: "Mancozeb 2 g/L",
    prevention: [
      "Crop rotation 2 years",
      "Drip irrigation only",
    ],
    risk: (tempC, humPct) => {
      const isHigh = humPct > 75 && tempC >= 20 && tempC <= 30;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires hum > 75% & temp 20–30°C)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Bacterial_spot: {
    friendly: "Bacterial Spot",
    scientific: "Xanthomonas spp.",
    natural: "Copper oxychloride 3 g/L weekly + remove infected leaves",
    chemical: "Copper + mancozeb tank mix",
    prevention: [
      "Certified disease-free seed",
      "Rotate crops 2 years",
      "Avoid working in wet plants",
    ],
    risk: (tempC, humPct) => {
      const isHigh = humPct > 80 && tempC > 25;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires hum > 80% & temp > 25°C)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Target_Spot: {
    friendly: "Target Spot",
    scientific: "Corynespora cassiicola",
    natural: "Prune infected leaves + improve airflow",
    chemical: "Mancozeb 2 g/L",
    prevention: [
      "Stake plants",
      "Sanitize tools",
    ],
    risk: (tempC, humPct) => {
      const isHigh = humPct > 80 && tempC >= 22 && tempC <= 30;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires hum > 80% & temp 22–30°C)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  "Tomato___Spider_mites Two-spotted_spider_mite": {
    friendly: "Spider Mites",
    scientific: "Tetranychus urticae",
    natural: "Strong water spray under leaves + neem 5 ml/L + insectic soap",
    chemical: "Abamectin only if severe",
    prevention: [
      "Raise humidity slightly",
      "Remove weeds",
      "Check leaf undersides weekly",
    ],
    risk: (tempC, humPct) => {
      const isHigh = tempC > 30 && humPct < 40;
      const text = isHigh
        ? `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = high spread conditions`
        : `hum ${Math.round(humPct)}% + temp ${Math.round(tempC)}°C = low spread conditions (requires temp > 30°C & hum < 40%)`;
      return makeRisk(isHigh ? "High" : "Low", isHigh, text);
    },
  },
  Tomato___Tomato_mosaic_virus: {
    friendly: "Mosaic Virus (ToMV)",
    scientific: "Tomato mosaic virus",
    natural:
      "NO CURE — pull and burn the plant; wash hands and tools with milk or trisodium phosphate before touching other plants",
    chemical: "None effective against viruses",
    prevention: [
      "Resistant varieties",
      "Control aphids",
      "Do not smoke near plants",
    ],
    risk: () => makeRisk("High", true, "spreads by touch — isolate now"),
  },
  Tomato___Tomato_Yellow_Leaf_Curl_Virus: {
    friendly: "Yellow Leaf Curl Virus (TYLCV)",
    scientific: "Tomato yellow leaf curl virus (TYLCV)",
    natural:
      "NO CURE — remove plant; yellow sticky traps + neem for whitefly vector",
    chemical: "None effective against viruses",
    prevention: [
      "Insect net house",
      "Resistant varieties",
      "Remove weeds hosting whitefly",
    ],
    risk: () => makeRisk("High", true, "whitefly spreads it — trap now"),
  },
  "Not A Leaf": {
    friendly: "Not A Leaf",
    scientific: "-",
    natural: "Please upload a clear photo of ONE tomato leaf on a plain background.",
    chemical: "None required",
    prevention: [],
    risk: () => makeRisk("none", false, "none"),
  },
};

// Module-level model cache to ensure it loads ONCE per session
let cachedModel: LayersModel | null = null;
let modelPromise: Promise<LayersModel | null> | null = null;
let activeLabels: string[] = [...CLASS_LABELS];

export function getLoadedLabels(): string[] {
  return activeLabels;
}

/**
 * Loads the TensorFlow.js model:
 * Tries tf.loadLayersModel('/model/tomato/model.json') first,
 * falls back to '/model/model.json'.
 * Caches in a module variable so it loads ONCE per session.
 * Returns null on failure.
 */
export async function loadModel(): Promise<LayersModel | null> {
  if (cachedModel) {
    return cachedModel;
  }
  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const tf = await import("@tensorflow/tfjs");
      await tf.ready();

      let model: LayersModel | null = null;

      // 1. Try /model/tomato/model.json first
      try {
        model = await tf.loadLayersModel("/model/tomato/model.json");
        try {
          const metaRes = await fetch("/model/tomato/metadata.json");
          if (metaRes.ok) {
            const meta = await metaRes.json();
            if (Array.isArray(meta?.labels) && meta.labels.length > 0) {
              activeLabels = meta.labels;
            }
          }
        } catch {
          // ignore, activeLabels default to CLASS_LABELS
        }
      } catch (e1) {
        console.warn("Could not load /model/tomato/model.json, trying fallback /model/model.json", e1);
        // 2. Fallback to /model/model.json
        try {
          model = await tf.loadLayersModel("/model/model.json");
          try {
            const metaRes = await fetch("/model/metadata.json");
            if (metaRes.ok) {
              const meta = await metaRes.json();
              if (Array.isArray(meta?.labels) && meta.labels.length > 0) {
                activeLabels = meta.labels;
              }
            }
          } catch {
            // ignore
          }
        } catch (e2) {
          console.error("Failed to load /model/model.json fallback:", e2);
          return null;
        }
      }

      cachedModel = model;
      return model;
    } catch (err) {
      console.error("loadModel exception:", err);
      return null;
    } finally {
      if (!cachedModel) {
        modelPromise = null;
      }
    }
  })();

  return modelPromise;
}

export interface LeafClassification {
  label: string;
  friendly: string;
  scientific: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  spreadRisk: "High" | "Low" | "none";
  spreadRiskText: string;
  natural: string;
  chemical: string;
  prevention: string[];
  isRejected: boolean;
  rejectionMessage: string | null;
  allProbabilities: { label: string; friendly: string; probability: number }[];
}

/**
 * REJECTION RULE:
 * If label === "Not A Leaf" OR confidence < 0.60 -> reject
 */
export const REJECTION_MESSAGE =
  "⚠️ This does not look like a leaf. Please upload a clear photo of ONE tomato leaf on a plain background.";

/**
 * Helper to compute severity from confidence percentage:
 * conf < 70 Low, 70-85 Medium, > 85 High
 */
export function computeSeverity(confidence: number): "Low" | "Medium" | "High" {
  const pct = Math.round(confidence * 100);
  if (pct < 70) return "Low";
  if (pct <= 85) return "Medium";
  return "High";
}

/**
 * Classifies an image element, video element, or canvas:
 * 1. Draws image to 224x224 canvas
 * 2. Tensor /255, expandDims
 * 3. model.predict -> index -> CLASS_LABELS[index]
 * 4. Applies rejection rule if label === "Not A Leaf" OR confidence < 0.60
 */
export async function classifyLeafImage(
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
  tempC: number = 22,
  humPct: number = 65
): Promise<LeafClassification | null> {
  const model = await loadModel();
  if (!model) return null;

  const tf = await import("@tensorflow/tfjs");

  // Draw image to 224x224 canvas
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context.");
  }
  ctx.drawImage(source, 0, 0, 224, 224);

  // Tensor /255, expandDims
  const tensor = tf.tidy(() => {
    const img = tf.browser.fromPixels(canvas);
    const normalized = img.toFloat().div(tf.scalar(255.0));
    return normalized.expandDims(0);
  });

  const prediction = model.predict(tensor) as Tensor;
  const rawData = await prediction.data();
  const probabilities = Array.from(rawData);

  tensor.dispose();
  prediction.dispose();

  const labels = getLoadedLabels();
  let maxIdx = 0;
  let maxProb = -1;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      maxIdx = i;
    }
  }

  // Visual foliage / plant tissue ratio check as a guardrail against non-leaf objects (shoes, boots, faces)
  // that a lightweight model might otherwise assign an arbitrary class:
  let plantPixelCount = 0;
  let greenPixelCount = 0;
  let totalSampled = 0;
  try {
    const imgData = ctx.getImageData(0, 0, 224, 224).data;
    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      totalSampled++;
      const isGreen = (g > 35 && g > r * 0.95 && g > b * 1.05) || (g > 50 && g >= r && g > b);
      const isBlightFoliage = g > 25 && r > 30 && g + r > b * 1.8 && Math.abs(r - g) < 80;
      if (isGreen) greenPixelCount++;
      if (isGreen || isBlightFoliage) plantPixelCount++;
    }
  } catch {
    // ignore
  }

  const greenRatio = totalSampled > 0 ? greenPixelCount / totalSampled : 0.5;
  const plantRatio = totalSampled > 0 ? plantPixelCount / totalSampled : 0.5;
  // Non-leaf objects (shoes, sneakers, walls, clothes) lack green foliage (< 3.5%).
  // Genuine tomato leaves (even with heavy lesions) contain substantial green leaf tissue (> 10%).
  const isVisualNonLeaf = greenRatio < 0.035 || plantRatio < 0.06;

  const rawLabel = labels[maxIdx] || "Not A Leaf";
  const rawConf = maxProb;

  const topLabel = isVisualNonLeaf ? "Not A Leaf" : rawLabel;
  const confidence = isVisualNonLeaf ? Math.max(0.98, rawConf) : rawConf;

  // REJECTION RULE:
  // if label === "Not A Leaf" OR confidence < 0.60 -> red card
  const isRejected = topLabel === "Not A Leaf" || confidence < 0.60;

  const info = DISEASE_INFO[topLabel] || {
    friendly: topLabel,
    scientific: "-",
    natural: "No action needed.",
    chemical: "None required",
    prevention: [],
    risk: () => makeRisk("none", false, "none"),
  };

  const riskResult = info.risk(tempC, humPct);

  return {
    label: topLabel,
    friendly: info.friendly,
    scientific: info.scientific,
    confidence,
    severity: computeSeverity(confidence),
    spreadRisk: riskResult.level,
    spreadRiskText: riskResult.text,
    natural: info.natural,
    chemical: info.chemical,
    prevention: info.prevention,
    isRejected,
    rejectionMessage: isRejected ? REJECTION_MESSAGE : null,
    allProbabilities: labels.map((l, idx) => ({
      label: l,
      friendly: DISEASE_INFO[l]?.friendly || l,
      probability: probabilities[idx] ?? 0,
    })),
  };
}
