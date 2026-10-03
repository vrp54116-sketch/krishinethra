import type * as tfType from "@tensorflow/tfjs";
import {
  loadModel as load11ClassModel,
  CLASS_LABELS,
  DISEASE_INFO,
  computeSeverity,
  classifyLeafImage as classify11Class,
  type LeafClassification,
} from "./leaf-model";

export * from "./leaf-model";

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

export const MODEL_CLASSES = CLASS_LABELS;
export type DiseaseClass = (typeof MODEL_CLASSES)[number];

/**
 * Loads the TensorFlow.js model using the 11-class loader.
 */
export async function getOrLoadModel(): Promise<tfType.LayersModel> {
  const model = await load11ClassModel();
  if (!model) {
    throw new Error("Could not load leaf disease model.");
  }
  return model;
}

export async function classifyLeafImageLegacy(
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
  tempC = 22,
  humPct = 65
): Promise<DetectionResult> {
  const res = await classify11Class(source, tempC, humPct);
  if (!res) {
    throw new Error("Model unavailable for classification.");
  }

  return {
    className: res.friendly,
    confidence: res.confidence,
    isRejected: res.isRejected,
    allProbabilities: res.allProbabilities.map((p) => ({
      label: p.friendly,
      probability: p.probability,
    })),
  };
}

export function computeDiagnosis(
  disease: string,
  confidence: number,
  temp: number,
  hum: number
): DiagnosisData {
  // Find key in DISEASE_INFO by friendly name or key
  const match = Object.entries(DISEASE_INFO).find(
    ([key, val]) =>
      key.toLowerCase() === disease.toLowerCase() ||
      val.friendly.toLowerCase() === disease.toLowerCase()
  );

  const info = match ? match[1] : DISEASE_INFO["Tomato___healthy"];
  const risk = info.risk(temp, hum);

  return {
    disease: info.friendly,
    confidence,
    severity: computeSeverity(confidence),
    spreadRisk: risk.level === "none" ? "No risk" : risk.level,
    spreadRiskReason: risk.text,
    naturalTreatment: info.natural,
    chemicalFallback:
      info.chemical === "None required" || info.chemical === "None effective against viruses"
        ? null
        : info.chemical,
    prevention: info.prevention,
  };
}
