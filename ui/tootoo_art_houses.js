/* ============================================================================
 * TooToo Architectural House SVG Scenes (32 New Handcrafted Houses across T2..T9)
 * ----------------------------------------------------------------------------
 * - T2 (4): Outdoor shelters with real day/night + arch shelter zone (420x208)
 * - T3 (4): Handcrafted starter rooms with day/night window (420x208)
 * - T4 (4): Forest & scenic detached cottages with day/night window (420x208)
 * - T5 (4): Hangzhou apartments — 720x208 side-scrolling indoor + outdoor terrace
 * - T6 (4): Hangzhou luxury estates — 720x208 side-scrolling hall + private garden/sky-deck
 * - T7 (4): World Wonder Palaces (420x208 animated cosmic/elemental chambers)
 * - T8 (4): Interstellar Era Stations (420x208 animated deep-space vistas)
 * - T9 (4): Dimensional Sanctuaries (420x208 animated relativistic/clockwork realms)
 * ============================================================================ */
(function (global) {
  "use strict";
  const R = global.TooTooRegistry;
  if (!R) return;

  function skyOf(dp) {
    const phase = (dp && dp.phase) || "day";
    const isNight = phase === "night";
    const isDawn = phase === "dawn";
    const isDusk = phase === "dusk";
    const pal = {
      dawn:  ["#7aa7e8", "#f9c6d3", "#fde2b8"],
      day:   ["#60a5fa", "#bae6fd", "#e0f2fe"],
      dusk:  ["#4338ca", "#f97316", "#fde68a"],
      night: ["#091024", "#1b2848", "#2d3c63"],
    };
    return { phase, isNight, isDawn, isDusk, c: pal[phase] || pal.day };
  }

  function moon(cx, cy, r = 13) {
    return `<g transform="translate(${cx},${cy}) scale(${(r / 14).toFixed(2)})">
      <path d="M4 -13 A14 14 0 1 0 13 6 A10.8 10.8 0 1 1 4 -13 Z" fill="#fef3c7" opacity="0.96" filter="url(#hsGlowSm)"/>
    </g>`;
  }

  function stars(coords) {
    const cls = ["h-twinkle", "h-twinkle-d1", "h-twinkle-d2"];
    return coords.map(([x, y, r, col], i) =>
      `<circle cx="${x}" cy="${y}" r="${r || 1.2}" fill="${col || "#fde68a"}" class="${cls[i % 3]}"/>`
    ).join("");
  }

  function celestialSky(s, x = 350, y = 38, r = 16) {
    if (s.isNight) {
      return `${moon(x, y, r)}${stars([[62,28,1.2],[136,22,1.1,"#fff"],[224,26,1.3],[292,18,1.0,"#cbd5e1"],[392,42,1.1]])}`;
    }
    const sunCol = s.isDusk ? "#fb923c" : "#fde047";
    const clCol = s.isDusk ? "#fed7aa" : "#ffffff";
    return `<circle cx="${x}" cy="${s.isDusk || s.isDawn ? y + 10 : y}" r="${r}" fill="${sunCol}" opacity="0.92" filter="url(#hsGlowMd)"/>
      <g class="h-drift-slow" opacity="0.82">
        <ellipse cx="106" cy="36" rx="28" ry="9.5" fill="${clCol}"/>
        <ellipse cx="126" cy="32" rx="16" ry="7.5" fill="${clCol}"/>
      </g>`;
  }

  // ==================== T2: 4 NEW OUTDOOR SHELTERS ====================

  // 1. 🧱 废弃墙角窝
  R.registerHouseArt("wall_corner", (dp) => {
    const s = skyOf(dp);
    const id = `wc_${s.phase}`;
    const brick1 = s.isNight ? "#5c2c24" : (s.isDusk ? "#8c4235" : "#a64d3e");
    const brick2 = s.isNight ? "#48211b" : (s.isDusk ? "#753529" : "#8f3f32");
    const wood = s.isNight ? "#573921" : "#8c5c34";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 352, 36, 14)}
      <!-- Distant alley fence & weeds -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#2b303a" : "#64748b"}"/>
      <rect x="0" y="146" width="420" height="5" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
      <!-- Weathered red-brick corner ruin wall -->
      <path d="M98 158 L98 62 L132 62 L132 76 L170 76 L170 58 L272 58 L272 158 Z" fill="${brick1}" stroke="#3b1812" stroke-width="1.6"/>
      <g stroke="${brick2}" stroke-width="1.1" opacity="0.72">
        <line x1="100" y1="78" x2="270" y2="78"/><line x1="100" y1="94" x2="270" y2="94"/>
        <line x1="100" y1="110" x2="270" y2="110"/><line x1="100" y1="126" x2="270" y2="126"/>
        <line x1="138" y1="78" x2="138" y2="94"/><line x1="184" y1="58" x2="184" y2="78"/>
        <line x1="226" y1="78" x2="226" y2="94"/><line x1="150" y1="94" x2="150" y2="110"/>
      </g>
      <!-- Cozy slanted timber lean-to awning sheltering arch x=158..262 -->
      <polygon points="146,84 282,66 286,75 148,94" fill="${wood}" stroke="#3d2410" stroke-width="1.5"/>
      <line x1="158" y1="92" x2="158" y2="162" stroke="${wood}" stroke-width="4.2"/>
      <line x1="262" y1="78" x2="262" y2="162" stroke="${wood}" stroke-width="4.2"/>
      <!-- Sheltered warm nook inside corner -->
      <rect x="160" y="90" width="100" height="72" fill="${s.isNight ? "#422c1d" : "#754c33"}" opacity="0.92"/>
      <rect x="160" y="148" width="100" height="16" fill="${s.isNight ? "#6e5641" : "#b89b7a"}"/>
      ${s.isNight ? `<circle cx="210" cy="108" r="28" fill="#fbbf24" opacity="0.22" filter="url(#hsGlowMd)"/>
        <circle cx="210" cy="96" r="4" fill="#fef08a" filter="url(#hsGlowSm)"/>` : ""}
      <!-- Alley ivy & dandelion tufts -->
      <path d="M104 64 Q112 82 106 102 Q114 114 108 128" stroke="${s.isNight ? "#14532d" : "#22c55e"}" stroke-width="2" fill="none"/>
      <circle cx="110" cy="80" r="3.5" fill="${s.isNight ? "#15803d" : "#4ade80"}"/>
      <circle cx="107" cy="98" r="3.2" fill="${s.isNight ? "#166534" : "#22c55e"}"/>
      <path d="M312 160 Q316 142 322 160 M322 160 Q328 140 334 160" stroke="${s.isNight ? "#166534" : "#4ade80"}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="322" cy="141" r="3" fill="#fde047"/>
      <circle cx="332" cy="146" r="2.2" fill="#f8fafc" class="h-float-slow"/>
    `;
  });

  // 2. 🌿 蓬松小草堆
  R.registerHouseArt("hay_pile", (dp) => {
    const s = skyOf(dp);
    const id = `hp_${s.phase}`;
    const hay1 = s.isNight ? "#785a1c" : (s.isDusk ? "#d9922b" : "#facc15");
    const hay2 = s.isNight ? "#594112" : (s.isDusk ? "#b46f18" : "#eab308");
    const hill = s.isNight ? "#14532d" : (s.isDusk ? "#4d7c4f" : "#86efac");
    const hill2 = s.isNight ? "#0f3d21" : (s.isDusk ? "#3f6a42" : "#4ade80");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="62%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_hay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hay1}"/><stop offset="100%" stop-color="${hay2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 344, 38, 17)}
      <path d="M0 144 Q120 124 240 142 Q336 154 420 132 L420 208 L0 208 Z" fill="${hill}"/>
      <path d="M0 158 Q210 144 420 160 L420 208 L0 208 Z" fill="${hill2}" opacity="0.84"/>
      <!-- Wooden pasture fence in distance -->
      <g stroke="${s.isNight ? "#422712" : "#8b5d33"}" stroke-width="2.2" opacity="0.72">
        <line x1="20" y1="126" x2="118" y2="132"/><line x1="20" y1="138" x2="118" y2="144"/>
        <line x1="34" y1="120" x2="34" y2="152"/><line x1="76" y1="123" x2="76" y2="154"/><line x1="112" y1="126" x2="112" y2="156"/>
      </g>
      <!-- Giant fluffy golden haystack mound -->
      <ellipse cx="210" cy="166" rx="108" ry="13" fill="#052e16" opacity="0.26"/>
      <path d="M108 164 C112 96 154 46 210 42 C266 46 308 96 312 164 Z" fill="url(#${id}_hay)" stroke="${s.isNight ? "#422006" : "#a16207"}" stroke-width="1.8"/>
      <!-- Fluffy straw tuft strokes -->
      <g stroke="${s.isNight ? "#a16207" : "#fef08a"}" stroke-width="1.4" stroke-linecap="round" opacity="0.7">
        <path d="M138 112 L152 94 M160 80 L176 62 M242 64 L258 84 M270 100 L286 118"/>
        <path d="M122 142 L134 128 M286 132 L298 146 M192 54 L206 46 M220 48 L234 58"/>
      </g>
      <!-- Cozy carved haystack arch shelter x=162..258 -->
      <path d="M162 164 L162 108 A48 46 0 0 1 258 108 L258 164 Z" fill="#5c3812"/>
      <path d="M168 164 L168 112 A42 40 0 0 1 252 112 L252 164 Z" fill="${s.isNight ? "#fde68a" : "#fef9c3"}"/>
      <rect x="168" y="152" width="84" height="12" fill="#d9a54c"/>
      ${s.isNight ? `<circle cx="210" cy="108" r="24" fill="#fbbf24" opacity="0.28" filter="url(#hsGlowSm)"/>
        <circle cx="82" cy="122" r="1.8" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
        <circle cx="348" cy="128" r="1.7" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>` : `
        <circle cx="88" cy="110" r="2.2" fill="#fff" opacity="0.82" class="h-float"/>
        <circle cx="332" cy="104" r="2" fill="#fff" opacity="0.75" class="h-float-slow"/>`}
    `;
  });

  // 3. 🪨 苔藓石头堆
  R.registerHouseArt("moss_rocks", (dp) => {
    const s = skyOf(dp);
    const id = `mr_${s.phase}`;
    const stone1 = s.isNight ? "#475569" : "#94a3b8";
    const stone2 = s.isNight ? "#334155" : "#64748b";
    const moss = s.isNight ? "#15803d" : "#22c55e";
    const water = s.isNight ? "#1e3a5f" : "#38bdf8";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 348, 36, 15)}
      <!-- Forest bank & sparkling creek -->
      <path d="M0 138 Q128 118 260 138 Q340 148 420 128 L420 208 L0 208 Z" fill="${s.isNight ? "#134e4a" : "#4ade80"}"/>
      <path d="M0 166 Q104 156 210 168 Q326 180 420 162 L420 208 L0 208 Z" fill="${s.isNight ? "#1e293b" : "#86efac"}"/>
      <path d="M294 176 Q356 168 420 176 L420 208 L266 208 Z" fill="${water}" opacity="0.72"/>
      <line x1="316" y1="186" x2="366" y2="186" stroke="#e0f2fe" stroke-width="1.2" opacity="0.7" class="h-drift"/>
      <line x1="342" y1="196" x2="394" y2="196" stroke="#e0f2fe" stroke-width="1" opacity="0.6" class="h-drift-slow"/>
      <!-- Stacked mossy river-boulder arch cave -->
      <ellipse cx="210" cy="166" rx="104" ry="12" fill="#0f172a" opacity="0.32"/>
      <ellipse cx="144" cy="134" rx="44" ry="34" fill="${stone2}" stroke="#1e293b" stroke-width="1.6"/>
      <ellipse cx="276" cy="134" rx="44" ry="34" fill="${stone2}" stroke="#1e293b" stroke-width="1.6"/>
      <ellipse cx="210" cy="76" rx="82" ry="34" fill="${stone1}" stroke="#1e293b" stroke-width="1.7"/>
      <!-- Lush emerald moss cap blankets -->
      <path d="M138 66 Q172 44 210 52 Q248 44 282 66 Q266 76 244 70 Q210 80 176 70 Q154 76 138 66 Z" fill="${moss}" opacity="0.92"/>
      <ellipse cx="128" cy="112" rx="18" ry="8" fill="${moss}" opacity="0.88"/>
      <ellipse cx="290" cy="112" rx="18" ry="8" fill="${moss}" opacity="0.88"/>
      <!-- Cozy warm inner stone shelter x=164..256 -->
      <path d="M164 164 L164 106 A46 42 0 0 1 256 106 L256 164 Z" fill="#1e293b"/>
      <path d="M170 164 L170 110 A40 38 0 0 1 250 110 L250 164 Z" fill="${s.isNight ? "#fef08a" : "#f1f5f9"}" opacity="${s.isNight ? "0.86" : "0.95"}"/>
      <rect x="170" y="152" width="80" height="12" fill="#94a3b8"/>
      <!-- Glowing firefly moss spores -->
      <circle cx="152" cy="86" r="2" fill="#86efac" filter="url(#hsGlowSm)" class="h-twinkle"/>
      <circle cx="268" cy="82" r="2" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
      <circle cx="210" cy="94" r="2.2" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d2"/>
    `;
  });

  // 4. 🍄 野生大蘑菇棚
  R.registerHouseArt("giant_mushroom", (dp) => {
    const s = skyOf(dp);
    const id = `gm_${s.phase}`;
    const cap1 = s.isNight ? "#991b1b" : "#ef4444";
    const cap2 = s.isNight ? "#7f1d1d" : "#dc2626";
    const stem = s.isNight ? "#d6cbb8" : "#fffbeb";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${cap1}"/><stop offset="100%" stop-color="${cap2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 354, 34, 15)}
      <!-- Fairy woodland silhouette & fern ground -->
      <path d="M0 140 Q108 118 210 138 Q318 152 420 128 L420 208 L0 208 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <path d="M0 158 Q210 148 420 160 L420 208 L0 208 Z" fill="${s.isNight ? "#052e16" : "#22c55e"}" opacity="0.85"/>
      <!-- Giant Fairy Mushroom Stem & Under-gills -->
      <ellipse cx="210" cy="167" rx="96" ry="12" fill="#052e16" opacity="0.28"/>
      <path d="M144 164 Q152 118 154 88 L266 88 Q268 118 276 164 Z" fill="${stem}" stroke="#92400e" stroke-width="1.6"/>
      <ellipse cx="210" cy="88" rx="108" ry="16" fill="#fde68a" stroke="#92400e" stroke-width="1.3"/>
      <!-- Giant Spotted Crimson Mushroom Umbrella Canopy -->
      <path d="M96 90 C104 28 156 18 210 18 C264 18 316 28 324 90 Q210 102 96 90 Z" fill="url(#${id}_cap)" stroke="#7f1d1d" stroke-width="1.8"/>
      <!-- Iconic cream polka dots -->
      <ellipse cx="150" cy="54" rx="14" ry="10" fill="#fffbeb" opacity="0.92" transform="rotate(-14 150 54)"/>
      <ellipse cx="212" cy="40" rx="16" ry="11" fill="#fffbeb" opacity="0.95"/>
      <ellipse cx="272" cy="56" rx="13" ry="9.5" fill="#fffbeb" opacity="0.92" transform="rotate(14 272 56)"/>
      <circle cx="182" cy="70" r="7.5" fill="#fffbeb" opacity="0.88"/>
      <circle cx="242" cy="72" r="7" fill="#fffbeb" opacity="0.88"/>
      <circle cx="122" cy="76" r="6" fill="#fffbeb" opacity="0.84"/>
      <circle cx="298" cy="76" r="6" fill="#fffbeb" opacity="0.84"/>
      <!-- Sheltered warm mushroom arch interior x=158..262 -->
      <path d="M164 164 L164 114 A46 40 0 0 1 256 114 L256 164 Z" fill="#78350f"/>
      <path d="M170 164 L170 118 A40 36 0 0 1 250 118 L250 164 Z" fill="${s.isNight ? "#fef08a" : "#fef3c7"}"/>
      <rect x="170" y="152" width="80" height="12" fill="#d6b286"/>
      <!-- Drifting glowing fairy spores -->
      <circle cx="114" cy="118" r="2.2" fill="#fef08a" filter="url(#hsGlowSm)" class="h-float"/>
      <circle cx="312" cy="112" r="2.0" fill="#fbcfe8" filter="url(#hsGlowSm)" class="h-float-slow"/>
      <circle cx="88" cy="136" r="1.8" fill="#86efac" class="h-twinkle"/>
      <circle cx="338" cy="138" r="1.8" fill="#fde047" class="h-twinkle-d1"/>
    `;
  });

  // ==================== T3: 4 NEW HANDCRAFTED INDOOR ROOMS ====================

  function windowCel(s, cx, cy, r = 8.5) {
    if (s.isNight) {
      return `${moon(cx, cy, r)}${stars([[cx - 38, cy - 4, 1.1], [cx - 22, cy + 6, 0.9, "#fff"], [cx - 8, cy - 8, 1.0]])}`;
    }
    return `<circle cx="${cx}" cy="${s.isDusk || s.isDawn ? cy + 5 : cy}" r="${r}" fill="${s.isDusk ? "#fb923c" : "#fde047"}" filter="url(#hsGlowSm)"/>
      <ellipse cx="${cx - 34}" cy="${cy + 3}" rx="12" ry="4.5" fill="${s.isDusk ? "#fed7aa" : "#fff"}" opacity="0.85" class="h-drift"/>`;
  }

  // 5. 🧺 废旧竹编筐屋
  R.registerHouseArt("bamboo_basket", (dp) => {
    const s = skyOf(dp);
    const w1 = s.isNight ? "#8a6d3b" : "#d4b475";
    const w2 = s.isNight ? "#6e542a" : "#b89352";
    const winSky = s.isNight ? "#111b36" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <rect width="420" height="208" fill="${w1}"/>
      <!-- Woven bamboo dome ribs -->
      <g stroke="${w2}" stroke-width="3.2" opacity="0.55" fill="none">
        <path d="M0 28 H420 M0 52 H420 M0 76 H420 M0 100 H420 M0 124 H420"/>
        <path d="M40 0 Q30 74 42 148 M96 0 Q88 74 96 148 M152 0 Q148 74 152 148 M210 0 V148 M268 0 Q272 74 268 148 M324 0 Q332 74 324 148 M380 0 Q390 74 378 148"/>
      </g>
      <rect x="0" y="0" width="420" height="20" fill="${w2}"/>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#6b5026" : "#a88346"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#5c4018" stroke-width="2.2"/>
      <!-- Cut bamboo lattice window (x=274..356, y=44..104) -->
      <rect x="274" y="44" width="82" height="60" rx="5" fill="${winSky}" stroke="#6e4b1f" stroke-width="3.2"/>
      ${windowCel(s, 336, 58, 7)}
      <path d="M274 96 Q315 84 356 96 L356 104 L274 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="315" y1="44" x2="315" y2="104" stroke="#6e4b1f" stroke-width="2"/>
      <line x1="274" y1="74" x2="356" y2="74" stroke="#6e4b1f" stroke-width="2"/>
      <!-- Hanging dried bamboo tassel ornament -->
      <path d="M74 20 V46" stroke="#78350f" stroke-width="1.6"/>
      <circle cx="74" cy="48" r="5" fill="#dc2626" stroke="#fbbf24" stroke-width="1"/>
      <path d="M71 53 L70 66 M74 53 L74 68 M77 53 L78 66" stroke="#ef4444" stroke-width="1.3"/>
    `;
  });

  // 6. 🪵 工地木板箱屋
  R.registerHouseArt("wood_crate", (dp) => {
    const s = skyOf(dp);
    const p1 = s.isNight ? "#7c5832" : "#c79a63";
    const p2 = s.isNight ? "#5c3f21" : "#9c703e";
    const winSky = s.isNight ? "#111b36" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <rect width="420" height="208" fill="${p1}"/>
      <!-- Horizontal pine crate planks & corner iron brackets -->
      <g stroke="${p2}" stroke-width="1.6">
        <line x1="0" y1="30" x2="420" y2="30"/><line x1="0" y1="60" x2="420" y2="60"/>
        <line x1="0" y1="90" x2="420" y2="90"/><line x1="0" y1="120" x2="420" y2="120"/>
      </g>
      <rect x="0" y="0" width="22" height="148" fill="${p2}"/><rect x="398" y="0" width="22" height="148" fill="${p2}"/>
      <rect x="0" y="0" width="420" height="20" fill="${p2}"/>
      <!-- Wrought-iron industrial corner braces & bolts -->
      <path d="M0 0 H44 V14 H14 V44 H0 Z M420 0 H376 V14 H406 V44 H420 Z" fill="#334155"/>
      <circle cx="8" cy="8" r="2" fill="#94a3b8"/><circle cx="34" cy="7" r="1.6" fill="#94a3b8"/>
      <circle cx="412" cy="8" r="2" fill="#94a3b8"/><circle cx="386" cy="7" r="1.6" fill="#94a3b8"/>
      <!-- Stenciled cargo label -->
      <rect x="46" y="42" width="94" height="34" rx="2" fill="none" stroke="#451a03" stroke-width="1.4" opacity="0.65"/>
      <text x="93" y="57" font-size="8.5" font-family="monospace" font-weight="900" fill="#451a03" text-anchor="middle" opacity="0.78">FRAGILE · 🥕</text>
      <text x="93" y="69" font-size="6.5" font-family="monospace" font-weight="700" fill="#451a03" text-anchor="middle" opacity="0.68">HZ-TECH CARGO</text>
      <!-- Floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#634322" : "#966838"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2.2"/>
      <!-- Industrial steel-frame window (x=274..360, y=42..104) -->
      <rect x="274" y="42" width="86" height="62" rx="3" fill="${winSky}" stroke="#334155" stroke-width="3.2"/>
      ${windowCel(s, 338, 56, 7.5)}
      <path d="M274 96 Q315 84 360 96 L360 104 L274 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="317" y1="42" x2="317" y2="104" stroke="#334155" stroke-width="2"/>
      <line x1="274" y1="73" x2="360" y2="73" stroke="#334155" stroke-width="2"/>
    `;
  });

  // 7. ⛺ 露营帆布帐篷
  R.registerHouseArt("canvas_tent", (dp) => {
    const s = skyOf(dp);
    const id = `ct_${s.phase}`;
    const c1 = s.isNight ? "#a39887" : "#f5efe2";
    const c2 = s.isNight ? "#877c6c" : "#e5dac4";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${c2}"/><stop offset="50%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- Slanted A-frame canvas roof seams -->
      <polygon points="0,0 130,0 0,148" fill="${c2}" opacity="0.65"/>
      <polygon points="420,0 290,0 420,148" fill="${c2}" opacity="0.65"/>
      <line x1="210" y1="0" x2="210" y2="148" stroke="#92400e" stroke-width="2.4" opacity="0.32"/>
      <!-- Warm glamping fairy string lights along ridge -->
      <path d="M24 24 Q118 46 210 20 Q302 46 396 24" fill="none" stroke="#78350f" stroke-width="1.2"/>
      ${[66, 118, 166, 254, 302, 354].map((x, i) => {
        const y = i === 1 || i === 4 ? 34 : 29;
        return `<circle cx="${x}" cy="${y}" r="3" fill="#fef08a" filter="url(#hsGlowSm)" class="${i % 2 ? "h-twinkle" : "h-twinkle-d1"}"/>`;
      }).join("")}
      <!-- Waterproof camping groundsheet floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#3f4e3c" : "#6b8266"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#2d3b2b" stroke-width="2"/>
      <!-- Arched zipped-open tent window overlooking pine hills -->
      <path d="M274 108 L274 68 A41 34 0 0 1 356 68 L356 108 Z" fill="${winSky}" stroke="#92400e" stroke-width="2.6"/>
      ${windowCel(s, 334, 58, 7)}
      <polygon points="282,108 296,82 310,108" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <polygon points="318,108 334,78 350,108" fill="${s.isNight ? "#0f3d21" : "#16a34a"}"/>
    `;
  });

  // 8. 🚐 复古露营面包车
  R.registerHouseArt("vintage_van", (dp) => {
    const s = skyOf(dp);
    const mint1 = s.isNight ? "#3a6e63" : "#6ee7b7";
    const mint2 = s.isNight ? "#275249" : "#34d399";
    const winSky = s.isNight ? "#0f172a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <rect width="420" height="208" fill="${mint1}"/>
      <!-- Wood-slat campervan curved ceiling -->
      <rect x="0" y="0" width="420" height="24" fill="${s.isNight ? "#6e4c2a" : "#c79a63"}"/>
      <line x1="0" y1="8" x2="420" y2="8" stroke="#78350f" stroke-width="1" opacity="0.45"/>
      <line x1="0" y1="16" x2="420" y2="16" stroke="#78350f" stroke-width="1" opacity="0.45"/>
      <!-- Cream mid-cabin trim strip -->
      <rect x="0" y="106" width="420" height="42" fill="${s.isNight ? "#cbd5c8" : "#fefce8"}"/>
      <line x1="0" y1="106" x2="420" y2="106" stroke="${mint2}" stroke-width="3"/>
      <!-- Retro steering wheel silhouette / porthole on left -->
      <circle cx="72" cy="68" r="24" fill="${winSky}" stroke="#f8fafc" stroke-width="3.2"/>
      <path d="M50 76 Q72 68 94 76 L92 86 Q72 94 52 86 Z" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.72"/>
      <!-- Wide panoramic riverfront camper window (x=244..374, y=40..104) -->
      <rect x="244" y="40" width="130" height="64" rx="12" fill="${winSky}" stroke="#f8fafc" stroke-width="3.2"/>
      ${windowCel(s, 344, 56, 8)}
      <path d="M244 88 Q308 76 374 88 L374 104 L244 104 Z" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.72"/>
      <line x1="264" y1="95" x2="314" y2="95" stroke="#fff" stroke-width="1" opacity="0.55" class="h-drift"/>
      <line x1="309" y1="40" x2="309" y2="104" stroke="#f8fafc" stroke-width="2.4"/>
      <!-- Cabin wood deck floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#5c4024" : "#a37544"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ==================== T4: 4 NEW FOREST & SCENIC COTTAGES ====================

  // 9. 🎋 溪畔竹林小筑
  R.registerHouseArt("bamboo_pavilion", (dp) => {
    const s = skyOf(dp);
    const wall = s.isNight ? "#cfc9b8" : "#f5f1e6";
    const bam = s.isNight ? "#2e4f35" : "#4d7c53";
    const winSky = s.isNight ? "#0d1b2a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fce7f3" : "#d1fae5"));
    return `
      <rect width="420" height="208" fill="${wall}"/>
      <!-- Dark bamboo structural posts & ceiling beams -->
      <rect x="0" y="0" width="420" height="20" fill="${bam}"/>
      <rect x="18" y="0" width="12" height="148" fill="${bam}"/>
      <rect x="390" y="0" width="12" height="148" fill="${bam}"/>
      <!-- Zen ink calligraphy scroll on left wall -->
      <rect x="58" y="34" width="38" height="68" rx="2" fill="#fffdf7" stroke="#5c4018" stroke-width="1.6"/>
      <line x1="54" y1="34" x2="100" y2="34" stroke="#5c4018" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="54" y1="102" x2="100" y2="102" stroke="#5c4018" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M76 92 Q78 72 74 52 M75 68 L85 62 M76 76 L66 72" stroke="#1e293b" stroke-width="1.4" fill="none"/>
      <circle cx="84" cy="86" r="2.2" fill="#dc2626"/>
      <!-- Arched bamboo-view window (x=266..356, y=34..108) -->
      <path d="M266 108 L266 64 A45 32 0 0 1 356 64 L356 108 Z" fill="${winSky}" stroke="${bam}" stroke-width="3.2"/>
      ${windowCel(s, 332, 52, 7.5)}
      <!-- Tall swaying emerald bamboo stalks outside -->
      <g stroke="${s.isNight ? "#15803d" : "#16a34a"}" stroke-width="3.2" class="h-drift-slow">
        <line x1="282" y1="42" x2="280" y2="108"/><line x1="298" y1="36" x2="300" y2="108"/>
        <line x1="322" y1="38" x2="320" y2="108"/><line x1="342" y1="46" x2="344" y2="108"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#6e5534" : "#b89660"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#452c10" stroke-width="2"/>
    `;
  });

  // 10. 🛖 莫干山原木屋
  R.registerHouseArt("moganshan_cabin", (dp) => {
    const s = skyOf(dp);
    const log1 = s.isNight ? "#5c3318" : "#9c572b";
    const log2 = s.isNight ? "#422310" : "#783f1c";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <rect width="420" height="208" fill="${log1}"/>
      <!-- Red-cedar horizontal log timber bands -->
      <g stroke="${log2}" stroke-width="2.2">
        <line x1="0" y1="22" x2="420" y2="22"/><line x1="0" y1="44" x2="420" y2="44"/>
        <line x1="0" y1="66" x2="420" y2="66"/><line x1="0" y1="88" x2="420" y2="88"/>
        <line x1="0" y1="110" x2="420" y2="110"/><line x1="0" y1="132" x2="420" y2="132"/>
      </g>
      <!-- Cozy stone hearth fireplace on left-mid wall -->
      <rect x="136" y="76" width="66" height="72" rx="3" fill="${s.isNight ? "#475569" : "#64748b"}" stroke="#334155" stroke-width="1.6"/>
      <rect x="130" y="72" width="78" height="8" rx="2" fill="${log2}"/>
      <path d="M150 148 L150 112 A19 18 0 0 1 188 112 L188 148 Z" fill="#18181b"/>
      <path d="M160 146 Q162 126 169 120 Q174 132 178 124 Q182 138 176 146 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <path d="M164 146 Q168 132 172 130 Q175 140 173 146 Z" fill="#fde047"/>
      <!-- Panoramic mountain pine window (x=256..368, y=34..106) -->
      <rect x="256" y="34" width="112" height="72" rx="4" fill="${winSky}" stroke="#451a03" stroke-width="3.2"/>
      ${windowCel(s, 344, 52, 8.5)}
      <path d="M256 96 L284 68 L314 96 L342 64 L368 96 L368 106 L256 106 Z" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <line x1="312" y1="34" x2="312" y2="106" stroke="#451a03" stroke-width="2.2"/>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#543018" : "#874e26"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#361c0b" stroke-width="2.2"/>
    `;
  });

  // 11. 🌻 向日葵玻璃花房
  R.registerHouseArt("sunflower_glasshouse", (dp) => {
    const s = skyOf(dp);
    const id = `sg_${s.phase}`;
    const frame = s.isNight ? "#cbd5e1" : "#ffffff";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 342, 34, 15)}
      <!-- Blooming sunflower meadow outside glass conservatory -->
      <path d="M0 126 Q140 112 280 128 Q360 134 420 120 L420 148 L0 148 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      ${[58, 128, 256, 308, 362].map((fx, i) => `
        <g transform="translate(${fx}, ${114 + (i % 2) * 8})">
          <line x1="0" y1="0" x2="0" y2="34" stroke="${s.isNight ? "#15803d" : "#16a34a"}" stroke-width="2.4"/>
          <circle cx="0" cy="0" r="9.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.9"/>
          <circle cx="0" cy="0" r="4.6" fill="#78350f"/>
        </g>
      `).join("")}
      <!-- White wrought-iron glass conservatory walls & arched skylight panes -->
      <rect x="0" y="0" width="420" height="148" fill="url(#hsGlassSheen)" opacity="0.55"/>
      <g stroke="${frame}" stroke-width="3" fill="none">
        <line x1="0" y1="22" x2="420" y2="22"/><line x1="0" y1="120" x2="420" y2="120"/>
        <line x1="84" y1="0" x2="84" y2="148"/><line x1="168" y1="0" x2="168" y2="148"/>
        <line x1="252" y1="0" x2="252" y2="148"/><line x1="336" y1="0" x2="336" y2="148"/>
        <path d="M0 22 Q42 4 84 22 Q126 4 168 22 Q210 4 252 22 Q294 4 336 22 Q378 4 420 22"/>
      </g>
      <rect x="0" y="120" width="420" height="28" fill="${s.isNight ? "#b8b2a6" : "#f5f0e6"}"/>
      <!-- Warm terracotta brick conservatory floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#875742" : "#d49a7e"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#7c3d22" stroke-width="2"/>
    `;
  });

  // 12. 🏡 湖畔风车磨坊屋
  R.registerHouseArt("windmill_mill", (dp) => {
    const s = skyOf(dp);
    const wall = s.isNight ? "#c8bfb0" : "#f5efe6";
    const beam = s.isNight ? "#422712" : "#783f1c";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#93c5fd"));
    return `
      <rect width="420" height="208" fill="${wall}"/>
      <!-- European timber-framed ceiling & diagonal braces -->
      <rect x="0" y="0" width="420" height="20" fill="${beam}"/>
      <path d="M0 20 L58 148 M420 20 L362 148 M18 20 V148 M402 20 V148" stroke="${beam}" stroke-width="6" opacity="0.82"/>
      <!-- Stone wainscoting -->
      <rect x="0" y="116" width="420" height="32" fill="${s.isNight ? "#64748b" : "#cbd5e1"}" opacity="0.65"/>
      <!-- Arched lakeside window with live spinning windmill outside! -->
      <path d="M262 110 L262 62 A51 32 0 0 1 364 62 L364 110 Z" fill="${winSky}" stroke="${beam}" stroke-width="3.2"/>
      ${windowCel(s, 286, 52, 7.5)}
      <rect x="262" y="94" width="102" height="16" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.72"/>
      <!-- Rotating European windmill silhouette in lake view -->
      <g transform="translate(332, 68)">
        <polygon points="-6,28 -3,0 3,0 6,28" fill="${s.isNight ? "#334155" : "#92400e"}"/>
        <g class="h-spin-slow">
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#fef3c7" stroke-width="2.4"/>
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#fef3c7" stroke-width="2.4"/>
          <rect x="4" y="-3" width="16" height="5" fill="#fde68a" opacity="0.7"/>
          <rect x="-20" y="-2" width="16" height="5" fill="#fde68a" opacity="0.7"/>
          <rect x="-3" y="-20" width="5" height="16" fill="#fde68a" opacity="0.7"/>
          <rect x="-2" y="4" width="5" height="16" fill="#fde68a" opacity="0.7"/>
        </g>
        <circle cx="0" cy="0" r="2.5" fill="#451a03"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#634224" : "#a87644"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ==================== T5: 4 NEW HANGZHOU APARTMENTS (720x208 SIDE-SCROLLING!) ====================

  // 13. 🏙️ 丽晶国际 (Qianjiang Century City Cyber-Loft + Sky Terrace!)
  R.registerHouseArt("regent_intl", (dp) => {
    const s = skyOf(dp);
    const id = `rg_${s.phase}`;
    const sky = s.isNight ? ["#09091a", "#1e1b4b", "#312e81"] : (s.isDusk ? ["#312e81", "#ec4899", "#fb923c"] : s.c);
    const wall = s.isNight ? "#1e2436" : "#334155";
    const neon1 = "#22d3ee";
    const neon2 = "#f472b6";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="55%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 650, 34, 14)}
      <!-- Qianjiang Century City neon skyline & iconic S-curve twin towers -->
      ${[[234,62,36,86],[280,44,44,104],[332,68,36,80],[440,54,48,94],[498,34,54,114],[560,58,46,90],[614,42,56,106],[676,66,40,82]].map(([bx,by,bw,bh], i) => `
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${s.isNight ? "#0f172a" : "#475569"}" opacity="0.92"/>
        <line x1="${bx}" y1="${by}" x2="${bx + bw}" y2="${by}" stroke="${i % 2 ? neon2 : neon1}" stroke-width="1.8" opacity="${s.isNight || s.isDusk ? "0.95" : "0.45"}"/>
        <rect x="${bx + 8}" y="${by + 12}" width="${bw - 16}" height="4" fill="${i % 2 ? neon1 : "#fde047"}" opacity="${s.isNight ? "0.85" : "0.4"}"/>
        <rect x="${bx + 8}" y="${by + 24}" width="${bw - 16}" height="4" fill="${i % 2 ? neon2 : neon1}" opacity="${s.isNight ? "0.7" : "0.35"}"/>
        <rect x="${bx + 8}" y="${by + 36}" width="${bw - 16}" height="4" fill="#fde047" opacity="${s.isNight ? "0.65" : "0.3"}"/>
      `).join("")}
      <!-- Indoor industrial double-height LOFT wall (x=0..416) -->
      <rect x="0" y="0" width="224" height="148" fill="${wall}"/>
      <rect x="224" y="0" width="192" height="24" fill="#1e293b"/>
      <rect x="376" y="24" width="12" height="124" fill="${wall}"/>
      <!-- Loft mezzanine railing & neon LED strip -->
      <line x1="16" y1="54" x2="212" y2="54" stroke="#64748b" stroke-width="2.4"/>
      <line x1="16" y1="54" x2="212" y2="54" stroke="${neon1}" stroke-width="1" opacity="0.8" filter="url(#hsGlowSm)"/>
      <text x="114" y="42" font-size="9" font-family="monospace" font-weight="900" fill="${neon2}" text-anchor="middle" opacity="0.88">REGENT LOFT · 2F</text>
      <!-- Floor-to-ceiling loft curtain window (x=224..376) + sliding door (x=388..416) -->
      <rect x="224" y="24" width="152" height="124" fill="url(#hsGlassSheen)" stroke="#475569" stroke-width="2.2"/>
      <line x1="300" y1="24" x2="300" y2="148" stroke="#475569" stroke-width="1.6"/>
      <rect x="388" y="24" width="28" height="124" fill="none" stroke="#64748b" stroke-width="2"/>
      <!-- Outdoor glass sky-terrace (x=416..720) with neon bar ledge -->
      <rect x="416" y="114" width="304" height="34" fill="#38bdf8" opacity="0.16"/>
      <line x1="416" y1="114" x2="720" y2="114" stroke="${neon1}" stroke-width="2.4" filter="url(#hsGlowSm)"/>
      <line x1="504" y1="114" x2="504" y2="148" stroke="#64748b" stroke-width="1.8"/>
      <line x1="604" y1="114" x2="604" y2="148" stroke="#64748b" stroke-width="1.8"/>
      <!-- Indoor polished concrete + outdoor dark slate terrace -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#334155" : "#64748b"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#1e293b" : "#475569"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="${neon2}" stroke-width="2.4"/>
      <!-- Terrace neon cocktail table -->
      <g transform="translate(612, 160)">
        <rect x="-20" y="-22" width="40" height="4" rx="2" fill="#0f172a" stroke="${neon1}" stroke-width="1.1"/>
        <line x1="0" y1="-18" x2="0" y2="4" stroke="#64748b" stroke-width="2.6"/>
        <ellipse cx="0" cy="4" rx="12" ry="3" fill="#334155"/>
      </g>
    `;
  });

  // 14. 🏘️ 双云里 (West-Hangzhou Neo-Chinese Low-Density Courtyard Residence, 720px)
  R.registerHouseArt("shuangyunli", (dp) => {
    const s = skyOf(dp);
    const id = `sy_${s.phase}`;
    const wall = s.isNight ? "#dfd6c7" : "#faf5ec";
    const wood = "#5c381c";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 650, 34, 14)}
      <!-- Distant West-Hangzhou hills & gray-tile neo-Chinese gables -->
      <path d="M0 120 Q180 86 360 116 Q540 84 720 112 L720 148 L0 148 Z" fill="${s.isNight ? "#1e3a3a" : "#86efac"}" opacity="0.62"/>
      <g>
        <rect x="466" y="88" width="76" height="60" fill="${s.isNight ? "#94a3b8" : "#f8fafc"}"/>
        <path d="M454 90 Q504 68 554 90 Z" fill="${s.isNight ? "#1e293b" : "#334155"}"/>
        <rect x="576" y="96" width="84" height="52" fill="${s.isNight ? "#94a3b8" : "#f8fafc"}"/>
        <path d="M566 98 Q618 76 670 98 Z" fill="${s.isNight ? "#1e293b" : "#334155"}"/>
      </g>
      <!-- Indoor serene neo-Chinese room (x=0..416) -->
      <rect x="0" y="0" width="224" height="148" fill="${wall}"/>
      <rect x="224" y="0" width="192" height="24" fill="${wood}"/>
      <rect x="374" y="24" width="14" height="124" fill="${wall}"/>
      <!-- Round ink-wash cloud painting on indoor wall -->
      <circle cx="116" cy="70" r="28" fill="#fffdf8" stroke="${wood}" stroke-width="2"/>
      <path d="M96 78 Q112 60 136 74" stroke="#64748b" stroke-width="2" fill="none"/>
      <circle cx="126" cy="58" r="4" fill="#dc2626" opacity="0.8"/>
      <!-- Window & doorway -->
      <rect x="224" y="24" width="150" height="124" fill="url(#hsGlassSheen)" stroke="${wood}" stroke-width="2.2"/>
      <line x1="299" y1="24" x2="299" y2="148" stroke="${wood}" stroke-width="1.6"/>
      <rect x="388" y="24" width="28" height="124" fill="none" stroke="${wood}" stroke-width="2.2"/>
      <!-- Outdoor covered gray-tile veranda & red maple tree (x=416..720) -->
      <path d="M416 0 L720 0 L720 20 Q568 28 416 20 Z" fill="${s.isNight ? "#1e293b" : "#334155"}"/>
      <line x1="416" y1="116" x2="720" y2="116" stroke="${wood}" stroke-width="2.6"/>
      <line x1="510" y1="116" x2="510" y2="148" stroke="${wood}" stroke-width="2"/>
      <line x1="616" y1="116" x2="616" y2="148" stroke="${wood}" stroke-width="2"/>
      <g transform="translate(656, 152)">
        <path d="M0 0 Q-4 -36 4 -72" stroke="#5c381c" stroke-width="4.5" fill="none"/>
        <circle cx="-8" cy="-74" r="18" fill="${s.isNight ? "#991b1b" : "#ef4444"}" opacity="0.9"/>
        <circle cx="12" cy="-68" r="16" fill="${s.isNight ? "#b45309" : "#f97316"}" opacity="0.88"/>
      </g>
      <!-- Floors -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#b8ab96" : "#dfd3be"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="${wood}" stroke-width="3.2"/>
    `;
  });

  // 15. 🌳 西溪北苑 (Xixi Wetland Panoramic Residence, 720px)
  R.registerHouseArt("xixi_beiyuan", (dp) => {
    const s = skyOf(dp);
    const id = `xb_${s.phase}`;
    const wall = s.isNight ? "#dcd5c9" : "#faf7f0";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="58%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 646, 36, 15)}
      <!-- Xixi Wetland reeds, river canal & white egrets -->
      <path d="M0 112 Q180 84 360 108 Q540 82 720 106 L720 148 L0 148 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}" opacity="0.65"/>
      <rect x="0" y="122" width="720" height="26" fill="${s.isNight ? "#1e3a5f" : "#7dd3fc"}" opacity="0.65"/>
      <line x1="464" y1="134" x2="544" y2="134" stroke="#fff" stroke-width="1.1" opacity="0.6" class="h-drift"/>
      <!-- Reed clusters & gliding white egret -->
      <path d="M446 148 Q450 118 456 148 M456 148 Q462 114 468 148 M640 148 Q646 116 652 148" stroke="${s.isNight ? "#166534" : "#15803d"}" stroke-width="2" fill="none"/>
      <path d="M530 62 Q538 56 546 62 Q554 56 562 62" stroke="#ffffff" stroke-width="1.8" fill="none" class="h-drift-slow"/>
      <!-- Indoor bright modern wetland residence (x=0..416) -->
      <rect x="0" y="0" width="220" height="148" fill="${wall}"/>
      <rect x="220" y="0" width="196" height="24" fill="${s.isNight ? "#cfc7ba" : "#ece6da"}"/>
      <rect x="376" y="24" width="12" height="124" fill="${wall}"/>
      <!-- Framed wetland art print -->
      <rect x="64" y="42" width="96" height="56" rx="3" fill="#fff" stroke="#a8a29e" stroke-width="1.8"/>
      <rect x="70" y="48" width="84" height="44" fill="${s.isNight ? "#134e4a" : "#d1fae5"}"/>
      <path d="M70 84 Q112 66 154 84 L154 92 L70 92 Z" fill="#10b981"/>
      <rect x="220" y="24" width="156" height="124" fill="url(#hsGlassSheen)" stroke="#64748b" stroke-width="2"/>
      <line x1="298" y1="24" x2="298" y2="148" stroke="#64748b" stroke-width="1.5"/>
      <rect x="388" y="24" width="28" height="124" fill="none" stroke="#475569" stroke-width="2"/>
      <!-- Outdoor glass-and-teak wetland deck (x=416..720) -->
      <rect x="416" y="116" width="304" height="32" fill="#e0f2fe" opacity="0.22"/>
      <line x1="416" y1="116" x2="720" y2="116" stroke="#78350f" stroke-width="2.8"/>
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#b8a993" : "#e5d7be"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#6e4b2a" : "#b88450"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#64748b" stroke-width="3.2"/>
    `;
  });

  // 16. 🏛️ 福鼎家园 (South-Facing Garden Residence with Osmanthus Courtyard, 720px)
  R.registerHouseArt("fuding_jiayuan", (dp) => {
    const s = skyOf(dp);
    const id = `fd_${s.phase}`;
    const wall = s.isNight ? "#e0d6c3" : "#fcf8ef";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="58%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 650, 36, 15)}
      <!-- Landscaped community garden trees & golden osmanthus blossoms -->
      <path d="M0 124 Q180 100 360 122 Q540 96 720 120 L720 148 L0 148 Z" fill="${s.isNight ? "#166534" : "#4ade80"}" opacity="0.72"/>
      <g transform="translate(566, 148)">
        <path d="M0 0 V-56" stroke="#5c381c" stroke-width="5"/>
        <ellipse cx="0" cy="-64" rx="34" ry="20" fill="${s.isNight ? "#15803d" : "#22c55e"}"/>
        <circle cx="-14" cy="-66" r="2.4" fill="#facc15"/><circle cx="6" cy="-72" r="2.6" fill="#fde047"/>
        <circle cx="18" cy="-62" r="2.2" fill="#facc15"/><circle cx="-4" cy="-58" r="2.4" fill="#fde047"/>
      </g>
      <!-- Indoor classical wainscot living hall (x=0..416) -->
      <rect x="0" y="0" width="218" height="148" fill="${wall}"/>
      <rect x="218" y="0" width="198" height="24" fill="${s.isNight ? "#cfc2a9" : "#efe5d1"}"/>
      <rect x="376" y="24" width="12" height="124" fill="${wall}"/>
      <!-- Classical wall molding frames -->
      <rect x="28" y="34" width="76" height="82" rx="2" fill="none" stroke="#c8b698" stroke-width="1.6"/>
      <rect x="118" y="34" width="76" height="82" rx="2" fill="none" stroke="#c8b698" stroke-width="1.6"/>
      <rect x="218" y="24" width="158" height="124" fill="url(#hsGlassSheen)" stroke="#8c7a62" stroke-width="2.2"/>
      <line x1="297" y1="24" x2="297" y2="148" stroke="#8c7a62" stroke-width="1.6"/>
      <rect x="388" y="24" width="28" height="124" fill="none" stroke="#78664e" stroke-width="2"/>
      <!-- Outdoor stone balustrade garden terrace (x=416..720) -->
      <line x1="416" y1="118" x2="720" y2="118" stroke="#e2e8f0" stroke-width="3.6"/>
      ${[444, 480, 516, 552, 588, 624, 660, 696].map(bx =>
        `<rect x="${bx}" y="120" width="6" height="28" rx="2" fill="${s.isNight ? "#94a3b8" : "#f1f5f9"}"/>`
      ).join("")}
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#c2b49c" : "#ebe0cc"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#64748b" : "#cbd5e1"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#94a3b8" stroke-width="3.2"/>
    `;
  });

  // ==================== T6: 4 NEW HANGZHOU LUXURY ESTATES (720x208 SIDE-SCROLLING!) ====================

  // 17. 🌿 翡翠城湿地排屋 (French Limestone Townhouse + Private Lawn Gazebo, 720px)
  R.registerHouseArt("feicuicheng", (dp) => {
    const s = skyOf(dp);
    const id = `fc_${s.phase}`;
    const stone = s.isNight ? "#b8b0a2" : "#f5efe4";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="58%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 646, 36, 15)}
      <path d="M0 116 Q180 86 360 112 Q540 84 720 110 L720 148 L0 148 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}" opacity="0.68"/>
      <!-- French clipped boxwood hedge & wrought-iron garden gazebo outside -->
      <rect x="424" y="122" width="296" height="26" rx="8" fill="${s.isNight ? "#15803d" : "#16a34a"}"/>
      <g transform="translate(596, 148)">
        <path d="M-42 -58 Q0 -84 42 -58" fill="none" stroke="#334155" stroke-width="2.4"/>
        <line x1="-36" y1="-58" x2="-36" y2="0" stroke="#334155" stroke-width="2.4"/>
        <line x1="36" y1="-58" x2="36" y2="0" stroke="#334155" stroke-width="2.4"/>
        <circle cx="0" cy="-72" r="3" fill="#fbbf24"/>
      </g>
      <!-- Indoor French arched-glass salon (x=0..416) -->
      <rect x="0" y="0" width="24" height="148" fill="${stone}"/>
      <rect x="0" y="0" width="416" height="24" fill="${stone}"/>
      <rect x="24" y="24" width="360" height="124" fill="url(#hsGlassSheen)" stroke="#b8a890" stroke-width="2.2"/>
      <path d="M24 64 Q84 24 144 64 M144 64 Q204 24 264 64 M264 64 Q324 24 384 64" fill="none" stroke="#b8a890" stroke-width="2"/>
      <line x1="144" y1="24" x2="144" y2="148" stroke="#b8a890" stroke-width="1.8"/>
      <line x1="264" y1="24" x2="264" y2="148" stroke="#b8a890" stroke-width="1.8"/>
      <rect x="384" y="24" width="32" height="124" fill="none" stroke="#9c8a70" stroke-width="2.2"/>
      <!-- Floors: French travertine indoors + private emerald lawn & flagstone patio outdoors -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#bfb6a6" : "#efe8dc"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#15803d" : "#4ade80"}"/>
      <rect x="420" y="152" width="136" height="52" rx="6" fill="${s.isNight ? "#94a3b8" : "#e2e8f0"}" opacity="0.88"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#hsGoldH)" stroke-width="2.6"/>
    `;
  });

  // 18. 🌆 武林壹号天幕平层 (270° Wulin & Grand Canal Sky Penthouse, 720px)
  R.registerHouseArt("wulin_yihao", (dp) => {
    const s = skyOf(dp);
    const id = `wl_${s.phase}`;
    const sky = s.isNight ? ["#060b1c", "#141f3d", "#263159"] : (s.isDusk ? ["#312e81", "#f97316", "#fde68a"] : s.c);
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 648, 32, 15)}
      <!-- Grand Canal golden reflection & Wulin CBD iconic high-rises -->
      <rect x="0" y="126" width="720" height="22" fill="${s.isNight ? "#1e293b" : "#7dd3fc"}" opacity="0.72"/>
      ${[[46,56,42,72],[102,42,50,86],[168,64,44,64],[228,36,56,92],[298,54,48,74],[442,46,54,82],[508,32,62,96],[584,52,52,76],[648,40,56,88]].map(([bx,by,bw,bh], i) => `
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${s.isNight ? "#0f172a" : "#64748b"}" opacity="0.9"/>
        <line x1="${bx + 6}" y1="${by + 12}" x2="${bx + bw - 6}" y2="${by + 12}" stroke="#fde047" stroke-width="2" opacity="${s.isNight || s.isDusk ? "0.88" : "0.35"}"/>
        <line x1="${bx + 6}" y1="${by + 24}" x2="${bx + bw - 6}" y2="${by + 24}" stroke="${i % 2 ? "#38bdf8" : "#fef08a"}" stroke-width="1.8" opacity="${s.isNight || s.isDusk ? "0.78" : "0.3"}"/>
        <line x1="${bx + 6}" y1="${by + 36}" x2="${bx + bw - 6}" y2="${by + 36}" stroke="#fbbf24" stroke-width="1.6" opacity="${s.isNight ? "0.72" : "0.25"}"/>
      `).join("")}
      <!-- Indoor 270-degree frameless champagne-gold penthouse curtain wall (x=0..416) -->
      <rect x="0" y="0" width="416" height="22" fill="#18181b"/>
      <line x1="0" y1="22" x2="416" y2="22" stroke="url(#hsGoldH)" stroke-width="2.2"/>
      <rect x="0" y="22" width="22" height="126" fill="#1e293b"/>
      <rect x="22" y="22" width="364" height="126" fill="url(#hsGlassSheen)" stroke="#334155" stroke-width="1.4"/>
      <line x1="144" y1="22" x2="144" y2="148" stroke="#64748b" stroke-width="1.2" opacity="0.55"/>
      <line x1="266" y1="22" x2="266" y2="148" stroke="#64748b" stroke-width="1.2" opacity="0.55"/>
      <rect x="386" y="22" width="30" height="126" fill="none" stroke="#fbbf24" stroke-width="1.8" opacity="0.72"/>
      <!-- Outdoor sky-deck glass railing & champagne lounge (x=416..720) -->
      <rect x="416" y="116" width="304" height="32" fill="#bae6fd" opacity="0.16"/>
      <line x1="416" y1="116" x2="720" y2="116" stroke="url(#hsGoldH)" stroke-width="2.4"/>
      <!-- Polished dark marble penthouse floor + outdoor sky terrace -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#1e293b" : "#cbd5e1"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#0f172a" : "#94a3b8"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#hsGoldH)" stroke-width="2.8"/>
    `;
  });

  // 19. 🌹 云栖玫瑰园法式庄园 (Wuyun Mountain French Chateau + Rose Pergola, 720px)
  R.registerHouseArt("yunqi_rose", (dp) => {
    const s = skyOf(dp);
    const id = `yr_${s.phase}`;
    const cream = s.isNight ? "#cfc4b2" : "#fdf8ee";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="56%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 646, 36, 15)}
      <!-- Wuyun Mountain misty hills -->
      <path d="M0 108 Q160 66 340 102 Q520 62 720 98 L720 148 L0 148 Z" fill="${s.isNight ? "#134e4a" : "#6ee7b7"}" opacity="0.58"/>
      <!-- Outdoor blooming rose pergola & stone fountain (x=416..720) -->
      <g transform="translate(568, 148)">
        <path d="M-86 0 V-74 Q0 -96 86 -74 V0" fill="none" stroke="${cream}" stroke-width="4.5"/>
        ${[-74,-46,-16,16,46,74].map((rx, i) => `
          <circle cx="${rx}" cy="${-74 - (Math.abs(rx) < 30 ? 8 : 0)}" r="7.5" fill="${i % 2 ? "#e11d48" : "#f472b6"}"/>
          <circle cx="${rx + 5}" cy="${-70 - (Math.abs(rx) < 30 ? 8 : 0)}" r="4.5" fill="#fda4af"/>
        `).join("")}
        <ellipse cx="0" cy="-2" rx="34" ry="8" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.2"/>
        <ellipse cx="0" cy="-3" rx="28" ry="5.5" fill="#38bdf8" opacity="0.82"/>
        <path d="M0 -3 V-28 M0 -26 Q-12 -20 -16 -6 M0 -26 Q12 -20 16 -6" stroke="#bae6fd" stroke-width="1.6" fill="none" stroke-dasharray="4 3" class="h-flow"/>
      </g>
      <!-- Indoor gilded French chateau grand hall (x=0..416) -->
      <rect x="0" y="0" width="24" height="148" fill="${cream}"/>
      <rect x="0" y="0" width="416" height="24" fill="${cream}"/>
      <line x1="0" y1="24" x2="416" y2="24" stroke="url(#hsGoldH)" stroke-width="2"/>
      <rect x="24" y="24" width="360" height="124" fill="url(#hsGlassSheen)" stroke="#d4af37" stroke-width="1.8"/>
      <line x1="144" y1="24" x2="144" y2="148" stroke="#d4af37" stroke-width="1.4" opacity="0.72"/>
      <line x1="264" y1="24" x2="264" y2="148" stroke="#d4af37" stroke-width="1.4" opacity="0.72"/>
      <rect x="384" y="24" width="32" height="124" fill="none" stroke="#d4af37" stroke-width="2"/>
      <!-- Floors -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#c8bba6" : "#f3eadb"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#64748b" : "#e2ddd5"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#hsGoldH)" stroke-width="2.8"/>
    `;
  });

  // 20. 🏯 江南里中式合院 (Canal-Side White-Wall Black-Tile Courtyard & Moon Gate, 720px)
  R.registerHouseArt("jiangnanli", (dp) => {
    const s = skyOf(dp);
    const id = `jn_${s.phase}`;
    const plaster = s.isNight ? "#cbd5e1" : "#ffffff";
    const tile = s.isNight ? "#0f172a" : "#1e293b";
    const rosewood = "#4a1c12";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="56%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 646, 36, 15)}
      <!-- Iconic white-wall black-tile Jiangnan courtyard wall with circular Moon Gate! -->
      <rect x="424" y="54" width="296" height="94" fill="${plaster}"/>
      <path d="M418 56 Q570 42 720 56 L720 44 Q570 30 418 44 Z" fill="${tile}"/>
      <!-- Moon gate opening revealing misty pine & canal garden -->
      <circle cx="576" cy="106" r="36" fill="${s.isNight ? "#134e4a" : "#a7f3d0"}" stroke="${tile}" stroke-width="3.2"/>
      <path d="M542 126 Q576 106 610 126 A36 36 0 0 1 542 126 Z" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.72"/>
      <path d="M556 122 Q566 96 588 86" stroke="#14532d" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="586" cy="84" rx="18" ry="8" fill="#15803d"/>
      <!-- Carved Taihu rock beside moon gate -->
      <path d="M462 148 Q456 116 474 104 Q492 106 488 128 Q496 138 486 148 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}" stroke="#334155" stroke-width="1.2"/>
      <circle cx="474" cy="124" r="4" fill="${plaster}"/>
      <!-- Indoor rosewood Jiangnan grand hall (x=0..416) -->
      <rect x="0" y="0" width="24" height="148" fill="${rosewood}"/>
      <rect x="0" y="0" width="416" height="24" fill="${rosewood}"/>
      <line x1="0" y1="24" x2="416" y2="24" stroke="#f59e0b" stroke-width="1.5" opacity="0.72"/>
      <rect x="24" y="24" width="360" height="124" fill="url(#hsGlassSheen)" stroke="${rosewood}" stroke-width="2.2"/>
      <line x1="144" y1="24" x2="144" y2="148" stroke="${rosewood}" stroke-width="2"/>
      <line x1="264" y1="24" x2="264" y2="148" stroke="${rosewood}" stroke-width="2"/>
      <rect x="384" y="24" width="32" height="124" fill="none" stroke="${rosewood}" stroke-width="2.4"/>
      <!-- Floors: Suzhou gray-gold indoor tiles + outdoor pebble courtyard -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#475569" : "#cbd5e1"}"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#334155" : "#94a3b8"}"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#f59e0b" stroke-width="2.4"/>
    `;
  });

  // ==================== T7: 4 NEW WORLD WONDER PALACES ====================

  // 21. 🌋 熔岩黑曜石堡
  R.registerHouseArt("obsidian_fortress", () => `
    <defs>
      <linearGradient id="ha_ob_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#14070a"/><stop offset="55%" stop-color="#3b0c0c"/><stop offset="100%" stop-color="#7c2d12"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_ob_bg)"/>
    <!-- Flowing twin magma waterfalls -->
    <rect x="64" y="20" width="22" height="128" fill="#ea580c" opacity="0.88" filter="url(#hsGlowSm)"/>
    <line x1="75" y1="20" x2="75" y2="148" stroke="#fef08a" stroke-width="5" stroke-dasharray="12 8" class="h-flow-rev"/>
    <rect x="334" y="20" width="22" height="128" fill="#ea580c" opacity="0.88" filter="url(#hsGlowSm)"/>
    <line x1="345" y1="20" x2="345" y2="148" stroke="#fef08a" stroke-width="5" stroke-dasharray="12 8" class="h-flow-rev"/>
    <!-- Vaulted basalt gothic arches & rune pillars -->
    <path d="M0 0 H420 V42 Q315 16 210 42 Q105 16 0 42 Z" fill="#18121e" stroke="#f59e0b" stroke-width="1.4"/>
    <rect x="118" y="24" width="20" height="124" fill="#1c1917" stroke="#ea580c" stroke-width="1.2"/>
    <rect x="282" y="24" width="20" height="124" fill="#1c1917" stroke="#ea580c" stroke-width="1.2"/>
    <line x1="128" y1="44" x2="128" y2="132" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="6 6" class="h-pulse"/>
    <line x1="292" y1="44" x2="292" y2="132" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="6 6" class="h-pulse"/>
    <!-- Rising volcanic ember sparks -->
    <circle cx="96" cy="112" r="1.8" fill="#fde047" class="h-steam"/>
    <circle cx="210" cy="96" r="2.0" fill="#fb923c" class="h-steam-d1"/>
    <circle cx="316" cy="108" r="1.8" fill="#fef08a" class="h-steam"/>
    <!-- Obsidian glowing basalt bridge floor -->
    <rect x="0" y="148" width="420" height="60" fill="#18181b"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#f97316" stroke-width="2.4" filter="url(#hsGlowSm)"/>
  `);

  // 22. ☁️ 天空之城浮岛宫
  R.registerHouseArt("sky_castle", () => `
    <defs>
      <linearGradient id="ha_sc_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8"/><stop offset="56%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#fffbeb"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_sc_bg)"/>
    <!-- Radiant rainbow sky-arch -->
    <path d="M56 146 A154 118 0 0 1 364 146" fill="none" stroke="url(#hsPrism)" stroke-width="8" opacity="0.45" filter="url(#hsGlowSm)"/>
    <!-- Floating cloud sea -->
    <g class="h-drift-slow" opacity="0.92">
      <ellipse cx="78" cy="128" rx="54" ry="20" fill="#ffffff"/>
      <ellipse cx="210" cy="134" rx="68" ry="22" fill="#ffffff"/>
      <ellipse cx="348" cy="126" rx="56" ry="20" fill="#ffffff"/>
    </g>
    <!-- Winged ivory marble celestial colonnade -->
    <path d="M0 0 H420 V26 Q210 6 0 26 Z" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.6"/>
    <rect x="34" y="20" width="16" height="128" fill="url(#hsIvory)" stroke="#cbd5e1" stroke-width="1"/>
    <rect x="370" y="20" width="16" height="128" fill="url(#hsIvory)" stroke="#cbd5e1" stroke-width="1"/>
    <!-- Floating crystal spires in distance -->
    <polygon points="140,84 148,54 156,84 148,96" fill="#fffdf8" stroke="#fbbf24" stroke-width="1" class="h-float"/>
    <polygon points="264,76 272,46 280,76 272,88" fill="#fffdf8" stroke="#38bdf8" stroke-width="1" class="h-float-slow"/>
    <rect x="0" y="148" width="420" height="60" fill="url(#hsIvory)"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.2"/>
  `);

  // 23. ❄️ 极光冰晶宫殿
  R.registerHouseArt("aurora_ice_palace", () => `
    <defs>
      <linearGradient id="ha_ai_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#041226"/><stop offset="52%" stop-color="#0c3259"/><stop offset="100%" stop-color="#1e5980"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_ai_bg)"/>
    <!-- Dancing emerald & violet Arctic aurora borealis -->
    <g class="h-aurora" filter="url(#hsGlowMd)">
      <path d="M10 48 Q120 12 220 42 Q320 72 410 26" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="22" opacity="0.72"/>
      <path d="M24 68 Q150 32 260 58 Q340 76 404 42" fill="none" stroke="url(#hsAuroraGold)" stroke-width="12" opacity="0.52"/>
    </g>
    <!-- Faceted translucent sapphire crystal cathedral spires -->
    <polygon points="18,148 34,26 52,148" fill="#7dd3fc" fill-opacity="0.34" stroke="#e0f2fe" stroke-width="1.2"/>
    <polygon points="368,148 386,26 402,148" fill="#7dd3fc" fill-opacity="0.34" stroke="#e0f2fe" stroke-width="1.2"/>
    <polygon points="116,148 134,58 152,148" fill="#38bdf8" fill-opacity="0.24" stroke="#bae6fd" stroke-width="1"/>
    <polygon points="268,148 286,58 304,148" fill="#38bdf8" fill-opacity="0.24" stroke="#bae6fd" stroke-width="1"/>
    ${stars([[86,36,1.5,"#e0f2fe"],[194,28,1.6,"#fff"],[326,34,1.5,"#bae6fd"],[246,74,1.3,"#a5f3fc"]])}
    <!-- Mirror glacier ice floor -->
    <rect x="0" y="148" width="420" height="60" fill="#0e3a5c"/>
    <rect x="0" y="148" width="420" height="60" fill="url(#hsGlassSheen)" opacity="0.65"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#7dd3fc" stroke-width="2.2" filter="url(#hsGlowSm)"/>
  `);

  // 24. 🏺 空中花园黄金阁
  R.registerHouseArt("hanging_gardens", () => `
    <defs>
      <linearGradient id="ha_hg_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0ea5e9"/><stop offset="52%" stop-color="#fde68a"/><stop offset="100%" stop-color="#fef3c7"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_hg_bg)"/>
    <!-- Golden stepped Babylonian terraces & aqueduct waterfall -->
    <rect x="0" y="0" width="420" height="26" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.8"/>
    <rect x="34" y="26" width="22" height="122" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.4"/>
    <rect x="364" y="26" width="22" height="122" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.4"/>
    <path d="M138 148 V78 A72 52 0 0 1 282 78 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2"/>
    <!-- Cascading emerald vines & golden blossoms -->
    <g stroke="#15803d" stroke-width="2.6" fill="none" class="h-drift-slow">
      <path d="M74 26 Q68 62 78 96 Q72 118 80 134"/>
      <path d="M104 26 Q112 58 102 90"/>
      <path d="M316 26 Q324 62 314 96 Q320 116 312 132"/>
      <path d="M344 26 Q336 56 346 86"/>
    </g>
    <g fill="#22c55e">
      <circle cx="74" cy="54" r="5"/><circle cx="78" cy="84" r="4.5"/><circle cx="106" cy="60" r="5"/>
      <circle cx="318" cy="56" r="5"/><circle cx="314" cy="88" r="4.5"/><circle cx="342" cy="62" r="5"/>
    </g>
    <circle cx="76" cy="68" r="2.8" fill="#fde047"/><circle cx="316" cy="70" r="2.8" fill="#f472b6"/>
    <!-- Gilded marble floor -->
    <rect x="0" y="148" width="420" height="60" fill="url(#hsIvory)"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
  `);

  // ==================== T8: 4 NEW INTERSTELLAR ERA STATIONS ====================

  // 25. 🌕 月球静海科研舱
  R.registerHouseArt("lunar_base", () => `
    <rect width="420" height="208" fill="#050814"/>
    ${stars([[46,24,1.3,"#fff"],[112,42,1.1],[184,20,1.4,"#bae6fd"],[326,30,1.2,"#fff"],[378,52,1.3]])}
    <!-- Iconic glowing blue Earthrise outside geodesic moon dome! -->
    <g transform="translate(274, 56)" class="h-float-slow">
      <circle cx="0" cy="0" r="30" fill="#2563eb" filter="url(#hsGlowMd)"/>
      <path d="M-18 -10 Q-4 -22 10 -8 Q20 2 8 16 Q-8 22 -16 8 Z" fill="#22c55e" opacity="0.82"/>
      <path d="M-24 2 Q0 -8 24 4" fill="none" stroke="#ffffff" stroke-width="3.2" opacity="0.72" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="30" fill="none" stroke="#93c5fd" stroke-width="1.4" opacity="0.8"/>
    </g>
    <!-- Lunar craters horizon -->
    <path d="M0 122 Q110 108 210 124 Q316 134 420 114 L420 148 L0 148 Z" fill="#64748b"/>
    <ellipse cx="94" cy="134" rx="22" ry="6" fill="#475569"/>
    <ellipse cx="332" cy="130" rx="26" ry="7" fill="#475569"/>
    <!-- Geodesic pressurized titanium dome frame -->
    <path d="M0 148 Q210 -20 420 148" fill="none" stroke="#cbd5e1" stroke-width="2.8" opacity="0.65"/>
    <line x1="120" y1="68" x2="120" y2="148" stroke="#94a3b8" stroke-width="1.8" opacity="0.55"/>
    <line x1="300" y1="68" x2="300" y2="148" stroke="#94a3b8" stroke-width="1.8" opacity="0.55"/>
    <rect x="0" y="148" width="420" height="60" fill="#cbd5e1"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#38bdf8" stroke-width="2.2"/>
  `);

  // 26. 🛰️ 火星红岩生态穹顶
  R.registerHouseArt("mars_dome", () => `
    <defs>
      <linearGradient id="ha_md_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b120e"/><stop offset="56%" stop-color="#9a3412"/><stop offset="100%" stop-color="#ea580c"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_md_sky)"/>
    <circle cx="338" cy="42" r="14" fill="#fde68a" opacity="0.88" filter="url(#hsGlowMd)"/>
    <!-- Crimson Martian Valles Marineris canyon mesas -->
    <path d="M0 116 L54 88 L112 114 L182 80 L248 118 L322 84 L384 114 L420 98 L420 148 L0 148 Z" fill="#7c2d12"/>
    <path d="M0 132 Q140 120 280 134 Q360 138 420 126 L420 148 L0 148 Z" fill="#b45309"/>
    <!-- Mars rover silhouette on pad -->
    <g transform="translate(310, 134)">
      <rect x="-12" y="-8" width="24" height="6" rx="1.5" fill="#e2e8f0"/>
      <line x1="-8" y1="-8" x2="-8" y2="-16" stroke="#cbd5e1" stroke-width="1.5"/>
      <circle cx="-8" cy="-17" r="2.2" fill="#38bdf8"/>
      <circle cx="-8" cy="0" r="3" fill="#1e293b"/><circle cx="0" cy="0" r="3" fill="#1e293b"/><circle cx="8" cy="0" r="3" fill="#1e293b"/>
    </g>
    <!-- Bio-dome glass arches -->
    <path d="M0 148 C34 14 386 14 420 148" fill="url(#hsGlassSheen)" opacity="0.22" stroke="#f8fafc" stroke-width="2.8"/>
    <line x1="210" y1="30" x2="210" y2="148" stroke="#cbd5e1" stroke-width="1.8" opacity="0.5"/>
    <rect x="0" y="148" width="420" height="60" fill="#27272a"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#fb923c" stroke-width="2.2"/>
  `);

  // 27. 🪐 土星冰环观景站
  R.registerHouseArt("saturn_ring_station", () => `
    <defs>
      <linearGradient id="ha_sr_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#050816"/><stop offset="60%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_sr_bg)"/>
    ${stars([[54,28,1.3,"#fff"],[148,22,1.2,"#bae6fd"],[298,26,1.4,"#fde68a"],[374,40,1.2,"#fff"]])}
    <!-- Massive glowing Saturn & sweeping ice-crystal rings right outside window! -->
    <circle cx="294" cy="96" r="46" fill="#f59e0b" opacity="0.88" filter="url(#hsGlowSm)"/>
    <ellipse cx="294" cy="96" rx="164" ry="26" transform="rotate(-14 294 96)" fill="none" stroke="#e0f2fe" stroke-width="9" opacity="0.55"/>
    <ellipse cx="294" cy="96" rx="142" ry="20" transform="rotate(-14 294 96)" fill="none" stroke="#fde68a" stroke-width="3.5" opacity="0.72" stroke-dasharray="18 8" class="h-flow"/>
    <!-- Drifting ice crystal motes -->
    <circle cx="118" cy="108" r="2.2" fill="#e0f2fe" class="h-drift"/>
    <circle cx="196" cy="84" r="1.8" fill="#bae6fd" class="h-drift-slow"/>
    <!-- Platinum orbital station deck frame -->
    <rect x="0" y="0" width="420" height="20" fill="#1e293b"/>
    <line x1="0" y1="20" x2="420" y2="20" stroke="#7dd3fc" stroke-width="1.8"/>
    <rect x="0" y="148" width="420" height="60" fill="#1e293b"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#38bdf8" stroke-width="2.2" filter="url(#hsGlowSm)"/>
  `);

  // 28. ☀️ 戴森球恒星殿
  R.registerHouseArt("dyson_sphere", () => `
    <defs>
      <radialGradient id="ha_ds_star" cx="50%" cy="46%" r="54%">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="28%" stop-color="#fef08a"/><stop offset="62%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#180a02"/>
      </radialGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_ds_star)"/>
    <!-- Pulsing enclosed sun core & monumental 24K golden megastructure rings -->
    <g transform="translate(210, 82)">
      <circle cx="0" cy="0" r="38" fill="#fffbeb" opacity="0.88" filter="url(#hsGlowLg)" class="h-pulse"/>
      <g class="h-spin-slow">
        <ellipse cx="0" cy="0" rx="116" ry="34" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2" stroke-dasharray="22 10"/>
      </g>
      <g class="h-spin-rev">
        <ellipse cx="0" cy="0" rx="84" ry="26" transform="rotate(-18)" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-dasharray="14 8"/>
      </g>
    </g>
    <!-- Hexagonal megastructure obsidian-gold side walls -->
    <polygon points="0,0 74,0 44,148 0,148" fill="#18120e" stroke="url(#hsGoldH)" stroke-width="1.8"/>
    <polygon points="420,0 346,0 376,148 420,148" fill="#18120e" stroke="url(#hsGoldH)" stroke-width="1.8"/>
    <rect x="0" y="148" width="420" height="60" fill="#1c140c"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6" filter="url(#hsGlowSm)"/>
  `);

  // ==================== T9: 4 NEW DIMENSIONAL SANCTUARIES ====================

  // 29. 🔮 量子镜像浮殿
  R.registerHouseArt("quantum_mirror", () => `
    <defs>
      <linearGradient id="ha_qm_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#09071a"/><stop offset="50%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_qm_bg)"/>
    <!-- Non-Euclidean floating geometric prism facets -->
    <g class="h-float-slow" opacity="0.82">
      <polygon points="74,42 118,22 132,74 88,92" fill="#38bdf8" fill-opacity="0.16" stroke="#38bdf8" stroke-width="1.3"/>
      <polygon points="292,26 346,44 330,96 278,78" fill="#c084fc" fill-opacity="0.18" stroke="#c084fc" stroke-width="1.3"/>
    </g>
    <!-- Infinite receding mirror perspective arches -->
    <rect x="128" y="28" width="164" height="120" fill="none" stroke="#38bdf8" stroke-width="1.4" opacity="0.65"/>
    <rect x="156" y="46" width="108" height="84" fill="none" stroke="#c084fc" stroke-width="1.3" opacity="0.72"/>
    <rect x="180" y="62" width="60" height="52" fill="#22d3ee" fill-opacity="0.14" stroke="#f472b6" stroke-width="1.4" class="h-pulse"/>
    <rect x="0" y="148" width="420" height="60" fill="#0d1026"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsPrism)" stroke-width="2.4" filter="url(#hsGlowSm)"/>
  `);

  // 30. ⏳ 时光裂隙钟楼
  R.registerHouseArt("time_clocktower", () => `
    <defs>
      <radialGradient id="ha_tc_bg" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stop-color="#2e1a47"/><stop offset="60%" stop-color="#140c24"/><stop offset="100%" stop-color="#07050f"/>
      </radialGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_tc_bg)"/>
    <!-- Colossal counter-rotating celestial golden clockwork gears! -->
    <g transform="translate(210, 82)">
      <g class="h-spin-slow">
        <circle cx="0" cy="0" r="64" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4"/>
        <circle cx="0" cy="0" r="56" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="6 9" opacity="0.78"/>
        <line x1="-64" y1="0" x2="64" y2="0" stroke="#fbbf24" stroke-width="1.1" opacity="0.55"/>
        <line x1="0" y1="-64" x2="0" y2="64" stroke="#fbbf24" stroke-width="1.1" opacity="0.55"/>
      </g>
      <g class="h-spin-rev">
        <circle cx="0" cy="0" r="36" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="10 6"/>
      </g>
      <!-- Clock hands -->
      <line x1="0" y1="0" x2="0" y2="-40" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="28" y2="14" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="4.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
    </g>
    <circle cx="88" cy="54" r="24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 6" opacity="0.45"/>
    <circle cx="332" cy="54" r="24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 6" opacity="0.45"/>
    <rect x="0" y="148" width="420" height="60" fill="#120c1f"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
  `);

  // 31. 🌠 银河核心星云阁
  R.registerHouseArt("galactic_core", () => `
    <defs>
      <radialGradient id="ha_gc_bg" cx="50%" cy="44%" r="65%">
        <stop offset="0%" stop-color="#10b981"/><stop offset="32%" stop-color="#0f3d4c"/><stop offset="70%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#050816"/>
      </radialGradient>
    </defs>
    <rect width="420" height="208" fill="url(#ha_gc_bg)"/>
    <!-- Swirling galactic spiral arms -->
    <g transform="translate(210, 76)" class="h-spin-slow" opacity="0.65">
      <ellipse cx="0" cy="0" rx="140" ry="38" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="10" filter="url(#hsGlowMd)"/>
      <ellipse cx="0" cy="0" rx="92" ry="26" transform="rotate(24)" fill="none" stroke="url(#hsAuroraGold)" stroke-width="7"/>
    </g>
    <circle cx="210" cy="76" r="16" fill="#ecfdf5" opacity="0.88" filter="url(#hsGlowLg)" class="h-pulse"/>
    <!-- Emerald-gold celestial pavilion eaves -->
    <path d="M0 0 H420 V26 Q315 12 210 24 Q105 12 0 26 Z" fill="#064e3b" stroke="url(#hsGoldH)" stroke-width="1.8"/>
    ${stars([[62,48,1.6,"#fef08a"],[124,62,1.3,"#6ee7b7"],[298,56,1.6,"#fef08a"],[358,44,1.4,"#38bdf8"]])}
    <rect x="0" y="148" width="420" height="60" fill="#071e26"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="#34d399" stroke-width="2.4" filter="url(#hsGlowSm)"/>
  `);

  // 32. 🌀 奇点视界王庭
  R.registerHouseArt("singularity_court", () => `
    <rect width="420" height="208" fill="#05030d"/>
    <!-- Tamed Gargantua-style golden event horizon & relativistic lensing halo -->
    <g transform="translate(210, 78)">
      <ellipse cx="0" cy="0" rx="164" ry="24" fill="none" stroke="#f59e0b" stroke-width="8" opacity="0.72" filter="url(#hsGlowMd)" class="h-pulse"/>
      <ellipse cx="0" cy="0" rx="142" ry="16" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="26 12" class="h-flow"/>
      <circle cx="0" cy="0" r="46" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2" filter="url(#hsGlowSm)"/>
      <circle cx="0" cy="0" r="39" fill="#020106" stroke="#a855f7" stroke-width="1.6"/>
      <path d="M-158 0 Q0 24 158 0" fill="none" stroke="#fde047" stroke-width="3.6" opacity="0.92" filter="url(#hsGlowSm)"/>
    </g>
    <!-- Obsidian-24K-gold imperial court monoliths -->
    <path d="M0 0 H52 L34 148 H0 Z M420 0 H368 L386 148 H420 Z" fill="url(#hsObsidian)" stroke="url(#hsGoldH)" stroke-width="1.8"/>
    <rect x="0" y="148" width="420" height="60" fill="url(#hsObsidian)"/>
    <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6" filter="url(#hsGlowSm)"/>
  `);
})(typeof window !== "undefined" ? window : globalThis);
