import * as React from "react";

/**
 * LiquidFilterDefs — the SVG filter bank behind the V2.1 liquid glass system.
 *
 *  #liquid-refraction  feTurbulence + 3× feDisplacementMap (R:-20, G:-24,
 *                      B:-28) channel-split for chromatic aberration,
 *                      preceded by feGaussianBlur stdDeviation 3.
 *  #liquid-gooey       feGaussianBlur 13 + feColorMatrix alpha 13 — merges
 *                      the toggle handle into its track like liquid.
 *  #liquid-distortion  feTurbulence baseFrequency 0.008 + feDisplacementMap
 *                      scale 77 — heavy refractive warp.
 *
 * Rendered once by the root layout so `url(#…)` references resolve
 * document-wide (backdrop-filter and element filter both).
 */
export function LiquidFilterDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* ---- Refraction + chromatic aberration + blur 3 ---- */}
        <filter
          id="liquid-refraction"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.011"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="soft" />
          <feDisplacementMap
            in="soft"
            in2="noise"
            scale="-20"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dR"
          />
          <feDisplacementMap
            in="soft"
            in2="noise"
            scale="-24"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dG"
          />
          <feDisplacementMap
            in="soft"
            in2="noise"
            scale="-28"
            xChannelSelector="R"
            yChannelSelector="G"
            result="dB"
          />
          <feColorMatrix
            in="dR"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chR"
          />
          <feColorMatrix
            in="dG"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="chG"
          />
          <feColorMatrix
            in="dB"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="chB"
          />
          <feComposite
            in="chR"
            in2="chG"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="rg"
          />
          <feComposite
            in="rg"
            in2="chB"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
          />
        </filter>

        {/* ---- Gooey: blur 13 + alpha matrix 13 (liquid morphing) ---- */}
        <filter
          id="liquid-gooey"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 13 -6"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* ---- Distortion: turbulence 0.008 + displacement 77 ---- */}
        <filter
          id="liquid-distortion"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="3"
            seed="5"
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="77"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default LiquidFilterDefs;
