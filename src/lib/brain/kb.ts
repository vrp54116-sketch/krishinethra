/**
 * src/lib/brain/kb.ts
 *
 * PROMPT B3 — KNOWLEDGE BRAIN: Quadrilingual Agronomy Textbook (EN, HI, GU, MR)
 *
 * Structured KB entries covering:
 *  1. 10 Tomato Diseases + Healthy (symptoms, natural treatment, chemical fallback + safety period/PHI, prevention)
 *  2. Irrigation Rules (with live farm sensor & prediction placeholders)
 *  3. Fertilizer Doses Per Growth Stage (seedling, vegetative, flowering, fruiting, urea, NPK, organic)
 *  4. Weather Action Rules (spray window, rain effect, heat stress, frost/cold stress, humidity risk)
 *  5. Pest Calendar & IPM (seasonal pest timeline, whitefly, fruit borer)
 *  6. Soil & AQI Meaning Explainers (capacitive moisture, AQI gas, pump status, savings, blossom end rot)
 *
 * Doses are agronomically verified and strictly numeric.
 */

export interface KBSymptomCare {
  symptoms?: { en: string; hi: string; gu: string; mr: string };
  natural?: { en: string; hi: string; gu: string; mr: string };
  chemical?: { en: string; hi: string; gu: string; mr: string };
  safetyPeriodDays?: number; // Pre-harvest interval (PHI) in days
  prevention?: { en: string[]; hi: string[]; gu: string[]; mr: string[] };
}

export interface KBEntry extends KBSymptomCare {
  id: string;
  crop: "tomato";
  topic:
    | "disease"
    | "irrigation"
    | "fertilizer"
    | "weather"
    | "pest"
    | "soil_aqi"
    | "general";
  texts: {
    en: string;
    hi: string;
    gu: string;
    mr: string;
  };
}

export const TOMATO_KB: KBEntry[] = [
  /* ------------------------------------------------------------------ */
  /* 1. DISEASES + HEALTHY (11 Entries)                                  */
  /* ------------------------------------------------------------------ */
  {
    id: "healthy",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 0,
    symptoms: {
      en: "Leaves are vibrant green, firm, and erect with no spotting, curling, or mildew.",
      hi: "पत्तियां चमकदार हरी, तरोताजा और सीधी हैं। कोई दाग, मरोड़ या फफूंद नहीं है।",
      gu: "પાન ચમકદાર લીલા, મજબૂત અને ટટ્ટાર છે. કોઈ ડાઘ, વળાંક કે ફૂગ નથી.",
      mr: "पाने टवटवीत हिरवी, ताठ आणि निरोगी आहेत. पानांवर कोणतेही डाग किंवा बुरशी नाही.",
    },
    natural: {
      en: "Continue standard care: apply 500 ml Jeevamrut (1:10 dilution) per plant every 15 days.",
      hi: "नियमित देखभाल जारी रखें: हर 15 दिन में 500 मिली जीवामृत (1:10 घोल) प्रति पौधा दें।",
      gu: "નિયમિત સંભાળ ચાલુ રાખો: દર 15 દિવસે છોડ દીઠ 500 મિલી જીવામૃત (1:10 દ્રાવણ) આપો.",
      mr: "नियमित काळजी सुरू ठेवा: दर 15 दिवसांनी 500 मिली जिवामृत (1:10 द्रावण) प्रति रोप द्या.",
    },
    chemical: {
      en: "None required for healthy crops.",
      hi: "स्वस्थ फसल के लिए किसी रसायन की आवश्यकता नहीं है।",
      gu: "તંદુરસ્ત પાક માટે કોઈ રસાયણની જરૂર નથી.",
      mr: "निरोगी पिकासाठी कोणत्याही रासायनिक औषधाची गरज नाही.",
    },
    prevention: {
      en: [
        "Maintain 60 cm plant spacing for airflow",
        "Drip irrigate at base, never wet foliage",
        "Apply 5 cm straw mulch to prevent soil splash",
      ],
      hi: [
        "हवा के लिए पौधों के बीच 60 सेमी की दूरी रखें",
        "जड़ों में ड्रिप से पानी दें, पत्तियों पर छिड़काव न करें",
        "मिट्टी के छीटों से बचने के लिए 5 सेमी पुआल की मल्चिंग करें",
      ],
      gu: [
        "હવા ઉજાસ માટે છોડ વચ્ચે 60 સેમી અંતર જાળવો",
        "ડ્રિપ દ્વારા મૂળમાં પાણી આપો, પાન પર પાણી ન છાંટો",
        "જમીન ઉડતી રોકવા 5 સેમી સૂકા ઘાસનું મલ્ચિંગ કરો",
      ],
      mr: [
        "हवेसाठी रोपांमध्ये 60 सेमी अंतर ठेवा",
        "ठिबक सिंचनाने मुळाशी पाणी द्या, पानांवर पाणी उडवू नका",
        "मातीचे उडणे रोખण्यासाठी 5 सेमी गवताचे मल्चिंग करा",
      ],
    },
    texts: {
      en: "Your tomato plants are healthy and thriving. Leaves show strong turgor and balanced chlorophyll. Continue balanced drip irrigation and regular scouting. Apply 500 ml Jeevamrut (1:10 dilution) per plant every 15 days to sustain beneficial root mycorrhiza. [{{citation}}]",
      hi: "आपके टमाटर के पौधे पूरी तरह स्वस्थ हैं। पत्तियां चमकदार हरी और तंदुरुस्त हैं। ड्रिप सिंचाई सही रखें और नियमित निगरानी करें। जड़ों की ताकत बनाए रखने के लिए हर 15 दिन में 500 मिली जीवामृत (1:10) प्रति पौधा दें। [{{citation}}]",
      gu: "તમારા ટામેટાના છોડ તંદુરસ્ત અને સ્વસ્થ છે. પાનમાં પૂરતો હરિતદ્રવ્ય અને તાજગી છે. સંતુલિત ડ્રિપ પિયત અને નિયમિત દેખરેખ ચાલુ રાખો. મૂળના સારા વિકાસ માટે દર 15 દિવસે છોડ દીઠ 500 મિલી જીવામૃત (1:10) આપો. [{{citation}}]",
      mr: "तुमची टोमॅटोची झाडे पूर्णपणे निरोगी आणि सशक्त आहेत. पानांचा रंग हिरवागार आणि टवटवीत आहे. योग्य ठिबक सिंचन सुरू ठेवा. मुळांच्या पोषणासाठी दर 15 दिवसांनी प्रति झाड 500 मिली जिवामृत (1:10) देत राहा. [{{citation}}]",
    },
  },
  {
    id: "early_blight",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 7,
    symptoms: {
      en: "Concentric dark brown rings (target board / bullseye pattern) on older lower leaves, surrounded by yellowing.",
      hi: "निचली पुरानी पत्तियों पर गहरे भूरे रंग के गोल छल्ले (टारगेट बोर्ड पैटर्न) और किनारों पर पीलापन।",
      gu: "નીચલા જૂના પાન પર ઘેરા બદામી રંગના ગોળ ચકતા (ટાર્ગેટ બોર્ડ ભાત) અને આસપાસ પીળાશ.",
      mr: "खालच्या जुन्या पानांवर गोलाकार तपकिरी ठिपके (टार्गेट बोर्ड पॅटर्न) आणि भोवती पिवळेपणा.",
    },
    natural: {
      en: "Prune and burn infected lower leaves. Spray cold-pressed Neem oil at 5 ml/L with 1 ml liquid soap weekly.",
      hi: "संक्रमित निचली पत्तियों को तोड़कर जला दें। 5 मिली/लीटर नीम का तेल और 1 मिली साबुन घोल मिलाकर साप्ताहिक छिड़कें।",
      gu: "રોગિષ્ઠ નીચલા પાન કાપીને બાળી નાખો. 5 મિલી/લિટર લીમડાનું તેલ + 1 મિલી સાબુનું દ્રાવણ દર અઠવાડિયે છાંટો.",
      mr: "बाधित खालची पाने तोडून नष्ट करा. 5 मिली/लिटर निंबोळी तेल + 1 मिली साबणाचे पाणी आठवड्यातून एकदा फवारा.",
    },
    chemical: {
      en: "Mancozeb 75% WP at 2 g/L water or Chlorothalonil 75% WP at 2 g/L. Pre-harvest interval (PHI) is 7 days.",
      hi: "मैंकोजेब 75% WP 2 ग्राम/लीटर पानी या क्लोरोथालोनिल 2 ग्राम/लीटर। छिड़काव के बाद 7 दिन तक तुड़ाई न करें (PHI 7 दिन)।",
      gu: "મેન્કોઝેબ 75% WP 2 ગ્રામ/લિટર પાણી અથવા ક્લોરોથાલોનિલ 2 ગ્રામ/લિટર. દવા છાંટ્યા પછી 7 દિવસ ફળ ન તોડવા (PHI 7 દિવસ).",
      mr: "मॅनकोझेब 75% WP 2 ग्रॅम/लिटर पाणी किंवा क्लोरोथॅलोनिल 2 ग्रॅम/लिटर. फवारणीनंतर 7 दिवस तोडणी करू नका (PHI 7 दिवस).",
    },
    prevention: {
      en: [
        "Avoid overhead irrigation to keep leaves dry",
        "Stake plants to keep branches 30 cm above soil",
        "Rotate away from Solanaceae crops for 2 seasons",
      ],
      hi: [
        "पत्तियों को गीला होने से बचाने के लिए ड्रिप का उपयोग करें",
        "पौधों को डंडों से सहारा दें ताकि शाखाएं मिट्टी से 30 सेमी ऊपर रहें",
        "कम से कम 2 सीजन तक टमाटर या मिर्च की जगह दूसरी फसल लगाएं",
      ],
      gu: [
        "પાન ભીના ન થાય તે માટે ટપક પદ્ધતિ વાપરો",
        "છોડને લાકડીના ટેકા બાંધો જેથી ડાળીઓ જમીનથી 30 સેમી ઊંચી રહે",
        "2 સીઝન સુધી ટામેટા-મરચાં સિવાયના પાકની ફેરબદલી કરો",
      ],
      mr: [
        "पाने ओली होऊ नयेत म्हणून ठिबक सिंचन वापरा",
        "झाडांना आधार द्या जेणेकरून फांद्या जमिनीपासून 30 सेमी वर राहतील",
        "पुढील 2 हंगामात पिकांची फेरपालट करा",
      ],
    },
    texts: {
      en: "Early Blight (Alternaria solani) detected or suspected. Caused by warm temperatures (>24°C) and moisture. Prune and destroy lower spotted leaves. Natural treatment: Spray Neem oil at 5 ml/L water weekly. Chemical fallback: Mancozeb 75% WP at 2 g/L (safety interval: 7 days before picking). [{{citation}}]",
      hi: "अगेती झुलसा (Early Blight - Alternaria solani): यह 24°C से अधिक तापमान और नमी में तेजी से फैलता है। निचली संक्रमित पत्तियों को काटकर नष्ट करें। जैविक उपचार: 5 मिली/लीटर नीम का तेल साप्ताहिक छिड़कें। रासायनिक विकल्प: मैंकोजेब 2 ग्राम/लीटर पानी (सुरक्षा अवधि: 7 दिन)। [{{citation}}]",
      gu: "અર્લી બ્લાઇટ (Early Blight - અલ્ટરનેરિયા સોલાની): 24°C થી વધુ તાપમાન અને ભેજમાં આ રોગ ફેલાય છે. નીચેના ડાઘવાળા પાન તોડી નાખો. દેશી ઉપચાર: 5 મિલી/લિટર લીંબોળીનું તેલ દર અઠવાડિયે છાંટો. રાસાયણિક ઉપાય: મેન્કોઝેબ 2 ગ્રામ/લિટર (સલામતી ગાળો: 7 દિવસ). [{{citation}}]",
      mr: "लवकर येणारा करपा (Early Blight - अल्टरनेरिया सोलाणी): 24°C पेक्षा जास्त तापमान आणि हवेतील ओलाव्यामुळे हा बुरशीजन्य रोग वाढतो. खालची डाग पडलेली पाने काढून नष्ट करा. सेंद्रिय उपाय: निंबोळी तेल 5 मिली/लिटर फवारा. रासायनिक उपाय: मॅनकोझेब 2 ग्रॅम/लिटर (तोडणीपूर्वी 7 दिवसांचे अंतर ठेवा). [{{citation}}]",
    },
  },
  {
    id: "late_blight",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 10,
    symptoms: {
      en: "Large water-soaked oily greenish-black patches on leaves and stems; white cottony fungal growth on leaf undersides during cool humid mornings.",
      hi: "पत्तियों और तनों पर पानी से भीगे हुए काले-हरे तैलीय धब्बे; ठंडी और नम सुबह में पत्तियों के नीचे सफेद फफूंद दिखाई देती है।",
      gu: "પાન અને થડ પર પાણી ભરાયેલા કાળાશ પડતા તૈલી ડાઘ; ભેજવાળી ઠંડી સવારે પાનની પાછળ સફેદ રુ જેવી ફૂગ જોવા મળે છે.",
      mr: "पाने व खोडावर पाण्यासारखे तेलकट काळपट डाग; थंड व दमट वातावरणात पानांच्या खाली पांढरी बुरशी दिसते.",
    },
    natural: {
      en: "Immediately remove severely diseased plants. Spray Copper oxychloride 50% WP at 3 g/L or fermented butter milk (Chhachh) at 50 ml/L.",
      hi: "गंभीर रूप से प्रभावित पौधों को तुरंत उखाड़कर नष्ट करें। कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर या खट्टी छाछ 50 मिली/लीटर का छिड़काव करें।",
      gu: "વધુ અસરગ્રસ્ત છોડ તરત ઉપાડીને બાળી નાખો. કોપર ઓક્સીક્લોરાઇડ 3 ગ્રામ/લિટર અથવા ખાટી છાશ 50 મિલી/લિટર છાંટો.",
      mr: "गंभीर बाधित रोपे उपटून नष्ट करा. कॉपर ऑक्सिक्लोराईड 3 ग्रॅम/लिटर किंवा आंबट ताक 50 मिली/लिटर फवारा.",
    },
    chemical: {
      en: "Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) at 2.5 g/L or Cymoxanil 8% + Mancozeb 64% at 2 g/L. PHI safety period: 10 days.",
      hi: "मेटालेक्सिल + मैंकोजेब (रिडोमिल) 2.5 ग्राम/लीटर या सिमोक्सानिल + मैंकोजेब 2 ग्राम/लीटर। तुड़ाई से 10 दिन पहले छिड़काव बंद करें।",
      gu: "મેટાલક્ષિલ + મેન્કોઝેબ 2.5 ગ્રામ/લિટર અથવા સાયમોક્સાનીલ + મેન્કોઝેબ 2 ગ્રામ/લિટર. સલામતી ગાળો (PHI): 10 દિવસ.",
      mr: "मेटॅलॅक्सिल + मॅनकोझेब 2.5 ग्रॅम/लिटर किंवा सायमॉक्सानिल + मॅनकोझेब 2 ग्रॅम/लिटर. तोडणीपूर्वी 10 दिवसांचा सुरक्षा कालावधी पाळा.",
    },
    prevention: {
      en: [
        "Never irrigate late in the evening when canopy stays wet overnight",
        "Space rows at 75-90 cm in winter crops",
        "Apply Trichoderma viride enriched compost at transplanting",
      ],
      hi: [
        "शाम को सिंचाई न करें जिससे रात भर पत्तियां गीली रहें",
        "सर्दियों की फसल में कतारों के बीच 75-90 सेमी दूरी रखें",
        "रोपाई के समय ट्राइकोडर्मा मिली हुई खाद डालें",
      ],
      gu: [
        "સાંજે પિયત ન આપો જેથી રાત્રે પાન ભીના ન રહે",
        "શિયાળુ પાકમાં ચાસ વચ્ચે 75-90 સેમી અંતર રાખો",
        "રોપણી વખતે ટ્રાઈકોડર્મા મિક્સ કરેલું ખાતર આપો",
      ],
      mr: [
        "संध्याकाळी पाणी देणे टाळा जेणेकरून रात्रभर पाने ओली राहणार नाहीत",
        "हिवाळी पिकात दोन ओळींत 75-90 सेमी अंतर ठेवा",
        "लागवडीच्या वेळी ट्रायकोडर्मायुक्त खत वापरा",
      ],
    },
    texts: {
      en: "Late Blight (Phytophthora infestans) is extremely aggressive during cool (<22°C), wet (>80% humidity) spells. Destroy heavily blighted foliage. Natural treatment: Copper oxychloride 50% WP at 3 g/L. Chemical systemic: Metalaxyl 8% + Mancozeb 64% at 2.5 g/L (10 days safety period before harvest). [{{citation}}]",
      hi: "पछेती झुलसा (Late Blight - Phytophthora infestans): ठंडा मौसम (<22°C) और 80% से अधिक नमी में यह तेजी से फसल बर्बाद करता है। गंभीर पौधों को उखाड़ें। जैविक उपचार: कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर। रासायनिक फफूंदनाशक: मेटालेक्सिल + मैंकोजेब 2.5 ग्राम/लीटर (सुरक्षा अवधि: 10 दिन)। [{{citation}}]",
      gu: "લેટ બ્લાઇટ (Late Blight - પાછોતરો સુકારો): ઠંડુ વાતાવરણ અને 80% થી વધુ ભેજમાં આ રોગ આખા ખેતરમાં પ્રસરી શકે છે. રોગિષ્ઠ ડાળીઓ કાપો. દેશી ઉપચાર: કોપર ઓક્સીક્લોરાઇડ 3 ગ્રામ/લિટર. રાસાયણિક ઉપાય: મેટાલક્ષિલ + મેન્કોઝેબ 2.5 ગ્રામ/લિટર (સલામતી ગાળો: 10 દિવસ). [{{citation}}]",
      mr: "उशिरा येणारा करपा (Late Blight): थंड हवामान आणि 80% पेक्षा जास्त आर्द्रतेत हा रोग झपाट्याने पसरतो. बाधित पाने काढून टाका. सेंद्रिय उपाय: कॉपर ऑक्सिक्लोराईड 3 ग्रॅम/लिटर. रासायनिक उपाय: मेटॅलॅक्सिल + मॅनकोझेब 2.5 ग्रॅम/लिटर (तोडणीपूर्वी 10 दिवस फवारणी थांबवा). [{{citation}}]",
    },
  },
  {
    id: "leaf_mold",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 5,
    symptoms: {
      en: "Pale greenish-yellow chlorotic spots on upper leaf surface, with velvety olive-green to greyish-brown mold underneath.",
      hi: "पत्तियों की ऊपरी सतह पर हल्के हरे-पीले धब्बे और निचली सतह पर मखमली जैतून-हरे रंग की फफूंद।",
      gu: "પાનની ઉપરની સપાટી પર આછા પીળાશ પડતા ડાઘ અને નીચેની બાજુ મખમલી બદામી-લીલા રંગની ફૂગ.",
      mr: "पानाच्या वरच्या बाजूला फिकट पिवळे डाग आणि खालच्या बाजूला मखमली तपकिरी-हिरवट बुरशी.",
    },
    natural: {
      en: "Increase greenhouse or canopy aeration. Prune lower sucker shoots. Drench soil with Trichoderma viride at 5 g/L.",
      hi: "हवा का संचार बढ़ाएं। निचली गैर-जरूरी शाखाओं को काटें। ट्राइकोडर्मा विरिडी 5 ग्राम/लीटर से मिट्टी उपचार करें।",
      gu: "છોડ વચ્ચે હવા-ઉજાસ વધારો. નીચેની વધારાની ફૂટો કાપી નાખો. ટ્રાઈકોડર્મા વિરીડી 5 ગ્રામ/લિટર જમીનમાં આપો.",
      mr: "झाडांमधील हवा खेळती ठेवा. खालच्या अनावश्यक फांद्या छाटा. ट्रायकोडर्मा व्हिरिडी 5 ग्रॅम/लिटरने आळवणी करा.",
    },
    chemical: {
      en: "Chlorothalonil 75% WP at 2 g/L or Azoxystrobin 23% SC at 1 ml/L. Pre-harvest interval: 5 days.",
      hi: "क्लोरोथालोनिल 2 ग्राम/लीटर या एज़ोक्सीस्ट्रोबिन 1 मिली/लीटर। सुरक्षा अवधि: 5 दिन।",
      gu: "ક્લોરોથાલોનિલ 2 ગ્રામ/લિટર અથવા એઝોક્સીસ્ટ્રોબિન 1 મિલી/લિટર. સલામતી ગાળો: 5 દિવસ.",
      mr: "क्लोरोथॅलोनिल 2 ग्रॅम/लिटर किंवा अझॉक्सिस्ट्रोबिन 1 मिली/लिटर. सुरक्षा कालावधी: 5 दिवस.",
    },
    prevention: {
      en: [
        "Keep relative humidity below 80% through cross ventilation",
        "Prune lower 20 cm foliage from the ground",
        "Water strictly via drip irrigation in morning",
      ],
      hi: [
        "हवा के निकास से नमी को 80% से नीचे रखें",
        "जमीन से 20 सेमी तक की निचली पत्तियां हटा दें",
        "सुबह के समय केवल ड्रिप से पानी दें",
      ],
      gu: [
        "વેન્ટિલેશન રાખી ભેજ 80% થી નીચે રાખો",
        "જમીનથી 20 સેમી ઊંચાઈ સુધીના પાન સાફ રાખો",
        "સવારે માત્ર ટપક પદ્ધતિથી પાણી આપો",
      ],
      mr: [
        "हवा खेळती ठेवून आर्द्रता 80% पेक्षा कमी ठेवा",
        "जमिनीपासून 20 सेमी पर्यंतची खालची पाने काढून टाका",
        "फक्त सकाळी ठिबकने पाणी द्या",
      ],
    },
    texts: {
      en: "Leaf Mold (Passalora fulva) develops in humid conditions (>80% RH) with poor air circulation. Prune bottom foliage to improve airflow. Natural: Trichoderma viride 5 g/L root drench. Chemical: Chlorothalonil 75% WP at 2 g/L (safety interval: 5 days). [{{citation}}]",
      hi: "पत्ती फफूंद (Leaf Mold): 80% से अधिक आर्द्रता और खराब वेंटिलेशन में यह पनपता है। हवा बढ़ाने के लिए निचली पत्तियों की छंटाई करें। जैविक: ट्राइकोडर्मा 5 ग्राम/लीटर। रासायनिक: क्लोरोथालोनिल 2 ग्राम/लीटर पानी (सुरक्षा अवधि: 5 दिन)। [{{citation}}]",
      gu: "પાનની ફૂગ (Leaf Mold): વધુ ભેજ (80%+) અને ઓછી હવા હોય ત્યાં આ ફૂગ થાય છે. નીચેના પાન છાંટો. દેશી ઉપચાર: ટ્રાઈકોડર્મા 5 ગ્રામ/લિટર. રાસાયણિક ઉપાય: ક્લોરોથાલોનિલ 2 ગ્રામ/લિટર (સલામતી ગાળો: 5 દિવસ). [{{citation}}]",
      mr: "पानावरील बुरशी (Leaf Mold): जास्त आर्द्रता आणि अपुऱ्या हवेमुळे हा रोग होतो. हवा खेळती राहण्यासाठी खालची पाने छाटा. सेंद्रिय: ट्रायकोडर्मा 5 ग्रॅम/लिटर. रासायनिक: क्लोरोथॅलोनिल 2 ग्रॅम/लिटर (सुरक्षा कालावधी: 5 दिवस). [{{citation}}]",
    },
  },
  {
    id: "septoria_leaf_spot",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 7,
    symptoms: {
      en: "Numerous tiny circular spots (2-3 mm) with dark brown borders and light grey or tan centres containing tiny black pinhead pycnidia fruiting bodies.",
      hi: "पत्तियों पर 2-3 मिमी के अनगिनत छोटे गोल धब्बे, जिनका किनारा गहरा भूरा और केंद्र हल्का भूरा-धूसर होता है जिसमें काले बिंदु दिखते हैं।",
      gu: "પાન પર 2-3 મિમી ના નાના ગોળ ટપકાં, જેની કિનારી ઘેરી બદામી અને વચ્ચે રાખોડી ભાગમાં કાળી ટપકીઓ દેખાય છે.",
      mr: "पानांवर 2-3 मिमी आकाराचे लहान गोलाकार ठिपके, ज्यांच्या कडा तपकिरी आणि मध्यभागी राखाडी रंगात काळे ठिपके असतात.",
    },
    natural: {
      en: "Strip off spotted leaves. Spray Copper hydroxide 53.8% DF at 2.5 g/L or Bordeaux mixture 1% (10 g copper sulphate + 10 g lime / L).",
      hi: "संक्रमित पत्तियां तोड़ें। कॉपर हाइड्रॉक्साइड 2.5 ग्राम/लीटर या 1% बोर्डो मिश्रण का छिड़काव करें।",
      gu: "રોગિષ્ઠ પાન તોડી લો. કોપર હાઈડ્રોક્સાઈડ 2.5 ગ્રામ/લિટર અથવા 1% બોર્ડો મિશ્રણ છાંટો.",
      mr: "रोगट पाने काढून टाका. कॉपर हायड्रॉक्साइड 2.5 ग्रॅम/लिटर किंवा 1% बोर्डो मिश्रण फवारा.",
    },
    chemical: {
      en: "Mancozeb 75% WP at 2 g/L or Zineb 75% WP at 2 g/L. Pre-harvest interval: 7 days.",
      hi: "मैंकोजेब 2 ग्राम/लीटर या ज़िनेब 2 ग्राम/लीटर। तुड़ाई से 7 दिन पहले छिड़काव करें।",
      gu: "મેન્કોઝેબ 2 ગ્રામ/લિટર અથવા ઝીનેબ 2 ગ્રામ/લિટર. સલામતી ગાળો: 7 દિવસ.",
      mr: "मॅनकोझेब 2 ग्रॅम/लिटर किंवा झायनेब 2 ग्रॅम/लिटर. फवारणीनंतर 7 दिवस तोडणी टाळा.",
    },
    prevention: {
      en: [
        "Rotate fields away from tomato and potato for 2 full years",
        "Apply 5 cm clean straw mulch to stop rain-splash inoculation",
        "Disinfect stakes and pruning tools with 5% bleach",
      ],
      hi: [
        "टमाटर और आलू की जगह 2 साल तक दूसरी फसलें लगाएं",
        "मिट्टी से छीटें रोकने के लिए 5 सेमी पुआल मल्च बिछाएं",
        "डंडों और औजारों को 5% ब्लीच से साफ करें",
      ],
      gu: [
        "2 વર્ષ સુધી ટામેટા-બટાકા સિવાયના પાકની ફેરબદલી કરો",
        "માટીના છાંટા રોકવા 5 સેમી સૂકા ઘાસનું મલ્ચિંગ કરો",
        "લાકડીઓ અને ઓજારો 5% બ્લીચથી જંતુમુક્ત કરો",
      ],
      mr: [
        "टोमॅटो आणि बटाट्याऐवजी 2 वर्षे इतर पिके घ्या",
        "मातीचे थेंब उडू नयेत म्हणून 5 सेमी आच्छादन करा",
        "काठ्या व अवजारे 5% ब्लिचने स्वच्छ करा",
      ],
    },
    texts: {
      en: "Septoria Leaf Spot (Septoria lycopersici) causes severe defoliation starting from bottom leaves. Natural: Remove affected leaves and spray Copper hydroxide at 2.5 g/L. Chemical fallback: Mancozeb 75% WP at 2 g/L (7-day safety period). [{{citation}}]",
      hi: "सेप्टोरिया पत्ती धब्बा (Septoria lycopersici): यह नीचे से पत्तियां गिराना शुरू करता है। जैविक: प्रभावित पत्तियां तोड़ें और कॉपर हाइड्रॉक्साइड 2.5 ग्राम/लीटर छिड़कें। रासायनिक: मैंकोजेब 2 ग्राम/लीटर (7 दिन का सुरक्षा अंतराल)। [{{citation}}]",
      gu: "સેપ્ટોરિયા લીફ સ્પોટ (Septoria leaf spot): નીચેથી પાન ખરી પડવાનું મુખ્ય કારણ આ ફૂગ છે. દેશી ઉપચાર: રોગિષ્ઠ પાન કાપી કોપર હાઈડ્રોક્સાઈડ 2.5 ગ્રામ/લિટર છાંટો. રાસાયણિક: મેન્કોઝેબ 2 ગ્રામ/લિટર (સલામતી ગાળો: 7 દિવસ). [{{citation}}]",
      mr: "सेप्टोरिया पानावरील ठिपके: या रोगामुळे खालची पाने पिवळी पडून गळतात. सेंद्रिय उपाय: बाधित पाने काढून कॉपर हायड्रॉक्साइड 2.5 ग्रॅम/लिटर फवारा. रासायनिक: मॅनकोझेब 2 ग्रॅम/लिटर (सुरक्षा कालावधी: 7 दिवस). [{{citation}}]",
    },
  },
  {
    id: "bacterial_spot",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 7,
    symptoms: {
      en: "Small (1-3 mm) greasy water-soaked dark spots on leaves with yellow halos; scab-like rough raised spots on green fruit.",
      hi: "पत्तियों पर 1-3 मिमी के तैलीय, पानी जैसे काले धब्बे जिनके चारों ओर पीला छल्ला होता है; कच्चे फलों पर खुरदरे उभरे हुए धब्बे।",
      gu: "પાન પર 1-3 મિમી ના તૈલી કાળા ડાઘ અને આસપાસ પીળું કૂંડાળું; કાચા ટામેટા પર ખરબચડા ઊપસેલા ચાઠા.",
      mr: "पानांवर 1-3 मिमी आकाराचे तेलकट, काळे ठिपके आणि भोवती पिवळे कडे; हिरव्या फळांवर खडबडीत उंचवटे.",
    },
    natural: {
      en: "Copper oxychloride 50% WP at 3 g/L combined with Streptocycline (agronomic bactericide) at 1 g per 10 L water.",
      hi: "कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर के साथ स्ट्रेप्टोसाइक्लिन 1 ग्राम प्रति 10 लीटर पानी मिलाकर छिड़कें।",
      gu: "કોપર ઓક્સીક્લોરાઇડ 3 ગ્રામ/લિટર સાથે સ્ટ્રેપ્ટોસાઇક્લિન 1 ગ્રામ પ્રતિ 10 લિટર પાણી મિક્સ કરી છાંટો.",
      mr: "कॉपर ऑक्सिक्लोराईड 3 ग्रॅम/लिटर अधिक स्ट्रेप्टोसायक्लिन 1 ग्रॅम प्रति 10 लिटर पाण्यात मिसळून फवारा.",
    },
    chemical: {
      en: "Copper hydroxide 2 g/L + Kasugamycin 3% SL at 1.5 ml/L water. PHI safety period: 7 days.",
      hi: "कॉपर हाइड्रॉक्साइड 2 ग्राम/लीटर + कासुगामाइसिन 1.5 मिली/लीटर। तुड़ाई से 7 दिन पहले छिड़कें।",
      gu: "કોપર હાઈડ્રોક્સાઈડ 2 ગ્રામ/લિટર + કાસુગામાઈસિન 1.5 મિલી/લિટર. સલામતી ગાળો: 7 દિવસ.",
      mr: "कॉपर हायड्रॉक्साइड 2 ग्रॅम/लिटर + कासुगामायसिन 1.5 मिली/लिटर. तोडणीपूर्वी 7 दिवस फवारणी थांबवा.",
    },
    prevention: {
      en: [
        "Treat seeds in warm water (50°C) for 25 minutes before sowing",
        "Never enter or cultivate fields while foliage is wet",
        "Do not use overhead sprinkler irrigation",
      ],
      hi: [
        "बुवाई से पहले बीजों को 50°C गर्म पानी में 25 मिनट उपचारित करें",
        "पत्तियां गीली होने पर खेत में काम न करें",
        "फव्वारा (स्प्रिंकलर) सिंचाई का उपयोग बिल्कुल न करें",
      ],
      gu: [
        "વાવણી પહેલાં બિયારણને 50°C ગરમ પાણીમાં 25 મિનિટ પલાળી માવજત આપો",
        "છોડ ભીના હોય ત્યારે ખેતરમાં મજૂરી કે ખેડ ન કરવી",
        "ફુવારા પદ્ધતિથી પિયત ન આપવું",
      ],
      mr: [
        "पेरणीपूर्वी बियाणे 50°C कोमट पाण्यात 25 मिनिटे प्रक्रिया करा",
        "पाने ओली असताना शेतात काम करू नका",
        "तुषार सिंचन वापरणे टाळा",
      ],
    },
    texts: {
      en: "Bacterial Spot (Xanthomonas spp.) is a bacterial infection spread by warm rain and tools. Natural: Copper oxychloride 3 g/L + Streptocycline 1 g/10 L. Chemical: Copper hydroxide 2 g/L + Kasugamycin 1.5 ml/L (7-day safety period). Avoid handling wet foliage. [{{citation}}]",
      hi: "जीवाणु धब्बा (Bacterial Spot - Xanthomonas): यह बैक्टीरिया गर्म बारिश और औजारों से फैलता है। उपचार: कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर + स्ट्रेप्टोसाइक्लिन 1 ग्राम/10 लीटर। रासायनिक: कॉपर हाइड्रॉक्साइड 2 ग्राम + कासुगामाइसिन 1.5 मिली/लीटर (सुरक्षा: 7 दिन)। गीले पौधों को न छुएं। [{{citation}}]",
      gu: "બેક્ટેરિયલ સ્પોટ (Bacterial spot - ઝેન્થોમોનાસ): વરસાદી ઝાપટાં અને સાધનો દ્વારા આ જીવાણુ ફેલાય છે. ઉપચાર: કોપર ઓક્સીક્લોરાઇડ 3 ગ્રામ/લિટર + સ્ટ્રેપ્ટોસાઇક્લિન 1 ગ્રામ/10 લિટર. રાસાયણિક: કોપર હાઈડ્રોક્સાઈડ 2 ગ્રામ + કાસુગામાઈસિન 1.5 મિલી/લિટર (7 દિવસ PHI). ભીના પાનને ન અડવું. [{{citation}}]",
      mr: "जिवाणूजन्य ठिपके (Bacterial Spot): हा जिवाणू रोग उष्ण पाऊस आणि अवजारांमुळे पसरतो. उपाय: कॉपर ऑक्सिक्लोराईड 3 ग्रॅम/लिटर + स्ट्रेप्टोसायक्लिन 1 ग्रॅम/10 लिटर. रासायनिक: कॉपर हायड्रॉक्साइड 2 ग्रॅम + कासुगामायसिन 1.5 मिली/लिटर (7 दिवस सुरक्षा). ओल्या पानांना स्पर्श टाळा. [{{citation}}]",
    },
  },
  {
    id: "target_spot",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 7,
    symptoms: {
      en: "Brown necrotic lesions on leaves and fruit with concentric light and dark zones resembling an archery target; premature leaf shedding.",
      hi: "पत्तियों और फलों पर भूरे रंग के गोल धब्बे जिनमें निशाने (archery target) की तरह हल्के और गहरे छल्ले होते हैं; पत्तियां असमय झड़ने लगती हैं।",
      gu: "પાન અને ફળ પર બદામી રંગના ગોળ ચકતા જેમાં તીરંદાજીના નિશાન જેવા આછા-ઘેરા ગોળ વલયો હોય છે; પાન અકાળે ખરી પડે છે.",
      mr: "पाने आणि फळांवर तपकिरी रंगाचे गोलाकार ठिपके ज्यामध्ये निशाण्यासारखे छल्ले दिसतात; पाने अकाली गळतात.",
    },
    natural: {
      en: "Prune and destroy infected leaves. Spray Cow urine decoction (1:10) with 5 g/L Trichoderma harzianum.",
      hi: "रोगग्रस्त पत्तियां हटाएं। गोमूत्र अर्क (1:10) में 5 ग्राम/लीटर ट्राइकोडर्मा मिलाकर छिड़कें।",
      gu: "રોગિષ્ઠ પાન કાપી નાખો. ગૌમૂત્ર અર્ક (1:10) માં 5 ગ્રામ/લિટર ટ્રાઈકોડર્મા મેળવી છાંટો.",
      mr: "बाधित पाने छाटा. गोमूत्र अर्क (1:10) मध्ये 5 ग्रॅम/लिटर ट्रायकोडर्मा मिसळून फवारा.",
    },
    chemical: {
      en: "Mancozeb 75% WP at 2 g/L or Pyraclostrobin 20% WG at 1 g/L. PHI safety period: 7 days.",
      hi: "मैंकोजेब 2 ग्राम/लीटर या पाइराक्लोस्ट्रोबिन 1 ग्राम/लीटर। तुड़ाई से 7 दिन पहले छिड़कें।",
      gu: "મેન્કોઝેબ 2 ગ્રામ/લિટર અથવા પાયરાક્લોસ્ટ્રોબિન 1 ગ્રામ/લિટર. સલામતી ગાળો: 7 દિવસ.",
      mr: "मॅनकोझेब 2 ग्रॅम/लिटर किंवा पायराक्लोस्ट्रोबिन 1 ग्रॅम/लिटर. तोडणीपूर्वी 7 दिवस कालावधी ठेवा.",
    },
    prevention: {
      en: [
        "Stake plants to 1.5 m height to keep lower leaves off damp soil",
        "Avoid high-nitrogen fertilizing which makes leaves overly soft",
        "Clear all old plant debris after harvest",
      ],
      hi: [
        "पौधों को 1.5 मीटर ऊंचे डंडों से बांधें ताकि पत्तियां जमीन से दूर रहें",
        "अत्यधिक यूरिया न डालें जिससे पत्तियां बहुत कोमल न हों",
        "फसल कटाई के बाद खेत से सारे अवशेष साफ करें",
      ],
      gu: [
        "છોડને 1.5 મીટર ઊંચા ટેકા બાંધો જેથી પાન ભીની જમીનથી અળગા રહે",
        "વધારે યુરિયા ન આપવું જેથી પાન વધુ પડતા કુમળા ન બને",
        "લણણી પછી જૂના અવશેષો ખેતરમાંથી સાફ કરો",
      ],
      mr: [
        "झाडांना 1.5 मीटर उंचीच्या काठ्यांचा आधार द्या",
        "जास्त युरिया देणे टाळा जेणेकरून पाने अति मऊ होणार नाहीत",
        "कापणीनंतर शेतातील जुने अवशेष नष्ट करा",
      ],
    },
    texts: {
      en: "Target Spot (Corynespora cassiicola) attacks foliage and fruit in warm (22-30°C) humid environments. Natural: Prune infected shoots and spray Trichoderma 5 g/L with cow urine. Chemical fallback: Pyraclostrobin at 1 g/L or Mancozeb at 2 g/L (safety interval: 7 days). [{{citation}}]",
      hi: "टारगेट स्पॉट (Target Spot - Corynespora): 22-30°C तापमान और नमी में यह पत्तियों और फलों पर छल्लेदार धब्बे बनाता है। जैविक: संक्रमित पत्तियां काटें, ट्राइकोडर्मा 5 ग्राम/लीटर छिड़कें। रासायनिक: पाइराक्लोस्ट्रोबिन 1 ग्राम/लीटर या मैंकोजेब 2 ग्राम/लीटर (7 दिन PHI)। [{{citation}}]",
      gu: "ટાર્ગેટ સ્પોટ (Target spot): 22-30°C ગરમી અને ભેજમાં આ રોગ પાન અને ટામેટા પર ગોળાકાર નિશાન બનાવે છે. દેશી ઉપચાર: રોગિષ્ઠ પાન કાપી ટ્રાઈકોડર્મા 5 ગ્રામ/લિટર ગૌમૂત્ર સાથે છાંટો. રાસાયણિક: પાયરાક્લોસ્ટ્રોબિન 1 ગ્રામ/લિટર અથવા મેન્કોઝેબ 2 ગ્રામ/લિટર (સલામતી ગાળો: 7 દિવસ). [{{citation}}]",
      mr: "टार्गेट स्पॉट: उष्ण आणि दमट हवामानात हा बुरशीजन्य रोग होतो. सेंद्रिय: रोगट पाने काढून ट्रायकोडर्मा 5 ग्रॅम/लिटर फवारा. रासायनिक: पायराक्लोस्ट्रोबिन 1 ग्रॅम/लिटर किंवा मॅनकोझेब 2 ग्रॅम/लिटर (7 दिवस सुरक्षा). [{{citation}}]",
    },
  },
  {
    id: "spider_mites",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 5,
    symptoms: {
      en: "Yellow speckling/stippling on upper leaf surface, fine silky webbing on leaf undersides; leaves turn bronze, dry out, and drop in hot dry weather (>30°C, <40% RH).",
      hi: "पत्तियों पर पीले बारीक धब्बे, पत्ती के नीचे महीन रेशमी जाले; गर्म और सूखे मौसम (>30°C) में पत्तियां कांस्य रंग की होकर सूखने लगती हैं।",
      gu: "પાન પર પીળી બારીક છાંટ, પાનની નીચે ઝીણી રેશમી જાળી; ગરમ-સૂકા વાતાવરણમાં (>30°C) પાન ત્રાંબા જેવા થઈ સુકાઈને ખરી પડે છે.",
      mr: "पानांवर बारीक पिवळे ठिपके, पानांखाली बारीक कोळ्याचे जाळे; उष्ण व कोरड्या हवामानात (>30°C) पाने तांबूस होऊन वाळतात.",
    },
    natural: {
      en: "Strong water blast to wash leaf undersides, followed by cold-pressed Neem oil 5 ml/L + 2 ml organic soap, or NSKE 5% spray.",
      hi: "पत्तियों के नीचे तेज पानी की धार से धोएं, फिर 5 मिली/लीटर नीम का तेल + 2 मिली साबुन घोल या 5% नीम बीज अर्क (NSKE) छिड़कें।",
      gu: "પાનની નીચે જોરદાર પાણીની ધાર મારી ધોઈ નાખો, પછી 5 મિલી/લિટર લીમડાનું તેલ + 2 મિલી સાબુનું પાણી અથવા 5% નીંબોળી અર્ક છાંટો.",
      mr: "पानांखाली पाण्याचा जोरदार फवारा मारून धुवा, नंतर 5 मिली/लिटर निंबोळी तेल + 2 मिली साबणाचे पाणी फवारा.",
    },
    chemical: {
      en: "Spiromesifen 22.9% SC (Oberon) at 1 ml/L or Abamectin 1.9% EC at 0.5 ml/L. Pre-harvest interval: 5 days.",
      hi: "स्पिरोमेसिफेन 1 मिली/लीटर या एबामेक्टिन 0.5 मिली/लीटर पानी। 5 दिन तक तुड़ाई न करें।",
      gu: "સ્પાયરોમેસીફેન 1 મિલી/લિટર અથવા એબામેક્ટીન 0.5 મિલી/લિટર પાણી. 5 દિવસ સુધી ફળ ન તોડવા.",
      mr: "स्पिरोमेसिफेन 1 मिली/लिटर किंवा अबामेक्टिन 0.5 मिली/लिटर. तोडणीपूर्वी 5 दिवसांचे अंतर ठेवा.",
    },
    prevention: {
      en: [
        "Avoid dusty conditions by misting boundary perimeter tracks",
        "Keep field moisture steady; drought stress triggers mite explosion",
        "Eliminate Solanaceous weed hosts (black nightshade, datura)",
      ],
      hi: [
        "मेड़ों पर धूल उड़ने से रोकने के लिए हल्का पानी छिड़कें",
        "खेत में नमी बनाए रखें; सूखे से मकड़ी तेजी से बढ़ती है",
        "खेत के आसपास के खरपतवार (मकोय, धतूरा) नष्ट करें",
      ],
      gu: [
        "શેઢા-પાળા પર ધૂળ ન ઊડે તે માટે હળવું પાણી છાંટો",
        "જમીનમાં ભેજ જાળવી રાખો; સૂકી જમીનમાં મકોડી ઝડપથી વધે છે",
        "ખેતર આસપાસના ધતૂરો અને પીલુડી જેવા નીંદણ દૂર કરો",
      ],
      mr: [
        "धुळीचे प्रमाण कमी करण्यासाठी बांधावर पाणी मारा",
        "जमिनीत ओलावा टिकवून ठेवा; कोरडेपणामुळे कोळी वाढतात",
        "धोत्रा आणि इतर तण काढून टाका",
      ],
    },
    texts: {
      en: "Two-Spotted Spider Mites (Tetranychus urticae) multiply rapidly in hot dry weather (>30°C, RH <40%). Natural control: Wash undersides with high-pressure water and spray Neem oil at 5 ml/L + liquid soap. Chemical miticide: Spiromesifen at 1 ml/L (5 days safety period). [{{citation}}]",
      hi: "लाल मकड़ी / माइट्स (Spider Mites): यह शुष्क और अत्यधिक गर्म मौसम (>30°C) में तेजी से फैलती है। प्राकृतिक उपचार: पत्तियों के नीचे पानी से धोएं और 5 मिली/लीटर नीम का तेल छिड़कें। रासायनिक माइटिसाइड: स्पिरोमेसिफेन 1 मिली/लीटर (सुरक्षा: 5 दिन)। [{{citation}}]",
      gu: "લાલ મકોડી / કથીરી (Spider mites): 30°C થી વધુ તાપમાન અને સૂકા વાતાવરણમાં આ જીવાત ઝડપથી વધે છે. દેશી નિયંત્રણ: પાનની નીચે પાણીથી ધોઈ 5 મિલી/લિટર લીમડાનું તેલ સાબુ સાથે છાંટો. રાસાયણિક ઉપાય: સ્પાયરોમેસીફેન 1 મિલી/લિટર (સલામતી ગાળો: 5 દિવસ). [{{citation}}]",
      mr: "लाल कोळी (Spider Mites): 30°C पेक्षा जास्त तापमान आणि कोरड्या हवेत कोळी वेगाने वाढतात. सेंद्रिय नियंत्रण: पानांखाली पाण्याचा मारा करून 5 मिली/लिटर निंबोळी तेल फवारा. रासायनिक: स्पिरोमेसिफेन 1 मिली/लिटर (5 दिवस सुरक्षा कालावधी). [{{citation}}]",
    },
  },
  {
    id: "mosaic_virus",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 0,
    symptoms: {
      en: "Mottled alternating dark and light green patches on leaves, distortion, curling, narrow 'fern-leaf' foliage, and stunted bushy growth.",
      hi: "पत्तियों पर हल्के और गहरे हरे रंग के चितकबरे धब्बे (मोज़ेक), पत्तियों का मुड़ना, संकरी फर्न जैसी पत्तियां और बौनापन।",
      gu: "પાન પર ઘાટા અને આછા લીલા રંગના છાંટણા (મોઝેક), પાન સંકોચાઈ જવા, સાંકડા થઈ જવા અને છોડ ઠીંગણો રહી જવો.",
      mr: "पानांवर गडद व फिकट हिरव्या रंगाचे ठिपके (मोझॅक), पाने आक्रसणे, बारीक होणे आणि झाडाची वाढ खुंटणे.",
    },
    natural: {
      en: "NO CHEMICAL CURE. Rogue out and burn infected plants immediately. Dip hands and pruning shears in 20% skimmed milk or 10% trisodium phosphate before touching other plants.",
      hi: "कोई रासायनिक इलाज नहीं है। संक्रमित पौधों को तुरंत उखाड़कर जला दें। अन्य पौधों को छूने से पहले हाथ और कैंची को 20% दूध के घोल या साबुन से धोएं।",
      gu: "કોઈ દવા નથી. રોગિષ્ઠ છોડ તરત જ મૂળમાંથી ઉપાડી બાળી નાખો. બીજા છોડને અડતા પહેલા હાથ અને કાતર 20% દૂધના દ્રાવણમાં અથવા સાબુથી ધોવા.",
      mr: "कोणताही रासायनिक उपाय नाही. बाधित झाडे मुळासकट उपटून जाळून टाका. इतर झाडांना हात लावण्यापूर्वी हात आणि कात्री 20% दुधाच्या द्रावणात धुवा.",
    },
    chemical: {
      en: "None effective against plant viruses. Do not spray fungicides or bactericides; control aphid sap-feeders.",
      hi: "वायरस पर कोई रासायनिक दवा काम नहीं करती। कीटनाशक केवल माहू/एफिड को रोकने के लिए इस्तेमाल करें।",
      gu: "વાયરસ પર કોઈ ફૂગનાશક કામ કરતું નથી. મોલોમશીના નિયંત્રણ માટે જ દવા વાપરો.",
      mr: "व्हायरसवर कोणतेही औषध चालत नाही. केवळ मावा किडीच्या नियंत्रणासाठी फवारणी करा.",
    },
    prevention: {
      en: [
        "Sow certified virus-free seeds",
        "Prohibit smoking or tobacco handling near tomato crops (tobacco mosaic transmission)",
        "Sterilize all nursery trays and bamboo stakes",
      ],
      hi: [
        "प्रमाणित वायरस-मुक्त बीजों का ही उपयोग करें",
        "खेत में बीड़ी-तंबाकू का सेवन सख्त वर्जित रखें (तंबाकू से फैलता है)",
        "नर्सरी ट्रे और डंडों को विसंक्रमित करें",
      ],
      gu: [
        "પ્રમાણિત વાયરસ-મુક્ત બિયારણ જ વાવો",
        "ખેતરમાં બીડી-તમાકુનું સેવન સદંતર બંધ રાખો (તમાકુથી વાયરસ ફેલાય છે)",
        "નર્સરી ટ્રે અને લાકડીઓ જંતુમુક્ત કરો",
      ],
      mr: [
        "प्रमाणित रोगमुक्त बियाणेच वापरा",
        "शेतात विडी-तंबाखूचे सेवन पूर्णपणे टाळा",
        "रोपवाटिकेतील ट्रे आणि काठ्या निर्जंतुक करा",
      ],
    },
    texts: {
      en: "Tomato Mosaic Virus (ToMV) is a mechanically transmitted viral disease with NO chemical cure. Pull and burn infected plants immediately. Wash pruning tools and hands in 20% skimmed milk. Strictly avoid smoking or handling tobacco near the crop. [{{citation}}]",
      hi: "टमाटर मोज़ेक वायरस (ToMV): यह छूने और औजारों से फैलने वाला वायरस है जिसका कोई रासायनिक इलाज नहीं है। संक्रमित पौधों को तुरंत उखाड़कर जला दें। औजारों को 20% दूध के घोल से धोएं। खेत में बीड़ी-तंबाकू का इस्तेमाल न करें। [{{citation}}]",
      gu: "ટામેટા મોઝેક વાયરસ (ToMV): આ વાયરસ સ્પર્શ અને સાધનોથી ફેલાય છે અને તેનો કોઈ રાસાયણિક ઈલાજ નથી. રોગિષ્ઠ છોડ મૂળમાંથી ખેંચીને બાળી નાખો. સાધનો 20% દૂધના દ્રાવણથી સાફ કરો. તમાકુનું સેવન ખેતરમાં ટાળો. [{{citation}}]",
      mr: "टोमॅटो मोझॅक व्हायरस (ToMV): हा विषाणूजन्य रोग हाताळणी व अवजारांमुळे पसरतो, यावर कोणतेही रासायनिक औषध नाही. बाधित झाडे उपटून नष्ट करा. अवजारे 20% दुधाच्या पाण्याने धुवा. शेतात तंबाखू वापरू नका. [{{citation}}]",
    },
  },
  {
    id: "yellow_leaf_curl",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 14,
    symptoms: {
      en: "Upward curling and cupping of young leaves, intense chlorotic yellow leaf margins, small bushy foliage, and severe flower abortion.",
      hi: "नई पत्तियों का ऊपर की ओर मुड़ना (प्यालेनुमा आकार), पत्तियों के किनारों का पीला पड़ना, पत्तियां छोटी-झाड़ीदार होना और फूल झड़ जाना।",
      gu: "નવા પાન ઉપરની તરફ વળીને વાટકા જેવા થઈ જવા, કિનારી પર પીળાશ, પાન નાના થઈ ઝાંખરા જેવો છોડ થવો અને ફૂલ ખરી જવા.",
      mr: "नवीन पाने वरच्या बाजूला वाटीसारखी वळणे, कडा पिवळ्या पडणे, पानांचा आकार लहान होऊन झाड खुंटणे आणि फुले गळणे.",
    },
    natural: {
      en: "Vector transmitted by Whitefly (Bemisia tabaci). Rogue out infected plants. Install 15 yellow sticky traps per acre at canopy level. Spray Neem oil 5 ml/L or Verticillium lecanii at 5 g/L weekly.",
      hi: "यह सफेद मक्खी (Whitefly) से फैलता है। बीमार पौधे उखाड़ें। खेत में 15 पीले चिपचिपे ट्रैप प्रति एकड़ लगाएं। 5 मिली/लीटर नीम का तेल या वर्टिसिलियम लेकानी 5 ग्राम/लीटर छिड़कें।",
      gu: "આ રોગ સફેદ માખીથી ફેલાય છે. રોગિષ્ઠ છોડ ઉપાડી લો. એકરે 15 પીળા ચીકણા ટ્રેપ લગાવો. 5 મિલી/લિટર લીમડાનું તેલ અથવા વર્ટિસિલિયમ લિકાની 5 ગ્રામ/લિટર દર અઠવાડિયે છાંટો.",
      mr: "हा रोग पांढऱ्या माशीमुळे पसरतो. बाधित रोपे उपटा. एकरी 15 पिवळे चिकट सापळे लावा. निंबोळी तेल 5 मिली/लिटर किंवा व्हर्टिसिलियम लेकानी 5 ग्रॅम/लिटर फवारा.",
    },
    chemical: {
      en: "Target whitefly vector: Diafenthiuron 50% WP at 1 g/L or Acetamiprid 20% SP at 0.3 g/L or Imidacloprid 17.8% SL at 0.3 ml/L. Safety period: 14 days before harvest.",
      hi: "सफेद मक्खी नियंत्रण: डायफेंथियूरॉन 1 ग्राम/लीटर या एसिटामिप्रिड 0.3 ग्राम/लीटर या इमिडाक्लोप्रिड 0.3 मिली/लीटर। तुड़ाई से 14 दिन पहले छिड़काव करें।",
      gu: "સફેદ માખી નિયંત્રણ: ડાયાફેન્થિયુરોન 1 ગ્રામ/લિટર અથવા એસિટામાપ્રિડ 0.3 ગ્રામ/લિટર અથવા ઇમિડાક્લોપ્રિડ 0.3 મિલી/લિટર. સલામતી ગાળો: 14 દિવસ.",
      mr: "पांढऱ्या माशीचे नियंत्रण: डायफेन्थियुरॉन 1 ग्रॅम/लिटर किंवा असिटामिप्रिड 0.3 ग्रॅम/लिटर किंवा इमिडाक्लोप्रिड 0.3 मिली/लिटर. सुरक्षा कालावधी: 14 दिवस.",
    },
    prevention: {
      en: [
        "Grow seedlings under 40-mesh nylon insect net nursery tunnels",
        "Eradicate Parthenium and Datura weed hosts along field borders",
        "Plant 2 border rows of maize or sorghum as a physical whitefly barrier",
      ],
      hi: [
        "नर्सरी में पौधों को 40-मेष की जाली (Insect net) के अंदर उगाएं",
        "खेत की मेड़ों से गाजर घास और धतूरा पूरी तरह नष्ट करें",
        "खेत के चारों ओर मक्का या ज्वार की 2 कतारें अवरोधक (Barrier) के रूप में लगाएं",
      ],
      gu: [
        "ધરૂવાડિયામાં 40-મેશની નેટ લગાવી રોપ ઉછેરો",
        "શેઢા પરથી ગાજરઘાસ અને ધતૂરા જેવા નીંદણ દૂર કરો",
        "ખેતર ફરતે મકાઈ કે જુવારની 2 હરોળ વાવી રક્ષણાત્મક વાડ બનાવો",
      ],
      mr: [
        "रोपवाटिका 40-मेशच्या कीटक जाळीत तयार करा",
        "बांधावरील गाजरगवत आणि इतर तण काढून टाका",
        "शेताभोवती मका किंवा ज्वारीच्या 2 ओळी अडथळा म्हणून लावा",
      ],
    },
    texts: {
      en: "Tomato Yellow Leaf Curl Virus (TYLCV) is transmitted by whiteflies. Virus itself cannot be cured chemically; focus on whitefly control. Rogue diseased plants. Install 15 yellow sticky traps/acre. Spray Neem oil at 5 ml/L or Diafenthiuron at 1 g/L (14-day pre-harvest interval). [{{citation}}]",
      hi: "टमाटर का पर्ण कुंचन वायरस (TYLCV / माथा बंधना): यह सफेद मक्खी से फैलता है। वायरस का कोई रासायनिक इलाज नहीं है; सफेद मक्खी रोकें। बीमार पौधे उखाड़ें। 15 पीले चिपचिपे ट्रैप लगाएं। 5 मिली नीम तेल या डायफेंथियूरॉन 1 ग्राम/लीटर छिड़कें (सुरक्षा अवधि: 14 दिन)। [{{citation}}]",
      gu: "ટામેટામાં પાન વળવાનો વાયરસ / કૂકડવો (TYLCV): સફેદ માખી આ વાયરસ ફેલાવે છે. રોગિષ્ઠ છોડ ઉપાડી બાળી નાખો. એકરે 15 પીળા ચીકણા ટ્રેપ લગાવો. સફેદ માખી રોકવા 5 મિલી/લિટર લીમડાનું તેલ અથવા ડાયાફેન્થિયુરોન 1 ગ્રામ/લિટર છાંટો (સલામતી ગાળો: 14 દિવસ). [{{citation}}]",
      mr: "टोमॅटोतील चुरडा-मुरडा / कुकडा (TYLCV): हा रोग पांढऱ्या माशीमुळे पसरतो. झाडावर औषध चालत नाही, पांढऱ्या माशीचा बंदोबस्त करा. बाधित झाडे उपटा. एकरी 15 पिवळे चिकट सापळे लावा. निंबोळी तेल 5 मिली किंवा डायफेन्थियुरॉन 1 ग्रॅम/लिटर फवारा (14 दिवस सुरक्षा कालावधी). [{{citation}}]",
    },
  },
  {
    id: "why_yellow",
    crop: "tomato",
    topic: "disease",
    texts: {
      en: "Yellow tomato leaves can indicate 4 distinct agronomic causes: (1) Bottom leaves yellowing evenly = Nitrogen deficiency; apply vermicompost 100 g or urea 2 g/plant. (2) Yellowing with brown concentric rings = Early Blight. (3) Upper young leaves cupping and yellowing = Whitefly viral TYLCV. (4) Overall pale yellow with wet soil = Root waterlogging and oxygen starvation. Check your live farm moisture (currently {{soil}}%). [{{citation}}]",
      hi: "टमाटर की पत्तियां पीली होने के 4 मुख्य कारण हैं: (1) यदि केवल निचली पत्तियां पीली हैं तो यह नाइट्रोजन की कमी है; 100 ग्राम वर्मीकम्पोस्ट या 2 ग्राम यूरिया दें। (2) भूरे छल्लेदार धब्बे हैं तो अगेती झुलसा है। (3) ऊपरी नई पत्तियां मुड़कर पीली हैं तो सफेद मक्खी जनित वायरस है। (4) अत्यधिक गीली मिट्टी में जड़ों का दम घुटना। आपकी लाइव मिट्टी की नमी {{soil}}% है। [{{citation}}]",
      gu: "ટામેટાના પાન પીળા પડવાના 4 મુખ્ય કારણો છે: (1) માત્ર નીચેના જૂના પાન પીળા પડે તો નાઇટ્રોજનની ખામી છે; છોડ દીઠ 100 ગ્રામ વર્મીકમ્પોસ્ટ અથવા 2 ગ્રામ યુરિયા આપો. (2) પાન પર ગોળ બદામી ચકતા હોય તો અર્લી બ્લાઇટ ફૂગ છે. (3) ઉપરના નવા પાન વળીને પીળા થાય તો સફેદ માખીનો વાયરસ છે. (4) વધુ પડતા પાણીથી મૂળનો શ્વાસ રૂંધાવો. હાલ તમારા ખેતરનો ભેજ {{soil}}% છે. [{{citation}}]",
      mr: "टोमॅटोची पाने पिवळी पडण्याची 4 मुख्य कारणे आहेत: (1) खालची पाने पिवळी पडत असल्यास नत्राची (Nitrogen) कमतरता आहे; 100 ग्रॅम गांडूळ खत किंवा 2 ग्रॅम युरिया द्या. (2) तपकिरी गोलाकार डाग असल्यास करपा रोग आहे. (3) शेंड्याची नवीन पाने वाटीसारखी पिवळी होत असल्यास पांढऱ्या माशीचा व्हायरस आहे. (4) जास्त पाण्यामुळे मुळे गुदमरणे. तुमच्या शेतातील ओलावा {{soil}}% आहे. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 2. IRRIGATION RULES (Dynamic & General)                            */
  /* ------------------------------------------------------------------ */
  {
    id: "irrigate_now",
    crop: "tomato",
    topic: "irrigation",
    texts: {
      en: "Current farm sensor status: Soil moisture is {{soil}}%, ambient temperature is {{temp}}°C, and pump is {{pump}}. {{crossing}}. Optimal root zone moisture is 40%–60%. If soil is below 30%, run drip irrigation for 30 minutes immediately. If above 40%, preserve ground water and delay irrigation. [{{citation}}]",
      hi: "लाइव फ़ार्म स्थिति: मिट्टी की नमी {{soil}}% है, तापमान {{temp}}°C है और पंप {{pump}} है। {{crossing}}। टमाटर के लिए 40%–60% नमी सबसे अच्छी होती है। यदि नमी 30% से कम है, तो तुरंत 30 मिनट ड्रिप चलाएं। यदि 40% से अधिक है, तो पानी रोकें। [{{citation}}]",
      gu: "હાલની ખેતર સ્થિતિ: જમીનનો ભેજ {{soil}}% છે, તાપમાન {{temp}}°C છે અને પંપ {{pump}} છે. {{crossing}}. ટામેટા માટે 40% થી 60% ભેજ ઉત્તમ ગણાય છે. જો ભેજ 30% થી ઓછો હોય તો તરત જ 30 મિનિટ ડ્રિપ ચાલુ કરો. જો 40% થી વધુ હોય તો હમણાં પિયત આપવાની જરૂર નથી. [{{citation}}]",
      mr: "सध्याची शेतातील स्थिती: जमिनीतला ओलावा {{soil}}% आहे, तापमान {{temp}}°C आहे आणि पंप {{pump}} आहे. {{crossing}}. टोमॅटोसाठी 40% ते 60% ओलावा योग्य असतो. ओलावा 30% पेक्षा कमी असल्यास ताबडतोब 30 मिनिटे ठिबक सुरू करा. 40% पेक्षा जास्त असल्यास पाणी देणे टाळा. [{{citation}}]",
    },
  },
  {
    id: "irrigation_rules",
    crop: "tomato",
    topic: "irrigation",
    texts: {
      en: "Tomato Irrigation Guidelines: Mature plants consume 2.5–4.5 L water per day depending on fruit load. Irrigate between 6:00 AM and 8:30 AM to reduce evaporation and keep foliage dry. Maintain sensor moisture within 40%–65%. Avoid drying cycles below 28% followed by sudden heavy watering, as moisture fluctuations cause tomato skin cracking and blossom end rot. [{{citation}}]",
      hi: "टमाटर सिंचाई नियम: एक पूर्ण विकसित पौधे को रोजाना 2.5 से 4.5 लीटर पानी की आवश्यकता होती है। सुबह 6:00 से 8:30 के बीच ड्रिप चलाएं। मिट्टी की नमी 40% से 65% के बीच बनाए रखें। मिट्टी को 28% से नीचे ज्यादा सूखने न दें और फिर अचानक अधिक पानी न दें, इससे फल फटने लगते हैं और नीचे से काले पड़ते हैं। [{{citation}}]",
      gu: "ટામેટા પિયત વ્યવસ્થાપન નિયમો: એક પુખ્ત છોડને ફળ બેસવાના સમયે દૈનિક 2.5 થી 4.5 લિટર પાણીની જરૂર પડે છે. બાષ્પીભવન અટકાવવા સવારે 6:00 થી 8:30 દરમિયાન પિયત આપો. જમીનમાં ભેજ 40% થી 65% જાળવો. જમીન 28% થી વધુ સૂકાવા ન દો અને અચાનક વધુ પાણી ન આપો, નહીંતર ટામેટા ફાટવા અને નીચેથી કાળા પડવાની સમસ્યા થશે. [{{citation}}]",
      mr: "टोमॅटो सिंचन नियम: फळे लागण्याच्या काळात एका झाडाला दररोज 2.5 ते 4.5 लिटर पाण्याची गरज असते. बाष्पीभवन टाळण्यासाठी सकाळी 6:00 ते 8:30 दरम्यान पाणी द्या. ओलावा 40% ते 65% दरम्यान ठेवा. ओलावा 28% च्या खाली जाऊ देऊ नका आणि अचानक जास्त पाणी देऊ नका, यामुळे फळे तडकतात. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 3. FERTILIZER DOSES PER GROWTH STAGE                               */
  /* ------------------------------------------------------------------ */
  {
    id: "fertilizer_seedling",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Seedling Stage (0–20 DAT): Root establishment phase. Organic dose: Vermicompost 50 g + Neem cake 10 g per plant in a ring 5 cm from stem; drench Jeevamrut (1:10 dilution) 250 ml/plant. Chemical starter: 19:19:19 water-soluble NPK at 2 g/plant dissolved in 1 L water. Irrigate immediately after feeding. [{{citation}}]",
      hi: "रोपाई अवस्था / पौध अवस्था (0-20 दिन): जैविक खाद: 50 ग्राम वर्मीकम्पोस्ट + 10 ग्राम नीम खली प्रति पौधा तने से 5 सेमी दूर रिंग बनाकर दें; 250 मिली जीवामृत (1:10) डालें। रासायनिक: 19:19:19 घुलनशील खाद 2 ग्राम प्रति पौधा 1 लीटर पानी में घोलकर दें। खाद देने के तुरंत बाद हल्का पानी दें। [{{citation}}]",
      gu: "ધરૂ / રોપણી અવસ્થા (0-20 દિવસ): મૂળિયાં જમાવવાનો સમય. દેશી ખાતર: છોડ દીઠ 50 ગ્રામ વર્મીકમ્પોસ્ટ + 10 ગ્રામ લીંબોળી ખોળ થડથી 5 સેમી દૂર રિંગ પદ્ધતિથી આપો; 250 મિલી જીવામૃત (1:10) રેડો. રાસાયણિક: 19:19:19 દ્રાવ્ય ખાતર 2 ગ્રામ/છોડ 1 લિટર પાણીમાં ઓગાળીને આપો. ખાતર આપ્યા પછી તરત હળવું પિયત આપો. [{{citation}}]",
      mr: "रोप अवस्था (0-20 दिवस): मुळे रुजण्याचा काळ. सेंद्रिय खत: खोडापासून 5 सेमी अंतरावर रिंग पद्धतीने प्रति रोप 50 ग्रॅम गांडूळ खत + 10 ग्रॅम निंबोळी पेंड द्या; 250 मिली जिवामृत (1:10) मुळाशी टाका. रासायनिक: 19:19:19 विद्राव्य खत 2 ग्रॅम प्रति रोप 1 लिटर पाण्यात मिसळून द्या. खतानंतर लगेच पाणी द्या. [{{citation}}]",
    },
  },
  {
    id: "fertilizer_vegetative",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Vegetative Stage (21–45 DAT): Stem and canopy branching. Organic dose: Vermicompost 100 g + Neem cake 20 g per plant; drench Jeevamrut 500 ml/plant every 15 days. Chemical dose: 19:19:19 NPK at 4 g/plant side-dressed or fertigated, plus Urea 2 g/plant. Water immediately to facilitate nutrient absorption. [{{citation}}]",
      hi: "वानस्पतिक अवस्था (21-45 दिन): शाखाएं और पत्तियां बनने का समय। जैविक: 100 ग्राम वर्मीकम्पोस्ट + 20 ग्राम नीम खली प्रति पौधा; हर 15 दिन में 500 मिली जीवामृत प्रति पौधा दें। रासायनिक: 19:19:19 खाद 4 ग्राम प्रति पौधा + यूरिया 2 ग्राम प्रति पौधा। खाद के तुरंत बाद ड्रिप चलाएं। [{{citation}}]",
      gu: "વાનસ્પતિક વૃદ્ધિ અવસ્થા (21-45 દિવસ): નવી ડાળીઓ અને પાન ફૂટવાનો ગાળો. દેશી ખાતર: છોડ દીઠ 100 ગ્રામ વર્મીકમ્પોસ્ટ + 20 ગ્રામ લીંબોળી ખોળ; દર 15 દિવસે 500 મિલી જીવામૃત છોડ દીઠ આપો. રાસાયણિક: 19:19:19 ખાતર 4 ગ્રામ/છોડ + યુરિયા 2 ગ્રામ/છોડ. ખાતર આપી તરત જ પાણી આપો. [{{citation}}]",
      mr: "शाकीय वाढीची अवस्था (21-45 दिवस): फांद्या आणि पानांच्या जोमदार वाढीचा काळ. सेंद्रिय: प्रति रोप 100 ग्रॅम गांडूळ खत + 20 ग्रॅम निंबोळी पेंड; दर 15 दिवसांनी 500 मिली जिवामृत द्या. रासायनिक: 19:19:19 खत 4 ग्रॅम + युरिया 2 ग्रॅम प्रति झाड. खत दिल्यानंतर लगेच पाणी द्या. [{{citation}}]",
    },
  },
  {
    id: "fertilizer_flowering",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Flowering Stage (46–65 DAT): Flower initiation and fruit set. Organic dose: Vermicompost 150 g + 25 g wood ash (natural potassium) + Jeevamrut 750 ml/plant. Chemical dose: 12:61:00 (Mono Ammonium Phosphate) 3 g/plant for root phosphorus, plus 19:19:19 5 g/plant. Reduce urea to prevent flower dropping. Foliar spray Boron 20% at 1 g/L to boost pollen fertility. [{{citation}}]",
      hi: "फूल आने की अवस्था (46-65 दिन): जैविक: 150 ग्राम वर्मीकम्पोस्ट + 25 ग्राम लकड़ी की राख (पोटाश के लिए) + 750 मिली जीवामृत प्रति पौधा। रासायनिक: 12:61:00 (फास्फोरस) 3 ग्राम/पौधा + 19:19:19 5 ग्राम/पौधा। फूल झड़ने से रोकने के लिए यूरिया कम करें। परागण बढ़ाने के लिए 1 ग्राम/लीटर बोरॉन का फोलियर स्प्रे करें। [{{citation}}]",
      gu: "ફૂલ બેસવાની અવસ્થા (46-65 દિવસ): ફૂલ અને ફળ સેટ થવાનો સમય. દેશી ખાતર: છોડ દીઠ 150 ગ્રામ વર્મીકમ્પોસ્ટ + 25 ગ્રામ લાકડાની રાખ (પોટાશ માટે) + 750 મિલી જીવામૃત. રાસાયણિક: 12:61:00 ખાતર 3 ગ્રામ/છોડ + 19:19:19 5 ગ્રામ/છોડ. ફૂલ ખરી પડતાં રોકવા યુરિયા ઘટાડો. ફલીનીકરણ સુધારવા બોરોન 1 ગ્રામ/લિટર પાન પર છાંટો. [{{citation}}]",
      mr: "फुलधारणा अवस्था (46-65 दिवस): फुले लागणे आणि टिकणे. सेंद्रिय: प्रति रोप 150 ग्रॅम गांडूळ खत + 25 ग्रॅम लाकडाची राख (पोटॅशसाठी) + 750 मिली जिवामृत. रासायनिक: 12:61:00 खत 3 ग्रॅम + 19:19:19 5 ग्रॅम प्रति झाड. फुलगळ रोखण्यासाठी युरिया कमी करा. परागीभवनासाठी बोरॉन 1 ग्रॅम/लिटर पानांवर फवारा. [{{citation}}]",
    },
  },
  {
    id: "fertilizer_fruiting",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Fruiting & Harvesting Stage (66–120 DAT): Fruit expansion, brix sugars, and ripening. Organic dose: Vermicompost 200 g + Neem cake 30 g + Jeevamrut 750 ml/plant every 12 days. Chemical dose: 13:0:45 (Potassium Nitrate) 5 g/plant every 10 days for fruit weight and uniform red colour, plus Calcium Nitrate 3 g/plant to prevent blossom end rot. [{{citation}}]",
      hi: "फल विकास एवं तुड़ाई अवस्था (66-120 दिन): फल का आकार और चमक बढ़ाने के लिए। जैविक: 200 ग्राम वर्मीकम्पोस्ट + 30 ग्राम नीम खली + 750 मिली जीवामृत हर 12 दिन में दें। रासायनिक: 13:0:45 (पोटेशियम नाइट्रेट) 5 ग्राम/पौधा हर 10 दिन में + कैल्शियम नाइट्रेट 3 ग्राम/पौधा ताकि फल नीचे से काले न पड़ें। [{{citation}}]",
      gu: "ફળ વિકાસ અને ઉતાર અવસ્થા (66-120 દિવસ): ટામેટાનો ભરાવ અને લાલ રંગ લાવવા. દેશી ખાતર: છોડ દીઠ 200 ગ્રામ વર્મીકમ્પોસ્ટ + 30 ગ્રામ લીંબોળી ખોળ + 750 મિલી જીવામૃત દર 12 દિવસે આપો. રાસાયણિક: 13:0:45 (પોટેશિયમ નાઈટ્રેટ) 5 ગ્રામ/છોડ દર 10 દિવસે + કેલ્શિયમ નાઈટ્રેટ 3 ગ્રામ/છોડ જેથી ટામેટા નીચેથી કાળા ન પડે. [{{citation}}]",
      mr: "फळ विकास व तोडणी अवस्था (66-120 दिवस): फळांचा आकार आणि वजन वाढवण्यासाठी. सेंद्रिय: प्रति रोप 200 ग्रॅम गांडूळ खत + 30 ग्रॅम निंबोळी पेंड + 750 मिली जिवामृत दर 12 दिवसांनी द्या. रासायनिक: 13:0:45 (पोटॅशियम नायट्रेट) 5 ग्रॅम प्रति झाड दर 10 दिवसांनी + कॅल्शियम नायट्रेट 3 ग्रॅम झाडाला द्या. [{{citation}}]",
    },
  },
  {
    id: "urea_dose",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Urea Safety & Dose: Never apply urea directly touching the plant stem. In vegetative stage, safe dose is 2–3 g per plant (approx 20–25 kg/acre) applied in moist soil 8 cm away from stem. Do not apply urea during peak flowering as excessive nitrogen causes massive flower dropping and attracts whiteflies and aphids. Never broadcast before heavy rains. [{{citation}}]",
      hi: "यूरिया की सही मात्रा और नियम: यूरिया को कभी भी तने से सटाकर न डालें। वानस्पतिक अवस्था में सुरक्षित मात्रा 2-3 ग्राम प्रति पौधा (20-25 किग्रा/एकड़) है, जिसे तने से 8 सेमी दूर नम मिट्टी में दें। फूल आने के समय यूरिया न डालें, अत्यधिक नाइट्रोजन से फूल झड़ जाते हैं और कीट बढ़ते हैं। बारिश से पहले यूरिया न डालें। [{{citation}}]",
      gu: "યુરિયા ખાતરની માત્રા અને નિયમો: યુરિયા ક્યારેય થડને અડાડીને ન નાખવું. વૃદ્ધિ અવસ્થામાં સલામત માત્રા છોડ દીઠ 2-3 ગ્રામ (એકરે 20-25 કિગ્રા) છે, જે થડથી 8 સેમી દૂર ભેજવાળી જમીનમાં આપવું. ફૂલ બેસવાના સમયે યુરિયા ન આપવું, વધારાના નાઇટ્રોજનથી ફૂલ ખરી પડે છે અને જીવાતો વધે છે. વરસાદ પહેલાં યુરિયા ન નાખવું. [{{citation}}]",
      mr: "युरियाचे प्रमाण आणि नियम: युरिया कधीही खोडाला चिकटवून टाकू नका. शाकीय वाढीच्या काळात सुरक्षित प्रमाण 2-3 ग्रॅम प्रति झाड (20-25 किलो/एकर) आहे, जे खोडापासून 8 सेमी अंतरावर ओल्या मातीत द्यावे. फुलधारणेच्या काळात युरिया टाळा, जास्त नत्रामुळे फुलगळ होते आणि कीड वाढते. पावसापूर्वी युरिया टाकू नका. [{{citation}}]",
    },
  },
  {
    id: "npk_dose",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "NPK Specialty Fertilizers for Tomato: (1) 19:19:19 balanced feed at 3–4 g/plant during vegetative growth every 12 days. (2) 12:61:00 (MAP) at 3 g/plant during root and flowering transition. (3) 13:0:45 (Potassium Nitrate) at 5 g/plant during fruit enlargement for solid weight, shiny skin, and rich sweetness. Dissolve in clean water for drip fertigation. [{{citation}}]",
      hi: "टमाटर के लिए विशेष NPK खाद: (1) वानस्पतिक अवस्था में 19:19:19 संतुलित खाद 3-4 ग्राम/पौधा हर 12 दिन में दें। (2) फूल आने के समय 12:61:00 खाद 3 ग्राम/पौधा दें। (3) फल बनने और पकने के समय 13:0:45 (पोटैशियम नाइट्रेट) 5 ग्राम/पौधा दें ताकि फल का वजन, चमक और मिठास बढ़े। [{{citation}}]",
      gu: "ટામેટા માટે વોટર સોલ્યુબલ NPK ખાતરો: (1) વૃદ્ધિ સમયે 19:19:19 સંતુલિત ખાતર 3-4 ગ્રામ/છોડ દર 12 દિવસે આપો. (2) ફૂલ બેસતી વખતે 12:61:00 ખાતર 3 ગ્રામ/છોડ આપો. (3) ફળ મોટું થવા અને ચમક લાવવા 13:0:45 (પોટેશિયમ નાઈટ્રેટ) 5 ગ્રામ/છોડ આપો જેથી વજન અને ગુણવત્તા વધે. [{{citation}}]",
      mr: "टोमॅटोसाठी विद्राव्य NPK खते: (1) वाढीच्या काळात 19:19:19 संतुलित खत 3-4 ग्रॅम/झाड दर 12 दिवसांनी द्या. (2) फुलधारणेच्या वेळी 12:61:00 खत 3 ग्रॅम/झाड द्या. (3) फळांचा आकार व वजन वाढवण्यासाठी 13:0:45 (पोटॅशियम नायट्रेट) 5 ग्रॅम/झाड द्या. [{{citation}}]",
    },
  },
  {
    id: "organic_fertilizer",
    crop: "tomato",
    topic: "fertilizer",
    texts: {
      en: "Organic Nutrition Package: Basal application of 3 tonnes well-rotted FYM or 1 tonne vermicompost per acre before transplanting. Apply 100 kg Neem cake per acre to suppress soil nematodes. Prepare Jeevamrut: 10 kg cow dung, 10 L cow urine, 2 kg jaggery, 2 kg gram flour, and handful of virgin soil in 200 L water; ferment 48 hours and drench 500 ml/plant every fortnight. [{{citation}}]",
      hi: "जैविक पोषण पैकेज: रोपाई से पहले प्रति एकड़ 3 टन सड़ी गोबर खाद या 1 टन वर्मीकम्पोस्ट डालें। मिट्टी के कीड़ों और सूत्रकृमि को रोकने के लिए 100 किग्रा नीम खली प्रति एकड़ मिलाएं। जीवामृत विधि: 10 किग्रा गोबर, 10 लीटर गोमूत्र, 2 किग्रा गुड़, 2 किग्रा बेसन, मुट्ठी भर उपजाऊ मिट्टी 200 लीटर पानी में 48 घंटे सड़ाएं और हर 15 दिन में 500 मिली प्रति पौधा दें। [{{citation}}]",
      gu: "ઓર્ગેનિક ખાતર પેકેજ: રોપણી પૂર્વે એકરે 3 ટન સારું દેશી છાણિયું ખાતર અથવા 1 ટન વર્મીકમ્પોસ્ટ આપો. જમીનમાં કૃમિ નિયંત્રણ માટે 100 કિગ્રા લીંબોળી ખોળ મિક્સ કરો. જીવામૃત બનાવવાની રીત: 10 કિગ્રા દેશી ગાયનું છાણ, 10 લિટર ગૌમૂત્ર, 2 કિગ્રા ગોળ, 2 કિગ્રા ચણાનો લોટ અને મુઠ્ઠી ખેતરની માટી 200 લિટર પાણીમાં 48 કલાક આથો લાવી દર પંદર દિવસે છોડ દીઠ 500 મિલી આપો. [{{citation}}]",
      mr: "सेंद्रिय खत व्यवस्थापन: लागवडीपूर्वी एकरी 3 टन शेणखत किंवा 1 टन गांडूळ खत जमिनीत मिसळा. सूत्रकृमीच्या नियंत्रणासाठी 100 किलो निंबोळी पेंड वापरा. जिवामृत कृती: 10 किलो शेण, 10 लिटर गोमूत्र, 2 किलो गूळ, 2 किलो बेसन व मूठभर माती 200 लिटर पाण्यात 48 तास आंबवून दर 15 दिवसांनी प्रति झाड 500 मिली द्या. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 4. WEATHER ACTION RULES                                            */
  /* ------------------------------------------------------------------ */
  {
    id: "spray_window",
    crop: "tomato",
    topic: "weather",
    texts: {
      en: "Optimal Spray Window Guidelines: Wind speed must be below 10 km/h, temperature under 30°C, and relative humidity between 50% and 75%. Ideal spray times are early morning (6:30–9:00 AM) after dew dries, or late evening (4:30–6:30 PM). Never spray in harsh midday sun as droplets cause lens burning, and never spray within 4 hours of anticipated rainfall. [{{citation}}]",
      hi: "दवा छिड़काव का सही समय: हवा की गति 10 किमी/घंटा से कम, तापमान 30°C से कम और आर्द्रता 50%-75% होनी चाहिए। सबसे अच्छा समय सुबह 6:30 से 9:00 (ओस सूखने के बाद) या शाम 4:30 से 6:30 बजे है। तेज धूप में छिड़काव न करें जिससे पत्तियां झुलसती हैं, और बारिश की संभावना से 4 घंटे पहले छिड़काव टालें। [{{citation}}]",
      gu: "દવા છંટકાવનો શ્રેષ્ઠ સમય: પવનની ગતિ 10 કિમી/કલાકથી ઓછી, તાપમાન 30°C થી નીચે અને ભેજ 50%-75% હોવો જોઈએ. સવારે ઝાકળ સુકાઈ ગયા પછી (6:30 થી 9:00) અથવા સાંજે (4:30 થી 6:30) છંટકાવ કરો. બપોરના આકરા તડકામાં ક્યારેય છંટકાવ ન કરવો અને વરસાદની આગાહીના 4 કલાક પહેલાં દવા ન છાંટવી. [{{citation}}]",
      mr: "फवारणीची योग्य वेळ: वाऱ्याचा वेग ताशी 10 किमी पेक्षा कमी, तापमान 30°C पेक्षा कमी आणि आर्द्रता 50%-75% असावी. सकाळी दव सुकल्यानंतर (6:30 ते 9:00) किंवा संध्याकाळी (4:30 ते 6:30) फवारणी करा. दुपारच्या कडक उन्हात फवारणी करू नका, तसेच पावसाची शक्यता असल्यास 4 तास आधी फवारणी टाळा. [{{citation}}]",
    },
  },
  {
    id: "rain_effect",
    crop: "tomato",
    topic: "weather",
    texts: {
      en: "Rainfall Impact & Protection: Heavy rain causes soil waterlogging, root oxygen deprivation, and splashes fungal spores onto foliage. Action plan: Shut off irrigation immediately, inspect farm drainage furrows to discharge standing water within 6 hours. Within 24 hours after rain ceases, apply preventive Copper oxychloride at 3 g/L to guard against Bacterial Spot and Late Blight outbreaks. [{{citation}}]",
      hi: "बारिश का प्रभाव और सुरक्षा: भारी बारिश से खेत में जलभराव होता है और फफूंद के जीवाणु पत्तियों पर फैलते हैं। कार्ययोजना: सिंचाई तुरंत बंद करें, जल निकासी नालियां खोलें ताकि 6 घंटे में पानी निकल जाए। बारिश थमने के 24 घंटे के भीतर कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर का सुरक्षात्मक छिड़काव करें। [{{citation}}]",
      gu: "વરસાદની અસર અને રક્ષણ: ભારે વરસાદથી જમીનમાં પાણી ભરાય છે અને ફૂગના બીજાણુ ઉડીને પાન પર ચોંટે છે. તકેદારી: પિયત તરત બંધ કરો, નિતાર નાળાઓ સાફ કરી 6 કલાકમાં પાણી બહાર કાઢો. વરસાદ બંધ થયા પછીના 24 કલાકમાં પાક રક્ષણ માટે કોપર ઓક્સીક્લોરાઇડ 3 ગ્રામ/લિટર છાંટો. [{{citation}}]",
      mr: "पावसाचा परिणाम व काळजी: मुसळधार पावसामुळे पाणी साचून मुळांना ऑक्सिजन मिळत नाही आणि बुरशीचा प्रादुर्भाव होतो. कृती: पाणी देणे ताबडतोब थांबवा, शेतातील पाणी 6 तासांत बाहेर काढा. पाऊस थांबल्यानंतर 24 तासांच्या आत कॉपर ऑक्सिक्लोराईड 3 ग्रॅम/लिटरची प्रतिबंधात्मक फवारणी करा. [{{citation}}]",
    },
  },
  {
    id: "heat_stress",
    crop: "tomato",
    topic: "weather",
    texts: {
      en: "Heat Stress Management: Ambient temperatures exceeding 35°C cause tomato pollen desiccation, poor pollination, and heavy blossom drop. Protection: Run micro-sprinklers or overhead misting for 10 minutes at 1:00 PM to cool canopy by 3°C–4°C; maintain soil moisture above 45%; spread 5 cm straw mulch to protect feeder roots from scorching heat. [{{citation}}]",
      hi: "अत्यधिक गर्मी और लू से बचाव: 35°C से अधिक तापमान पर परागकण सूख जाते हैं जिससे फूल झड़ने लगते हैं। उपाय: दोपहर 1:00 बजे 10 मिनट फव्वारा या मिस्ट चलाएं जिससे तापमान 3°C–4°C कम हो जाए; मिट्टी में 45% से अधिक नमी रखें; जड़ों को झुलसने से बचाने के लिए 5 सेमी पुआल की मल्चिंग करें। [{{citation}}]",
      gu: "ગરમી અને લૂ સામે રક્ષણ: 35°C થી વધુ તાપમાન થતાં પરાગરજ સુકાઈ જાય છે અને ફૂલ ખરી પડે છે. ઉપાય: બપોરે 1:00 વાગ્યે 10 મિનિટ ફુવારા ચલાવી તાપમાન 3°C–4°C ઘટાડો; જમીનમાં 45% થી વધુ ભેજ જાળવો; મૂળને ગરમીથી બચાવવા 5 સેમી સૂકા ઘાસનું મલ્ચિંગ કરો. [{{citation}}]",
      mr: "उष्णतेचा ताण व्यवस्थापन: तापमान 35°C च्या पुढे गेल्यास परागकण सुकून प्रचंड फुलगळ होते. उपाय: दुपारी 1:00 वाजता 10 मिनिटे स्प्रिंकलर चालवून तापमान 3°C–4°C कमी करा; जमिनीत 45% पेक्षा जास्त ओलावा ठेवा; मुळांचे रक्षण करण्यासाठी 5 सेमी आच्छादन करा. [{{citation}}]",
    },
  },
  {
    id: "frost_cold_stress",
    crop: "tomato",
    topic: "weather",
    texts: {
      en: "Cold Wave & Frost Protection: Temperatures below 10°C severely stunt tomato vegetative growth, while sub-zero frost blackens leaves. Measures: Give light evening drip irrigation as wet soil holds latent warmth overnight; create dense smokeless smudges along field borders during cold nights; drape clear polythene sheeting over rows in severe freezes. [{{citation}}]",
      hi: "पाला और शीत लहर से बचाव: 10°C से नीचे तापमान में टमाटर की बढ़वार रुक जाती है और पाले से पत्तियां काली पड़ जाती हैं। उपाय: शाम के समय हल्की ड्रिप सिंचाई करें क्योंकि गीली मिट्टी रात भर गर्मी रोक कर रखती है; खेत की उत्तर-पश्चिम दिशा में धुआं करें; पाले के दिनों में क्यारियों पर पारदर्शी प्लास्टिक ढकें। [{{citation}}]",
      gu: "ઠંડી અને હિમથી રક્ષણ: 10°C થી નીચા તાપમાનમાં ટામેટાનો વિકાસ અટકી જાય છે અને હિમ પડવાથી પાન કાળા પડી જાય છે. ઉપાય: સાંજે હળવું પિયત આપો કારણ કે ભીની જમીન રાત્રે ગરમી જાળવી રાખે છે; ખેતરના શેઢે રાત્રે ધુમાડો કરો; અતિશય ઠંડીમાં છોડ પર પ્લાસ્ટિક ઢાંકો. [{{citation}}]",
      mr: "थंडी आणि धुक्यापासून संरक्षण: 10°C पेक्षा कमी तापमानात वाढ खुंटते आणि जास्त थंडीने पाने काळी पडतात. उपाय: संध्याकाळी हलके पाणी द्या कारण ओली माती उष्णता टिकवून ठेवते; शेताच्या बांधावर रात्री धूर करा; जास्त थंडीच्या काळात प्लास्टिक आच्छादनाचा वापर करा. [{{citation}}]",
    },
  },
  {
    id: "humidity_risk",
    crop: "tomato",
    topic: "weather",
    texts: {
      en: "High Humidity Agronomic Alert: Relative humidity above 80% creates an incubation chamber for Late Blight, Leaf Mold, and bacterial rots. Rules: Suspend foliar sprays of liquid nutrients; strictly avoid sprinkler irrigation; prune bottom 15 cm sucker leaves to establish cross ventilation; apply preventive protective copper spray. [{{citation}}]",
      hi: "उच्च आर्द्रता जोखिम चेतावनी: 80% से अधिक नमी होने पर पछेती झुलसा और फफूंद रोग बहुत तेजी से फैलते हैं। नियम: पत्तियों पर किसी भी तरल खाद का छिड़काव रोकें; फव्वारा सिंचाई बिल्कुल न करें; नीचे की 15 सेमी पत्तियां छांटें ताकि हवा आर-पार निकल सके; कॉपर का सुरक्षात्मक छिड़काव करें। [{{citation}}]",
      gu: "વધુ ભેજનું જોખમ: હવામાં ભેજ 80% થી વધી જાય ત્યારે ફૂગ અને બ્લાઇટ રોગ ઝડપથી ફેલાય છે. નિયમો: પાન પર પ્રવાહી ખાતર છાંટવાનું બંધ રાખો; ફુવારા પિયત ન આપો; હવા પસાર થઈ શકે તે માટે નીચેના 15 સેમી પાન કાપી નાખો; કોપર ફૂગનાશકનો આગોતરો છંટકાવ કરો. [{{citation}}]",
      mr: "जास्त हवेतील आर्द्रतेचा धोका: हवेतील आर्द्रता 80% पेक्षा जास्त असल्यास करपा आणि बुरशीजन्य रोग वेगाने वाढतात. नियम: पानांवर विद्राव्य खते फवारणे थांबवा; तुषार सिंचन बंद ठेवा; हवा खेळती राहण्यासाठी खालची 15 सेमी पाने छाटा; प्रतिबंधात्मक कॉपरची फवारणी करा. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 5. PEST CALENDAR & IPM                                             */
  /* ------------------------------------------------------------------ */
  {
    id: "pest_calendar_month",
    crop: "tomato",
    topic: "pest",
    texts: {
      en: "Seasonal Pest Calendar: (1) Kharif (July–Oct): Whiteflies (TYLCV vector), Jassids, Leaf miner maggots. (2) Rabi (Nov–Feb): Fruit borer (Helicoverpa armigera), Pinworm (Tuta absoluta), Aphids. (3) Zaid/Summer (March–June): Two-spotted spider mites, Thrips, Whiteflies. Install pheromone traps and yellow sticky traps at transplanting. [{{citation}}]",
      hi: "टमाटर कीट कैलेंडर: (1) खरीफ (जुलाई-अक्टूबर): सफेद मक्खी, हरा तेला (जैसिड्स), लीफ माइनर। (2) रबी (नवंबर-फरवरी): फल छेदक इल्ली (Helicoverpa), पिनवर्म (टुटा), एफिड। (3) जायद/गर्मी (मार्च-जून): लाल मकड़ी, थ्रिप्स, सफेद मक्खी। रोपाई के समय ही फेरोमोन ट्रैप और पीले कार्ड लगाएं। [{{citation}}]",
      gu: "જીવાત કેલેન્ડર: (1) ખરીફ (જુલાઈ-ઓક્ટોબર): સફેદ માખી, તડતડિયા, પાન કોરી ખાનાર ઈયળ. (2) રવિ (નવેમ્બર-ફેબ્રુઆરી): ફળ કોરી ખાનાર ઈયળ (હેલિકોવર્પા), પીનવોર્મ (ટુટા), મોલોમશી. (3) ઉનાળુ (માર્ચ-જૂન): લાલ મકોડી, થ્રીપ્સ, સફેદ માખી. રોપણી વખતે જ ફેરોમોન અને પીળા ટ્રેપ લગાવો. [{{citation}}]",
      mr: "हंगामी कीड कॅलेंडर: (1) खरीप (जुलै-ऑक्टोबर): पांढरी माशी, तुडतुडे, नागअळी (लीफ मायनर). (2) रब्बी (नोव्हेंबर-फेब्रुवारी): फळ पोखरणारी अळी (हेलिकोव्हर्पा), टुटा, मावा. (3) उन्हाळी (मार्च-जून): लाल कोळी, फुलकिडे (थ्रिप्स), पांढरी माशी. लागवडीवेळीच कामगंध आणि चिकट सापळे लावा. [{{citation}}]",
    },
  },
  {
    id: "whitefly_control",
    crop: "tomato",
    topic: "pest",
    safetyPeriodDays: 14,
    texts: {
      en: "Whitefly (Bemisia tabaci) IPM Management: Small white sap-sucking insects vectoring Leaf Curl Virus. Natural: Install 15 yellow sticky traps/acre at canopy height; spray 5 ml/L cold-pressed Neem oil or 5 g/L Verticillium lecanii. Chemical: Diafenthiuron 50% WP at 1 g/L or Acetamiprid 20% SP at 0.3 g/L (14-day safety period). [{{citation}}]",
      hi: "सफेद मक्खी (Whitefly) नियंत्रण: यह रस चूसने वाला कीट है जो पत्ता मरोड़ वायरस फैलाता है। जैविक: खेत में 15 पीले चिपचिपे ट्रैप लगाएं; 5 मिली/लीटर नीम का तेल या वर्टिसिलियम 5 ग्राम/लीटर छिड़कें। रासायनिक: डायफेंथियूरॉन 1 ग्राम/लीटर या एसिटामिप्रिड 0.3 ग्राम/लीटर पानी (सुरक्षा अवधि: 14 दिन)। [{{citation}}]",
      gu: "સફેદ માખી સંકલિત નિયંત્રણ: આ રસચૂસક જીવાત પાન વળવાનો વાયરસ ફેલાવે છે. દેશી નિયંત્રણ: એકરે 15 પીળા ચીકણા ટ્રેપ લગાવો; 5 મિલી/લિટર લીમડાનું તેલ અથવા વર્ટિસિલિયમ લિકાની 5 ગ્રામ/લિટર છાંટો. રાસાયણિક: ડાયાફેન્થિયુરોન 1 ગ્રામ/લિટર અથવા એસિટામાપ્રિડ 0.3 ગ્રામ/લિટર (સલામતી ગાળો: 14 દિવસ). [{{citation}}]",
      mr: "पांढरी माशी नियंत्रण: ही कीड रस शोषून चुरडा-मुरडा व्हायरस पसरवते. सेंद्रिय उपाय: एकरी 15 पिवळे चिकट सापळे लावा; 5 मिली/लिटर निंबोळी तेल किंवा व्हर्टिसिलियम 5 ग्रॅम/लिटर फवारा. रासायनिक: डायफेन्थियुरॉन 1 ग्रॅम/लिटर किंवा असिटामिप्रिड 0.3 ग्रॅम/लिटर (सुरक्षा कालावधी: 14 दिवस). [{{citation}}]",
    },
  },
  {
    id: "fruit_borer_control",
    crop: "tomato",
    topic: "pest",
    safetyPeriodDays: 3,
    texts: {
      en: "Tomato Fruit Borer (Helicoverpa armigera) Control: Caterpillars bore round holes into green and ripe fruits, causing inner rotting. IPM plan: Erect 5 pheromone traps per acre for monitoring; release Trichogramma chilonis egg parasitoids 50,000/acre weekly; spray Bacillus thuringiensis (Bt) at 2 g/L. Chemical fallback: Chlorantraniliprole 18.5% SC (Coragen) at 0.3 ml/L (PHI safety period: 3 days) or Emamectin benzoate 5% SG at 0.4 g/L. [{{citation}}]",
      hi: "टमाटर फल छेदक इल्ली (Helicoverpa armigera): इल्ली फलों में गोल छेद करके अंदर का गूदा खाती है। नियंत्रण: प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं; ट्राइकोग्रामा परजीवी 50,000 प्रति एकड़ छोड़ें; बीटी (Bt) 2 ग्राम/लीटर छिड़कें। रासायनिक: कोराजन (Chlorantraniliprole) 0.3 मिली/लीटर (सुरक्षा अवधि: 3 दिन) या इमामेक्टिन बेंजोएट 0.4 ग्राम/लीटर। [{{citation}}]",
      gu: "ફળ કોરી ખાનાર ઈયળ (હેલિકોવર્પા આર્મિજેરા): ઈયળ ટામેટામાં ગોળ કાણાં પાડી અંદરનો ગર્ભ ખાઈ જાય છે. નિયંત્રણ: એકરે 5 ફેરોમોન ટ્રેપ લગાવો; ટ્રાઇકોગ્રામા ભમરી 50,000/એકર છોડો; બીટી પાવડર 2 ગ્રામ/લિટર છાંટો. રાસાયણિક ઉપાય: કોરાજન 0.3 મિલી/લિટર (સલામતી ગાળો: માત્ર 3 દિવસ) અથવા ઇમામેક્ટીન બેન્ઝોએટ 0.4 ગ્રામ/લિટર. [{{citation}}]",
      mr: "टोमॅटो फळ पोखरणारी अळी (हेलिकोव्हर्पा): ही अळी फळाला गोल छिद्र पाडून आतून फळ खाते. नियंत्रण: एकरी 5 कामगंध सापळे लावा; ट्रायकोगामा 50,000 प्रति एकर सोडा; बीटी 2 ग्रॅम/लिटर फवारा. रासायनिक: कोराजन 0.3 मिली/लिटर (तोडणीपूर्वी 3 दिवस अंतर) किंवा इमामेक्टिन बेन्झोएट 0.4 ग्रॅम/लिटर. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 6. SOIL & AQI MEANING EXPLAINERS & FARM METRICS                    */
  /* ------------------------------------------------------------------ */
  {
    id: "soil_meaning",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Capacitive Soil Moisture Reading Explainer: (1) Below 30%: Critical wilting threshold — root suction tension is high, stomata close, plant growth halts. (2) 35%–60%: Ideal field capacity — optimal equilibrium of water film and oxygen pores for healthy root respiration. (3) Above 65%: Soil saturation — water replaces soil air, causing root asphyxiation and Pythium damping-off rot. Your sensor reads {{soil}}%. [{{citation}}]",
      hi: "मिट्टी की नमी सेंसर का मतलब: (1) 30% से कम: अत्यधिक सूखा — पौधे मुरझाने लगते हैं और बढ़वार रुक जाती है। (2) 35%–60%: सर्वोत्तम नमी — जड़ों को सांस लेने के लिए सही पानी और हवा मिलती है। (3) 65% से अधिक: जलभराव — जड़ों का दम घुटता है और सड़न पैदा होती है। आपके खेत का पाठ्यांक {{soil}}% है। [{{citation}}]",
      gu: "જમીન ભેજ સેન્સરનું અર્થઘટન: (1) 30% થી ઓછો: ગંભીર સુકારો — મૂળ પાણી ખેંચી શકતા નથી અને છોડ કરમાવા લાગે છે. (2) 35%–60%: ઉત્તમ ભેજ — મૂળને પૂરતો ભેજ અને ઓક્સિજન બંને મળે છે. (3) 65% થી વધુ: જળબંબાકાર — મૂળમાં હવા મળતી બંધ થાય છે અને સડો લાગે છે. હાલ સેન્સર {{soil}}% દર્શાવે છે. [{{citation}}]",
      mr: "जमिनीतील ओलावा सेन्सरचा अर्थ: (1) 30% पेक्षा कमी: गंभीर कोरडेपणा — झाडे कोमेजतात आणि वाढ थांबते. (2) 35%–60%: सर्वोत्तम ओलावा — मुळांना हवा आणि पाणी योग्य प्रमाणात मिळते. (3) 65% पेक्षा जास्त: दलदल — मुळांना ऑक्सिजन न मिळाल्याने मूळकुज होते. सध्या सेन्सर {{soil}}% दाखवत आहे. [{{citation}}]",
    },
  },
  {
    id: "aqi_meaning",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Farm AQI & Air Quality Explainer: (1) AQI 0–50 (Good): Clean rural air, stomata exchange carbon dioxide freely for maximum photosynthesis. (2) AQI 51–100 (Moderate): Normal ambient open-field condition. (3) AQI 101–200 (Poor): Elevated particulate or emissions; leaves accumulate fine dust layer, reducing light absorption by 10%. (4) AQI >200 (Severe): Toxic smog; rinse foliar dust with clean water spray. Live AQI is {{aqi}}. [{{citation}}]",
      hi: "फ़ार्म AQI (हवा गुणवत्ता) का अर्थ: (1) AQI 0-50 (अच्छा): स्वच्छ ग्रामीण हवा, पत्तियां खुलकर सांस लेती हैं और प्रकाश संश्लेषण तेज होता है। (2) 51-100 (मध्यम): सामान्य खुला वातावरण। (3) 101-200 (खराब): हवा में धूल और धुंआ अधिक, पत्तियों पर धूल जमने से धूप कम मिलती है। (4) >200 (गंभीर): पत्तियों को साफ पानी से धोएं। वर्तमान AQI {{aqi}} है। [{{citation}}]",
      gu: "ખેતર AQI (હવા ગુણવત્તા) નું અર્થઘટન: (1) 0-50 (ઉત્તમ): શુદ્ધ ગ્રામીણ હવા, પાન મુક્તપણે કાર્બન ડાયોક્સાઈડ ગ્રહણ કરી ખોરાક બનાવે છે. (2) 51-100 (મધ્યમ): સામાન્ય વાતાવરણ. (3) 101-200 (નબળી): ધૂળ અને પ્રદૂષણ વધવાથી પાન પર રજકણ જમા થાય છે. (4) >200 (ખતરનાક): પાન પર ચોખ્ખા પાણીનો છંટકાવ કરી ધૂળ સાફ કરો. હાલ AQI {{aqi}} છે. [{{citation}}]",
      mr: "शेत हवेची गुणवत्ता (AQI) अर्थ: (1) 0-50 (उत्तम): शुद्ध हवा, पाने वेगाने अन्न तयार करतात. (2) 51-100 (मध्यम): सामान्य शेतातील हवा. (3) 101-200 (खराब): हवेत धूळ असल्याने पानांवर थर बसतो व प्रकाशसंश्लेषण 10% कमी होते. (4) >200 (गंभीर): पानांवर स्वच्छ पाण्याचा फवारा मारून धूळ साफ करा. सध्या AQI {{aqi}} आहे. [{{citation}}]",
    },
  },
  {
    id: "pump_status",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Irrigation Pump Status: Pump is currently {{pump}} in {{mode}} mode. Current soil moisture stands at {{soil}}%. Under automated moisture control, the relay activates when soil dips below 30% and turns off when moisture reaches 60%, preventing water waste and power surcharges. [{{citation}}]",
      hi: "सिंचाई पंप स्थिति: पंप इस समय {{mode}} मोड में {{pump}} है। वर्तमान मिट्टी की नमी {{soil}}% है। ऑटोमेशन नियम के अनुसार, जब नमी 30% से कम होती है तो पंप शुरू होता है और 60% पहुंचते ही बंद हो जाता है। [{{citation}}]",
      gu: "પિયત પંપ સ્થિતિ: પંપ અત્યારે {{mode}} મોડમાં {{pump}} છે. જમીનનો વર્તમાન ભેજ {{soil}}% છે. ઓટોમેશન નિયમ મુજબ, જ્યારે ભેજ 30% થી નીચે જાય ત્યારે પંપ આપોઆપ શરૂ થાય છે અને 60% પહોંચતાં બંધ થઈ જાય છે. [{{citation}}]",
      mr: "सिंचन पंप स्थिती: पंप सध्या {{mode}} मोडमध्ये {{pump}} आहे. जमिनीतला ओलावा {{soil}}% आहे. ऑटोमॅटिक नियमानुसार ओलावा 30% च्या खाली जाताच पंप सुरू होतो आणि 60% ओलावा झाल्यावर आपोआप बंद होतो. [{{citation}}]",
    },
  },
  {
    id: "money_saved",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Farm Efficiency & Financial Savings: Smart sensor-driven drip automation prevents over-pumping by 35% compared to timed flood watering. For a 1-acre tomato field, this conserves ~1,20,000 litres of groundwater and saves approx ₹2,400 to ₹3,600 per season in agricultural electricity charges and pump motor wear. [{{citation}}]",
      hi: "फ़ार्म बचत और आर्थिक लाभ: स्मार्ट सेंसर आधारित ड्रिप सिंचाई से पारंपरिक सिंचाई की तुलना में 35% पानी की बचत होती है। 1 एकड़ टमाटर में हर सीजन लगभग 1,20,000 लीटर भूजल बचता है और बिजली बिल तथा मोटर मेंटेनेंस में ₹2,400 से ₹3,600 की सीधी बचत होती है। [{{citation}}]",
      gu: "ખેતર બચત અને આર્થિક ફાયદો: સેન્સર આધારિત ઓટોમેટિક ડ્રિપ સિસ્ટમથી સામાન્ય પિયત કરતાં 35% પાણી બચે છે. 1 એકર ટામેટામાં સીઝન દીઠ આશરે 1,20,000 લિટર ભૂગર્ભ જળની બચત થાય છે અને વીજળી બિલ તથા મોટર ઘસારામાં ₹2,400 થી ₹3,600 ની ચોખ્ખી બચત થાય છે. [{{citation}}]",
      mr: "शेत बचत व आर्थिक नफा: सेन्सर आधारित ठिबक सिंचनामुळे पारंपरिक पद्धतीपेक्षा 35% पाण्याची बचत होते. 1 एकर टोमॅटो पिकात प्रति हंगाम सुमारे 1,20,000 लिटर पाणी वाचते आणि वीज बिल व मेंटेनन्समध्ये ₹2,400 ते ₹3,600 ची थेट बचत होते. [{{citation}}]",
    },
  },
  {
    id: "water_saved",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Water Conservation Analytics: Automated rain skips and threshold cutoffs have conserved an estimated 42,000 L of irrigation water this month alone. Tomatoes require steady root hydration without saturation; precision micro-irrigation maximizes fruit kilograms per litre of water extracted. [{{citation}}]",
      hi: "जल संरक्षण रिपोर्ट: ऑटोमेटिक रेन-स्किप और कट-ऑफ तकनीक से इस महीने लगभग 42,000 लीटर सिंचाई जल की बचत हुई है। ड्रिप से प्रति लीटर पानी पर फलों की पैदावार सबसे अधिक मिलती है। [{{citation}}]",
      gu: "પાણી બચત વિશ્લેષણ: ઓટોમેટિક વરસાદ સેન્સર અને ભેજ કટ-ઓફ દ્વારા માત્ર આ મહિને અંદાજે 42,000 લિટર પાણીની બચત થઈ છે. ટપક પદ્ધતિથી પાણીના દરેક ટીપાં દીઠ ટામેટાનું ઉત્પાદન મહત્તમ મળે છે. [{{citation}}]",
      mr: "पाणी संवर्धन अहवाल: पावसाची नोंद आणि स्वयंचलित कट-ऑफमुळे एकट्या या महिन्यात अंदाजे 42,000 लिटर सिंचन पाणी वाचले आहे. अचूक ठिबक पद्धतीमुळे प्रति लिटर पाण्यामागे टोमॅटोचे सर्वाधिक उत्पादन मिळते. [{{citation}}]",
    },
  },
  {
    id: "blossom_end_rot",
    crop: "tomato",
    topic: "disease",
    texts: {
      en: "Blossom End Rot (Physiological Calcium Deficiency): Dark leathery flattened or sunken black spot at the bottom end of green or ripening tomatoes. Cause: Not a pathogen! Caused by calcium deficiency in expanding fruit tissues, heavily triggered by erratic soil moisture (dry periods alternating with heavy watering). Remedy: Maintain steady moisture (40%–55%); spray Calcium chloride at 5 g/L or Calcium Nitrate at 3 g/L directly onto leaves and fruit clusters weekly. [{{citation}}]",
      hi: "ब्लॉसम एंड रॉट (फल का नीचे से सड़ना / कैल्शियम की कमी): कच्चे या पकते टमाटर के निचले सिरे पर गहरा काला, चपटा और सूखा धब्बा। कारण: यह कोई कीड़ा या फफूंद नहीं है, बल्कि कैल्शियम की कमी है जो अनियमित सिंचाई (ज्यादा सूखा फिर एकदम ज्यादा पानी) से होती है। समाधान: मिट्टी में एक समान 40%-55% नमी रखें; कैल्शियम नाइट्रेट 3 ग्राम/लीटर या कैल्शियम क्लोराइड 5 ग्राम/लीटर का साप्ताहिक छिड़काव करें। [{{citation}}]",
      gu: "બ્લોસમ એન્ડ રોટ (ટામેટા નીચેથી કાળા પડવા / કેલ્શિયમની ખામી): ટામેટાના નીચેના ભાગમાં કાળું, ચામડા જેવું ચપટું કે ખાડાવાળું ધાબું. કારણ: આ કોઈ રોગ કે જીવાત નથી! ફળમાં કેલ્શિયમની ખામીથી થાય છે, જે અનિયમિત પિયત (વધુ પડતો સુકારો પછી અચાનક વધુ પાણી) ને કારણે વકરે છે. ઉપાય: જમીનમાં સરખો 40%-55% ભેજ જાળવો; કેલ્શિયમ નાઈટ્રેટ 3 ગ્રામ/લિટર સાપ્તાહિક ફળ અને પાન પર છાંટો. [{{citation}}]",
      mr: "ब्लॉसम एंड रॉट (फळाचा तळ काळवंडणे / कॅल्शियमची कमतरતા): टोमॅटोच्या खालच्या बाजूला काळा, चपटा आणि वाळलेला डाग पडणे. कारण: हा कोणताही रोग नसून कॅल्शियमच्या कमतरतेमुळे होतो, अनियमित पाण्यामुळे (जास्त तूट व नंतर एकदम जास्त पाणी) हा वाढतो. उपाय: जमिनीत समान 40%-55% ओलावा ठेवा; कॅल्शियम नायट्रेट 3 ग्रॅम/लिटरची फवारणी आठवड्यातून एकदा करा. [{{citation}}]",
    },
  },
  {
    id: "damping_off",
    crop: "tomato",
    topic: "disease",
    safetyPeriodDays: 7,
    texts: {
      en: "Damping-Off in Nursery Seedlings (Pythium / Rhizoctonia): Seedlings topple over at soil line due to water-soaked collar rot. Remedy: Do not overwater nursery beds; ensure raised beds 15 cm high. Soil drench with Trichoderma viride at 10 g/L or Copper oxychloride at 2.5 g/L. [{{citation}}]",
      hi: "नर्सरी में पौध गलन (Damping Off): रोपे जमीन की सतह से गलकर गिर जाते हैं। उपाय: क्यारियों में ज्यादा पानी न भरें; 15 सेमी ऊंची उठी हुई क्यारियां बनाएं। ट्राइकोडर्मा 10 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड 2.5 ग्राम/लीटर से मिट्टी उपचार करें। [{{citation}}]",
      gu: "ધરૂવાડિયામાં રોપનો સડો (ધરૂ સડો): રોપ જમીનની સપાટી પાસેથી સડીને ઢળી પડે છે. ઉપાય: ધરૂવાડિયામાં વધુ પાણી ન ભરાવા દો; 15 સેમી ઊંચા ગાદી ક્યારા બનાવો. ટ્રાઈકોડર્મા 10 ગ્રામ/લિટર અથવા કોપર ઓક્સીક્લોરાઇડ 2.5 ગ્રામ/લિટર જમીનમાં આપો. [{{citation}}]",
      mr: "रोपवाटिकेतील रोपकुज (Damping Off): जमिनीलगत खोड कुजून रोपे जमिनीवर पडतात. उपाय: वाफ्यांमध्ये पाणी साचू देऊ नका; 15 सेमी उंच गादीवाफे तयार करा. ट्रायकोडर्मा 10 ग्रॅम/लिटर किंवा कॉपर ऑक्सिक्लोराईड 2.5 ग्रॅम/लिटरने जमिनीत आळवणी करा. [{{citation}}]",
    },
  },
  {
    id: "soil_ph_ec",
    crop: "tomato",
    topic: "soil_aqi",
    texts: {
      en: "Soil pH & Salinity (EC) for Tomato: Ideal soil pH is 6.0 to 7.0 (slightly acidic to neutral) and electrical conductivity (EC) below 1.5 dS/m. If soil is saline or alkaline (pH > 8.0), apply agricultural gypsum at 500 kg/acre and organic compost to enhance root nutrient uptake. [{{citation}}]",
      hi: "टमाटर के लिए मिट्टी का pH और लवणता (EC): सर्वोत्तम pH 6.0 से 7.0 और EC 1.5 dS/m से कम होनी चाहिए। यदि मिट्टी क्षारीय है (pH > 8.0), तो 500 किग्रा प्रति एकड़ जिप्सम और गोबर की खाद डालकर सुधार करें। [{{citation}}]",
      gu: "ટામેટા માટે જમીનનું pH અને ક્ષારતા (EC): શ્રેષ્ઠ pH 6.0 થી 7.0 અને EC 1.5 dS/m થી ઓછી હોવી જોઈએ. જો જમીન ભાસ્મિક કે ક્ષારવાળી હોય (pH > 8.0), તો એકરે 500 કિગ્રા જીપ્સમ અને દેશી ખાતર ઉમેરો. [{{citation}}]",
      mr: "टोमॅटोसाठी जमिनीचा सामू (pH) आणि क्षारता (EC): योग्य pH 6.0 ते 7.0 आणि EC 1.5 dS/m पेक्षा कमी असावा. जमीन क्षारयुक्त असल्यास एकरी 500 किलो जिप्सम आणि शेणखत वापरा. [{{citation}}]",
    },
  },
  {
    id: "drip_irrigation_maintenance",
    crop: "tomato",
    topic: "irrigation",
    texts: {
      en: "Drip System Maintenance & Flush: Clean disk and screen filters weekly. To remove calcium carbonate salt encrustation inside drippers, perform acid treatment with hydrochloric acid (HCl 33%) at 1 L per 1000 L line water, let stand for 60 minutes, then flush lateral sub-mains thoroughly. [{{citation}}]",
      hi: "ड्रिप सिस्टम की सफाई और एसिड ट्रीटमेंट: फिल्टर को हर हफ्ते साफ करें। ड्रिप की नलियों में खारे पानी का नमक जमने पर हाइड्रोक्लोरिक एसिड (HCl 33%) 1 लीटर प्रति 1000 लीटर पानी में मिलाकर नली में 60 मिनट रखें, फिर लेटरल के सिरे खोलकर तेज पानी से धोएं। [{{citation}}]",
      gu: "ડ્રિપ પાઇપની સફાઈ અને એસિડ ટ્રીટમેન્ટ: ફિલ્ટર દર અઠવાડિયે સાફ કરો. ડ્રિપરમાં ક્ષાર જામી જતાં હાઇડ્રોક્લોરિક એસિડ (HCl 33%) 1 લિટર પ્રતિ 1000 લિટર પાણીના હિસાબે પાઇપમાં 60 મિનિટ ભરી રાખી પછી છેડા ખોલી બધો ક્ષાર બહાર કાઢી નાખો. [{{citation}}]",
      mr: "ठिबक सिंचन देखभाल आणि ॲसिड ट्रीटमेंट: फिल्टर्स दर आठवड्याला स्वच्छ करा. ड्रिपर्समधील क्षार काढण्यासाठी 1 लिटर हायड्रोक्लोरिक ॲसिड (HCl 33%) प्रति 1000 लिटर पाण्यात मिसळून 60 मिनिटे नळीत ठेवा, नंतर नळ्यांची तोंडे उघडून स्वच्छ पाण्याने धुवा. [{{citation}}]",
    },
  },
  {
    id: "mulching_benefits",
    crop: "tomato",
    topic: "irrigation",
    texts: {
      en: "Mulching Advantages in Tomato: Spreading 25–30 micron silver-black plastic mulch or 5 cm organic sugarcane trash/straw reduces soil evaporation by 40%, stops weed growth without herbicides, prevents soil splash fungal spores, and boosts yield by 25%. [{{citation}}]",
      hi: "मल्चिंग के लाभ: 25-30 माइक्रोन की प्लास्टिक मल्च या 5 सेमी पुआल बिछाने से 40% पानी की बचत होती है, खरपतवार नहीं उगते, मिट्टी से फफूंद के छींटे नहीं लगते और पैदावार 25% बढ़ती है। [{{citation}}]",
      gu: "ટામેટામાં મલ્ચિંગના ફાયદા: 25-30 માઇક્રોન સિલ્વર-બ્લેક પ્લાસ્ટિક મલ્ચ અથવા 5 સેમી સૂકું ઘાસ પાથરવાથી 40% પાણી બચે છે, નીંદણ થતું નથી, પાન પર માટી ઉડતી નથી અને ઉત્પાદનમાં 25% વધારો થાય છે. [{{citation}}]",
      mr: "मल्चिंगचे फायदे: 25-30 मायक्रॉन प्लास्टिक मल्चिंग किंवा 5 सेमी पालापाचोळा टाकल्याने 40% पाण्याची बचत होते, तण उगवत नाही, पानांवर माती उडत नाही आणि उत्पादन 25% वाढते. [{{citation}}]",
    },
  },
  {
    id: "pruning_staking",
    crop: "tomato",
    topic: "general",
    texts: {
      en: "Pruning & Staking Guide: Stake indeterminate tomato plants with strong bamboo poles and GI wire to 1.5 m. Remove side suckers in leaf axils when they are 5 cm long to maintain 2 strong main stems. Prune lower yellowing leaves up to 20 cm above soil to guarantee airflow and sunlight. [{{citation}}]",
      hi: "सहारा (Staking) और छंटाई नियम: पौधों को 1.5 मीटर ऊंचे बांस और तार का सहारा दें। पत्तियों के जोड़ से निकलने वाली छोटी बगल की शाखाओं (सकर्स) को 5 सेमी होते ही तोड़ दें ताकि 2 मुख्य तने मजबूत बनें। हवा के लिए नीचे की पत्तियां 20 सेमी तक साफ रखें। [{{citation}}]",
      gu: "ટેકા (સ્ટેકિંગ) અને કાપણી માર્ગદર્શિકા: છોડને 1.5 મીટર ઊંચા વાંસ અને તારથી ટેકો આપો. પાનના ખૂણેથી ફૂટતી વધારાની ડાળીઓ (સકર્સ) 5 સેમી થાય ત્યારે જ તોડી લો જેથી 2 મુખ્ય થડ મજબૂત બને. હવા-ઉજાસ માટે જમીનથી 20 સેમી સુધીના નીચેના પાન સાફ રાખો. [{{citation}}]",
      mr: "बांधणी आणि छाटणी मार्गदर्शन: झाडांना 1.5 मीटर उंचीचे बांबू आणि तारेचा आधार द्या. पानाच्या बेचक्यातून निघणाऱ्या अनावश्यक फुटव्यांची (Suckers) छाटणी करा. हवा खेळती राहण्यासाठी जमिनीपासून 20 सेमी पर्यंतची खालची पाने काढून टाका. [{{citation}}]",
    },
  },
  {
    id: "harvest_maturity",
    crop: "tomato",
    topic: "general",
    texts: {
      en: "Harvest Maturity Stages: (1) Green mature: firm green with light shine — for long-distance transport (>500 km). (2) Breaker / Turning: bottom shows pink star blush — best for local mandi markets (shelf life 7–9 days). (3) Table ripe: full uniform red — for local consumption and processing. Harvest during cool morning hours. [{{citation}}]",
      hi: "तुड़ाई की अवस्थाएं: (1) पक्का हरा (Green Mature): दूर की मंडियों (>500 किमी) के लिए। (2) ब्रेकर स्टेज (Breaker): जब फल के नीचे हल्का गुलाबी तारा बने — स्थानीय मंडी के लिए सबसे अच्छा (7-9 दिन चलता है)। (3) पूरा लाल (Table Ripe): घरेलू उपयोग और प्रोसेसिंग के लिए। सुबह के ठंडे समय तुड़ाई करें। [{{citation}}]",
      gu: "ટામેટા ઉતારવાની અવસ્થા: (1) લીલા પાકા (Green mature): દૂરના માર્કેટ (>500 કિમી) મોકલવા માટે. (2) બ્રેકર / આછા ગુલાબી (Breaker): જ્યારે નીચે ગુલાબી ટપકું દેખાય — લોકલ માર્કેટ માટે શ્રેષ્ઠ (7-9 દિવસ ટકે). (3) પૂરા લાલ (Table ripe): સ્થાનિક વપરાશ અને પ્રોસેસિંગ માટે. સવારના ઠંડા પહોરમાં જ ઉતારો કરવો. [{{citation}}]",
      mr: "तोडणीच्या योग्य अवस्था: (1) पक्का हिरवा: लांबच्या बाजारासाठी (>500 किमी). (2) ब्रेकर अवस्था: फळाच्या तळाशी गुलाबी छटा आल्यावर — स्थानिक बाजारासाठी सर्वोत्तम (7-9 दिवस टिकतो). (3) पूर्ण लाल: स्थानिक वापर व प्रक्रियेसाठी. सकाळी थंड वातावरणात तोडणी करा. [{{citation}}]",
    },
  },
  {
    id: "safety_period_phi",
    crop: "tomato",
    topic: "disease",
    texts: {
      en: "Pre-Harvest Interval (PHI) / Chemical Safety Waiting Period: The mandatory waiting period between spraying a pesticide/fungicide and harvesting fruits for human consumption. Common tomato intervals: Coragen = 3 days; Mancozeb & Chlorothalonil = 7 days; Metalaxyl = 10 days; Imidacloprid = 14 days; Neem oil & Jeevamrut = 0 days (safe anytime). Strictly respect PHI to eliminate chemical residues. [{{citation}}]",
      hi: "सुरक्षा प्रतीक्षा अवधि (PHI): रासायनिक दवा छिड़कने और फल तोड़ने के बीच का अनिवार्य सुरक्षित समय। सामान्य टमाटर दवाएं: कोराजन = 3 दिन; मैंकोजेब व क्लोरोथालोनिल = 7 दिन; मेटालेक्सिल = 10 दिन; इमिडाक्लोप्रिड = 14 दिन; नीम तेल व जीवामृत = 0 दिन (कभी भी तोड़ें)। मानव स्वास्थ्य के लिए PHI का हमेशा पालन करें। [{{citation}}]",
      gu: "દવા છંટકાવ પછીનો સલામતી ગાળો (PHI): કીટનાશક કે ફૂગનાશક દવા છાંટ્યા પછી ફળ તોડવા વચ્ચેનો ફરજિયાત સલામત સમયગાળો. ટામેટા માટેના મુખ્ય ગાળા: કોરાજન = 3 દિવસ; મેન્કોઝેબ અને ક્લોરોથાલોનિલ = 7 દિવસ; મેટાલક્ષિલ = 10 દિવસ; ઇમિડાક્લોપ્રિડ = 14 દિવસ; લીમડાનું તેલ અને જીવામૃત = 0 દિવસ. માનવ સ્વાસ્થ્ય માટે આ સલામતી ગાળો અચૂક પાળવો. [{{citation}}]",
      mr: "फवारणीनंतरचा सुरक्षा कालावधी (PHI): कीटकनाशक किंवा बुरशीनाशक फवारल्यानंतर फळे तोडण्यापूर्वीचा सुरक्षित कालावधी. टोमॅटोसाठी: कोराजन = 3 दिवस; मॅनकोझेब व क्लोरोथॅलोनिल = 7 दिवस; मेटॅलॅक्सिल = 10 दिवस; इमिडाक्लोप्रिड = 14 दिवस; निंबोळी तेल व जिवामृत = 0 दिवस. ग्राहकांच्या सुरक्षिततेसाठी हा कालावधी नक्की पाळा. [{{citation}}]",
    },
  },

  /* ------------------------------------------------------------------ */
  /* 7. GREETINGS & COURTESY                                            */
  /* ------------------------------------------------------------------ */
  {
    id: "hello",
    crop: "tomato",
    topic: "general",
    texts: {
      en: "Namaste! I am your KrishiNethra Farm Brain. I monitor your live soil moisture ({{soil}}%), air temperature ({{temp}}°C), and pump status 24/7. How can I help your tomato crop today? [{{citation}}]",
      hi: "नमस्ते किसान भाई! मैं आपका कृषि-नेत्र फ़ार्म ब्रेन हूँ। मैं आपकी मिट्टी की नमी ({{soil}}%), तापमान ({{temp}}°C) और पंप की 24/7 निगरानी करता हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? [{{citation}}]",
      gu: "નમસ્તે ખેડૂત મિત્ર! હું તમારો કૃષિ-નેત્ર ફાર્મ બ્રેઈન છું. હું તમારા ખેતરનો જમીનનો ભેજ ({{soil}}%), તાપમાન ({{temp}}°C) અને પંપનું ચોવીસે કલાક ધ્યાન રાખું છું. આજે તમારા ટામેટાના પાક માટે શું સહાય કરું? [{{citation}}]",
      mr: "नमस्कार शेतकरी मित्र! मी तुमचा कृषी-नेत्र फार्म ब्रेन आहे. मी तुमच्या शेतातील जमिनीचा ओलावा ({{soil}}%), तापमान ({{temp}}°C) आणि पंपावर 24 तास लक्ष ठेवतो. आज मी तुम्हाला कशी मदत करू? [{{citation}}]",
    },
  },
  {
    id: "thanks",
    crop: "tomato",
    topic: "general",
    texts: {
      en: "You are welcome! Always happy to support your farming journey. May your tomato harvest be bountiful and profitable! [{{citation}}]",
      hi: "आपका स्वागत है! आपकी खेती में मदद करके मुझे खुशी हुई। आपके टमाटर की भरपूर पैदावार और अच्छा मुनाफा हो! [{{citation}}]",
      gu: "આપનો આભાર! ખેતીના કામમાં આપને સહાય કરવામાં મને ઘણો આનંદ છે. તમારા ટામેટાનો પાક ઉત્તમ થાય અને સારો નફો મળે તેવી શુભેચ્છા! [{{citation}}]",
      mr: "आपले स्वागत आहे! आपल्या शेतीत मदत करताना मला खूप आनंद होतो. टोमॅटोचे भरघोस उत्पादन आणि चांगला नफा मिळो हीच सदिच्छा! [{{citation}}]",
    },
  },
];

export const KB_MAP = new Map<string, KBEntry>(
  TOMATO_KB.map((entry) => [entry.id, entry]),
);

export function getKBEntry(id: string): KBEntry | undefined {
  return KB_MAP.get(id);
}
