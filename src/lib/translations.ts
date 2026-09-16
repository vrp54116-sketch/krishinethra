import type { LanguageCode } from "./types";

type LandingStrings = {
  tagline: string;
  pinLabel: string;
  enterFarm: string;
  pinError: string;
  welcome: string;
};

export const translations: Record<LanguageCode, LandingStrings> = {
  en: {
    tagline: "Har Khet Ka AI Doctor — Your Farm's Intelligent Guardian",
    pinLabel: "Enter 4-digit PIN",
    enterFarm: "ENTER FARM",
    pinError: "Please enter a 4-digit PIN",
    welcome: "Welcome to your farm",
  },
  hi: {
    tagline: "हर खेत का AI डॉक्टर — आपके खेत का बुद्धिमान रखवाला",
    pinLabel: "4 अंकों का पिन डालें",
    enterFarm: "खेत में प्रवेश करें",
    pinError: "कृपया 4 अंकों का पिन डालें",
    welcome: "आपके खेत में स्वागत है",
  },
  gu: {
    tagline: "દરેક ખેતરનો AI ડૉક્ટર — તમારા ખેતરનો બુદ્ધિશાળી રખેવાળ",
    pinLabel: "4-અંકનો PIN નાખો",
    enterFarm: "ખેતરમાં પ્રવેશો",
    pinError: "કૃપા કરીને 4-અંકનો PIN નાખો",
    welcome: "તમારા ખેતરમાં સ્વાગત છે",
  },
  mr: {
    tagline: "प्रत्येक शेताचा AI डॉक्टर — तुमच्या शेताचा बुद्धिमान रक्षक",
    pinLabel: "4-अंकी PIN टाका",
    enterFarm: "शेतात प्रवेश करा",
    pinError: "कृपया 4-अंकी PIN टाका",
    welcome: "तुमच्या शेतात स्वागत आहे",
  },
};
