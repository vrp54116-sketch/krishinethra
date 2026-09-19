import type { LanguageCode } from "./types";

/**
 * Nested translation dictionary for KrishiNethra AI.
 *
 * Keys are accessed with dot paths, e.g. t("nav.dashboard").
 * Gujarati / Marathi entries fall back to Hindi at runtime (see
 * src/lib/i18n.ts) — but the exported objects always have a complete
 * structure so pages can adopt t() safely.
 *
 * Coverage: nav, page titles, card labels, buttons, alert templates,
 * KrishiGPT fallback/help responses, daily + period report templates,
 * and the full /settings surface — en + hi complete; gu/mr carry
 * nav + titles + buttons + common labels and fall back to hi for long text.
 */

export interface TranslationDict {
  // Landing (flat keys kept for backwards compat with src/app/page.tsx)
  tagline: string;
  pinLabel: string;
  enterFarm: string;
  pinError: string;
  welcome: string;
  appName: string;

  nav: {
    dashboard: string;
    map: string;
    camera: string;
    irrigation: string;
    climate: string;
    spray: string;
    fertilizer: string;
    market: string;
    schemes: string;
    diary: string;
    tasks: string;
    assistant: string;
    reports: string;
    alerts: string;
    voice: string;
    settings: string;
    more: string;
  };

  titles: {
    dashboard: string;
    map: string;
    camera: string;
    irrigation: string;
    climate: string;
    spray: string;
    fertilizer: string;
    market: string;
    schemes: string;
    diary: string;
    tasks: string;
    assistant: string;
    reports: string;
    alerts: string;
    voice: string;
    settings: string;
  };

  common: {
    save: string;
    cancel: string;
    delete: string;
    add: string;
    edit: string;
    close: string;
    back: string;
    search: string;
    refresh: string;
    viewAll: string;
    markAllRead: string;
    loading: string;
    language: string;
    simulation: string;
    live: string;
    farmHealth: string;
    farmHealthScore: string;
    more: string;
    noAlerts: string;
    recentAlerts: string;
    comingSoon: string;
    on: string;
    off: string;
    enabled: string;
    disabled: string;
    test: string;
    testing: string;
    connected: string;
    failed: string;
    export: string;
    import: string;
    reset: string;
    confirm: string;
    retry: string;
    send: string;
    clear: string;
    today: string;
    tomorrow: string;
    done: string;
    pending: string;
    overdue: string;
    all: string;
    unread: string;
    details: string;
    hide: string;
  };

  alerts: {
    systemOnlineTitle: string;
    systemOnlineMsg: string;
    pumpBlockedTitle: string;
    pumpBlockedMsg: string;
    moistureLowTitle: string;
    moistureLowMsg: string;
    tempHighTitle: string;
    tempHighMsg: string;
    diseaseTitle: string;
    diseaseMsg: string;
    tankLowTitle: string;
    tankLowMsg: string;
    aqiHighTitle: string;
    aqiHighMsg: string;
    pumpStartedTitle: string;
    pumpStartedMsg: string;
  };

  dashboard: {
    soilMoisture: string;
    temperature: string;
    humidity: string;
    tankLevel: string;
    waterUsed: string;
    pumpStatus: string;
    zones: string;
    todaysTasks: string;
    weather: string;
    healthScore: string;
    liveSensors: string;
    liveSensorsSub: string;
    pumping: string;
    pumpIdle: string;
    manual: string;
    autoAI: string;
    scheduleMode: string;
    scanLeaf: string;
    irrigateZoneB: string;
    openGPT: string;
    viewMap: string;
    aiSuggestions: string;
    waterToday: string;
    dailyReport: string;
    quickActions: string;
  };

  irrigation: {
    pumpTitle: string;
    running: string;
    idle: string;
    manual: string;
    autoAI: string;
    schedule: string;
    emergencyStop: string;
    quickRun: string;
    tankTitle: string;
    refillTank: string;
    refilling: string;
    scheduleTitle: string;
    scheduleSub: string;
    nextScheduled: string;
    noSlots: string;
    addSlot: string;
    usageTitle: string;
    energyTitle: string;
    historyTitle: string;
    aiReasoning: string;
  };

  camera: {
    liveView: string;
    leafScanner: string;
    panTilt: string;
    streamNote: string;
    simNote: string;
    center: string;
    sweepOn: string;
    sweepOff: string;
  };

  tasks: {
    today: string;
    completed: string;
    upcoming: string;
    addTask: string;
    generateAI: string;
    saveTask: string;
    title: string;
    priority: string;
    dueDate: string;
    zone: string;
    noTasksToday: string;
    allDone: string;
    high: string;
    medium: string;
    low: string;
    dueToday: string;
    dueTomorrow: string;
  };

  alertsPage: {
    alertCenter: string;
    telegramTitle: string;
    rulesTitle: string;
    markRead: string;
    clearAll: string;
    searchPh: string;
    testConnection: string;
    sendTest: string;
    noAlerts: string;
    allCaughtUp: string;
  };

  assistant: {
    title: string;
    subtitle: string;
    placeholder: string;
    listening: string;
    fallback: string;
    help: string;
    quickNote: string;
  };

  voice: {
    ready: string;
    listening: string;
    startListening: string;
    stop: string;
    voiceOutput: string;
    recognition: string;
    commandRef: string;
    recentCommands: string;
    response: string;
  };

  report: {
    dailyReport: string;
    periodReport: string;
    noHistory: string;
    bestDay: string;
    advice: string;
  };

  onboarding: Record<string, string>;

  settings: {
    title: string;
    subtitle: string;
    farmProfile: string;
    farmProfileSub: string;
    farmName: string;
    farmerName: string;
    state: string;
    farmSize: string;
    crops: string;
    gps: string;
    latitude: string;
    longitude: string;
    hasPump: string;
    pumpYes: string;
    pumpNo: string;
    language: string;
    languageSub: string;
    irrigationThresholds: string;
    irrigationSub: string;
    moistureLow: string;
    moistureHigh: string;
    pumpDuration: string;
    tankLow: string;
    climateThresholds: string;
    climateSub: string;
    tempHigh: string;
    humidityLow: string;
    aqiHigh: string;
    camera: string;
    cameraSub: string;
    source: string;
    simFeed: string;
    liveStream: string;
    streamUrl: string;
    panSpeed: string;
    hardware: string;
    hardwareSub: string;
    simMode: string;
    liveMode: string;
    gatewayUrl: string;
    testConnection: string;
    liveNote: string;
    alerts: string;
    alertsSub: string;
    sound: string;
    soundSub: string;
    browserNotif: string;
    browserNotifSub: string;
    enableNotif: string;
    voice: string;
    voiceSub: string;
    output: string;
    recLang: string;
    data: string;
    dataSub: string;
    exportBackup: string;
    importBackup: string;
    resetFarm: string;
    resetTitle: string;
    resetMessage: string;
    storageUsage: string;
  };
}

type DeepPartial<T> = T extends string
  ? string | undefined
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function deepMerge<T extends object>(base: T, over: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over ?? {})) {
    if (v === undefined) continue;
    const b = (base as Record<string, unknown>)[k];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      b !== null &&
      typeof b === "object"
    ) {
      out[k] = deepMerge(
        b as Record<string, unknown> as T[keyof T] & object,
        v as DeepPartial<T[keyof T] & object>,
      );
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

const en: TranslationDict = {
  tagline: "Har Khet Ka AI Doctor — Your Farm's Intelligent Guardian",
  pinLabel: "Enter 4-digit PIN",
  enterFarm: "ENTER FARM",
  pinError: "Please enter a 4-digit PIN",
  welcome: "Welcome to your farm",
  appName: "KrishiNethra AI",

  nav: {
    dashboard: "Dashboard",
    map: "Farm Map",
    camera: "Camera & Scanner",
    irrigation: "Irrigation",
    climate: "Climate",
    spray: "Spray Planner",
    fertilizer: "Fertilizer",
    market: "Market",
    schemes: "Schemes",
    diary: "Diary",
    tasks: "Tasks",
    assistant: "KrishiGPT",
    reports: "Reports",
    alerts: "Alerts",
    voice: "Voice",
    settings: "Settings",
    more: "More",
  },

  titles: {
    dashboard: "Dashboard",
    map: "Farm Map",
    camera: "Camera & Scanner",
    irrigation: "Irrigation",
    climate: "Climate",
    spray: "Spray Planner",
    fertilizer: "Fertilizer",
    market: "Market Prices",
    schemes: "Govt. Schemes",
    diary: "Farm Diary",
    tasks: "Tasks",
    assistant: "KrishiGPT Assistant",
    reports: "Reports",
    alerts: "Alerts",
    voice: "Voice Control",
    settings: "Settings",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    add: "Add",
    edit: "Edit",
    close: "Close",
    back: "Back",
    search: "Search",
    refresh: "Refresh",
    viewAll: "View all",
    markAllRead: "Mark all read",
    loading: "Loading…",
    language: "Language",
    simulation: "SIMULATION",
    live: "LIVE",
    farmHealth: "Farm Health",
    farmHealthScore: "Farm Health Score",
    more: "More",
    noAlerts: "No alerts — all clear",
    recentAlerts: "Recent alerts",
    comingSoon: "Full module coming in the next milestone.",
    on: "ON",
    off: "OFF",
    enabled: "Enabled",
    disabled: "Disabled",
    test: "Test",
    testing: "Testing…",
    connected: "Connected",
    failed: "Failed",
    export: "Export",
    import: "Import",
    reset: "Reset",
    confirm: "Confirm",
    retry: "Retry",
    send: "Send",
    clear: "Clear",
    today: "Today",
    tomorrow: "Tomorrow",
    done: "Done",
    pending: "Pending",
    overdue: "Overdue",
    all: "All",
    unread: "Unread",
    details: "Details",
    hide: "Hide",
  },

  alerts: {
    systemOnlineTitle: "System online",
    systemOnlineMsg: "KrishiNethra simulation started — all sensors streaming live.",
    pumpBlockedTitle: "Pump blocked — tank empty",
    pumpBlockedMsg: "Pump cannot run: tank below 5%. Refill the tank.",
    moistureLowTitle: "Low soil moisture",
    moistureLowMsg: "Soil moisture is below the threshold — consider irrigation.",
    tempHighTitle: "High temperature",
    tempHighMsg: "Temperature is above the safe limit — mulch and shade crops.",
    diseaseTitle: "Disease detected",
    diseaseMsg: "A crop disease was detected — open the spray plan.",
    tankLowTitle: "Low water tank",
    tankLowMsg: "Tank is below the low mark — refill soon to keep irrigating.",
    aqiHighTitle: "Poor air quality",
    aqiHighMsg: "AQI is above the safe limit — delay foliar spraying.",
    pumpStartedTitle: "Pump started",
    pumpStartedMsg: "Irrigation pump turned ON — water is flowing.",
  },

  dashboard: {
    soilMoisture: "Soil Moisture",
    temperature: "Temperature",
    humidity: "Humidity",
    tankLevel: "Tank Level",
    waterUsed: "Water Used",
    pumpStatus: "Pump Status",
    zones: "Zones",
    todaysTasks: "Today's Tasks",
    weather: "Weather",
    healthScore: "Health Score",
    liveSensors: "Live Sensors",
    liveSensorsSub: "Streaming every second from simulation",
    pumping: "Pumping water…",
    pumpIdle: "Pump idle",
    manual: "Manual",
    autoAI: "Auto AI",
    scheduleMode: "Schedule",
    scanLeaf: "Scan Leaf",
    irrigateZoneB: "Irrigate Zone B",
    openGPT: "Open KrishiGPT",
    viewMap: "View Map",
    aiSuggestions: "AI Suggestions",
    waterToday: "Water Today",
    dailyReport: "AI Daily Report",
    quickActions: "Quick Actions",
  },

  irrigation: {
    pumpTitle: "Irrigation Pump",
    running: "RUNNING",
    idle: "IDLE",
    manual: "Manual",
    autoAI: "Auto AI",
    schedule: "Schedule",
    emergencyStop: "EMERGENCY STOP",
    quickRun: "Quick run",
    tankTitle: "Water Tank",
    refillTank: "Refill Tank",
    refilling: "Refilling…",
    scheduleTitle: "Schedule Mode",
    scheduleSub: "Weekly slots run automatically in Schedule mode",
    nextScheduled: "Next scheduled",
    noSlots: "No slots yet — add one below.",
    addSlot: "Add",
    usageTitle: "Water Usage",
    energyTitle: "Energy Monitor",
    historyTitle: "Run History",
    aiReasoning: "Auto AI reasoning · live",
  },

  camera: {
    liveView: "Live Farm View",
    leafScanner: "Leaf Scanner",
    panTilt: "Pan-Tilt Control",
    streamNote: "In LIVE mode this panel shows the real MJPEG stream from the Raspberry Pi camera.",
    simNote: "Currently showing the simulated feed — switch to stream in Settings → Camera.",
    center: "CENTER",
    sweepOn: "Auto-Sweep ON",
    sweepOff: "Auto-Sweep OFF",
  },

  tasks: {
    today: "Today",
    completed: "Completed",
    upcoming: "Upcoming",
    addTask: "Add Task",
    generateAI: "Generate AI Tasks",
    saveTask: "Save Task",
    title: "Title",
    priority: "Priority",
    dueDate: "Due date",
    zone: "Zone (optional)",
    noTasksToday: "Nothing due today — press “Generate AI Tasks” to build the day's plan.",
    allDone: "All done — farm is smiling 🌾",
    high: "High",
    medium: "Medium",
    low: "Low",
    dueToday: "Due today",
    dueTomorrow: "Due tomorrow",
  },

  alertsPage: {
    alertCenter: "Alert Center",
    telegramTitle: "Telegram Alerts",
    rulesTitle: "Alert Rules",
    markRead: "Mark all read",
    clearAll: "Clear all",
    searchPh: "Search alerts — try “moisture”, “tank”, “disease”…",
    testConnection: "Test Connection",
    sendTest: "Send test alert via pipeline",
    noAlerts: "No alerts — all clear 🌾",
    allCaughtUp: "all caught up",
  },

  assistant: {
    title: "KrishiGPT",
    subtitle: "Answers from live farm data · हिन्दी + English",
    placeholder: "Ask your question… (e.g. Should I irrigate today?)",
    listening: "Listening… speak now",
    fallback:
      "I didn't understand that question. I can help with: water, disease, fertilizer, weather, pump, tank, market prices, schemes, daily report. Try: “Should I irrigate today?”",
    help:
      "Namaste! I am KrishiGPT — I answer from your LIVE farm data: water, disease, fertilizer, weather, pump, tank, market prices, schemes and daily report. Pick a quick question below to start.",
    quickNote: "Quick questions",
  },

  voice: {
    ready: "Ready",
    listening: "Listening…",
    startListening: "Start Listening",
    stop: "Stop",
    voiceOutput: "Voice output",
    recognition: "Recognition",
    commandRef: "Command reference",
    recentCommands: "Recent commands",
    response: "Response",
  },

  report: {
    dailyReport: "AI Daily Report",
    periodReport: "Period Report",
    noHistory:
      "Not enough history yet — run the pump, log diary entries and scan a leaf, then check back. Today's live readings will seed this report automatically.",
    bestDay: "Best day",
    advice: "Recommendation for next week",
  },

  settings: {
    title: "Settings",
    subtitle: "Everything updates live — no reload needed",
    farmProfile: "Farm Profile",
    farmProfileSub: "Powers scheme recommendations + market advice",
    farmName: "Farm name",
    farmerName: "Farmer name",
    state: "State",
    farmSize: "Farm size (acres)",
    crops: "Crops you grow",
    gps: "Farm GPS (used by weather)",
    latitude: "Latitude",
    longitude: "Longitude",
    hasPump: "Irrigation pump",
    pumpYes: "Has pump",
    pumpNo: "No pump",
    language: "Language",
    languageSub: "Applies instantly to nav + all pages",
    irrigationThresholds: "Irrigation Thresholds",
    irrigationSub: "Auto-pump relay + alerts read these live",
    moistureLow: "Start irrigation below (moistureLow %)",
    moistureHigh: "Stop irrigation above (moistureHigh %)",
    pumpDuration: "Default manual run (pumpDurationSec)",
    tankLow: "Low-tank warning (tankLow %)",
    climateThresholds: "Climate Thresholds",
    climateSub: "Heat, dry-air and AQI warnings",
    tempHigh: "Heat warning above (tempHigh °C)",
    humidityLow: "Dry-air warning below (humidityLow %)",
    aqiHigh: "AQI warning above (aqiHigh)",
    camera: "Camera",
    cameraSub: "Simulation feed or live Raspberry Pi stream",
    source: "Source",
    simFeed: "Simulation",
    liveStream: "Live Stream",
    streamUrl: "Stream URL",
    panSpeed: "Pan speed",
    hardware: "Hardware Bridge",
    hardwareSub: "Connect a real Raspberry Pi gateway",
    simMode: "SIMULATION (demo)",
    liveMode: "LIVE (real hardware)",
    gatewayUrl: "Gateway URL",
    testConnection: "Test Connection",
    liveNote:
      "In LIVE mode the app polls the hardware gateway every 2s instead of the simulator.",
    alerts: "Alerts",
    alertsSub: "Telegram + sound + browser notifications",
    sound: "Alert sound",
    soundSub: "Soft beep for critical alerts",
    browserNotif: "Browser notifications",
    browserNotifSub: "Show system notifications for new alerts",
    enableNotif: "Enable notifications",
    voice: "Voice",
    voiceSub: "Spoken answers + recognition language",
    output: "Voice output",
    recLang: "Recognition language",
    data: "Data",
    dataSub: "Backup, restore and reset — stored on this device",
    exportBackup: "Export Backup JSON",
    importBackup: "Import Backup",
    resetFarm: "Reset Farm",
    resetTitle: "Reset farm to defaults?",
    resetMessage:
      "This clears zones, sensors, pump, alerts, scans, diary, tasks, spray plans and chat back to a fresh demo farm. This cannot be undone.",
    storageUsage: "Storage used",
  },

  onboarding: {
    stepOf: "Step {step} of 5",
    welcomeTitle: "KrishiNethra AI",
    welcomeSub: "Har Khet Ka AI Doctor — Your Farm's Intelligent Guardian",
    chooseLanguage: "Choose your language",
    getStarted: "Get Started →",
    farmerTitle: "Who's farming?",
    farmerSub: "Tell us about yourself — we personalise everything.",
    fullName: "Full name",
    fullNamePh: "e.g. Ramesh Patel",
    nameError: "Please enter at least 3 characters.",
    mobile: "Mobile number",
    mobileError: "Enter a valid 10-digit mobile starting with 6–9.",
    role: "Your role",
    roleFarmer: "Farmer",
    roleManager: "Farm Manager",
    roleStudent: "Student Researcher",
    avatar: "Pick an avatar (optional)",
    continue: "Continue →",
    back: "← Back",
    locationTitle: "Where is your farm?",
    locationSub: "We use this for weather, market & schemes.",
    detectLocation: "📍 Detect My Location",
    detecting: "Detecting… allow location access",
    detectedOk: "Location detected",
    permissionDenied: "Location permission denied — please pick your state & district manually.",
    manualTitle: "Or enter manually",
    stateLabel: "State",
    districtLabel: "District",
    districtPh: "Type your district",
    villageLabel: "Village / Taluka",
    villagePh: "e.g. Sanand, Ahmedabad",
    gpsLabel: "GPS coordinates",
    farmTitle: "Your farm profile",
    farmSub: "Size, soil, water & crops — AI tunes advice to this.",
    farmName: "Farm name",
    farmSize: "Farm size",
    soilType: "Soil type",
    waterSource: "Water source",
    irrigationMethod: "Irrigation method",
    powerSource: "Power source",
    crops: "Crops you grow",
    cropsHint: "Tap to select — first 3 become Zone A / B / C.",
    zonesPreview: "Zones: A → {a} · B → {b} · C → {c}",
    confirmTitle: "Ready to grow? 🌱",
    confirmSub: "Review everything — you can edit later in Settings.",
    pinToggle: "Protect app with PIN",
    pinToggleSub: "Future visits ask for a 4-digit PIN instead of the wizard.",
    setPin: "Set 4-digit PIN",
    startFarming: "🌾 Start Farming with AI",
    pinUnlockTitle: "Welcome back",
    pinUnlockSub: "Enter your 4-digit PIN to open your farm.",
    unlockButton: "Unlock Farm →",
    wrongPin: "Wrong PIN — try again.",
    editLater: "You can edit all of this later in Settings → Farm Profile.",
  },
};

const hi: TranslationDict = {
  tagline: "हर खेत का AI डॉक्टर — आपके खेत का बुद्धिमान रखवाला",
  pinLabel: "4 अंकों का पिन डालें",
  enterFarm: "खेत में प्रवेश करें",
  pinError: "कृपया 4 अंकों का पिन डालें",
  welcome: "आपके खेत में स्वागत है",
  appName: "कृषिनेत्र AI",

  nav: {
    dashboard: "डैशबोर्ड",
    map: "खेत का नक्शा",
    camera: "कैमरा व स्कैनर",
    irrigation: "सिंचाई",
    climate: "मौसम",
    spray: "स्प्रे योजना",
    fertilizer: "उर्वरक",
    market: "बाज़ार",
    schemes: "योजनाएं",
    diary: "डायरी",
    tasks: "कार्य",
    assistant: "कृषिGPT",
    reports: "रिपोर्ट",
    alerts: "चेतावनी",
    voice: "आवाज़",
    settings: "सेटिंग्स",
    more: "अधिक",
  },

  titles: {
    dashboard: "डैशबोर्ड",
    map: "खेत का नक्शा",
    camera: "कैमरा व स्कैनर",
    irrigation: "सिंचाई",
    climate: "मौसम",
    spray: "स्प्रे योजना",
    fertilizer: "उर्वरक",
    market: "बाज़ार भाव",
    schemes: "सरकारी योजनाएं",
    diary: "खेत डायरी",
    tasks: "कार्य",
    assistant: "कृषिGPT सहायक",
    reports: "रिपोर्ट",
    alerts: "चेतावनी",
    voice: "आवाज़ नियंत्रण",
    settings: "सेटिंग्स",
  },

  common: {
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    add: "जोड़ें",
    edit: "बदलें",
    close: "बंद करें",
    back: "वापस",
    search: "खोजें",
    refresh: "ताज़ा करें",
    viewAll: "सभी देखें",
    markAllRead: "सभी पढ़ा हुआ करें",
    loading: "लोड हो रहा है…",
    language: "भाषा",
    simulation: "सिमुलेशन",
    live: "लाइव",
    farmHealth: "खेत का स्वास्थ्य",
    farmHealthScore: "खेत स्वास्थ्य स्कोर",
    more: "अधिक",
    noAlerts: "कोई चेतावनी नहीं — सब ठीक है",
    recentAlerts: "ताज़ा चेतावनी",
    comingSoon: "पूरा मॉड्यूल अगले चरण में आएगा।",
    on: "चालू",
    off: "बंद",
    enabled: "चालू है",
    disabled: "बंद है",
    test: "जांचें",
    testing: "जांच हो रही है…",
    connected: "जुड़ गया",
    failed: "विफल",
    export: "निर्यात",
    import: "आयात",
    reset: "रीसेट",
    confirm: "पुष्टि करें",
    retry: "पुनः प्रयास",
    send: "भेजें",
    clear: "साफ़ करें",
    today: "आज",
    tomorrow: "कल",
    done: "पूर्ण",
    pending: "बकाया",
    overdue: "अतिदेय",
    all: "सभी",
    unread: "अपठित",
    details: "विवरण",
    hide: "छिपाएं",
  },

  alerts: {
    systemOnlineTitle: "सिस्टम चालू",
    systemOnlineMsg: "कृषिनेत्र सिमुलेशन शुरू — सभी सेंसर लाइव हैं।",
    pumpBlockedTitle: "पंप बंद — टंकी खाली",
    pumpBlockedMsg: "पंप नहीं चल सकता: टंकी 5% से कम है। टंकी भरें।",
    moistureLowTitle: "मिट्टी में नमी कम",
    moistureLowMsg: "मिट्टी की नमी सीमा से कम है — सिंचाई करें।",
    tempHighTitle: "तापमान अधिक",
    tempHighMsg: "तापमान सुरक्षित सीमा से ऊपर है — मल्चिंग व छाया करें।",
    diseaseTitle: "रोग पहचाना गया",
    diseaseMsg: "फसल में रोग मिला है — स्प्रे योजना खोलें।",
    tankLowTitle: "पानी की टंकी कम",
    tankLowMsg: "टंकी कम निशान से नीचे है — सिंचाई जारी रखने के लिए जल्द भरें।",
    aqiHighTitle: "खराब वायु गुणवत्ता",
    aqiHighMsg: "AQI सुरक्षित सीमा से ऊपर है — पत्तों पर छिड़काव टालें।",
    pumpStartedTitle: "पंप चालू",
    pumpStartedMsg: "सिंचाई पंप चालू हुआ — पानी बह रहा है।",
  },

  dashboard: {
    soilMoisture: "मिट्टी की नमी",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    tankLevel: "टंकी स्तर",
    waterUsed: "इस्तेमाल पानी",
    pumpStatus: "पंप स्थिति",
    zones: "ज़ोन",
    todaysTasks: "आज के कार्य",
    weather: "मौसम",
    healthScore: "स्वास्थ्य स्कोर",
    liveSensors: "लाइव सेंसर",
    liveSensorsSub: "सिमुलेशन से हर सेकंड स्ट्रीमिंग",
    pumping: "पानी चल रहा है…",
    pumpIdle: "पंप बंद है",
    manual: "मैनुअल",
    autoAI: "ऑटो AI",
    scheduleMode: "शेड्यूल",
    scanLeaf: "पत्ती स्कैन",
    irrigateZoneB: "ज़ोन B सींचें",
    openGPT: "कृषिGPT खोलें",
    viewMap: "नक्शा देखें",
    aiSuggestions: "AI सुझाव",
    waterToday: "आज का पानी",
    dailyReport: "AI दैनिक रिपोर्ट",
    quickActions: "त्वरित कार्य",
  },

  irrigation: {
    pumpTitle: "सिंचाई पंप",
    running: "चल रहा है",
    idle: "बंद है",
    manual: "मैनुअल",
    autoAI: "ऑटो AI",
    schedule: "शेड्यूल",
    emergencyStop: "आपातकालीन रोक",
    quickRun: "त्वरित रन",
    tankTitle: "पानी की टंकी",
    refillTank: "टंकी भरें",
    refilling: "भरी जा रही है…",
    scheduleTitle: "शेड्यूल मोड",
    scheduleSub: "शेड्यूल मोड में साप्ताहिक स्लॉट अपने-आप चलते हैं",
    nextScheduled: "अगला निर्धारित",
    noSlots: "अभी कोई स्लॉट नहीं — नीचे जोड़ें।",
    addSlot: "जोड़ें",
    usageTitle: "पानी का उपयोग",
    energyTitle: "ऊर्जा मॉनिटर",
    historyTitle: "रन इतिहास",
    aiReasoning: "ऑटो AI तर्क · लाइव",
  },

  camera: {
    liveView: "लाइव खेत दृश्य",
    leafScanner: "पत्ती स्कैनर",
    panTilt: "पैन-टिल्ट नियंत्रण",
    streamNote: "लाइव मोड में यह पैनल रास्पबेरी पाई कैमरे की असली MJPEG स्ट्रीम दिखाता है।",
    simNote: "अभी सिमुलेटेड फीड दिख रही है — स्ट्रीम के लिए सेटिंग्स → कैमरा में बदलें।",
    center: "बीच में",
    sweepOn: "ऑटो-स्वीप चालू",
    sweepOff: "ऑटो-स्वीप बंद",
  },

  tasks: {
    today: "आज",
    completed: "पूर्ण",
    upcoming: "आगामी",
    addTask: "कार्य जोड़ें",
    generateAI: "AI कार्य बनाएं",
    saveTask: "कार्य सहेजें",
    title: "शीर्षक",
    priority: "प्राथमिकता",
    dueDate: "नियत तिथि",
    zone: "ज़ोन (वैकल्पिक)",
    noTasksToday: "आज कुछ बकाया नहीं — दिन की योजना के लिए “AI कार्य बनाएं” दबाएं।",
    allDone: "सब पूर्ण — खेत मुस्कुरा रहा है 🌾",
    high: "उच्च",
    medium: "मध्यम",
    low: "कम",
    dueToday: "आज नियत",
    dueTomorrow: "कल नियत",
  },

  alertsPage: {
    alertCenter: "चेतावनी केंद्र",
    telegramTitle: "टेलीग्राम चेतावनी",
    rulesTitle: "चेतावनी नियम",
    markRead: "सभी पढ़ा हुआ करें",
    clearAll: "सभी साफ़ करें",
    searchPh: "चेतावनी खोजें — “नमी”, “टंकी”, “रोग”…",
    testConnection: "कनेक्शन जांचें",
    sendTest: "पाइपलाइन से टेस्ट चेतावनी भेजें",
    noAlerts: "कोई चेतावनी नहीं — सब ठीक 🌾",
    allCaughtUp: "सब देख लिया",
  },

  assistant: {
    title: "कृषिGPT",
    subtitle: "लाइव खेत डेटा से जवाब · हिन्दी + English",
    placeholder: "अपना सवाल लिखें… (जैसे आज पानी देना चाहिए?)",
    listening: "सुन रहे हैं… बोलिए",
    fallback:
      "यह सवाल समझ नहीं आया। मैं इनमें मदद कर सकता हूँ: पानी, रोग, खाद, मौसम, पंप, टंकी, बाज़ार भाव, योजना, दैनिक रिपोर्ट। कोशिश करें: “आज पानी देना चाहिए?”",
    help:
      "नमस्ते! मैं कृषिGPT हूँ — आपके LIVE खेत डेटा से जवाब देता हूँ: पानी, रोग, खाद, मौसम, पंप, टंकी, बाज़ार भाव, योजना और दैनिक रिपोर्ट। शुरू करने के लिए नीचे कोई सवाल चुनें।",
    quickNote: "त्वरित सवाल",
  },

  voice: {
    ready: "तैयार",
    listening: "सुन रहे हैं…",
    startListening: "सुनना शुरू करें",
    stop: "रोकें",
    voiceOutput: "आवाज़ आउटपुट",
    recognition: "पहचान",
    commandRef: "कमांड सूची",
    recentCommands: "हाल के कमांड",
    response: "जवाब",
  },

  report: {
    dailyReport: "AI दैनिक रिपोर्ट",
    periodReport: "अवधि रिपोर्ट",
    noHistory:
      "अभी पर्याप्त इतिहास नहीं है — पंप चलाएं, डायरी लिखें और पत्ती स्कैन करें, फिर देखें। आज की लाइव रीडिंग से यह रिपोर्ट अपने-आप बनेगी।",
    bestDay: "सबसे अच्छा दिन",
    advice: "अगले सप्ताह की सलाह",
  },

  settings: {
    title: "सेटिंग्स",
    subtitle: "सब कुछ लाइव लागू होता है — रीलोड की ज़रूरत नहीं",
    farmProfile: "फार्म प्रोफ़ाइल",
    farmProfileSub: "योजना सुझाव + बाज़ार सलाह को शक्ति देती है",
    farmName: "खेत का नाम",
    farmerName: "किसान का नाम",
    state: "राज्य",
    farmSize: "खेत का आकार (एकड़)",
    crops: "आपकी फसलें",
    gps: "खेत GPS (मौसम के लिए)",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    hasPump: "सिंचाई पंप",
    pumpYes: "पंप है",
    pumpNo: "पंप नहीं",
    language: "भाषा",
    languageSub: "नेविगेशन + सभी पेजों पर तुरंत लागू",
    irrigationThresholds: "सिंचाई सीमाएं",
    irrigationSub: "ऑटो-पंप रिले + चेतावनी इन्हें लाइव पढ़ते हैं",
    moistureLow: "इससे कम नमी पर सिंचाई शुरू (moistureLow %)",
    moistureHigh: "इससे अधिक नमी पर रोकें (moistureHigh %)",
    pumpDuration: "डिफ़ॉल्ट मैनुअल रन (pumpDurationSec)",
    tankLow: "टंकी कम चेतावनी (tankLow %)",
    climateThresholds: "जलवायु सीमाएं",
    climateSub: "गर्मी, शुष्क हवा और AQI चेतावनी",
    tempHigh: "इससे ऊपर गर्मी चेतावनी (tempHigh °C)",
    humidityLow: "इससे कम शुष्क-हवा चेतावनी (humidityLow %)",
    aqiHigh: "इससे ऊपर AQI चेतावनी (aqiHigh)",
    camera: "कैमरा",
    cameraSub: "सिमुलेशन फीड या लाइव रास्पबेरी पाई स्ट्रीम",
    source: "स्रोत",
    simFeed: "सिमुलेशन",
    liveStream: "लाइव स्ट्रीम",
    streamUrl: "स्ट्रीम URL",
    panSpeed: "पैन गति",
    hardware: "हार्डवेयर ब्रिज",
    hardwareSub: "असली रास्पबेरी पाई गेटवे जोड़ें",
    simMode: "सिमुलेशन (डेमो)",
    liveMode: "लाइव (असली हार्डवेयर)",
    gatewayUrl: "गेटवे URL",
    testConnection: "कनेक्शन जांचें",
    liveNote: "लाइव मोड में ऐप सिमुलेटर की जगह हर 2 सेकंड में हार्डवेयर गेटवे से डेटा लेता है।",
    alerts: "चेतावनी",
    alertsSub: "टेलीग्राम + आवाज़ + ब्राउज़र सूचनाएं",
    sound: "चेतावनी ध्वनि",
    soundSub: "गंभीर चेतावनी पर हल्की बीप",
    browserNotif: "ब्राउज़र सूचनाएं",
    browserNotifSub: "नई चेतावनी पर सिस्टम सूचना दिखाएं",
    enableNotif: "सूचनाएं चालू करें",
    voice: "आवाज़",
    voiceSub: "बोले गए जवाब + पहचान भाषा",
    output: "आवाज़ आउटपुट",
    recLang: "पहचान भाषा",
    data: "डेटा",
    dataSub: "बैकअप, रिस्टोर और रीसेट — इसी डिवाइस पर",
    exportBackup: "बैकअप JSON निर्यात करें",
    importBackup: "बैकअप आयात करें",
    resetFarm: "फार्म रीसेट करें",
    resetTitle: "फार्म डिफ़ॉल्ट पर रीसेट करें?",
    resetMessage:
      "इससे ज़ोन, सेंसर, पंप, चेतावनी, स्कैन, डायरी, कार्य, स्प्रे योजना और चैट ताज़ा डेमो फार्म पर वापस जाएंगे। यह वापस नहीं होगा।",
    storageUsage: "इस्तेमाल स्टोरेज",
  },

  onboarding: {
    stepOf: "चरण {step} / 5",
    welcomeTitle: "कृषिनेत्र AI",
    welcomeSub: "हर खेत का AI डॉक्टर — आपके खेत का बुद्धिमान रखवाला",
    chooseLanguage: "अपनी भाषा चुनें",
    getStarted: "शुरू करें →",
    farmerTitle: "खेती कौन कर रहा है?",
    farmerSub: "अपने बारे में बताएं — सब कुछ आपके लिए बनेगा।",
    fullName: "पूरा नाम",
    fullNamePh: "जैसे रमेश पटेल",
    nameError: "कृपया कम से कम 3 अक्षर लिखें।",
    mobile: "मोबाइल नंबर",
    mobileError: "6–9 से शुरू होने वाला सही 10-अंकीय नंबर डालें।",
    role: "आपकी भूमिका",
    roleFarmer: "किसान",
    roleManager: "फार्म मैनेजर",
    roleStudent: "छात्र शोधकर्ता",
    avatar: "अवतार चुनें (वैकल्पिक)",
    continue: "आगे बढ़ें →",
    back: "← वापस",
    locationTitle: "आपका खेत कहाँ है?",
    locationSub: "मौसम, बाज़ार व योजनाओं के लिए इसका उपयोग होगा।",
    detectLocation: "📍 मेरी लोकेशन पहचानें",
    detecting: "पहचान रहे हैं… लोकेशन की अनुमति दें",
    detectedOk: "लोकेशन मिल गई",
    permissionDenied: "लोकेशन अनुमति नहीं मिली — कृपया राज्य व जिला खुद चुनें।",
    manualTitle: "या खुद लिखें",
    stateLabel: "राज्य",
    districtLabel: "जिला",
    districtPh: "अपना जिला लिखें",
    villageLabel: "गाँव / तालुका",
    villagePh: "जैसे सानंद, अहमदाबाद",
    gpsLabel: "GPS निर्देशांक",
    farmTitle: "आपके खेत की जानकारी",
    farmSub: "आकार, मिट्टी, पानी व फसल — AI सलाह इसी पर बनेगी।",
    farmName: "खेत का नाम",
    farmSize: "खेत का आकार",
    soilType: "मिट्टी का प्रकार",
    waterSource: "पानी का स्रोत",
    irrigationMethod: "सिंचाई विधि",
    powerSource: "बिजली का स्रोत",
    crops: "आपकी फसलें",
    cropsHint: "चुनने के लिए दबाएं — पहली 3 ज़ोन A / B / C बनेंगी।",
    zonesPreview: "ज़ोन: A → {a} · B → {b} · C → {c}",
    confirmTitle: "उगाने के लिए तैयार? 🌱",
    confirmSub: "सब कुछ देख लें — बाद में सेटिंग्स में बदल सकते हैं।",
    pinToggle: "ऐप को PIN से सुरक्षित करें",
    pinToggleSub: "अगली बार विज़ार्ड की जगह 4-अंकीय PIN माँगा जाएगा।",
    setPin: "4-अंकीय PIN बनाएं",
    startFarming: "🌾 AI के साथ खेती शुरू करें",
    pinUnlockTitle: "वापसी पर स्वागत है",
    pinUnlockSub: "अपना खेत खोलने के लिए 4-अंकीय PIN डालें।",
    unlockButton: "खेत खोलें →",
    wrongPin: "गलत PIN — फिर कोशिश करें।",
    editLater: "आप यह सब बाद में सेटिंग्स → फार्म प्रोफ़ाइल में बदल सकते हैं।",
  },
};

/* Gujarati / Marathi: translated nav + titles + buttons + common labels.
   Everything else falls back to Hindi via deepMerge below. */
const guPartial: DeepPartial<TranslationDict> = {
  tagline: "દરેક ખેતરનો AI ડૉક્ટર — તમારા ખેતરનો બુદ્ધિશાળી રખેવાળ",
  pinLabel: "4-અંકનો PIN નાખો",
  enterFarm: "ખેતરમાં પ્રવેશો",
  pinError: "કૃપા કરીને 4-અંકનો PIN નાખો",
  welcome: "તમારા ખેતરમાં સ્વાગત છે",
  appName: "કૃષિનેત્ર AI",
  nav: {
    dashboard: "ડેશબોર્ડ",
    map: "ખેતરનો નકશો",
    camera: "કેમેરા અને સ્કેનર",
    irrigation: "સિંચાઈ",
    climate: "હવામાન",
    spray: "સ્પ્રે પ્લાનર",
    fertilizer: "ખાતર",
    market: "બજાર",
    schemes: "યોજનાઓ",
    diary: "ડાયરી",
    tasks: "કાર્યો",
    assistant: "કૃષિGPT",
    reports: "અહેવાલો",
    alerts: "ચેતવણીઓ",
    voice: "અવાજ",
    settings: "સેટિંગ્સ",
    more: "વધુ",
  },
  titles: {
    dashboard: "ડેશબોર્ડ",
    map: "ખેતરનો નકશો",
    camera: "કેમેરા અને સ્કેનર",
    irrigation: "સિંચાઈ",
    climate: "હવામાન",
    spray: "સ્પ્રે પ્લાનર",
    fertilizer: "ખાતર",
    market: "બજાર ભાવ",
    schemes: "સરકારી યોજનાઓ",
    diary: "ખેત ડાયરી",
    tasks: "કાર્યો",
    assistant: "કૃષિGPT સહાયક",
    reports: "અહેવાલો",
    alerts: "ચેતવણીઓ",
    voice: "અવાજ નિયંત્રણ",
    settings: "સેટિંગ્સ",
  },
  common: {
    save: "સાચવો",
    cancel: "રદ કરો",
    delete: "કાઢો",
    add: "ઉમેરો",
    edit: "બદલો",
    close: "બંધ કરો",
    back: "પાછા",
    search: "શોધો",
    refresh: "તાજું કરો",
    viewAll: "બધું જુઓ",
    markAllRead: "બધું વાંચેલું કરો",
    loading: "લોડ થઈ રહ્યું છે…",
    language: "ભાષા",
    simulation: "સિમ્યુલેશન",
    live: "લાઈવ",
    farmHealth: "ખેત આરોગ્ય",
    farmHealthScore: "ખેત આરોગ્ય સ્કોર",
    more: "વધુ",
    noAlerts: "કોઈ ચેતવણી નથી — બધું બરાબર છે",
    recentAlerts: "તાજેતરની ચેતવણીઓ",
    comingSoon: "સંપૂર્ણ મોડ્યુલ આગામી તબક્કામાં આવશે.",
    on: "ચાલુ",
    off: "બંધ",
    enabled: "ચાલુ છે",
    disabled: "બંધ છે",
    test: "તપાસો",
    testing: "તપાસ ચાલુ છે…",
    connected: "જોડાયેલ",
    failed: "નિષ્ફળ",
    export: "નિકાસ",
    import: "આયાત",
    reset: "રીસેટ",
    confirm: "પુષ્ટિ કરો",
    retry: "ફરી પ્રયાસ",
    send: "મોકલો",
    clear: "સાફ કરો",
    today: "આજે",
    tomorrow: "આવતીકાલે",
    done: "પૂર્ણ",
    pending: "બાકી",
    overdue: "મોડું",
    all: "બધું",
    unread: "ન વાંચેલ",
    details: "વિગતો",
    hide: "છુપાવો",
  },
  dashboard: {
    soilMoisture: "જમીનનો ભેજ",
    temperature: "તાપમાન",
    humidity: "ભેજ",
    tankLevel: "ટાંકી સ્તર",
    waterUsed: "વપરાયેલ પાણી",
    pumpStatus: "પંપ સ્થિતિ",
    zones: "ઝોન",
    todaysTasks: "આજનાં કાર્યો",
    weather: "હવામાન",
    healthScore: "આરોગ્ય સ્કોર",
    liveSensors: "લાઈવ સેન્સર",
    pumping: "પાણી ચાલુ છે…",
    pumpIdle: "પંપ બંધ છે",
    manual: "મેન્યુઅલ",
    autoAI: "ઓટો AI",
    scheduleMode: "શેડ્યૂલ",
    scanLeaf: "પાન સ્કેન",
    irrigateZoneB: "ઝોન B સિંચાઈ",
    openGPT: "કૃષિGPT ખોલો",
    viewMap: "નકશો જુઓ",
    aiSuggestions: "AI સૂચનો",
    waterToday: "આજનું પાણી",
    dailyReport: "AI દૈનિક અહેવાલ",
    quickActions: "ઝડપી કાર્યો",
  },
  irrigation: {
    pumpTitle: "સિંચાઈ પંપ",
    running: "ચાલુ છે",
    idle: "બંધ છે",
    manual: "મેન્યુઅલ",
    autoAI: "ઓટો AI",
    schedule: "શેડ્યૂલ",
    emergencyStop: "ઈમરજન્સી સ્ટોપ",
    tankTitle: "પાણીની ટાંકી",
    refillTank: "ટાંકી ભરો",
    scheduleTitle: "શેડ્યૂલ મોડ",
    addSlot: "ઉમેરો",
    usageTitle: "પાણીનો વપરાશ",
    energyTitle: "ઊર્જા મોનિટર",
    historyTitle: "રન ઇતિહાસ",
  },
  camera: {
    liveView: "લાઈવ ખેત દૃશ્ય",
    leafScanner: "પાન સ્કેનર",
    panTilt: "પેન-ટિલ્ટ નિયંત્રણ",
    center: "વચ્ચે",
  },
  tasks: {
    today: "આજે",
    completed: "પૂર્ણ",
    upcoming: "આગામી",
    addTask: "કાર્ય ઉમેરો",
    generateAI: "AI કાર્યો બનાવો",
    saveTask: "કાર્ય સાચવો",
    high: "ઉચ્ચ",
    medium: "મધ્યમ",
    low: "નીચું",
    dueToday: "આજે બાકી",
    dueTomorrow: "આવતીકાલે બાકી",
  },
  alertsPage: {
    alertCenter: "ચેતવણી કેન્દ્ર",
    telegramTitle: "ટેલિગ્રામ ચેતવણી",
    rulesTitle: "ચેતવણી નિયમો",
    markRead: "બધું વાંચેલું કરો",
    clearAll: "બધું સાફ કરો",
    testConnection: "કનેક્શન તપાસો",
    noAlerts: "કોઈ ચેતવણી નથી 🌾",
  },
  assistant: {
    title: "કૃષિGPT",
    placeholder: "તમારો સવાલ લખો…",
  },
  voice: {
    startListening: "સાંભળવાનું શરૂ કરો",
    stop: "રોકો",
    voiceOutput: "અવાજ આઉટપુટ",
    commandRef: "કમાન્ડ યાદી",
    recentCommands: "તાજેતરના કમાન્ડ",
  },
  settings: {
    title: "સેટિંગ્સ",
    farmProfile: "ફાર્મ પ્રોફાઇલ",
    farmName: "ખેતરનું નામ",
    farmerName: "ખેડૂતનું નામ",
    state: "રાજ્ય",
    farmSize: "ખેતરનું કદ (એકર)",
    crops: "તમારા પાકો",
    language: "ભાષા",
    irrigationThresholds: "સિંચાઈ મર્યાદા",
    climateThresholds: "આબોહવા મર્યાદા",
    camera: "કેમેરા",
    hardware: "હાર્ડવેર બ્રિજ",
    alerts: "ચેતવણીઓ",
    voice: "અવાજ",
    data: "ડેટા",
    exportBackup: "બેકઅપ JSON નિકાસ",
    importBackup: "બેકઅપ આયાત",
    resetFarm: "ફાર્મ રીસેટ",
    testConnection: "કનેક્શન તપાસો",
  },
  onboarding: {
    stepOf: "પગલું {step} / 5",
    welcomeSub: "દરેક ખેતરનો AI ડૉક્ટર — તમારા ખેતરનો બુદ્ધિશાળી રખેવાળ",
    chooseLanguage: "તમારી ભાષા પસંદ કરો",
    getStarted: "શરૂ કરો →",
    farmerTitle: "ખેતી કોણ કરે છે?",
    farmerSub: "તમારા વિશે જણાવો — બધું તમારા માટે બનશે.",
    fullName: "પૂરું નામ",
    mobile: "મોબાઇલ નંબર",
    mobileError: "6–9 થી શરૂ થતો સાચો 10-અંકનો નંબર નાખો.",
    nameError: "કૃપા કરીને ઓછામાં ઓછા 3 અક્ષર લખો.",
    continue: "આગળ વધો →",
    back: "← પાછા",
    locationTitle: "તમારું ખેતર ક્યાં છે?",
    detectLocation: "📍 મારું લોકેશન શોધો",
    permissionDenied: "લોકેશન પરવાનગી ન મળી — કૃપા કરીને રાજ્ય અને જિલ્લો જાતે પસંદ કરો.",
    farmTitle: "તમારી ખેત પ્રોફાઇલ",
    cropsHint: "પસંદ કરવા ટેપ કરો — પહેલા 3 ઝોન A / B / C બનશે.",
    confirmTitle: "ઉગાડવા તૈયાર? 🌱",
    startFarming: "🌾 AI સાથે ખેતી શરૂ કરો",
    pinUnlockTitle: "પાછા આવ્યા — સ્વાગત છે",
    unlockButton: "ખેતર ખોલો →",
    wrongPin: "ખોટો PIN — ફરી પ્રયાસ કરો.",
  },
};

const mrPartial: DeepPartial<TranslationDict> = {
  tagline: "प्रत्येक शेताचा AI डॉक्टर — तुमच्या शेताचा बुद्धिमान रक्षक",
  pinLabel: "4-अंकी PIN टाका",
  enterFarm: "शेतात प्रवेश करा",
  pinError: "कृपया 4-अंकी PIN टाका",
  welcome: "तुमच्या शेतात स्वागत आहे",
  appName: "कृषिनेत्र AI",
  nav: {
    dashboard: "डॅशबोर्ड",
    map: "शेताचा नकाशा",
    camera: "कॅमेरा व स्कॅनर",
    irrigation: "सिंचन",
    climate: "हवामान",
    spray: "फवारणी नियोजन",
    fertilizer: "खत",
    market: "बाजार",
    schemes: "योजना",
    diary: "दैनंदिनी",
    tasks: "कामे",
    assistant: "कृषीGPT",
    reports: "अहवाल",
    alerts: "सूचना",
    voice: "आवाज",
    settings: "सेटिंग्ज",
    more: "अधिक",
  },
  titles: {
    dashboard: "डॅशबोर्ड",
    map: "शेताचा नकाशा",
    camera: "कॅमेरा व स्कॅनर",
    irrigation: "सिंचन",
    climate: "हवामान",
    spray: "फवारणी नियोजन",
    fertilizer: "खत",
    market: "बाजारभाव",
    schemes: "शासकीय योजना",
    diary: "शेत दैनंदिनी",
    tasks: "कामे",
    assistant: "कृषीGPT सहाय्यक",
    reports: "अहवाल",
    alerts: "सूचना",
    voice: "आवाज नियंत्रण",
    settings: "सेटिंग्ज",
  },
  common: {
    save: "जतन करा",
    cancel: "रद्द करा",
    delete: "हटवा",
    add: "जोडा",
    edit: "बदला",
    close: "बंद करा",
    back: "मागे",
    search: "शोधा",
    refresh: "ताजे करा",
    viewAll: "सर्व पहा",
    markAllRead: "सर्व वाचले म्हणून चिन्हांकित करा",
    loading: "लोड होत आहे…",
    language: "भाषा",
    simulation: "सिम्युलेशन",
    live: "लाइव्ह",
    farmHealth: "शेत आरोग्य",
    farmHealthScore: "शेत आरोग्य स्कोअर",
    more: "अधिक",
    noAlerts: "कोणतीही सूचना नाही — सर्व ठीक आहे",
    recentAlerts: "अलीकडील सूचना",
    comingSoon: "संपूर्ण मॉड्यूल पुढील टप्प्यात येईल.",
    on: "चालू",
    off: "बंद",
    enabled: "चालू आहे",
    disabled: "बंद आहे",
    test: "तपासा",
    testing: "तपासत आहे…",
    connected: "जोडले",
    failed: "अयशस्वी",
    export: "निर्यात",
    import: "आयात",
    reset: "रीसेट",
    confirm: "पुष्टी करा",
    retry: "पुन्हा प्रयत्न",
    send: "पाठवा",
    clear: "साफ करा",
    today: "आज",
    tomorrow: "उद्या",
    done: "पूर्ण",
    pending: "प्रलंबित",
    overdue: "थकीत",
    all: "सर्व",
    unread: "न वाचलेले",
    details: "तपशील",
    hide: "लपवा",
  },
  dashboard: {
    soilMoisture: "जमिनीतील ओलावा",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    tankLevel: "टाकी पातळी",
    waterUsed: "वापरलेले पाणी",
    pumpStatus: "पंप स्थिती",
    zones: "झोन",
    todaysTasks: "आजची कामे",
    weather: "हवामान",
    healthScore: "आरोग्य स्कोअर",
    liveSensors: "लाइव्ह सेन्सर",
    pumping: "पाणी सुरू आहे…",
    pumpIdle: "पंप बंद आहे",
    manual: "मॅन्युअल",
    autoAI: "ऑटो AI",
    scheduleMode: "शेड्यूल",
    scanLeaf: "पान स्कॅन",
    irrigateZoneB: "झोन B सिंचन",
    openGPT: "कृषीGPT उघडा",
    viewMap: "नकाशा पहा",
    aiSuggestions: "AI सूचना",
    waterToday: "आजचे पाणी",
    dailyReport: "AI दैनिक अहवाल",
    quickActions: "जलद कृती",
  },
  irrigation: {
    pumpTitle: "सिंचन पंप",
    running: "सुरू आहे",
    idle: "बंद आहे",
    manual: "मॅन्युअल",
    autoAI: "ऑटो AI",
    schedule: "शेड्यूल",
    emergencyStop: "आपत्कालीन थांबा",
    tankTitle: "पाण्याची टाकी",
    refillTank: "टाकी भरा",
    scheduleTitle: "शेड्यूल मोड",
    addSlot: "जोडा",
    usageTitle: "पाणी वापर",
    energyTitle: "ऊर्जा मॉनिटर",
    historyTitle: "रन इतिहास",
  },
  camera: {
    liveView: "लाइव्ह शेत दृश्य",
    leafScanner: "पान स्कॅनर",
    panTilt: "पॅन-टिल्ट नियंत्रण",
    center: "मध्यभागी",
  },
  tasks: {
    today: "आज",
    completed: "पूर्ण",
    upcoming: "आगामी",
    addTask: "काम जोडा",
    generateAI: "AI कामे तयार करा",
    saveTask: "काम जतन करा",
    high: "उच्च",
    medium: "मध्यम",
    low: "कमी",
    dueToday: "आज मुदत",
    dueTomorrow: "उद्या मुदत",
  },
  alertsPage: {
    alertCenter: "सूचना केंद्र",
    telegramTitle: "टेलिग्राम सूचना",
    rulesTitle: "सूचना नियम",
    markRead: "सर्व वाचले करा",
    clearAll: "सर्व साफ करा",
    testConnection: "कनेक्शन तपासा",
    noAlerts: "कोणतीही सूचना नाही 🌾",
  },
  assistant: {
    title: "कृषीGPT",
    placeholder: "तुमचा प्रश्न लिहा…",
  },
  voice: {
    startListening: "ऐकायला सुरुवात करा",
    stop: "थांबा",
    voiceOutput: "आवाज आउटपुट",
    commandRef: "कमांड यादी",
    recentCommands: "अलीकडील कमांड",
  },
  settings: {
    title: "सेटिंग्ज",
    farmProfile: "शेत प्रोफाइल",
    farmName: "शेताचे नाव",
    farmerName: "शेतकऱ्याचे नाव",
    state: "राज्य",
    farmSize: "शेत आकार (एकर)",
    crops: "तुमची पिके",
    language: "भाषा",
    irrigationThresholds: "सिंचन मर्यादा",
    climateThresholds: "हवामान मर्यादा",
    camera: "कॅमेरा",
    hardware: "हार्डवेअर ब्रिज",
    alerts: "सूचना",
    voice: "आवाज",
    data: "डेटा",
    exportBackup: "बॅकअप JSON निर्यात",
    importBackup: "बॅकअप आयात",
    resetFarm: "शेत रीसेट",
    testConnection: "कनेक्शन तपासा",
  },
  onboarding: {
    stepOf: "पायरी {step} / 5",
    welcomeSub: "प्रत्येक शेताचा AI डॉक्टर — तुमच्या शेताचा बुद्धिमान रक्षक",
    chooseLanguage: "तुमची भाषा निवडा",
    getStarted: "सुरुवात करा →",
    farmerTitle: "शेती कोण करत आहे?",
    fullName: "पूर्ण नाव",
    mobile: "मोबाईल नंबर",
    mobileError: "6–9 ने सुरू होणारा बरोबर 10-अंकी नंबर टाका.",
    nameError: "कृपया किमान 3 अक्षरे लिहा.",
    continue: "पुढे जा →",
    back: "← मागे",
    locationTitle: "तुमचे शेत कुठे आहे?",
    detectLocation: "📍 माझे लोकेशन शोधा",
    permissionDenied: "लोकेशन परवानगी नाकारली — कृपया राज्य व जिल्हा स्वतः निवडा.",
    farmTitle: "तुमची शेत प्रोफाइल",
    cropsHint: "निवडण्यासाठी टॅप करा — पहिली 3 झोन A / B / C बनतील.",
    confirmTitle: "पिकवायला तयार? 🌱",
    startFarming: "🌾 AI सोबत शेती सुरू करा",
    pinUnlockTitle: "परत स्वागत आहे",
    unlockButton: "शेत उघडा →",
    wrongPin: "चुकीचा PIN — पुन्हा प्रयत्न करा.",
  },
};

export const translations: Record<LanguageCode, TranslationDict> = {
  en,
  hi,
  gu: deepMerge(hi, guPartial),
  mr: deepMerge(hi, mrPartial),
};
