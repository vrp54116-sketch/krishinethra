import sharp from "sharp";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

const width = 1200;
const height = 630;

// SVG representation of canvas:
// bg: #0A0F0B
// cream: #FAF8F5 ("KrishiNethra")
// terra underline stroke: #C4503A
const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&amp;family=Inter:wght@400;700;800&amp;display=swap');
      .mono { font-family: 'IBM Plex Mono', monospace, Courier; }
      .sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>

  <!-- Background #0A0F0B -->
  <rect width="100%" height="100%" fill="#0A0F0B"/>

  <!-- Field grid background lines -->
  <line x1="0" y1="120" x2="1200" y2="120" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="510" x2="1200" y2="510" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="180" y1="0" x2="180" y2="630" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="1020" y1="0" x2="1020" y2="630" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- Outer frame border -->
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Editorial Corner Marks -->
  <path d="M22 28 h12 M28 22 v12" stroke="#C4503A" stroke-width="2"/>
  <path d="M1166 28 h12 M1172 22 v12" stroke="#C4503A" stroke-width="2"/>
  <path d="M22 602 h12 M28 596 v12" stroke="#C4503A" stroke-width="2"/>
  <path d="M1166 602 h12 M1172 596 v12" stroke="#C4503A" stroke-width="2"/>

  <!-- Top Metadata Bar -->
  <text x="60" y="70" class="mono" font-size="12" font-weight="600" fill="#C4503A" letter-spacing="2">FIELD PROTOCOL // KRISHINETHRA AI</text>
  <text x="1140" y="70" class="mono" font-size="12" font-weight="600" fill="#667066" letter-spacing="2" text-anchor="end">SPEC: SOVEREIGN EDGE</text>

  <!-- Eyebrow -->
  <g transform="translate(600, 205)">
    <circle cx="-160" cy="-4" r="3.5" fill="#5F8B6A"/>
    <text x="0" y="0" class="mono" font-size="13" font-weight="600" fill="#5F8B6A" letter-spacing="4" text-anchor="middle">A PRECISION-AGRICULTURE INTERVENTION</text>
  </g>

  <!-- Cream brand title: KrishiNethra -->
  <text x="600" y="315" class="sans" font-size="88" font-weight="800" fill="#FAF8F5" letter-spacing="-2" text-anchor="middle">KrishiNethra</text>

  <!-- Terra underline stroke -->
  <line x1="330" y1="345" x2="870" y2="345" stroke="#C4503A" stroke-width="6" stroke-linecap="square"/>

  <!-- Subtitle -->
  <text x="600" y="415" class="sans" font-size="30" font-weight="400" fill="#E8E6DF" text-anchor="middle">
    Stop the <tspan fill="#C4503A" font-style="italic" font-weight="700">guesswork</tspan>. Start the growth.
  </text>

  <!-- Description -->
  <text x="600" y="465" class="sans" font-size="17" fill="#889288" text-anchor="middle">
    Har Khet Ka AI Doctor — Offline-first edge farm intelligence &amp; autonomous irrigation
  </text>

  <!-- Bottom Chips / Badges -->
  <g transform="translate(600, 545)">
    <!-- Badge 1: MQTT / ESP32 -->
    <rect x="-260" y="-16" width="160" height="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="-180" y="4" class="mono" font-size="11" fill="#FAF8F5" letter-spacing="1" text-anchor="middle">ESP32 + MQTT EDGE</text>

    <!-- Badge 2: LOCAL AGENT -->
    <rect x="-80" y="-16" width="160" height="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="0" y="4" class="mono" font-size="11" fill="#FAF8F5" letter-spacing="1" text-anchor="middle">ON-DEVICE AGENT</text>

    <!-- Badge 3: ZERO CLOUD LOCK -->
    <rect x="100" y="-16" width="160" height="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="180" y="4" class="mono" font-size="11" fill="#FAF8F5" letter-spacing="1" text-anchor="middle">OFFLINE-FIRST PWA</text>
  </g>
</svg>
`;

async function main() {
  const outPath = join(pub, "og-image.png");
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outPath);
  console.log(`Generated ${outPath} (${width}x${height})`);

  const ogCopy = join(pub, "opengraph-image.png");
  copyFileSync(outPath, ogCopy);
  console.log(`Copied to ${ogCopy}`);
}

main().catch(console.error);
