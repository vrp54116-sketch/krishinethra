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

const AVATARS = ["🧑‍🌾", "👩‍🌾", "🧔", "👳‍♀️", "🧕", "👨‍🌾"];
const ROLES = ["Farmer", "Farm Manager", "Student Researcher"];
const SIZE_UNITS = ["Acres", "Bigha", "Hectare", "Guntha"];
const SOIL_TYPES = ["Sandy", "Loamy", "Clay", "Black cotton"];
const WATER_SOURCES = ["Borewell", "Canal", "Rain-fed", "Tank"];
const IRRIGATION_METHODS = ["Flood", "Drip", "Sprinkler", "None"];
const POWER_SOURCES = ["Electricity", "Solar", "Diesel", "None"];
const DEFAULT_CROP = "Tomato";
const HARDWARE_NOTE =
  "Hardware: 1 soil sensor, 1 air quality sensor, 1 temp/humidity sensor, 1 rain sensor, 1 pump";

const inputCls =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pl-11 text-sm font-semibold text-[var(--text)] outline-none transition-all placeholder:font-normal placeholder:text-[var(--text-2)] focus:border-[var(--accent)] focus:shadow-[0_0_20px_var(--accent-glow)]";

const selectCls =
  "w-full appearance-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_20px_var(--accent-glow)] [&>option]:bg-black [&>option]:text-white";

const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[var(--text-2)]";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)]">
      {children}
    </span>
  );
}

/* ---------------- Animated farm background ---------------- */
function FarmBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        size: 8 + ((i * 37) % 26),
        left: (i * 71) % 100,
        top: (i * 53) % 100,
        dur: 9 + ((i * 29) % 12),
        delay: (i % 7) * 0.9,
        warm: i % 3 === 0,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(255,107,26,0.18),transparent_70%)]" />
      <div className="animate-drift-slow absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[var(--accent-glow)]/15 blur-[130px]" />
      <div className="animate-drift-slow-reverse absolute -right-32 bottom-1/4 h-[28rem] w-[28rem] rounded-full bg-[var(--accent-soft)]/20 blur-[130px]" />
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={cn(
            "absolute rounded-full blur-[1px]",
            p.warm ? "bg-amber-400/25" : "bg-[var(--accent)]/20",
          )}
          style={{ width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, -46, 0], x: [0, 18, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
      <div className="farm-grid absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-[var(--bg)]/70" />
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
      router.replace("/dashboard");
    } else {
      setError(true);
      setPin(["", "", "", ""]);
      refs.current[0]?.focus();
      setTimeout(() => setError(false), 1600);
    }
  };

  return (
    <main className="relative flex h-full overflow-y-auto flex-col items-center justify-center overflow-x-hidden bg-transparent px-4 py-12">
      <FarmBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-[24px] p-8 text-center sm:p-10 border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-4xl border border-[var(--accent)]/30">
            {avatar || "🧑‍🌾"}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[var(--text)]">
            {t("onboarding.pinUnlockTitle")}
            {farmerName ? `, ${farmerName.split(" ")[0]}` : ""} 🌾
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-2)]">{t("onboarding.pinUnlockSub")}</p>
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
                  "h-14 w-14 rounded-2xl border bg-[var(--surface-2)] text-center text-2xl font-bold text-[var(--text)] outline-none transition-all placeholder:text-[var(--text-2)]",
                  error
                    ? "animate-pulse border-red-400/70"
                    : "border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_20px_var(--accent-glow)]",
                )}
                placeholder="•"
              />
            ))}
          </div>
          {error && (
            <p className="mt-3 text-xs font-bold text-rose-300">{t("onboarding.wrongPin")}</p>
          )}
          <button
            type="button"
            onClick={submit}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white cursor-pointer transition-all"
          >
            <LockKeyhole className="h-5 w-5" /> {t("onboarding.unlockButton")}
          </button>
          <button
            type="button"
            onClick={() => {
              resetOnboarding();
              toast.info(t("onboarding.editLater"));
            }}
            className="mt-3 text-xs text-[var(--text-2)] underline-offset-2 hover:text-[var(--accent)] hover:underline cursor-pointer"
          >
            {t("common.edit")} registration
          </button>
        </div>
      </motion.div>
    </main>
  );
}

/* ---------------- Wizard ---------------- */
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

  // ---- Step 2 validation ----
  const name = profile.farmerName ?? "";
  const phone = profile.phone ?? "";
  const nameValid = name.trim().length >= 3;
  const phoneValid = /^[6-9]\d{9}$/.test(phone.trim());
  const step2Valid = nameValid && phoneValid;

  // ---- Step 3 ----
  const districts = districtsForState(profile.state);
  const step3Valid = Boolean(profile.state?.trim() && profile.district?.trim());

  // ---- Step 4 ----
  const farmNameEffective =
    profile.farmName?.trim() ||
    (name.trim() ? `${name.trim().split(" ")[0]}'s Farm` : "My Farm");
  const step4Valid =
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

  // Step 4: initialize with default crops if none exist
  useEffect(() => {
    if (step !== 4) return;
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
    router.replace("/dashboard");
  };

  return (
    <main className="relative flex h-full overflow-y-auto flex-col items-center overflow-x-hidden bg-transparent px-4 pb-10 pt-6 sm:pt-10">
      <FarmBackground />
      <div className="relative z-10 w-full max-w-xl">
        {/* Progress — Carbon & Ember progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-[var(--text-2)]">
            {t("onboarding.stepOf").replace("{step}", String(step))}
          </span>
          <span className="font-mono text-[var(--accent)]">{step}/5</span>
        </div>
        <div
          className="liquid-glass-pill h-2.5 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={step}
          aria-label="Onboarding progress"
        >
          <motion.div
            key={step}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] shadow-[0_0_16px_var(--accent-glow)]"
            initial={{ width: `${((step - 1) / 5) * 100}%` }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="mb-5 mt-3 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              type="button"
              aria-label={`Go to step ${d}`}
              onClick={() => {
                if (d < step) go(d);
              }}
              className={cn(
                "relative h-6 w-6 rounded-full transition-all cursor-pointer",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-1/2 top-1/2 block h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                  d === step
                    ? "w-8 bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
                    : d < step
                      ? "w-2.5 bg-[var(--accent)]/70"
                      : "w-2.5 bg-white/15",
                )}
              />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 64 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -64 * dir }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="liquid-glass-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 sm:p-8"
          >
            {step > 1 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text-2)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--text)] cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("onboarding.back")}
              </button>
            )}

            {/* ============ STEP 1 ============ */}
            {step === 1 && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 160, damping: 14 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 shadow-[0_0_24px_var(--accent-glow)]"
                >
                  <motion.span
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex"
                  >
                    <Sprout className="h-10 w-10 text-[var(--accent)]" />
                  </motion.span>
                </motion.div>
                <h1 className="glow-text mt-5 text-4xl font-extrabold tracking-tight text-[var(--text)]">
                  {t("onboarding.welcomeTitle").includes("Krishi")
                    ? (
                      <>
                        KrishiNethra{" "}
                        <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
                          AI
                        </span>
                      </>
                    )
                    : t("onboarding.welcomeTitle")}
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-2)]">
                  {t("onboarding.welcomeSub")}
                </p>
                <p className="mb-3 mt-7 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-2)]">
                  <Languages className="h-3.5 w-3.5 text-[var(--accent)]" /> {t("onboarding.chooseLanguage")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((l) => {
                    const active = settings.language === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setLanguage(l.code)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-2xl border p-4 transition-all active:scale-[0.97] cursor-pointer",
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_24px_var(--accent-glow)]"
                            : "border-[var(--border)] bg-[var(--surface-2)]/50 hover:border-[var(--accent)]/40",
                        )}
                      >
                        <span className="block text-xl font-extrabold text-[var(--text)]">{l.nativeLabel}</span>
                        <span className="mt-0.5 block text-xs text-[var(--text-2)]">{l.label}</span>
                        {active && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                            <Check className="h-3 w-3" strokeWidth={3} /> ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => go(2)}
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white transition-colors cursor-pointer"
                >
                  {t("onboarding.getStarted")} <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            )}

            {/* ============ STEP 2 ============ */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text)]">{t("onboarding.farmerTitle")}</h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">{t("onboarding.farmerSub")}</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className={labelCls} htmlFor="ob-name">{t("onboarding.fullName")}</label>
                    <div className="relative">
                      <FieldIcon>
                        <User className="h-4 w-4" />
                      </FieldIcon>
                      <input
                        id="ob-name"
                        value={name}
                        onChange={(e) =>
                          updateSettings({ farmProfile: { farmerName: e.target.value.slice(0, 40) } })
                        }
                        placeholder={t("onboarding.fullNamePh")}
                        autoComplete="name"
                        className={cn(inputCls, name && !nameValid && "border-red-400/60")}
                      />
                    </div>
                    {name && !nameValid && (
                      <p className="mt-1.5 text-xs font-semibold text-red-300">{t("onboarding.nameError")}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ob-phone">{t("onboarding.mobile")}</label>
                    <div className="relative">
                      <FieldIcon>
                        <Phone className="h-4 w-4" />
                      </FieldIcon>
                      <div className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 border-r border-[var(--border)] pr-2 text-sm font-bold text-[var(--text-2)]">
                        +91
                      </div>
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
                        className={cn(inputCls, "!pl-24 font-mono tracking-widest", phone && !phoneValid && "border-red-400/60")}
                      />
                    </div>
                    {phone && !phoneValid && (
                      <p className="mt-1.5 text-xs font-semibold text-red-300">{t("onboarding.mobileError")}</p>
                    )}
                  </div>
                  <div>
                    <span className={labelCls}>{t("onboarding.role")}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map((r) => {
                        const active = (profile.role || "Farmer") === r;
                        const label =
                          r === "Farmer"
                            ? t("onboarding.roleFarmer")
                            : r === "Farm Manager"
                              ? t("onboarding.roleManager")
                              : t("onboarding.roleStudent");
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => updateSettings({ farmProfile: { role: r } })}
                            aria-pressed={active}
                            className={cn(
                              "rounded-2xl border px-2 py-3 text-xs font-bold transition-all active:scale-[0.97] cursor-pointer",
                              active
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] shadow-[0_0_16px_var(--accent-glow)]"
                                : "border-[var(--border)] bg-[var(--surface-2)]/50 text-[var(--text-2)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className={labelCls}>{t("onboarding.avatar")}</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => updateSettings({ farmProfile: { avatar: a } })}
                          aria-pressed={(profile.avatar || AVATARS[0]) === a}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl transition-all active:scale-95 cursor-pointer",
                            (profile.avatar || AVATARS[0]) === a
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_16px_var(--accent-glow)]"
                              : "border-[var(--border)] bg-[var(--surface-2)]/50 hover:border-[var(--accent)]/40",
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!step2Valid}
                  onClick={() => go(3)}
                  className={cn(
                    "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all cursor-pointer",
                    step2Valid
                      ? "btn-primary text-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {t("onboarding.continue")} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* ============ STEP 3 ============ */}
            {step === 3 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--text)]">
                  <MapPin className="h-5 w-5 text-[var(--accent)]" /> {t("onboarding.locationTitle")}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">{t("onboarding.locationSub")}</p>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className={cn(
                    "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all active:scale-[0.99] cursor-pointer",
                    locating
                      ? "cursor-wait bg-white/10 text-zinc-400"
                      : "btn-primary text-white",
                  )}
                >
                  <LocateFixed className={cn("h-5 w-5", locating && "animate-spin")} />
                  {locating ? t("onboarding.detecting") : t("onboarding.detectLocation")}
                </button>
                {geoLabel && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-sm font-bold text-[var(--text)]">
                    <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" /> {t("onboarding.detectedOk")}: {geoLabel}
                  </p>
                )}
                {geoDenied && (
                  <p className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                    {t("onboarding.permissionDenied")}
                  </p>
                )}
                <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-widest text-[var(--text-2)]">
                  {t("onboarding.manualTitle")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls} htmlFor="ob-state">{t("onboarding.stateLabel")}</label>
                    <select
                      id="ob-state"
                      value={profile.state || ""}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { state: e.target.value, district: "" } })
                      }
                      className={selectCls}
                    >
                      <option value="" disabled>
                        — {t("onboarding.stateLabel")} —
                      </option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ob-district">{t("onboarding.districtLabel")}</label>
                    {districts ? (
                      <select
                        id="ob-district"
                        value={profile.district || ""}
                        onChange={(e) => updateSettings({ farmProfile: { district: e.target.value } })}
                        className={selectCls}
                      >
                        <option value="" disabled>
                          — {t("onboarding.districtLabel")} —
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
                        placeholder={t("onboarding.districtPh")}
                        className={inputCls}
                      />
                    )}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ob-village">{t("onboarding.villageLabel")}</label>
                    <input
                      id="ob-village"
                      value={profile.village || ""}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { village: e.target.value.slice(0, 60) } })
                      }
                      placeholder={t("onboarding.villagePh")}
                      className={inputCls}
                    />
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-2)]">
                        {t("onboarding.gpsLabel")}:{" "}
                        {profile.location
                          ? `${profile.location.lat.toFixed(4)}, ${profile.location.lng.toFixed(4)}`
                          : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoords((v) => !v);
                          setLatText(profile.location ? String(profile.location.lat) : "");
                          setLonText(profile.location ? String(profile.location.lng) : "");
                        }}
                        className="text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        {t("common.edit")}
                      </button>
                    </div>
                    {editingCoords && (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={latText}
                          onChange={(e) => setLatText(e.target.value)}
                          placeholder="23.0225"
                          inputMode="decimal"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={lonText}
                          onChange={(e) => setLonText(e.target.value)}
                          placeholder="72.5714"
                          inputMode="decimal"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
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
                          className="shrink-0 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-extrabold text-white cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!step3Valid}
                  onClick={() => go(4)}
                  className={cn(
                    "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all cursor-pointer",
                    step3Valid
                      ? "btn-primary text-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {t("onboarding.continue")} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* ============ STEP 4 ============ */}
            {step === 4 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-[var(--text)]">
                  <Tractor className="h-5 w-5 text-[var(--accent)]" /> {t("onboarding.farmTitle")}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">{t("onboarding.farmSub")}</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className={labelCls} htmlFor="ob-farm">{t("onboarding.farmName")}</label>
                    <input
                      id="ob-farm"
                      value={farmNameEffective}
                      onChange={(e) =>
                        updateSettings({ farmProfile: { farmName: e.target.value.slice(0, 40) } })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="ob-size">{t("onboarding.farmSize")}</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FieldIcon>
                          <Ruler className="h-4 w-4" />
                        </FieldIcon>
                        <input
                          id="ob-size"
                          value={String(profile.size ?? 1)}
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
                            if (Number.isFinite(n))
                              updateSettings({ farmProfile: { size: Math.min(10000, Math.max(0, n)) } });
                          }}
                          inputMode="decimal"
                          className={cn(inputCls, "font-mono")}
                        />
                      </div>
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
                        className="w-32 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_20px_var(--accent-glow)] [&>option]:bg-black [&>option]:text-white"
                      >
                        {SIZE_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(
                      [
                        { key: "soilType", label: t("onboarding.soilType"), opts: SOIL_TYPES, icon: <Mountain className="h-4 w-4" /> },
                        { key: "waterSource", label: t("onboarding.waterSource"), opts: WATER_SOURCES, icon: <Droplets className="h-4 w-4" /> },
                        { key: "irrigationMethod", label: t("onboarding.irrigationMethod"), opts: IRRIGATION_METHODS, icon: <Droplets className="h-4 w-4" /> },
                        { key: "powerSource", label: t("onboarding.powerSource"), opts: POWER_SOURCES, icon: <Zap className="h-4 w-4" /> },
                      ] as const
                    ).map((f) => (
                      <div key={f.key}>
                        <label className={labelCls} htmlFor={`ob-${f.key}`}>
                          {f.label}
                        </label>
                        <select
                          id={`ob-${f.key}`}
                          value={(profile[f.key] as string) || f.opts[0]}
                          onChange={(e) =>
                            updateSettings({ farmProfile: { [f.key]: e.target.value } })
                          }
                          className={selectCls}
                        >
                          {f.opts.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className={labelCls}>{t("onboarding.crops")} (120+ Database)</span>
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
                    <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-[11px] font-bold text-[var(--accent)]">
                      Zone: <span className="text-[var(--text)]">Your Farm</span> — automated multi-crop zoning & schedule
                    </p>
                    <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 px-3 py-2 text-[11px] leading-relaxed text-[var(--text-2)]">
                      {HARDWARE_NOTE}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!step4Valid}
                  onClick={() => go(5)}
                  className={cn(
                    "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all cursor-pointer",
                    step4Valid
                      ? "btn-primary text-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {t("onboarding.continue")} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* ============ STEP 5 ============ */}
            {step === 5 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text)]">{t("onboarding.confirmTitle")}</h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">{t("onboarding.confirmSub")}</p>
                <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-3xl border border-[var(--accent)]/30 text-[var(--accent)]">
                      {profile.avatar || "🧑‍🌾"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold text-[var(--text)]">{name || "—"}</p>
                      <p className="truncate text-xs text-[var(--text-2)]">
                        {profile.role || "Farmer"} · +91 {phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="flex items-start gap-2 text-[var(--text)]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      {[profile.village, profile.district, profile.state].filter(Boolean).join(", ") || "—"}
                    </p>
                    <p className="flex items-start gap-2 text-[var(--text)]">
                      <Tractor className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      {farmNameEffective} · {profile.size} {profile.sizeUnit} · {profile.soilType}
                    </p>
                    <p className="flex items-start gap-2 text-[var(--text)]">
                      <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      {profile.waterSource} · {profile.irrigationMethod} · {profile.powerSource}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(profile.crops ?? []).map((c) => {
                      const cropObj = getCrop(c);
                      const label = cropObj ? `${cropObj.en} (${cropObj.hi})` : (mandiById(c)?.crop ?? c);
                      return (
                        <span
                          key={c}
                          className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--text)] shadow-[0_0_8px_var(--accent-glow)]"
                        >
                          🌱 {label}
                        </span>
                      );
                    })}
                  </div>
                  {profile.location && (
                    <p className="mt-3 font-mono text-[11px] text-[var(--text-2)]">
                      {profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
                        <LockKeyhole className="h-4 w-4 text-[var(--accent)]" /> {t("onboarding.pinToggle")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-2)]">{t("onboarding.pinToggleSub")}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pinEnabled}
                      aria-label={t("onboarding.pinToggle")}
                      onClick={() => setPinEnabled((v) => !v)}
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer",
                        pinEnabled ? "bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]" : "bg-white/10",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                          pinEnabled ? "left-6" : "left-1",
                        )}
                      />
                    </button>
                  </div>
                  {pinEnabled && (
                    <div className="mt-3">
                      <p className={labelCls}>{t("onboarding.setPin")}</p>
                      <div className="flex gap-2.5">
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
                            className="h-12 w-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center text-xl font-bold text-[var(--text)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_16px_var(--accent-glow)]"
                            placeholder="•"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white transition-all active:scale-[0.99] cursor-pointer"
                >
                  {t("onboarding.startFarming")}
                </button>
                <p className="mt-3 text-center text-[11px] text-[var(--text-2)]">{t("onboarding.editLater")}</p>
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
      router.replace("/dashboard");
    }
  }, [mounted, onboardingDone, appPinHash, isAuthenticated, router]);

  if (!mounted) {
    return (
      <main className="relative flex h-full items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Wizard />
    </MotionConfig>
  );
}
