/**
 * schemes-data.ts
 * Summaries of real Government of India / Gujarat schemes.
 * NOTE: verify details on the official portal before applying —
 * benefits, eligibility and subsidy rates change between seasons.
 */

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
  name: string;
  shortName: string;
  category: SchemeCategory;
  /** One-line benefit — highlighted green in UI */
  benefit: string;
  eligibility: string[];
  howToApply: string[];
  documents: string[];
  website: string;
  websiteLabel: string;
}

export const SCHEMES: GovScheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    shortName: "PM-KISAN",
    category: "Income Support",
    benefit: "₹6,000/year in 3 instalments, directly to bank account",
    eligibility: [
      "All land-holding farmer families with cultivable land",
      "Aadhaar-linked bank account required",
      "Excludes income-tax payers, serving/retired govt staff (except Group D/MTS), and professionals like doctors/engineers",
    ],
    howToApply: [
      "Register on pmkisan.gov.in → New Farmer Registration",
      "Enter Aadhaar, mobile, land records (survey/khata number)",
      "e-KYC via OTP / biometric at CSC centre",
      "State verifies land records; instalments arrive by DBT",
    ],
    documents: ["Aadhaar card", "Land ownership papers (7/12, khata)", "Bank passbook", "Mobile number"],
    website: "https://pmkisan.gov.in/",
    websiteLabel: "pmkisan.gov.in",
  },
  {
    id: "pmfby",
    name: "PM Fasal Bima Yojana (Crop Insurance)",
    shortName: "PMFBY",
    category: "Insurance",
    benefit: "Crop loss cover — farmer pays only 2% (kharif) / 1.5% (rabi) premium",
    eligibility: [
      "All farmers including tenant/sharecropper growing notified crops",
      "Sowing in a notified area during the notified season",
      "Apply within the season cut-off date via bank, CSC or portal",
    ],
    howToApply: [
      "Apply on pmfby.gov.in or nearest bank / CSC / insurance company",
      "Declare crop, area, survey number before cut-off date",
      "Pay your share of premium; balance subsidy paid by govt",
      "Report crop loss within 72 hrs on helpline 14447 or app",
    ],
    documents: ["Aadhaar card", "Land records / tenancy agreement", "Sowing certificate", "Bank passbook"],
    website: "https://pmfby.gov.in/",
    websiteLabel: "pmfby.gov.in",
  },
  {
    id: "pmksy",
    name: "PM Krishi Sinchayee Yojana (Micro-Irrigation)",
    shortName: "PMKSY",
    category: "Subsidy",
    benefit: "~55% subsidy on drip & sprinkler systems (small/marginal farmers)",
    eligibility: [
      "Farmers with land ownership + water source",
      "Higher subsidy for small & marginal farmers (~55%), others ~45%",
      "One unit per family; 7-year gap before repeat subsidy",
    ],
    howToApply: [
      "Apply on state horticulture/agriculture portal or district office",
      "Attach 7/12, water-source proof and supplier quotation",
      "Pre-approval → install via authorised supplier → field verification",
      "Subsidy released to bank account after inspection",
    ],
    documents: ["7/12 land record", "Aadhaar + bank passbook", "Water source proof", "Supplier quotation"],
    website: "https://pmksy.gov.in/",
    websiteLabel: "pmksy.gov.in",
  },
  {
    id: "pm-kusum",
    name: "PM-KUSUM (Solar Pumps)",
    shortName: "KUSUM",
    category: "Solar",
    benefit: "Standalone solar pump subsidy — up to ~60% centre+state share",
    eligibility: [
      "Farmers with existing diesel/electric pump or need for new solar pump",
      "Priority for small & marginal farmers and dark-zone blocks",
      "Grid-connected farmers can also sell surplus solar power (Component A/C)",
    ],
    howToApply: [
      "Apply on MNRE / state nodal agency portal (e.g. GEDA in Gujarat)",
      "Select pump capacity (3/5/7.5 HP) and pay farmer share",
      "Department sanctions → empanelled vendor installs plant",
      "Net-metering for grid feed-in where applicable",
    ],
    documents: ["Aadhaar card", "Land records", "Existing pump/electricity bill", "Bank details + photo"],
    website: "https://mnre.gov.in/en/schemes/solar-schemes/pm-kusum-scheme/",
    websiteLabel: "mnre.gov.in — PM-KUSUM",
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    shortName: "SHC",
    category: "Subsidy",
    benefit: "Free soil testing + printed health card with fertilizer advice",
    eligibility: [
      "Every farm holding — soil sampled once every 2 years",
      "Apply via state agriculture office, STL or mobile soil lab",
    ],
    howToApply: [
      "Give soil sample at soil testing lab / Krishi Vigyan Kendra camp",
      "Sample taken grid-wise with GPS + farmer details",
      "Lab tests 12 parameters (NPK, pH, EC, OC, micro-nutrients)",
      "Collect printed card or download from soilhealth.dac.gov.in",
    ],
    documents: ["Aadhaar card", "Land survey number", "Mobile number"],
    website: "https://soilhealth.dac.gov.in/",
    websiteLabel: "soilhealth.dac.gov.in",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    shortName: "KCC",
    category: "Loan",
    benefit: "Crop loans up to ₹3 lakh at 4% effective interest (with prompt-repayment subvention)",
    eligibility: [
      "Individual farmers, joint borrowers, tenant/sharecropper farmers",
      "Crop loan limit based on scale of finance × cropped area",
      "Fisheries/dairy farmers eligible for up to ₹2 lakh allied-activity limit",
    ],
    howToApply: [
      "Apply at any bank branch / PACS / janSamarth portal",
      "Fill one-page KCC form + crop & land details",
      "Bank sanctions revolving cash-credit limit for the season",
      "Repay within due date to keep 4% effective rate (3% subvention + 2% prompt bonus)",
    ],
    documents: ["Aadhaar + PAN", "Land papers / tenancy proof", "Crop sown details", "Passport photo"],
    website: "https://www.jansamarth.in/",
    websiteLabel: "jansamarth.in — KCC",
  },
  {
    id: "nhm",
    name: "National Horticulture Mission (MIDH)",
    shortName: "NHM",
    category: "Subsidy",
    benefit: "40–50% subsidy on horticulture: planting, polyhouse, pack-house",
    eligibility: [
      "Farmers growing fruits, vegetables, spices, flowers, medicinal plants",
      "Cluster/area-expansion, protected cultivation & post-harvest units covered",
      "Apply via District Horticulture Office / state MIDH portal",
    ],
    howToApply: [
      "Submit proposal to District Horticulture Officer",
      "Pre-sanction field inspection by horticulture staff",
      "Execute planting / construction per approved estimate",
      "Claim subsidy in instalments against bills + verification",
    ],
    documents: ["Land records", "Aadhaar + bank details", "Project estimate / quotation", "Photos of plot"],
    website: "https://midh.gov.in/",
    websiteLabel: "midh.gov.in",
  },
  {
    id: "enam",
    name: "e-NAM (National Agriculture Market)",
    shortName: "e-NAM",
    category: "Income Support",
    benefit: "Sell online across 1,300+ mandis — transparent e-bidding, direct payment",
    eligibility: [
      "Any farmer with produce + Aadhaar-linked bank account",
      "Register at nearest e-NAM mandi (e.g. Ahmedabad-Vasna, Deesa, Mahesana)",
      "Lot assaying/grading available at mandi gate",
    ],
    howToApply: [
      "Register on enam.gov.in or at mandi gate with Aadhaar + bank details",
      "Bring produce to e-NAM mandi for assaying + lot creation",
      "Online bidding by traders across states; accept best price on SMS/app",
      "Payment directly to bank; transport arranged via empanelled logistics",
    ],
    documents: ["Aadhaar card", "Bank account details", "Mobile number"],
    website: "https://enam.gov.in/",
    websiteLabel: "enam.gov.in",
  },
];

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

/**
 * Match schemes against the farm profile.
 * Pure function — returns top 3 with farmer-friendly reasons.
 */
export function recommendSchemes(profile: FarmProfile): SchemeRecommendation[] {
  const crops = profile.crops.map((c) => c.toLowerCase());
  const growsVeg = crops.some((c) =>
    ["tomato", "chili", "spinach", "onion", "potato", "okra", "vegetable"].includes(c),
  );
  const smallholder = profile.farmSizeAcres <= 5;

  const scored: SchemeRecommendation[] = SCHEMES.map((scheme) => {
    switch (scheme.id) {
      case "pm-kusum":
        return {
          scheme,
          score: profile.hasPump ? 100 : 55,
          reason: profile.hasPump
            ? "You have an irrigation pump → PM-KUSUM solar subsidy can cut your power/diesel cost."
            : "No pump on record — PM-KUSUM can fund your first solar pump if you add one.",
        };
      case "pmksy":
        return {
          scheme,
          score: growsVeg ? 95 : 80,
          reason: growsVeg
            ? `You grow ${crops.slice(0, 3).join(", ")} → drip irrigation saves ~50% water and boosts vegetable yield.`
            : "Drip/sprinkler subsidy (~55%) fits irrigated row crops and vegetables.",
        };
      case "pm-kisan":
        return {
          scheme,
          score: 90,
          reason: `Every land-holding farmer in ${profile.state} gets ₹6,000/yr — check your instalment status.`,
        };
      case "pmfby":
        return {
          scheme,
          score: smallholder ? 88 : 78,
          reason: smallholder
            ? `Your ${profile.farmSizeAcres}-acre holding is most exposed to one bad season — insure it for ~2% premium.`
            : "Protect standing crops against drought, flood and pest loss at ~2% premium.",
        };
      case "kcc":
        return {
          scheme,
          score: smallholder ? 85 : 75,
          reason: "Need seed/fertilizer credit? KCC gives up to ₹3L at 4% effective on timely repayment.",
        };
      case "nhm":
        return {
          scheme,
          score: growsVeg ? 82 : 60,
          reason: growsVeg
            ? "You grow horticulture crops → NHM covers planting material, polyhouse & pack-house subsidy."
            : "For fruit/vegetable expansion, polyhouse and pack-house subsidy.",
        };
      case "soil-health-card":
        return {
          scheme,
          score: 70,
          reason: "Free soil test every 2 years — match fertilizer dose to your actual NPK/pH.",
        };
      case "enam":
      default:
        return {
          scheme,
          score: growsVeg ? 76 : 65,
          reason: "Sell tomato/chili/spinach beyond your local APMC via online e-bidding for better rates.",
        };
    }
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}
