/* ============================================================================
 * TooToo Architectural House SVG Scenes (29 Handcrafted Houses across T2..T9)
 * ----------------------------------------------------------------------------
 * Visually reviewed & harmonised to match the warm storybook / architectural
 * craftsmanship of the flagship scenes (pot, treehole, heanju, xixi, secret).
 * Every scene uses rich multi-stop gradients, organic silhouettes, foreground/
 * midground/background depth, perspective floors, and subtle CSS micro-motion.
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

  function celestialSky(s, x = 350, y = 38, r = 15) {
    if (s.isNight) {
      return `${moon(x, y, r)}${stars([[58,28,1.2],[132,22,1.1,"#fff"],[224,26,1.3],[292,18,1.0,"#cbd5e1"],[392,42,1.1]])}`;
    }
    const sunCol = s.isDusk ? "#fb923c" : "#fde047";
    const clCol = s.isDusk ? "#fed7aa" : "#ffffff";
    return `<circle cx="${x}" cy="${s.isDusk || s.isDawn ? y + 10 : y}" r="${r}" fill="${sunCol}" opacity="0.92" filter="url(#hsGlowMd)"/>
      <g class="h-drift-slow" opacity="0.82">
        <ellipse cx="96" cy="36" rx="28" ry="9" fill="${clCol}"/>
        <ellipse cx="114" cy="32" rx="16" ry="7.5" fill="${clCol}"/>
        <ellipse cx="78" cy="34" rx="14" ry="6.5" fill="${clCol}"/>
      </g>`;
  }

  function windowCel(s, cx, cy, r = 8) {
    if (s.isNight) {
      return `${moon(cx, cy, r)}${stars([[cx - 38, cy - 4, 1.1], [cx - 22, cy + 6, 0.9, "#fff"], [cx - 8, cy - 8, 1.0]])}`;
    }
    return `<circle cx="${cx}" cy="${s.isDusk || s.isDawn ? cy + 4 : cy}" r="${r}" fill="${s.isDusk ? "#fb923c" : "#fde047"}" filter="url(#hsGlowSm)"/>
      <g opacity="0.84" class="h-drift">
        <ellipse cx="${cx - 34}" cy="${cy + 3}" rx="12" ry="4.5" fill="${s.isDusk ? "#fed7aa" : "#fff"}"/>
        <ellipse cx="${cx - 26}" cy="${cy + 1}" rx="7" ry="3.5" fill="${s.isDusk ? "#fed7aa" : "#fff"}"/>
      </g>`;
  }

  function floorPlanks(y0 = 148, x0 = 0, w = 420, col = "#3b220c", op = 0.24) {
    return `<g stroke="${col}" stroke-width="0.9" opacity="${op}">
      <line x1="${x0}" y1="${y0 + 14}" x2="${x0 + w}" y2="${y0 + 14}"/>
      <line x1="${x0}" y1="${y0 + 30}" x2="${x0 + w}" y2="${y0 + 30}"/>
      <line x1="${x0}" y1="${y0 + 47}" x2="${x0 + w}" y2="${y0 + 47}"/>
      <line x1="${x0 + w * 0.2}" y1="${y0}" x2="${x0 + w * 0.14}" y2="${y0 + 60}"/>
      <line x1="${x0 + w * 0.42}" y1="${y0}" x2="${x0 + w * 0.39}" y2="${y0 + 60}"/>
      <line x1="${x0 + w * 0.64}" y1="${y0}" x2="${x0 + w * 0.67}" y2="${y0 + 60}"/>
      <line x1="${x0 + w * 0.84}" y1="${y0}" x2="${x0 + w * 0.9}" y2="${y0 + 60}"/>
    </g>`;
  }

  // ==================== T2: 4 ORGANIC STORYBOOK OUTDOOR SHELTERS ====================

  // 1. 🧱 废弃墙角窝 — L-shaped perspective red-brick corner wall, drainpipe, cozy timber awning & alley details
  R.registerHouseArt("wall_corner", (dp) => {
    const s = skyOf(dp);
    const id = `wc_${s.phase}`;
    const bTop = s.isNight ? "#6e3226" : (s.isDusk ? "#ad4e3b" : "#c9654b");
    const bMid = s.isNight ? "#57261c" : (s.isDusk ? "#8c3d2d" : "#a64b36");
    const bBot = s.isNight ? "#3d1912" : (s.isDusk ? "#6b2b1f" : "#7c3223");
    const wood = s.isNight ? "#634022" : "#9c6838";
    const road1 = s.isNight ? "#333c4d" : (s.isDusk ? "#64616e" : "#8795a8");
    const road2 = s.isNight ? "#1e2430" : (s.isDusk ? "#4a4854" : "#64748b");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_brk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bTop}"/><stop offset="60%" stop-color="${bMid}"/><stop offset="100%" stop-color="${bBot}"/>
        </linearGradient>
        <linearGradient id="${id}_side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${bBot}"/><stop offset="100%" stop-color="${bMid}"/>
        </linearGradient>
        <linearGradient id="${id}_grd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${road1}"/><stop offset="100%" stop-color="${road2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 354, 34, 14)}
      <!-- Distant neighborhood roofline -->
      <path d="M0 146 V116 L24 102 L48 116 V146 Z M354 146 V110 L384 96 L414 110 V146 Z" fill="${s.isNight ? "#1e293b" : "#94a3b8"}" opacity="0.5"/>
      <!-- Alley curb & pavement -->
      <rect x="0" y="144" width="420" height="10" fill="${s.isNight ? "#525e70" : "#cbd5e1"}"/>
      <rect x="0" y="154" width="420" height="54" fill="url(#${id}_grd)"/>
      <g stroke="${s.isNight ? "#1e293b" : "#475569"}" stroke-width="0.9" opacity="0.34">
        <line x1="0" y1="174" x2="420" y2="174"/><line x1="0" y1="194" x2="420" y2="194"/>
        <line x1="68" y1="154" x2="42" y2="208"/><line x1="352" y1="154" x2="378" y2="208"/>
      </g>
      <ellipse cx="196" cy="166" rx="112" ry="11" fill="#0f172a" opacity="0.28"/>
      <!-- L-shaped perspective red-brick corner ruin wall -->
      <polygon points="84,162 84,56 132,46 132,162" fill="url(#${id}_side)" stroke="#4a1e16" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M132 162 V46 H178 V62 H214 V52 H278 V162 Z" fill="url(#${id}_brk)" stroke="#4a1e16" stroke-width="1.5" stroke-linejoin="round"/>
      <g stroke="#5c251c" stroke-width="0.85" opacity="0.45">
        <line x1="132" y1="68" x2="278" y2="68"/><line x1="132" y1="84" x2="278" y2="84"/>
        <line x1="132" y1="100" x2="278" y2="100"/><line x1="132" y1="116" x2="278" y2="116"/>
      </g>
      <!-- Galvanized rainwater drainpipe on left corner -->
      <rect x="128" y="46" width="6" height="114" rx="2" fill="${s.isNight ? "#64748b" : "#94a3b8"}" stroke="#475569" stroke-width="1"/>
      <path d="M134 152 Q140 158 144 160" stroke="${s.isNight ? "#64748b" : "#94a3b8"}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Cozy raised slanted timber lean-to shelter with generous headroom for bunny -->
      <polygon points="134,86 286,98 286,107 134,96" fill="${wood}" stroke="#3d2410" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="138" y1="89" x2="284" y2="101" stroke="#fde68a" stroke-width="0.9" opacity="0.32"/>
      <polygon points="134,96 274,106 274,162 134,162" fill="${s.isNight ? "#26170e" : "#3d2517"}" opacity="0.78"/>
      <!-- Warm hanging alley bulb inside shelter -->
      <line x1="204" y1="100" x2="204" y2="110" stroke="#78350f" stroke-width="1.2"/>
      <circle cx="204" cy="112" r="3.4" fill="#fef08a" filter="url(#hsGlowSm)"/>
      <circle cx="204" cy="118" r="26" fill="#fbbf24" opacity="${s.isNight ? "0.3" : "0.14"}" filter="url(#hsGlowMd)"/>
      <!-- Flattened cardboard floor mat & folded red blanket -->
      <polygon points="146,162 158,150 258,150 266,162" fill="${s.isNight ? "#967652" : "#d6b286"}" stroke="#785028" stroke-width="1"/>
      <rect x="164" y="152" width="42" height="7" rx="2" fill="${s.isNight ? "#991b1b" : "#ef4444"}" opacity="0.86"/>
      <!-- Support post + blue milk-crate side stool -->
      <rect x="268" y="106" width="5.5" height="58" fill="${wood}" stroke="#3d2410" stroke-width="1"/>
      <rect x="294" y="142" width="24" height="20" rx="2" fill="${s.isNight ? "#1d4ed8" : "#3b82f6"}" opacity="0.88" stroke="#1e3a8a" stroke-width="1.1"/>
      <line x1="298" y1="148" x2="314" y2="148" stroke="#bfdbfe" stroke-width="1.2"/>
      <line x1="298" y1="154" x2="314" y2="154" stroke="#bfdbfe" stroke-width="1.2"/>
      <!-- Creeping ivy & alley dandelions -->
      <path d="M96 64 Q108 84 100 106 Q110 122 102 140" stroke="${s.isNight ? "#14532d" : "#15803d"}" stroke-width="2" fill="none"/>
      <circle cx="105" cy="82" r="4" fill="${s.isNight ? "#15803d" : "#22c55e"}"/><circle cx="100" cy="104" r="3.6" fill="${s.isNight ? "#166534" : "#4ade80"}"/><circle cx="106" cy="124" r="3.4" fill="${s.isNight ? "#15803d" : "#22c55e"}"/>
      <path d="M332 162 Q336 146 341 162 M342 162 Q348 142 354 162" stroke="${s.isNight ? "#166534" : "#22c55e"}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="341" cy="146" r="2.6" fill="#fde047"/><circle cx="352" cy="149" r="2.1" fill="#f8fafc" class="h-float-slow"/>
    `;
  });
  R.registerHouseFg("wall_corner", (dp) => {
    const s = skyOf(dp);
    const id = `wc_${s.phase}`;
    const wood = s.isNight ? "#634022" : "#9c6838";
    return `
      <!-- Foreground brick corner edge, upper brick parapet above awning, drainpipe, timber awning roof & front support post -->
      <path d="M132 86 V46 H178 V62 H214 V52 H278 V98 Z" fill="url(#${id}_brk)" stroke="#4a1e16" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="84,162 84,56 132,46 132,162" fill="url(#${id}_side)" stroke="#4a1e16" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="128" y="46" width="6" height="114" rx="2" fill="${s.isNight ? "#64748b" : "#94a3b8"}" stroke="#475569" stroke-width="1"/>
      <path d="M96 64 Q108 84 100 106 Q110 122 102 140" stroke="${s.isNight ? "#14532d" : "#15803d"}" stroke-width="2" fill="none"/>
      <circle cx="105" cy="82" r="4" fill="${s.isNight ? "#15803d" : "#22c55e"}"/><circle cx="100" cy="104" r="3.6" fill="${s.isNight ? "#166534" : "#4ade80"}"/><circle cx="106" cy="124" r="3.4" fill="${s.isNight ? "#15803d" : "#22c55e"}"/>
      <polygon points="134,86 286,98 286,107 134,96" fill="${wood}" stroke="#3d2410" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="138" y1="89" x2="284" y2="101" stroke="#fde68a" stroke-width="0.9" opacity="0.32"/>
      <rect x="268" y="106" width="5.5" height="58" fill="${wood}" stroke="#3d2410" stroke-width="1"/>
    `;
  });

  // 2. 🌿 蓬松小草堆 — Sun-baked fluffy meadow haystack burrow with overhanging straw fringe
  R.registerHouseArt("hay_pile", (dp) => {
    const s = skyOf(dp);
    const id = `hp_${s.phase}`;
    const h1 = s.isNight ? "#967123" : (s.isDusk ? "#f59e0b" : "#fde047");
    const h2 = s.isNight ? "#705216" : (s.isDusk ? "#d97706" : "#eab308");
    const h3 = s.isNight ? "#4a350d" : (s.isDusk ? "#92400e" : "#ca8a04");
    const hill1 = s.isNight ? "#166534" : (s.isDusk ? "#4d7c4f" : "#86efac");
    const hill2 = s.isNight ? "#14532d" : (s.isDusk ? "#3f6a42" : "#4ade80");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <radialGradient id="${id}_hay" cx="44%" cy="28%" r="72%">
          <stop offset="0%" stop-color="${h1}"/><stop offset="56%" stop-color="${h2}"/><stop offset="100%" stop-color="${h3}"/>
        </radialGradient>
        <radialGradient id="${id}_in" cx="50%" cy="62%" r="62%">
          <stop offset="0%" stop-color="${s.isNight ? "#fde68a" : "#fef9c3"}"/><stop offset="72%" stop-color="${s.isNight ? "#b47824" : "#e5bd6c"}"/><stop offset="100%" stop-color="#6b4212"/>
        </radialGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 346, 36, 16)}
      <!-- Rolling sunlit meadow hills -->
      <path d="M0 144 Q116 122 232 142 Q334 154 420 130 L420 208 L0 208 Z" fill="${hill1}"/>
      <path d="M0 160 Q210 146 420 162 L420 208 L0 208 Z" fill="${hill2}" opacity="0.82"/>
      <!-- Rustic pasture fence on left -->
      <g stroke="${s.isNight ? "#422712" : "#925e32"}" stroke-width="2.4" stroke-linecap="round" opacity="0.78">
        <line x1="14" y1="124" x2="112" y2="132"/><line x1="14" y1="136" x2="112" y2="144"/>
        <line x1="28" y1="118" x2="28" y2="152"/><line x1="68" y1="122" x2="68" y2="154"/><line x1="104" y1="126" x2="104" y2="156"/>
      </g>
      <!-- Organic fluffy golden haystack with ruffled silhouette -->
      <ellipse cx="210" cy="167" rx="112" ry="13" fill="#052e16" opacity="0.24"/>
      <path d="M104 164 C104 134 114 102 132 76 C152 48 182 38 210 36 C240 38 270 50 288 78 C306 104 316 134 316 164 Q264 170 210 168 Q156 170 104 164 Z" fill="url(#${id}_hay)" stroke="${h3}" stroke-width="1.7" stroke-linejoin="round"/>
      <!-- Layered straw texture sheaves & sticking-out straw wisps -->
      <g stroke="${h1}" stroke-width="1.5" stroke-linecap="round" opacity="0.72">
        <path d="M132 118 L148 96 M146 84 L166 64 M186 50 L204 42 M224 44 L242 54 M254 66 L274 86 M276 102 L292 122"/>
      </g>
      <g stroke="${h3}" stroke-width="1.2" stroke-linecap="round" opacity="0.45">
        <path d="M118 144 L134 126 M128 156 L142 140 M284 132 L298 148 M274 148 L290 160"/>
      </g>
      <!-- Cozy deeply-recessed warm straw burrow hollow (organic, shaded, fringed top!) -->
      <path d="M160 164 C160 120 176 92 210 90 C244 92 260 120 260 164 Z" fill="#5c3610"/>
      <path d="M167 164 C167 125 182 100 210 98 C238 100 253 125 253 164 Z" fill="url(#${id}_in)"/>
      <rect x="167" y="152" width="86" height="12" fill="#cfa04e"/>
      <!-- Overhanging straw fringe along the burrow brow so it feels naturally carved! -->
      <path d="M162 118 Q174 100 186 108 Q198 92 210 104 Q224 92 236 108 Q248 100 258 118 Q244 102 228 100 Q210 96 192 100 Q176 102 162 118 Z" fill="${h2}" stroke="${h3}" stroke-width="0.9"/>
      <!-- Meadow wildflowers & floating dandelion seeds -->
      <path d="M326 164 Q330 146 336 164 M336 164 Q342 142 348 164" stroke="${s.isNight ? "#14532d" : "#15803d"}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="332" cy="147" r="2.8" fill="#fef08a"/><circle cx="345" cy="146" r="2.5" fill="#f472b6"/>
      <circle cx="78" cy="156" r="2.4" fill="#fffbeb"/><circle cx="88" cy="160" r="2.2" fill="#fde047"/>
      ${s.isNight ? `<circle cx="82" cy="116" r="1.9" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
        <circle cx="348" cy="122" r="1.8" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>` : `
        <circle cx="88" cy="104" r="2.1" fill="#fff" opacity="0.82" class="h-float"/>
        <circle cx="334" cy="98" r="1.9" fill="#fff" opacity="0.76" class="h-float-slow"/>`}
    `;
  });
  R.registerHouseFg("hay_pile", (dp) => {
    const s = skyOf(dp);
    const id = `hp_${s.phase}`;
    const h1 = s.isNight ? "#967123" : (s.isDusk ? "#f59e0b" : "#fde047");
    const h2 = s.isNight ? "#705216" : (s.isDusk ? "#d97706" : "#eab308");
    const h3 = s.isNight ? "#4a350d" : (s.isDusk ? "#92400e" : "#ca8a04");
    return `
      <!-- Foreground haystack shell with burrow arch cut out (evenodd) + overhanging straw brow -->
      <path d="M104 164 C104 134 114 102 132 76 C152 48 182 38 210 36 C240 38 270 50 288 78 C306 104 316 134 316 164 Q264 170 210 168 Q156 170 104 164 Z M167 166 C167 125 182 100 210 98 C238 100 253 125 253 166 Z" fill="url(#${id}_hay)" fill-rule="evenodd"/>
      <path d="M160 165 C160 120 176 92 210 90 C244 92 260 120 260 165 L253 165 C253 125 238 100 210 98 C182 100 167 125 167 165 Z" fill="#5c3610"/>
      <g stroke="${h1}" stroke-width="1.5" stroke-linecap="round" opacity="0.72">
        <path d="M132 118 L148 96 M146 84 L166 64 M186 50 L204 42 M224 44 L242 54 M254 66 L274 86 M276 102 L292 122"/>
      </g>
      <path d="M162 118 Q174 100 186 108 Q198 92 210 104 Q224 92 236 108 Q248 100 258 118 Q244 102 228 100 Q210 96 192 100 Q176 102 162 118 Z" fill="${h2}" stroke="${h3}" stroke-width="0.9"/>
    `;
  });

  // 3. 🪨 苔藓石头堆 — Approved organic 4-boulder mossy grotto with firefly jar & winding pebble creek!
  R.registerHouseArt("moss_rocks", (dp) => {
    const s = skyOf(dp);
    const id = `mr_${s.phase}`;
    const stL = s.isNight ? "#64748b" : (s.isDusk ? "#a8b4bf" : "#bcc8d4");
    const stM = s.isNight ? "#475569" : (s.isDusk ? "#768494" : "#8b9aa8");
    const stD = s.isNight ? "#2b3648" : (s.isDusk ? "#485361" : "#5a6878");
    const moss1 = s.isNight ? "#15803d" : (s.isDusk ? "#58b05c" : "#65c466");
    const moss2 = s.isNight ? "#14532d" : (s.isDusk ? "#2d7a38" : "#228b3b");
    const hill1 = s.isNight ? "#14532d" : (s.isDusk ? "#4d8b55" : "#86efac");
    const hill2 = s.isNight ? "#0f3d21" : (s.isDusk ? "#3a6e42" : "#4ade80");
    const c1 = s.isNight ? "#1e3a5f" : (s.isDusk ? "#5698b8" : "#7dd3fc");
    const c2 = s.isNight ? "#0f2947" : (s.isDusk ? "#fde68a" : "#38bdf8");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <radialGradient id="${id}_rkA" cx="35%" cy="25%" r="75%">
          <stop offset="0%" stop-color="${stL}"/><stop offset="55%" stop-color="${stM}"/><stop offset="100%" stop-color="${stD}"/>
        </radialGradient>
        <radialGradient id="${id}_rkB" cx="65%" cy="28%" r="75%">
          <stop offset="0%" stop-color="${stL}"/><stop offset="55%" stop-color="${stM}"/><stop offset="100%" stop-color="${stD}"/>
        </radialGradient>
        <radialGradient id="${id}_cave" cx="50%" cy="62%" r="65%">
          <stop offset="0%" stop-color="${s.isNight ? "#fde68a" : "#fef08a"}" stop-opacity="${s.isNight ? "0.94" : "0.88"}"/><stop offset="44%" stop-color="${s.isNight ? "#7d5a2e" : "#a37b4b"}"/><stop offset="100%" stop-color="#2b211a"/>
        </radialGradient>
        <linearGradient id="${id}_moss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${moss1}"/><stop offset="100%" stop-color="${moss2}"/>
        </linearGradient>
        <linearGradient id="${id}_brk" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 346, 38, 15)}
      <!-- Distant misty pine ridge & rolling mossy meadow -->
      <path d="M0 132 Q72 108 152 126 Q236 106 318 124 Q374 114 420 122 L420 208 L0 208 Z" fill="${s.isNight ? "#0f2e24" : "#2d4c3e"}" opacity="0.54"/>
      <path d="M0 144 Q118 126 236 142 Q336 150 420 134 L420 208 L0 208 Z" fill="${hill1}"/>
      <path d="M0 162 Q194 148 420 166 L420 208 L0 208 Z" fill="${hill2}" opacity="0.86"/>
      <!-- Natural winding pebble-bordered brook in right midground -->
      <path d="M420 154 C384 156 358 164 342 174 C326 184 334 196 362 208 L420 208 Z" fill="#3e5946" opacity="0.5"/>
      <path d="M420 158 C388 160 364 167 352 176 C340 185 348 195 374 208 L420 208 Z" fill="url(#${id}_brk)" opacity="0.84"/>
      <path d="M366 176 Q386 173 406 177" fill="none" stroke="#fff7ed" stroke-width="1.2" stroke-linecap="round" opacity="0.65" class="h-drift"/>
      <path d="M358 190 Q378 188 398 192" fill="none" stroke="#fff7ed" stroke-width="1" stroke-linecap="round" opacity="0.5" class="h-drift-slow"/>
      <ellipse cx="348" cy="172" rx="7" ry="3.5" fill="${stM}" stroke="${stD}" stroke-width="0.9"/>
      <ellipse cx="338" cy="182" rx="9" ry="4.2" fill="${stL}" stroke="${stD}" stroke-width="0.9"/>
      <ellipse cx="354" cy="196" rx="7.5" ry="3.5" fill="${stM}" stroke="${stD}" stroke-width="0.9"/>
      <!-- Ground contact shadow & deep warm rocky cavern interior -->
      <ellipse cx="206" cy="170" rx="112" ry="12" fill="#172b1c" opacity="0.32"/>
      <path d="M150 166 L160 112 Q208 86 254 114 L264 166 Z" fill="url(#${id}_cave)"/>
      <line x1="234" y1="104" x2="234" y2="118" stroke="#4a3728" stroke-width="1.2"/>
      <rect x="230" y="118" width="8" height="10" rx="3" fill="#fef9c3" stroke="#d97706" stroke-width="0.9" filter="url(#hsGlowSm)"/>
      <circle cx="234" cy="123" r="16" fill="#fef08a" opacity="${s.isNight ? "0.38" : "0.24"}" class="h-pulse"/>
      <ellipse cx="206" cy="164" rx="52" ry="7.5" fill="${s.isNight ? "#52463a" : "#7a6957"}"/>
      <!-- 4 Organic irregular stacked natural boulders forming a rough-hewn grotto -->
      <path d="M104 164 C94 146 98 118 118 106 C138 94 162 100 172 118 C178 130 168 148 164 166 C142 169 116 169 104 164 Z" fill="url(#${id}_rkA)" stroke="#3b4552" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M116 126 Q132 118 148 124 M124 144 Q142 140 154 146" fill="none" stroke="${stD}" stroke-width="1" opacity="0.45"/>
      <path d="M308 164 C318 146 312 116 290 104 C268 92 246 102 242 122 C240 136 248 150 250 166 C272 169 296 169 308 164 Z" fill="url(#${id}_rkB)" stroke="#3b4552" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M262 124 Q280 118 296 128" fill="none" stroke="${stD}" stroke-width="1" opacity="0.42"/>
      <path d="M118 106 C112 80 138 56 184 50 C226 44 274 54 294 78 C306 92 300 110 282 112 C258 114 242 102 212 100 C180 98 164 114 138 114 C124 114 120 110 118 106 Z" fill="url(#${id}_rkA)" stroke="#3b4552" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M154 56 C158 40 184 34 206 42 C218 46 218 56 206 58 C186 62 162 62 154 56 Z" fill="url(#${id}_rkB)" stroke="#3b4552" stroke-width="1.3"/>
      <!-- Lush moss cushions & trailing vines -->
      <path d="M128 84 C140 62 174 52 214 54 C248 56 278 66 286 84 C272 90 258 82 244 88 C228 94 214 82 198 88 C182 94 166 80 150 88 C138 92 132 88 128 84 Z" fill="url(#${id}_moss)" stroke="${moss2}" stroke-width="0.9"/>
      <path d="M108 124 C118 108 136 106 148 114 C138 124 120 128 108 124 Z" fill="url(#${id}_moss)"/>
      <path d="M298 122 C290 108 272 106 260 114 C270 122 288 126 298 122 Z" fill="url(#${id}_moss)"/>
      <path d="M180 99 Q176 114 182 122 M224 100 Q228 112 224 118" stroke="${moss2}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="182" cy="122" r="2.2" fill="#86efac"/><circle cx="224" cy="118" r="2" fill="#86efac"/>
      <path d="M78 166 Q82 146 92 166 M88 166 Q98 142 106 166 M312 166 Q320 148 326 166" stroke="${moss2}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="150" cy="90" r="1.8" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
      <circle cx="272" cy="88" r="1.8" fill="#86efac" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
    `;
  });
  R.registerHouseFg("moss_rocks", (dp) => {
    const s = skyOf(dp);
    const id = `mr_${s.phase}`;
    const stD = s.isNight ? "#2b3648" : (s.isDusk ? "#485361" : "#5a6878");
    const moss2 = s.isNight ? "#14532d" : (s.isDusk ? "#2d7a38" : "#228b3b");
    return `
      <!-- Foreground 4 natural boulders, moss cushions & hanging cave vines occluding bunny inside grotto -->
      <path d="M104 164 C94 146 98 118 118 106 C138 94 162 100 172 118 C178 130 168 148 164 166 C142 169 116 169 104 164 Z" fill="url(#${id}_rkA)" stroke="#3b4552" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M116 126 Q132 118 148 124 M124 144 Q142 140 154 146" fill="none" stroke="${stD}" stroke-width="1" opacity="0.45"/>
      <path d="M308 164 C318 146 312 116 290 104 C268 92 246 102 242 122 C240 136 248 150 250 166 C272 169 296 169 308 164 Z" fill="url(#${id}_rkB)" stroke="#3b4552" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M262 124 Q280 118 296 128" fill="none" stroke="${stD}" stroke-width="1" opacity="0.42"/>
      <path d="M118 106 C112 80 138 56 184 50 C226 44 274 54 294 78 C306 92 300 110 282 112 C258 114 242 102 212 100 C180 98 164 114 138 114 C124 114 120 110 118 106 Z" fill="url(#${id}_rkA)" stroke="#3b4552" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M154 56 C158 40 184 34 206 42 C218 46 218 56 206 58 C186 62 162 62 154 56 Z" fill="url(#${id}_rkB)" stroke="#3b4552" stroke-width="1.3"/>
      <path d="M128 84 C140 62 174 52 214 54 C248 56 278 66 286 84 C272 90 258 82 244 88 C228 94 214 82 198 88 C182 94 166 80 150 88 C138 92 132 88 128 84 Z" fill="url(#${id}_moss)" stroke="${moss2}" stroke-width="0.9"/>
      <path d="M108 124 C118 108 136 106 148 114 C138 124 120 128 108 124 Z" fill="url(#${id}_moss)"/>
      <path d="M298 122 C290 108 272 106 260 114 C270 122 288 126 298 122 Z" fill="url(#${id}_moss)"/>
      <path d="M180 99 Q176 114 182 122 M224 100 Q228 112 224 118" stroke="${moss2}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="182" cy="122" r="2.2" fill="#86efac"/><circle cx="224" cy="118" r="2" fill="#86efac"/>
    `;
  });

  // 4. 🍄 野生大蘑菇棚 — Storybook spotted scarlet mushroom house with warm underside gills & baby mushrooms
  R.registerHouseArt("giant_mushroom", (dp) => {
    const s = skyOf(dp);
    const id = `gm_${s.phase}`;
    const c1 = s.isNight ? "#b91c1c" : "#f87171";
    const c2 = s.isNight ? "#991b1b" : "#ef4444";
    const c3 = s.isNight ? "#6b1414" : "#b91c1c";
    const stem1 = s.isNight ? "#e5dcc8" : "#fffdf5";
    const stem2 = s.isNight ? "#bdb29c" : "#ede3cc";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
        <radialGradient id="${id}_cap" cx="42%" cy="26%" r="72%">
          <stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
        </radialGradient>
        <linearGradient id="${id}_stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${stem2}"/><stop offset="45%" stop-color="${stem1}"/><stop offset="100%" stop-color="${stem2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${celestialSky(s, 354, 34, 15)}
      <!-- Woodland meadow hills -->
      <path d="M0 142 Q108 118 210 138 Q318 152 420 128 L420 208 L0 208 Z" fill="${s.isNight ? "#14532d" : "#86efac"}"/>
      <path d="M0 158 Q210 146 420 160 L420 208 L0 208 Z" fill="${s.isNight ? "#052e16" : "#4ade80"}" opacity="0.86"/>
      <!-- Giant fairy mushroom shadow & tapered sculpted stem -->
      <ellipse cx="210" cy="168" rx="98" ry="12" fill="#052e16" opacity="0.26"/>
      <path d="M142 164 C148 136 154 112 152 90 L268 90 C266 112 272 136 278 164 Z" fill="url(#${id}_stem)" stroke="#8c6844" stroke-width="1.6"/>
      <!-- Warm arched shelter hollow inside mushroom stem (drawn beneath gills & canopy so cap naturally overlaps!) -->
      <path d="M162 164 L162 114 A48 40 0 0 1 258 114 L258 164 Z" fill="#6b3e1b"/>
      <path d="M168 164 L168 118 A42 36 0 0 1 252 118 L252 164 Z" fill="${s.isNight ? "#fef08a" : "#fef3c7"}"/>
      <rect x="168" y="152" width="84" height="12" fill="#d6b286"/>
      <!-- Warm shaded mushroom gills under canopy -->
      <ellipse cx="210" cy="88" rx="112" ry="18" fill="${s.isNight ? "#b89658" : "#fde68a"}" stroke="#92400e" stroke-width="1.3"/>
      <g stroke="#b45309" stroke-width="0.9" opacity="0.42">
        <line x1="128" y1="88" x2="160" y2="96"/><line x1="158" y1="98" x2="180" y2="103"/>
        <line x1="292" y1="88" x2="260" y2="96"/><line x1="262" y1="98" x2="240" y2="103"/>
      </g>
      <!-- Sculpted scarlet mushroom umbrella canopy -->
      <path d="M92 90 C100 26 154 14 210 14 C266 14 320 26 328 90 Q210 104 92 90 Z" fill="url(#${id}_cap)" stroke="#7f1d1d" stroke-width="1.7"/>
      <ellipse cx="148" cy="52" rx="14" ry="9.5" fill="#fffbeb" opacity="0.92" transform="rotate(-16 148 52)"/>
      <ellipse cx="212" cy="36" rx="17" ry="11" fill="#fffbeb" opacity="0.96"/>
      <ellipse cx="274" cy="54" rx="13" ry="9" fill="#fffbeb" opacity="0.92" transform="rotate(15 274 54)"/>
      <circle cx="182" cy="68" r="7.5" fill="#fffbeb" opacity="0.88"/><circle cx="242" cy="70" r="7" fill="#fffbeb" opacity="0.88"/>
      <circle cx="118" cy="74" r="6" fill="#fffbeb" opacity="0.82"/><circle cx="302" cy="74" r="6" fill="#fffbeb" opacity="0.82"/>
      <!-- Adorable baby mushrooms & glowing dew-lanterns hanging from cap rim -->
      <line x1="126" y1="95" x2="126" y2="108" stroke="#92400e" stroke-width="1"/>
      <circle cx="126" cy="110" r="3" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
      <line x1="294" y1="95" x2="294" y2="108" stroke="#92400e" stroke-width="1"/>
      <circle cx="294" cy="110" r="3" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
      <g transform="translate(86, 162)">
        <rect x="-4" y="-12" width="8" height="12" rx="2.5" fill="#fef3c7" stroke="#8c6844" stroke-width="0.9"/>
        <path d="M-11 -11 A11 8 0 0 1 11 -11 Z" fill="${c2}" stroke="#7f1d1d" stroke-width="1"/>
        <circle cx="-3" cy="-15" r="1.5" fill="#fff"/><circle cx="4" cy="-14" r="1.3" fill="#fff"/>
      </g>
      <g transform="translate(332, 162)">
        <rect x="-3.5" y="-10" width="7" height="10" rx="2" fill="#fef3c7" stroke="#8c6844" stroke-width="0.9"/>
        <path d="M-9 -9 A9 7 0 0 1 9 -9 Z" fill="#f59e0b" stroke="#92400e" stroke-width="1"/>
      </g>
    `;
  });
  R.registerHouseFg("giant_mushroom", (dp) => {
    const s = skyOf(dp);
    const id = `gm_${s.phase}`;
    return `
      <!-- Foreground mushroom stem shell (with doorway cut out) + gills + scarlet umbrella cap -->
      <path d="M142 164 C148 136 154 112 152 90 L268 90 C266 112 272 136 278 164 Z M168 165 L168 118 A42 36 0 0 1 252 118 L252 165 Z" fill="url(#${id}_stem)" fill-rule="evenodd"/>
      <path d="M162 164 L162 114 A48 40 0 0 1 258 114 L258 164 L252 164 L252 118 A42 36 0 0 0 168 118 L168 164 Z" fill="#6b3e1b"/>
      <ellipse cx="210" cy="88" rx="112" ry="18" fill="${s.isNight ? "#b89658" : "#fde68a"}" stroke="#92400e" stroke-width="1.3"/>
      <path d="M92 90 C100 26 154 14 210 14 C266 14 320 26 328 90 Q210 104 92 90 Z" fill="url(#${id}_cap)" stroke="#7f1d1d" stroke-width="1.7"/>
      <ellipse cx="148" cy="52" rx="14" ry="9.5" fill="#fffbeb" opacity="0.92" transform="rotate(-16 148 52)"/>
      <ellipse cx="212" cy="36" rx="17" ry="11" fill="#fffbeb" opacity="0.96"/>
      <ellipse cx="274" cy="54" rx="13" ry="9" fill="#fffbeb" opacity="0.92" transform="rotate(15 274 54)"/>
      <circle cx="182" cy="68" r="7.5" fill="#fffbeb" opacity="0.88"/><circle cx="242" cy="70" r="7" fill="#fffbeb" opacity="0.88"/>
      <circle cx="118" cy="74" r="6" fill="#fffbeb" opacity="0.82"/><circle cx="302" cy="74" r="6" fill="#fffbeb" opacity="0.82"/>
    `;
  });

  // ==================== T3: 4 COZY HANDCRAFTED INDOOR ROOMS ====================

  // 5. 🧺 废旧竹编筐屋
  R.registerHouseArt("bamboo_basket", (dp) => {
    const s = skyOf(dp);
    const id = `bb_${s.phase}`;
    const w1 = s.isNight ? "#8a6d3b" : "#dfb978";
    const w2 = s.isNight ? "#694f26" : "#b8904f";
    const winSky = s.isNight ? "#111b36" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${w2}"/><stop offset="32%" stop-color="${w1}"/><stop offset="100%" stop-color="${w2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- Alternating woven bamboo strips -->
      <g stroke="#5c4018" stroke-width="1.3" opacity="0.34" fill="none">
        <path d="M0 24 H420 M0 46 H420 M0 68 H420 M0 90 H420 M0 112 H420 M0 134 H420"/>
        <path d="M36 0 Q26 74 38 148 M92 0 Q84 74 92 148 M148 0 Q144 74 148 148 M210 0 V148 M272 0 Q276 74 272 148 M328 0 Q336 74 328 148 M384 0 Q394 74 382 148"/>
      </g>
      <rect x="0" y="0" width="420" height="20" fill="${w2}" stroke="#5c4018" stroke-width="1"/>
      <!-- Cozy wall herb bundle & red lucky knot on left -->
      <path d="M72 20 V44" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="72" cy="48" r="5.5" fill="#dc2626" stroke="#fbbf24" stroke-width="1.1"/>
      <path d="M69 54 L68 68 M72 54 L72 70 M75 54 L76 68" stroke="#ef4444" stroke-width="1.4" stroke-linecap="round"/>
      <!-- Cut woven bamboo window with sill -->
      <rect x="274" y="44" width="82" height="60" rx="5" fill="${winSky}" stroke="#5c3a14" stroke-width="3.2"/>
      ${windowCel(s, 336, 58, 7)}
      <path d="M274 96 Q315 84 356 96 L356 104 L274 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="315" y1="44" x2="315" y2="104" stroke="#5c3a14" stroke-width="2"/>
      <line x1="274" y1="74" x2="356" y2="74" stroke="#5c3a14" stroke-width="2"/>
      <rect x="268" y="103" width="94" height="5" rx="2" fill="#855828"/>
      <!-- Woven floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#6b5026" : "#b0894a"}"/>
      ${floorPlanks(148, 0, 420, "#452c10", 0.28)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#4a3110" stroke-width="2.2"/>
    `;
  });

  // 6. 🪵 工地木板箱屋
  R.registerHouseArt("wood_crate", (dp) => {
    const s = skyOf(dp);
    const id = `cr_${s.phase}`;
    const p1 = s.isNight ? "#7d5932" : "#cfa26a";
    const p2 = s.isNight ? "#5c3f21" : "#a3743f";
    const winSky = s.isNight ? "#111b36" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${p2}"/><stop offset="45%" stop-color="${p1}"/><stop offset="100%" stop-color="${p2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- Crate planks & diagonal brace -->
      <g stroke="#5c3b1c" stroke-width="1.3" opacity="0.55">
        <line x1="0" y1="30" x2="420" y2="30"/><line x1="0" y1="60" x2="420" y2="60"/>
        <line x1="0" y1="90" x2="420" y2="90"/><line x1="0" y1="120" x2="420" y2="120"/>
      </g>
      <path d="M22 20 L148 148 M22 20 H398" stroke="${p2}" stroke-width="10" opacity="0.45"/>
      <rect x="0" y="0" width="20" height="148" fill="${p2}"/><rect x="400" y="0" width="20" height="148" fill="${p2}"/>
      <rect x="0" y="0" width="420" height="20" fill="${p2}"/>
      <!-- Iron corner brackets & rivets -->
      <path d="M0 0 H46 V14 H14 V46 H0 Z M420 0 H374 V14 H406 V46 H420 Z" fill="#334155"/>
      <circle cx="8" cy="8" r="2" fill="#cbd5e1"/><circle cx="34" cy="7" r="1.6" fill="#cbd5e1"/>
      <circle cx="412" cy="8" r="2" fill="#cbd5e1"/><circle cx="386" cy="7" r="1.6" fill="#cbd5e1"/>
      <!-- Stenciled cargo stamp -->
      <rect x="46" y="42" width="96" height="36" rx="3" fill="rgba(69,26,3,0.06)" stroke="#451a03" stroke-width="1.4" opacity="0.72"/>
      <text x="94" y="57" font-size="8.8" font-family="monospace" font-weight="900" fill="#451a03" text-anchor="middle" opacity="0.82">FRAGILE · 🥕</text>
      <text x="94" y="70" font-size="6.5" font-family="monospace" font-weight="700" fill="#451a03" text-anchor="middle" opacity="0.72">HZ-TECH CARGO</text>
      <!-- Industrial window -->
      <rect x="274" y="42" width="86" height="62" rx="3" fill="${winSky}" stroke="#334155" stroke-width="3.2"/>
      ${windowCel(s, 338, 56, 7.5)}
      <path d="M274 96 Q315 84 360 96 L360 104 L274 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="317" y1="42" x2="317" y2="104" stroke="#334155" stroke-width="2"/>
      <line x1="274" y1="73" x2="360" y2="73" stroke="#334155" stroke-width="2"/>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#634322" : "#9c6d3c"}"/>
      ${floorPlanks(148, 0, 420, "#3b220c", 0.3)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2.2"/>
    `;
  });

  // 7. ⛺ 露营帆布帐篷
  R.registerHouseArt("canvas_tent", (dp) => {
    const s = skyOf(dp);
    const id = `ct_${s.phase}`;
    const c1 = s.isNight ? "#aba08e" : "#faf4e8";
    const c2 = s.isNight ? "#877c6c" : "#e2d5be";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${c2}"/><stop offset="50%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- Slanted A-frame pitched canvas shadows & wooden center pole -->
      <polygon points="0,0 132,0 0,148" fill="${c2}" opacity="0.72"/>
      <polygon points="420,0 288,0 420,148" fill="${c2}" opacity="0.72"/>
      <rect x="206" y="0" width="8" height="148" fill="#8c5a2b" opacity="0.58"/>
      <!-- Warm glamping fairy string bulbs with soft glow halos -->
      <path d="M18 22 Q114 48 210 18 Q306 48 402 22" fill="none" stroke="#78350f" stroke-width="1.3"/>
      ${[[62,31],[114,35],[166,28],[254,28],[306,35],[358,31]].map(([x,y], i) => `
        <circle cx="${x}" cy="${y}" r="8" fill="#fde68a" opacity="0.28"/>
        <circle cx="${x}" cy="${y}" r="3.2" fill="#fef08a" filter="url(#hsGlowSm)" class="${i % 2 ? "h-twinkle" : "h-twinkle-d1"}"/>
      `).join("")}
      <!-- Rolled canvas arched window overlooking layered pine forest -->
      <path d="M274 108 L274 68 A41 34 0 0 1 356 68 L356 108 Z" fill="${winSky}" stroke="#8c5a2b" stroke-width="2.8"/>
      ${windowCel(s, 334, 58, 7)}
      <path d="M274 104 Q306 86 356 100 L356 108 L274 108 Z" fill="${s.isNight ? "#166534" : "#86efac"}"/>
      <polygon points="282,108 296,82 310,108" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <polygon points="318,108 334,76 350,108" fill="${s.isNight ? "#0f3d21" : "#166534"}"/>
      <!-- Groundsheet floor + woven camping mat -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#3f4e3c" : "#6b8266"}"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#2d3b2b" stroke-width="2"/>
    `;
  });

  // 8. 🚐 复古露营面包车
  R.registerHouseArt("vintage_van", (dp) => {
    const s = skyOf(dp);
    const id = `vv_${s.phase}`;
    const mint1 = s.isNight ? "#3a6e63" : "#7ee8c0";
    const mint2 = s.isNight ? "#244a42" : "#34d399";
    const winSky = s.isNight ? "#0f172a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${mint1}"/><stop offset="100%" stop-color="${mint2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_m)"/>
      <!-- Wood-slat ceiling + overhead vintage storage cabinet -->
      <rect x="0" y="0" width="420" height="24" fill="${s.isNight ? "#6e4c2a" : "#c99b63"}"/>
      <line x1="0" y1="8" x2="420" y2="8" stroke="#78350f" stroke-width="1" opacity="0.4"/>
      <line x1="0" y1="16" x2="420" y2="16" stroke="#78350f" stroke-width="1" opacity="0.4"/>
      <rect x="28" y="24" width="136" height="22" rx="3" fill="${s.isNight ? "#5c3e20" : "#b8864b"}" stroke="#78350f" stroke-width="1.2"/>
      <circle cx="72" cy="35" r="2" fill="#fde68a"/><circle cx="122" cy="35" r="2" fill="#fde68a"/>
      <!-- Cream mid-cabin trim -->
      <rect x="0" y="108" width="420" height="40" fill="${s.isNight ? "#cbd5c8" : "#fefce8"}"/>
      <line x1="0" y1="108" x2="420" y2="108" stroke="#0f766e" stroke-width="2.4" opacity="0.55"/>
      <!-- Round retro porthole window on left -->
      <circle cx="78" cy="76" r="22" fill="${winSky}" stroke="#f8fafc" stroke-width="3"/>
      <path d="M58 84 Q78 76 98 84 A22 22 0 0 1 58 84 Z" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.75"/>
      <!-- Wide panoramic riverfront camper window with tied-back curtains -->
      <rect x="244" y="40" width="130" height="64" rx="12" fill="${winSky}" stroke="#f8fafc" stroke-width="3.2"/>
      ${windowCel(s, 344, 56, 7.5)}
      <path d="M244 82 Q290 70 330 82 Q355 76 374 84 L374 92 L244 92 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}" opacity="0.8"/>
      <rect x="244" y="88" width="130" height="16" rx="4" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.76"/>
      <line x1="264" y1="96" x2="314" y2="96" stroke="#fff" stroke-width="1" opacity="0.55" class="h-drift"/>
      <line x1="309" y1="40" x2="309" y2="104" stroke="#f8fafc" stroke-width="2.4"/>
      <path d="M244 40 L262 40 Q252 68 256 104 L244 104 Z" fill="#fef3c7" opacity="0.82"/>
      <path d="M374 40 L356 40 Q366 68 362 104 L374 104 Z" fill="#fef3c7" opacity="0.82"/>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#5c4024" : "#a87946"}"/>
      ${floorPlanks(148, 0, 420, "#3b220c", 0.28)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ==================== T4: 4 SCENIC FOREST & LAKESIDE COTTAGES ====================

  // 9. 🎋 溪畔竹林小筑
  R.registerHouseArt("bamboo_pavilion", (dp) => {
    const s = skyOf(dp);
    const id = `bp_${s.phase}`;
    const w1 = s.isNight ? "#cfc9b8" : "#faf6ec";
    const w2 = s.isNight ? "#b8b09c" : "#ede5d2";
    const bam = s.isNight ? "#26422c" : "#3f6b46";
    const winSky = s.isNight ? "#0d1b2a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fce7f3" : "#d1fae5"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${w1}"/><stop offset="100%" stop-color="${w2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- Bamboo ceiling beam & wainscot dado -->
      <rect x="0" y="0" width="420" height="20" fill="${bam}"/>
      <rect x="0" y="122" width="420" height="26" fill="${s.isNight ? "#a39983" : "#e3d8c1"}" opacity="0.72"/>
      <line x1="0" y1="122" x2="420" y2="122" stroke="${bam}" stroke-width="1.6"/>
      <rect x="16" y="0" width="12" height="148" fill="${bam}"/>
      <rect x="392" y="0" width="12" height="148" fill="${bam}"/>
      <!-- Refined Chinese landscape ink scroll -->
      <rect x="54" y="34" width="44" height="72" rx="2" fill="#fffdf7" stroke="#5c4018" stroke-width="1.5"/>
      <line x1="49" y1="34" x2="103" y2="34" stroke="#5c4018" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="49" y1="106" x2="103" y2="106" stroke="#5c4018" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M56 96 Q68 78 78 86 Q88 72 96 96 Z" fill="#94a3b8" opacity="0.55"/>
      <path d="M74 96 Q76 74 72 52 M73 68 L84 62 M74 76 L64 70" stroke="#1e293b" stroke-width="1.3" fill="none"/>
      <circle cx="88" cy="54" r="3" fill="#dc2626" opacity="0.82"/>
      <!-- Arched bamboo grove window with layered misty forest -->
      <path d="M266 108 L266 64 A45 32 0 0 1 356 64 L356 108 Z" fill="${winSky}" stroke="${bam}" stroke-width="3.2"/>
      ${windowCel(s, 334, 52, 7.5)}
      <path d="M266 100 Q310 86 356 98 L356 108 L266 108 Z" fill="${s.isNight ? "#14532d" : "#86efac"}"/>
      <g stroke="${s.isNight ? "#15803d" : "#16a34a"}" stroke-width="3.2" class="h-drift-slow">
        <line x1="280" y1="42" x2="278" y2="108"/><line x1="298" y1="34" x2="300" y2="108"/>
        <line x1="322" y1="36" x2="320" y2="108"/><line x1="342" y1="46" x2="344" y2="108"/>
      </g>
      <g fill="${s.isNight ? "#166534" : "#22c55e"}" opacity="0.82">
        <ellipse cx="288" cy="58" rx="9" ry="3" transform="rotate(-20 288 58)"/>
        <ellipse cx="312" cy="50" rx="10" ry="3" transform="rotate(18 312 50)"/>
        <ellipse cx="332" cy="64" rx="9" ry="3" transform="rotate(-15 332 64)"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#6e5534" : "#bf9d65"}"/>
      ${floorPlanks(148, 0, 420, "#452c10", 0.25)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#452c10" stroke-width="2"/>
    `;
  });

  // 10. 🛖 莫干山原木屋
  R.registerHouseArt("moganshan_cabin", (dp) => {
    const s = skyOf(dp);
    const id = `mg_${s.phase}`;
    const log1 = s.isNight ? "#693b1d" : "#ad6232";
    const log2 = s.isNight ? "#4a2711" : "#80431d";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${log2}"/><stop offset="48%" stop-color="${log1}"/><stop offset="100%" stop-color="${log2}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_l)"/>
      <!-- Rounded log timber seams with warm specular ridges -->
      ${[22,44,66,88,110,132].map(y => `
        <line x1="0" y1="${y}" x2="420" y2="${y}" stroke="${log2}" stroke-width="2.4"/>
        <line x1="0" y1="${y + 2}" x2="420" y2="${y + 2}" stroke="#fde68a" stroke-width="0.7" opacity="0.22"/>
      `).join("")}
      <!-- Full-height stacked mountain river-stone fireplace & chimney! -->
      <rect x="148" y="0" width="44" height="76" fill="${s.isNight ? "#475569" : "#788596"}" stroke="#334155" stroke-width="1.3"/>
      <rect x="134" y="74" width="72" height="74" rx="2" fill="${s.isNight ? "#475569" : "#64748b"}" stroke="#334155" stroke-width="1.5"/>
      <rect x="128" y="70" width="84" height="8" rx="2" fill="#451a03"/>
      <path d="M150 148 L150 112 A20 18 0 0 1 190 112 L190 148 Z" fill="#18181b"/>
      <circle cx="170" cy="136" r="24" fill="#f97316" opacity="0.22" filter="url(#hsGlowMd)"/>
      <path d="M159 146 Q162 126 169 119 Q175 131 179 123 Q184 138 178 146 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <path d="M164 146 Q168 132 172 130 Q176 140 174 146 Z" fill="#fde047"/>
      <!-- Panoramic Moganshan mountain window -->
      <rect x="256" y="34" width="112" height="72" rx="4" fill="${winSky}" stroke="#451a03" stroke-width="3.2"/>
      ${windowCel(s, 344, 50, 8)}
      <path d="M256 96 Q284 72 314 90 Q342 66 368 92 L368 106 L256 106 Z" fill="${s.isNight ? "#166534" : "#4ade80"}" opacity="0.72"/>
      <path d="M256 100 L282 74 L306 100 L334 72 L368 100 L368 106 L256 106 Z" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <line x1="312" y1="34" x2="312" y2="106" stroke="#451a03" stroke-width="2.2"/>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#543018" : "#8c5228"}"/>
      ${floorPlanks(148, 0, 420, "#361c0b", 0.3)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#361c0b" stroke-width="2.2"/>
    `;
  });

  // 11. 🌻 向日葵玻璃花房 — REBUILT! Tall blooming sunflowers, hanging ivy & warm glasshouse sunbeams!
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
      ${celestialSky(s, 344, 34, 15)}
      <!-- Rolling sunny garden hills & tall blooming sunflowers visible cleanly above low sill! -->
      <path d="M0 116 Q136 96 276 114 Q356 122 420 106 L420 148 L0 148 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      ${[[46,84,11],[112,92,10],[194,88,10.5],[278,80,12],[340,90,10.5],[384,84,10]].map(([fx, fy, fr]) => `
        <g transform="translate(${fx}, ${fy})">
          <line x1="0" y1="0" x2="0" y2="${132 - fy}" stroke="${s.isNight ? "#15803d" : "#15803d"}" stroke-width="2.8"/>
          <ellipse cx="-7" cy="18" rx="7" ry="3.5" fill="#22c55e" transform="rotate(-24 -7 18)"/>
          <ellipse cx="7" cy="24" rx="7" ry="3.5" fill="#16a34a" transform="rotate(24 7 24)"/>
          <circle cx="0" cy="0" r="${fr}" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
          <circle cx="0" cy="0" r="${(fr * 0.48).toFixed(1)}" fill="#78350f"/>
        </g>
      `).join("")}
      <!-- Warm diagonal glasshouse sunbeams -->
      ${!s.isNight ? `<polygon points="240,0 324,0 246,148 160,148" fill="url(#hsSunbeam)" opacity="0.46"/>` : ""}
      <!-- White wrought-iron conservatory glass mullions & arched fanlights -->
      <rect x="0" y="0" width="420" height="126" fill="url(#hsGlassSheen)" opacity="0.48"/>
      <g stroke="${frame}" stroke-width="2.8" fill="none">
        <line x1="0" y1="24" x2="420" y2="24"/>
        <line x1="84" y1="0" x2="84" y2="126"/><line x1="168" y1="0" x2="168" y2="126"/>
        <line x1="252" y1="0" x2="252" y2="126"/><line x1="336" y1="0" x2="336" y2="126"/>
        <path d="M0 24 Q42 6 84 24 Q126 6 168 24 Q210 6 252 24 Q294 6 336 24 Q378 6 420 24"/>
      </g>
      <!-- Low cream conservatory knee wall -->
      <rect x="0" y="126" width="420" height="22" fill="${s.isNight ? "#b8b2a6" : "#faf5eb"}" stroke="#d6cfc2" stroke-width="1.2"/>
      <!-- Warm terracotta brick conservatory floor -->
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#875742" : "#d99d80"}"/>
      ${floorPlanks(148, 0, 420, "#7c3d22", 0.25)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#7c3d22" stroke-width="2"/>
    `;
  });

  // 12. 🏡 湖畔风车磨坊屋
  R.registerHouseArt("windmill_mill", (dp) => {
    const s = skyOf(dp);
    const id = `wm_${s.phase}`;
    const wall = s.isNight ? "#c8bfb0" : "#faf4e8";
    const beam = s.isNight ? "#422712" : "#783f1c";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#93c5fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wall}"/><stop offset="100%" stop-color="${s.isNight ? "#b0a696" : "#ebe2d0"}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_w)"/>
      <!-- European timber-framed beams & warm brick wainscoting -->
      <rect x="0" y="0" width="420" height="20" fill="${beam}"/>
      <path d="M0 20 L54 148 M420 20 L366 148 M18 20 V148 M402 20 V148" stroke="${beam}" stroke-width="6.5" opacity="0.86"/>
      <rect x="0" y="120" width="420" height="28" fill="${s.isNight ? "#5c6675" : "#cbd5e1"}" opacity="0.72"/>
      <line x1="0" y1="120" x2="420" y2="120" stroke="${beam}" stroke-width="2"/>
      <!-- Wall shelf with wheat sheaves & flour jar -->
      <rect x="74" y="68" width="76" height="5.5" rx="2" fill="${beam}"/>
      <rect x="88" y="50" width="14" height="18" rx="3" fill="#fef3c7" stroke="#92400e" stroke-width="1"/>
      <path d="M122 68 Q118 52 112 46 M124 68 Q126 50 130 44 M126 68 Q132 54 138 48" stroke="#eab308" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Arched lakeside window framing detailed stone windmill with spinning lattice sails -->
      <path d="M260 110 L260 60 A52 32 0 0 1 364 60 L364 110 Z" fill="${winSky}" stroke="${beam}" stroke-width="3.2"/>
      ${windowCel(s, 286, 52, 7)}
      <path d="M260 92 Q310 82 364 94 L364 110 L260 110 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <rect x="260" y="96" width="104" height="14" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.82"/>
      <g transform="translate(332, 68)">
        <polygon points="-9,28 -5,0 5,0 9,28" fill="${s.isNight ? "#475569" : "#b45309"}" stroke="#451a03" stroke-width="0.9"/>
        <path d="M-6 0 Q0 -7 6 0 Z" fill="#451a03"/>
        <g class="h-spin-slow">
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#fef3c7" stroke-width="2"/>
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#fef3c7" stroke-width="2"/>
          <rect x="4" y="-3" width="16" height="5" fill="#fde68a" opacity="0.78" stroke="#92400e" stroke-width="0.5"/>
          <rect x="-20" y="-2" width="16" height="5" fill="#fde68a" opacity="0.78" stroke="#92400e" stroke-width="0.5"/>
          <rect x="-3" y="-20" width="5" height="16" fill="#fde68a" opacity="0.78" stroke="#92400e" stroke-width="0.5"/>
          <rect x="-2" y="4" width="5" height="16" fill="#fde68a" opacity="0.78" stroke="#92400e" stroke-width="0.5"/>
        </g>
        <circle cx="0" cy="0" r="2.6" fill="#451a03"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${s.isNight ? "#634224" : "#ad7a46"}"/>
      ${floorPlanks(148, 0, 420, "#3b220c", 0.28)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ==================== T5: 2 BESPOKE HANGZHOU RESIDENCES (+ flagship heanju = 3) ====================

  // 13. 🏙️ 丽晶国际 — Qianjiang Century City Double-Height Cyber-LOFT + Hangzhou Gate & 7-Petal Lotus Bowl!
  R.registerHouseArt("regent_intl", (dp) => {
    const s = skyOf(dp);
    const id = `rg_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight
      ? ["#0b1026", "#23194d", "#6b2b6e", "#d96b6b", "#fbbf77"]
      : (s.isDusk
        ? ["#1d184a", "#7e2a70", "#db4d6d", "#fb923c", "#fde68a"]
        : (s.isDawn
          ? ["#60a5fa", "#bfdbfe", "#fbcfe8", "#fed7aa", "#fef9c3"]
          : ["#2563eb", "#60a5fa", "#bae6fd", "#e0f2fe", "#f8fafc"]));
    const riv = s.isNight
      ? ["#2c2459", "#192145", "#0e152e"]
      : (s.isDusk
        ? ["#4b3668", "#2d2859", "#181d3d"]
        : ["#93c5fd", "#38bdf8", "#0284c7"]);
    const wallC = s.isNight ? ["#2c3244", "#232838", "#1a1f2c"] : (s.isDusk ? ["#515973", "#41485e", "#31374a"] : ["#edf1f7", "#dce3ee", "#c5cfde"]);
    const flrC = s.isNight ? ["#454c5e", "#383e4e", "#282d3a"] : (s.isDusk ? ["#6d758c", "#596175", "#434a5c"] : ["#eef2f6", "#dce3ec", "#c4cedb"]);
    const deckC = s.isNight ? ["#2d3446", "#191e2b"] : (s.isDusk ? ["#6b5344", "#4a382d"] : ["#d6b286", "#b58d5e"]);
    const bld = lit ? ["#181c36", "#141830", "#1a1f3d", "#12162b", "#191e38"] : ["#94a3b8", "#7c8ea6", "#a3b3c6", "#6b7d96", "#889ab2"];
    const lotusC = lit ? ["#67e8f9", "#818cf8", "#312e81"] : ["#ffffff", "#e2e8f0", "#94a3b8"];
    const winOp = lit ? "0.78" : "0.42";
    const glowOp = lit ? "0.95" : "0.22";
    const ceilC = s.isNight ? "#181d2b" : (s.isDusk ? "#2c3347" : "#cbd5e1");
    const mezBg = s.isNight ? "#1a1f30" : (s.isDusk ? "#313952" : "#e2e8f0");
    const mezTop = s.isNight ? "#2c3347" : (s.isDusk ? "#46506e" : "#cbd5e1");
    const mezBeam = s.isNight ? "#0f172a" : (s.isDusk ? "#1e293b" : "#64748b");
    const frameC = s.isNight ? "#0f172a" : (s.isDusk ? "#1e293b" : "#475569");
    const curtC = s.isNight ? "#1e2438" : (s.isDusk ? "#475569" : "#f8fafc");
    const skyCel = s.isNight
      ? `${stars([[236,24,1.1],[318,28,1.3],[448,20,1.2],[516,18,1.0,"#fff"],[586,26,1.3],[688,22,1.1,"#bae6fd"]])}${moon(652, 34, 12)}`
      : `<circle cx="652" cy="${s.isDusk || s.isDawn ? 40 : 30}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.95" filter="url(#hsGlowMd)"/>`;
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="38%" stop-color="${sky[1]}"/><stop offset="72%" stop-color="${sky[2]}"/><stop offset="92%" stop-color="${sky[3]}"/><stop offset="100%" stop-color="${sky[4]}"/>
        </linearGradient>
        <linearGradient id="${id}_riv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${riv[0]}"/><stop offset="55%" stop-color="${riv[1]}"/><stop offset="100%" stop-color="${riv[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${wallC[0]}"/><stop offset="60%" stop-color="${wallC[1]}"/><stop offset="100%" stop-color="${wallC[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${flrC[0]}"/><stop offset="50%" stop-color="${flrC[1]}"/><stop offset="100%" stop-color="${flrC[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${deckC[0]}"/><stop offset="100%" stop-color="${deckC[1]}"/>
        </linearGradient>
        <radialGradient id="${id}_sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fde047" stop-opacity="${lit ? "0.72" : "0.42"}"/><stop offset="42%" stop-color="#fb7185" stop-opacity="${lit ? "0.48" : "0.26"}"/><stop offset="76%" stop-color="#c026d3" stop-opacity="0.14"/><stop offset="100%" stop-color="#c026d3" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${id}_lotus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lotusC[0]}"/><stop offset="55%" stop-color="${lotusC[1]}"/><stop offset="100%" stop-color="${lotusC[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="45%" stop-color="#ffffff" stop-opacity="0.02"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0.12"/>
        </linearGradient>
      </defs>

      <!-- Continuous Qianjiang Sky -->
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${skyCel}
      <!-- Soft clouds -->
      <g class="h-drift-slow" opacity="${s.isNight ? "0.28" : (s.isDusk ? "0.46" : "0.82")}" fill="${s.isNight ? "#fbcfe8" : (s.isDusk ? "#fed7aa" : "#ffffff")}">
        <ellipse cx="294" cy="48" rx="34" ry="7"/><ellipse cx="316" cy="45" rx="20" ry="5.5"/>
        <ellipse cx="494" cy="40" rx="40" ry="8"/><ellipse cx="524" cy="37" rx="24" ry="6"/>
      </g>

      <!-- Distant misty river bank & Qiantang River with animated shimmer -->
      <path d="M180 118 Q360 110 540 116 Q630 112 720 118 L720 124 L180 124 Z" fill="${lit ? "#1e1b4b" : "#64748b"}" opacity="0.78"/>
      <rect x="180" y="122" width="540" height="28" fill="url(#${id}_riv)"/>
      <g opacity="${lit ? "0.52" : "0.62"}" stroke-linecap="round">
        <line x1="220" y1="128" x2="274" y2="128" stroke="${lit ? "#f472b6" : "#ffffff"}" stroke-width="1.4" class="h-drift"/>
        <line x1="296" y1="134" x2="348" y2="134" stroke="${lit ? "#38bdf8" : "#e0f2fe"}" stroke-width="1.3" class="h-drift-slow"/>
        <line x1="484" y1="129" x2="544" y2="129" stroke="${lit ? "#38bdf8" : "#ffffff"}" stroke-width="1.6" class="h-drift"/>
        <line x1="566" y1="135" x2="634" y2="135" stroke="${lit ? "#c084fc" : "#e0f2fe"}" stroke-width="1.5" class="h-drift-slow"/>
        <line x1="654" y1="130" x2="704" y2="130" stroke="${lit ? "#fde047" : "#ffffff"}" stroke-width="1.4" class="h-drift"/>
        <line x1="442" y1="139" x2="496" y2="139" stroke="${lit ? "#fb923c" : "#bae6fd"}" stroke-width="1.1"/>
      </g>

      <!-- Far CBD towers seen through indoor loft window (x=190..384) -->
      <g>
        <rect x="196" y="64" width="26" height="58" fill="${bld[0]}"/>
        <rect x="228" y="42" width="32" height="80" fill="${bld[1]}"/>
        <rect x="266" y="54" width="28" height="68" fill="${bld[2]}"/>
        <rect x="300" y="34" width="36" height="88" fill="${bld[3]}"/>
        <rect x="342" y="58" width="34" height="64" fill="${bld[4]}"/>
        <g fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}">
          <rect x="201" y="72" width="4" height="4"/><rect x="209" y="72" width="4" height="4"/><rect x="201" y="82" width="4" height="4"/><rect x="213" y="92" width="4" height="4"/>
          <rect x="234" y="50" width="5" height="4"/><rect x="244" y="50" width="5" height="4"/><rect x="234" y="60" width="16" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/>
          <rect x="234" y="72" width="5" height="4"/><rect x="248" y="72" width="5" height="4"/><rect x="238" y="86" width="14" height="3" fill="${lit ? "#f472b6" : "#cbd5e1"}"/>
          <rect x="307" y="44" width="22" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="307" y="54" width="6" height="5"/><rect x="321" y="54" width="6" height="5"/>
          <rect x="307" y="66" width="22" height="3" fill="${lit ? "#fde047" : "#e2e8f0"}"/><rect x="307" y="78" width="6" height="5"/><rect x="319" y="78" width="8" height="5"/>
          <rect x="348" y="68" width="20" height="3" fill="${lit ? "#f472b6" : "#cbd5e1"}"/><rect x="348" y="78" width="6" height="4"/><rect x="360" y="88" width="6" height="4"/>
        </g>
        <line x1="228" y1="42" x2="260" y2="42" stroke="#38bdf8" stroke-width="1.6" opacity="${glowOp}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <line x1="300" y1="34" x2="336" y2="34" stroke="#f472b6" stroke-width="1.8" opacity="${glowOp}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      </g>

      <!-- Outdoor Qianjiang Century City Iconic Landmarks (x=420..720) -->
      <g>
        <rect x="428" y="52" width="38" height="70" fill="${bld[1]}"/>
        <line x1="428" y1="52" x2="466" y2="52" stroke="#f59e0b" stroke-width="1.6" opacity="${glowOp}"/>
        <g fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}">
          <rect x="434" y="62" width="26" height="2.6"/><rect x="434" y="71" width="10" height="3"/><rect x="450" y="71" width="10" height="3"/>
          <rect x="434" y="82" width="26" height="2.6" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="434" y="92" width="12" height="3"/><rect x="450" y="92" width="8" height="3"/>
        </g>
        <!-- ICONIC GATE OF HANGZHOU (杭州之门 · H-shaped twin towers!) -->
        <g>
          <path d="M484 122 L490 32 L506 24 L509 122 Z" fill="${bld[3]}" stroke="${lit ? "#38bdf8" : "#cbd5e1"}" stroke-width="0.7" opacity="0.96"/>
          <path d="M521 122 L524 24 L540 32 L546 122 Z" fill="${bld[3]}" stroke="${lit ? "#f472b6" : "#cbd5e1"}" stroke-width="0.7" opacity="0.96"/>
          <path d="M490 62 Q515 86 540 62 L541 72 Q515 96 489 72 Z" fill="${lit ? "#1e1b4b" : "#475569"}" stroke="${lit ? "#fde047" : "#e2e8f0"}" stroke-width="0.9"/>
          <g fill="${lit ? "#7dd3fc" : "#e2e8f0"}" opacity="${lit ? "0.75" : "0.42"}">
            <rect x="493" y="40" width="11" height="2"/><rect x="492" y="49" width="12" height="2"/><rect x="491" y="58" width="13" height="2"/>
            <rect x="490" y="82" width="14" height="2.2" fill="${lit ? "#fde047" : "#f1f5f9"}"/><rect x="489" y="94" width="15" height="2"/><rect x="488" y="106" width="16" height="2"/>
          </g>
          <g fill="${lit ? "#f9a8d4" : "#e2e8f0"}" opacity="${lit ? "0.75" : "0.42"}">
            <rect x="526" y="40" width="11" height="2"/><rect x="526" y="49" width="12" height="2"/><rect x="526" y="58" width="13" height="2"/>
            <rect x="526" y="82" width="14" height="2.2" fill="${lit ? "#fde047" : "#f1f5f9"}"/><rect x="526" y="94" width="15" height="2"/><rect x="526" y="106" width="16" height="2"/>
          </g>
          <circle cx="506" cy="22" r="1.8" fill="#ef4444" class="h-twinkle" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
          <circle cx="524" cy="22" r="1.8" fill="#ef4444" class="h-twinkle-d1" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        </g>
        <!-- ICONIC HANGZHOU OLYMPIC LOTUS BOWL (大莲花 · 7-petal luminous stadium!) -->
        <g transform="translate(604, 122)">
          ${lit ? `<ellipse cx="0" cy="-4" rx="44" ry="8" fill="#38bdf8" opacity="0.2" filter="url(#hsGlowMd)"/>` : ""}
          <path d="M-40 0 Q-38 -26 -22 -22 Q-14 -34 0 -28 Q14 -34 22 -22 Q38 -26 40 0 Z" fill="url(#${id}_lotus)" fill-opacity="${lit ? "0.82" : "0.95"}" stroke="${lit ? "#bae6fd" : "#475569"}" stroke-width="1"/>
          <path d="M-36 0 Q-28 -24 -16 -24 Q-10 -12 -14 0" fill="none" stroke="${lit ? "#e0f2fe" : "#f8fafc"}" stroke-width="1.1" opacity="0.88"/>
          <path d="M-20 0 Q-12 -30 0 -28 Q12 -30 20 0" fill="none" stroke="${lit ? "#fef08a" : "#ffffff"}" stroke-width="1.2" opacity="0.92"/>
          <path d="M14 0 Q10 -12 16 -24 Q28 -24 36 0" fill="none" stroke="${lit ? "#fbcfe8" : "#f8fafc"}" stroke-width="1.1" opacity="0.88"/>
          <line x1="-38" y1="-2" x2="38" y2="-2" stroke="${lit ? "#38bdf8" : "#94a3b8"}" stroke-width="1.5" opacity="0.85"/>
        </g>
        <!-- Right Qianjiang tower -->
        <rect x="658" y="40" width="48" height="82" fill="${bld[1]}"/>
        <line x1="658" y1="40" x2="706" y2="40" stroke="#22d3ee" stroke-width="1.8" opacity="${glowOp}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <g fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}">
          <rect x="665" y="50" width="34" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="665" y="60" width="12" height="4"/><rect x="685" y="60" width="12" height="4"/>
          <rect x="665" y="72" width="34" height="3" fill="${lit ? "#f472b6" : "#cbd5e1"}"/><rect x="665" y="84" width="14" height="4"/><rect x="687" y="84" width="10" height="4"/>
          <rect x="665" y="96" width="34" height="2.6"/>
        </g>
      </g>

      <!-- ==================== INDOOR DOUBLE-HEIGHT LOFT (x=0..416) ==================== -->
      <rect x="0" y="0" width="186" height="148" fill="url(#${id}_wall)"/>
      <g stroke="${lit ? "#394157" : "#94a3b8"}" stroke-width="0.8" opacity="0.45">
        <line x1="0" y1="92" x2="186" y2="92"/><line x1="62" y1="58" x2="62" y2="148"/><line x1="124" y1="58" x2="124" y2="148"/>
      </g>
      <rect x="186" y="0" width="230" height="20" fill="${ceilC}"/>
      <line x1="186" y1="20" x2="416" y2="20" stroke="#fbbf24" stroke-width="1.4" opacity="${lit ? "0.78" : "0.35"}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>

      <!-- 2F Mezzanine Sleeping Loft (bed, warm lamp, mini bookshelf, glass rail) -->
      <rect x="0" y="0" width="186" height="54" fill="${mezBg}"/>
      <rect x="0" y="0" width="186" height="6" fill="${mezTop}"/>
      <polygon points="32,6 44,6 58,52 18,52" fill="#fef08a" opacity="${lit ? "0.12" : "0.02"}"/>
      <polygon points="112,6 124,6 138,52 98,52" fill="#fef08a" opacity="${lit ? "0.12" : "0.02"}"/>
      <rect x="14" y="28" width="54" height="24" rx="3" fill="${lit ? "#334155" : "#94a3b8"}" stroke="#64748b" stroke-width="1"/>
      <rect x="18" y="34" width="46" height="18" rx="3" fill="#ffffff" opacity="0.92"/>
      <rect x="18" y="36" width="16" height="8" rx="3" fill="#f97316" opacity="0.88"/>
      <rect x="74" y="36" width="16" height="16" rx="2" fill="${lit ? "#475569" : "#94a3b8"}"/>
      <ellipse cx="82" cy="31" rx="6" ry="4" fill="${lit ? "#fef08a" : "#fffbeb"}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <line x1="82" y1="35" x2="82" y2="38" stroke="#cbd5e1" stroke-width="1.2"/>
      <rect x="104" y="20" width="44" height="32" rx="2" fill="${lit ? "#272e42" : "#cbd5e1"}" stroke="#64748b" stroke-width="1"/>
      <rect x="109" y="25" width="5" height="10" fill="#ef4444"/><rect x="115" y="27" width="5" height="8" fill="#38bdf8"/>
      <rect x="122" y="24" width="5" height="11" fill="#f59e0b"/><rect x="132" y="26" width="6" height="9" fill="#22c55e"/>
      <line x1="104" y1="36" x2="148" y2="36" stroke="#64748b" stroke-width="1"/>
      <rect x="0" y="26" width="174" height="28" fill="#38bdf8" fill-opacity="0.08" stroke="#64748b" stroke-width="1.1"/>
      <line x1="58" y1="26" x2="58" y2="54" stroke="#64748b" stroke-width="1.2"/>
      <line x1="116" y1="26" x2="116" y2="54" stroke="#64748b" stroke-width="1.2"/>
      <rect x="0" y="52" width="178" height="7" fill="${mezBeam}"/>
      <line x1="0" y1="59" x2="178" y2="59" stroke="#22d3ee" stroke-width="1.5" opacity="${lit ? "0.95" : "0.28"}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>

      <!-- 1F Cyber-Creator Accent Wall under Mezzanine -->
      ${lit ? `<circle cx="62" cy="108" r="38" fill="url(#${id}_sun)"/>` : ""}
      <rect x="16" y="70" width="30" height="38" rx="2" fill="${lit ? "#0f172a" : "#ffffff"}" stroke="${lit ? "#f472b6" : "#64748b"}" stroke-width="1.3"/>
      <circle cx="31" cy="85" r="8" fill="#f97316" opacity="0.88"/>
      <path d="M19 98 L27 89 L35 96 L42 91 V105 H19 Z" fill="${lit ? "#312e81" : "#60a5fa"}"/>
      <rect x="56" y="76" width="54" height="4" rx="1.5" fill="#92400e"/>
      <circle cx="68" cy="70" r="6" fill="#18181b" stroke="#e2e8f0" stroke-width="0.7"/><circle cx="68" cy="70" r="2" fill="#f97316"/>
      <rect x="82" y="67" width="8" height="9" rx="1.5" fill="#fffdf8"/><circle cx="86" cy="64" r="4" fill="#22c55e"/>
      <rect x="56" y="102" width="52" height="14" rx="7" fill="${lit ? "#0f172a" : "#ffffff"}" fill-opacity="${lit ? "0.85" : "0.88"}" stroke="${lit ? "#22d3ee" : "#94a3b8"}" stroke-width="1" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <text x="82" y="111.5" font-size="6.4" font-family="monospace" font-weight="900" fill="${lit ? "#a5f3fc" : "#334155"}" text-anchor="middle">LOFT 24H</text>

      <!-- Industrial Black-Steel + Oak Floating Loft Staircase -->
      <line x1="126" y1="148" x2="176" y2="56" stroke="${frameC}" stroke-width="4"/>
      <line x1="118" y1="124" x2="168" y2="34" stroke="#64748b" stroke-width="1.6"/>
      <line x1="130" y1="142" x2="130" y2="104" stroke="#64748b" stroke-width="1" opacity="0.7"/>
      <line x1="146" y1="114" x2="146" y2="76" stroke="#64748b" stroke-width="1" opacity="0.7"/>
      <line x1="162" y1="84" x2="162" y2="48" stroke="#64748b" stroke-width="1" opacity="0.7"/>
      <g>
        <rect x="124" y="138" width="26" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
        <rect x="132" y="124" width="26" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
        <rect x="140" y="110" width="26" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
        <rect x="148" y="96" width="26" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
        <rect x="156" y="82" width="26" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
        <rect x="164" y="68" width="22" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>
      </g>

      <!-- Double-Height Steel-Grid Window (x=186..384) + Open Sliding Glass Door -->
      <rect x="186" y="20" width="198" height="128" fill="url(#${id}_glass)" stroke="${frameC}" stroke-width="2.4"/>
      <line x1="252" y1="20" x2="252" y2="148" stroke="${frameC}" stroke-width="1.6"/>
      <line x1="318" y1="20" x2="318" y2="148" stroke="${frameC}" stroke-width="1.6"/>
      <line x1="186" y1="84" x2="384" y2="84" stroke="${frameC}" stroke-width="1.4" opacity="0.82"/>
      <path d="M186 20 L204 20 Q196 84 202 148 L186 148 Z" fill="${curtC}" opacity="0.88"/>
      <rect x="384" y="20" width="32" height="128" fill="none" stroke="#64748b" stroke-width="2.2"/>
      <rect x="384" y="20" width="12" height="128" fill="url(#${id}_glass)" stroke="#64748b" stroke-width="1.1"/>
      <rect x="392" y="76" width="2.5" height="20" rx="1" fill="#cbd5e1"/>

      <!-- ==================== OUTDOOR SKY TERRACE (x=416..720) ==================== -->
      <path d="M418 16 Q506 42 598 22 Q660 36 718 18" fill="none" stroke="${lit ? "#475569" : "#94a3b8"}" stroke-width="1.1"/>
      <g ${lit ? 'filter="url(#hsGlowSm)"' : ""} opacity="${lit ? "0.96" : "0.45"}">
        <circle cx="452" cy="26" r="2.6" fill="${lit ? "#fef08a" : "#e2e8f0"}" class="${lit ? "h-twinkle" : ""}"/>
        <circle cx="492" cy="31" r="2.6" fill="${lit ? "#fde047" : "#f1f5f9"}" class="${lit ? "h-twinkle-d1" : ""}"/>
        <circle cx="534" cy="30" r="2.6" fill="${lit ? "#fef08a" : "#e2e8f0"}" class="${lit ? "h-twinkle-d2" : ""}"/>
        <circle cx="576" cy="25" r="2.6" fill="${lit ? "#fde047" : "#f1f5f9"}" class="${lit ? "h-twinkle" : ""}"/>
        <circle cx="624" cy="27" r="2.6" fill="${lit ? "#fef08a" : "#e2e8f0"}" class="${lit ? "h-twinkle-d1" : ""}"/>
        <circle cx="672" cy="28" r="2.6" fill="${lit ? "#fde047" : "#f1f5f9"}" class="${lit ? "h-twinkle-d2" : ""}"/>
      </g>
      <rect x="416" y="114" width="304" height="34" fill="#38bdf8" opacity="${lit ? "0.14" : "0.1"}"/>
      <line x1="416" y1="114" x2="720" y2="114" stroke="${frameC}" stroke-width="3.2"/>
      <line x1="416" y1="116" x2="720" y2="116" stroke="#22d3ee" stroke-width="1.4" opacity="${glowOp}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <line x1="496" y1="114" x2="496" y2="148" stroke="#64748b" stroke-width="1.8"/>
      <line x1="582" y1="114" x2="582" y2="148" stroke="#64748b" stroke-width="1.8"/>
      <line x1="668" y1="114" x2="668" y2="148" stroke="#64748b" stroke-width="1.8"/>

      <!-- Floors: Polished loft terrazzo + outdoor deck planks -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      <g stroke="${lit ? "#202533" : "#94a3b8"}" stroke-width="0.9" opacity="0.42">
        <line x1="0" y1="168" x2="416" y2="168"/><line x1="0" y1="188" x2="416" y2="188"/>
        <line x1="94" y1="148" x2="66" y2="208"/><line x1="208" y1="148" x2="208" y2="208"/><line x1="322" y1="148" x2="350" y2="208"/>
      </g>
      <polygon points="196,148 374,148 340,192 162,192" fill="${lit ? "#f472b6" : "#fffbeb"}" opacity="${lit ? "0.08" : "0.38"}"/>
      <rect x="416" y="148" width="304" height="60" fill="url(#${id}_deck)"/>
      <g stroke="${lit ? "#0f172a" : "#785028"}" stroke-width="0.9" opacity="0.42">
        <line x1="416" y1="164" x2="720" y2="164"/><line x1="416" y1="180" x2="720" y2="180"/><line x1="416" y1="196" x2="720" y2="196"/>
      </g>
      <line x1="416" y1="148" x2="416" y2="208" stroke="${lit ? "#475569" : "#94a3b8"}" stroke-width="4"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="${lit ? "#f472b6" : "#ffffff"}" stroke-width="1.2" opacity="${lit ? "0.85" : "0.55"}"/>

      <!-- Outdoor terrace planter with uplight -->
      <g transform="translate(454, 158)">
        <ellipse cx="0" cy="3" rx="16" ry="3.5" fill="rgba(0,0,0,0.3)"/>
        <rect x="-14" y="-16" width="28" height="18" rx="2" fill="#334155" stroke="#64748b" stroke-width="1"/>
        <path d="M-8 -16 Q-14 -34 -6 -40 M0 -16 Q0 -38 4 -44 M8 -16 Q16 -32 10 -38" stroke="#10b981" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        ${lit ? `<circle cx="0" cy="-22" r="10" fill="#34d399" opacity="0.16"/>` : ""}
      </g>
      <!-- Outdoor neon sky-bar table, cocktails, candle & twin bar stools -->
      <g transform="translate(616, 166)">
        <ellipse cx="0" cy="5" rx="46" ry="6" fill="rgba(0,0,0,0.32)"/>
        <rect x="-42" y="-18" width="14" height="4.5" rx="2" fill="#f472b6" stroke="#831843" stroke-width="0.8"/>
        <path d="M-39 -13 L-41 4 M-31 -13 L-29 4 M-40 -4 H-30" stroke="#94a3b8" stroke-width="1.6"/>
        <rect x="28" y="-18" width="14" height="4.5" rx="2" fill="#f472b6" stroke="#831843" stroke-width="0.8"/>
        <path d="M31 -13 L29 4 M39 -13 L41 4 M30 -4 H40" stroke="#94a3b8" stroke-width="1.6"/>
        <rect x="-24" y="-28" width="48" height="5" rx="2" fill="#0f172a" stroke="#22d3ee" stroke-width="1.3"/>
        <line x1="0" y1="-23" x2="0" y2="4" stroke="#64748b" stroke-width="3"/>
        <ellipse cx="0" cy="4" rx="12" ry="2.8" fill="#334155"/>
        <rect x="-15" y="-36" width="5.5" height="8" rx="1" fill="#38bdf8" opacity="0.85"/>
        <rect x="10" y="-35" width="5.5" height="7" rx="1" fill="#fb7185" opacity="0.85"/>
        <rect x="-3" y="-37" width="6" height="9" rx="2" fill="#fef08a" class="h-pulse" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      </g>
    `;
  });

  // 14. 🌳 西溪北苑 — Xixi Wetland Wide Oak Living Hall + Bay-Window Bench + Cedar Pergola Balcony!
  R.registerHouseArt("xixi_beiyuan", (dp) => {
    const s = skyOf(dp);
    const id = `xb_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight
      ? ["#091426", "#162947", "#213a5e", "#1a383a"]
      : (s.isDusk
        ? ["#4338ca", "#ea580c", "#fbbf24", "#fde68a"]
        : (s.isDawn
          ? ["#7aa7e8", "#fbcfe8", "#fef3c7", "#dcfce7"]
          : ["#5ca9f8", "#bae6fd", "#fef9c3", "#d1fae5"]));
    const wat = s.isNight ? ["#1e3a5f", "#142947", "#0c1b33"] : (s.isDusk ? ["#fb923c", "#60a5fa", "#1e3a8a"] : ["#7dd3fc", "#38bdf8", "#0ea5e9"]);
    const wallC = s.isNight ? ["#dcd4c5", "#ccc2b0"] : ["#fcf9f2", "#efe7d6"];
    const flrC = s.isNight ? ["#b3a288", "#9e8c72"] : ["#e7d6ba", "#d4be9a"];
    const deckC = s.isNight ? ["#78522d", "#57391c"] : ["#c48e56", "#966334"];
    const treeD = s.isNight ? "#0d381e" : "#14532d";
    const treeM = s.isNight ? "#14532d" : "#15803d";
    const treeL = s.isNight ? "#166534" : "#22c55e";
    const skyCel = s.isNight
      ? `${stars([[124,28,1.1],[246,24,1.2],[342,32,1.0,"#fff"],[458,24,1.1],[548,20,1.2,"#bae6fd"]])}${moon(644, 34, 14)}`
      : `<circle cx="644" cy="${s.isDusk || s.isDawn ? 42 : 34}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92" filter="url(#hsGlowMd)"/>
        <g class="h-drift-slow" fill="${s.isDusk ? "#fed7aa" : "#ffffff"}" opacity="0.86">
          <ellipse cx="164" cy="40" rx="28" ry="8"/><ellipse cx="182" cy="36" rx="16" ry="6.5"/>
          <ellipse cx="496" cy="34" rx="34" ry="9"/><ellipse cx="520" cy="30" rx="18" ry="7"/>
          <ellipse cx="476" cy="36" rx="16" ry="6"/>
        </g>`;
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="48%" stop-color="${sky[1]}"/><stop offset="84%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/>
        </linearGradient>
        <linearGradient id="${id}_wat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wat[0]}"/><stop offset="65%" stop-color="${wat[1]}"/><stop offset="100%" stop-color="${wat[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/>
        </linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${flrC[0]}"/><stop offset="100%" stop-color="${flrC[1]}"/>
        </linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${deckC[0]}"/><stop offset="100%" stop-color="${deckC[1]}"/>
        </linearGradient>
        <linearGradient id="${id}_sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.isDusk ? "#fed7aa" : "#fffbeb"}" stop-opacity="${s.isNight ? "0" : "0.34"}"/><stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Hangzhou Xixi Wetland Sky -->
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${skyCel}

      <!-- Layered misty Hangzhou West Hills (北高峰远山) -->
      <path d="M0 104 Q112 68 228 96 Q344 66 472 94 Q588 64 720 88 L720 148 L0 148 Z" fill="${s.isNight ? "#153a34" : "#86efac"}" opacity="0.48"/>
      <path d="M0 114 Q144 88 286 108 Q428 84 574 106 Q652 92 720 104 L720 148 L0 148 Z" fill="${s.isNight ? "#134e4a" : "#34d399"}" opacity="0.54"/>

      <!-- Multi-Tone Xixi Wetland Tree Islands + Orange Xixi Persimmons (西溪火柿) -->
      <g>
        <ellipse cx="154" cy="108" rx="48" ry="16" fill="${treeM}" opacity="0.86"/>
        <ellipse cx="136" cy="102" rx="26" ry="13" fill="${treeL}" opacity="0.9"/>
        <ellipse cx="172" cy="104" rx="24" ry="11" fill="${treeM}" opacity="0.88"/>
        <circle cx="132" cy="99" r="2.2" fill="#f97316"/><circle cx="144" cy="103" r="2" fill="#fb923c"/><circle cx="168" cy="101" r="2.1" fill="#f97316"/>
        <ellipse cx="486" cy="106" rx="52" ry="18" fill="${treeD}" opacity="0.88"/>
        <ellipse cx="468" cy="99" rx="28" ry="14" fill="${treeM}"/>
        <ellipse cx="504" cy="101" rx="28" ry="13" fill="${treeL}"/>
        <circle cx="462" cy="96" r="2.5" fill="#f97316"/><circle cx="476" cy="100" r="2.3" fill="#ea580c"/><circle cx="498" cy="95" r="2.4" fill="#f97316"/><circle cx="512" cy="101" r="2.2" fill="#fb923c"/>
        <!-- Far-right Jiangnan cottage peek -->
        <rect x="646" y="92" width="32" height="20" fill="${s.isNight ? "#94a3b8" : "#fffdf8"}" stroke="#cbd5e1" stroke-width="0.8"/>
        ${lit ? `<rect x="656" y="99" width="10" height="8" rx="1" fill="#fde047" opacity="0.88" filter="url(#hsGlowSm)"/>` : ""}
        <path d="M640 94 Q662 80 684 94 Z" fill="${s.isNight ? "#0f172a" : "#334155"}"/>
        <ellipse cx="628" cy="106" rx="34" ry="15" fill="${treeM}"/>
        <ellipse cx="690" cy="104" rx="34" ry="16" fill="${treeL}"/>
      </g>

      <!-- Xixi Wetland Canal + Wooden Arched Bridge + Rowing Boat (摇橹船) + Lotus -->
      <rect x="0" y="116" width="720" height="32" fill="url(#${id}_wat)" opacity="0.68"/>
      <g stroke="${s.isNight ? "#bae6fd" : "#ffffff"}" stroke-width="1" opacity="${s.isNight ? "0.35" : "0.58"}" stroke-linecap="round">
        <line x1="120" y1="124" x2="188" y2="124" class="h-drift"/><line x1="264" y1="128" x2="328" y2="128" class="h-drift-slow"/>
        <line x1="454" y1="126" x2="516" y2="126" class="h-drift"/><line x1="596" y1="132" x2="668" y2="132" class="h-drift-slow"/>
      </g>
      <g transform="translate(566, 120)">
        <path d="M-32 4 Q0 -16 32 4" fill="none" stroke="#78350f" stroke-width="3.6"/>
        <path d="M-32 -2 Q0 -22 32 -2" fill="none" stroke="#92400e" stroke-width="1.6"/>
        <line x1="-22" y1="-8" x2="-22" y2="0" stroke="#78350f" stroke-width="1.4"/>
        <line x1="0" y1="-12" x2="0" y2="-4" stroke="#78350f" stroke-width="1.4"/>
        <line x1="22" y1="-8" x2="22" y2="0" stroke="#78350f" stroke-width="1.4"/>
      </g>
      <g class="h-drift-slow" transform="translate(506, 132)">
        <path d="M-16 0 Q0 6 18 0 L14 4 Q0 8 -14 4 Z" fill="#5c2d0e"/>
        <path d="M-6 0 Q2 -10 10 0 Z" fill="#d9a55b" stroke="#78350f" stroke-width="0.9"/>
        ${lit ? `<circle cx="-11" cy="-2" r="2" fill="#fde047" filter="url(#hsGlowSm)"/>` : ""}
      </g>
      <ellipse cx="626" cy="134" rx="8" ry="2.6" fill="${treeL}" opacity="0.88"/>
      <ellipse cx="640" cy="138" rx="6.5" ry="2.2" fill="${treeM}" opacity="0.88"/>
      <circle cx="632" cy="133" r="2.4" fill="#f9a8d4"/>
      ${s.isNight
        ? `<g fill="#fef08a" filter="url(#hsGlowSm)">
            <circle cx="468" cy="108" r="1.6" class="h-twinkle"/><circle cx="536" cy="98" r="1.4" class="h-twinkle-d1"/>
            <circle cx="614" cy="106" r="1.6" class="h-twinkle-d2"/><circle cx="662" cy="96" r="1.3" class="h-twinkle"/>
          </g>`
        : `<path d="M518 54 Q525 48 532 54 Q539 48 546 54" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" class="h-drift-slow"/>
          <path d="M556 66 Q561 62 566 66 Q571 62 576 66" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round" class="h-drift"/>`}

      <!-- ==================== INDOOR SUNLIT WIDE LIVING HALL (x=0..416) ==================== -->
      <rect x="0" y="0" width="416" height="22" fill="${s.isNight ? "#cfc5b4" : "#faf5eb"}"/>
      <rect x="0" y="0" width="416" height="10" fill="${s.isNight ? "#8f693e" : "#c79a63"}"/>
      <line x1="0" y1="11" x2="416" y2="11" stroke="#fde68a" stroke-width="1.8" opacity="${lit ? "0.92" : "0.75"}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>

      <!-- Left Warm Oak Slat Feature Wall + Botanical Art + Shelf -->
      <rect x="0" y="22" width="84" height="126" fill="url(#${id}_wall)"/>
      <g fill="${s.isNight ? "#9c754b" : "#d4a674"}" opacity="0.88">
        <rect x="6" y="22" width="5" height="126"/><rect x="15" y="22" width="5" height="126"/>
        <rect x="24" y="22" width="5" height="126"/><rect x="33" y="22" width="5" height="126"/>
      </g>
      <rect x="44" y="34" width="34" height="44" rx="2" fill="#fffdf8" stroke="#92683c" stroke-width="1.5"/>
      <rect x="48" y="38" width="26" height="36" fill="${s.isNight ? "#d1fae5" : "#ecfdf5"}"/>
      <path d="M61 70 V48 M61 56 L54 50 M61 62 L68 56" stroke="#15803d" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="44" y="92" width="36" height="4" rx="1.5" fill="#92683c"/>
      <rect x="50" y="83" width="9" height="9" rx="2" fill="#d96b43"/><circle cx="54.5" cy="80" r="4.5" fill="#22c55e"/>
      <rect x="65" y="84" width="8" height="8" rx="1.5" fill="#fef3c7" stroke="#b45309" stroke-width="0.7"/>
      <rect x="372" y="22" width="12" height="126" fill="url(#${id}_wall)"/>

      <!-- HUGE Panoramic Horizontal Wetland Window (x=84..372, y=22..112) -->
      <rect x="84" y="22" width="288" height="90" fill="rgba(255,255,255,0.06)" stroke="#8c7a62" stroke-width="2.2"/>
      <line x1="180" y1="22" x2="180" y2="112" stroke="#8c7a62" stroke-width="1.4"/>
      <line x1="276" y1="22" x2="276" y2="112" stroke="#8c7a62" stroke-width="1.4"/>
      <path d="M84 22 L118 22 Q102 68 110 112 L84 112 Z" fill="${s.isNight ? "#e5ddd0" : "#fffdf8"}" opacity="0.76"/>
      <path d="M96 22 Q88 68 94 112" stroke="#c9bfa9" stroke-width="1" fill="none"/>
      <path d="M372 22 L344 22 Q356 68 350 112 L372 112 Z" fill="${s.isNight ? "#e5ddd0" : "#fffdf8"}" opacity="0.72"/>
      ${s.isNight ? "" : `<polygon points="154,22 246,22 172,188 78,188" fill="url(#${id}_sun)"/>`}

      <!-- SIGNATURE BUILT-IN SUNLIT BAY-WINDOW BENCH (观景飘窗卧榻 x=84..372, y=112..148) -->
      <rect x="84" y="112" width="288" height="36" fill="${s.isNight ? "#d8cebc" : "#f3eadb"}" stroke="#c8b698" stroke-width="1.4"/>
      <rect x="92" y="122" width="84" height="20" rx="2" fill="${s.isNight ? "#ebe4d5" : "#fffdf8"}" stroke="#d9ccb8" stroke-width="1"/>
      <circle cx="134" cy="132" r="2" fill="#d4af37"/>
      <rect x="186" y="122" width="84" height="20" rx="2" fill="${s.isNight ? "#ebe4d5" : "#fffdf8"}" stroke="#d9ccb8" stroke-width="1"/>
      <circle cx="228" cy="132" r="2" fill="#d4af37"/>
      <rect x="280" y="122" width="84" height="20" rx="2" fill="${s.isNight ? "#ebe4d5" : "#fffdf8"}" stroke="#d9ccb8" stroke-width="1"/>
      <circle cx="322" cy="132" r="2" fill="#d4af37"/>
      <rect x="86" y="106" width="284" height="10" rx="4" fill="${s.isNight ? "#ede5d2" : "#fffbeb"}" stroke="#d4b483" stroke-width="1.1"/>
      <rect x="98" y="92" width="20" height="16" rx="5" fill="#0d9488" stroke="#115e59" stroke-width="0.9" transform="rotate(-12 108 100)"/>
      <rect x="118" y="95" width="18" height="14" rx="4.5" fill="#f59e0b" stroke="#b45309" stroke-width="0.9" transform="rotate(8 127 102)"/>
      <rect x="334" y="93" width="19" height="15" rx="5" fill="#ea580c" opacity="0.88" transform="rotate(10 343 100)"/>
      <rect x="206" y="103" width="44" height="4" rx="1.5" fill="#92400e"/>
      <ellipse cx="220" cy="99" rx="6.5" ry="4.5" fill="#fffdf8" stroke="#0d9488" stroke-width="0.9"/>
      <rect x="234" y="98" width="5" height="5" rx="1" fill="#ecfdf5" stroke="#0d9488" stroke-width="0.8"/>

      <!-- Open bronze sliding glass door -->
      <rect x="384" y="22" width="32" height="126" fill="none" stroke="#78716c" stroke-width="2.2"/>
      <rect x="384" y="22" width="11" height="126" fill="rgba(255,255,255,0.16)" stroke="#a8a29e" stroke-width="1"/>
      <rect x="392" y="78" width="2.4" height="18" rx="1" fill="#78350f"/>

      <!-- ==================== OUTDOOR WETLAND CEDAR BALCONY (x=416..720) ==================== -->
      <rect x="416" y="0" width="304" height="14" fill="${s.isNight ? "#593718" : "#8c5828"}"/>
      <rect x="456" y="0" width="8" height="18" fill="${s.isNight ? "#42260f" : "#6b3e18"}"/>
      <rect x="556" y="0" width="8" height="18" fill="${s.isNight ? "#42260f" : "#6b3e18"}"/>
      <rect x="656" y="0" width="8" height="18" fill="${s.isNight ? "#42260f" : "#6b3e18"}"/>
      <path d="M432 14 Q444 26 438 36 M688 14 Q676 28 684 40" stroke="${treeM}" stroke-width="2" fill="none"/>
      <circle cx="440" cy="28" r="3" fill="${treeL}"/><circle cx="682" cy="30" r="3" fill="${treeL}"/>
      <!-- Hanging woven rattan lantern -->
      <line x1="588" y1="14" x2="588" y2="28" stroke="#78350f" stroke-width="1.4"/>
      <path d="M578 36 Q588 22 598 36 Z" fill="#d9a55b" stroke="#78350f" stroke-width="1.1"/>
      ${lit ? `<circle cx="588" cy="40" r="14" fill="#fde047" opacity="0.22" filter="url(#hsGlowMd)"/>` : ""}
      <circle cx="588" cy="38" r="3.4" fill="#fef08a" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>

      <!-- Teak + glass handrail & swaying feathered reeds -->
      <rect x="416" y="114" width="304" height="34" fill="#e0f2fe" opacity="0.18"/>
      <line x1="416" y1="114" x2="720" y2="114" stroke="#78350f" stroke-width="3"/>
      <line x1="504" y1="114" x2="504" y2="148" stroke="#92400e" stroke-width="1.8"/>
      <line x1="604" y1="114" x2="604" y2="148" stroke="#92400e" stroke-width="1.8"/>
      <g stroke="${treeM}" stroke-width="1.7" fill="none" class="h-drift-slow">
        <path d="M438 148 Q432 122 440 104 M446 148 Q448 118 456 108 M454 148 Q460 126 466 116"/>
        <path d="M664 148 Q658 122 668 106 M674 148 Q678 120 686 110"/>
      </g>
      <g fill="#fef3c7" class="h-drift-slow">
        <ellipse cx="440" cy="103" rx="2.4" ry="4.5"/><ellipse cx="456" cy="107" rx="2.2" ry="4"/>
        <ellipse cx="668" cy="105" rx="2.4" ry="4.5"/><ellipse cx="686" cy="109" rx="2.2" ry="4"/>
      </g>

      <!-- Floors: Oak plank interior + Burmese teak outdoor deck -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      <g stroke="#8c7454" stroke-width="0.9" opacity="0.4">
        <line x1="0" y1="164" x2="416" y2="164"/><line x1="0" y1="180" x2="416" y2="180"/><line x1="0" y1="196" x2="416" y2="196"/>
        <line x1="88" y1="148" x2="56" y2="208"/><line x1="204" y1="148" x2="196" y2="208"/><line x1="324" y1="148" x2="352" y2="208"/>
      </g>
      <rect x="416" y="148" width="304" height="60" fill="url(#${id}_deck)"/>
      <g stroke="#5c3614" stroke-width="0.9" opacity="0.38">
        <line x1="416" y1="162" x2="720" y2="162"/><line x1="416" y1="176" x2="720" y2="176"/><line x1="416" y1="190" x2="720" y2="190"/>
      </g>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#64748b" stroke-width="3.6"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#fef3c7" stroke-width="1"/>

      <!-- Outdoor tiered wooden herb/hydrangea plant stand -->
      <g transform="translate(454, 160)">
        <ellipse cx="0" cy="4" rx="22" ry="4" fill="rgba(0,0,0,0.22)"/>
        <path d="M-16 2 L-12 -32 M16 2 L12 -32" stroke="#78350f" stroke-width="2.2"/>
        <rect x="-18" y="-12" width="36" height="3.5" rx="1" fill="#b45309"/>
        <rect x="-14" y="-26" width="28" height="3.5" rx="1" fill="#b45309"/>
        <rect x="-10" y="-34" width="9" height="8" rx="1.5" fill="#d96b43"/><circle cx="-5.5" cy="-38" r="5" fill="#93c5fd"/>
        <rect x="3" y="-34" width="8" height="8" rx="1.5" fill="#fffdf8"/><circle cx="7" cy="-37" r="4.5" fill="#22c55e"/>
        <rect x="-12" y="-20" width="9" height="8" rx="1.5" fill="#d96b43"/><circle cx="-7.5" cy="-23" r="4.5" fill="#f9a8d4"/>
        <rect x="3" y="-20" width="9" height="8" rx="1.5" fill="#b45309"/><circle cx="7.5" cy="-23" r="4.5" fill="#4ade80"/>
      </g>

      <!-- Outdoor cedar lounge chair + side table -->
      <g transform="translate(624, 166)">
        <ellipse cx="4" cy="5" rx="46" ry="6" fill="rgba(0,0,0,0.22)"/>
        <ellipse cx="-30" cy="-16" rx="14" ry="4" fill="#d9a55b" stroke="#78350f" stroke-width="1.1"/>
        <path d="M-36 -13 L-38 4 M-24 -13 L-22 4" stroke="#78350f" stroke-width="1.8"/>
        <rect x="-34" y="-24" width="5.5" height="7.5" rx="1" fill="#bae6fd" stroke="#0284c7" stroke-width="0.7"/>
        <rect x="-26" y="-19" width="9" height="3" rx="0.8" fill="#ef4444"/>
        <path d="M-8 -4 L-2 -28 L34 -28 L40 -4 Z" fill="#b45309" stroke="#5c2d0e" stroke-width="1.3"/>
        <rect x="-4" y="-24" width="36" height="16" rx="5" fill="#fffbeb" stroke="#d4b483" stroke-width="1"/>
        <rect x="-8" y="-10" width="44" height="9" rx="4" fill="#fef3c7" stroke="#d4b483" stroke-width="1"/>
        <rect x="2" y="-22" width="12" height="10" rx="3" fill="#0d9488" transform="rotate(-10 8 -17)"/>
        <line x1="-4" y1="-1" x2="-6" y2="6" stroke="#5c2d0e" stroke-width="2.4"/><line x1="32" y1="-1" x2="34" y2="6" stroke="#5c2d0e" stroke-width="2.4"/>
      </g>
    `;
  });

  // ==================== T6: 3 BESPOKE HANGZHOU LUXURY ESTATES (+ flagship xixi = 4) ====================

  // 15. 🌆 武林壹号天幕平层 — 270° Black-Gold Canal Penthouse + Illuminated Wine Cellar + Cloud Fire-Pit Deck!
  R.registerHouseArt("wulin_yihao", (dp) => {
    const s = skyOf(dp);
    const id = `wl_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight
      ? ["#050816", "#0f1d3d", "#223059", "#3b335c"]
      : (s.isDusk
        ? ["#1e1b4b", "#7c2d6e", "#f97316", "#fde68a"]
        : (s.isDawn
          ? ["#5b88d6", "#f5c2d1", "#fde68a", "#fef3c7"]
          : ["#3b82f6", "#7dd3fc", "#bae6fd", "#e0f2fe"]));
    const canalC = s.isNight ? ["#172554", "#0a1229"] : (s.isDusk ? ["#3b2a5c", "#172042"] : ["#7dd3fc", "#0284c7"]);
    const bld = lit ? ["#0f172a", "#131c33", "#0e1529", "#141e36", "#111930"] : ["#94a3b8", "#7c8ea6", "#6b7d96", "#889ab2", "#a3b3c6"];
    const flrC = s.isNight ? ["#292e3d", "#1e222e", "#13161f"] : (s.isDusk ? ["#4a4654", "#383440", "#26232d"] : ["#f3efe6", "#e4ddd0", "#cfc6b4"]);
    const deckC = s.isNight ? ["#1e2433", "#0d1018"] : (s.isDusk ? ["#474352", "#2d2a36"] : ["#cbd5e1", "#94a3b8"]);
    const ceilW = lit ? "#12141c" : "#e5dfd3";
    const cellarBg = lit ? "#161822" : "#dfd8cc";
    const winOp = lit ? "0.8" : "0.42";
    const skyCel = s.isNight
      ? `${stars([[152,30,1.1],[244,24,1.2],[332,32,1.0,"#fff"],[458,22,1.2],[540,18,1.1,"#bae6fd"],[628,28,1.3]])}${moon(668, 34, 12)}`
      : `<circle cx="668" cy="${s.isDusk || s.isDawn ? 40 : 32}" r="14" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92" filter="url(#hsGlowMd)"/>
        <g class="h-drift-slow" fill="${s.isDusk ? "#fed7aa" : "#ffffff"}" opacity="${s.isDusk ? "0.46" : "0.8"}">
          <ellipse cx="268" cy="40" rx="32" ry="7.5"/><ellipse cx="566" cy="36" rx="36" ry="8"/>
        </g>`;
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="48%" stop-color="${sky[1]}"/><stop offset="84%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/>
        </linearGradient>
        <linearGradient id="${id}_gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b45309"/><stop offset="32%" stop-color="#fde047"/><stop offset="62%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <linearGradient id="${id}_canal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${canalC[0]}"/><stop offset="100%" stop-color="${canalC[1]}"/>
        </linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${flrC[0]}"/><stop offset="55%" stop-color="${flrC[1]}"/><stop offset="100%" stop-color="${flrC[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${deckC[0]}"/><stop offset="100%" stop-color="${deckC[1]}"/>
        </linearGradient>
      </defs>

      <!-- Wulin Square & Grand Canal Sky -->
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${skyCel}

      <!-- Grand Canal water + Hangzhou Global Center Spire + Wulin CBD -->
      <rect x="0" y="120" width="720" height="28" fill="url(#${id}_canal)"/>
      <g>
        <rect x="120" y="54" width="32" height="68" fill="${bld[0]}"/>
        <rect x="160" y="38" width="40" height="84" fill="${bld[1]}"/>
        <polygon points="212,122 224,28 238,28 250,122" fill="${bld[2]}" stroke="${lit ? "#fbbf24" : "#cbd5e1"}" stroke-width="0.7"/>
        <line x1="231" y1="16" x2="231" y2="28" stroke="#fde047" stroke-width="1.4"/>
        <circle cx="231" cy="16" r="1.8" fill="#ef4444" class="h-twinkle" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <rect x="260" y="46" width="44" height="76" fill="${bld[3]}"/>
        <rect x="312" y="60" width="38" height="62" fill="${bld[0]}"/>
        <!-- Outdoor panorama towers -->
        <rect x="434" y="44" width="42" height="78" fill="${bld[4]}"/>
        <polygon points="488,122 502,24 518,24 532,122" fill="${bld[2]}" stroke="${lit ? "#fbbf24" : "#cbd5e1"}" stroke-width="0.8"/>
        <line x1="510" y1="12" x2="510" y2="24" stroke="#fde047" stroke-width="1.5"/>
        <circle cx="510" cy="12" r="1.8" fill="#ef4444" class="h-twinkle-d1" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <rect x="544" y="36" width="50" height="86" fill="${bld[3]}"/>
        <rect x="604" y="52" width="42" height="70" fill="${bld[0]}"/>
        <rect x="654" y="38" width="48" height="84" fill="${bld[1]}"/>
        <g fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}">
          <rect x="166" y="48" width="28" height="2.6"/><rect x="166" y="58" width="10" height="3.5"/><rect x="182" y="58" width="12" height="3.5"/>
          <rect x="166" y="70" width="28" height="2.4" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="166" y="82" width="14" height="3.5"/>
          <rect x="223" y="44" width="16" height="2.4" fill="${lit ? "#fde047" : "#f1f5f9"}"/><rect x="221" y="58" width="20" height="2.4"/><rect x="219" y="74" width="24" height="2.4" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/>
          <rect x="268" y="56" width="28" height="2.6"/><rect x="268" y="68" width="10" height="3.5"/><rect x="284" y="68" width="10" height="3.5"/>
          <rect x="441" y="54" width="28" height="2.5"/><rect x="441" y="66" width="28" height="2.5" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="441" y="78" width="12" height="3.5"/>
          <rect x="500" y="40" width="20" height="2.5" fill="${lit ? "#fde047" : "#f1f5f9"}"/><rect x="498" y="54" width="24" height="2.5"/><rect x="496" y="70" width="28" height="2.5" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/>
          <rect x="552" y="46" width="34" height="2.6"/><rect x="552" y="58" width="14" height="4"/><rect x="572" y="58" width="14" height="4"/>
          <rect x="552" y="72" width="34" height="2.6" fill="${lit ? "#fbbf24" : "#cbd5e1"}"/><rect x="662" y="48" width="32" height="2.6"/><rect x="662" y="62" width="32" height="2.6" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/>
        </g>
        <!-- Arched Canal Bridge & Painted Cruise Boat (大运河画舫游船) -->
        <path d="M558 126 Q596 108 634 126" fill="none" stroke="${lit ? "#fde047" : "#e2e8f0"}" stroke-width="2" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <g class="h-drift-slow" transform="translate(474, 134)">
          <path d="M-18 0 H18 L13 4 H-13 Z" fill="#78350f" stroke="#fde047" stroke-width="0.7"/>
          <rect x="-11" y="-6" width="22" height="6" rx="1" fill="${lit ? "#fef08a" : "#fffdf8"}" opacity="0.92" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
          <path d="M-14 -6 Q0 -11 14 -6 Z" fill="#1e293b"/>
        </g>
        <g stroke="${lit ? "#fde68a" : "#ffffff"}" stroke-width="1.2" opacity="0.52" stroke-linecap="round">
          <line x1="210" y1="130" x2="256" y2="130" class="h-drift"/><line x1="490" y1="129" x2="546" y2="129" class="h-drift-slow"/>
          <line x1="566" y1="135" x2="634" y2="135" stroke="${lit ? "#38bdf8" : "#e0f2fe"}" class="h-drift"/><line x1="654" y1="130" x2="704" y2="130" class="h-drift-slow"/>
        </g>
      </g>

      <!-- ==================== INDOOR PENTHOUSE (x=0..416) ==================== -->
      <rect x="0" y="0" width="416" height="20" fill="${ceilW}"/>
      <line x1="0" y1="20" x2="416" y2="20" stroke="url(#${id}_gold)" stroke-width="2.2" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <!-- LEFT FEATURE: Floor-to-Ceiling Illuminated Wine Cellar Wall (顶天立地发光红酒墙) -->
      <rect x="0" y="20" width="106" height="128" fill="${cellarBg}" stroke="${lit ? "#334155" : "#c7beae"}" stroke-width="1"/>
      <rect x="8" y="26" width="90" height="116" rx="3" fill="${lit ? "#231914" : "#5c4028"}" stroke="url(#${id}_gold)" stroke-width="1.3"/>
      <rect x="12" y="30" width="82" height="108" fill="#f59e0b" opacity="${lit ? "0.14" : "0.09"}"/>
      <g stroke="#d4af37" stroke-width="1.1" opacity="0.85">
        <line x1="12" y1="54" x2="94" y2="54"/><line x1="12" y1="78" x2="94" y2="78"/>
        <line x1="12" y1="102" x2="94" y2="102"/><line x1="12" y1="126" x2="94" y2="126"/>
        <line x1="53" y1="30" x2="53" y2="138"/>
      </g>
      <g>
        <rect x="18" y="42" width="4.5" height="11" rx="1" fill="#7f1d1d"/><rect x="26" y="40" width="4.5" height="13" rx="1" fill="#14532d"/>
        <rect x="34" y="43" width="4.5" height="10" rx="1" fill="#991b1b"/><rect x="60" y="41" width="5" height="12" rx="1" fill="#b45309"/>
        <rect x="70" y="43" width="4.5" height="10" rx="1" fill="#7f1d1d"/><rect x="78" y="40" width="5" height="13" rx="1" fill="#166534"/>
        <rect x="18" y="66" width="5" height="11" rx="1" fill="#991b1b"/><circle cx="34" cy="72" r="4.5" fill="#fef3c7" opacity="0.85"/>
        <rect x="62" y="65" width="4.5" height="12" rx="1" fill="#7f1d1d"/><rect x="72" y="66" width="4.5" height="11" rx="1" fill="#d97706"/>
        <rect x="20" y="90" width="4.5" height="11" rx="1" fill="#14532d"/><rect x="30" y="91" width="4.5" height="10" rx="1" fill="#7f1d1d"/>
        <rect x="62" y="90" width="5" height="11" rx="1" fill="#991b1b"/><rect x="76" y="92" width="4.5" height="9" rx="1" fill="#b45309"/>
      </g>

      <!-- 270° Ultra-Wide Frameless Glass Curtain Wall (x=106..384) + Champagne Doorway -->
      <rect x="106" y="20" width="278" height="128" fill="url(#hsGlassSheen)" stroke="#334155" stroke-width="1.4"/>
      <line x1="200" y1="20" x2="200" y2="148" stroke="#64748b" stroke-width="1.1" opacity="0.45"/>
      <line x1="292" y1="20" x2="292" y2="148" stroke="#64748b" stroke-width="1.1" opacity="0.45"/>
      <path d="M106 20 L122 20 Q116 84 120 148 L106 148 Z" fill="#e5d5bc" opacity="0.66"/>
      <rect x="384" y="20" width="32" height="128" fill="none" stroke="url(#${id}_gold)" stroke-width="1.8"/>
      <rect x="384" y="20" width="10" height="128" fill="rgba(255,255,255,0.09)"/>

      <!-- ==================== OUTDOOR CLOUD SKY-DECK (x=416..720) ==================== -->
      <rect x="416" y="116" width="304" height="32" fill="#bae6fd" opacity="0.14"/>
      <line x1="416" y1="116" x2="720" y2="116" stroke="url(#${id}_gold)" stroke-width="2.6" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <line x1="506" y1="116" x2="506" y2="148" stroke="#64748b" stroke-width="1.4"/>
      <line x1="612" y1="116" x2="612" y2="148" stroke="#64748b" stroke-width="1.4"/>

      <!-- Polished Black-Gold Marble Indoor Floor + Dark Sky-Deck -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      <path d="M24 166 Q114 156 206 178 T392 162" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.4"/>
      <path d="M0 170 H416 M0 190 H416 M110 148 L72 208 M260 148 L274 208" stroke="#475569" stroke-width="0.9" opacity="0.42"/>
      <rect x="416" y="148" width="304" height="60" fill="url(#${id}_deck)"/>
      <path d="M416 168 H720 M416 188 H720" stroke="#334155" stroke-width="0.9" opacity="0.45"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#${id}_gold)" stroke-width="3"/>

      <!-- Outdoor Luxury Fire-Pit Lounge Sofa & Champagne Ice Bucket -->
      <g transform="translate(598, 166)">
        <ellipse cx="0" cy="6" rx="68" ry="8" fill="rgba(0,0,0,0.4)"/>
        <path d="M-56 -2 C-58 -24 -44 -28 -26 -24 L26 -24 C44 -28 58 -24 56 -2 Z" fill="#f5efe4" stroke="#b8a58b" stroke-width="1.2"/>
        <rect x="-48" y="-12" width="96" height="10" rx="4" fill="#fffdf8"/>
        <rect x="-24" y="-6" width="48" height="12" rx="3" fill="#18181b" stroke="url(#${id}_gold)" stroke-width="1.3"/>
        <circle cx="0" cy="-12" r="18" fill="#f97316" opacity="${lit ? "0.24" : "0.1"}" filter="url(#hsGlowMd)"/>
        <path d="M-9 -6 Q-4 -20 0 -15 Q5 -22 9 -6 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
        <path d="M-4 -6 Q0 -15 4 -6 Z" fill="#fef08a"/>
        <path d="M-20 -6 L-18 -14 H-10 L-8 -6 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8"/>
        <line x1="-14" y1="-14" x2="-12" y2="-21" stroke="#15803d" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `;
  });

  // 16. 🌹 云栖玫瑰园法式庄园 — French Boiserie Fireplace Salon + Climbing Rose Pergola & 3-Tier Versailles Fountain!
  R.registerHouseArt("yunqi_rose", (dp) => {
    const s = skyOf(dp);
    const id = `yr_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight
      ? ["#0b1124", "#1d2948", "#2e3b60", "#3b3252"]
      : (s.isDusk
        ? ["#4338ca", "#e1596a", "#fb923c", "#fde68a"]
        : (s.isDawn
          ? ["#7aa7e8", "#fbcfe8", "#fde68a", "#ffe4e6"]
          : ["#60a5fa", "#bae6fd", "#fef3c7", "#fde2e4"]));
    const wallC = s.isNight ? ["#ddd3c3", "#cabda8"] : ["#fffdf8", "#f0e5d1"];
    const flrC = s.isNight ? ["#cfc2ae", "#b8a991"] : ["#f5ede0", "#dfd2bc"];
    const outFlr = s.isNight ? "#8a857d" : "#e5dfd3";
    const cypD = s.isNight ? "#0d381e" : "#14532d";
    const cypL = s.isNight ? "#14532d" : "#15803d";
    const skyCel = s.isNight
      ? `${stars([[188,30,1.1],[312,26,1.2],[456,22,1.2],[544,20,1.0,"#fff"],[602,32,1.1,"#fecdd3"]])}${moon(644, 34, 14)}`
      : `<circle cx="644" cy="${s.isDusk || s.isDawn ? 42 : 34}" r="15" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92" filter="url(#hsGlowMd)"/>
        <g class="h-drift-slow" fill="${s.isDusk ? "#fed7aa" : "#ffffff"}" opacity="0.86">
          <ellipse cx="220" cy="40" rx="28" ry="8"/><ellipse cx="240" cy="36" rx="16" ry="6"/>
          <ellipse cx="496" cy="34" rx="34" ry="9"/><ellipse cx="520" cy="30" rx="20" ry="7"/>
        </g>`;
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="52%" stop-color="${sky[1]}"/><stop offset="88%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/>
        </linearGradient>
        <linearGradient id="${id}_gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b45309"/><stop offset="50%" stop-color="#fde047"/><stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/>
        </linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${flrC[0]}"/><stop offset="100%" stop-color="${flrC[1]}"/>
        </linearGradient>
      </defs>

      <!-- Wuyun Mountain Chateau Sky -->
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${skyCel}
      <!-- Wuyun Mountain layered tea hills -->
      <path d="M0 106 Q140 62 300 98 Q460 58 620 94 Q676 80 720 90 L720 148 L0 148 Z" fill="${s.isNight ? "#153a34" : "#6ee7b7"}" opacity="0.54"/>
      <path d="M0 120 Q180 94 360 116 Q540 90 720 114 L720 148 L0 148 Z" fill="${s.isNight ? "#134e4a" : "#34d399"}" opacity="0.58"/>
      <!-- Manicured French Cypress trees & blooming rose hedge -->
      <ellipse cx="446" cy="108" rx="11" ry="30" fill="${cypD}"/><ellipse cx="468" cy="114" rx="9" ry="24" fill="${cypL}"/>
      <ellipse cx="688" cy="108" rx="11" ry="30" fill="${cypD}"/><ellipse cx="666" cy="114" rx="9" ry="24" fill="${cypL}"/>
      <rect x="416" y="128" width="304" height="20" rx="6" fill="${cypL}"/>
      <g>
        <circle cx="436" cy="134" r="3" fill="#f43f5e"/><circle cx="452" cy="138" r="2.6" fill="#fbcfe8"/>
        <circle cx="476" cy="134" r="3" fill="#fb7185"/><circle cx="668" cy="134" r="3" fill="#f43f5e"/>
        <circle cx="686" cy="138" r="2.8" fill="#fda4af"/><circle cx="704" cy="134" r="3" fill="#e11d48"/>
      </g>

      <!-- Outdoor Grand Rose Pergola Arch + 3-Tier Versailles Stone Fountain -->
      <g transform="translate(566, 148)">
        <rect x="-82" y="-76" width="10" height="76" fill="${s.isNight ? "#cbd5e1" : "#faf5eb"}" stroke="#94a3b8" stroke-width="1"/>
        <rect x="72" y="-76" width="10" height="76" fill="${s.isNight ? "#cbd5e1" : "#faf5eb"}" stroke="#94a3b8" stroke-width="1"/>
        <rect x="-86" y="-80" width="18" height="5" rx="1" fill="${s.isNight ? "#cbd5e1" : "#f1f5f9"}"/>
        <rect x="68" y="-80" width="18" height="5" rx="1" fill="${s.isNight ? "#cbd5e1" : "#f1f5f9"}"/>
        <path d="M-82 -78 Q0 -106 82 -78" fill="none" stroke="${s.isNight ? "#cbd5e1" : "#faf5eb"}" stroke-width="6.5"/>
        <path d="M-78 -14 Q-82 -48 -76 -76 Q0 -102 76 -76 Q82 -48 78 -14" fill="none" stroke="${cypD}" stroke-width="11" stroke-linecap="round"/>
        <path d="M-74 -74 Q0 -98 74 -74" fill="none" stroke="${cypL}" stroke-width="6" stroke-linecap="round"/>
        <g>
          <circle cx="-76" cy="-42" r="5" fill="#e11d48"/><circle cx="-74" cy="-64" r="5.5" fill="#f472b6"/>
          <circle cx="-54" cy="-82" r="6" fill="#e11d48"/><circle cx="-30" cy="-90" r="6.5" fill="#fb7185"/>
          <circle cx="-6" cy="-93" r="6" fill="#fecdd3"/><circle cx="18" cy="-92" r="6.5" fill="#e11d48"/>
          <circle cx="42" cy="-86" r="6" fill="#f472b6"/><circle cx="66" cy="-76" r="5.5" fill="#fb7185"/>
          <circle cx="76" cy="-54" r="5" fill="#e11d48"/><circle cx="76" cy="-34" r="4.8" fill="#fda4af"/>
          <circle cx="-52" cy="-84" r="2.4" fill="#ffe4e6"/><circle cx="20" cy="-93" r="2.6" fill="#ffe4e6"/>
          <circle cx="-28" cy="-91" r="2.5" fill="#fff1f2"/><circle cx="44" cy="-87" r="2.4" fill="#fff1f2"/>
        </g>
        ${lit ? `<circle cx="0" cy="-88" r="2.8" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
          <circle cx="-48" cy="-78" r="2.4" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
          <circle cx="48" cy="-78" r="2.4" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d2"/>` : ""}
        <!-- Classical 3-Tier Carved Versailles Fountain -->
        <ellipse cx="0" cy="-2" rx="44" ry="10" fill="${s.isNight ? "#94a3b8" : "#e2e8f0"}" stroke="#64748b" stroke-width="1.3"/>
        <ellipse cx="0" cy="-3" rx="36" ry="7" fill="${s.isNight ? "#0284c7" : "#38bdf8"}" opacity="0.88"/>
        <rect x="-5" y="-32" width="10" height="29" fill="${s.isNight ? "#cbd5e1" : "#f8fafc"}" stroke="#94a3b8" stroke-width="0.9"/>
        <ellipse cx="0" cy="-20" rx="22" ry="5.5" fill="${s.isNight ? "#cbd5e1" : "#f8fafc"}" stroke="#94a3b8" stroke-width="1"/>
        <ellipse cx="0" cy="-34" rx="12" ry="3.5" fill="${s.isNight ? "#cbd5e1" : "#f8fafc"}" stroke="#94a3b8" stroke-width="0.9"/>
        <path d="M0 -36 V-50 M0 -48 Q-12 -40 -16 -22 M0 -48 Q12 -40 16 -22 M-18 -20 Q-28 -12 -30 -4 M18 -20 Q28 -12 30 -4" stroke="#bae6fd" stroke-width="1.8" fill="none" stroke-dasharray="4 3" class="h-flow" stroke-linecap="round"/>
      </g>

      <!-- ==================== INDOOR FRENCH CHATEAU SALON (x=0..416) ==================== -->
      <path d="M0 0 H416 V148 H0 Z M154 146 V58 A50 34 0 0 1 254 58 V146 Z M272 146 V58 A50 34 0 0 1 372 58 V146 Z" fill="url(#${id}_wall)" fill-rule="evenodd"/>
      <rect x="0" y="0" width="416" height="18" fill="${s.isNight ? "#cfc2ac" : "#f0e4cd"}"/>
      <line x1="0" y1="18" x2="416" y2="18" stroke="url(#${id}_gold)" stroke-width="2"/>

      <!-- LEFT FEATURE: Carved Marble Fireplace + Gilded Baroque Oil Painting + Candlesticks -->
      <rect x="20" y="92" width="96" height="56" rx="2" fill="${s.isNight ? "#e2d9c8" : "#f8f4eb"}" stroke="#c9b89c" stroke-width="1.5"/>
      <rect x="14" y="87" width="108" height="7" rx="2" fill="${s.isNight ? "#ede5d5" : "#fffdf8"}" stroke="#d4af37" stroke-width="1.2"/>
      <path d="M40 148 V116 A28 20 0 0 1 96 116 V148 Z" fill="#18181b" stroke="#d4af37" stroke-width="1.3"/>
      ${lit ? `<circle cx="68" cy="134" r="24" fill="#f97316" opacity="0.22" filter="url(#hsGlowMd)"/>` : ""}
      <path d="M54 146 Q62 126 68 120 Q74 132 80 124 Q84 138 78 146 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <path d="M60 146 Q66 132 71 130 Q75 140 73 146 Z" fill="#fef08a"/>
      <rect x="34" y="30" width="68" height="46" rx="3" fill="#fef3c7" stroke="url(#${id}_gold)" stroke-width="2.4"/>
      <rect x="39" y="35" width="58" height="36" fill="#bae6fd"/>
      <path d="M39 62 Q68 48 97 60 V71 H39 Z" fill="#4ade80"/>
      <circle cx="54" cy="60" r="3" fill="#e11d48"/><circle cx="78" cy="58" r="3" fill="#f472b6"/>
      <rect x="24" y="75" width="3" height="12" fill="#fffdf8"/><circle cx="25.5" cy="73" r="2.2" fill="#fde047" class="h-twinkle" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <rect x="109" y="75" width="3" height="12" fill="#fffdf8"/><circle cx="110.5" cy="73" r="2.2" fill="#fde047" class="h-twinkle-d1" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>

      <!-- Twin Gilded Arched French Windows + Burgundy Velvet Drapery -->
      <path d="M154 146 V58 A50 34 0 0 1 254 58 V146 Z" fill="none" stroke="#d4af37" stroke-width="2.4"/>
      <line x1="204" y1="24" x2="204" y2="146" stroke="#d4af37" stroke-width="1.2" opacity="0.72"/>
      <path d="M272 146 V58 A50 34 0 0 1 372 58 V146 Z" fill="none" stroke="#d4af37" stroke-width="2.4"/>
      <line x1="322" y1="24" x2="322" y2="146" stroke="#d4af37" stroke-width="1.2" opacity="0.72"/>
      <path d="M148 24 H168 Q158 76 164 148 H148 Z" fill="#be123c" opacity="0.8"/>
      <path d="M378 24 H358 Q368 76 362 148 H378 Z" fill="#be123c" opacity="0.8"/>
      <rect x="384" y="20" width="32" height="128" fill="none" stroke="#d4af37" stroke-width="2"/>

      <!-- Floors: French Limestone + Chateau Terrace + Stone Urn + 3-Tier Macaron Tea Table -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      <path d="M0 168 H416 M0 188 H416 M104 148 L66 208 M208 148 V208 M312 148 L350 208" stroke="#cbb898" stroke-width="0.9" opacity="0.5"/>
      <rect x="416" y="148" width="304" height="60" fill="${outFlr}"/>
      <path d="M416 168 H720 M416 188 H720 M492 148 L472 208 M568 148 V208 M644 148 L664 208" stroke="${s.isNight ? "#64748b" : "#c4bcb0"}" stroke-width="0.9" opacity="0.55"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#${id}_gold)" stroke-width="3"/>
      <g transform="translate(454, 158)">
        <path d="M-10 2 L-7 -8 H7 L10 2 Z M-12 -18 H12 L8 -8 H-8 Z" fill="${s.isNight ? "#cbd5e1" : "#f8fafc"}" stroke="#94a3b8" stroke-width="1"/>
        <circle cx="-6" cy="-22" r="5" fill="#16a34a"/><circle cx="6" cy="-22" r="5" fill="#15803d"/>
        <circle cx="0" cy="-25" r="4.5" fill="#e11d48"/><circle cx="-6" cy="-24" r="3.5" fill="#f472b6"/><circle cx="6" cy="-24" r="3.5" fill="#fda4af"/>
      </g>
      <g transform="translate(652, 168)">
        <ellipse cx="0" cy="4" rx="34" ry="5" fill="rgba(0,0,0,0.2)"/>
        <ellipse cx="0" cy="-16" rx="22" ry="5" fill="#fffdf8" stroke="#94a3b8" stroke-width="1.2"/>
        <line x1="0" y1="-11" x2="0" y2="4" stroke="#475569" stroke-width="2.2"/>
        <line x1="0" y1="-17" x2="0" y2="-33" stroke="#d4af37" stroke-width="1.2"/>
        <line x1="-8" y1="-21" x2="8" y2="-21" stroke="#f8fafc" stroke-width="1.8"/>
        <line x1="-6" y1="-27" x2="6" y2="-27" stroke="#f8fafc" stroke-width="1.8"/>
        <circle cx="-4" cy="-23" r="2" fill="#f472b6"/><circle cx="4" cy="-23" r="2" fill="#fde047"/>
        <circle cx="0" cy="-29" r="2" fill="#e11d48"/>
      </g>
    `;
  });

  // 17. 🏯 江南里中式合院 — Rosewood Grand Hall + Ink Folding Screen + Horse-Head Wall, Moon Gate & Koi Brook!
  R.registerHouseArt("jiangnanli", (dp) => {
    const s = skyOf(dp);
    const id = `jn_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight
      ? ["#0a1224", "#1a2845", "#263a5c"]
      : (s.isDusk
        ? ["#3b336b", "#d96b43", "#fde68a"]
        : (s.isDawn
          ? ["#8ab4e8", "#f5d0d8", "#fef3c7"]
          : ["#6ca6e8", "#cbe8fc", "#f0f9f4"]));
    const plaster = s.isNight ? "#cbd5e1" : "#ffffff";
    const tile = s.isNight ? "#0f172a" : "#1e293b";
    const wallC = s.isNight ? ["#dfd8ca", "#ccc3b2"] : ["#fcfaf4", "#ebe5d8"];
    const treeD = s.isNight ? "#0d381e" : "#14532d";
    const treeM = s.isNight ? "#14532d" : "#15803d";
    const treeL = s.isNight ? "#166534" : "#22c55e";
    const skyCel = s.isNight
      ? `${stars([[224,34,1.1],[312,30,1.2],[462,20,1.1],[548,18,1.2,"#fff"],[610,28,1.1]])}${moon(648, 34, 13)}`
      : `<circle cx="648" cy="${s.isDusk || s.isDawn ? 40 : 34}" r="14" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.9" filter="url(#hsGlowSm)"/>
        <g class="h-drift-slow" fill="${s.isDusk ? "#fed7aa" : "#ffffff"}" opacity="0.78">
          <ellipse cx="268" cy="48" rx="26" ry="7"/><ellipse cx="486" cy="34" rx="30" ry="8"/><ellipse cx="508" cy="30" rx="16" ry="6"/>
        </g>`;
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4a1c12"/><stop offset="100%" stop-color="#2e0f09"/>
        </linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/>
        </linearGradient>
        <clipPath id="${id}_mg"><circle cx="576" cy="104" r="38"/></clipPath>
      </defs>

      <!-- Serene Jiangnan Sky -->
      <rect width="720" height="208" fill="url(#${id}_sky)"/>
      ${skyCel}
      <!-- Distant misty Jiangnan garden greenery seen through indoor lattice window -->
      <path d="M180 112 Q248 86 314 108 Q352 94 388 104 V148 H180 Z" fill="${s.isNight ? "#153a34" : "#4ade80"}" opacity="0.54"/>

      <!-- Courtyard Outer White-Wall Black-Tile with Classic Stepped Horse-Head Gables (马头墙) -->
      <path d="M416 148 V52 H446 V42 H486 V54 H720 V148 Z" fill="${plaster}" stroke="#94a3b8" stroke-width="0.9"/>
      <path d="M414 52 H448 V40 H488 V52 H720 V45 H492 V34 H442 V46 H414 Z" fill="${tile}"/>
      <rect x="416" y="136" width="304" height="12" fill="${s.isNight ? "#64748b" : "#cbd5e1"}" opacity="0.65"/>

      <!-- Circular MOON GATE (月洞门) framing inner water pavilion, willow & lotus pond -->
      <g clip-path="url(#${id}_mg)">
        <rect x="536" y="64" width="80" height="80" fill="${s.isNight ? "#162947" : (s.isDusk ? "#f59e0b" : "#bae6fd")}"/>
        <path d="M536 106 Q576 92 616 104 V144 H536 Z" fill="${s.isNight ? "#153a34" : "#86efac"}" opacity="0.62"/>
        <rect x="572" y="90" width="30" height="22" fill="${s.isNight ? "#cbd5e1" : "#fffdf8"}" stroke="#94a3b8" stroke-width="0.8"/>
        <path d="M564 92 Q587 76 610 92 L604 94 Q587 82 570 94 Z" fill="${tile}"/>
        <rect x="582" y="98" width="10" height="12" fill="#fde047" opacity="${lit ? "0.95" : "0.78"}" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
        <rect x="536" y="112" width="80" height="32" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.78"/>
        <line x1="548" y1="122" x2="582" y2="122" stroke="${lit ? "#fde68a" : "#ffffff"}" stroke-width="1" opacity="0.6" class="h-drift"/>
        <ellipse cx="592" cy="126" rx="7" ry="2.4" fill="${treeM}"/><circle cx="592" cy="124" r="2.2" fill="#f9a8d4"/>
        <path d="M548 112 Q554 90 562 76" stroke="#5c2d0e" stroke-width="3.2" fill="none"/>
        <ellipse cx="562" cy="76" rx="18" ry="8" fill="${treeM}"/>
        <g stroke="${treeL}" stroke-width="1.1" fill="none" opacity="0.82" class="h-drift-slow">
          <path d="M552 80 Q548 96 552 108"/><path d="M562 82 Q560 98 564 110"/><path d="M570 80 Q572 94 568 104"/>
        </g>
      </g>
      <circle cx="576" cy="104" r="38" fill="none" stroke="${tile}" stroke-width="3.2"/>
      <circle cx="576" cy="104" r="41" fill="none" stroke="#94a3b8" stroke-width="1.2"/>
      <!-- Carved Stone Plaque ("江南里") -->
      <rect x="556" y="54" width="40" height="11" rx="1.5" fill="#1e293b" stroke="#d4af37" stroke-width="0.9"/>
      <text x="576" y="62" font-size="6.8" font-weight="900" fill="#fde68a" text-anchor="middle">江 南 里</text>

      <!-- Hanging traditional red silk palace lantern -->
      <line x1="510" y1="48" x2="510" y2="62" stroke="#d4af37" stroke-width="1.3"/>
      ${lit ? `<circle cx="510" cy="71" r="18" fill="#f97316" opacity="0.22" filter="url(#hsGlowMd)"/>` : ""}
      <ellipse cx="510" cy="71" rx="8.5" ry="10.5" fill="#dc2626" stroke="#fbbf24" stroke-width="1.2" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <rect x="505" y="60" width="10" height="3" fill="#f59e0b"/><rect x="505" y="80" width="10" height="3" fill="#f59e0b"/>
      <line x1="510" y1="83" x2="510" y2="93" stroke="#ef4444" stroke-width="1.8"/>

      <!-- Sculpted Multi-Hole Taihu Scholar's Rock + Swaying Bamboo Grove -->
      <g transform="translate(464, 148)">
        <g stroke="${treeM}" stroke-width="2.4" class="h-drift-slow">
          <line x1="-22" y1="0" x2="-26" y2="-66"/><line x1="-14" y1="0" x2="-10" y2="-74"/><line x1="-6" y1="0" x2="-4" y2="-58"/>
        </g>
        <g fill="${treeL}" opacity="0.86" class="h-drift-slow">
          <ellipse cx="-26" cy="-54" rx="10" ry="3.5" transform="rotate(-18 -26 -54)"/>
          <ellipse cx="-8" cy="-64" rx="11" ry="3.5" transform="rotate(16 -8 -64)"/>
          <ellipse cx="-18" cy="-42" rx="9" ry="3" transform="rotate(14 -18 -42)"/>
        </g>
        <path d="M-10 0 C-16 -16 -12 -36 2 -46 C14 -52 26 -42 22 -24 C30 -16 28 -4 18 0 Z" fill="${s.isNight ? "#64748b" : "#94a3b8"}" stroke="#475569" stroke-width="1.3"/>
        <ellipse cx="4" cy="-26" rx="4.5" ry="6.5" fill="${plaster}"/>
        <circle cx="14" cy="-14" r="3" fill="${plaster}"/>
      </g>
      <!-- Ancient Welcome Pine (迎客松) -->
      <g transform="translate(684, 148)">
        <path d="M0 0 Q-6 -32 -22 -52" stroke="#5c2d0e" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="-26" cy="-54" rx="22" ry="8" fill="${treeD}"/>
        <ellipse cx="-8" cy="-66" rx="24" ry="9" fill="${treeM}"/>
      </g>

      <!-- ==================== INDOOR ROSEWOOD GRAND HALL (x=0..416) ==================== -->
      <!-- Left plaster hall wall & right window pillar (center window x=184..376 open to real sky!) -->
      <rect x="0" y="0" width="184" height="148" fill="url(#${id}_wall)"/>
      <rect x="376" y="22" width="8" height="126" fill="url(#${id}_wall)"/>
      <rect x="0" y="0" width="416" height="22" fill="url(#${id}_wood)"/>
      <line x1="0" y1="22" x2="416" y2="22" stroke="#d4af37" stroke-width="1.4" opacity="0.8"/>
      <rect x="0" y="22" width="16" height="126" fill="url(#${id}_wood)"/>
      <rect x="172" y="22" width="12" height="126" fill="url(#${id}_wood)"/>

      <!-- LEFT FEATURE: 3-Panel Ink Landscape Folding Screen + Rosewood Altar Table + Blue-White Porcelain -->
      <g>
        <rect x="26" y="34" width="42" height="84" fill="${s.isNight ? "#ebe4d5" : "#fffdf7"}" stroke="#5c2d0e" stroke-width="1.8"/>
        <rect x="70" y="34" width="42" height="84" fill="${s.isNight ? "#ebe4d5" : "#fffdf7"}" stroke="#5c2d0e" stroke-width="1.8"/>
        <rect x="114" y="34" width="42" height="84" fill="${s.isNight ? "#ebe4d5" : "#fffdf7"}" stroke="#5c2d0e" stroke-width="1.8"/>
        <path d="M28 96 Q54 68 88 86 Q116 62 154 88 V116 H28 Z" fill="#64748b" opacity="0.48"/>
        <path d="M28 104 Q72 82 118 98 Q138 86 154 96 V116 H28 Z" fill="#334155" opacity="0.45"/>
        <circle cx="136" cy="52" r="5" fill="#dc2626" opacity="0.8"/>
        <rect x="34" y="114" width="114" height="6" rx="1.5" fill="#4a1c12"/>
        <rect x="42" y="120" width="5" height="28" fill="#4a1c12"/><rect x="135" y="120" width="5" height="28" fill="#4a1c12"/>
        <ellipse cx="91" cy="105" rx="7" ry="9" fill="#ffffff" stroke="#1d4ed8" stroke-width="1.2"/>
        <path d="M86 105 Q91 101 96 105" stroke="#2563eb" stroke-width="1.2" fill="none"/>
        <path d="M91 96 Q86 84 96 78" stroke="#5c2d0e" stroke-width="1.4" fill="none"/>
        <circle cx="96" cy="79" r="2.2" fill="#f43f5e"/><circle cx="89" cy="84" r="2" fill="#fb7185"/>
      </g>

      <!-- CENTER-RIGHT: Ornate Rosewood Lattice Garden Window (回字格栅花窗 x=184..376) -->
      <rect x="184" y="22" width="192" height="126" fill="url(#hsGlassSheen)" stroke="#4a1c12" stroke-width="2.4"/>
      <g stroke="#5c2d0e" stroke-width="1.5" opacity="0.85">
        <line x1="184" y1="44" x2="376" y2="44"/><line x1="248" y1="22" x2="248" y2="148"/><line x1="312" y1="22" x2="312" y2="148"/>
        <rect x="192" y="28" width="48" height="10" fill="none"/><rect x="256" y="28" width="48" height="10" fill="none"/><rect x="320" y="28" width="48" height="10" fill="none"/>
      </g>
      <rect x="384" y="22" width="32" height="126" fill="none" stroke="#4a1c12" stroke-width="2.4"/>

      <!-- Floors: Suzhou Imperial Gold-Brick Indoor Floor + Courtyard Slate + Koi Stream & Stone Bridge -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#475569" : "#64748b"}"/>
      <path d="M0 168 H416 M0 188 H416 M96 148 L62 208 M208 148 V208 M320 148 L354 208" stroke="#334155" stroke-width="1" opacity="0.55"/>
      <rect x="416" y="148" width="304" height="60" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
      <path d="M416 184 Q512 164 608 184 Q664 196 720 178 V208 H416 Z" fill="${s.isNight ? "#0369a1" : "#0ea5e9"}" opacity="0.74"/>
      <ellipse cx="526" cy="186" rx="5.5" ry="2" fill="#ef4444" class="h-drift"/>
      <ellipse cx="644" cy="192" rx="5" ry="1.8" fill="#f59e0b" class="h-drift-slow"/>
      <polygon points="552,166 604,166 610,196 546,196" fill="${s.isNight ? "#94a3b8" : "#cbd5e1"}" stroke="#475569" stroke-width="1.2"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#d4af37" stroke-width="2.6"/>
    `;
  });

  // ==================== T7: 4 WORLD WONDER PALACES ====================

  // 21. 🌋 熔岩黑曜石堡 — Volcanic basalt gothic vault with twin magma falls & glowing fissures
  // ==================== T7: 4 EPIC WONDER SANCTUARIES ====================

  // 21. 🏰 黑曜石熔岩堡
  R.registerHouseArt("obsidian_fortress", (dp) => {
    const s = skyOf(dp);
    const id = `ob_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const bg = s.isNight
      ? ["#14070a", "#3b0c0c", "#9a3412"]
      : (s.isDusk
        ? ["#3b0764", "#c2410c", "#fbbf24"]
        : (s.isDawn
          ? ["#60a5fa", "#fbcfe8", "#fdba74"]
          : ["#38bdf8", "#bae6fd", "#fed7aa"]));
    const mtn = s.isNight ? "#1c0d10" : (s.isDusk ? "#431407" : "#78716c");
    const arch = s.isNight ? "#18121e" : (s.isDusk ? "#2d1b24" : "#57534e");
    const col = s.isNight ? "#1c1917" : (s.isDusk ? "#352620" : "#78716c");
    const flr = s.isNight ? "#18181b" : (s.isDusk ? "#292524" : "#a8a29e");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="56%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? stars([[96,24,1.2,"#fde68a"],[210,18,1.3,"#fff"],[312,26,1.2,"#fb923c"]]) : `<circle cx="210" cy="${s.isDusk || s.isDawn ? 56 : 44}" r="18" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.9" filter="url(#hsGlowMd)"/>`}
      <!-- Jagged volcanic highland ridges in distance -->
      <path d="M0 148 L42 86 L92 126 L154 74 L210 112 L268 72 L332 124 L380 84 L420 148 Z" fill="${mtn}" opacity="${lit ? "0.78" : "0.62"}"/>
      <!-- Twin molten magma waterfalls -->
      <rect x="58" y="22" width="24" height="126" fill="${lit ? "#ea580c" : "#f97316"}" opacity="0.88" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <line x1="70" y1="22" x2="70" y2="148" stroke="#fef08a" stroke-width="5" stroke-dasharray="14 8" class="h-flow-rev"/>
      <rect x="338" y="22" width="24" height="126" fill="${lit ? "#ea580c" : "#f97316"}" opacity="0.88" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
      <line x1="350" y1="22" x2="350" y2="148" stroke="#fef08a" stroke-width="5" stroke-dasharray="14 8" class="h-flow-rev"/>
      <!-- Gothic basalt vault & carved rune columns -->
      <path d="M0 0 H420 V42 Q315 12 210 42 Q105 12 0 42 Z" fill="${arch}" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="114" y="24" width="22" height="124" fill="${col}" stroke="#f59e0b" stroke-width="1.2"/>
      <rect x="284" y="24" width="22" height="124" fill="${col}" stroke="#f59e0b" stroke-width="1.2"/>
      <line x1="125" y1="42" x2="125" y2="132" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" class="h-pulse"/>
      <line x1="295" y1="42" x2="295" y2="132" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" class="h-pulse"/>
      <circle cx="98" cy="112" r="2" fill="#fde047" class="h-steam"/>
      <circle cx="210" cy="96" r="2.2" fill="#fb923c" class="h-steam-d1"/>
      <circle cx="322" cy="108" r="2" fill="#fef08a" class="h-steam"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      <path d="M44 166 L96 178 L142 168 M274 172 L326 164 L378 180" fill="none" stroke="${lit ? "#ea580c" : "#d97706"}" stroke-width="1.2" opacity="0.68"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#f97316" stroke-width="2.4" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
    `;
  });

  // 22. ☁️ 天空之城浮岛宫 — Floating marble citadel over golden-rimmed volumetric clouds
  R.registerHouseArt("sky_castle", (dp) => {
    const s = skyOf(dp);
    const id = `sc_${s.phase}`;
    const bg = s.isNight
      ? ["#090e24", "#1e1b4b", "#312e81"]
      : (s.isDusk
        ? ["#4338ca", "#f472b6", "#fde68a"]
        : (s.isDawn
          ? ["#60a5fa", "#fbcfe8", "#fef9c3"]
          : ["#0284c7", "#7dd3fc", "#fffbeb"]));
    const cl1 = s.isNight ? "#475569" : (s.isDusk ? "#fbcfe8" : "#ffffff");
    const cl2 = s.isNight ? "#334155" : (s.isDusk ? "#fed7aa" : "#fffbeb");
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="48%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight
        ? `${stars([[64,34,1.3,"#fff"],[128,22,1.5,"#fde68a"],[294,26,1.4,"#bae6fd"],[356,42,1.2,"#fff"]])}${moon(336, 44, 14)}`
        : `<path d="M56 146 A154 118 0 0 1 364 146" fill="none" stroke="url(#hsPrism)" stroke-width="9" opacity="${s.isDusk ? "0.28" : "0.45"}" filter="url(#hsGlowSm)"/>
           <circle cx="336" cy="${s.isDusk || s.isDawn ? 48 : 38}" r="15" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92" filter="url(#hsGlowMd)"/>`}
      <!-- Distant floating castle island with spires -->
      <g class="h-float-slow" transform="translate(210, 74)">
        <path d="M-38 14 L0 36 L38 14 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
        <rect x="-26" y="-8" width="52" height="22" fill="${s.isNight ? "#cbd5e1" : "url(#hsIvory)"}" stroke="#94a3b8" stroke-width="0.9"/>
        <polygon points="-24,-8 -16,-24 -8,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/><polygon points="8,-8 16,-24 24,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/>
        <polygon points="-8,-8 0,-32 8,-8" fill="#fbbf24"/>
        ${s.isNight ? `<rect x="-18" y="-2" width="5" height="7" rx="2" fill="#fef08a" filter="url(#hsGlowSm)"/><rect x="-2.5" y="-3" width="5" height="8" rx="2" fill="#fde047" filter="url(#hsGlowSm)"/><rect x="13" y="-2" width="5" height="7" rx="2" fill="#fef08a" filter="url(#hsGlowSm)"/>` : ""}
      </g>
      <!-- Volumetric cloud sea -->
      <g class="h-drift-slow" opacity="${s.isNight ? "0.8" : "0.94"}">
        <ellipse cx="64" cy="130" rx="58" ry="22" fill="${cl1}"/>
        <ellipse cx="146" cy="138" rx="52" ry="18" fill="${cl2}"/>
        <ellipse cx="274" cy="138" rx="54" ry="18" fill="${cl2}"/>
        <ellipse cx="356" cy="128" rx="58" ry="22" fill="${cl1}"/>
      </g>
      <!-- Sculpted ivory Corinthian columns with gold capitals -->
      <path d="M0 0 H420 V24 Q210 6 0 24 Z" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      <rect x="28" y="20" width="18" height="128" fill="${flr}" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="24" y="20" width="26" height="7" rx="2" fill="url(#hsGoldH)"/>
      <rect x="374" y="20" width="18" height="128" fill="${flr}" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="370" y="20" width="26" height="7" rx="2" fill="url(#hsGoldH)"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#64748b" : "#d4af37", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
    `;
  });

  // 23. ❄️ 极光冰晶宫殿 — Faceted Gothic Ice-Crystal Arches & Arctic Fjord (Sunlit Crystal Day vs Aurora Polar Night!)
  R.registerHouseArt("aurora_ice_palace", (dp) => {
    const s = skyOf(dp);
    const id = `ai_${s.phase}`;
    const bg = s.isNight
      ? ["#030f22", "#0a2d54", "#19527a"]
      : (s.isDusk
        ? ["#312e81", "#7e22ce", "#fbcfe8"]
        : (s.isDawn
          ? ["#38bdf8", "#bae6fd", "#fce7f3"]
          : ["#0ea5e9", "#7dd3fc", "#f0f9ff"]));
    const mtn = s.isNight ? "#0f3a60" : (s.isDusk ? "#4c1d95" : "#7dd3fc");
    const flr = s.isNight ? "#0e3a5c" : (s.isDusk ? "#3b2f63" : "#bae6fd");
    const archFill = s.isNight ? "#7dd3fc" : "#ffffff";
    const archOp = s.isNight ? "0.22" : "0.42";
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight || s.isDusk ? `
      <g class="h-aurora" filter="url(#hsGlowMd)" opacity="${s.isNight ? "1" : "0.68"}">
        <path d="M0 44 Q114 8 216 38 Q318 68 420 22" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="22" opacity="0.78"/>
        <path d="M18 66 Q146 28 258 56 Q346 76 410 40" fill="none" stroke="url(#hsAuroraGold)" stroke-width="12" opacity="0.54"/>
      </g>` : `
      <!-- Radiant Arctic sun halo & diamond-dust sunbeams by day -->
      <circle cx="210" cy="48" r="24" fill="#ffffff" opacity="0.78" filter="url(#hsGlowLg)"/>
      <circle cx="210" cy="48" r="46" fill="none" stroke="#e0f2fe" stroke-width="1.5" opacity="0.65"/>
      <polygon points="154,0 266,0 320,148 100,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      <!-- Distant snow-capped Arctic fjord peaks -->
      <path d="M0 148 L64 102 L126 132 L210 88 L294 130 L356 98 L420 148 Z" fill="${mtn}" opacity="0.78"/>
      <path d="M210 88 L226 104 L210 100 L194 104 Z M64 102 L78 114 L64 111 L50 114 Z M356 98 L370 112 L356 108 L342 112 Z" fill="#ffffff" opacity="0.88"/>
      <!-- Sculpted translucent Gothic Ice-Crystal Cathedral Arches -->
      <path d="M0 0 H420 V42 Q350 6 280 54 V148 H266 V56 Q210 10 154 56 V148 H140 V54 Q70 6 0 42 Z" fill="${archFill}" fill-opacity="${archOp}" stroke="${s.isNight ? "#bae6fd" : "#ffffff"}" stroke-width="1.4"/>
      <!-- Hanging shimmering icicle prism cluster -->
      <polygon points="186,22 192,22 189,44" fill="#e0f2fe" opacity="0.85"/>
      <polygon points="206,18 214,18 210,48" fill="#ffffff" opacity="0.92"/>
      <polygon points="228,22 234,22 231,42" fill="#e0f2fe" opacity="0.85"/>
      ${s.isNight ? stars([[86,32,1.5,"#e0f2fe"],[194,24,1.6,"#fff"],[326,30,1.5,"#bae6fd"],[246,74,1.3,"#a5f3fc"]]) : ""}
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      <rect x="0" y="148" width="420" height="60" fill="url(#hsGlassSheen)" opacity="0.65"/>
      <path d="M36 164 L108 176 L154 162 M268 178 L334 164 L388 182" fill="none" stroke="${s.isNight ? "#bae6fd" : "#ffffff"}" stroke-width="1.1" opacity="0.58"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="${s.isNight ? "#7dd3fc" : "#ffffff"}" stroke-width="2.2" filter="url(#hsGlowSm)"/>
    `;
  });

  // 24. 🏺 空中花园黄金阁 — Stepped Babylonian terraces, turquoise cascades & lush vine curtains
  R.registerHouseArt("hanging_gardens", (dp) => {
    const s = skyOf(dp);
    const id = `hg_${s.phase}`;
    const bg = s.isNight
      ? ["#090f24", "#1e293b", "#312e81"]
      : (s.isDusk
        ? ["#7c2d12", "#f97316", "#fde68a"]
        : (s.isDawn
          ? ["#60a5fa", "#fbcfe8", "#fef3c7"]
          : ["#0ea5e9", "#bae6fd", "#fef3c7"]));
    const ter1 = s.isNight ? "#94a3b8" : "#f3ead8";
    const ter2 = s.isNight ? "#cbd5e1" : "#faf4e6";
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    const vine = s.isNight ? "#14532d" : "#22c55e";
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? `${stars([[90,34,1.3,"#fff"],[148,26,1.2,"#fde68a"],[286,28,1.3,"#bae6fd"],[344,36,1.2,"#fff"]])}${moon(324, 42, 13)}` : `<circle cx="324" cy="${s.isDusk || s.isDawn ? 48 : 38}" r="15" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92" filter="url(#hsGlowMd)"/>`}
      <!-- Stepped Babylonian terraced sanctuary in distance with cascading waterfall -->
      <rect x="130" y="88" width="160" height="60" fill="${ter1}" stroke="#d4af37" stroke-width="1.2"/>
      <rect x="156" y="62" width="108" height="26" fill="${ter2}" stroke="#d4af37" stroke-width="1.2"/>
      <rect x="196" y="64" width="28" height="84" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}" opacity="0.78"/>
      <line x1="210" y1="64" x2="210" y2="148" stroke="#e0f2fe" stroke-width="4" stroke-dasharray="10 6" class="h-flow-rev"/>
      ${s.isNight ? `<g filter="url(#hsGlowSm)"><circle cx="146" cy="96" r="3" fill="#fef08a"/><circle cx="274" cy="96" r="3" fill="#fef08a"/><circle cx="172" cy="70" r="2.6" fill="#fde047"/><circle cx="248" cy="70" r="2.6" fill="#fde047"/></g>` : ""}
      <!-- Grand ivory-and-gold colonnade framing -->
      <rect x="0" y="0" width="420" height="24" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <rect x="30" y="24" width="22" height="124" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      <rect x="368" y="24" width="22" height="124" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      <path d="M132 148 V78 A78 54 0 0 1 288 78 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <!-- Lush overflowing hanging emerald vine curtains & flowers -->
      <g stroke="${s.isNight ? "#052e16" : "#15803d"}" stroke-width="2.6" fill="none" class="h-drift-slow">
        <path d="M70 24 Q64 62 76 96 Q70 118 78 134"/><path d="M98 24 Q106 58 96 92"/>
        <path d="M322 24 Q330 62 318 96 Q324 116 316 132"/><path d="M348 24 Q340 56 350 88"/>
      </g>
      <g fill="${vine}">
        <circle cx="72" cy="54" r="6"/><circle cx="76" cy="84" r="5.5"/><circle cx="100" cy="60" r="6"/>
        <circle cx="320" cy="56" r="6"/><circle cx="316" cy="88" r="5.5"/><circle cx="346" cy="62" r="6"/>
        <ellipse cx="164" cy="88" rx="18" ry="6"/><ellipse cx="256" cy="88" rx="18" ry="6"/>
      </g>
      <circle cx="74" cy="68" r="3" fill="#fde047"/><circle cx="318" cy="70" r="3" fill="#f472b6"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#64748b" : "#d4af37", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
    `;
  });

  // ==================== T8: 4 INTERSTELLAR ERA STATIONS ====================

  // 25. 🌕 月球静海科研舱 (Sunlit Lunar Day vs Starry Lunar Night)
  R.registerHouseArt("lunar_base", (dp) => {
    const s = skyOf(dp);
    const id = `lb_${s.phase}`;
    const sky = s.isNight
      ? ["#050814", "#0a1026"]
      : (s.isDusk
        ? ["#1e1b4b", "#4c1d95"]
        : (s.isDawn
          ? ["#1e3a8a", "#60a5fa"]
          : ["#1d4ed8", "#93c5fd"]));
    const surf = s.isNight ? "#475569" : (s.isDusk ? "#78716c" : "#e2e8f0");
    const crat = s.isNight ? "#334155" : (s.isDusk ? "#57534e" : "#cbd5e1");
    const flr = s.isNight ? "#1e293b" : (s.isDusk ? "#475569" : "#f1f5f9");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="100%" stop-color="${sky[1]}"/>
        </linearGradient>
        <radialGradient id="${id}_earth" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#60a5fa"/><stop offset="55%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight || s.isDusk ? stars([[42,24,1.3,"#fff"],[112,42,1.1],[184,20,1.4,"#bae6fd"],[336,28,1.2,"#fff"],[384,52,1.3]]) : `
      <!-- Blazing lunar-day solar corona flare -->
      <circle cx="96" cy="40" r="24" fill="#fffbeb" opacity="0.86" filter="url(#hsGlowLg)"/>
      <circle cx="96" cy="40" r="44" fill="#fde68a" opacity="0.22" filter="url(#hsGlowMd)"/>`}
      <!-- Luminous blue Earthrise with atmospheric halo & cloud swirls -->
      <g transform="translate(274, 58)" class="h-float-slow">
        <circle cx="0" cy="0" r="35" fill="#38bdf8" opacity="0.24" filter="url(#hsGlowMd)"/>
        <circle cx="0" cy="0" r="28" fill="url(#${id}_earth)" stroke="#93c5fd" stroke-width="1.2"/>
        <path d="M-16 -10 Q-2 -20 10 -8 Q18 2 6 14 Q-8 18 -14 6 Z" fill="#22c55e" opacity="0.78"/>
        <path d="M-22 2 Q0 -7 22 4" fill="none" stroke="#ffffff" stroke-width="2.8" opacity="0.74" stroke-linecap="round"/>
      </g>
      <!-- Shaded Sea of Tranquility craters -->
      <path d="M0 116 Q108 102 210 120 Q316 130 420 110 L420 148 L0 148 Z" fill="${surf}"/>
      <ellipse cx="94" cy="132" rx="26" ry="7" fill="${crat}" stroke="#94a3b8" stroke-width="0.9"/>
      <ellipse cx="332" cy="128" rx="30" ry="8" fill="${crat}" stroke="#94a3b8" stroke-width="0.9"/>
      <!-- Pressurized geodesic dome struts -->
      <path d="M0 148 Q210 -18 420 148" fill="none" stroke="${s.isNight ? "#94a3b8" : "#ffffff"}" stroke-width="2.8" opacity="0.72"/>
      <path d="M62 148 L120 68 L210 48 L300 68 L358 148" fill="none" stroke="${s.isNight ? "#64748b" : "#e2e8f0"}" stroke-width="1.4" opacity="0.58"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#38bdf8" : "#94a3b8", 0.25)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#38bdf8" stroke-width="2.2" ${s.isNight ? 'filter="url(#hsGlowSm)"' : ""}/>
    `;
  });

  // 26. 🛰️ 火星红岩生态穹顶 (Bright Peach Martian Day vs Blue-Sunset Dusk vs Starry Martian Night)
  R.registerHouseArt("mars_dome", (dp) => {
    const s = skyOf(dp);
    const id = `md_${s.phase}`;
    const sky = s.isNight
      ? ["#0b0918", "#2b1015", "#5c1d14"]
      : (s.isDusk
        ? ["#3b120e", "#9a3412", "#7dd3fc"]
        : (s.isDawn
          ? ["#9a3412", "#fb923c", "#fde68a"]
          : ["#ea580c", "#fdba74", "#ffedd5"]));
    const m1 = s.isNight ? "#431407" : (s.isDusk ? "#7c2d12" : "#c2410c");
    const m2 = s.isNight ? "#5c200c" : (s.isDusk ? "#b45309" : "#ea580c");
    const flr = s.isNight ? "#27272a" : (s.isDusk ? "#44403c" : "#e7e5e4");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight
        ? `${stars([[64,28,1.2,"#fff"],[154,22,1.3,"#fde68a"],[252,32,1.1,"#fff"],[356,24,1.2,"#fed7aa"]])}<circle cx="332" cy="44" r="9" fill="#cbd5e1" opacity="0.88"/><circle cx="304" cy="34" r="4.5" fill="#94a3b8" opacity="0.78"/>`
        : `<circle cx="338" cy="${s.isDusk || s.isDawn ? 48 : 38}" r="15" fill="${s.isDusk ? "#bae6fd" : "#fffbeb"}" opacity="0.92" filter="url(#hsGlowMd)"/>`}
      <!-- Layered Valles Marineris canyon mesas -->
      <path d="M0 112 L52 84 L112 110 L182 76 L248 114 L322 80 L384 110 L420 94 L420 148 L0 148 Z" fill="${m1}"/>
      <path d="M0 130 Q140 118 280 132 Q360 136 420 124 L420 148 L0 148 Z" fill="${m2}"/>
      <!-- Mars rover & solar panel array -->
      <g transform="translate(310, 134)">
        <rect x="-12" y="-8" width="24" height="6" rx="1.5" fill="#e2e8f0"/>
        <line x1="-8" y1="-8" x2="-8" y2="-16" stroke="#cbd5e1" stroke-width="1.5"/>
        <circle cx="-8" cy="-17" r="2.2" fill="#38bdf8"/>
        <circle cx="-8" cy="0" r="3" fill="#1e293b"/><circle cx="0" cy="0" r="3" fill="#1e293b"/><circle cx="8" cy="0" r="3" fill="#1e293b"/>
      </g>
      <path d="M0 148 C34 14 386 14 420 148" fill="url(#hsGlassSheen)" opacity="${s.isNight ? "0.18" : "0.28"}" stroke="#f8fafc" stroke-width="2.8"/>
      <line x1="210" y1="30" x2="210" y2="148" stroke="#cbd5e1" stroke-width="1.6" opacity="0.5"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#52525b" : "#a8a29e", 0.3)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#fb923c" stroke-width="2.2"/>
    `;
  });

  // 27. 🪐 土星冰环观景站 — Proper back/front ring occlusion (Sunlit Platinum Day Deck vs Starry Night Deck)
  R.registerHouseArt("saturn_ring_station", (dp) => {
    const s = skyOf(dp);
    const id = `sr_${s.phase}`;
    const bg = s.isNight
      ? ["#050816", "#1e1b4b", "#312e81"]
      : (s.isDusk
        ? ["#312e81", "#7c2d6e", "#f59e0b"]
        : (s.isDawn
          ? ["#1d4ed8", "#60a5fa", "#fde68a"]
          : ["#0284c7", "#7dd3fc", "#fef3c7"]));
    const deck = s.isNight ? "#1e293b" : (s.isDusk ? "#334155" : "#e2e8f0");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="60%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
        <linearGradient id="${id}_pl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.isNight ? "#fde68a" : "#fffbeb"}"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight || s.isDusk
        ? stars([[54,28,1.3,"#fff"],[148,22,1.2,"#bae6fd"],[298,24,1.4,"#fde68a"],[374,40,1.2,"#fff"],[96,64,1.1,"#e0f2fe"]])
        : `<circle cx="78" cy="48" r="20" fill="#fffbeb" opacity="0.88" filter="url(#hsGlowLg)"/>`}
      <!-- Back half of Saturn rings -->
      <ellipse cx="294" cy="94" rx="164" ry="26" transform="rotate(-14 294 94)" fill="none" stroke="${s.isNight ? "#e0f2fe" : "#ffffff"}" stroke-width="8" opacity="0.56"/>
      <!-- Banded Saturn body -->
      <circle cx="294" cy="94" r="44" fill="url(#${id}_pl)" filter="url(#hsGlowSm)"/>
      <path d="M254 84 Q294 90 334 80 M252 100 Q294 106 336 96" stroke="#92400e" stroke-width="2.4" fill="none" opacity="0.34"/>
      <!-- Front half of Saturn icy rings crossing cleanly in front of planet -->
      <path d="M134 132 A164 26 -14 0 0 454 56" fill="none" stroke="${s.isNight ? "#e0f2fe" : "#ffffff"}" stroke-width="8" opacity="0.82"/>
      <path d="M156 126 A142 20 -14 0 0 432 62" fill="none" stroke="#fde68a" stroke-width="3" stroke-dasharray="18 8" class="h-flow"/>
      <rect x="0" y="0" width="420" height="20" fill="${deck}"/>
      <line x1="0" y1="20" x2="420" y2="20" stroke="${s.isNight ? "#7dd3fc" : "#38bdf8"}" stroke-width="1.8"/>
      <rect x="0" y="148" width="420" height="60" fill="${deck}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#38bdf8" : "#64748b", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#38bdf8" stroke-width="2.2" ${s.isNight ? 'filter="url(#hsGlowSm)"' : ""}/>
    `;
  });

  // 28. ☀️ 戴森球恒星殿 (Blazing Golden Daylight Cathedral vs Solar Eclipse Night Hall)
  R.registerHouseArt("dyson_sphere", (dp) => {
    const s = skyOf(dp);
    const id = `ds_${s.phase}`;
    const bg = s.isNight
      ? ["#fef08a", "#f59e0b", "#451a03", "#090402"]
      : (s.isDusk
        ? ["#ffffff", "#fde047", "#ea580c", "#431407"]
        : ["#ffffff", "#fef9c3", "#fde68a", "#f59e0b"]);
    const pil = s.isNight ? "#18120e" : (s.isDusk ? "#451a03" : "#fffbeb");
    const flr = s.isNight ? "#1c140c" : (s.isDusk ? "#451a03" : "#fef3c7");
    return `
      <defs>
        <radialGradient id="${id}_star" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="28%" stop-color="${bg[1]}"/><stop offset="62%" stop-color="${bg[2]}"/><stop offset="100%" stop-color="${bg[3]}"/>
        </radialGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_star)"/>
      ${s.isNight ? stars([[84,26,1.3,"#fef08a"],[338,28,1.3,"#fff"],[114,122,1.1,"#fde047"],[310,120,1.1,"#fff"]]) : ""}
      <g transform="translate(210, 82)">
        <circle cx="0" cy="0" r="38" fill="${s.isNight ? "#180a02" : "#ffffff"}" stroke="${s.isNight ? "#fef08a" : "#fde047"}" stroke-width="${s.isNight ? "4" : "2"}" opacity="0.95" filter="url(#hsGlowLg)" class="h-pulse"/>
        <g class="h-spin-slow">
          <ellipse cx="0" cy="0" rx="116" ry="34" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2" stroke-dasharray="22 10"/>
        </g>
        <g class="h-spin-rev">
          <ellipse cx="0" cy="0" rx="84" ry="26" transform="rotate(-18)" fill="none" stroke="${s.isNight ? "#fef08a" : "#d97706"}" stroke-width="2.2" stroke-dasharray="14 8"/>
        </g>
      </g>
      <!-- Hexagonal megastructure pillars -->
      <polygon points="0,0 74,0 44,148 0,148" fill="${pil}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <polygon points="420,0 346,0 376,148 420,148" fill="${pil}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <line x1="22" y1="36" x2="54" y2="36" stroke="#f59e0b" stroke-width="1.4" opacity="0.65"/>
      <line x1="366" y1="36" x2="398" y2="36" stroke="#f59e0b" stroke-width="1.4" opacity="0.65"/>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, "#d97706", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6" filter="url(#hsGlowSm)"/>
    `;
  });

  // ==================== T9: 4 DIMENSIONAL SANCTUARIES ====================

  // 29. 🔮 量子镜像浮殿 — Bright Crystalline Sky-Mirror Day vs Deep Neon Midnight Portal
  R.registerHouseArt("quantum_mirror", (dp) => {
    const s = skyOf(dp);
    const id = `qm_${s.phase}`;
    const bg = s.isNight
      ? ["#09071a", "#1e1b4b", "#0f172a"]
      : (s.isDusk
        ? ["#3b0764", "#9d174d", "#fbcfe8"]
        : (s.isDawn
          ? ["#bfdbfe", "#f5d0fe", "#fef9c3"]
          : ["#bae6fd", "#f0f9ff", "#ede9fe"]));
    const flr = s.isNight ? "#0d1026" : (s.isDusk ? "#311842" : "#e2e8f0");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? stars([[52,22,1.2,"#fff"],[132,20,1.3,"#38bdf8"],[288,24,1.3,"#f0abfc"],[366,22,1.2,"#fff"]]) : `<polygon points="140,0 280,0 340,148 80,148" fill="url(#hsSunbeam)" opacity="0.32"/>`}
      <!-- Infinite receding diamond mirror portal corridor -->
      <polygon points="210,12 316,80 210,148 104,80" fill="${s.isNight ? "none" : "rgba(255,255,255,0.28)"}" stroke="${s.isNight ? "#38bdf8" : "#0284c7"}" stroke-width="1.6" opacity="0.75"/>
      <polygon points="210,28 288,80 210,132 132,80" fill="none" stroke="${s.isNight ? "#c084fc" : "#9333ea"}" stroke-width="1.5" opacity="0.78"/>
      <polygon points="210,46 258,80 210,114 162,80" fill="${s.isNight ? "#22d3ee" : "#ffffff"}" fill-opacity="${s.isNight ? "0.18" : "0.52"}" stroke="${s.isNight ? "#f472b6" : "#ec4899"}" stroke-width="1.5" class="h-pulse"/>
      <!-- Floating faceted quantum crystal octahedrons -->
      <g class="h-float" ${s.isNight ? 'filter="url(#hsGlowSm)"' : ""}>
        <polygon points="68,36 86,62 68,88 50,62" fill="#38bdf8" fill-opacity="0.34" stroke="${s.isNight ? "#7dd3fc" : "#0284c7"}" stroke-width="1.3"/>
        <line x1="68" y1="36" x2="68" y2="88" stroke="#ffffff" stroke-width="1"/>
      </g>
      <g class="h-float-slow" ${s.isNight ? 'filter="url(#hsGlowSm)"' : ""}>
        <polygon points="352,36 370,62 352,88 334,62" fill="#c084fc" fill-opacity="0.34" stroke="${s.isNight ? "#f0abfc" : "#7e22ce"}" stroke-width="1.3"/>
        <line x1="352" y1="36" x2="352" y2="88" stroke="#ffffff" stroke-width="1"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#38bdf8" : "#94a3b8", 0.25)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsPrism)" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // 30. ⏳ 时光裂隙钟楼 — Sunlit Golden Cathedral Clockface Day vs Starry Midnight Velvet Clocktower
  R.registerHouseArt("time_clocktower", (dp) => {
    const s = skyOf(dp);
    const id = `tc_${s.phase}`;
    const bg = s.isNight
      ? ["#3b1d5e", "#140c24", "#07050f"]
      : (s.isDusk
        ? ["#f59e0b", "#7c2d6e", "#1e1b4b"]
        : (s.isDawn
          ? ["#fef3c7", "#fbcfe8", "#60a5fa"]
          : ["#fffbeb", "#bae6fd", "#38bdf8"]));
    const dialBg = s.isNight ? "#1e1b4b" : (s.isDusk ? "#4c1d95" : "#fffbeb");
    const flr = s.isNight ? "#120c1f" : (s.isDusk ? "#2e1a36" : "#f3ead8");
    const handC = s.isNight ? "#fef08a" : "#b45309";
    return `
      <defs>
        <radialGradient id="${id}_bg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="60%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </radialGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? stars([[44,24,1.3,"#fde68a"],[122,18,1.2,"#fff"],[300,22,1.3,"#bae6fd"],[376,28,1.2,"#fff"]]) : `<polygon points="150,0 270,0 326,148 94,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      <!-- Grand celestial clockface rose-window -->
      <g transform="translate(210, 82)">
        <circle cx="0" cy="0" r="68" fill="${dialBg}" fill-opacity="${s.isNight ? "0.52" : "0.78"}" stroke="url(#hsGoldH)" stroke-width="2.6"/>
        <g class="h-spin-slow">
          <circle cx="0" cy="0" r="58" fill="none" stroke="#d97706" stroke-width="4.5" stroke-dasharray="6 8" opacity="0.82"/>
          <line x1="-66" y1="0" x2="66" y2="0" stroke="#d97706" stroke-width="1.2" opacity="0.52"/>
          <line x1="0" y1="-66" x2="0" y2="66" stroke="#d97706" stroke-width="1.2" opacity="0.52"/>
        </g>
        <g class="h-spin-rev">
          <circle cx="0" cy="0" r="36" fill="none" stroke="${s.isNight ? "#38bdf8" : "#0284c7"}" stroke-width="2" stroke-dasharray="10 6"/>
        </g>
        <line x1="0" y1="0" x2="0" y2="-42" stroke="${handC}" stroke-width="2.4" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="30" y2="15" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="4.8" fill="#fef08a" stroke="#d97706" stroke-width="1" filter="url(#hsGlowSm)"/>
      </g>
      <!-- Flanking golden gears -->
      <g transform="translate(84, 58)" class="h-spin-rev" opacity="${s.isNight ? "0.62" : "0.78"}">
        <circle cx="0" cy="0" r="24" fill="none" stroke="#d97706" stroke-width="4" stroke-dasharray="5 6"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" stroke-width="1.4"/>
      </g>
      <g transform="translate(336, 58)" class="h-spin-rev" opacity="${s.isNight ? "0.62" : "0.78"}">
        <circle cx="0" cy="0" r="24" fill="none" stroke="#d97706" stroke-width="4" stroke-dasharray="5 6"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" stroke-width="1.4"/>
      </g>
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, "#d97706", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
    `;
  });

  // 31. 🌠 银河核心星云阁 (Luminous Celadon-Jade Day Pavilion vs Deep Space Emerald Night)
  R.registerHouseArt("galactic_core", (dp) => {
    const s = skyOf(dp);
    const id = `gc_${s.phase}`;
    const bg = s.isNight
      ? ["#10b981", "#0f3d4c", "#1e1b4b", "#050816"]
      : (s.isDusk
        ? ["#34d399", "#0e7490", "#6b21a8", "#1e1b4b"]
        : (s.isDawn
          ? ["#ecfdf5", "#a7f3d0", "#bae6fd", "#fbcfe8"]
          : ["#ffffff", "#a7f3d0", "#7dd3fc", "#38bdf8"]));
    const eave = s.isNight ? "#064e3b" : (s.isDusk ? "#0f766e" : "#ecfdf5");
    const flr = s.isNight ? "#071e26" : (s.isDusk ? "#134e4a" : "#d1fae5");
    return `
      <defs>
        <radialGradient id="${id}_bg" cx="50%" cy="44%" r="65%">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="32%" stop-color="${bg[1]}"/><stop offset="70%" stop-color="${bg[2]}"/><stop offset="100%" stop-color="${bg[3]}"/>
        </radialGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      <g transform="translate(210, 78)" class="h-spin-slow" opacity="${s.isNight ? "0.74" : "0.62"}">
        <ellipse cx="0" cy="0" rx="146" ry="40" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="11" filter="url(#hsGlowMd)"/>
        <ellipse cx="0" cy="0" rx="96" ry="26" transform="rotate(24)" fill="none" stroke="url(#hsAuroraGold)" stroke-width="8"/>
      </g>
      <circle cx="210" cy="78" r="17" fill="#ffffff" opacity="0.92" filter="url(#hsGlowLg)" class="h-pulse"/>
      <!-- Upturned jade-and-gold celestial pavilion eaves -->
      <path d="M0 0 H420 V26 Q315 10 210 24 Q105 10 0 26 Z" fill="${eave}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      ${s.isNight || s.isDusk ? stars([[54,48,1.6,"#fef08a"],[118,62,1.3,"#6ee7b7"],[298,56,1.6,"#fef08a"],[362,44,1.4,"#38bdf8"],[156,36,1.2,"#fff"],[264,34,1.2,"#fff"]]) : ""}
      <rect x="0" y="148" width="420" height="60" fill="${flr}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#34d399" : "#10b981", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="${s.isNight ? "#34d399" : "#059669"}" stroke-width="2.4" ${s.isNight ? 'filter="url(#hsGlowSm)"' : ""}/>
    `;
  });

  // 32. 🌀 奇点视界王庭 — Radiant White-Gold Solar Singularity Day vs Deep Obsidian Gargantua Night!
  R.registerHouseArt("singularity_court", (dp) => {
    const s = skyOf(dp);
    const id = `sg_${s.phase}`;
    const bg = s.isNight
      ? ["#05030d", "#0c071c", "#180d2e"]
      : (s.isDusk
        ? ["#2e1065", "#9a3412", "#fde68a"]
        : (s.isDawn
          ? ["#bae6fd", "#fbcfe8", "#fef3c7"]
          : ["#e0f2fe", "#fef9c3", "#fde68a"]));
    const coreFill = s.isNight ? "#020106" : (s.isDusk ? "#180a26" : "#fffbeb");
    const coreStroke = s.isNight ? "#a855f7" : (s.isDusk ? "#f97316" : "#f59e0b");
    const pilFill = s.isNight ? "url(#hsObsidian)" : (s.isDusk ? "#311a3d" : "url(#hsIvory)");
    const flrFill = s.isNight ? "url(#hsObsidian)" : (s.isDusk ? "#261530" : "url(#hsIvory)");
    const ringMain = s.isNight ? "#f59e0b" : "#d97706";
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="56%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? stars([[72,26,1.3,"#fef08a"],[142,20,1.2,"#c084fc"],[282,22,1.3,"#fff"],[348,30,1.2,"#fde047"]]) : `<polygon points="118,0 302,0 360,148 60,148" fill="url(#hsSunbeam)" opacity="0.45"/>`}
      <g transform="translate(210, 80)">
        <ellipse cx="0" cy="0" rx="164" ry="24" fill="none" stroke="${ringMain}" stroke-width="9" opacity="${s.isNight ? "0.72" : "0.52"}" filter="url(#hsGlowMd)" class="h-pulse"/>
        <ellipse cx="0" cy="0" rx="142" ry="16" fill="none" stroke="${s.isNight ? "#fef08a" : "#ffffff"}" stroke-width="3" stroke-dasharray="26 12" class="h-flow"/>
        <circle cx="0" cy="0" r="46" fill="none" stroke="url(#hsGoldH)" stroke-width="3.4" filter="url(#hsGlowSm)"/>
        <circle cx="0" cy="0" r="39" fill="${coreFill}" stroke="${coreStroke}" stroke-width="2"/>
        ${!s.isNight && !s.isDusk ? `<circle cx="0" cy="0" r="24" fill="#fef08a" opacity="0.55" filter="url(#hsGlowMd)" class="h-pulse"/>` : ""}
        <path d="M-158 0 Q0 24 158 0" fill="none" stroke="${s.isNight ? "#fde047" : "#f59e0b"}" stroke-width="3.6" opacity="0.92" filter="url(#hsGlowSm)"/>
      </g>
      <path d="M0 0 H52 L34 148 H0 Z M420 0 H368 L386 148 H420 Z" fill="${pilFill}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <rect x="0" y="148" width="420" height="60" fill="${flrFill}"/>
      ${floorPlanks(148, 0, 420, s.isNight ? "#f59e0b" : "#d4af37", 0.24)}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6" filter="url(#hsGlowSm)"/>
    `;
  });
})(typeof window !== "undefined" ? window : globalThis);
