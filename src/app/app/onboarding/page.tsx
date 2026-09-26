"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Languages,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Mountain,
  Phone,
  Ruler,
  Sprout,
  Tractor,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/types";
import { useFarmStore, DEFAULT_SETTINGS, sizeToAcres } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  INDIAN_STATES,
  capitalForState,
  districtsForState,
} from "@/lib/india-locations";
import { mandiById } from "@/lib/market-data";
import { useMounted } from "@/components/dashboard/ui";
import CropSelector from "@/components/onboarding/CropSelector";
import { getCrop } from "@/lib/crops";
import { CreamButton } from "@/components/editorial/CreamButton";

const AVATARS = ["🧑‍🌾", "👩‍🌾", "🧔", "👳‍♀️", "🧕", "👨‍🌾"];
const ROLES = ["Farmer", "Farm Manager", "Student Researcher"];
const SIZE_UNITS = ["Acres", "Bigha", "Hectare", "Guntha"];
const SOIL_TYPES = ["Sandy", "Loamy", "Clay", "Black cotton"];
const WATER_SOURCES = ["Borewell", "Canal", "Rain-fed", "Tank"];
const IRRIGATION_METHODS = ["Flood", "Drip", "Sprinkler", "None"];
const POWER_SOURCES = ["Electricity", "Solar", "Diesel", "None"];
const HARDWARE_NOTE =
  "Hardware: 1 soil sensor, 1 air quality sensor, 1 temp/humidity sensor, 1 rain sensor, 1 pump";

// Editorial Form Inputs: Underline-only inputs with 0 border-radius
const underlineInputCls =
  "w-full rounded-none border-0 border-b border-[var(--line)] bg-transparent px-0 py-2.5 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-3)] placeholder:font-normal focus:border-[var(--terra)] focus:ring-0 outline-none transition-colors";

const underlineSelectCls =
  "w-full rounded-none appearance-none border-0 border-b border-[var(--line)] bg-transparent px-0 py-2.5 text-sm font-semibold text-[var(--ink)] focus:border-[var(--terra)] focus:ring-0 outline-none transition-colors cursor-pointer [&>option]:bg-[var(--panel)] [&>option]:text-[var(--ink)]";

const monoLabelCls =
  "mb-1 block font-editorial-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-2)]";

/* ---------------- Editorial Step Stamp Header ---------------- */
function StepStampHeader({
  stepNumber,
  totalSteps = 4,
  title,
  subtitle,
}: {
  stepNumber: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
}) {
  const stepStr = `STEP ${String(stepNumber).padStart(2, "0")}/${String(totalSteps).padStart(2, "0")}`;

  return (
    <div className="mb-6 border-b border-[var(--line)] pb-4 font-editorial-mono">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-block border border-[var(--terra)] bg-[var(--terra-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--terra)]">
          {stepStr}
        </span>
        <span className="text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-widest">
          FIELD REGISTRATION
        </span>
      </div>
      <h2 className="mt-2 text-lg sm:text-xl font-bold uppercase tracking-tight text-[var(--ink)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-[var(--ink-2)] font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ---------------- PIN unlock screen ---------------- */
function PinUnlock() {
  const t = useT();
  const router = useRouter();
  const unlock = useFarmStore((s) => s.unlock);
  const verifyPin = useFarmStore((s) => s.verifyPin);
  const resetOnboarding = useFarmStore((s) => s.resetOnboarding);
  const farmerName = useFarmStore((s) => s.settings.farmProfile.farmerName);
  const avatar = useFarmStore((s) => s.settings.farmProfile.avatar);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const submit = () => {
    const code = pin.join("");
    if (code.length !== 4) return;
    if (verifyPin(code)) {
      unlock();
      toast.success(t("welcome"));
      router.replace("/app/dashboard");
    } else {
      setError(true);
      setPin(["", "", "", ""]);
      refs.current[0]?.focus();
      setTimeout(() => setError(false), 1600);
    }
  };

  return (
    <main className="relative flex h-full overflow-y-auto flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="relative z-10 w-full max-w-md font-editorial-mono">
        <div className="rounded-none border border-[var(--line)] bg-[var(--panel)] p-8 text-center sm:p-10 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none border border-[var(--line)] bg-[var(--panel-2)] text-3xl">
            {avatar || "🧑‍🌾"}
          </div>
          <h1 className="mt-4 text-xl font-bold uppercase tracking-wide text-[var(--ink)]">
            {t("onboarding.pinUnlockTitle")}
            {farmerName ? `, ${farmerName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-2)]">{t("onboarding.pinUnlockSub")}</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {pin.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => {
                  const digit = e.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...pin];
                  next[i] = digit;
                  setPin(next);
                  if (digit && i < 3) refs.current[i + 1]?.focus();
                  if (digit && i === 3 && next.every(Boolean)) {
                    setTimeout(submit, 80);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !pin[i] && i > 0) refs.current[i - 1]?.focus();
                  if (e.key === "Enter") submit();
                }}
                aria-label={`PIN digit ${i + 1}`}
                className={cn(
                  "h-12 w-12 rounded-none border bg-[var(--panel-2)] text-center text-xl font-bold text-[var(--ink)] outline-none transition-all placeholder:text-[var(--ink-3)]",
                  error
                    ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                    : "border-[var(--line)] focus:border-[var(--terra)]",
                )}
                placeholder="•"
              />
            ))}
          </div>
          {error && (
            <p className="mt-3 text-xs font-bold text-[var(--terra)]">{t("onboarding.wrongPin")}</p>
          )}

          <div className="mt-6">
            <CreamButton onClick={submit} className="w-full py-3">
              <span className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4" /> {t("onboarding.unlockButton")}
              </span>
            </CreamButton>
          </div>

          <button
            type="button"
            onClick={() => {
              resetOnboarding();
              toast.info(t("onboarding.editLater"));
            }}
            className="mt-4 text-xs uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--terra)] hover:underline cursor-pointer"
          >
            {t("common.edit")} REGISTRATION
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Wizard (STEP 01/04 through STEP 04/04) ---------------- */
function Wizard() {
  const t = useT();
  const router = useRouter();
  const settings = useFarmStore((s) => s.settings);
  const setLanguage = useFarmStore((s) => s.setLanguage);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const completeOnboarding = useFarmStore((s) => s.completeOnboarding);

  const profile = settings.farmProfile ?? DEFAULT_SETTINGS.farmProfile;

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [locating, setLocating] = useState(false);
  const [geoLabel, setGeoLabel] = useState<string | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [editingCoords, setEditingCoords] = useState(false);
  const [latText, setLatText] = useState("");
  const [lonText, setLonText] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  // ---- Step 1 validation: Name & Phone & Language ----
  const name = profile.farmerName ?? "";
  const phone = profile.phone ?? "";
  const nameValid = name.trim().length >= 3;
  const phoneValid = /^[6-9]\d{9}$/.test(phone.trim());
  const step1Valid = nameValid && phoneValid;

  // ---- Step 2 validation: Location ----
  const districts = districtsForState(profile.state);
  const step2Valid = Boolean(profile.state?.trim() && profile.district?.trim());

  // ---- Step 3 validation: Farm Specs & Crops ----
  const farmNameEffective =
    profile.farmName?.trim() ||
    (name.trim() ? `${name.trim().split(" ")[0]}'s Farm` : "My Farm");
  const step3Valid =
    farmNameEffective.trim().length > 0 &&
    Number(profile.size) > 0 &&
    (profile.crops?.length ?? 0) > 0;

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    setLocating(true);
    setGeoDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;
        updateSettings({
          farmProfile: { location: { lat, lng } },
          location: {
            latitude: lat,
            longitude: lng,
            label: [profile.district, profile.state].filter(Boolean).join(", ") || "Farm",
          },
        });
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          );
          const data = await res.json();
          const city = data.city || data.locality || "";
          const admin = data.principalSubdivision || "";
          const label = [city, admin].filter(Boolean).join(", ");
          setGeoLabel(label || `${lat}, ${lng}`);
          if (admin) {
            const match = INDIAN_STATES.find((s) =>
              admin.toLowerCase().includes(s.toLowerCase().split(" ")[0]),
            );
            if (match && !districtsForState(profile.state)) {
              updateSettings({ farmProfile: { state: match } });
            }
          }
          updateSettings({
            location: {
              latitude: lat,
              longitude: lng,
              label: label || "Farm",
            },
          });
        } catch {
          setGeoLabel(`${lat}, ${lng}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  // Step 3: initialize with default crops if none exist
  useEffect(() => {
    if (step !== 3) return;
    if (!profile.crops || profile.crops.length === 0) {
      updateSettings({ farmProfile: { crops: ["tomato", "wheat"] } });
    }
    const st = useFarmStore.getState();
    const first = st.zones[0];
    const primaryCropId = profile.crops?.[0] || "tomato";
    const primaryCropName = getCrop(primaryCropId)?.en || "Tomato";
    if (st.zones.length !== 1 || first?.name !== "Your Farm") {
      useFarmStore.setState({
        zones: [
          {
            id: "A",
            name: "Your Farm",
            crop: primaryCropName,
            soilMoisture: first?.soilMoisture ?? 45,
            status: first?.status ?? "healthy",
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finish = () => {
    if (pinEnabled && pin.join("").length !== 4) {
      toast.error(t("pinError"));
      return;
    }
    const acres = sizeToAcres(Number(profile.size) || 1, profile.sizeUnit || "Acres");
    let loc = settings.location;
    if (profile.location) {
      loc = {
        latitude: profile.location.lat,
        longitude: profile.location.lng,
        label: [profile.district, profile.state].filter(Boolean).join(", ") || "Farm",
      };
    } else {
      const cap = capitalForState(profile.state || "Gujarat");
      loc = { latitude: cap.lat, longitude: cap.lng, label: cap.label };
    }
    updateSettings({
      farmProfile: { farmName: farmNameEffective, farmSizeAcres: Math.max(0.1, acres) },
      location: loc,
    });
    completeOnboarding({ pin: pinEnabled ? pin.join("") : null });
    toast.success(t("welcome"));
    router.replace("/app/dashboard");
  };

  return (
    <main className="relative flex h-full overflow-y-auto flex-col items-center bg-[var(--bg)] px-4 pb-12 pt-6 sm:pt-10">
      <div className="relative z-10 w-full max-w-xl">
        {/* Step stamps progress bar: 4 steps */}
        <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-2 font-editorial-mono text-xs">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  if (d < step) go(d);
                }}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-none cursor-pointer border",
                  d === step
                    ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                    : d < step
                      ? "border-[var(--line)] bg-[var(--panel-2)] text-[var(--moss)] hover:border-[var(--ink-2)]"
                      : "border-[var(--line)] bg-transparent text-[var(--ink-3)] cursor-not-allowed",
                )}
              >
                0{d}
              </button>
            ))}
          </div>
          <span className="font-bold uppercase tracking-wider text-[var(--ink-2)]">
            STEP {String(step).padStart(2, "0")}/04
          </span>
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, y: 8 * dir }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 * dir }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="rounded-none border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 shadow-xl"
          >
            {step > 1 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="mb-4 inline-flex items-center gap-1.5 font-editorial-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-2)] hover:text-[var(--terra)] cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> BACK TO STEP 0{step - 1}
              </button>
            )}

            {/* ============ STEP 01/04: FARMER PROFILE & LANGUAGE ============ */}
            {step === 1 && (
              <div>
                <StepStampHeader
                  stepNumber={1}
                  totalSteps={4}
                  title="FARMER PROFILE & LANGUAGE"
                  subtitle="Select your preferred language and enter your farm manager details."
                />

                <div className="space-y-5">
                  {/* Language selection */}
                  <div>
                    <span className={monoLabelCls}>PREFERRED LANGUAGE // भाषा</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-editorial-mono">
                      {LANGUAGES.map((l) => {
                        const active = settings.language === l.code;
                        return (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setLanguage(l.code)}
                            className={cn(
                              "border p-2.5 text-left transition-colors cursor-pointer rounded-none select-none",
                              active
                                ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--ink)]"
                                : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:border-[var(--ink-3)]",
                            )}
                          >
                            <span className="block text-sm font-bold text-[var(--ink)]">
                              {l.nativeLabel}
                            </span>
                            <span className="text-[10px] text-[var(--ink-3)] uppercase">
                              {l.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-name">
                      FULL NAME // किसान का नाम
                    </label>
                    <input
                      id="ob-name"
                      value={name}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { farmerName: e.target.value.slice(0, 40) } })
                      }
                      placeholder="e.g. Ramesh Patel"
                      autoComplete="name"
                      className={cn(underlineInputCls, name && !nameValid && "border-[var(--terra)]")}
                    />
                    {name && !nameValid && (
                      <p className="mt-1 font-editorial-mono text-[10px] text-[var(--terra)]">
                        Minimum 3 characters required.
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-phone">
                      MOBILE NUMBER // संपर्क सूत्र (+91)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="border-b border-[var(--line)] py-2.5 font-editorial-mono text-xs font-bold text-[var(--ink-3)]">
                        +91
                      </span>
                      <input
                        id="ob-phone"
                        value={phone}
                        onChange={(e) =>
                          updateSettings({
                            farmProfile: { phone: e.target.value.replace(/\D/g, "").slice(0, 10) },
                          })
                        }
                        placeholder="98765 43210"
                        inputMode="numeric"
                        autoComplete="tel"
                        className={cn(
                          underlineInputCls,
                          "font-editorial-mono tracking-widest",
                          phone && !phoneValid && "border-[var(--terra)]",
                        )}
                      />
                    </div>
                    {phone && !phoneValid && (
                      <p className="mt-1 font-editorial-mono text-[10px] text-[var(--terra)]">
                        Enter a valid 10-digit mobile number.
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <span className={monoLabelCls}>OPERATING ROLE</span>
                    <div className="grid grid-cols-3 gap-2 font-editorial-mono">
                      {ROLES.map((r) => {
                        const active = (profile.role || "Farmer") === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => updateSettings({ farmProfile: { role: r } })}
                            className={cn(
                              "border py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer",
                              active
                                ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                                : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:border-[var(--ink-3)]",
                            )}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div>
                    <span className={monoLabelCls}>AVATAR ICON</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => updateSettings({ farmProfile: { avatar: a } })}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center border text-xl transition-colors rounded-none cursor-pointer",
                            (profile.avatar || AVATARS[0]) === a
                              ? "border-[var(--terra)] bg-[var(--terra-soft)]"
                              : "border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--ink-3)]",
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-[var(--line)] pt-4">
                  <CreamButton
                    disabled={!step1Valid}
                    onClick={() => go(2)}
                    className="w-full py-3"
                  >
                    CONTINUE TO LOCATION
                  </CreamButton>
                </div>
              </div>
            )}

            {/* ============ STEP 02/04: FARM LOCATION & GEOGRAPHY ============ */}
            {step === 2 && (
              <div>
                <StepStampHeader
                  stepNumber={2}
                  totalSteps={4}
                  title="FARM LOCATION & GEOGRAPHY"
                  subtitle="Specify the district and coordinates for localized ag-weather and market prices."
                />

                <div className="space-y-5">
                  {/* Auto-detect button */}
                  <div>
                    <CreamButton
                      onClick={detectLocation}
                      disabled={locating}
                      className="w-full py-2.5"
                    >
                      <span className="flex items-center gap-2">
                        <LocateFixed className={cn("h-4 w-4", locating && "animate-spin")} />
                        {locating ? "DETECTING SATELLITE GPS..." : "AUTO-DETECT GPS COORDINATES"}
                      </span>
                    </CreamButton>
                    {geoLabel && (
                      <p className="mt-2 font-editorial-mono text-[10px] text-[var(--moss)] uppercase tracking-wider">
                        [OK] DETECTED: {geoLabel}
                      </p>
                    )}
                    {geoDenied && (
                      <p className="mt-2 font-editorial-mono text-[10px] text-[var(--terra)] uppercase tracking-wider">
                        [!] PERMISSION DENIED. PLEASE SELECT MANUALLY BELOW.
                      </p>
                    )}
                  </div>

                  {/* State Select */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-state">
                      STATE // राज्य
                    </label>
                    <select
                      id="ob-state"
                      value={profile.state || ""}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { state: e.target.value, district: "" } })
                      }
                      className={underlineSelectCls}
                    >
                      <option value="" disabled>
                        — SELECT STATE —
                      </option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District Select */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-district">
                      DISTRICT // जिला
                    </label>
                    {districts ? (
                      <select
                        id="ob-district"
                        value={profile.district || ""}
                        onChange={(e) => updateSettings({ farmProfile: { district: e.target.value } })}
                        className={underlineSelectCls}
                      >
                        <option value="" disabled>
                          — SELECT DISTRICT —
                        </option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="ob-district"
                        value={profile.district || ""}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { district: e.target.value.slice(0, 40) } })
                        }
                        placeholder="District name"
                        className={underlineInputCls}
                      />
                    )}
                  </div>

                  {/* Village Input */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-village">
                      VILLAGE / TALUKA // गाँव
                    </label>
                    <input
                      id="ob-village"
                      value={profile.village || ""}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { village: e.target.value.slice(0, 60) } })
                      }
                      placeholder="Village or locality name"
                      className={underlineInputCls}
                    />
                  </div>

                  {/* GPS Coordinates Box */}
                  <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3 font-editorial-mono rounded-none">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--ink-2)] uppercase tracking-wider">
                        GPS:{" "}
                        {profile.location
                          ? `${profile.location.lat.toFixed(4)}, ${profile.location.lng.toFixed(4)}`
                          : "NOT SET"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoords((v) => !v);
                          setLatText(profile.location ? String(profile.location.lat) : "");
                          setLonText(profile.location ? String(profile.location.lng) : "");
                        }}
                        className="text-[10px] font-bold text-[var(--terra)] hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        {editingCoords ? "CANCEL" : "EDIT MANUAL"}
                      </button>
                    </div>

                    {editingCoords && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <input
                          value={latText}
                          onChange={(e) => setLatText(e.target.value)}
                          placeholder="Latitude (e.g. 23.0225)"
                          inputMode="decimal"
                          className={cn(underlineInputCls, "font-editorial-mono text-xs")}
                        />
                        <input
                          value={lonText}
                          onChange={(e) => setLonText(e.target.value)}
                          placeholder="Longitude (e.g. 72.5714)"
                          inputMode="decimal"
                          className={cn(underlineInputCls, "font-editorial-mono text-xs")}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const la = Number(latText);
                            const ln = Number(lonText);
                            if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
                            updateSettings({
                              farmProfile: { location: { lat: la, lng: ln } },
                              location: { latitude: la, longitude: ln, label: "Farm" },
                            });
                            setEditingCoords(false);
                          }}
                          className="shrink-0 border border-[var(--terra)] bg-[var(--terra)] px-3 py-1.5 font-editorial-mono text-[10px] font-bold text-white uppercase tracking-wider"
                        >
                          SET
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-[var(--line)] pt-4">
                  <CreamButton
                    disabled={!step2Valid}
                    onClick={() => go(3)}
                    className="w-full py-3"
                  >
                    CONTINUE TO CROPS & SPECS
                  </CreamButton>
                </div>
              </div>
            )}

            {/* ============ STEP 03/04: FARM SPECIFICATIONS & CROPS ============ */}
            {step === 3 && (
              <div>
                <StepStampHeader
                  stepNumber={3}
                  totalSteps={4}
                  title="FARM SPECIFICATIONS & CROPS"
                  subtitle="Configure your farm size, irrigation hardware, and choose your active crops."
                />

                <div className="space-y-5">
                  {/* Farm Name */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-farm">
                      FARM NAME // खेत का नाम
                    </label>
                    <input
                      id="ob-farm"
                      value={farmNameEffective}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { farmName: e.target.value.slice(0, 40) } })
                      }
                      className={underlineInputCls}
                    />
                  </div>

                  {/* Farm Size & Unit */}
                  <div>
                    <label className={monoLabelCls} htmlFor="ob-size">
                      TOTAL FARM AREA // कुल क्षेत्रफल
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="ob-size"
                        value={String(profile.size ?? 1)}
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
                          if (Number.isFinite(n))
                            updateSettings({ farmProfile: { size: Math.min(10000, Math.max(0, n)) } });
                        }}
                        inputMode="decimal"
                        className={cn(underlineInputCls, "font-editorial-mono flex-1")}
                      />
                      <select
                        value={profile.sizeUnit || "Acres"}
                        onChange={(e) =>
                          updateSettings({
                            farmProfile: {
                              sizeUnit: e.target.value as "Acres" | "Bigha" | "Hectare" | "Guntha",
                            },
                          })
                        }
                        aria-label="Size unit"
                        className={cn(underlineSelectCls, "w-28 shrink-0 font-editorial-mono")}
                      >
                        {SIZE_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Soil, Water, Irrigation, Power in 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={monoLabelCls} htmlFor="ob-soilType">
                        SOIL TYPE // मिट्टी का प्रकार
                      </label>
                      <select
                        id="ob-soilType"
                        value={profile.soilType || SOIL_TYPES[0]}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { soilType: e.target.value } })
                        }
                        className={underlineSelectCls}
                      >
                        {SOIL_TYPES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={monoLabelCls} htmlFor="ob-waterSource">
                        WATER SOURCE // जल स्रोत
                      </label>
                      <select
                        id="ob-waterSource"
                        value={profile.waterSource || WATER_SOURCES[0]}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { waterSource: e.target.value } })
                        }
                        className={underlineSelectCls}
                      >
                        {WATER_SOURCES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={monoLabelCls} htmlFor="ob-irrigationMethod">
                        IRRIGATION METHOD // सिंचाई विधि
                      </label>
                      <select
                        id="ob-irrigationMethod"
                        value={profile.irrigationMethod || IRRIGATION_METHODS[0]}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { irrigationMethod: e.target.value } })
                        }
                        className={underlineSelectCls}
                      >
                        {IRRIGATION_METHODS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={monoLabelCls} htmlFor="ob-powerSource">
                        POWER SOURCE // बिजली स्रोत
                      </label>
                      <select
                        id="ob-powerSource"
                        value={profile.powerSource || POWER_SOURCES[0]}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { powerSource: e.target.value } })
                        }
                        className={underlineSelectCls}
                      >
                        {POWER_SOURCES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 120+ Crops Database Selector */}
                  <div className="pt-2">
                    <span className={monoLabelCls}>
                      ACTIVE CROPS // फसल चयन (120+ DATABASE)
                    </span>
                    <CropSelector
                      selectedIds={profile.crops || ["tomato"]}
                      onChange={(crops) => {
                        updateSettings({ farmProfile: { crops } });
                        const first = useFarmStore.getState().zones[0];
                        if (first && crops[0]) {
                          const cName = getCrop(crops[0])?.en || crops[0];
                          useFarmStore.setState({
                            zones: [{ ...first, crop: cName }],
                          });
                        }
                      }}
                    />
                    <div className="mt-3 border border-[var(--line)] bg-[var(--panel-2)] p-2 font-editorial-mono text-[10px] text-[var(--ink-2)] rounded-none">
                      {HARDWARE_NOTE}
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-[var(--line)] pt-4">
                  <CreamButton
                    disabled={!step3Valid}
                    onClick={() => go(4)}
                    className="w-full py-3"
                  >
                    CONTINUE TO REVIEW & PIN
                  </CreamButton>
                </div>
              </div>
            )}

            {/* ============ STEP 04/04: REVIEW & SECURITY PIN ============ */}
            {step === 4 && (
              <div>
                <StepStampHeader
                  stepNumber={4}
                  totalSteps={4}
                  title="REVIEW & SECURITY PIN"
                  subtitle="Verify your agricultural profile and optionally lock configuration with a 4-digit PIN."
                />

                <div className="space-y-4 font-editorial-mono">
                  {/* Summary Box */}
                  <div className="border border-[var(--line)] bg-[var(--panel-2)] p-4 rounded-none space-y-3">
                    <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
                      <span className="flex h-10 w-10 items-center justify-center border border-[var(--line)] bg-[var(--panel)] text-2xl">
                        {profile.avatar || "🧑‍🌾"}
                      </span>
                      <div>
                        <p className="text-sm font-bold uppercase text-[var(--ink)]">{name || "—"}</p>
                        <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
                          {profile.role || "Farmer"} · +91 {phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[var(--ink-2)]">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[var(--terra)] shrink-0" />
                        <span className="uppercase">
                          {[profile.village, profile.district, profile.state].filter(Boolean).join(", ") || "—"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Tractor className="h-3.5 w-3.5 text-[var(--terra)] shrink-0" />
                        <span className="uppercase">
                          {farmNameEffective} · {profile.size} {profile.sizeUnit} · {profile.soilType}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Droplets className="h-3.5 w-3.5 text-[var(--moss)] shrink-0" />
                        <span className="uppercase">
                          {profile.waterSource} · {profile.irrigationMethod} · {profile.powerSource}
                        </span>
                      </p>
                    </div>

                    {/* Crops Badges */}
                    <div className="flex flex-wrap gap-1 border-t border-[var(--line)] pt-2.5">
                      {(profile.crops ?? []).map((c) => {
                        const cropObj = getCrop(c);
                        const label = cropObj ? `${cropObj.en} (${cropObj.hi})` : (mandiById(c)?.crop ?? c);
                        return (
                          <span
                            key={c}
                            className="border border-[var(--terra)] bg-[var(--terra-soft)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--ink)]"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security PIN Option */}
                  <div className="border border-[var(--line)] bg-[var(--panel-2)] p-4 rounded-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--ink)]">
                          <LockKeyhole className="h-3.5 w-3.5 text-[var(--terra)]" /> REQUIRE 4-DIGIT SECURITY PIN
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--ink-3)]">
                          Locks field configuration and pump controls behind an access code.
                        </p>
                      </div>

                      {/* Square Checkbox Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pinEnabled}
                        onClick={() => setPinEnabled((v) => !v)}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center border transition-colors cursor-pointer rounded-none",
                          pinEnabled
                            ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                            : "border-[var(--line)] bg-[var(--panel)]",
                        )}
                      >
                        {pinEnabled && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                    </div>

                    {pinEnabled && (
                      <div className="mt-4 border-t border-[var(--line)] pt-3">
                        <span className={monoLabelCls}>ENTER 4-DIGIT PIN</span>
                        <div className="flex gap-2">
                          {pin.map((d, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                pinRefs.current[i] = el;
                              }}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={d}
                              onChange={(e) => {
                                const digit = e.target.value.replace(/\D/g, "").slice(-1);
                                const next = [...pin];
                                next[i] = digit;
                                setPin(next);
                                if (digit && i < 3) pinRefs.current[i + 1]?.focus();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !pin[i] && i > 0)
                                  pinRefs.current[i - 1]?.focus();
                              }}
                              aria-label={`PIN digit ${i + 1}`}
                              className="h-10 w-10 border border-[var(--line)] bg-[var(--panel)] text-center text-lg font-bold text-[var(--ink)] outline-none rounded-none focus:border-[var(--terra)]"
                              placeholder="•"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-[var(--line)] pt-4">
                  <CreamButton onClick={finish} className="w-full py-3.5">
                    START MONITORING FARM
                  </CreamButton>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const onboardingDone = useFarmStore((s) => s.onboardingDone);
  const appPinHash = useFarmStore((s) => s.appPinHash);
  const isAuthenticated = useFarmStore((s) => s.isAuthenticated);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    if (onboardingDone && (!appPinHash || isAuthenticated)) {
      router.replace("/app/dashboard");
    }
  }, [mounted, onboardingDone, appPinHash, isAuthenticated, router]);

  if (!mounted) {
    return (
      <main className="relative flex h-full items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-none border border-[var(--terra)] border-t-transparent" />
      </main>
    );
  }

  if (onboardingDone) {
    if (appPinHash && !isAuthenticated)
      return (
        <MotionConfig reducedMotion="user">
          <PinUnlock />
        </MotionConfig>
      );
    return (
      <main className="relative flex h-full items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-none border border-[var(--terra)] border-t-transparent" />
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Wizard />
    </MotionConfig>
  );
}
