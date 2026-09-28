import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "KrishiNethra AI — Stop the guesswork. Start the growth.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0F0B",
          color: "#FAF8F5",
          padding: "48px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Subtle border outline */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
          }}
        />

        {/* Top header mono bar */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "48px",
            right: "48px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#C4503A",
            fontFamily: "monospace",
          }}
        >
          <span>KRISHINETHRA AI // AUTONOMOUS EDGE AGRICULTURE</span>
          <span style={{ color: "#667066" }}>HAR KHET KA AI DOCTOR</span>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#5F8B6A",
            marginBottom: "16px",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#5F8B6A",
            }}
          />
          <span>A PRECISION-AGRICULTURE INTERVENTION</span>
        </div>

        {/* Cream KrishiNethra title */}
        <div
          style={{
            fontSize: "88px",
            fontWeight: 800,
            color: "#FAF8F5",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          KrishiNethra
        </div>

        {/* Terra underline stroke */}
        <div
          style={{
            width: "520px",
            height: "6px",
            backgroundColor: "#C4503A",
            marginTop: "16px",
            marginBottom: "28px",
          }}
        />

        {/* Subline */}
        <div
          style={{
            fontSize: "30px",
            fontWeight: 500,
            color: "#E8E6DF",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>Stop the</span>
          <span style={{ color: "#C4503A", fontStyle: "italic", fontWeight: 700 }}>
            guesswork
          </span>
          <span>. Start the growth.</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "17px",
            color: "#889288",
            marginTop: "12px",
            display: "flex",
          }}
        >
          Offline-first smart farm command center with live sensors &amp; edge irrigation control
        </div>

        {/* Bottom chips */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            fontFamily: "monospace",
            color: "#FAF8F5",
            letterSpacing: "0.1em",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              display: "flex",
            }}
          >
            ESP32 MQTT EDGE
          </div>
          <div
            style={{
              padding: "6px 14px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              display: "flex",
            }}
          >
            ON-DEVICE AGENT
          </div>
          <div
            style={{
              padding: "6px 14px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              display: "flex",
            }}
          >
            OFFLINE-FIRST PWA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
