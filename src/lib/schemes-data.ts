/**
 * schemes-data.ts
 * Verified summaries of real Government of India / state schemes.
 * NOTE: "Verify on official portal before applying" —
 * benefits, eligibility and subsidy rates change between seasons.
 */

/** Date these details were last cross-checked against official portals. */
export const SCHEMES_LAST_VERIFIED = "19 September 2026";

export type SchemeCategory =
  | "Insurance"
  | "Subsidy"
  | "Loan"
  | "Solar"
  | "Income Support";

export type SchemeFilter =
  | "All"
  | "Insurance"
  | "Subsidy"
  | "Loan"
  | "Solar"
  | "Income Support";

export const SCHEME_FILTERS: SchemeFilter[] = [
  "All",
  "Insurance",
  "Subsidy",
  "Loan",
  "Solar",
  "Income Support",
];

export interface GovScheme {
  id: string;
  /** Exact official English name */
  name: string;
  /** Official Hindi name */
  nameHindi: string;
  shortName: string;
  category: SchemeCategory;
  /** One-line benefit — highlighted green in UI */
  benefit: string;
  eligibility: string[];
  /** Exactly 4 steps */
  howToApply: string[];
  documents: string[];
  website: string;
  websiteLabel: string;
  scope: "central" | "state";
  /** For state schemes: which farmProfile.state values it applies to. "Other" = generic bucket. */
  states?: string[];
}

export interface StatePortal {
  name: string;
  url: string;
  label: string;
  description: string;
}

export const SCHEMES: GovScheme[] = [
  {
    id: "pm-kisan",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    nameHindi: "प्रधानमंत्री किसान सम्मान निधि",
    shortName: "PM-KISAN",
    category: "Income Support",
    benefit: "₹6,000/year in 3 instalments of ₹2,000, directly to bank account via DBT",
    eligibility: [
      "All land-holding farmer families with cultivable land in their name",
      "Aadhaar-linked bank account + land records verified by the state",
      "Excludes income-tax payers, serving/retired govt employees (except Group D/MTS), and professionals such as doctors/engineers",
    ],
    howToApply: [
      "Open pmkisan.gov.in → Farmers Corner → New Farmer Registration, enter Aadhaar + mobile + OTP",
      "Fill land details (survey/khata number) and upload land papers + bank passbook",
      "Complete e-KYC (OTP / biometric at CSC centre) — mandatory for every instalment",
      "State verifies land records; check status under Beneficiary Status and receive DBT instalments",
    ],
    documents: ["Aadhaar card", "Land ownership papers (7/12, khata/khatauni)", "Bank passbook (Aadhaar-seeded)", "Mobile number"],
    website: "https://pmkisan.gov.in/",
    websiteLabel: "pmkisan.gov.in",
    scope: "central",
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameHindi: "प्रधानमंत्री फसल बीमा योजना",
    shortName: "PMFBY",
    category: "Insurance",
    benefit: "Full crop-loss cover — farmer pays only 2% (kharif) / 1.5% (rabi) / 5% (commercial & horticulture) premium",
    eligibility: [
      "All farmers including tenant/sharecropper growing notified crops in a notified area",
      "Sowing must be in the notified season and area for that crop",
      "Enrol within the season cut-off date via bank, CSC, insurer or portal",
    ],
    howToApply: [
      "Apply on pmfby.gov.in (Farmer Corner → Applicant Login) or at nearest bank / CSC / empanelled insurer",
      "Declare crop, sown area and survey/khasra number before the season cut-off date",
      "Pay your share of premium; central + state govt pays the balance subsidy to the insurer",
      "Report crop loss within 72 hours on helpline 14447 or the Crop Insurance App for claim survey",
    ],
    documents: ["Aadhaar card", "Land records / tenancy or sharecropper agreement", "Sowing certificate / declaration", "Bank passbook (for claim DBT)"],
    website: "https://pmfby.gov.in/",
    websiteLabel: "pmfby.gov.in",
    scope: "central",
  },
  {
    id: "pmksy",
    name: "Pradhan Mantri Krishi Sinchayee Yojana – Per Drop More Crop (PMKSY)",
    nameHindi: "प्रधानमंत्री कृषि सिंचाई योजना",
    shortName: "PMKSY",
    category: "Subsidy",
    benefit: "55% subsidy on drip & sprinkler for small/marginal farmers (45% for others) — Per Drop More Crop",
    eligibility: [
      "Farmers with land ownership and an assured water source",
      "Higher 55% subsidy for small & marginal farmers; ~45% for other farmers",
      "One subsidised unit per family; ~7-year gap before repeat subsidy on same land",
    ],
    howToApply: [
      "Apply on your state horticulture/agriculture portal (i-Khedut in Gujarat, MahaDBT in Maharashtra) or the district office",
      "Attach 7/12 land record, water-source proof and authorised-supplier quotation",
      "Take pre-approval first, then install via the authorised supplier only",
      "Field verification by dept staff → subsidy released to bank account after inspection",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "Water-source proof", "Authorised supplier quotation"],
    website: "https://pmksy.gov.in/",
    websiteLabel: "pmksy.gov.in",
    scope: "central",
  },
  {
    id: "pm-kusum",
    name: "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM)",
    nameHindi: "प्रधानमंत्री किसान ऊर्जा सुरक्षा एवं उत्थान महाभियान",
    shortName: "KUSUM",
    category: "Solar",
    benefit: "Standalone solar pump: ~30% central + ~30% state subsidy — farmer pays only ~10% + 30% loan",
    eligibility: [
      "Farmers with an existing diesel/electric pump or a sanctioned need for a new solar pump",
      "Priority to small & marginal farmers and dark-zone / off-grid blocks",
      "Grid-connected farmers can also sell surplus solar power (Components A & C)",
    ],
    howToApply: [
      "Apply on pmkusum.mnre.gov.in or your state nodal agency portal (GEDA in Gujarat, MSEDCL/MahaDBT in Maharashtra)",
      "Select pump capacity (3 / 5 / 7.5 HP), upload land + pump/electricity-bill proof, pay farmer share",
      "Department sanctions → empanelled vendor installs the solar plant + pump",
      "Joint inspection, net-metering for grid feed-in where applicable, 5-year maintenance by vendor",
    ],
    documents: ["Aadhaar card", "Land records (7/12, khata)", "Existing pump / electricity bill (if any)", "Bank details + passport photo"],
    website: "https://pmkusum.mnre.gov.in/",
    websiteLabel: "pmkusum.mnre.gov.in",
    scope: "central",
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    nameHindi: "मृदा स्वास्थ्य कार्ड योजना",
    shortName: "SHC",
    category: "Subsidy",
    benefit: "Free soil testing every 2 years + printed card with NPK/pH-based fertilizer advice (12 parameters)",
    eligibility: [
      "Every farm holding — soil sampled once every 2 years on a grid basis",
      "Apply via state agriculture office, Soil Testing Lab (STL), KVK or mobile soil lab camp",
    ],
    howToApply: [
      "Give a soil sample at your Soil Testing Lab / Krishi Vigyan Kendra / mobile-lab camp with survey number",
      "Sample is taken grid-wise with GPS tagging + farmer and plot details",
      "Lab tests 12 parameters (NPK, pH, EC, OC, sulphur, micro-nutrients) and issues the card",
      "Collect the printed card or download it from soilhealth.dac.gov.in → Soil Health Card",
    ],
    documents: ["Aadhaar card", "Land survey number", "Mobile number"],
    website: "https://soilhealth.dac.gov.in/",
    websiteLabel: "soilhealth.dac.gov.in",
    scope: "central",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    nameHindi: "किसान क्रेडिट कार्ड",
    shortName: "KCC",
    category: "Loan",
    benefit: "Crop loans up to ₹3 lakh at 4% effective (7% – 3% subvention – 2% prompt-repayment bonus); allied activities up to ₹2 lakh",
    eligibility: [
      "Individual farmers, joint borrowers, tenant / sharecropper / oral-lessee farmers",
      "Crop-loan limit fixed from scale of finance × cropped area + allied needs",
      "Fisheries, dairy and other allied farmers eligible for up to ₹2 lakh allied-activity limit",
    ],
    howToApply: [
      "Apply at any bank branch / PACS or online via janSamarth portal — ask for the one-page KCC form",
      "Fill crop + land details and attach KYC, land/tenancy papers and crop-sown proof",
      "Bank sanctions a revolving cash-credit limit for the season (RBI guidelines apply to all banks)",
      "Repay on/before due date to keep the 4% effective rate; renew annually with fresh crop details",
    ],
    documents: ["Aadhaar + PAN", "Land papers / tenancy proof", "Crop-sown details", "Passport-size photo"],
    website: "https://www.rbi.org.in/",
    websiteLabel: "rbi.org.in — KCC info (apply at your bank)",
    scope: "central",
  },
  {
    id: "enam",
    name: "National Agriculture Market (e-NAM)",
    nameHindi: "राष्ट्रीय कृषि बाजार (ई-नाम)",
    shortName: "e-NAM",
    category: "Income Support",
    benefit: "Sell online across 1,389+ mandis — transparent e-bidding with payment straight to bank",
    eligibility: [
      "Any farmer with produce and an Aadhaar-linked bank account",
      "Register at the nearest e-NAM mandi helpdesk (e.g. Vasna, Deesa, Mehsana in Gujarat)",
      "Lot assaying/grading available at the mandi gate before bidding",
    ],
    howToApply: [
      "Register on enam.gov.in or at the mandi gate with Aadhaar + bank details + mobile",
      "Bring produce to the e-NAM mandi for assaying, grading and lot creation",
      "Online bidding by traders across states; accept the best price via SMS/app",
      "Payment credited directly to bank; transport via empanelled logistics if needed",
    ],
    documents: ["Aadhaar card", "Bank account details", "Mobile number"],
    website: "https://enam.gov.in/",
    websiteLabel: "enam.gov.in",
    scope: "central",
  },
  {
    id: "nhm",
    name: "National Horticulture Mission (MIDH)",
    nameHindi: "राष्ट्रीय बागवानी मिशन",
    shortName: "NHM",
    category: "Subsidy",
    benefit: "40–50% subsidy on horticulture: planting material, polyhouse, pack-house & post-harvest units",
    eligibility: [
      "Farmers growing fruits, vegetables, spices, flowers, plantation or medicinal crops",
      "Covers area expansion, protected cultivation (polyhouse/shade-net) and post-harvest units",
      "Apply via District Horticulture Office or the state MIDH / i-Khedut / MahaDBT portal",
    ],
    howToApply: [
      "Submit the proposal to your District Horticulture Officer (or via i-Khedut / MahaDBT where applicable)",
      "Pre-sanction field inspection by horticulture staff with land + estimate verification",
      "Execute planting / construction exactly per the approved estimate and norms",
      "Claim subsidy in instalments against bills, geo-tagged photos and final verification",
    ],
    documents: ["Land records (7/12, khata)", "Aadhaar + bank details", "Project estimate / supplier quotation", "Photos of the plot"],
    website: "https://nhm.nic.in/",
    websiteLabel: "nhm.nic.in",
    scope: "central",
  },
];

/* ------------------------------------------------------------------ */
/* State portals + state-specific schemes                               */
/* ------------------------------------------------------------------ */

export const STATE_PORTALS: Record<string, StatePortal> = {
  Gujarat: {
    name: "i-Khedut Portal",
    url: "https://ikhedut.gujarat.gov.in/",
    label: "ikhedut.gujarat.gov.in",
    description: "Single window for all Gujarat farm subsidies — drip, tractor, horticulture, solar",
  },
  Maharashtra: {
    name: "MahaDBT Farmer Portal",
    url: "https://mahadbt.maharashtra.gov.in/",
    label: "mahadbt.maharashtra.gov.in",
    description: "Single window for all Maharashtra farm DBT schemes — drip, machinery, solar, horticulture",
  },
};

export const GENERIC_STATE_PORTAL: StatePortal = {
  name: "State Agriculture / DBT Portal",
  url: "https://agriwelfare.gov.in/",
  label: "agriwelfare.gov.in (then your state portal / CSC)",
  description: "Apply via your state agriculture portal, nearest CSC, KVK or taluka agriculture office",
};

/** Normalise free-text state input for portal lookups. */
export function normalizeState(state: string): string {
  const s = (state || "").trim().toLowerCase();
  if (s === "gujarat" || s === "gujrat") return "Gujarat";
  if (s === "maharashtra" || s === "maharastra") return "Maharashtra";
  return (state || "").trim() || "Other";
}

/** "Your state portal" for the banner card. */
export function getStatePortal(state: string): StatePortal {
  const key = normalizeState(state);
  return STATE_PORTALS[key] ?? GENERIC_STATE_PORTAL;
}

export const STATE_SCHEMES: GovScheme[] = [
  {
    id: "gj-ikhedut-drip",
    name: "i-Khedut Micro-Irrigation Assistance (Gujarat)",
    nameHindi: "आई-खेडूत सूक्ष्म सिंचाई सहायता",
    shortName: "i-Khedut Drip",
    category: "Subsidy",
    benefit: "Drip/sprinkler subsidy via i-Khedut (PMKSY top-up) — up to ~55–70% for small/marginal farmers",
    eligibility: [
      "Gujarat farmers with land record (7/12) and a water source",
      "Priority to small & marginal (<2 ha) farmers in i-Khedut lottery/m Merit",
      "One application per component per year via i-Khedut print + document submission",
    ],
    howToApply: [
      "Open ikhedut.gujarat.gov.in → Yojana → Irrigation → apply for drip/sprinkler component",
      "Take the i-Khedut printout, sign it, and submit with 7/12 + bank + Aadhaar at the taluka office",
      "Wait for pre-approval SMS, then install only via the GGRC-approved supplier",
      "Field verification → subsidy DBT to bank account after inspection",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "i-Khedut signed printout", "Supplier quotation (GGRC)"],
    website: "https://ikhedut.gujarat.gov.in/",
    websiteLabel: "ikhedut.gujarat.gov.in",
    scope: "state",
    states: ["Gujarat"],
  },
  {
    id: "gj-ikhedut-machinery",
    name: "i-Khedut Farm Machinery & Tractor Subsidy (Gujarat)",
    nameHindi: "आई-खेडूत कृषि यंत्रीकरण सहायता",
    shortName: "i-Khedut Machinery",
    category: "Subsidy",
    benefit: "25–50% subsidy on tractor implements, rotavator, power-tiller & small machinery via i-Khedut",
    eligibility: [
      "Gujarat land-holding farmers (tractor subsidy generally for first-time tractor buyers)",
      "Quotation from an authorised dealer required before approval",
      "Selection via i-Khedut draw/lottery where applications exceed targets",
    ],
    howToApply: [
      "Open ikhedut.gujarat.gov.in → Yojana → Farm Mechanization → choose implement/tractor component",
      "Upload dealer quotation + 7/12 + Aadhaar + bank details and submit the application",
      "Submit signed printout at the taluka agriculture office within the deadline on the print",
      "Buy after approval, upload bill + RC (for tractor) → verification → DBT subsidy",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "Authorised dealer quotation", "Bill + RC (for tractor claims)"],
    website: "https://ikhedut.gujarat.gov.in/",
    websiteLabel: "ikhedut.gujarat.gov.in",
    scope: "state",
    states: ["Gujarat"],
  },
  {
    id: "mh-mahadbt-drip",
    name: "MahaDBT Micro-Irrigation Subsidy (Maharashtra)",
    nameHindi: "महाडीबीटी सूक्ष्म सिंचाई अनुदान",
    shortName: "MahaDBT Drip",
    category: "Subsidy",
    benefit: "Drip/sprinkler subsidy via MahaDBT (PMKSY) — up to ~55% small/marginal, ~45% others",
    eligibility: [
      "Maharashtra farmers with 7/12 land record and assured water source",
      "Priority to small & marginal farmers, women and SC/ST applicants",
      "Aadhaar-seeded bank account + MahaDBT farmer registration required",
    ],
    howToApply: [
      "Open mahadbt.maharashtra.gov.in → Applicant Login → Agriculture → micro-irrigation component",
      "Upload 7/12, Aadhaar, bank passbook and supplier quotation, then submit",
      "Pre-sanction inspection by taluka agriculture officer on approval",
      "Install via authorised supplier → verification → DBT subsidy to bank",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "Water-source proof", "Supplier quotation"],
    website: "https://mahadbt.maharashtra.gov.in/",
    websiteLabel: "mahadbt.maharashtra.gov.in",
    scope: "state",
    states: ["Maharashtra"],
  },
  {
    id: "mh-mahadbt-solar",
    name: "Mukhyamantri Saur Krushi Pump Yojana via MahaDBT (Maharashtra)",
    nameHindi: "मुख्यमंत्री सौर कृषि पंप योजना",
    shortName: "Maha Solar Pump",
    category: "Solar",
    benefit: "Solar pump with ~90–95% subsidy share for small/marginal farmers — farmer pays a small contribution",
    eligibility: [
      "Maharashtra farmers with farmland and no/sh unreliable grid pump connection",
      "Priority to small/marginal farmers, remote and load-shedding-prone villages",
      "MSEDCL feasibility + MahaDBT registration required",
    ],
    howToApply: [
      "Open mahadbt.maharashtra.gov.in → Energy / MSEDCL solar pump component and apply",
      "Upload 7/12 + Aadhaar + bank details; MSEDCL checks feasibility of the location",
      "Pay the farmer contribution after selection SMS/letter",
      "MSEDCL vendor installs the solar pump → joint inspection → 5-year maintenance",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "Electricity-bill / no-connection proof", "Caste/income certificate (if claiming reserved quota)"],
    website: "https://mahadbt.maharashtra.gov.in/",
    websiteLabel: "mahadbt.maharashtra.gov.in",
    scope: "state",
    states: ["Maharashtra"],
  },
  {
    id: "other-state-dbt",
    name: "State DBT Farm Subsidy (via State Agriculture Portal / CSC)",
    nameHindi: "राज्य डीबीटी कृषि अनुदान",
    shortName: "State DBT",
    category: "Subsidy",
    benefit: "Drip, machinery & horticulture top-up subsidies via your state DBT portal — typically 40–55%",
    eligibility: [
      "Farmers of the state with land records in their name",
      "Aadhaar-seeded bank account required for DBT",
      "Component-wise quotas — check your state portal for the open window and lottery dates",
    ],
    howToApply: [
      "Open your state agriculture/DBT portal (start at agriwelfare.gov.in → Schemes → your state) or visit the nearest CSC",
      "Register as farmer with Aadhaar + mobile OTP and select the open component",
      "Submit land + bank + quotation documents at the taluka/district office within the deadline",
      "Install/buy only after pre-approval → verification → DBT to bank",
    ],
    documents: ["Land records (khata/khasra)", "Aadhaar + bank passbook", "Supplier/dealer quotation", "Mobile number (OTP)"],
    website: "https://agriwelfare.gov.in/",
    websiteLabel: "agriwelfare.gov.in → your state portal",
    scope: "state",
    states: ["Other"],
  },
];

/** State-specific schemes for a given farmProfile.state. */
export function getStateSchemes(state: string): GovScheme[] {
  const key = normalizeState(state);
  if (key === "Gujarat") return STATE_SCHEMES.filter((s) => s.states?.includes("Gujarat"));
  if (key === "Maharashtra") return STATE_SCHEMES.filter((s) => s.states?.includes("Maharashtra"));
  return STATE_SCHEMES.filter((s) => s.states?.includes("Other"));
}

/** Central + state-specific schemes visible for this state. */
export function getVisibleSchemes(state: string): GovScheme[] {
  return [...SCHEMES, ...getStateSchemes(state)];
}

export interface FarmProfile {
  state: string;
  farmSizeAcres: number;
  hasPump: boolean;
  crops: string[];
}

export const DEFAULT_FARM_PROFILE: FarmProfile = {
  state: "Gujarat",
  farmSizeAcres: 1,
  hasPump: true,
  crops: ["tomato", "chili", "spinach"],
};

export interface SchemeRecommendation {
  scheme: GovScheme;
  reason: string;
  score: number;
}

const HORTI_CROPS = new Set([
  "tomato", "chili", "chilli", "spinach", "onion", "potato", "okra", "bhindi",
  "brinjal", "cabbage", "cauliflower", "carrot", "vegetable", "vegetables",
  "mango", "banana", "citrus", "orange", "grapes", "pomegranate", "guava",
  "papaya", "sapota", "fruit", "fruits", "spice", "spices", "turmeric",
  "cumin", "jeera", "coriander", "flower", "flowers", "marigold", "rose",
  "medicinal", "sugarcane", "cotton",
]);

const VEG_WATER_SAVER = new Set([
  "tomato", "chili", "chilli", "spinach", "onion", "potato", "okra", "bhindi",
  "brinjal", "cabbage", "cauliflower", "vegetable", "vegetables", "cotton", "sugarcane",
]);

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Score ONE scheme 0-100 against the farm profile.
 * Rules: hasPump → KUSUM/solar match; farmSize <2 acres → small-farmer
 * priority boost; horticulture crops → NHM/state-horticulture match.
 */
export function scoreScheme(scheme: GovScheme, profile: FarmProfile): SchemeRecommendation {
  const crops = (profile.crops ?? []).map((c) => c.toLowerCase().trim());
  const growsVeg = crops.some((c) => VEG_WATER_SAVER.has(c));
  const growsHorti = crops.some((c) => HORTI_CROPS.has(c));
  const smallholder = profile.farmSizeAcres < 2;
  const cropList = crops.slice(0, 3).join(", ") || "your crops";

  switch (scheme.id) {
    case "pm-kusum":
      return {
        scheme,
        score: clampScore(profile.hasPump ? 100 : 60),
        reason: profile.hasPump
          ? "Why recommended: you have an irrigation pump — KUSUM solar can cut your power/diesel cost."
          : "Why recommended: no pump on record — KUSUM can fund your first solar pump if you add one.",
      };
    case "mh-mahadbt-solar":
      return {
        scheme,
        score: clampScore(profile.hasPump ? 82 : 96),
        reason: profile.hasPump
          ? "Why recommended: Maharashtra solar top-up for your pump — check MahaDBT for the open window."
          : "Why recommended: no pump on record — this Maharashtra solar-pump quota fits you best.",
      };
    case "pmksy":
    case "gj-ikhedut-drip":
    case "mh-mahadbt-drip":
      return {
        scheme,
        score: clampScore((growsVeg ? 95 : 80) + (smallholder ? 5 : 0)),
        reason: growsVeg
          ? `Why recommended: you grow ${cropList} — drip saves ~50% water and lifts vegetable yield.`
          : "Why recommended: drip/sprinkler subsidy (~55%) fits irrigated row crops and vegetables.",
      };
    case "pm-kisan":
      return {
        scheme,
        score: clampScore(smallholder ? 98 : 90),
        reason: smallholder
          ? `Why recommended: <2-acre small-farmer priority — every land-holding family in ${profile.state} gets ₹6,000/yr.`
          : `Why recommended: every land-holding farmer in ${profile.state} gets ₹6,000/yr — check your instalment.`,
      };
    case "pmfby":
      return {
        scheme,
        score: clampScore(smallholder ? 90 : 78),
        reason: smallholder
          ? `Why recommended: your ${profile.farmSizeAcres}-acre holding is most exposed to one bad season — insure it for ~2%.`
          : "Why recommended: protect standing crops against drought, flood and pest loss at ~2% premium.",
      };
    case "kcc":
      return {
        scheme,
        score: clampScore(smallholder ? 87 : 75),
        reason: smallholder
          ? "Why recommended: <2-acre priority for input credit — KCC up to ₹3L at 4% effective on timely repayment."
          : "Why recommended: need seed/fertilizer credit? KCC up to ₹3L at 4% effective on timely repayment.",
      };
    case "nhm":
      return {
        scheme,
        score: clampScore(growsHorti ? 92 : 55),
        reason: growsHorti
          ? `Why recommended: you grow ${cropList} — NHM covers planting material, polyhouse & pack-house subsidy.`
          : "Why recommended: only if you expand into fruits/vegetables/flowers — otherwise prioritise PM-KISAN/PMFBY.",
      };
    case "gj-ikhedut-machinery":
      return {
        scheme,
        score: clampScore(smallholder ? 78 : 84),
        reason: "Why recommended: Gujarat machinery draw suits your holding — rotavator/power-tiller over a full tractor if <2 acres.",
      };
    case "soil-health-card":
      return {
        scheme,
        score: 70,
        reason: "Why recommended: free soil test every 2 years — match fertilizer dose to your actual NPK/pH.",
      };
    case "enam":
      return {
        scheme,
        score: clampScore(growsVeg || growsHorti ? 76 : 65),
        reason: "Why recommended: sell beyond your local APMC via online e-bidding for better price discovery.",
      };
    case "other-state-dbt":
      return {
        scheme,
        score: clampScore(growsVeg ? 86 : 80),
        reason: "Why recommended: your state DBT window mirrors PMKSY/machinery — apply during the open lottery dates.",
      };
    default:
      return { scheme, score: 65, reason: "Why recommended: general fit — check eligibility against your land records." };
  }
}

/** Score EVERY visible scheme (central + state) 0-100, sorted best-first. */
export function scoreAllSchemes(profile: FarmProfile): SchemeRecommendation[] {
  return getVisibleSchemes(profile.state)
    .map((scheme) => scoreScheme(scheme, profile))
    .sort((a, b) => b.score - a.score);
}

/**
 * Match schemes against the farm profile.
 * Pure function — returns top 3 with farmer-friendly reasons.
 */
export function recommendSchemes(profile: FarmProfile): SchemeRecommendation[] {
  return scoreAllSchemes(profile).slice(0, 3);
}
