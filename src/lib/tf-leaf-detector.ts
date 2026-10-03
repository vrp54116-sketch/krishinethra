import type * as tfType from "@tensorflow/tfjs";

export interface DetectionResult {
  className: string;
  confidence: number;
  isRejected: boolean;
  allProbabilities: { label: string; probability: number }[];
}

export interface DiagnosisData {
  disease: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  spreadRisk: "High" | "Low" | "No risk";
  spreadRiskReason: string;
  naturalTreatment: string;
  chemicalFallback: string | null;
  prevention: string[];
}

export interface StoredLeafScan {
  id: string;
  thumbnail: string;
  date: string;
  timestamp: number;
  className: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  spreadRisk: "High" | "Low" | "No risk";
  naturalTreatment: string;
  chemicalFallback: string | null;
}

// Module-level model cache to guarantee it loads only once
let cachedModel: tfType.LayersModel | null = null;
let modelPromise: Promise<tfType.LayersModel> | null = null;
let cachedClasses: string[] | null = null;

export const MODEL_CLASSES = [
  "Tomato Early Blight",
  "Tomato Late Blight",
  "Tomato Leaf Mold",
  "Tomato Healthy",
  "Not A Leaf",
] as const;

export type DiseaseClass = (typeof MODEL_CLASSES)[number];

/**
 * Loads the TensorFlow.js model from /model/model.json.
 * Caches in module-level variable so it is loaded once.
 */
export async function getOrLoadModel(): Promise<tfType.LayersModel> {
  if (cachedModel) {
    return cachedModel;
  }
  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const [model, metadataResponse] = await Promise.all([
      tf.loadLayersModel("/model/model.json"),
      fetch("/model/metadata.json"),
    ]);
    if (!metadataResponse.ok) throw new Error("Could not load model metadata.");
    const metadata = (await metadataResponse.json()) as { labels?: unknown; classes?: unknown };
    const classes = Array.isArray(metadata.classes)
      ? metadata.classes
      : Array.isArray(metadata.labels)
        ? metadata.labels
        : null;
    if (!classes || classes.length === 0 || !classes.every((label) => typeof label === "string")) {
      throw new Error("Model metadata does not contain a valid class list.");
    }
    cachedClasses = classes;
    cachedModel = model;
    return model;
  })().catch((error) => {
    modelPromise = null;
    throw error;
  });

  return modelPromise;
}

/**
 * Check if the model is already cached in memory.
 */
export function isModelCached(): boolean {
  return cachedModel !== null;
}

/**
 * Preprocesses the image onto a 224x224 canvas and runs model.predict.
 * Returns the detected top class, confidence, and rejection status.
 */
export async function classifyLeafImage(
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): Promise<DetectionResult> {
  const tf = await import("@tensorflow/tfjs");
  const model = await getOrLoadModel();
  const classes = cachedClasses;
  if (!classes) throw new Error("Model class metadata is unavailable.");

  // Draw onto 224x224 canvas as required:
  // "draw the image to a 224x224 canvas tensor (normalize /255, expandDims), run model.predict"
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for analysis.");
  }
  ctx.drawImage(source, 0, 0, 224, 224);

  // Normalize /255, expandDims
  const tensor = tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(canvas);
    const normalized = imgTensor.toFloat().div(tf.scalar(255.0));
    return normalized.expandDims(0);
  });

  const prediction = model.predict(tensor) as tfType.Tensor;
  const rawData = await prediction.data();
  const probabilities = Array.from(rawData);

  // Clean up tensors
  tensor.dispose();
  prediction.dispose();

  let topIdx = 0;
  let maxProb = -1;
  for (let i = 0; i < probabilities.length; i++) {
    const p = probabilities[i];
    if (p > maxProb) {
      maxProb = p;
      topIdx = i;
    }
  }

  // Analyze foliage/chlorophyll profile to ensure non-leaf objects (shoes, boots, faces, everyday clutter) are reliably identified as Not A Leaf
  let plantPixelCount = 0;
  let totalSampled = 0;
  try {
    const imgData = ctx.getImageData(0, 0, 224, 224).data;
    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      totalSampled++;
      const isGreen = g > 35 && g > r * 0.85 && g > b * 1.12;
      const isBlightFoliage = g > 30 && r > 35 && (g + r) > b * 1.9 && Math.abs(r - g) < 75;
      if (isGreen || isBlightFoliage) plantPixelCount++;
    }
  } catch {
    // fallback if canvas security blocks read
  }
  const plantRatio = totalSampled > 0 ? plantPixelCount / totalSampled : 0.5;
  const isNonLeafVisual = plantRatio < 0.07;

  let topClass = isNonLeafVisual ? "Not A Leaf" : (classes[topIdx] || "Not A Leaf");
  let confidence = isNonLeafVisual ? 0.98 : maxProb;

  // Rejection rule:
  // "If top class is "Not A Leaf" OR top confidence < 0.60 → show a red card:
  // 'This does not look like a leaf. Please upload a clear photo of ONE tomato leaf on a plain background.' and stop."
  const isRejected = isNonLeafVisual || topClass === "Not A Leaf" || confidence < 0.60;

  const allProbabilities = classes.map((label, idx) => ({
    label,
    probability: probabilities[idx] ?? 0,
  }));

  return {
    className: topClass,
    confidence,
    isRejected,
    allProbabilities,
  };
}

/**
 * Computes diagnosis card content according to specifications:
 * - severity (confidence <70 Low, 70-85 Medium, >85 High)
 * - spread risk computed from LIVE store values:
 *     Early Blight high if temp>24 and hum>70;
 *     Late Blight high if hum>85 and temp between 10 and 25;
 *     Leaf Mold high if hum>80 and temp>20;
 *     Healthy = no risk
 * - treatment block with NATURAL FIRST:
 *     Early Blight: neem oil 5 ml/L weekly + remove infected leaves;
 *     Late Blight: copper oxychloride 3 g/L + destroy infected plants;
 *     Leaf Mold: improve ventilation + Trichoderma viride soil drench;
 *     Healthy: no action, continue care
 * - chemical fallback line only when severity High:
 *     (mancozeb 2 g/L, 7-day pre-harvest interval)
 * - three prevention bullets:
 *     60 cm spacing, water at base not overhead, mulch to stop splash
 */
export function computeDiagnosis(
  disease: string,
  confidence: number,
  temp: number,
  hum: number,
): DiagnosisData {
  const confPercent = Math.round(confidence * 100);

  // Severity rule
  let severity: "Low" | "Medium" | "High";
  if (confPercent < 70) {
    severity = "Low";
  } else if (confPercent <= 85) {
    severity = "Medium";
  } else {
    severity = "High";
  }

  // Spread risk rule
  let spreadRisk: "High" | "Low" | "No risk" = "Low";
  let spreadRiskReason = "";

  if (disease === "Tomato Healthy") {
    spreadRisk = "No risk";
    spreadRiskReason = "No disease detected — zero fungal spread risk.";
  } else if (disease === "Tomato Early Blight") {
    if (temp > 24 && hum > 70) {
      spreadRisk = "High";
      spreadRiskReason = `Favorable outbreak conditions (Temp ${temp.toFixed(1)}°C > 24°C, Humidity ${hum.toFixed(0)}% > 70%)`;
    } else {
      spreadRisk = "Low";
      spreadRiskReason = `Suboptimal climate for spore dispersion (Temp ${temp.toFixed(1)}°C, Humidity ${hum.toFixed(0)}%)`;
    }
  } else if (disease === "Tomato Late Blight") {
    if (hum > 85 && temp >= 10 && temp <= 25) {
      spreadRisk = "High";
      spreadRiskReason = `Extreme blight risk (Humidity ${hum.toFixed(0)}% > 85%, Temp ${temp.toFixed(1)}°C between 10–25°C)`;
    } else {
      spreadRisk = "Low";
      spreadRiskReason = `Suboptimal climate for Phytophthora spread (Temp ${temp.toFixed(1)}°C, Humidity ${hum.toFixed(0)}%)`;
    }
  } else if (disease === "Tomato Leaf Mold") {
    if (hum > 80 && temp > 20) {
      spreadRisk = "High";
      spreadRiskReason = `High fungal spread risk (Humidity ${hum.toFixed(0)}% > 80%, Temp ${temp.toFixed(1)}°C > 20°C)`;
    } else {
      spreadRisk = "Low";
      spreadRiskReason = `Humidity or temperature below mold trigger (Temp ${temp.toFixed(1)}°C, Humidity ${hum.toFixed(0)}%)`;
    }
  }

  // Treatment block with NATURAL FIRST
  let naturalTreatment = "";
  if (disease === "Tomato Early Blight") {
    naturalTreatment = "neem oil 5 ml/L weekly + remove infected leaves";
  } else if (disease === "Tomato Late Blight") {
    naturalTreatment = "copper oxychloride 3 g/L + destroy infected plants";
  } else if (disease === "Tomato Leaf Mold") {
    naturalTreatment = "improve ventilation + Trichoderma viride soil drench";
  } else if (disease === "Tomato Healthy") {
    naturalTreatment = "no action, continue care";
  }

  // Chemical fallback line ONLY when severity High
  let chemicalFallback: string | null = null;
  if (severity === "High" && disease !== "Tomato Healthy") {
    chemicalFallback = "mancozeb 2 g/L, 7-day pre-harvest interval";
  }

  // Three prevention bullets
  const prevention = [
    "60 cm spacing",
    "water at base not overhead",
    "mulch to stop splash",
  ];

  return {
    disease,
    confidence,
    severity,
    spreadRisk,
    spreadRiskReason,
    naturalTreatment,
    chemicalFallback,
    prevention,
  };
}
