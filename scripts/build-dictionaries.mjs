// Generator script for KrishiNethra quadrilingual dictionaries (EN, HI, GU, MR)
// validate terms with Krishi Vigyan Kendra
import fs from 'fs';
import path from 'path';

// Let's create the dict directory if it doesn't exist
const dictDir = path.resolve('src/lib/i18n/dict');
if (!fs.existsSync(dictDir)) {
  fs.mkdirSync(dictDir, { recursive: true });
}

// Master translations structure: each key has { en, hi, gu, mr }
const T = {};

function add(key, enVal, hiVal, guVal, mrVal) {
  if (T[key]) {
    console.warn(`Duplicate key: ${key}`);
  }
  T[key] = {
    en: enVal,
    hi: hiVal,
    gu: guVal,
    mr: mrVal
  };
}

// ==========================================
// 1. BRANDING & LANDING
// ==========================================
add("appName", "KrishiNethra AI", "कृषिनेत्र AI", "કૃષિનેત્ર AI", "कृषिनेत्र AI");
add("tagline", "Har Khet Ka AI Doctor — Your Farm's Intelligent Guardian", "हर खेत का AI डॉक्टर — आपके खेत का बुद्धिमान रखवाला", "દરેક ખેતરનો AI ડૉક્ટર — તમારા ખેતરનો બુદ્ધિશાળી રખેવાળ", "प्रत्येक शेताचा AI डॉक्टर — तुमच्या शेताचा हुशार रक्षक");
add("pinLabel", "Enter 4-digit PIN", "4 अंकों का पिन डालें", "4-અંકનો PIN નાખો", "4-अंकी पिन प्रविष्ट करा");
add("enterFarm", "ENTER FARM", "खेत में प्रवेश करें", "ખેતરમાં પ્રવેશો", "शेतात प्रवेश करा");
add("pinError", "Please enter a 4-digit PIN", "कृपया 4 अंकों का पिन डालें", "કૃપા કરીને 4-અંકનો PIN નાખો", "कृपया 4-अंकी पिन टाका");
add("welcome", "Welcome to your farm", "आपके खेत में स्वागत है", "તમારા ખેતરમાં સ્વાગત છે", "तुमच्या शेतात स्वागत आहे");

// Landing Navigation
add("landing.navOverview", "OVERVIEW", "अवलोकन", "ઝાંખી", "विहंगावलोकन");
add("landing.navFieldDeck", "FIELD DECK", "फील्ड डेक", "ફીલ્ડ ડેક", "फील्ड डेक");
add("landing.navCropLedger", "CROP LEDGER", "फसल बहीखाता", "પાક ખાતાવહી", "पीक नोंदवही");
add("landing.navAgentGarden", "AGENT GARDEN", "एजेंट गार्डन", "એજન્ટ ગાર્ડન", "एजंट गार्डन");
add("landing.navHowItWorks", "HOW IT WORKS", "यह कैसे काम करता है", "આ કેવી રીતે કામ કરે છે", "हे कसे कार्य करते");
add("landing.navFarmStudio", "FARM STUDIO", "फार्म स्टूडियो", "ફાર્મ સ્ટુડિયો", "फार्म स्टुडिओ");
add("landing.tryCta", "Try KrishiNethra AI ↗", "कृषिनेत्र AI आज़माएं ↗", "કૃષિનેત્ર AI અજમાવો ↗", "कृषिनेत्र AI वापरून पहा ↗");
add("landing.heroBadge", "Har Khet Ka AI Doctor • Live Telemetry & Edge AI", "हर खेत का AI डॉक्टर • लाइव टेलीमेट्री और एज AI", "દરેક ખેતરનો AI ડૉક્ટર • લાઈવ ટેલિમેટ્રી અને એજ AI", "प्रत्येक शेताचा AI डॉक्टर • थेट टेलिमेट्री व एज AI");
add("landing.heroH1", "Stop the guesswork. Start the growth.", "अटकलें बंद करें। उपज बढ़ाएं।", "અટકળો બંધ કરો. ઉપજ વધારો.", "अंदाज बांधणे थांबवा. उत्पादन वाढवा.");
add("landing.heroSub", "Har Khet Ka AI Doctor: offline-first smart farm command center with live sensors, AI agent reasoning, and edge irrigation control.", "हर खेत का AI डॉक्टर: लाइव सेंसर, AI एजेंट रीजनिंग और एज सिंचाई नियंत्रण के साथ ऑफलाइन-सक्षम स्मार्ट फार्म कमांड सेंटर।", "દરેક ખેતરનો AI ડૉક્ટર: લાઈવ સેન્સર્સ, AI એજન્ટ રીઝનિંગ અને એજ સિંચાઈ નિયંત્રણ સાથે ઑફલાઇન સ્માર્ટ ફાર્મ કમાન્ડ સેન્ટર.", "प्रत्येक शेताचा AI डॉक्टर: थेट सेन्सर्स, AI एजंट रिझनिंग आणि एज सिंचन नियंत्रणासह ऑफलाइन स्मार्ट शेती कमांड सेंटर.");
add("landing.enterDashboard", "ENTER DASHBOARD", "डैशबोर्ड खोलें", "ડેશબોર્ડ ખોલો", "डॅशबोर्ड उघडा");
add("landing.liveSimulation", "EXPLORE SIMULATION", "सिमुलेशन देखें", "સિમ્યુલેશન જુઓ", "सिम्युलेशन पहा");
add("landing.activeFieldNodes", "Active Field Nodes", "सक्रिय फील्ड नोड्स", "સક્રિય ફીલ્ડ નોડ્સ", "सक्रिय फील्ड नोड्स");
add("landing.waterConserved", "Liters Conserved", "लीटर पानी की बचत", "લિટર પાણીની બચત", "लिटर पाण्याची बचत");
add("landing.accuracyScore", "Diagnostic Accuracy", "सटीक निदान दर", "ચોક્કસ નિદાન દર", "अचूक निदान दर");
add("landing.offlineCapability", "Offline Autonomous Capability", "ऑफलाइन स्वायत्त क्षमता", "ઑફલાઇન સ્વાયત્ત ક્ષમતા", "ऑफलाइन स्वायत्त क्षमता");

// ==========================================
// 2. NAVIGATION (nav.*)
// ==========================================
add("nav.dashboard", "Dashboard", "डैशबोर्ड", "ડેશબોર્ડ", "डॅशबोर्ड");
add("nav.map", "Farm Map", "खेत का नक्शा", "ખેતરનો નકશો", "शेताचा नकाशा");
add("nav.camera", "Leaf Scanner", "पत्ती स्कैनर", "પાન સ્કેનર", "पान स्कॅनर");
add("nav.irrigation", "Irrigation", "सिंचाई", "સિંચાઈ", "सिंचन");
add("nav.climate", "Climate", "मौसम", "હવામાન", "हवामान");
add("nav.sensors", "Sensor Health", "सेंसर स्वास्थ्य", "સેન્સર આરોગ્ય", "सेन्सर आरोग्य");
add("nav.spray", "Spray Planner", "स्प्रे योजना", "સ્પ્રે પ્લાનર", "फवारणी योजना");
add("nav.fertilizer", "Fertilizer", "उर्वरक", "ખાતર", "खते");
add("nav.market", "Market", "बाज़ार", "બજાર", "बाजार");
add("nav.schemes", "Schemes", "योजनाएं", "યોજનાઓ", "योजना");
add("nav.diary", "Diary", "डायरी", "ડાયરી", "डायरी");
add("nav.tasks", "Tasks", "कार्य", "કાર્યો", "कामे");
add("nav.assistant", "KrishiGPT", "कृषिGPT", "કૃષિGPT", "कृषीGPT");
add("nav.reports", "Reports", "रिपोर्ट", "અહેવાલો", "अहवाल");
add("nav.alerts", "Alerts", "चेतावनी", "ચેતવણીઓ", "सूचना");
add("nav.voice", "Voice", "आवाज़", "અવાજ", "आवाज");
add("nav.settings", "Settings", "सेटिंग्स", "સેટિંગ્સ", "सेटिंग्ज");
add("nav.more", "More", "अधिक", "વધુ", "अधिक");

// ==========================================
// 3. PAGE TITLES (titles.*)
// ==========================================
add("titles.dashboard", "Dashboard", "डैशबोर्ड", "ડેશબોર્ડ", "डॅशबोर्ड");
add("titles.map", "Farm Map", "खेत का नक्शा", "ખેતરનો નકશો", "शेताचा नकाशा");
add("titles.camera", "Leaf Scanner", "पत्ती स्कैनर", "પાન સ્કેનર", "पान स्कॅनर");
add("titles.irrigation", "Irrigation Flow Control", "सिंचाई प्रवाह नियंत्रण", "સિંચાઈ પ્રવાહ નિયંત્રણ", "सिंचन प्रवाह नियंत्रण");
add("titles.climate", "Climate & Microclimate", "कृषि मौसम व सूक्ष्म जलवायु", "કૃષિ હવામાન અને સૂક્ષ્મ વાતાવરણ", "कृषी हवामान व सूक्ष्म हवामान");
add("titles.sensors", "Sensors & Telemetry", "सेंसर व टेलीमेट्री", "સેન્સર અને ટેલિમેટ્રી", "सेन्सर व टेलिमेट्री");
add("titles.spray", "Spray Planner", "स्प्रे योजना", "સ્પ્રે પ્લાનર", "फवारणी योजना");
add("titles.fertilizer", "NPK Nutrient Fertilizer", "उर्वरक व पोषण योजना", "ખાતર અને પોષણ યોજના", "खते व पोषण नियोजन");
add("titles.market", "Market Mandi Prices", "बाज़ार भाव", "બજાર ભાવ", "बाजार भाव");
add("titles.schemes", "Govt. Agricultural Schemes", "सरकारी कृषि योजनाएं", "સરકારી કૃષિ યોજનાઓ", "शासकीय कृषी योजना");
add("titles.diary", "Farm Diary & Log", "खेत डायरी", "ખેત ડાયરી", "शेत डायरी");
add("titles.tasks", "Tasks & Field Activities", "कार्य व गतिविधियां", "કાર્યો અને પ્રવૃત્તિઓ", "कामे व शेती उपक्रम");
add("titles.assistant", "KrishiGPT Assistant", "कृषिGPT सहायक", "કૃષિGPT સહાયક", "कृषीGPT सहाय्यक");
add("titles.reports", "Reports & Print Studio", "रिपोर्ट व प्रिंट स्टूडियो", "અહેવાલો અને પ્રિન્ટ સ્ટુડિયો", "अहवाल व प्रिंट स्टुडिओ");
add("titles.alerts", "Alert Center", "चेतावनी केंद्र", "ચેતવણી કેન્દ્ર", "सूचना केंद्र");
add("titles.voice", "Voice Copilot", "आवाज़ कोपायलट", "અવાજ કોપાયલટ", "व्हॉईस कोपायलट");
add("titles.settings", "Settings & Preferences", "सेटिंग्स व प्राथमिकताएं", "સેટિંગ્સ અને પસંદગીઓ", "सेटिंग्ज व प्राधान्ये");

// ==========================================
// 4. PAGE STAMPS (stamps.*)
// ==========================================
add("stamps.dashboard", "DASHBOARD // LIVE MONITORING", "डैशबोर्ड // लाइव निगरानी", "ડેશબોર્ડ // લાઈવ મોનિટરિંગ", "डॅशबोर्ड // थेट देखरेख");
add("stamps.camera", "CAMERA // LEAF SCANNER", "कैमरा // पत्ती स्कैनर", "કેમેરા // પાન સ્કેનર", "कॅमेरा // पान स्कॅनर");
add("stamps.leafScanner", "LEAF SCANNER // REAL TOMATO DOCTOR", "पत्ती स्कैनर // असली टमाटर डॉक्टर", "પાન સ્કેનર // સાચો ટામેટા ડૉક્ટર", "पान स्कॅनर // खरा टोमॅटो डॉक्टर");
add("stamps.irrigation", "IRRIGATION // FLOW CONTROL", "सिंचाई // प्रवाह नियंत्रण", "સિંચાઈ // પ્રવાહ નિયંત્રણ", "सिंचन // प्रवाह नियंत्रण");
add("stamps.climate", "CLIMATE // AGRI-WEATHER", "मौसम // कृषि मौसम", "હવામાન // કૃષિ હવામાન", "हवामान // कृषी हवामान");
add("stamps.sensors", "SENSORS // TELEMETRY & HEALTH", "सेंसर // टेलीमेट्री और स्वास्थ्य", "સેન્સર // ટેલિમેટ્રી અને આરોગ્ય", "सेन्सर // टेलिमेट्री आणि आरोग्य");
add("stamps.spray", "SPRAY // SPRAY ADVISORY", "स्प्रे // छिड़काव सलाह", "સ્પ્રે // છંટકાવ સલાહ", "फवारणी // फवारणी सल्ला");
add("stamps.fertilizer", "FERTILIZER // NPK NUTRIENT PLAN", "उर्वरक // एनपीके पोषण योजना", "ખાતર // એનપીકે પોષણ યોજના", "खते // एनपीके पोषण योजना");
add("stamps.market", "MARKET // APMC MANDI RATES", "बाज़ार // एपीएमसी मंडी भाव", "બજાર // એપીએમસી માર્કેટ યાર્ડ ભાવ", "बाजार // एपीएमसी मंडी दर");
add("stamps.schemes", "SCHEMES // GOVT SUBSIDIES", "योजनाएं // सरकारी अनुदान", "યોજનાઓ // સરકારી સબસિડી", "योजना // शासकीय अनुदान");
add("stamps.diary", "DIARY // CROP LOG", "डायरी // फसल रिकॉर्ड", "ડાયરી // પાક રેકોર્ડ", "डायरी // पीक नोंद");
add("stamps.tasks", "TASKS // FARM ACTIVITIES", "कार्य // कृषि गतिविधियां", "કાર્યો // ખેતી પ્રવૃત્તિઓ", "कामे // शेती कामे");
add("stamps.assistant", "ASSISTANT // KRISHIGPT AI", "सहायक // कृषिGPT एआई", "સહાયક // કૃષિGPT એઆઈ", "सहाय्यક // कृषीGPT एआय");
add("stamps.reports", "REPORTS // DATA EXPORTS", "रिपोर्ट // डेटा निर्यात", "અહેવાલો // ડેટા નિકાસ", "अहवाल // डेटा निर्यात");
add("stamps.alerts", "ALERTS // NOTIFICATIONS", "चेतावनी // सूचनाएं", "ચેતવણીઓ // સૂચનાઓ", "सूचना // नोटिफिकेशन्स");
add("stamps.voice", "VOICE // VOICE COPILOT", "आवाज़ // वॉयस कोपायलट", "અવાજ // વોઇસ કોપાયલટ", "आवाज // व्हॉईस कोपायलट");
add("stamps.settings", "SETTINGS // SYSTEM PREFERENCES", "सेटिंग्स // सिस्टम प्राथमिकताएं", "સેટિંગ્સ // સિસ્ટમ પસંદગીઓ", "सेटिंग्ज // प्रणाली प्राधान्ये");

// ==========================================
// 5. COMMON UI STRINGS (common.*)
// ==========================================
add("common.save", "Save", "सहेजें", "સાચવો", "जतन करा");
add("common.cancel", "Cancel", "रद्द करें", "રદ કરો", "रद्द करा");
add("common.delete", "Delete", "हटाएं", "કાઢો", "हटवा");
add("common.add", "Add", "जोड़ें", "ઉમેરો", "जोडा");
add("common.edit", "Edit", "संपादित करें", "બદલો", "संपादित करा");
add("common.close", "Close", "बंद करें", "બંધ કરો", "बंद करा");
add("common.back", "Back", "वापस", "પાછા", "मागे");
add("common.next", "Next", "आगे", "આગળ", "पुढे");
add("common.search", "Search", "खोजें", "શોધો", "शोधा");
add("common.refresh", "Refresh", "ताज़ा करें", "તાજું કરો", "रिफ्रेश करा");
add("common.viewAll", "View All", "सभी देखें", "બધું જુઓ", "सर्व पहा");
add("common.markAllRead", "Mark All Read", "सभी पढ़ा हुआ चिह्नित करें", "બધું વાંચેલું કરો", "सर्व वाचलेले चिन्हांकित करा");
add("common.loading", "Loading…", "लोड हो रहा है…", "લોડ થઈ રહ્યું છે…", "लोड होत आहे…");
add("common.language", "Language", "भाषा", "ભાષા", "भाषा");
add("common.simulation", "Simulation", "सिमुलेशन", "સિમ્યુલેશન", "सिम्युलेशन");
add("common.live", "Live", "लाइव", "લાઈવ", "थेट");
add("common.farmHealth", "Farm Health", "खेत स्वास्थ्य", "ખેત આરોગ્ય", "शेत आरोग्य");
add("common.farmHealthScore", "Farm Health Score", "खेत स्वास्थ्य स्कोर", "ખેત આરોગ્ય સ્કોર", "शेत आरोग्य गुण");
add("common.more", "More", "अधिक", "વધુ", "अधिक");
add("common.noAlerts", "No alerts — all clear 🌾", "कोई चेतावनी नहीं — सब ठीक है 🌾", "કોઈ ચેતવણી નથી — બધું બરાબર છે 🌾", "कोणतीही सूचना नाही — सर्व सुरक्षित 🌾");
add("common.recentAlerts", "Recent Alerts", "हालिया चेतावनी", "તાજેતરની ચેતવણીઓ", "अलीकडील सूचना");
add("common.comingSoon", "Coming soon in next release.", "जल्द आ रहा है।", "ટૂંક સમયમાં આવશે.", "लवकरच उपलब्ध होईल.");
add("common.on", "ON", "चालू", "ચાલુ", "चालू");
add("common.off", "OFF", "बंद", "બંધ", "बंद");
add("common.enabled", "Enabled", "सक्रिय", "સક્ષમ", "सक्रिय");
add("common.disabled", "Disabled", "निष्क्रिय", "અક્ષમ", "निष्क्रिय");
add("common.test", "Test", "परीक्षण", "તપાસો", "चाचणी");
add("common.testing", "Testing…", "परीक्षण जारी…", "તપાસ ચાલુ છે…", "चाचणी सुरू आहे…");
add("common.connected", "Connected", "जुड़ा हुआ", "જોડાયેલ", "जोडलेले");
add("common.failed", "Failed", "विफल", "નિષ્ફળ", "अयशस्वी");
add("common.export", "Export", "निर्यात", "નિકાસ", "निर्यात");
add("common.import", "Import", "आयात", "આયાત", "आयात");
add("common.reset", "Reset", "रीसेट", "રીસેટ", "रीसेट");
add("common.confirm", "Confirm", "पुष्टि करें", "પુષ્ટિ કરો", "पुष्टी करा");
add("common.retry", "Retry", "पुनः प्रयास करें", "ફરી પ્રયાસ", "पुन्हा प्रयत्न करा");
add("common.send", "Send", "भेजें", "મોકલો", "पाठवा");
add("common.clear", "Clear", "साफ करें", "સાફ કરો", "साफ करा");
add("common.today", "Today", "आज", "આજે", "आज");
add("common.tomorrow", "Tomorrow", "कल", "આવતીકાલે", "उद्या");
add("common.done", "Done", "पूर्ण", "પૂર્ણ", "पूर्ण");
add("common.pending", "Pending", "लंबित", "બાકી", "प्रलंबित");
add("common.overdue", "Overdue", "अतिदेय", "મોડું", "थकीत");
add("common.all", "All", "सभी", "બધું", "सर्व");
add("common.unread", "Unread", "अपठित", "ન વાંચેલ", "न वाचलेले");
add("common.details", "Details", "विवरण", "વિગતો", "तपशील");
add("common.hide", "Hide", "छिपाएं", "છુપાવો", "लपवा");
add("common.status", "Status", "स्थिति", "સ્થિતિ", "स्थिती");
add("common.actions", "Actions", "कार्रवाई", "ક્રિયાઓ", "कृती");
add("common.select", "Select", "चुनें", "પસંદ કરો", "निवडा");
add("common.apply", "Apply", "लागू करें", "લાગુ કરો", "लागू करा");
add("common.filter", "Filter", "फ़िल्टर", "ફિલ્ટર", "फिल्टर");
add("common.high", "High", "उच्च", "વધુ", "उच्च");
add("common.medium", "Medium", "मध्यम", "મધ્યમ", "मध्यम");
add("common.low", "Low", "निम्न", "ઓછું", "कमी");
add("common.critical", "Critical", "गंभीर", "ગંભીર", "गंभीर");
add("common.warning", "Warning", "चेतावनी", "ચેતવણી", "इशारा");
add("common.info", "Info", "सूचना", "માહિતી", "माहिती");
add("common.optimal", "Optimal", "अनुकूल", "શ્રેષ્ઠ", "योग्य");
add("common.dry", "Dry", "शुष्क", "સૂકું", "कोरडे");
add("common.wet", "Wet", "गीला", "ભીનું", "ओले");
add("common.poor", "Poor", "खराब", "નબળું", "खराब");
add("common.moderate", "Moderate", "मध्यम", "મધ્યમ", "मध्यम");
add("common.good", "Good", "अच्छा", "સારું", "चांगले");
add("common.normal", "Normal", "सामान्य", "સામાન્ય", "सामान्य");
add("common.none", "None", "कोई नहीं", "કોઈ નથી", "काहीही नाही");
add("common.active", "Active", "सक्रिय", "સક્રિય", "सक्रिय");
add("common.idle", "Idle", "निष्क्रिय", "શાંત", "शांत");
add("common.running", "Running", "चल रहा है", "ચાલુ છે", "सुरू आहे");
add("common.stopped", "Stopped", "रुका हुआ", "અટકેલ", "थांबलेले");
add("common.minutes", "minutes", "मिनट", "મિનિટ", "मिनिटे");
add("common.seconds", "seconds", "सेकंड", "સેકન્ડ", "सेकंद");
add("common.hours", "hours", "घंटे", "કલાક", "तास");
add("common.days", "days", "दिन", "દિવસ", "दिवस");
add("common.acres", "acres", "एकड़", "એકર", "एकर");
add("common.litres", "litres", "लीटर", "લિટર", "लिटर");

// ==========================================
// 6. EXACT LEAF SCANNER TERMS (Requirement 3)
// // validate terms with Krishi Vigyan Kendra
// ==========================================
add("scanner.healthy", "Healthy Leaf", "स्वस्थ पत्ती", "સ્વસ્થ પાન", "निरोगी पान");
add("scanner.healthy_sci", "Healthy Leaf (Solanum lycopersicum)", "स्वस्थ पत्ती (Solanum lycopersicum)", "સ્વસ્થ પાન (Solanum lycopersicum)", "निरोगी पान (Solanum lycopersicum)");
add("scanner.Early_blight", "Early Blight", "अगेती झुलसा", "વહેલો ઝુલસો", "लवकर करपा");
add("scanner.Early_blight_sci", "Early Blight (Alternaria solani)", "अगेती झुलसा (Alternaria solani)", "વહેલો ઝુલસો (Alternaria solani)", "लवकर करपा (Alternaria solani)");
add("scanner.Late_blight", "Late Blight", "पछेती झुलसा", "મોડો ઝુલસો", "उशीरा करपा");
add("scanner.Late_blight_sci", "Late Blight (Phytophthora infestans)", "पछेती झुलसा (Phytophthora infestans)", "મોડો ઝુલસો (Phytophthora infestans)", "उशीरा करपा (Phytophthora infestans)");
add("scanner.Leaf_Mold", "Leaf Mold", "पत्ती फफूंद", "પાન ફફોળ", "पान बुरशी");
add("scanner.Leaf_Mold_sci", "Leaf Mold (Passalora fulva)", "पत्ती फफूंद (Passalora fulva)", "પાન ફફોળ (Passalora fulva)", "पान बुरशी (Passalora fulva)");
add("scanner.Septoria", "Septoria Leaf Spot", "सेप्टोरिया धब्बा", "સેપ્ટોરિયા ડાઘ", "सेप्टोरिया ठिपका");
add("scanner.Septoria_sci", "Septoria Leaf Spot (Septoria lycopersici)", "सेप्टोरिया धब्बा (Septoria lycopersici)", "સેપ્ટોરિયા ડાઘ (Septoria lycopersici)", "सेप्टोरिया ठिपका (Septoria lycopersici)");
add("scanner.Bacterial_spot", "Bacterial Spot", "जीवाणु धब्बा", "જીવાણુ ડાઘ", "जिवाणू ठिपका");
add("scanner.Bacterial_spot_sci", "Bacterial Spot (Xanthomonas spp.)", "जीवाणु धब्बा (Xanthomonas spp.)", "જીવાણુ ડાઘ (Xanthomonas spp.)", "जिवाणू ठिपका (Xanthomonas spp.)");
add("scanner.Target_Spot", "Target Spot", "टारगेट स्पॉट", "ટાર્ગેટ સ્પોટ", "टारगेट स्पॉट");
add("scanner.Target_Spot_sci", "Target Spot (Corynespora cassiicola)", "टारगेट स्पॉट (Corynespora cassiicola)", "ટાર્ગેટ સ્પોટ (Corynespora cassiicola)", "ટारगेट स्पॉट (Corynespora cassiicola)");
add("scanner.Spider_mites", "Spider Mites", "स्पाइडर माइट्स", "સ્પાઈડર માઈટ્સ", "स्पाइडर माइट्स");
add("scanner.Spider_mites_sci", "Spider Mites (Tetranychus urticae)", "स्पाइडर माइट्स (Tetranychus urticae)", "સ્પાઈડર માઈટ્સ (Tetranychus urticae)", "स्पाइडर माइट्स (Tetranychus urticae)");
add("scanner.Mosaic_virus", "Mosaic Virus", "मोज़ेक विषाणु", "મોઝેક વિષાણુ", "मोझेक विषाणू");
add("scanner.Mosaic_virus_sci", "Mosaic Virus (Tomato mosaic virus)", "मोज़ेक विषाणु (Tomato mosaic virus)", "મોઝેક વિષાણુ (Tomato mosaic virus)", "मोझेक विषाणू (Tomato mosaic virus)");
add("scanner.TYLCV", "Yellow Leaf Curl Virus", "पीला पत्ती मुड़कन", "પીળ પાન વળણ", "पिवळा पान वळण");
add("scanner.TYLCV_sci", "Yellow Leaf Curl Virus (Tomato yellow leaf curl virus)", "पीला पत्ती मुड़कन (Tomato yellow leaf curl virus)", "પીળ પાન વળણ (Tomato yellow leaf curl virus)", "पिवळा पान वळण (Tomato yellow leaf curl virus)");
add("scanner.not_leaf", "Not a Leaf", "यह पत्ती नहीं", "આ પાન નથી", "हे पान नाही");
add("scanner.not_leaf_sci", "Not a Leaf", "यह पत्ती नहीं", "આ પાન નથી", "हे पान नाही");

// Leaf Scanner Treatments & Prevention (Numeric Doses Preserved)
// // validate terms with Krishi Vigyan Kendra
add("scanner.natural.healthy", "No action needed. Continue current care, regular scouting, and balanced irrigation.", "किसी कार्रवाई की आवश्यकता नहीं है। वर्तमान देखभाल, नियमित निरीक्षण और संतुलित सिंचाई जारी रखें।", "કોઈ પગલાંની જરૂર નથી. હાલની કાળજી, નિયમિત નિરીક્ષણ અને સંતુલિત સિંચાઈ ચાલુ રાખો.", "कोणत्याही कारवाईची गरज नाही. सध्याची काळजी, नियमित पाहणी आणि संतुलित सिंचन चालू ठेवा.");
add("scanner.chemical.healthy", "None required", "कोई आवश्यकता नहीं", "કોઈ જરૂર નથી", "काही आवश्यक नाही");
add("scanner.prev.healthy.1", "Keep 60 cm spacing", "60 cm की दूरी रखें", "60 cm અંતર રાખો", "60 cm अंतर ठेवा");
add("scanner.prev.healthy.2", "Water at base, not overhead", "जड़ पर पानी दें, ऊपर से नहीं", "મૂળમાં પાણી આપો, ઉપરથી નહીં", "मुळाशी पाणी द्या, वरून नाही");
add("scanner.prev.healthy.3", "Mulch to stop soil splash", "मिट्टी के छींटों को रोकने के लिए मल्चिंग करें", "માટીના ઉડાણને રોકવા માટે મલ્ચિંગ કરો", "माती उडणे रोखण्यासाठी मल्चिंग करा");

add("scanner.natural.Early_blight", "Neem oil 5 ml/L weekly + remove and burn infected lower leaves", "साप्ताहिक नीम का तेल 5 ml/L + संक्रमित निचली पत्तियों को हटाकर जलाएं", "દર અઠવાડિયે લીમડાનું તેલ 5 ml/L + ચેપગ્રસ્ત નીચલા પાન કાપીને બાળી નાખો", "दर आठवड्याला कडुनिंब तेल 5 ml/L + बाधित खालची पाने काढून जाळून टाका");
add("scanner.chemical.Early_blight", "Mancozeb 2 g/L, 7-day pre-harvest interval", "मैंकोज़ेब 2 g/L, तुड़ाई से 7 दिन पहले का अंतराल", "મેંકોઝેબ 2 g/L, લણણી પહેલાં 7 દિવસનો અંતરાલ", "मँकोझेब 2 g/L, काढणीपूर्वी 7 दिवसांचे अंतर");
add("scanner.prev.Early_blight.1", "Mulch soil", "मिट्टी में मल्चिंग करें", "જમીનમાં મલ્ચિંગ કરો", "मातीचे मल्चिंग करा");
add("scanner.prev.Early_blight.2", "Stake plants for airflow", "हवा के प्रवाह के लिए पौधों को सहारा दें", "હવાની અવરજવર માટે છોડને ટેકો આપો", "हवेच्या प्रवाहासाठी झाडांना आधार द्या");
add("scanner.prev.Early_blight.3", "Rotate crops next season", "अगले मौसम में फसल चक्र अपनाएं", "આગલી ઋતુમાં પાકની ફેરબદલી કરો", "पुढील हंगामात पीक फेरपालट करा");

add("scanner.natural.Late_blight", "Copper oxychloride 3 g/L every 7 days + destroy infected plants immediately", "कॉपर ऑक्सीक्लोराइड 3 g/L हर 7 दिन में + संक्रमित पौधों को तुरंत नष्ट करें", "કોપર ઓક્સિક્લોરાઇડ 3 g/L દર 7 દિવસે + ચેપગ્રસ્ત છોડનો તાત્કાલિક નાશ કરો", "कॉपर ऑक्सीक्लोराईड 3 g/L दर 7 दिवसांनी + बाधित झाडे त्वरित नष्ट करा");
add("scanner.chemical.Late_blight", "Chlorothalonil 2 g/L in severe outbreaks", "गंभीर प्रकोप में क्लोरोथैलोनिल 2 g/L", "ગંભીર ઉપદ્રવમાં ક્લોરોથેલોનિલ 2 g/L", "तीव्र प्रादुर्भावात क्लोरोथॅलोनिल 2 g/L");
add("scanner.prev.Late_blight.1", "Never water overhead", "ऊपर से पानी कभी न दें", "ક્યારેય ઉપરથી પાણી ન આપો", "कधीही वरून पाणी देऊ नका");
add("scanner.prev.Late_blight.2", "Resistant varieties", "रोग प्रतिरोधी किस्में लगाएं", "રોગ પ્રતિકારક જાતો વાવો", "रोगप्रतिकारक वाण वापरा");
add("scanner.prev.Late_blight.3", "Wide spacing", "पर्याप्त दूरी रखें", "પૂરતું અંતર રાખો", "पुरेसे अंतर ठेवा");

add("scanner.natural.Leaf_Mold", "Increase ventilation + reduce humidity + Trichoderma viride soil drench", "हवादार वातावरण बढ़ाएं + आर्द्रता कम करें + ट्राइकोडर्मा विरिडे से मिट्टी भिगोएं", "હવાઉજાસ વધારો + ભેજ ઘટાડો + ટ્રાઇકોડર્મા વિરિડેથી જમીન પલાળો", "हवेचा वावर वाढवा + आर्द्रता कमी करा + ट्रायकोडर्मा विरिडेने माती भिजवा");
add("scanner.chemical.Leaf_Mold", "Chlorothalonil 2 g/L", "क्लोरोथैलोनिल 2 g/L", "ક્લોરોથેલોનિલ 2 g/L", "क्लोरोथॅलोनिल 2 g/L");
add("scanner.prev.Leaf_Mold.1", "Prune lower leaves", "निचली पत्तियों की छंटाई करें", "નીચલા પાનની છંટાઈ કરો", "खालच्या पानांची छाटणी करा");
add("scanner.prev.Leaf_Mold.2", "Ventilate greenhouse", "ग्रीनहाउस में वायु संचार रखें", "ગ્રીનહાઉસમાં હવાની અવરજવર રાખો", "ग्रीनहाऊसमध्ये हवा खेळती ठेवा");
add("scanner.prev.Leaf_Mold.3", "Resistant varieties", "रोग प्रतिरोधी किस्में", "પ્રતિકારક જાતો", "प्रतिकारक वाण");

add("scanner.natural.Septoria", "Remove and burn infected leaves + mulch to stop splash", "संक्रमित पत्तियां हटाकर जलाएं + मिट्टी के छींटों को रोकने हेतु मल्चिंग करें", "ચેપગ્રસ્ત પાન કાપીને બાળી નાખો + છાંટા રોકવા મલ્ચિંગ કરો", "बाधित पाने काढून जाळून टाका + शिंतोडे रोखण्यासाठी मल्चिंग करा");
add("scanner.chemical.Septoria", "Mancozeb 2 g/L", "मैंकोज़ेब 2 g/L", "મેંકોઝેબ 2 g/L", "मँकोझेब 2 g/L");
add("scanner.prev.Septoria.1", "Crop rotation 2 years", "2 साल का फसल चक्र", "2 વર્ષ પાકની ફેરબદલી", "2 वर्षांची पीक फेरपालट");
add("scanner.prev.Septoria.2", "Drip irrigation only", "केवल ड्रिप सिंचाई का प्रयोग करें", "માત્ર ટપક સિંચાઈનો ઉપયોગ કરો", "फक्त ठिबक सिंचन वापरा");

add("scanner.natural.Bacterial_spot", "Copper oxychloride 3 g/L weekly + remove infected leaves", "साप्ताहिक कॉपर ऑक्सीक्लोराइड 3 g/L + संक्रमित पत्तियां हटाएं", "સાપ્તાહિક કોપર ઓક્સિક્લોરાઇડ 3 g/L + ચેપગ્રસ્ત પાન દૂર કરો", "साप्ताहिक कॉपर ऑक्सीक्लोराईड 3 g/L + बाधित पाने काढा");
add("scanner.chemical.Bacterial_spot", "Copper + mancozeb tank mix", "कॉपर + मैंकोज़ेब का टैंक मिश्रण", "કોપર + મેંકોઝેબ ટેન્ક મિશ્રણ", "कॉपर + मँकोझेब टँक मिश्रण");
add("scanner.prev.Bacterial_spot.1", "Certified disease-free seed", "प्रमाणित रोगमुक्त बीज", "પ્રમાણિત રોગમુક્ત બિયારણ", "प्रमाणित रोगमुक्त बियाणे");
add("scanner.prev.Bacterial_spot.2", "Rotate crops 2 years", "2 साल फसल चक्र अपनाएं", "2 વર્ષ પાકની ફેરબદલી કરો", "2 वर्षे पीक फेरपालट करा");
add("scanner.prev.Bacterial_spot.3", "Avoid working in wet plants", "गीले पौधों के बीच काम करने से बचें", "ભીના છોડમાં કામ કરવાનું ટાળો", "ओल्या पिकांमध्ये काम करणे टाळा");

add("scanner.natural.Target_Spot", "Prune infected leaves + improve airflow", "संक्रमित पत्तियों की छंटाई करें + वायु संचार सुधारें", "ચેપગ્રસ્ત પાનની છંટાઈ કરો + હવાની અવરજવર સુધારો", "बाधित पानांची छाटणी करा + हवा खेळती ठेवा");
add("scanner.chemical.Target_Spot", "Mancozeb 2 g/L", "मैंकोज़ेब 2 g/L", "મેંકોઝેબ 2 g/L", "मँकोझेब 2 g/L");
add("scanner.prev.Target_Spot.1", "Stake plants", "पौधों को सहारा दें", "છોડને ટેકો આપો", "झाडांना आधार द्या");
add("scanner.prev.Target_Spot.2", "Sanitize tools", "कृषि औजारों को विसंक्रमित करें", "સાધનોને જંતુમુક્ત કરો", "अवजारे निर्जंतुक करा");

add("scanner.natural.Spider_mites", "Strong water spray under leaves + neem 5 ml/L + insecticidal soap", "पत्तियों के नीचे तेज पानी का छिड़काव + 5 ml/L नीम का तेल + कीटनाशक साबुन", "પાનની નીચે જોરદાર પાણીનો છંટકાવ + 5 ml/L લીમડાનું તેલ + કીટનાશક સાબુ", "पानांच्या खाली जोरदार पाण्याचा फवारा + 5 ml/L कडुनिंब तेल + कीटकनाशक साबण");
add("scanner.chemical.Spider_mites", "Abamectin only if severe", "केवल गंभीर स्थिति में एबामेक्टिन", "માત્ર ગંભીર સ્થિતિમાં એબેમેક્ટીન", "केवळ गंभीर प्रादुर्भावात अबामेक्टिन");
add("scanner.prev.Spider_mites.1", "Raise humidity slightly", "आर्द्रता थोड़ी बढ़ाएं", "ભેજમાં થોડો વધારો કરો", "आर्द्रता थोडी वाढवा");
add("scanner.prev.Spider_mites.2", "Remove weeds", "खरपतवार हटाएं", "નીંદણ દૂર કરો", "तण काढून टाका");
add("scanner.prev.Spider_mites.3", "Check leaf undersides weekly", "पत्तियों के निचले हिस्से की साप्ताहिक जांच करें", "દર અઠવાડિયે પાનની નીચે તપાસો", "दर आठवड्याला पानांच्या खाली तपासा");

add("scanner.natural.Mosaic_virus", "NO CURE — pull and burn the plant; wash hands and tools with milk or trisodium phosphate before touching other plants", "कोई इलाज नहीं — पौधे को उखाड़कर जला दें; अन्य पौधों को छूने से पहले हाथों और औजारों को दूध या ट्राइसोडियम फॉस्फेट से धोएं", "કોઈ ઉપચાર નથી — છોડને ઉખેડીને બાળી નાખો; અન્ય છોડને સ્પર્શતા પહેલા હાથ અને સાધનોને દૂધ અથવા ટ્રાઇસોડિયમ ફોસ્ફેટથી ધોઈ લો", "कोणताही उपाय नाही — झाड उपटून जाळून टाका; इतर झाडांना स्पर्श करण्यापूर्वी हात व अवजारे दूध किंवा ट्रायसोडियम फॉस्फेटने धुवा");
add("scanner.chemical.Mosaic_virus", "None effective against viruses", "विषाणुओं के विरुद्ध कोई प्रभावी नहीं", "વિષાણુઓ સામે કોઈ અસરકારક નથી", "विषाणूंविरुद्ध काहीही प्रभावी नाही");
add("scanner.prev.Mosaic_virus.1", "Resistant varieties", "रोग प्रतिरोधी किस्में", "પ્રતિકારક જાતો", "प्रतिकारक वाण");
add("scanner.prev.Mosaic_virus.2", "Control aphids", "माहू (एफिड्स) का नियंत्रण करें", "મોલો-મશી (એફિડ્સ) નિયંત્રિત કરો", "मावा (अॅफिड्स) नियंत्रण करा");
add("scanner.prev.Mosaic_virus.3", "Do not smoke near plants", "पौधों के पास बीड़ी/सिगरेट न पिएं", "છોડ પાસે ધૂમ્રપાન ન કરો", "पिकांजवळ धुम्रपान करू नका");

add("scanner.natural.TYLCV", "NO CURE — remove plant; yellow sticky traps + neem for whitefly vector", "कोई इलाज नहीं — पौधा हटा दें; सफेद मक्खी वाहक के लिए पीले चिपचिपे जाल + नीम का उपयोग करें", "કોઈ ઉપચાર નથી — છોડ દૂર કરો; સફેદ માખી વાહક માટે પીળા ચીકણા ટ્રેપ + લીમડો વાપરો", "कोणताही उपाय नाही — झाड काढून टाका; पांढरी माशी वाहकासाठी पिवळे चिकट ट्रॅप + कडुनिंब वापरा");
add("scanner.chemical.TYLCV", "None effective against viruses", "विषाणुओं के विरुद्ध कोई प्रभावी नहीं", "વિષાણુઓ સામે કોઈ અસરકારક નથી", "विषाणूंविरुद्ध काहीही प्रभावी नाही");
add("scanner.prev.TYLCV.1", "Insect net house", "कीट रोधी जालीदार घर", "જીવાત જાળીવાળું ઘર", "कीटकरोधक नेट हाऊस");
add("scanner.prev.TYLCV.2", "Resistant varieties", "रोग प्रतिरोधी किस्में", "પ્રતિકારક જાતો", "प्रतिकारक वाण");
add("scanner.prev.TYLCV.3", "Remove weeds hosting whitefly", "सफेद मक्खी को पनाह देने वाले खरपतवार हटाएं", "સફેદ માખી આશ્રય આપતા નીંદણ દૂર કરો", "पांढऱ्या माशीला आश्रय देणारे तण काढा");

add("scanner.natural.not_leaf", "Please upload a clear photo of ONE tomato leaf on a plain background.", "कृपया सादे पृष्ठभूमि पर टमाटर की केवल एक पत्ती का स्पष्ट फोटो अपलोड करें।", "કૃપા કરીને સાદા બેકગ્રાઉન્ડ પર ટામેટાના એક જ પાનનો સ્પષ્ટ ફોટો અપલોડ કરો.", "कृपया साध्या पार्श्वभूमीवर टोमॅटोच्या एका पानाचा स्पष्ट फोटो अपलोड करा.");
add("scanner.chemical.not_leaf", "None required", "कोई आवश्यकता नहीं", "કોઈ જરૂર નથી", "काही आवश्यक नाही");

// Leaf Scanner UI
add("scanner.title", "Tomato Leaf Doctor", "टमाटर पत्ती डॉक्टर", "ટામેટા પાન ડૉક્ટર", "टोमॅटो पान डॉक्टर");
add("scanner.subtitle", "On-device AI diagnostic for 10 tomato leaf diseases & health", "10 टमाटर पत्ती रोगों व स्वास्थ्य के लिए ऑन-डिवाइस एआई निदान", "10 ટામેટાના પાનના રોગો અને આરોગ્ય માટે ઓન-ડિવાઇસ એઆઈ નિદાન", "10 टोमॅटो पानांचे रोग व आरोग्यासाठी ऑन-डिव्हाइस एआय निदान");
add("scanner.upload", "Upload Leaf Image", "पत्ती की फोटो अपलोड करें", "પાનનો ફોટો અપલોડ કરો", "पानाचा फोटो अपलोड करा");
add("scanner.takePhoto", "Take Photo", "फोटो खींचें", "ફોટો લો", "फोटो काढा");
add("scanner.dragDrop", "Drag and drop leaf photo here, or click to browse", "पत्ती की फोटो यहां खींचें या चुनने के लिए क्लिक करें", "પાનનો ફોટો અહીં મૂકો અથવા પસંદ કરવા ક્લિક કરો", "पानाचा फोटो येथे ड्रॅग करा किंवा निवडण्यासाठी क्लिक करा");
add("scanner.analyzing", "Analyzing leaf on-device with neural network...", "न्यूरल नेटवर्क से पत्ती का विश्लेषण हो रहा है...", "ન્યુરલ નેટવર્ક સાથે પાનનું વિશ્લેષણ થઈ રહ્યું છે...", "न्यूरल नेटवर्कद्वारे पानाचे विश्लेषण होत आहे...");
add("scanner.diagnosis", "Diagnosis Result", "निदान परिणाम", "નિદાન પરિણામ", "निदान निकाल");
add("scanner.confidence", "Confidence Score", "सटीकता स्कोर", "ચોકસાઈ સ્કોર", "अचूकता गुण");
add("scanner.spreadRisk", "Spread Risk", "प्रसार का जोखिम", "ફેલાવવાનું જોખમ", "प्रसाराचा धोका");
add("scanner.naturalTreatment", "Organic / Natural Treatment", "जैविक व प्राकृतिक उपचार", "જૈવિક અને કુદરતી સારવાર", "सेंद्रिय व नैसर्गिक उपाय");
add("scanner.chemicalTreatment", "Chemical Treatment (KVK Validated)", "रासायनिक उपचार (KVK प्रमाणित)", "રાસાયણિક સારવાર (KVK પ્રમાણિત)", "रासायनिक उपाय (KVK प्रमाणित)");
add("scanner.prevention", "Prevention Guidelines", "रोकथाम के उपाय", "અટકાવવાના પગલાં", "प्रतिबंधात्मक उपाय");
add("scanner.scanAnother", "Scan Another Leaf", "दूसरी पत्ती स्कैन करें", "બીજું પાન સ્કેન કરો", "दुसरे पान स्कॅन करा");
add("scanner.recentScans", "Recent Scans", "हालिया स्कैन", "તાજેતરના સ્કેન", "अलीकडील स्कॅन");
add("scanner.clearHistory", "Clear Scan History", "इतिहास साफ करें", "ઇતિહાસ સાફ કરો", "इतिहास साफ करा");
add("scanner.noScans", "No scans recorded yet. Upload a tomato leaf photo to diagnose diseases.", "अभी तक कोई स्कैन नहीं। रोग पहचान के लिए टमाटर की पत्ती का फोटो अपलोड करें।", "હજુ સુધી કોઈ સ્કેન નોંધાયું નથી. રોગની ઓળખ માટે ટામેટાના પાનનો ફોટો અપલોડ કરો.", "अद्याप कोणतेही स्कॅन नोंदवलेले नाही. रोग निदानासाठी टोमॅटोच्या पानाचा फोटो अपलोड करा.");

// ==========================================
// 7. AI AGENT REASONING (reasoning.*)
// ==========================================
add("reasoning.title", "AI AGENT REASONING // JAL-SUPERVISOR", "AI एजेंट रीजनिंग // जल-पर्यवेक्षक", "AI એજન્ટ રીઝનિંગ // જલ-સુપરવાઇઝર", "AI एजंट रिझनिंग // जल-पर्यवेक्षक");
add("reasoning.locked", "LOCKED", "लॉक्ड (सुरक्षित बंद)", "લૉક કરેલ", "लॉक्ड (सुरक्षित बंद)");
add("reasoning.autonomous", "AUTONOMOUS", "स्वायत्त (AUTO)", "સ્વાયત્ત (AUTO)", "स्वायत्त (AUTO)");
add("reasoning.manual", "MANUAL", "मैनुअल (हस्तचालित)", "મેન્યુઅલ", "मॅन्युअल");
add("reasoning.telemetryInputs", "CURRENT TELEMETRY", "वर्तमान टेलीमेट्री", "હાલની ટેલિમેટ્રી", "सध्याची टेलिमेट्री");
add("reasoning.evaluatingRule", "RULE EVALUATED", "जांची गई नियमावली", "ચકાસાયેલ નિયમ", "तपासलेला नियम");
add("reasoning.decisionConfidence", "Decision Confidence", "निर्णय सटीकता", "નિર્ણય ચોકસાઈ", "निर्णय अचूकता");
add("reasoning.rationale", "DECISION RATIONALE", "निर्णय का कारण", "નિર્ણયનું કારણ", "निर्णयाचे कारण");
add("reasoning.pastCycles", "PAST CYCLE TRACE", "पिछले चक्रों का विवरण", "પાછલા ચક્રોની વિગત", "मागील फेऱ्यांचा तपशील");

add("reasoning.staleHeadline", "Sensor node stale (Edge node offline 5s+) → Auto-irrigation locked for safety", "सेंसर नोड निष्क्रिय (एज नोड 5s+ से ऑफलाइन) → सुरक्षा के लिए ऑटो-सिंचाई लॉक", "સેન્સર નોડ નિષ્ક્રિય (એજ નોડ 5 સેકન્ડ+ ઑફલાઇન) → સલામતી માટે ઓટો-સિંચાઈ લૉક", "सेन्सर नोड निष्क्रिय (एज नोड 5 सेकंद+ ऑफलाइन) → सुरक्षिततेसाठी ऑटो-सिंचन लॉक");
add("reasoning.staleRule", "Fail-safe watchdog triggered: irrigation suppressed until link restored", "फेल-सेफ वॉचडॉग सक्रिय: लिंक बहाल होने तक सिंचाई रोकी गई", "ફેલ-સેફ વૉચડોગ સક્રિય: લિંક પુનઃસ્થાપિત ન થાય ત્યાં સુધી સિંચાઈ સ્થગિત", "फेल-सेफ वॉचडॉग सक्रिय: लिंक पूर्ववत होईपर्यंत सिंचन रोखले");

add("reasoning.rainHeadline", "Rain detected → Pump locked OFF (water savings: ~12L today)", "बारिश का संकेत → पंप बंद पर लॉक (आज की पानी बचत: ~12L)", "વરસાદની ઓળખ → પંપ બંધ લૉક (આજની પાણીની બચત: ~12L)", "पावसाचा संकेत → पंप बंद लॉक (आजची पाण्याची बचत: ~12L)");
add("reasoning.rainRule", "Rain sensor active • Precipitation detected • Conserving reservoir", "वर्षा सेंसर सक्रिय • बारिश दर्ज • जलाशय जल संचयन", "વરસાદ સેન્સર સક્રિય • વરસાદ નોંધાયો • જળાશયનું પાણી સાચવવું", "पाऊस सेन्सर सक्रिय • पाऊस नोंदवला • पाणी साठा संवर्धन");

add("reasoning.autoOnHeadline", "Soil {soil}% < {low}% threshold AND No rain detected → Pump ON (Auto mode)", "मिट्टी की नमी {soil}% < {low}% सीमा और बारिश नहीं → पंप चालू (ऑटो मोड)", "જમીનનો ભેજ {soil}% < {low}% મર્યાદા અને વરસાદ નથી → પંપ ચાલુ (ઓટો મોડ)", "मातीतील ओलावा {soil}% < {low}% मर्यादा आणि पाऊस नाही → पंप चालू (ऑटो मोड)");
add("reasoning.autoOnRule", "Active hydration cycle • Moisture target: {high}% • Auto shutoff armed", "सक्रिय सिंचाई चक्र • नमी लक्ष्य: {high}% • ऑटो-कट तैयार", "સક્રિય સિંચાઈ ચક્ર • ભેજ લક્ષ્ય: {high}% • ઓટો-કટ સજ્જ", "सक्रिय सिंचन चक्र • ओलावा लक्ष्य: {high}% • ऑटो-कट सज्ज");

add("reasoning.autoOffHighHeadline", "Soil {soil}% > {high}% threshold → Pump OFF", "मिट्टी की नमी {soil}% > {high}% सीमा → पंप बंद", "જમીનનો ભેજ {soil}% > {high}% મર્યાદા → પંપ બંધ", "मातीतील ओलावा {soil}% > {high}% मर्यादा → पंप बंद");
add("reasoning.autoOffHighRule", "Optimal root zone saturation reached • Pump idle", "जड़ क्षेत्र में पर्याप्त नमी उपलब्ध • पंप विश्राम में", "મૂળ ક્ષેત્રમાં શ્રેષ્ઠ ભેજ સંતૃપ્તિ પહોંચી • પંપ બંધ", "मूळ क्षेत्रात इष्टतम ओलावा संपृक्तता पोहोचली • पंप शांत");

add("reasoning.autoOffNormalHeadline", "Soil {soil}% within acceptable zone [{low}% - {high}%] → Pump OFF", "मिट्टी की नमी {soil}% स्वीकार्य सीमा [{low}% - {high}%] में → पंप बंद", "જમીનનો ભેજ {soil}% સ્વીકાર્ય ઝોન [{low}% - {high}%] માં → પંપ બંધ", "मातीतील ओलावा {soil}% स्वीकार्य क्षेत्रात [{low}% - {high}%] → पंप बंद");
add("reasoning.autoOffNormalRule", "Autonomous guard cycle active • Continuous soil moisture surveillance", "स्वायत्त सुरक्षा चक्र सक्रिय • लगातार नमी की निगरानी", "સ્વાયત્ત સુરક્ષા ચક્ર સક્રિય • સતત જમીનના ભેજનું નિરીક્ષણ", "स्वायत्त सुरक्षा चक्र सक्रिय • निरंतर मातीच्या ओलाव्याची देखरेख");

add("reasoning.manualOnHeadline", "Manual override active → Pump running under operator control", "मैनुअल नियंत्रण सक्रिय → ऑपरेटर नियंत्रण में पंप चालू", "મેન્યુઅલ નિયંત્રણ સક્રિય → ઓપરેટર નિયંત્રણ હેઠળ પંપ ચાલુ", "मॅन्युअल नियंत्रण सक्रिय → ऑपरेटर नियंत्रणाखाली पंप चालू");
add("reasoning.manualOnRule", "Manual burst timer: {seconds}s remaining • Safety cut-off at 10m", "मैनुअल टाइमर: {seconds} सेकंड शेष • 10 मिनट पर सुरक्षा कट-ऑफ", "મેન્યુઅલ ટાઈમર: {seconds} સેકન્ડ બાકી • 10 મિનિટે સલામતી કટ-ઓફ", "मॅन्युअल टायमर: {seconds} सेकंद शिल्लक • 10 मिनिटांवर सुरक्षितता कट-ऑफ");

add("reasoning.manualOffHeadline", "Manual mode enabled → Pump idle waiting for command", "मैनुअल मोड सक्रिय → पंप आदेश की प्रतीक्षा में", "મેન્યુઅલ મોડ સક્ષમ → પંપ આદેશની રાહમાં", "मॅन्युअल मोड सक्षम → पंप आदेशाच्या प्रतीक्षेत");
add("reasoning.manualOffRule", "Autonomous decisions paused • Operator manual dispatch ready", "स्वायत्त निर्णय रोके गए • ऑपरेटर द्वारा चालू करने हेतु तैयार", "સ્વાયત્ત નિર્ણયો થોભાવ્યા • ઓપરેટર દ્વારા શરૂ કરવા તૈયાર", "स्वायत्त निर्णय थांबवले • ऑपरेटर आदेशासाठी सज्ज");

// ==========================================
// 8. DASHBOARD (dashboard.*)
// ==========================================
add("dashboard.soilMoisture", "Soil Moisture", "मिट्टी की नमी", "જમીનનો ભેજ", "मातीतील ओलावा");
add("dashboard.temperature", "Temperature", "तापमान", "તાપમાન", "तापमान");
add("dashboard.humidity", "Humidity", "आर्द्रता", "ભેજ", "आर्द्रता");
add("dashboard.airQuality", "Air Quality (AQI)", "वायु गुणवत्ता (AQI)", "હવાની ગુણવત્તા (AQI)", "हवेची गुणवत्ता (AQI)");
add("dashboard.tankLevel", "Water Tank Level", "पानी की टंकी", "પાણીની ટાંકીનું સ્તર", "पाण्याची टाकी पातळी");
add("dashboard.waterUsed", "Water Used Today", "आज इस्तेमाल हुआ पानी", "આજે વપરાયેલ પાણી", "आज वापरलेले पाणी");
add("dashboard.pumpStatus", "Pump Status", "पंप की स्थिति", "પંપની સ્થિતિ", "पंपाची स्थिती");
add("dashboard.zones", "Crop Zones", "फसल क्षेत्र", "પાક ઝોન", "पीक झोन");
add("dashboard.todaysTasks", "Today's Farm Tasks", "आज के कृषि कार्य", "આજના ખેત કાર્યો", "आजची शेती कामे");
add("dashboard.weather", "Local Weather Forecast", "स्थानीय मौसम पूर्वानुमान", "સ્થાનિક હવામાન આગાહી", "स्थानिक हवामान अंदाज");
add("dashboard.healthScore", "Farm Health Index", "खेत स्वास्थ्य सूचकांक", "ખેત આરોગ્ય આંક", "शेत आरोग्य निर्देशांक");
add("dashboard.liveSensors", "Live Sensor Telemetry", "लाइव सेंसर टेलीमेट्री", "લાઈવ સેન્સર ટેલિમેટ્રી", "थेट सेन्सर टेलिमेट्री");
add("dashboard.liveSensorsSub", "Continuous readings from field edge node", "खेत के एज नोड से लगातार आंकड़े", "ખેતરના એજ નોડમાંથી સતત રીડિંગ્સ", "शेत एज नोडकडून निरंतर नोंदी");
add("dashboard.pumping", "PUMPING WATER", "पानी चल रहा है", "પાણી અપાઈ રહ્યું છે", "पाणी चालू आहे");
add("dashboard.pumpIdle", "PUMP IDLE", "पंप बंद है", "પંપ બંધ છે", "पंप बंद आहे");
add("dashboard.manual", "Manual", "मैनुअल", "મેન્યુઅલ", "मॅन्युअल");
add("dashboard.autoAI", "Auto AI", "ऑटो AI", "ઓટો AI", "ऑटो AI");
add("dashboard.scheduleMode", "Scheduled", "निर्धारित", "સમયપત્રક", "वेळापत्रक");
add("dashboard.scanLeaf", "Scan Tomato Leaf", "टमाटर की पत्ती स्कैन करें", "ટામેટાનું પાન સ્કેન કરો", "टोमॅटोचे पान स्कॅन करा");
add("dashboard.irrigateZoneB", "Irrigate Zone B", "ज़ोन B में पानी दें", "ઝોન B માં સિંચાઈ કરો", "झोन B मध्ये पाणी द्या");
add("dashboard.openGPT", "Ask KrishiGPT", "कृषिGPT से पूछें", "કૃષિGPT ને પૂછો", "कृषीGPT ला विचारा");
add("dashboard.viewMap", "View Farm Map", "खेत का नक्शा देखें", "ખેતરનો નકશો જુઓ", "शेताचा नकाशा पहा");
add("dashboard.aiSuggestions", "AI Crop Suggestions", "AI कृषि सुझाव", "AI પાક સૂચનો", "AI पीक सल्ला");
add("dashboard.waterToday", "Water Saved Today", "आज बचा पानी", "આજે બચેલ પાણી", "आज वाचलेले पाणी");
add("dashboard.dailyReport", "AI Daily Report", "AI दैनिक रिपोर्ट", "AI દૈનિક અહેવાલ", "AI दैनिक अहवाल");
add("dashboard.quickActions", "Quick Actions", "त्वरित कार्य", "ઝડપી ક્રિયાઓ", "जलद कृती");

// ==========================================
// 9. SYSTEM TRUTH & OFFLINE (truth.*, offline.*)
// ==========================================
add("truth.title", "System Truth — what is real in this product", "सिस्टम सत्य — इस उत्पाद में क्या वास्तविक है", "સિસ્ટમ સત્ય — આ પ્રોડક્ટમાં શું વાસ્તવિક છે", "प्रणाली सत्य — या उत्पादनात काय खरे आहे");
add("truth.subtitle", "Each badge names the actual data source; hardware is called live only when the store reports a fresh live connection.", "प्रत्येक लेबल वास्तविक डेटा स्रोत दर्शाता है; हार्डवेयर केवल तभी लाइव कहलाता है जब ताजा कनेक्शन मौजूद हो।", "દરેક ટેગ વાસ્તવિક ડેટા સ્ત્રોત દર્શાવે છે; હાર્ડવેર માત્ર ત્યારે જ લાઈવ કહેવાય જ્યારે તાજું કનેક્શન હોય.", "प्रत्येक लेबल प्रत्यक्ष डेटा स्त्रोत दर्शवते; हार्डवेअर केवळ तेव्हाच थेट म्हटले जाते जेव्हा ताजी जोडणी उपलब्ध असेल.");
add("truth.feature", "Capability", "सुविधा", "ક્ષમતા", "सुविधा");
add("truth.source", "Data source in plain words", "डेटा स्रोत सरल शब्दों में", "સરળ શબ્દોમાં ડેટા સ્ત્રોત", "सोप्या शब्दांत डेटा स्त्रोत");
add("truth.howMade", "Source flag", "स्रोत प्रकार", "સ્ત્રોત પ્રકાર", "स्त्रोत प्रकार");

add("truth.feature.Soil moisture", "Soil moisture", "मिट्टी की नमी", "જમીનનો ભેજ", "मातीतील ओलावा");
add("truth.source.Soil moisture", "Soil probes on the farm device", "खेत उपकरण पर लगे नमी सेंसर प्रोब", "ખેતરમાં લગાવેલ ભેજ સેન્સર પ્રોબ", "शेतात लावलेले ओलावा सेन्सर प्रोब");
add("truth.feature.Temperature", "Temperature", "तापमान", "તાપમાન", "तापमान");
add("truth.source.Temperature", "Temperature sensor on the farm device", "खेत उपकरण पर लगा तापमान सेंसर", "ખેતરમાં લગાવેલ તાપમાન સેન્સર", "शेतातील तापमान सेन्सर");
add("truth.feature.Humidity", "Humidity", "आर्द्रता", "ભેજ", "आर्द्रता");
add("truth.source.Humidity", "Humidity sensor on the farm device", "खेत उपकरण पर लगा आर्द्रता सेंसर", "ખેતરમાં લગાવેલ ભેજ સેન્સર", "शेतातील आर्द्रता सेन्सर");
add("truth.feature.Rain detection", "Rain detection", "बारिश संवेदन", "વરસાદ ઓળખ", "पाऊस संवेदन");
add("truth.source.Rain detection", "Rain sensor on the farm device", "खेत उपकरण पर लगा वर्षा सेंसर", "ખેતરમાં લગાવેલ વરસાદ સેન્સર", "शेतातील पाऊस सेन्सर");
add("truth.feature.Pump state", "Pump state", "पंप स्थिति", "પંપની સ્થિતિ", "पंपाची स्थिती");
add("truth.source.Pump state", "Pump state reported by the farm device", "खेत उपकरण द्वारा रिपोर्ट की गई पंप स्थिति", "ખેતરના ઉપકરણ દ્વારા જણાવેલ પંપ સ્થિતિ", "शेतातील उपकरणाने नोंदवलेली पंप स्थिती");
add("truth.feature.Buzzer alerts", "Buzzer alerts", "बज़र चेतावनी", "બઝર ચેતવણી", "बझर सूचना");
add("truth.source.Buzzer alerts", "Buzzer output on the farm device", "खेत उपकरण पर लगा चेतावनी बज़र", "ખેતરના ઉપકરણ પરનું બઝર આઉટપુટ", "शेतातील उपकरणावरील बझर आउटपुट");
add("truth.feature.Relay control", "Relay control", "रिले नियंत्रण", "રિલે નિયંત્રણ", "रिले नियंत्रण");
add("truth.source.Relay control", "Physical relay connected to the pump", "पंप से जुड़ा भौतिक रिले स्विच", "પંપ સાથે જોડાયેલ ભૌતિક રિલે સ્વિચ", "पंपाला जोडलेले भौतिक रिले स्विच");
add("truth.feature.Leaf Disease Doctor", "Leaf Disease Doctor", "पत्ती रोग डॉक्टर", "પાન રોગ ડૉક્ટર", "पान रोग डॉक्टर");
add("truth.source.Leaf Disease Doctor", "11-class tomato model (9 diseases + healthy + not-a-leaf), trained by us on Teachable Machine, runs fully in the browser — works offline", "11-श्रेणी टमाटर मॉडल (9 रोग + स्वस्थ + गैर-पत्ती), ब्राउज़र में पूरी तरह स्थानीय चलता है — बिना इंटरनेट काम करता है", "11-વર્ગ ટામેટા મોડેલ (9 રોગો + સ્વસ્થ + પાન નથી), બ્રાઉઝરમાં સંપૂર્ણપણે ચાલે છે — ઑફલાઇન કાર્ય કરે છે", "11-वर्ग टोमॅटो मॉडेल (9 रोग + निरोगी + पान नाही), पूर्णपणे ब्राउझरमध्ये चालते — ऑफलाइन कार्य करते");
add("truth.feature.Leaf disease doctor", "Leaf Disease Doctor", "पत्ती रोग डॉक्टर", "પાન રોગ ડૉક્ટર", "पान रोग डॉक्टर");
add("truth.source.Leaf disease doctor", "11-class tomato model (9 diseases + healthy + not-a-leaf), trained by us on Teachable Machine, runs fully in the browser — works offline", "11-श्रेणी टमाटर मॉडल (9 रोग + स्वस्थ + गैर-पत्ती), ब्राउज़र में पूरी तरह स्थानीय चलता है — बिना इंटरनेट काम करता है", "11-વર્ગ ટામેટા મોડેલ (9 રોગો + સ્વસ્થ + પાન નથી), બ્રાઉઝરમાં સંપૂર્ણપણે ચાલે છે — ઑફલાઇન કાર્ય કરે છે", "11-वर्ग टोमॅटो मॉडेल (9 रोग + निरोगी + पान नाही), पूर्णपणे ब्राउझरमध्ये चालते — ऑफलाइन कार्य करते");
add("truth.feature.KrishiGPT", "KrishiGPT", "कृषिGPT", "કૃષિGPT", "कृषीGPT");
add("truth.source.KrishiGPT", "Gemini API response; requires internet and a configured key", "Gemini API उत्तर; इंटरनेट और कुंजी आवश्यक है", "Gemini API પ્રતિસાદ; ઇન્ટરનેટ અને કી જરૂરી છે", "Gemini API प्रतिसाद; इंटरनेट व की आवश्यक आहे");
add("truth.feature.Weather forecast", "Weather forecast", "मौसम पूर्वानुमान", "હવામાન આગાહી", "हवामान अंदाज");
add("truth.source.Weather forecast", "Open-Meteo forecast API; requires internet", "Open-Meteo मौसम API; इंटरनेट आवश्यक है", "Open-Meteo હવામાન API; ઇન્ટરનેટ જરૂરી છે", "Open-Meteo हवामान API; इंटरनेट आवश्यक आहे");
add("truth.feature.Mandi prices", "Mandi prices", "मंडी भाव", "માર્કેટ યાર્ડ ભાવ", "मंडी दर");
add("truth.source.Mandi prices", "data.gov.in market API when configured; demo fallback is labeled", "data.gov.in मार्केट API; डेमो डेटा स्पष्ट रूप से चिह्नित है", "data.gov.in માર્કેટ API; ડેમો ડેટા સ્પષ્ટપણે લેબલ થયેલ છે", "data.gov.in बाजार API; डेमो डेटा स्पष्ट चिन्हांकित आहे");
add("truth.feature.Comfort gauge", "Comfort gauge", "फसल आराम सूचकांक", "પાક અનુકૂળતા ગેજ", "पीक समाधान निर्देशांक");
add("truth.source.Comfort gauge", "Calculated from sensor values and agronomy rules", "सेंसर मानों और कृषि नियमों से गणना", "સેન્સર મૂલ્યો અને કૃષિ નિયમો પરથી ગણતરી", "सेन्सर मूल्ये व कृषी नियमांवरून गणना");
add("truth.feature.Risk matrix", "Risk matrix", "रोग जोखिम चार्ट", "રોગ જોખમ ચાર્ટ", "रोग जोखीम तक्ता");
add("truth.source.Risk matrix", "Rule-based crop risk calculation", "नियम-आधारित फसल जोखिम गणना", "નિયમ-આધારિત પાક જોખમ ગણતરી", "नियम-आधारित पीक जोखीम गणना");
add("truth.feature.Spray windows", "Spray windows", "स्प्रे समय", "છંટકાવ સમય", "फवारणी वेळ");
add("truth.source.Spray windows", "Weather and agronomy rules", "मौसम और कृषि विज्ञान के नियम", "હવામાન અને કૃષિ વિજ્ઞાનના નિયમો", "हवामान व कृषी शास्त्र नियम");
add("truth.feature.Jal Agent thresholds", "Jal Agent thresholds", "जल एजेंट सीमाएं", "જલ એજન્ટ મર્યાદાઓ", "जल एजंट मर्यादा");
add("truth.source.Jal Agent thresholds", "Local configured thresholds control automatic irrigation", "स्थानीय रूप से निर्धारित सीमाएं ऑटो-सिंचाई नियंत्रित करती हैं", "સ્થાનિક નિર્ધારિત મર્યાદાઓ ઓટો-સિંચાઈ નિયંત્રિત કરે છે", "स्थानिक निर्धारित मर्यादा ऑटो-सिंचन नियंत्रित करतात");
add("truth.feature.Demo mode data", "Demo mode data", "डेमो मोड डेटा", "ડેમો મોડ ડેટા", "डेमो मोड डेटा");
add("truth.source.Demo mode data", "Generated sample readings; never hardware measurements", "उत्पन्न किए गए नमूना आंकड़े; वास्तविक हार्डवेयर नहीं", "ઉત્પન્ન થયેલ નમૂના રીડિંગ્સ; ક્યારેય હાર્ડવેર માપન નહીં", "व्युत्पन्न नमुना नोंदी; प्रत्यक्ष हार्डवेअर नाही");

add("offline.title", "Offline resilience", "ऑफलाइन लचीलापन", "ઑફલાઇન ક્ષમતા", "ऑफलाइन लवचिकता");
add("offline.works", "Works with NO internet", "बिना इंटरनेट काम करता है", "ઇન્ટરનેટ વિના કાર્ય કરે છે", "इंटरनेटशिवाय कार्य करते");
add("offline.worksList", "automatic irrigation, buzzer alerts, leaf disease scan, pump control on farm Wi-Fi", "ऑटो सिंचाई, बज़र अलार्म, पत्ती रोग स्कैन, स्थानीय वाई-फाई पर पंप नियंत्रण", "ઓટો સિંચાઈ, બઝર ચેતવણી, પાન રોગ સ્કેન, સ્થાનિક વાઇ-ફાઇ પર પંપ નિયંત્રણ", "ऑटो सिंचन, बझर सूचना, पान रोग स्कॅन, स्थानिक वाय-फायवर पंप नियंत्रण");
add("offline.needs", "Needs internet", "इंटरनेट आवश्यक है", "ઇન્ટરનેટ જરૂરી છે", "इंटरनेट आवश्यक आहे");
add("offline.needsList", "KrishiGPT, weather forecast, cloud dashboard, Telegram alerts", "कृषिGPT, मौसम पूर्वानुमान, क्लाउड डैशबोर्ड, टेलीग्राम अलर्ट", "કૃષિGPT, હવામાન આગાહી, ક્લાઉડ ડેશબોર્ડ, ટેલિગ્રામ ચેતવણીઓ", "कृषीGPT, हवामान अंदाज, क्लाउड डॅशबोर्ड, टेलिग्राम सूचना");

// ==========================================
// 10. COST BENEFIT CALCULATOR (cost.*)
// ==========================================
add("cost.title", "Cost Benefit Calculator", "लागत-लाभ कैलकुलेटर", "ખર્ચ-લાભ કેલ્ક્યુલેટર", "खर्च-नफा गणक");
add("cost.subtitle", "Cost-benefit estimate", "लागत और बचत का अनुमान", "ખર્ચ અને બચતનો અંદાજ", "खर्च व बचतीचा अंदाज");
add("cost.farmSize", "Farm size (acres)", "खेत का आकार (एकड़)", "ખેતરનું કદ (એકર)", "शेताचा आकार (एकर)");
add("cost.waterPrice", "Water price (₹ per 1,000 L)", "पानी की दर (₹ प्रति 1,000 लीटर)", "પાણીનો ભાવ (₹ પ્રતિ 1,000 લિટર)", "पाण्याचा दर (₹ दर 1,000 लिटर)");
add("cost.yield", "Tomato yield (tonnes per acre)", "टमाटर की उपज (टन प्रति एकड़)", "ટામેટાનું ઉત્પાદન (ટન પ્રતિ એકર)", "टोमॅटोचे उत्पादन (टन प्रति एकर)");
add("cost.marketPrice", "Tomato price (₹ per kg)", "टमाटर का भाव (₹ प्रति किलो)", "ટામેટાનો ભાવ (₹ પ્રતિ કિલો)", "टोमॅटोचा भाव (₹ दर किलो)");
add("cost.priceSource", "Price source", "मूल्य स्रोत", "ભાવ સ્ત્રોત", "दर स्त्रोत");
add("cost.monthlySaved", "Saved each month", "हर महीने की बचत", "દર મહિને બચત", "दर महिन्याची बचत");
add("cost.perMonth", "saved / month", "बचत / महीना", "બચત / મહિને", "बचत / महिना");
add("cost.dailyWater", "Water used each day", "प्रतिदिन पानी की खपत", "દરરોજ વપરાતું પાણી", "दररोज वापरलेले पाणी");
add("cost.flood", "Flood irrigation", "खुली बाढ़ सिंचाई", "ધોરિયા પદ્ધતિ", "मोकळे पाणी सिंचन");
add("cost.savedEachDay", "saved each day", "प्रतिदिन बचत", "દરરોજ બચત", "दररोज बचत");
add("cost.seasonUplift", "Season yield increase", "मौसम में अतिरिक्त उपज", "સિઝનમાં ઉત્પાદન વધારો", "हंगामातील उत्पादन वाढ");
add("cost.yieldUpliftDetail", "Estimated extra tomato value this season", "इस मौसम में अतिरिक्त टमाटर का अनुमानित मूल्य", "આ સિઝનમાં અંદાજિત વધારાના ટામેટાંનું મૂલ્ય", "या हंगामातील अतिरिक्त टोमॅटोचे अंदाजे मूल्य");
add("cost.hardwarePayback", "Hardware ₹1,500 recovered in {days} days", "₹1,500 की हार्डवेयर लागत {days} दिनों में वसूल", "₹1,500 નું હાર્ડવેર {days} દિવસમાં વસૂલ", "₹1,500 चा हार्डवेअर खर्च {days} दिवसांत वसूल");

// ==========================================
// 11. VOICE COPILOT (voice.*)
// ==========================================
add("voice.ready", "Ready", "तैयार", "તૈયાર", "सज्ज");
add("voice.listening", "Listening…", "सुन रहा हूँ…", "સાંભળી રહ્યો છું…", "ऐकत आहे…");
add("voice.startListening", "Start Listening", "बोलना शुरू करें", "સાંભળવાનું શરૂ કરો", "बोलणे सुरू करा");
add("voice.stop", "Stop", "रोकें", "રોકો", "थांबवा");
add("voice.voiceOutput", "Voice output", "आवाज़ आउटपुट", "અવાજ આઉટપુટ", "आवाज आउटपुट");
add("voice.recognition", "Recognition", "पहचान", "ઓળખ", "ओळख");
add("voice.commandRef", "Command reference", "आदेश निर्देशिका", "આદેશ માર્ગદર્શિકા", "आदेश संदर्भ");
add("voice.recentCommands", "Recent commands", "हालिया आदेश", "તાજેતરના આદેશો", "अलीकडील आदेश");
add("voice.response", "Response", "उत्तर", "પ્રતિસાદ", "प्रतिसाद");
add("voice.unsupported", "Speech recognition is not supported in this browser.", "इस ब्राउज़र में आवाज़ पहचान समर्थित नहीं है।", "આ બ્રાઉઝરમાં અવાજ ઓળખ ઉપલબ્ધ નથી.", "या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही.");
add("voice.micBlocked", "Microphone blocked — allow mic access in the browser address bar, then try again.", "माइक की अनुमति नहीं है — कृपया ब्राउज़र में अनुमति दें और पुनः प्रयास करें।", "માઇક્રોફોન બ્લોક છે — કૃપા કરીને બ્રાઉઝરમાં માઇક ઍક્સેસ આપો અને ફરી પ્રયાસ કરો.", "मायक्रोफोन ब्लॉक आहे — कृपया ब्राउझरमध्ये परवानगी द्या आणि पुन्हा प्रयत्न करा.");
add("voice.promptTry", "Try saying: 'Start pump', 'Farm status', 'Open leaf scanner' or 'Weather update'", "बोलकर देखें: 'पंप चालू करो', 'खेत की स्थिति', 'पत्ती स्कैनर खोलो' या 'मौसम कैसा है'", "બોલી જુઓ: 'પંપ ચાલુ કરો', 'ખેતરની સ્થિતિ', 'પાન સ્કેનર ખોલો' અથવા 'હવામાન કેવું છે'", "म्हणून पहा: 'पंप सुरू करा', 'शेताची स्थिती', 'पान स्कॅनर उघडा' किंवा 'हवामान कसे आहे'");

// ==========================================
// 12. REPORTS & PRINT STUDIO (reports.*, print.*)
// ==========================================
add("reports.dailyReport", "AI Daily Report", "AI दैनिक रिपोर्ट", "AI દૈનિક અહેવાલ", "AI दैनिक अहवाल");
add("reports.periodReport", "Period Report", "अवधि रिपोर्ट", "સમયગાળાનો અહેવાલ", "कालावधी अहवाल");
add("reports.noHistory", "Not enough history yet — run the pump, log diary entries and scan a leaf, then check back.", "पर्याप्त इतिहास नहीं है — पंप चलाएं, डायरी लिखें और पत्ती स्कैन करें।", "હજુ સુધી પૂરતો ઇતિહાસ નથી — પંપ ચલાવો, ડાયરી લખો અને પાન સ્કેન કરો.", "अद्याप पुरेसा इतिहास नाही — पंप चालवा, डायरी लिहा आणि पान स्कॅन करा.");
add("reports.bestDay", "Best day", "सर्वश्रेष्ठ दिन", "શ્રેષ્ઠ દિવસ", "सर्वोत्तम दिवस");
add("reports.advice", "Recommendation for next week", "अगले सप्ताह की सिफारिश", "આગામી સપ્તાહ માટે ભલામણ", "पुढील आठवड्यासाठी शिफारस");
add("reports.downloadReport", "DOWNLOAD REPORT", "रिपोर्ट डाउनलोड करें", "અહેવાલ ડાઉનલોડ કરો", "अहवाल डाउनलोड करा");
add("reports.exportCsv", "EXPORT CSV", "CSV निर्यात करें", "CSV નિકાસ કરો", "CSV निर्यात करा");
add("reports.backupJson", "BACKUP JSON", "JSON बैकअप लें", "JSON બેકઅપ લો", "JSON बॅकअप घ्या");
add("reports.shareFarm", "Share Live Farm", "लाइव खेत साझा करें", "લાઈવ ખેતર શેર કરો", "थेट शेत शेअर करा");
add("reports.shareSub", "Judges scan the QR, paste the farm token, press Connect", "QR कोड स्कैन करें, टोकन पेस्ट करें और कनेक्ट दबाएं", "QR કોડ સ્કેન કરો, ટોકન પેસ્ટ કરો અને કનેક્ટ દબાવો", "QR कोड स्कॅन करा, टोकन पेस्ट करा आणि कनेक्ट दाबा");

add("print.title", "KrishiNethra AI — Farm Report ({range})", "कृषिनेत्र AI — खेत रिपोर्ट ({range})", "કૃષિનેત્ર AI — ખેત અહેવાલ ({range})", "कृषिनेत्र AI — शेत अहवाल ({range})");
add("print.generated", "Generated on {date}", "{date} को उत्पन्न", "{date} ના રોજ બનાવેલ", "{date} रोजी तयार केले");
add("print.keyNumbers", "Key numbers", "प्रमुख आंकड़े", "મુખ્ય આંકડાઓ", "महत्त्वाचे आकडे");
add("print.avgHealth", "Avg farm health", "औसत खेत स्वास्थ्य", "સરેરાશ ખેત આરોગ્ય", "सरासरी शेत आरोग्य");
add("print.totalWater", "Total water used", "कुल प्रयुक्त जल", "કુલ વપરાયેલ પાણી", "एकूण वापरलेले पाणी");
add("print.waterSaved", "Water saved", "बचाया गया पानी", "પાણીની બચત", "वाचवलेले पाणी");
add("print.totalEnergy", "Total energy", "कुल बिजली खपत", "કુલ વીજ વપરાશ", "एकूण वीज वापर");
add("print.moneySaved", "Money saved (water + energy)", "कुल बचत (पानी + बिजली)", "બચેલ નાણાં (પાણી + વીજળી)", "वाचलेले पैसे (पाणी + वीज)");
add("print.co2Avoided", "CO₂ avoided (pumping)", "CO₂ उत्सर्जन में कमी", "CO₂ ઉત્સર્જન ઘટાડો", "CO₂ घटवले (पंपिंग)");
add("print.diseaseScans", "Disease scans", "पत्ती रोग स्कैन", "પાન રોગ સ્કેન", "रोग स्कॅन");
add("print.irrigationEvents", "Irrigation events", "सिंचाई चक्र", "સિંચાઈ ચક્રો", "सिंचन फेऱ्या");
add("print.tasksCompleted", "Tasks completed", "पूर्ण कार्य", "પૂર્ણ કાર્યો", "पूर्ण कामे");
add("print.periodSummary", "AI period summary", "AI अवधि सारांश", "AI સમયગાળો સારાંશ", "AI कालावधी सारांश");
add("print.dailyBreakdown", "Daily breakdown", "दैनिक विवरण", "દૈનિક વિગત", "दैनिक तपशील");

// ==========================================
// 13. SPRAY PLANNER (spray.*)
// ==========================================
add("spray.title", "Spray Advisory & Chemical Planner", "छिड़काव सलाह व कीटनाशक योजना", "છંટકાવ સલાહ અને જંતુનાશક પ્લાનર", "फवारणी सल्ला व औषध नियोजन");
add("spray.subtitle", "Weather-aware foliar spray schedules calibrated with KVK norms", "मौसम-अनुकूल फवारणी कार्यक्रम, KVK मानकों के अनुसार", "હવામાન-અનુકૂળ છંટકાવ સમયપત્રક, KVK ધોરણો મુજબ", "हवामान-अनुकूल फवारणी वेळापत्रक, KVK मानकांनुसार");
add("spray.activePlans", "Active Spray Plans", "सक्रिय छिड़काव योजनाएं", "સક્રિય છંટકાવ યોજનાઓ", "सक्रिय फवारणी योजना");
add("spray.newPlan", "Create Spray Schedule", "नई स्प्रे योजना बनाएं", "નવી છંટકાવ યોજના બનાવો", "नवीन फवारणी योजना तयार करा");
add("spray.rainWarning", "Rain predicted within 48h — hold all non-systemic chemical sprays", "48 घंटों में बारिश का अनुमान — गैर-प्रणालीगत रासायनिक छिड़काव टालें", "48 કલાકમાં વરસાદની શક્યતા — બિન-પ્રણાલીગત છંટકાવ મોકૂફ રાખો", "48 तासांत पावसाची शक्यता — स्पर्शजन्य रासायनिक फवारणी टाळा");
add("spray.windWarning", "High wind (>15 km/h) — avoid spraying to prevent drift losses", "तेज हवा (>15 km/h) — छिड़काव उड़ने से बचाने के लिए अभी न करें", "તેજ પવન (>15 km/h) — છંટકાવ ઉડી ન જાય તે માટે ટાળો", "वेगाने वाहणारा वारा (>15 km/h) — फवारणी वाहून जाणे टाळण्यासाठी थांबवा");
add("spray.noPlans", "No active spray schedules. Scan a diseased leaf or add a preventive plan.", "कोई सक्रिय स्प्रे योजना नहीं है। पत्ती स्कैन करें या नई योजना जोड़ें।", "કોઈ સક્રિય છંટકાવ યોજના નથી. પાન સ્કેન કરો અથવા નવી યોજના ઉમેરો.", "कोणतीही सक्रिय फवारणी योजना नाही. पान स्कॅन करा किंवा नवीन योजना जोडा.");
add("spray.organic", "Organic / Bio-fungicide", "जैविक / जैव-फफूंदनाशी", "જૈવિક / બાયો-ફંગિસાઇડ", "सेंद्रिय / जैविक बुरशीनाशक");
add("spray.chemical", "Chemical Fungicide", "रासायनिक फफूंदनाशी", "રાસાયણિક ફૂગનાશક", "रासायनिक बुरशीनाशक");
add("spray.step", "Step {step} (Day {day})", "चरण {step} (दिन {day})", "પગલું {step} (દિવસ {day})", "टप्पा {step} (दिवस {day})");
add("spray.completed", "Spray Applied", "छिड़काव पूर्ण", "છંટકાવ પૂર્ણ", "फवारणी पूर्ण");
add("spray.markApplied", "Mark Applied", "छिड़काव चिह्नित करें", "છંટકાવ કરેલ નોંધો", "फवारणी नोंदवा");
add("spray.preventionTips", "Safety and PPE Guidelines", "सुरक्षा और पीपीई दिशानिर्देश", "સલામતી અને પીપીઈ માર્ગદર્શિકા", "सुरक्षितता व पीपीई मार्गदर्शक");

// ==========================================
// 14. TASKS (tasks.*)
// ==========================================
add("tasks.today", "Today", "आज", "આજે", "आज");
add("tasks.completed", "Completed", "पूर्ण", "પૂર્ણ", "पूर्ण");
add("tasks.upcoming", "Upcoming", "आगामी", "આગામી", "आगामी");
add("tasks.addTask", "Add Task", "कार्य जोड़ें", "કાર્ય ઉમેરો", "काम जोडा");
add("tasks.generateAI", "Generate AI Tasks", "AI कार्य बनाएं", "AI કાર્યો બનાવો", "AI कामे तयार करा");
add("tasks.saveTask", "Save Task", "कार्य सहेजें", "કાર્ય સાચવો", "काम जतन करा");
add("tasks.title", "Title", "शीर्षक", "શીર્ષક", "शीर्षक");
add("tasks.priority", "Priority", "प्राथमिकता", "પ્રાથમિકતા", "प्राधान्य");
add("tasks.dueDate", "Due date", "नियत तिथि", "નિયત તારીખ", "अंतिम तारीख");
add("tasks.zone", "Zone (optional)", "ज़ोन (वैकल्पिक)", "ઝોન (વૈકલ્પિક)", "झोन (पर्यायी)");
add("tasks.noTasksToday", "Nothing due today — press “Generate AI Tasks” to build the day's plan.", "आज कोई कार्य बकाया नहीं — 'AI कार्य बनाएं' पर क्लिक करें।", "આજે કોઈ કાર્ય બાકી નથી — 'AI કાર્યો બનાવો' પર ક્લિક કરો.", "आज कोणतेही काम बाकी नाही — 'AI कामे तयार करा' वर क्लिक करा.");
add("tasks.allDone", "All done — farm is smiling 🌾", "सब पूरा हुआ — खेत मुस्कुरा रहा है 🌾", "બધું પૂર્ણ થયું — ખેતર હસી રહ્યું છે 🌾", "सर्व कामे पूर्ण — शेत आनंदी आहे 🌾");
add("tasks.high", "High Priority", "उच्च प्राथमिकता", "ઉચ્ચ પ્રાથમિકતા", "उच्च प्राधान्य");
add("tasks.medium", "Medium Priority", "मध्यम प्राथमिकता", "મધ્યમ પ્રાથમિકતા", "मध्यम प्राधान्य");
add("tasks.low", "Low Priority", "निम्न प्राथमिकता", "ઓછી પ્રાથમિકતા", "कमी प्राधान्य");
add("tasks.dueToday", "Due today", "आज नियत", "આજે નિયત", "आज बाकी");
add("tasks.dueTomorrow", "Due tomorrow", "कल नियत", "આવતીકાલે નિયત", "उद्या बाकी");

// ==========================================
// 15. SCHEMES (schemes.*)
// ==========================================
add("schemes.title", "Government Agricultural Schemes", "सरकारी कृषि योजनाएं", "સરકારી કૃષિ યોજનાઓ", "शासकीय कृषी योजना");
add("schemes.subtitle", "DBT Subsidies, Insurance & Infrastructure Support for Your Farm", "डीबीटी सब्सिडी, फसल बीमा और खेत संरचना सहायता", "ડીબીટી સબસિડી, પાક વીમો અને ખેત માળખાકીય સહાય", "डीबीटी अनुदान, पीक विमा आणि शेती पायाभूत सहाय्य");
add("schemes.search", "Search schemes by name, category or subsidy...", "योजना का नाम या सब्सिडी खोजें...", "યોજનાનું નામ અથવા સબસિડી શોધો...", "योजनेचे नाव किंवा अनुदान शोधा...");
add("schemes.eligibleOnly", "Eligible For My Farm Only", "केवल मेरे खेत हेतु पात्र", "માત્ર મારા ખેતર માટે પાત્ર", "केवळ माझ्या शेतासाठी पात्र");
add("schemes.allCategories", "All Categories", "सभी श्रेणियां", "તમામ શ્રેણીઓ", "सर्व वर्गवारी");
add("schemes.insurance", "Crop Insurance", "फसल बीमा", "પાક વીમો", "पीक विमा");
add("schemes.subsidy", "Equipment & Input Subsidy", "कृषि यंत्र व साधन सब्सिडी", "સાધન અને ઇનપુટ સબસિડી", "अवजारे व निविष्ठा अनुदान");
add("schemes.loan", "Credit & KCC Loans", "केसीसी ऋण", "કેસીસી લોન", "केसीसी कर्ज");
add("schemes.solar", "Solar Pumps & Green Power", "सोलर पंप योजना", "સોલાર પંપ યોજના", "सौर पंप योजना");
add("schemes.income", "Direct Income Support", "प्रत्यक्ष आय सहायता", "સીધી આવક સહાય", "थेट उत्पन्न सहाय्य");
add("schemes.howToApply", "Application Process", "आवेदन प्रक्रिया", "અરજી પ્રક્રિયા", "अर्ज प्रक्रिया");
add("schemes.documents", "Required Documents", "आवश्यक दस्तावेज़", "જરૂરી દસ્તાવેજો", "आवश्यक कागदपत्रे");
add("schemes.officialPortal", "Visit Official Portal", "आधिकारिक पोर्टल देखें", "સત્તાવાર પોર્ટલ જુઓ", "अधिकृत पोर्टल पहा");
add("schemes.printChecklist", "Print Application Checklist", "आवेदन चेकलिस्ट प्रिंट करें", "અરજી ચેકલિસ્ટ પ્રિન્ટ કરો", "अर्ज चेकलिस्ट प्रिंट करा");

// ==========================================
// 16. ALERTS & TELEGRAM (alerts.*, alertsPage.*)
// ==========================================
add("alertsPage.alertCenter", "Alert Center", "चेतावनी केंद्र", "ચેતવણી કેન્દ્ર", "सूचना केंद्र");
add("alertsPage.telegramTitle", "Telegram Alerts", "टेलीग्राम अलर्ट", "ટેલિગ્રામ ચેતવણીઓ", "टेलिग्राम सूचना");
add("alertsPage.rulesTitle", "Alert Rules", "चेतावनी नियम", "ચેતવણીના નિયમો", "सूचना नियम");
add("alertsPage.markRead", "Mark all read", "सभी पढ़ा हुआ चिह्नित करें", "બધું વાંચેલું કરો", "सर्व वाचलेले चिन्हांकित करा");
add("alertsPage.clearAll", "Clear all", "सभी हटाएं", "બધું સાફ કરો", "सर्व हटवा");
add("alertsPage.searchPh", "Search alerts — try “moisture”, “tank”, “disease”…", "चेतावनी खोजें — जैसे “नमी”, “टंकी”, “रोग”…", "ચેતવણી શોધો — જેમ કે “ભેજ”, “ટાંકી”, “રોગ”…", "सूचना शोधा — जसे “ओलावा”, “टाकी”, “रोग”…");
add("alertsPage.testConnection", "Test Connection", "कनेक्शन जांचें", "કનેક્શન તપાસો", "जोडणी तपासा");
add("alertsPage.sendTest", "Send test alert via pipeline", "परीक्षण अलर्ट भेजें", "ટેસ્ટ ચેતવણી મોકલો", "चाचणी सूचना पाठवा");
add("alertsPage.noAlerts", "No alerts — all clear 🌾", "कोई चेतावनी नहीं — सब ठीक है 🌾", "કોઈ ચેતવણી નથી — બધું બરાબર છે 🌾", "कोणतीही सूचना नाही — सर्व सुरक्षित 🌾");
add("alertsPage.allCaughtUp", "all caught up", "सब अपडेट है", "બધું અપડેટ છે", "सर्व अद्ययावत आहे");

add("alerts.telegramBot", "Telegram Bot Token", "टेलीग्राम बॉट टोकन", "ટેલિગ્રામ બોટ ટોકન", "टेलिग्राम बॉट टोकन");
add("alerts.telegramChat", "Telegram Chat ID", "टेलीग्राम चैट आईडी", "ટેલિગ્રામ ચેટ આઈડી", "टेलिग्राम चॅट आयडी");
add("alerts.enableTelegram", "Enable Telegram Bot Forwarding", "टेलीग्राम फॉरवर्डिंग सक्षम करें", "ટેલિગ્રામ ફોરવર્ડિંગ સક્ષમ કરો", "टेलिग्राम फॉरवर्डिंग सक्षम करा");
add("alerts.systemOnlineTitle", "System Online", "सिस्टम ऑनलाइन", "સિસ્ટમ ઓનલાઇન", "प्रणाली ऑनलाइन");
add("alerts.systemOnlineMsg", "KrishiNethra smart farm command center initialized.", "कृषिनेत्र स्मार्ट फार्म कमांड सेंटर आरंभ हुआ।", "કૃષિનેત્ર સ્માર્ટ ફાર્મ કમાન્ડ સેન્ટર શરૂ થયું.", "कृषिनेत्र स्मार्ट शेत कमांड सेंटर सुरू झाले.");
add("alerts.pumpBlockedTitle", "Pump Activation Blocked", "पंप चालू होना अवरुद्ध", "પંપ શરૂ થવામાં અવરોધ", "पंप सुरू होण्यास अडथळा");
add("alerts.pumpBlockedMsg", "Irrigation blocked due to rain sensor detection or empty tank reservoir.", "बारिश दर्ज होने या पानी की टंकी खाली होने के कारण सिंचाई रोकी गई।", "વરસાદ અથવા ખાલી ટાંકીને કારણે સિંચાઈ અટકાવી.", "पाऊस किंवा रिकाम्या टाकीमुळे सिंचन रोखले.");
add("alerts.moistureLowTitle", "Low Soil Moisture", "मिट्टी में कम नमी", "જમીનમાં ઓછો ભેજ", "मातीत कमी ओलावा");
add("alerts.moistureLowMsg", "Soil moisture is below minimum threshold in Zone {zone}.", "ज़ोन {zone} में मिट्टी की नमी न्यूनतम सीमा से नीचे है।", "ઝોન {zone} માં જમીનનો ભેજ લઘુત્તમ મર્યાદાથી નીચે છે.", "झोन {zone} मध्ये मातीतील ओलावा किमान मर्यादेपेक्षा कमी आहे.");
add("alerts.tempHighTitle", "High Ambient Temperature", "अत्यधिक तापमान", "ઊંચું તાપમાન", "अतिउच्च तापमान");
add("alerts.tempHighMsg", "Heat wave detected: temperature is {temp}°C.", "लू का प्रकोप: तापमान {temp}°C दर्ज।", "ગરમીનો પ્રકોપ: તાપમાન {temp}°C છે.", "उष्णतेची लाट: तापमान {temp}°C नोंदवले.");
add("alerts.diseaseTitle", "Crop Disease Detected", "फसल रोग का पता चला", "પાક રોગ ઓળખાયો", "पीक रोग आढळला");
add("alerts.diseaseMsg", "Leaf scanner identified {disease} with {confidence}% confidence.", "पत्ती स्कैनर ने {confidence}% सटीकता से {disease} की पहचान की।", "પાન સ્કેનરે {confidence}% ચોકસાઈ સાથે {disease} ની ઓળખ કરી.", "पान स्कॅनरने {confidence}% अचूकतेने {disease} ओळखले.");
add("alerts.tankLowTitle", "Water Reservoir Low", "पानी की टंकी में कम जल", "પાણીની ટાંકી ખાલી થવા આવી", "पाण्याची टाकी कमी पातळी");
add("alerts.tankLowMsg", "Water tank level has dropped below {level}% capacity.", "पानी की टंकी {level}% से नीचे पहुंच गई है।", "પાણીની ટાંકીનું સ્તર {level}% થી નીચે ગયું છે.", "पाण्याची टाकी {level}% पेक्षा खाली गेली आहे.");
add("alerts.aqiHighTitle", "Poor Air Quality", "खराब वायु गुणवत्ता", "નબળી હવાની ગુણવત્તા", "खराब हवा गुणवत्ता");
add("alerts.aqiHighMsg", "Air quality sensor reports hazardous dust/smoke levels (AQI {aqi}).", "वायु गुणवत्ता सेंसर ने धूल/धुएं का उच्च स्तर (AQI {aqi}) दर्ज किया।", "હવા ગુણવત્તા સેન્સરે ધૂળ/ધૂમાડાનું જોખમી સ્તર (AQI {aqi}) નોંધ્યું.", "हवा गुणवत्ता सेन्सरने धूळ/धुराची घातक पातळी (AQI {aqi}) नोंदवली.");
add("alerts.pumpStartedTitle", "Water Pump Running", "पानी का पंप चालू", "પાણીનો પંપ ચાલુ", "पाण्याचा पंप सुरू");
add("alerts.pumpStartedMsg", "Pump activated for Zone {zone} ({duration}s duration).", "ज़ोन {zone} के लिए {duration} सेकंड हेतु पंप चालू किया गया।", "ઝોન {zone} માટે {duration} સેકન્ડ પંપ શરૂ કર્યો.", "झोन {zone} साठी {duration} सेकंदांसाठी पंप सुरू केला.");

// ==========================================
// 17. IRRIGATION (irrigation.*)
// ==========================================
add("irrigation.pumpTitle", "Water Pump Control", "पानी पंप नियंत्रण", "પાણી પંપ નિયંત્રણ", "पाणी पंप नियंत्रण");
add("irrigation.running", "RUNNING", "चालू है", "ચાલુ છે", "सुरू आहे");
add("irrigation.idle", "IDLE", "बंद है", "બંધ છે", "बंद आहे");
add("irrigation.manual", "Manual Mode", "मैनुअल मोड", "મેન્યુઅલ મોડ", "मॅन्युअल मोड");
add("irrigation.autoAI", "Auto AI Mode", "ऑटो AI मोड", "ઓટો AI મોડ", "ऑटो AI मोड");
add("irrigation.schedule", "Scheduled Mode", "समयबद्ध मोड", "સમયપત્રક મોડ", "वेळापत्रक मोड");
add("irrigation.emergencyStop", "EMERGENCY STOP", "आपातकालीन रोक", "ઇમરજન્સી સ્ટોપ", "आपत्कालीन थांबा");
add("irrigation.quickRun", "Run Pump 30s", "30 सेकंड पंप चलाएं", "30 સેકન્ડ પંપ ચલાવો", "30 सेकंद पंप चालवा");
add("irrigation.tankTitle", "Water Storage Reservoir", "जल भंडारण टंकी", "પાણી સંગ્રહ ટાંકી", "पाणी साठा टाकी");
add("irrigation.refillTank", "Refill Tank", "टंकी भरें", "ટાંકી ભરો", "टाकी भरा");
add("irrigation.refilling", "Refilling Reservoir...", "टंकी भरी जा रही है...", "ટાંકી ભરાઈ રહી છે...", "टाकी भरत आहे...");
add("irrigation.scheduleTitle", "Irrigation Timetable", "सिंचाई समय सारणी", "સિંચાઈ સમયપત્રક", "सिंचन वेळापत्रक");
add("irrigation.scheduleSub", "Automated scheduled irrigation cycles by crop zone", "फसल क्षेत्र अनुसार स्वचालित सिंचाई", "પાક ઝોન મુજબ સ્વચાલિત સિંચાઈ", "पीक झोननुसार स्वयंचलित सिंचन");
add("irrigation.nextScheduled", "Next scheduled cycle: {time}", "अगला चक्र: {time}", "આગામી ચક્ર: {time}", "पुढील फेरी: {time}");
add("irrigation.noSlots", "No scheduled slots configured.", "कोई समय स्लॉट निर्धारित नहीं है।", "કોઈ સમય સ્લોટ ગોઠવેલ નથી.", "कोणताही वेळ स्लॉट ठरवलेला नाही.");
add("irrigation.addSlot", "Add Timetable Slot", "नया समय स्लॉट जोड़ें", "નવો સમય સ્લોટ ઉમેરો", "नवीन वेळ स्लॉट जोडा");
add("irrigation.usageTitle", "Daily Water Flow Volume", "दैनिक जल प्रवाह मात्रा", "દૈનિક પાણી પ્રવાહ જથ્થો", "दैनिक पाणी वापर प्रमाण");
add("irrigation.energyTitle", "Pump Power Consumption", "पंप बिजली खपत", "પંપ વીજ વપરાશ", "पंप वीज वापर");
add("irrigation.historyTitle", "Pump Event History", "पंप इतिहास", "પંપ ઇતિહાસ", "पंप इतिहास");
add("irrigation.aiReasoning", "Jal Agent AI Reasoning", "जल एजेंट AI तर्क", "જલ એજન્ટ AI રીઝનિંગ", "जल एजंट AI तर्क");

// ==========================================
// 18. CLIMATE (climate.*)
// ==========================================
add("climate.title", "Agricultural Weather & Microclimate", "कृषि मौसम व सूक्ष्म जलवायु", "કૃષિ હવામાન અને સૂક્ષ્મ વાતાવરણ", "कृषी हवामान व सूक्ष्म हवामान");
add("climate.subtitle", "Live readings, Open-Meteo forecasts and fungal disease risk matrix", "लाइव रीडिंग, Open-Meteo पूर्वानुमान और फफूंद रोग जोखिम मैट्रिक्स", "લાઈવ રીડિંગ્સ, Open-Meteo આગાહી અને ફૂગ રોગ જોખમ ચાર્ટ", "थेट नोंदी, Open-Meteo अंदाज आणि बुरशी रोग जोखीम तक्ता");
add("climate.comfortScore", "Crop Thermal Comfort", "फसल तापीय अनुकूलता", "પાક તાપમાન અનુકૂળતા", "पीक तापमान समाधान");
add("climate.riskMatrix", "Fungal Disease Microclimate Risk", "फफूंद रोग जोखिम", "ફૂગ રોગ જોખમ", "बुरशी रोग जोखीम");
add("climate.sprayWindows", "Optimal Foliar Spray Windows", "स्प्रे हेतु उत्तम समय", "છંટકાવ માટે શ્રેષ્ઠ સમય", "फवारणीसाठी योग्य वेळ");
add("climate.rainForecast", "Precipitation Probability", "बारिश की संभावना", "વરસાદની શક્યતા", "पावसाची शक्यता");
add("climate.airQuality", "Air Cleanliness & Dust (MQ-135)", "वायु गुणवत्ता व धूल कण (MQ-135)", "હવાની સ્વચ્છતા અને ધૂળ (MQ-135)", "हवेची स्वच्छता व धूळ (MQ-135)");
add("climate.dewPoint", "Dew Point & Condensation", "ओस बिंदु व संघनन", "ઝાકળ બિંદુ અને ઘનીકરણ", "दव बिंदू व संघनन");

// ==========================================
// 19. MARKET (market.*)
// ==========================================
add("market.title", "APMC Mandi Real-Time Prices", "एपीएमसी मंडी लाइव भाव", "એપીએમસી માર્કેટ યાર્ડ લાઈવ ભાવ", "एपीएमसी बाजार थेट दर");
add("market.subtitle", "Live market rates across major wholesale agricultural mandis in India", "भारत की प्रमुख मंडियों में कृषि उत्पादों के थोक भाव", "ભારતના મુખ્ય માર્કેટ યાર્ડ્સમાં જથ્થાબંધ કૃષિ ભાવ", "भारतातील प्रमुख घाऊक कृषी बाजारांमधील थेट दर");
add("market.selectState", "Select State", "राज्य चुनें", "રાજ્ય પસંદ કરો", "राज्य निवडा");
add("market.selectDistrict", "Select District", "ज़िला चुनें", "જિલ્લો પસંદ કરો", "जिल्हा निवडा");
add("market.selectCrop", "Filter By Crop", "फसल अनुसार खोजें", "પાક મુજબ ફિલ્ટર કરો", "पिकानुसार निवडा");
add("market.modalPrice", "Modal Price", "मॉडल भाव", "મોડલ ભાવ", "सरासरी दर");
add("market.minPrice", "Min Price", "न्यूनतम भाव", "લઘુત્તમ ભાવ", "किमान दर");
add("market.maxPrice", "Max Price", "अधिकतम भाव", "મહત્તમ ભાવ", "कमाल दर");
add("market.arrivalDate", "Arrival Date", "आवक तिथि", "આવક તારીખ", "आवक तारीख");
add("market.trend", "Market Trend", "बाज़ार का रुख", "બજાર વલણ", "बाजार कल");

// ==========================================
// 20. DIARY (diary.*)
// ==========================================
add("diary.title", "Farm Activity Log & Crop Diary", "खेत डायरी व गतिविधि रिकॉर्ड", "ખેત ડાયરી અને પાક નોંધ", "शेत डायरी व पीक नोंद");
add("diary.subtitle", "Track planting, scouting notes, sprays, irrigations, and harvest yields", "बुवाई, छिड़काव, सिंचाई और कटाई का रिकॉर्ड रखें", "વાવણી, છંટકાવ, સિંચાઈ અને લણણીની વિગતો નોંધો", "पेरणी, फवारणी, सिंचन आणि काढणीची नोंद ठेवा");
add("diary.newEntry", "Log New Entry", "नई प्रविष्टि जोड़ें", "નવી નોંધ ઉમેરો", "नवीन नोंद करा");
add("diary.entryDate", "Date", "तिथि", "તારીખ", "तारीख");
add("diary.category", "Category", "श्रेणी", "શ્રેણી", "वर्गवारी");
add("diary.notes", "Notes & Observations", "टिप्पणी व निरीक्षण", "નોંધ અને નિરીક્ષણ", "नोंदी व निरीक्षणे");
add("diary.noEntries", "No diary entries yet. Start logging farm activities to build a harvest history.", "अभी कोई प्रविष्टि नहीं। कृषि इतिहास बनाने के लिए गतिविधियां दर्ज करें।", "હજુ સુધી કોઈ નોંધ નથી. પાક ઇતિહાસ બનાવવા માટે પ્રવૃત્તિઓ નોંધો.", "अद्याप कोणतीही नोंद नाही. पीक इतिहास तयार करण्यासाठी उपक्रम नोंदवा.");

// ==========================================
// 21. ASSISTANT (assistant.*)
// ==========================================
add("assistant.title", "KrishiGPT", "कृषिGPT", "કૃષિGPT", "कृषीGPT");
add("assistant.subtitle", "Answers from live farm data · हिन्दी + English + ગુજરાતી + मराठी", "लाइव खेत डेटा से उत्तर · हिन्दी + English + ગુજરાતી + मराठी", "લાઈવ ખેતર ડેટામાંથી જવાબો · हिन्दी + English + ગુજરાતી + मराठी", "थेट शेत माहितीवरून उत्तरे · हिन्दी + English + ગુજરાતી + मराठी");
add("assistant.placeholder", "Ask your question… (e.g. Should I irrigate today?)", "अपना सवाल पूछें… (जैसे: क्या मुझे आज सिंचाई करनी चाहिए?)", "તમારો પ્રશ્ન પૂછો… (દા.ત. શું મારે આજે સિંચાઈ કરવી જોઈએ?)", "तुमचा प्रश्न विचारा… (उदा. मी आज सिंचन करावे का?)");
add("assistant.listening", "Listening… speak now", "सुन रहा हूँ… अब बोलें", "સાંભળી રહ્યો છું… હવે બોલો", "ऐकत आहे… आता बोला");
add("assistant.fallback", "I didn't understand that question. I can help with: water, disease, fertilizer, weather, pump, tank, market prices, schemes, daily report. Try: “Should I irrigate today?”", "मुझे यह सवाल समझ नहीं आया। मैं पानी, रोग, उर्वरक, मौसम, पंप, टंकी, मंडी भाव, योजनाओं में मदद कर सकता हूँ। पूछें: “क्या आज सिंचाई करनी चाहिए?”", "મને આ પ્રશ્ન સમજાયો નથી. હું પાણી, રોગ, ખાતર, હવામાન, પંપ, ટાંકી, બજાર ભાવ, યોજનાઓમાં મદદ કરી શકું છું. પૂછો: “શું આજે સિંચાઈ કરવી જોઈએ?”", "मला हा प्रश्न समजला नाही. मी पाणी, रोग, खते, हवामान, पंप, टाकी, बाजार दर, योजनांमध्ये मदत करू शकतो. विचारा: “मी आज पाणी द्यावे का?”");
add("assistant.help", "Namaste! I am KrishiGPT — I answer from your LIVE farm data: water, disease, fertilizer, weather, pump, tank, market prices, schemes and daily report. Pick a quick question below to start.", "नमस्ते! मैं कृषिGPT हूँ — आपके लाइव खेत डेटा से उत्तर देता हूँ: पानी, रोग, उर्वरक, मौसम, पंप, मंडी भाव, योजनाएं आदि। नीचे दिए गए किसी प्रश्न को चुनें।", "નમસ્તે! હું કૃષિGPT છું — તમારા લાઈવ ખેતર ડેટામાંથી જવાબ આપું છું: પાણી, રોગ, ખાતર, હવામાન, પંપ, માર્કેટ યાર્ડ ભાવ, યોજનાઓ વગેરે. શરૂ કરવા નીચેના પ્રશ્ન પર ક્લિક કરો.", "नमस्ते! मी कृषीGPT आहे — तुमच्या थेट शेत माहितीवरून उत्तरे देतो: पाणी, रोग, खते, हवामान, पंप, बाजार दर, योजना इ. खालील प्रश्न निवडून सुरुवात करा.");
add("assistant.quickNote", "Quick questions", "त्वरित सवाल", "ઝડપી પ્રશ્નો", "जलद प्रश्न");

// ==========================================
// 22. SETTINGS (settings.*)
// ==========================================
add("settings.title", "Settings", "सेटिंग्स", "સેટિંગ્સ", "सेटिंग्ज");
add("settings.subtitle", "Everything updates live — no reload needed", "सब कुछ लाइव अपडेट होता है — रीलोड की आवश्यकता नहीं", "બધું લાઈવ અપડેટ થાય છે — રીલોડની જરૂર નથી", "सर्व काही थेट अपडेट होते — रीलोड करण्याची गरज नाही");
add("settings.farmProfile", "Farm Profile", "फार्म प्रोफ़ाइल", "ફાર્મ પ્રોફાઇલ", "शेत प्रोफाईल");
add("settings.farmProfileSub", "Powers scheme recommendations + market advice", "योजना और बाज़ार सलाह को सक्षम बनाता है", "યોજના અને બજાર સલાહ સક્ષમ કરે છે", "योजना व बाजार सल्ल्यासाठी उपयुक्त");
add("settings.farmName", "Farm name", "खेत का नाम", "ખેતરનું નામ", "शेताचे नाव");
add("settings.farmerName", "Farmer name", "किसान का नाम", "ખેડૂતનું નામ", "शेतकऱ्याचे नाव");
add("settings.state", "State", "राज्य", "રાજ્ય", "राज्य");
add("settings.farmSize", "Farm size", "खेत का आकार", "ખેતરનું કદ", "शेताचा आकार");
add("settings.crops", "Crops you grow", "उगाई जाने वाली फसलें", "તમે ઉગાડો છો તે પાક", "पिकवली जाणारी पिके");
add("settings.gps", "GPS Coordinates", "जीपीएस निर्देशांक", "જીપીએસ કોઓર્ડિનેટ્સ", "जीपीएस निर्देशक");
add("settings.latitude", "Latitude", "अक्षांश", "અક્ષાંશ", "अक्षांश");
add("settings.longitude", "Longitude", "देशांतर", "રેખાંશ", "रेखांश");
add("settings.hasPump", "Irrigation pump", "सिंचाई पंप", "સિંચાઈ પંપ", "सिंचन पंप");
add("settings.pumpYes", "Yes, have pump", "हाँ, पंप उपलब्ध है", "હા, પંપ છે", "होय, पंप आहे");
add("settings.pumpNo", "No pump", "पंप नहीं है", "પંપ નથી", "पंप नाही");
add("settings.language", "Language", "भाषा", "ભાષા", "भाषा");
add("settings.languageSub", "Instant switch: English, Hindi, Gujarati, Marathi", "तत्काल बदलाव: अंग्रेज़ी, हिन्दी, गुजराती, मराठी", "ત્વરિત બદલાવ: અંગ્રેજી, હિન્દી, ગુજરાતી, મરાઠી", "त्वरित बदल: इंग्रजी, हिंदी, गुजराती, मराठी");
add("settings.irrigationThresholds", "Irrigation Thresholds", "सिंचाई सीमाएं", "સિંચાઈ મર્યાદાઓ", "सिंचन मर्यादा");
add("settings.irrigationSub", "Used by Auto AI mode to trigger watering", "ऑटो AI मोड द्वारा पानी चालू/बंद करने हेतु प्रयुक्त", "ઓટો AI મોડ દ્વારા સિંચાઈ નિયંત્રણ માટે વપરાય છે", "ऑटो AI मोडद्वारे पाणी चालू/बंद करण्यासाठी");
add("settings.moistureLow", "Dry threshold (pump turns ON below this)", "न्यूनतम नमी (इससे कम होने पर पंप चालू)", "સૂકો ભેજ (આનાથી નીચે પંપ ચાલુ)", "कमी ओलावा (याखाली पंप चालू)");
add("settings.moistureHigh", "Target threshold (pump turns OFF above this)", "अधिकतम नमी (इससे ऊपर होने पर पंप बंद)", "લક્ષ્ય ભેજ (આનાથી ઉપર પંપ બંધ)", "लक्ष्य ओलावा (यावर पंप बंद)");
add("settings.pumpDuration", "Max run duration (seconds)", "अधिकतम समय (सेकंड)", "મહત્તમ સમય (સેકન્ડ)", "कमाल वेळ (सेकंद)");
add("settings.tankLow", "Tank minimum level (%)", "टंकी का न्यूनतम स्तर (%)", "ટાંકીનું લઘુત્તમ સ્તર (%)", "टाकीची किमान पातळी (%)");
add("settings.climateThresholds", "Climate Alert Thresholds", "मौसम चेतावनी सीमाएं", "હવામાન ચેતવણી મર્યાદાઓ", "हवामान इशारा मर्यादा");
add("settings.climateSub", "Triggers alerts when sensors cross these values", "सेंसर इन सीमाओं को पार करने पर चेतावनी देते हैं", "સેન્સર આ મર્યાદા વટાવે ત્યારે ચેતવણી મળે છે", "सेन्सर या मर्यादा ओलांडल्यावर सूचना मिळते");
add("settings.tempHigh", "High temperature threshold (°C)", "उच्च तापमान सीमा (°C)", "ઊંચા તાપમાનની મર્યાદા (°C)", "उच्च तापमान मर्यादा (°C)");
add("settings.humidityLow", "Low humidity threshold (%)", "न्यूनतम आर्द्रता सीमा (%)", "નીચા ભેજની મર્યાદા (%)", "कमी आर्द्रता मर्यादा (%)");
add("settings.aqiHigh", "High AQI threshold", "उच्च AQI सीमा", "ઊંચી AQI મર્યાદા", "उच्च AQI मर्यादा");
add("settings.camera", "Camera Feed", "कैमरा फ़ीड", "કેમેરા ફીડ", "कॅमेरा फीड");
add("settings.cameraSub", "Switch between simulated and real ESP32/Pi camera", "सिम्युलेटेड और वास्तविक कैमरा के बीच बदलें", "સિમ્યુલેટેડ અને વાસ્તવિક કેમેરા વચ્ચે બદલો", "सिम्युलेटेड व प्रत्यक्ष कॅमेरा दरम्यान बदला");
add("settings.source", "Camera source", "कैमरा स्रोत", "કેમેરા સ્ત્રોત", "कॅमेरा स्त्रोत");
add("settings.simFeed", "Simulation Feed", "सिमुलेशन फ़ीड", "સિમ્યુલેશન ફીડ", "सिम्युलेशन फीड");
add("settings.liveStream", "Live MJPEG Stream", "लाइव MJPEG स्ट्रीम", "લાઈવ MJPEG સ્ટ્રીમ", "थेट MJPEG प्रवाह");
add("settings.streamUrl", "Stream URL", "स्ट्रीम URL", "સ્ટ્રીમ URL", "प्रवाह URL");
add("settings.panSpeed", "Pan-tilt speed", "पैन-टिल्ट गति", "પાન-ટિલ્ટ ગતિ", "पॅन-टिल्ट गती");
add("settings.hardware", "Hardware Bridge", "हार्डवेयर ब्रिज", "હાર્ડવેર બ્રિજ", "हार्डवेअर ब्रिज");
add("settings.hardwareSub", "Connect to real ESP32 / Raspberry Pi gateway", "वास्तविक ESP32 / Pi गेटवे से कनेक्ट करें", "વાસ્તવિક ESP32 / Pi ગેટવે સાથે જોડાઓ", "प्रत्यक्ष ESP32 / Pi गेटवेशी जोडा");
add("settings.simMode", "Simulation Mode", "सिमुलेशन मोड", "સિમ્યુલેશન મોડ", "सिम्युलेशन मोड");
add("settings.liveMode", "Live Hardware Mode", "लाइव हार्डवेयर मोड", "લાઈવ હાર્ડવેર મોડ", "थेट हार्डवेअर मोड");
add("settings.gatewayUrl", "Gateway URL", "गेटवे URL", "ગેટવે URL", "गेटवे URL");
add("settings.testConnection", "Test Connection", "कनेक्शन जांचें", "કનેક્શન તપાસો", "जोडणी तपासा");
add("settings.liveNote", "Hardware bridge connects to local ESP32 node via Wi-Fi/MQTT.", "हार्डवेयर ब्रिज वाई-फाई/MQTT के ज़रिए स्थानीय नोड से जुड़ता है।", "હાર્ડવેર બ્રિજ વાઇ-ફાઇ/MQTT દ્વારા સ્થાનિક નોડ સાથે જોડાય છે.", "हार्डवेअर ब्रिज वाय-फाय/MQTT द्वारे स्थानिक नोडशी जोडतो.");
add("settings.alerts", "Alert Settings", "चेतावनी सेटिंग्स", "ચેતવણી સેટિંગ્સ", "सूचना सेटिंग्ज");
add("settings.alertsSub", "Configure buzzer and notification alerts", "बज़र और सूचनाएं कॉन्फ़िगर करें", "બઝર અને સૂચનાઓ ગોઠવો", "बझर आणि सूचना कॉन्फिगर करा");
add("settings.sound", "Sound alerts", "ध्वनि अलर्ट", "અવાજ ચેતવણીઓ", "आवाज सूचना");
add("settings.soundSub", "Plays WebAudio buzzer on critical events", "गंभीर स्थिति में बज़र ध्वनि बजाता है", "ગંભીર પરિસ્થિતિમાં બઝર વગાડે છે", "गंभीर प्रसंगी बझर वाजवतो");
add("settings.browserNotif", "Browser notifications", "ब्राउज़र सूचनाएं", "બ્રાઉઝર સૂચનાઓ", "ब्राउझर सूचना");
add("settings.browserNotifSub", "Show desktop alerts even when app is in background", "ऐप बैकग्राउंड में होने पर भी सूचनाएं दिखाएं", "એપ બેકગ્રાઉન્ડમાં હોય ત્યારે પણ ચેતવણી બતાવો", "ॲप पार्श्वभूमीत असतानाही सूचना दाखवा");
add("settings.enableNotif", "Enable Notifications", "सूचनाएं सक्षम करें", "સૂચનાઓ સક્ષમ કરો", "सूचना सक्षम करा");
add("settings.voice", "Voice Settings", "आवाज़ सेटिंग्स", "અવાજ સેટિંગ્સ", "आवाज सेटिंग्ज");
add("settings.voiceSub", "Configure voice output and speech recognition", "आवाज़ आउटपुट और पहचान सेट करें", "અવાજ આઉટપુટ અને ઓળખ સેટ કરો", "आवाज आउटपुट व ओळख सेट करा");
add("settings.output", "Voice output (TTS)", "आवाज़ आउटपुट (TTS)", "અવાજ આઉટપુટ (TTS)", "आवाज आउटपुट (TTS)");
add("settings.recLang", "Recognition language", "पहचान भाषा", "ઓળખ ભાષા", "ओळख भाषा");
add("settings.data", "Data Management", "डेटा प्रबंधन", "ડેટા સંચાલન", "डेटा व्यवस्थापन");
add("settings.dataSub", "Export, import, or reset farm state", "डेटा निर्यात, आयात या रीसेट करें", "ડેટા નિકાસ, આયાત અથવા રીસેટ કરો", "डेटा निर्यात, आयात किंवा रीसेट करा");
add("settings.exportBackup", "Export backup JSON", "बैकअप JSON निर्यात करें", "બેકઅપ JSON નિકાસ કરો", "बॅकअप JSON निर्यात करा");
add("settings.importBackup", "Import backup JSON", "बैकअप JSON आयात करें", "બેકઅપ JSON આયાત કરો", "बॅकअप JSON आयात करा");
add("settings.resetFarm", "Reset farm data", "खेत डेटा रीसेट करें", "ખેતરનો ડેટા રીસેટ કરો", "शेत डेटा रीसेट करा");
add("settings.resetTitle", "Reset all farm data?", "सारा खेत डेटा रीसेट करें?", "બધો ખેત ડેટા રીસેટ કરવો છે?", "सर्व शेत डेटा रीसेट करायचा?");
add("settings.resetMessage", "This clears all sensor history, tasks, diary entries, and custom settings. Demo mode will reseed.", "यह सभी सेंसर इतिहास, कार्य, डायरी और सेटिंग्स मिटा देगा।", "આ તમામ સેન્સર ઇતિહાસ, કાર્યો, ડાયરી અને સેટિંગ્સ સાફ કરશે.", "हे सर्व सेन्सर इतिहास, कामे, डायरी आणि सेटिंग्ज पुसून टाकेल.");
add("settings.storageUsage", "Storage usage", "मेमोरी उपयोग", "મેમરી વપરાશ", "मेमरी वापर");
add("settings.i18nCoverage", "Localization Coverage (en / hi / gu / mr)", "भाषा कवरेज (en / hi / gu / mr)", "ભાષા કવરેજ (en / hi / gu / mr)", "भाषा कव्हरेज (en / hi / gu / mr)");
add("settings.i18nCoverageSub", "Enforced 100% dictionary key coverage across all 4 languages", "चारों भाषाओं में अनिवार्य 100% डिक्शनरी कवरेज", "તમામ 4 ભાષાઓમાં ફરજિયાત 100% શબ્દકોશ કવરેજ", "सर्व 4 भाषांमध्ये सक्तीचे 100% शब्दकोश कव्हरेज");

// ==========================================
// 23. ONBOARDING WIZARD (onboarding.*)
// ==========================================
add("onboarding.step1Title", "Select Preferred Language", "अपनी पसंदीदा भाषा चुनें", "તમારી પસંદગીની ભાષા પસંદ કરો", "तुमची पसंतीची भाषा निवडा");
add("onboarding.step1Sub", "Choose your language for voice, diagnostics, and reports", "आवाज़, निदान और रिपोर्ट के लिए भाषा चुनें", "અવાજ, નિદાન અને અહેવાલો માટે ભાષા પસંદ કરો", "आवाज, निदान आणि अहवालासाठी भाषा निवडा");
add("onboarding.step2Title", "Where is your farm located?", "आपका खेत कहाँ स्थित है?", "તમારું ખેતર ક્યાં આવેલું છે?", "तुमचे शेत कोठे आहे?");
add("onboarding.step2Sub", "Used for weather, market prices, and government schemes", "मौसम, मंडी भाव और सरकारी योजनाओं के लिए प्रयुक्त", "હવામાન, બજાર ભાવ અને સરકારી યોજનાઓ માટે વપરાય છે", "हवामान, बाजार दर आणि शासकीय योजनांसाठी वापरले जाते");
add("onboarding.step3Title", "Your Farm Profile", "आपके खेत की प्रोफ़ाइल", "તમારા ખેતરની પ્રોફાઇલ", "तुमच्या शेताची प्रोफाईल");
add("onboarding.step3Sub", "Size, soil, water & crops — AI tunes advice to this", "आकार, मिट्टी, पानी और फसलें — AI इसी अनुसार सलाह देता है", "કદ, માટી, પાણી અને પાક — AI આ મુજબ સલાહ આપે છે", "आकार, माती, पाणी व पिके — AI यानुसार सल्ला देतो");
add("onboarding.step4Title", "Ready to grow? 🌱", "कृषि यात्रा शुरू करें? 🌱", "ખેતી શરૂ કરવા તૈયાર? 🌱", "शेती सुरू करण्यास सज्ज? 🌱");
add("onboarding.step4Sub", "Review everything — you can edit later in Settings", "सब जांच लें — आप इसे बाद में सेटिंग्स में बदल सकते हैं", "બધું ચકાસી લો — તમે સેટિંગ્સમાં પછીથી બદલી શકો છો", "सर्व तपासा — तुम्ही नंतर सेटिंग्जमध्ये बदलू शकता");
add("onboarding.detectLocation", "📍 Detect My Location", "📍 मेरा स्थान पहचानें", "📍 મારું સ્થાન શોધો", "📍 माझे स्थान शोधा");
add("onboarding.detecting", "Detecting… allow location access", "पहचान जारी… कृपया अनुमति दें", "શોધી રહ્યું છે… સ્થાન ઍક્સેસ આપો", "शोधत आहे… स्थान परवानगी द्या");
add("onboarding.detectedOk", "Location detected", "स्थान सफलतापूर्वक पहचाना गया", "સ્થાન સફળતાપૂર્વક મળ્યું", "स्थान यशस्वीरित्या सापडले");
add("onboarding.permissionDenied", "Location permission denied — please pick manually", "स्थान अनुमति अस्वीकृत — कृपया मैन्युअल चुनें", "સ્થાન પરવાનગી નકારી — કૃપા કરીને મેન્યુઅલ પસંદ કરો", "स्थान परवानगी नाकारली — कृपया स्वतः निवडा");
add("onboarding.manualTitle", "Or enter manually", "या मैन्युअल रूप से दर्ज करें", "અથવા મેન્યુઅલી દાખલ કરો", "किंवा स्वतः प्रविष्ट करा");
add("onboarding.stateLabel", "State", "राज्य", "રાજ્ય", "राज्य");
add("onboarding.districtLabel", "District", "ज़िला", "જિલ્લો", "जिल्हा");
add("onboarding.districtPh", "Type your district", "अपना ज़िला लिखें", "તમારો જિલ્લો લખો", "तुमचा जिल्हा लिहा");
add("onboarding.villageLabel", "Village / Taluka", "गाँव / तालुका", "ગામ / તાલુકો", "गाव / तालुका");
add("onboarding.villagePh", "e.g. Sanand, Ahmedabad", "जैसे: साणंद, अहमदाबाद", "દા.ત. સાણંદ, અમદાવાદ", "उदा. बारामती, पुणे");
add("onboarding.gpsLabel", "GPS coordinates", "जीपीएस निर्देशांक", "જીપીએસ કોઓર્ડિનેટ્સ", "जीपीएस निर्देशक");
add("onboarding.farmName", "Farm name", "खेत का नाम", "ખેતરનું નામ", "शेताचे नाव");
add("onboarding.farmSize", "Farm size", "खेत का आकार", "ખેતરનું કદ", "शेताचा आकार");
add("onboarding.soilType", "Soil type", "मिट्टी का प्रकार", "માટીનો પ્રકાર", "मातीचा प्रकार");
add("onboarding.waterSource", "Water source", "पानी का स्रोत", "પાણીનો સ્ત્રોત", "पाण्याचा स्त्रोत");
add("onboarding.irrigationMethod", "Irrigation method", "सिंचाई की विधि", "સિંચાઈ પદ્ધતિ", "सिंचन पद्धत");
add("onboarding.powerSource", "Power source", "ऊर्जा स्रोत", "વીજળી/ઊર્જા સ્ત્રોત", "ऊर्जा स्त्रोत");
add("onboarding.crops", "Crops you grow", "उगाई जाने वाली फसलें", "તમે ઉગાડો છો તે પાક", "पिकवली जाणारी पिके");
add("onboarding.cropsHint", "Tap to select — first 3 become Zone A / B / C", "चुनने के लिए टैप करें — पहली 3 फसलें ज़ोन A / B / C बनेंगी", "પસંદ કરવા ટેપ કરો — પ્રથમ 3 પાક ઝોન A / B / C બનશે", "निवडण्यासाठी टॅप करा — पहिली 3 पिके झोन A / B / C बनतील");
add("onboarding.zonesPreview", "Zones: A → {a} · B → {b} · C → {c}", "ज़ोन: A → {a} · B → {b} · C → {c}", "ઝોન: A → {a} · B → {b} · C → {c}", "झोन: A → {a} · B → {b} · C → {c}");
add("onboarding.pinToggle", "Protect app with PIN", "ऐप को पिन से सुरक्षित करें", "એપને PIN વડે સુરક્ષિત કરો", "ॲप पिनने सुरक्षित करा");
add("onboarding.pinToggleSub", "Future visits ask for a 4-digit PIN instead of the wizard", "अगली बार विज़ार्ड के स्थान पर 4 अंकों का पिन मांगा जाएगा", "આગલી મુલાકાતે વિઝાર્ડને બદલે 4-અંકનો PIN પૂછાશે", "पुढील वेळी विझार्ड ऐवजी 4-अंकी पिन विचारला जाईल");
add("onboarding.setPin", "Set 4-digit PIN", "4 अंकों का पिन सेट करें", "4-અંકનો PIN સેટ કરો", "4-अंकी पिन सेट करा");
add("onboarding.startFarming", "🌾 Start Farming with AI", "🌾 AI के साथ खेती शुरू करें", "🌾 AI સાથે ખેતી શરૂ કરો", "🌾 AI सह शेती सुरू करा");
add("onboarding.pinUnlockTitle", "Welcome back", "वापसी पर स्वागत है", "પુનઃ સ્વાગત છે", "पुन्हा स्वागत आहे");
add("onboarding.pinUnlockSub", "Enter your 4-digit PIN to open your farm", "अपना खेत खोलने के लिए 4 अंकों का पिन डालें", "તમારું ખેતર ખોલવા 4-અંકનો PIN નાખો", "तुमचे शेत उघडण्यासाठी 4-अंकी पिन टाका");
add("onboarding.unlockButton", "Unlock Farm →", "खेत खोलें →", "ખેતર અનલૉક કરો →", "शेत उघडा →");
add("onboarding.wrongPin", "Wrong PIN — try again", "गलत पिन — पुनः प्रयास करें", "ખોટો PIN — ફરી પ્રયાસ કરો", "चुकीचा पिन — पुन्हा प्रयत्न करा");
add("onboarding.editLater", "You can edit all of this later in Settings → Farm Profile.", "आप यह सब बाद में सेटिंग्स → फार्म प्रोफ़ाइल में बदल सकते हैं।", "તમે આ બધું પછીથી સેટિંગ્સ → ફાર્મ પ્રોફાઇલમાં બદલી શકો છો.", "तुम्ही हे सर्व नंतर सेटिंग्ज → शेत प्रोफाईलमध्ये बदलू शकता.");

// Write out the 4 files
const langs = ["en", "hi", "gu", "mr"];
const allKeys = Object.keys(T).sort();

console.log(`Generating dictionaries for ${allKeys.length} keys...`);

for (const lang of langs) {
  const lines = [
    `// KrishiNethra AI dictionary — ${lang.toUpperCase()}`,
    `// validate terms with Krishi Vigyan Kendra`,
    `export const ${lang}: Record<string, string> = {`
  ];
  for (const k of allKeys) {
    const val = T[k][lang] || T[k].en;
    // escape string for typescript
    const escaped = JSON.stringify(val);
    lines.push(`  ${JSON.stringify(k)}: ${escaped},`);
  }
  lines.push(`};`);
  lines.push(``);
  const filePath = path.join(dictDir, `${lang}.ts`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${filePath} (${allKeys.length} keys)`);
}
console.log('Finished building all dictionaries successfully!');
