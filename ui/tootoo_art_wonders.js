// ============================================================
// TooToo Native Seamless Full-Width Architectural Worlds (T3 -> T10)
// ZERO pasted extensions, ZERO vertical seams, ZERO reskins!
// World Scale & Varied Architectural Layouts:
//   T3: 560px  (5 bespoke 2-zone craft homes — Left/Center/Right layouts + real partitions)
//   T4: 660px  (5 bespoke 2-room nature villas — ONE unified panorama, NO duplicate windows!)
//   T5: 760px  (3 native seamless Hangzhou residences — Left & Right balcony layouts)
//   T6: 920px  (4 native seamless 3-zone luxury estates — Center-Salon & Triple-Courtyard!)
//   T7: 1080px (5 centered-hall 3-wing world wonders)
//   T8: 1240px (5 centered-hall 3-module interstellar panoramas)
//   T9: 1400px (5 COMPLETELY DISTINCT 4-zone dimensional sanctuaries)
//   T10: 1640px (Ultimate 4-zone Creator's Sovereign Celestial Palace)
// ============================================================
(function (global) {
  const R = global.TooTooRegistry;
  if (!R) return;

  function skyOf(dp) {
    const phase = (dp && dp.phase) || "day";
    const isNight = phase === "night";
    const isDusk = phase === "dusk";
    const isDawn = phase === "dawn";
    const c = isNight
      ? ["#070d20", "#162040", "#243558"]
      : (isDusk
        ? ["#4338ca", "#fb923c", "#fde68a"]
        : (isDawn
          ? ["#60a5fa", "#fbcfe8", "#fef3c7"]
          : ["#38bdf8", "#bae6fd", "#fef9c3"]));
    return { phase, isNight, isDusk, isDawn, c };
  }

  function genStars(x0, x1, count, seed = 7, yMax = 112) {
    const cols = ["#ffffff", "#fef08a", "#bae6fd", "#f5d0fe", "#fde68a"];
    let out = "";
    let v = seed * 9301 + 49297;
    for (let i = 0; i < count; i++) {
      v = (v * 9301 + 49297) % 233280;
      const rx = v / 233280;
      v = (v * 9301 + 49297) % 233280;
      const ry = v / 233280;
      const x = (x0 + rx * (x1 - x0)).toFixed(1);
      const y = (10 + ry * (yMax - 10)).toFixed(1);
      const r = (0.8 + (i % 4) * 0.32).toFixed(2);
      const cls = i % 3 === 0 ? "h-twinkle" : (i % 3 === 1 ? "h-twinkle-d1" : "h-twinkle-d2");
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i % cols.length]}" opacity="${(0.55 + (i % 5) * 0.1).toFixed(2)}" class="${cls}"/>`;
    }
    return out;
  }

  function perspFloor(y0, x0, x1, stroke, op = 0.24, step = 68) {
    const mid = (x0 + x1) / 2;
    let lines = `
      <line x1="${x0}" y1="${y0 + 14}" x2="${x1}" y2="${y0 + 14}" stroke="${stroke}" stroke-width="0.85" opacity="${op}"/>
      <line x1="${x0}" y1="${y0 + 30}" x2="${x1}" y2="${y0 + 30}" stroke="${stroke}" stroke-width="0.95" opacity="${op}"/>
      <line x1="${x0}" y1="${y0 + 48}" x2="${x1}" y2="${y0 + 48}" stroke="${stroke}" stroke-width="1.05" opacity="${op}"/>`;
    for (let x = x0 + step * 0.5; x < x1; x += step) {
      const dx = (x - mid) * 0.14;
      lines += `<line x1="${x.toFixed(0)}" y1="${y0}" x2="${(x + dx).toFixed(0)}" y2="${y0 + 60}" stroke="${stroke}" stroke-width="0.8" opacity="${(op * 0.85).toFixed(2)}"/>`;
    }
    return lines;
  }

  function moonCrescent(cx, cy, r, bgCol) {
    return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef08a" opacity="0.95"/><circle cx="${cx + r * 0.42}" cy="${cy - r * 0.25}" r="${r * 0.85}" fill="${bgCol}"/></g>`;
  }

  function winCel(s, cx, cy, r, skyCol) {
    if (s.isNight) {
      return `${moonCrescent(cx, cy, r, skyCol)}
        <circle cx="${cx - 26}" cy="${cy + 4}" r="1.1" fill="#fef08a" class="h-twinkle"/>
        <circle cx="${cx - 14}" cy="${cy - 8}" r="0.9" fill="#ffffff" class="h-twinkle-d1"/>`;
    }
    return `<circle cx="${cx}" cy="${s.isDusk || s.isDawn ? cy + 5 : cy}" r="${r + 2}" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>
      <g class="h-drift-slow" opacity="0.78"><ellipse cx="${cx - 28}" cy="${cy + 5}" rx="14" ry="4.5" fill="${s.isDusk ? "#fed7aa" : "#ffffff"}"/></g>`;
  }

  // ============================================================
  // PART 1: T3 — 5 NATIVE SEAMLESS 560px CRAFT HOMES (VARIED LAYOUTS!)
  // ============================================================

  // T3-1: 🧺 废旧竹编筐屋 (560px, mainOriginX=140: LEFT Tea Corner 0..138 + Woven Bamboo Arch x=138..154 + RIGHT Main Room 154..560)
  R.registerHouseArt("bamboo_basket", (dp) => {
    const s = skyOf(dp);
    const id = `bb5_${s.phase}`;
    const w1 = s.isNight ? "#8a6d3b" : "#dfb978";
    const w2 = s.isNight ? "#694f26" : "#b8904f";
    const trim = "#5c4018";
    const winSky = s.isNight ? "#101a34" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${w2}"/><stop offset="32%" stop-color="${w1}"/><stop offset="100%" stop-color="${w2}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 560px woven bamboo interior -->
      <rect width="560" height="208" fill="url(#${id}_w)"/>
      <g stroke="${trim}" stroke-width="1.25" opacity="0.32" fill="none">
        <path d="M0 26 H560 M0 48 H560 M0 70 H560 M0 92 H560 M0 114 H560 M0 136 H560"/>
        ${[36, 94, 152, 210, 268, 326, 384, 442, 500, 540].map(x => `<path d="M${x} 0 Q${x + (x < 280 ? -6 : 6)} 74 ${x} 148"/>`).join("")}
      </g>
      <!-- Upper woven bamboo rim across entire 560px -->
      <rect x="0" y="0" width="560" height="20" fill="${w2}" stroke="${trim}" stroke-width="1.2"/>
      <!-- LEFT WING (0..136): Cozy Bamboo Tea & Dried-Herb Craft Corner -->
      <rect x="20" y="76" width="96" height="5" rx="2" fill="#6b4a1e"/>
      <rect x="30" y="60" width="12" height="16" rx="2.5" fill="#d97706" stroke="${trim}" stroke-width="0.9"/>
      <rect x="46" y="63" width="10" height="13" rx="2" fill="#15803d" stroke="${trim}" stroke-width="0.9"/>
      <ellipse cx="96" cy="70" rx="12" ry="6" fill="#fef3c7" stroke="${trim}" stroke-width="1"/>
      <rect x="30" y="138" width="84" height="10" rx="2" fill="#7c5223" stroke="${trim}" stroke-width="1"/>
      <!-- ARCHITECTURAL PARTITION: Woven Bamboo Archway & Curved Pillar (x=134..154) -->
      <path d="M134 20 H156 V148 H148 V52 Q145 36 134 42 Z" fill="${w2}" stroke="${trim}" stroke-width="1.4"/>
      <rect x="136" y="20" width="14" height="128" fill="#855b26" stroke="${trim}" stroke-width="1.2"/>
      <line x1="143" y1="20" x2="143" y2="148" stroke="#c79b54" stroke-width="1.2" opacity="0.55"/>
      <circle cx="143" cy="54" r="3.2" fill="#dc2626" stroke="#fbbf24" stroke-width="0.8"/>
      <circle cx="143" cy="96" r="3.2" fill="#dc2626" stroke="#fbbf24" stroke-width="0.8"/>
      <!-- RIGHT MAIN CHAMBER (154..560): Woven Window (414..496) -->
      <rect x="414" y="44" width="82" height="60" rx="5" fill="${winSky}" stroke="${trim}" stroke-width="3.2"/>
      ${winCel(s, 476, 58, 7, winSky)}
      <path d="M414 96 Q455 84 496 96 L496 104 L414 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="455" y1="44" x2="455" y2="104" stroke="${trim}" stroke-width="2"/>
      <line x1="414" y1="74" x2="496" y2="74" stroke="${trim}" stroke-width="2"/>
      <rect x="408" y="103" width="94" height="5" rx="2" fill="#855828"/>
      <!-- Continuous 560px woven bamboo floor -->
      <rect x="0" y="148" width="560" height="60" fill="${s.isNight ? "#6b5026" : "#b0894a"}"/>
      ${perspFloor(148, 0, 560, "#452c10", 0.28, 56)}
      <line x1="0" y1="148" x2="560" y2="148" stroke="#4a3110" stroke-width="2.2"/>
      <!-- Floor bamboo threshold strip under archway -->
      <line x1="143" y1="148" x2="136" y2="208" stroke="#5c4018" stroke-width="2.4" opacity="0.65"/>
    `;
  });

  // T3-2: 📦 工业纸箱屋 (560px, mainOriginX=0: Main Box 0..404 + Packing-Tape Joined Cutout Arch x=402..424 + Right Comic/Cassette Box 424..560)
  R.registerHouseArt("cardboard", (dp) => {
    const s = skyOf(dp);
    const id = `cb5_${s.phase}`;
    const cTop = s.isNight ? "#96724b" : "#cba372";
    const cBot = s.isNight ? "#ad875e" : "#deb98c";
    const flap = s.isNight ? "#825d37" : "#b48653";
    const tape = s.isNight ? "#c8bc9f" : "#efe5cd";
    const winSky = s.isNight ? "#101a34" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${cTop}"/><stop offset="100%" stop-color="${cBot}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 560px corrugated twin-box interior -->
      <rect width="560" height="208" fill="url(#${id}_w)"/>
      <rect x="0" y="0" width="560" height="24" fill="${flap}"/>
      <!-- Packing tape flaps on ceiling -->
      <rect x="174" y="0" width="72" height="28" fill="${tape}" opacity="0.86"/>
      <rect x="466" y="0" width="52" height="26" fill="${tape}" opacity="0.82"/>
      <!-- Outer box fold seams -->
      <line x1="34" y1="24" x2="34" y2="148" stroke="#785028" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.72"/>
      <line x1="536" y1="24" x2="536" y2="148" stroke="#785028" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.72"/>
      <!-- Left Main Box Shipping Stamp & Window (274..362) -->
      <rect x="48" y="44" width="88" height="34" rx="3" fill="none" stroke="${s.isNight ? "#5c3b1c" : "#785028"}" stroke-width="1.4" opacity="0.68"/>
      <text x="92" y="59" font-size="9.2" font-family="monospace" font-weight="900" fill="${s.isNight ? "#5c3b1c" : "#785028"}" text-anchor="middle" opacity="0.82">TOOTOO ↑↑</text>
      <text x="92" y="71" font-size="6.6" font-family="monospace" font-weight="700" fill="${s.isNight ? "#5c3b1c" : "#785028"}" text-anchor="middle" opacity="0.7">HANDLE WITH 🥕</text>
      <rect x="274" y="42" width="88" height="64" rx="4" fill="${winSky}" stroke="#785028" stroke-width="3.2"/>
      ${winCel(s, 340, 58, 7.5, winSky)}
      <path d="M274 96 Q315 82 362 96 L362 106 L274 106 Z" fill="${s.isNight ? "#14532d" : "#86efac"}"/>
      <line x1="318" y1="42" x2="318" y2="106" stroke="#785028" stroke-width="2.2"/>
      <line x1="274" y1="74" x2="362" y2="74" stroke="#785028" stroke-width="2.2"/>
      <!-- ARCHITECTURAL PARTITION: Box-Cutter Arched Cardboard Doorway + Wide Packing Tape Join (x=402..426) -->
      <rect x="404" y="24" width="18" height="124" fill="${flap}" stroke="#785028" stroke-width="1.4"/>
      <path d="M402 24 H424 V60 Q413 42 402 60 Z" fill="${cTop}" stroke="#785028" stroke-width="1.2"/>
      <!-- Authentic cross-taped cardboard join strips -->
      <rect x="396" y="34" width="34" height="10" rx="1" fill="${tape}" opacity="0.88"/>
      <rect x="396" y="88" width="34" height="10" rx="1" fill="${tape}" opacity="0.88"/>
      <!-- RIGHT ANNEX BOX (426..560): Hand-Drawn Comic Board, Bookshelf & Cassette Desk -->
      <rect x="438" y="36" width="84" height="36" rx="2.5" fill="${s.isNight ? "#4a3b2c" : "#fffbeb"}" stroke="#785028" stroke-width="1.3"/>
      <rect x="444" y="42" width="22" height="24" rx="1.5" fill="#fed7aa" stroke="#ea580c" stroke-width="0.9"/>
      <text x="455" y="58" font-size="11" text-anchor="middle">🥕</text>
      <rect x="472" y="42" width="44" height="24" rx="1.5" fill="#e0f2fe" stroke="#64748b" stroke-width="0.9"/>
      <path d="M475 62 L485 50 L495 57 L506 47 L514 62 Z" fill="#22c55e"/>
      <rect x="436" y="88" width="88" height="5" rx="1.5" fill="#785028"/>
      <rect x="444" y="75" width="8" height="13" fill="#ef4444"/><rect x="453" y="77" width="7" height="11" fill="#38bdf8"/>
      <rect x="462" y="74" width="8" height="14" fill="#f59e0b"/><rect x="472" y="78" width="7" height="10" fill="#10b981"/>
      <rect x="446" y="132" width="76" height="16" rx="2" fill="${flap}" stroke="#5c3b1c" stroke-width="1.2"/>
      <!-- Continuous 560px corrugated floor -->
      <rect x="0" y="148" width="560" height="60" fill="${s.isNight ? "#7d5933" : "#a87c4b"}"/>
      ${perspFloor(148, 0, 560, "#5c3b1c", 0.24, 62)}
      <line x1="0" y1="148" x2="560" y2="148" stroke="#5c3b1c" stroke-width="2"/>
      <!-- Tape strip on floor across box join -->
      <polygon points="407,148 419,148 424,208 411,208" fill="${tape}" opacity="0.46"/>
    `;
  });

  // T3-3: 🪵 工地木板箱屋 (560px, mainOriginX=140: LEFT Maker Workbench Bay 0..136 + Timber Post & Steel Bracket x=134..152 + RIGHT Cargo Hall 152..560)
  R.registerHouseArt("wood_crate", (dp) => {
    const s = skyOf(dp);
    const id = `wc5_${s.phase}`;
    const p1 = s.isNight ? "#7d5932" : "#cfa26a";
    const p2 = s.isNight ? "#5c3f21" : "#a3743f";
    const winSky = s.isNight ? "#101a34" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${p2}"/><stop offset="45%" stop-color="${p1}"/><stop offset="100%" stop-color="${p2}"/>
        </linearGradient>
      </defs>
      <rect width="560" height="208" fill="url(#${id}_w)"/>
      <!-- Continuous horizontal pine crate slats across 560px -->
      <g stroke="#5c3b1c" stroke-width="1.3" opacity="0.52">
        <line x1="0" y1="30" x2="560" y2="30"/><line x1="0" y1="60" x2="560" y2="60"/>
        <line x1="0" y1="90" x2="560" y2="90"/><line x1="0" y1="120" x2="560" y2="120"/>
      </g>
      <rect x="0" y="0" width="560" height="20" fill="${p2}"/>
      <rect x="0" y="0" width="18" height="148" fill="${p2}"/><rect x="542" y="0" width="18" height="148" fill="${p2}"/>
      <!-- Outer iron corner brackets -->
      <path d="M0 0 H46 V14 H14 V46 H0 Z M560 0 H514 V14 H546 V46 H560 Z" fill="#334155"/>
      <circle cx="8" cy="8" r="2" fill="#cbd5e1"/><circle cx="552" cy="8" r="2" fill="#cbd5e1"/>
      <!-- LEFT MAKER BAY (18..134): Pegboard, Tools & Blueprint Workbench -->
      <rect x="26" y="34" width="96" height="58" rx="3" fill="${s.isNight ? "#334155" : "#475569"}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Hanging wrench, hammer & blueprint sheet -->
      <path d="M42 46 V74 M38 46 H46" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="56" y="44" width="14" height="6" rx="1.5" fill="#94a3b8"/><line x1="63" y1="50" x2="63" y2="74" stroke="#d97706" stroke-width="2.6"/>
      <rect x="80" y="42" width="34" height="40" rx="1.5" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1"/>
      <path d="M86 52 H108 M86 60 H102 M86 68 L98 62 L108 72" stroke="#bae6fd" stroke-width="1" fill="none"/>
      <!-- Workbench desk -->
      <rect x="22" y="120" width="104" height="7" rx="1.5" fill="#78350f"/>
      <rect x="28" y="127" width="6" height="21" fill="#451a03"/><rect x="114" y="127" width="6" height="21" fill="#451a03"/>
      <!-- ARCHITECTURAL PARTITION: Heavy Pine Structural Column & Iron Gusset Bracket (x=134..154) -->
      <rect x="134" y="20" width="16" height="128" fill="${p2}" stroke="#451a03" stroke-width="1.4"/>
      <polygon points="134,20 174,20 150,48 150,20" fill="#334155"/>
      <circle cx="142" cy="28" r="2" fill="#cbd5e1"/><circle cx="142" cy="84" r="2" fill="#cbd5e1"/><circle cx="142" cy="136" r="2" fill="#cbd5e1"/>
      <!-- RIGHT CARGO HALL (154..542): Stencil Stamp + Industrial Steel Window (414..500) -->
      <rect x="184" y="42" width="96" height="36" rx="3" fill="rgba(69,26,3,0.06)" stroke="#451a03" stroke-width="1.4" opacity="0.72"/>
      <text x="232" y="57" font-size="8.8" font-family="monospace" font-weight="900" fill="#451a03" text-anchor="middle" opacity="0.82">FRAGILE · 🥕</text>
      <text x="232" y="70" font-size="6.5" font-family="monospace" font-weight="700" fill="#451a03" text-anchor="middle" opacity="0.72">HZ-TECH CARGO</text>
      <rect x="414" y="42" width="86" height="62" rx="3" fill="${winSky}" stroke="#334155" stroke-width="3.2"/>
      ${winCel(s, 478, 56, 7.5, winSky)}
      <path d="M414 96 Q455 84 500 96 L500 104 L414 104 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <line x1="457" y1="42" x2="457" y2="104" stroke="#334155" stroke-width="2"/>
      <line x1="414" y1="73" x2="500" y2="73" stroke="#334155" stroke-width="2"/>
      <!-- Continuous 560px timber floor -->
      <rect x="0" y="148" width="560" height="60" fill="${s.isNight ? "#634322" : "#9c6d3c"}"/>
      ${perspFloor(148, 0, 560, "#3b220c", 0.3, 56)}
      <line x1="0" y1="148" x2="560" y2="148" stroke="#3b220c" stroke-width="2.2"/>
    `;
  });

  // T3-4: ⛺ 露营帆布帐篷 (560px, mainOriginX=70: SYMMETRIC Wide Glamping Ridge Tent — Left Lantern Wing 0..132 | Center Tent 132..428 | Right Guitar Wing 428..560)
  R.registerHouseArt("canvas_tent", (dp) => {
    const s = skyOf(dp);
    const id = `ct5_${s.phase}`;
    const c1 = s.isNight ? "#aba08e" : "#faf4e8";
    const c2 = s.isNight ? "#877c6c" : "#e2d5be";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${c2}"/><stop offset="28%" stop-color="${c1}"/><stop offset="72%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 560px canvas glamping dome -->
      <rect width="560" height="208" fill="url(#${id}_w)"/>
      <!-- Symmetric sloped tent end walls -->
      <polygon points="0,0 118,0 0,148" fill="${c2}" opacity="0.72"/>
      <polygon points="560,0 442,0 560,148" fill="${c2}" opacity="0.72"/>
      <!-- Twin wooden glamping ridge poles + tied-back vestibule drapes at x=132 & x=428 -->
      <rect x="128" y="0" width="8" height="148" fill="#8c5a2b" opacity="0.82"/>
      <rect x="424" y="0" width="8" height="148" fill="#8c5a2b" opacity="0.82"/>
      <path d="M128 0 H156 Q138 66 146 148 H128 Z" fill="${c2}" stroke="#a89476" stroke-width="1" opacity="0.82"/>
      <path d="M432 0 H404 Q422 66 414 148 H432 Z" fill="${c2}" stroke="#a89476" stroke-width="1" opacity="0.82"/>
      <rect x="126" y="88" width="16" height="4" rx="2" fill="#d97706"/>
      <rect x="418" y="88" width="16" height="4" rx="2" fill="#d97706"/>
      <!-- Continuous warm glamping fairy string lights draped across full 560px! -->
      <path d="M16 26 Q74 48 132 18 Q280 50 428 18 Q486 48 544 26" fill="none" stroke="#78350f" stroke-width="1.3"/>
      ${[[54,35],[96,33],[184,32],[232,37],[280,39],[328,37],[376,32],[464,33],[506,35]].map(([x, y], i) => `
        <circle cx="${x}" cy="${y}" r="7.5" fill="#fde68a" opacity="0.26"/>
        <circle cx="${x}" cy="${y}" r="3" fill="#fef08a" class="${i % 2 ? "h-twinkle" : "h-twinkle-d1"}"/>
      `).join("")}
      <!-- Rolled canvas arched pine-forest window in Center Tent (320..402) -->
      <path d="M320 108 L320 68 A41 34 0 0 1 402 68 L402 108 Z" fill="${winSky}" stroke="#8c5a2b" stroke-width="2.8"/>
      ${winCel(s, 380, 58, 7, winSky)}
      <path d="M320 104 Q352 86 402 100 L402 108 L320 108 Z" fill="${s.isNight ? "#166534" : "#86efac"}"/>
      <polygon points="328,108 342,82 356,108" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <polygon points="364,108 380,76 396,108" fill="${s.isNight ? "#0f3d21" : "#166534"}"/>
      <!-- Left Vestibule: Rolled sleeping gear & wooden camp stool -->
      <ellipse cx="68" cy="140" rx="26" ry="9" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
      <rect x="48" y="132" width="40" height="8" rx="4" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
      <!-- Right Vestibule: Camp crate & hiking backpack -->
      <rect x="462" y="122" width="32" height="26" rx="5" fill="#0d9488" stroke="#115e59" stroke-width="1.2"/>
      <rect x="468" y="128" width="20" height="10" rx="2" fill="#f59e0b"/>
      <!-- Continuous 560px woven sage-green groundsheet -->
      <rect x="0" y="148" width="560" height="60" fill="${s.isNight ? "#3f4e3c" : "#6b8266"}"/>
      ${perspFloor(148, 0, 560, "#2d3b2b", 0.22, 64)}
      <line x1="0" y1="148" x2="560" y2="148" stroke="#2d3b2b" stroke-width="2"/>
    `;
  });

  // T3-5: 🚐 复古露营面包车 (560px, mainOriginX=0: Rear Living Cabin 0..402 + Mint Bulkhead Curtain Walkthrough x=402..422 + Front Retro Cockpit 422..560!)
  R.registerHouseArt("vintage_van", (dp) => {
    const s = skyOf(dp);
    const id = `vv5_${s.phase}`;
    const mint1 = s.isNight ? "#3a6e63" : "#7ee8c0";
    const mint2 = s.isNight ? "#244a42" : "#34d399";
    const winSky = s.isNight ? "#0f172a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    const cream = s.isNight ? "#cbd5c8" : "#fefce8";
    return `
      <defs>
        <linearGradient id="${id}_m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${mint1}"/><stop offset="100%" stop-color="${mint2}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 560px Mint Camper Interior -->
      <rect width="560" height="208" fill="url(#${id}_m)"/>
      <!-- Continuous wood-slat van ceiling -->
      <rect x="0" y="0" width="560" height="24" fill="${s.isNight ? "#6e4c2a" : "#c99b63"}"/>
      <line x1="0" y1="8" x2="560" y2="8" stroke="#78350f" stroke-width="1" opacity="0.4"/>
      <line x1="0" y1="16" x2="560" y2="16" stroke="#78350f" stroke-width="1" opacity="0.4"/>
      <rect x="28" y="24" width="136" height="22" rx="3" fill="${s.isNight ? "#5c3e20" : "#b8864b"}" stroke="#78350f" stroke-width="1.2"/>
      <circle cx="72" cy="35" r="2" fill="#fde68a"/><circle cx="122" cy="35" r="2" fill="#fde68a"/>
      <!-- Continuous cream lower cabin panel -->
      <rect x="0" y="108" width="560" height="40" fill="${cream}"/>
      <line x1="0" y1="108" x2="560" y2="108" stroke="#0f766e" stroke-width="2.4" opacity="0.55"/>
      <!-- Rear porthole window & panoramic riverfront camper window (244..374) -->
      <circle cx="78" cy="76" r="22" fill="${winSky}" stroke="#f8fafc" stroke-width="3"/>
      <path d="M58 84 Q78 76 98 84 A22 22 0 0 1 58 84 Z" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.75"/>
      <rect x="244" y="40" width="130" height="64" rx="12" fill="${winSky}" stroke="#f8fafc" stroke-width="3.2"/>
      ${winCel(s, 344, 56, 7.5, winSky)}
      <path d="M244 82 Q290 70 330 82 Q355 76 374 84 L374 92 L244 92 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}" opacity="0.8"/>
      <rect x="244" y="88" width="130" height="16" rx="4" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.76"/>
      <line x1="264" y1="96" x2="314" y2="96" stroke="#fff" stroke-width="1" opacity="0.55" class="h-drift"/>
      <line x1="309" y1="40" x2="309" y2="104" stroke="#f8fafc" stroke-width="2.4"/>
      <!-- ARCHITECTURAL PARTITION: Cabin-to-Cockpit Bulkhead Pillar + Tied-Back Gingham Curtain (x=398..424) -->
      <rect x="402" y="24" width="12" height="124" fill="#0f766e" opacity="0.78"/>
      <path d="M398 24 H422 Q410 74 418 134 L402 134 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1" opacity="0.9"/>
      <rect x="402" y="84" width="14" height="4" rx="2" fill="#ea580c"/>
      <!-- FRONT DRIVER COCKPIT (424..560): Curved Panoramic Windshield + Retro Dashboard + Steering Wheel! -->
      <path d="M430 34 H536 Q550 34 552 54 L554 96 H430 Z" fill="${winSky}" stroke="#f8fafc" stroke-width="3"/>
      <path d="M430 78 Q490 66 554 78 L554 96 H430 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}" opacity="0.8"/>
      <rect x="430" y="84" width="124" height="12" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.76"/>
      <!-- Hanging fuzzy carrot dice from rearview mirror -->
      <line x1="486" y1="34" x2="486" y2="48" stroke="#334155" stroke-width="1.2"/>
      <rect x="480" y="48" width="12" height="11" rx="2" fill="#f97316" stroke="#fff" stroke-width="0.9"/>
      <circle cx="484" cy="52" r="1.1" fill="#fff"/><circle cx="488" cy="55" r="1.1" fill="#fff"/>
      <!-- Retro rounded dashboard, gauges & driver seat -->
      <path d="M428 98 H554 V126 H436 Q428 126 428 118 Z" fill="#0f766e" stroke="#f8fafc" stroke-width="1.4"/>
      <circle cx="464" cy="112" r="7" fill="#fefce8" stroke="#334155" stroke-width="1.2"/>
      <line x1="464" y1="112" x2="468" y2="108" stroke="#ef4444" stroke-width="1.4"/>
      <rect x="444" y="124" width="28" height="24" rx="4" fill="#c25934" stroke="#7c2d12" stroke-width="1.2"/>
      <!-- Continuous 560px oak van floor -->
      <rect x="0" y="148" width="560" height="60" fill="${s.isNight ? "#5c4024" : "#a87946"}"/>
      ${perspFloor(148, 0, 560, "#3b220c", 0.28, 58)}
      <line x1="0" y1="148" x2="560" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ============================================================
  // PART 2: T4 — 5 NATIVE SEAMLESS 660px NATURE VILLAS
  //   ZERO duplicate small-vs-large windows! ONE unified panoramic vista + real architectural room divider!
  // ============================================================

  // T4-1: 🎋 溪畔竹林小筑 (660px, mainOriginX=0: Left Zen Tea Hall 0..388 + Carved Moon-Arch Wall x=384..414 + Right Panoramic Bamboo & Brook Sunroom 414..660)
  R.registerHouseArt("bamboo_pavilion", (dp) => {
    const s = skyOf(dp);
    const id = `bp6_${s.phase}`;
    const w1 = s.isNight ? "#cfc9b8" : "#faf6ec";
    const w2 = s.isNight ? "#b8b09c" : "#ede5d2";
    const bam = s.isNight ? "#26422c" : "#3f6b46";
    const winSky = s.isNight ? "#0c192a" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fce7f3" : "#d1fae5"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${w1}"/><stop offset="100%" stop-color="${w2}"/></linearGradient>
      </defs>
      <rect width="660" height="208" fill="url(#${id}_w)"/>
      <!-- Continuous bamboo crown molding & wainscot dado across 660px -->
      <rect x="0" y="0" width="660" height="20" fill="${bam}"/>
      <rect x="0" y="124" width="660" height="24" fill="${s.isNight ? "#a39983" : "#e3d8c1"}" opacity="0.72"/>
      <line x1="0" y1="124" x2="660" y2="124" stroke="${bam}" stroke-width="1.6"/>
      <rect x="14" y="0" width="12" height="148" fill="${bam}"/>
      <rect x="646" y="0" width="14" height="148" fill="${bam}"/>
      <!-- LEFT ZEN TEA HALL (26..384): Landscape Scroll + Antique Bamboo Tea Cabinet (NO competing small window!) -->
      <rect x="54" y="34" width="48" height="76" rx="2" fill="#fffdf7" stroke="#5c4018" stroke-width="1.5"/>
      <line x1="49" y1="34" x2="107" y2="34" stroke="#5c4018" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="49" y1="110" x2="107" y2="110" stroke="#5c4018" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M57 98 Q70 78 82 88 Q92 72 100 98 Z" fill="#94a3b8" opacity="0.55"/>
      <path d="M77 98 Q79 74 75 52 M76 68 L88 62 M77 76 L66 70" stroke="#1e293b" stroke-width="1.3" fill="none"/>
      <circle cx="91" cy="54" r="3" fill="#dc2626" opacity="0.82"/>
      <!-- Carved circular wall niche with celadon tea vessels -->
      <circle cx="290" cy="76" r="38" fill="${s.isNight ? "#8f8672" : "#e7dec8"}" stroke="${bam}" stroke-width="2.2"/>
      <line x1="254" y1="68" x2="326" y2="68" stroke="${bam}" stroke-width="1.8"/>
      <line x1="258" y1="90" x2="322" y2="90" stroke="${bam}" stroke-width="1.8"/>
      <ellipse cx="278" cy="62" rx="6" ry="5" fill="#10b981" stroke="#065f46" stroke-width="0.9"/>
      <rect x="296" y="54" width="8" height="14" rx="3" fill="#fffdf8" stroke="#1d4ed8" stroke-width="0.9"/>
      <ellipse cx="290" cy="84" rx="9" ry="5.5" fill="#78350f"/>
      <!-- ARCHITECTURAL PARTITION: Carved Bamboo Moon-Arch Divider Wall (x=384..416) -->
      <rect x="384" y="20" width="32" height="128" fill="${bam}"/>
      <path d="M388 26 H412 V148 H406 V48 Q400 32 394 48 V148 H388 Z" fill="${s.isNight ? "#1c3221" : "#2f5336"}"/>
      <rect x="392" y="34" width="16" height="16" rx="2" fill="none" stroke="#d4af37" stroke-width="1"/>
      <line x1="400" y1="50" x2="400" y2="64" stroke="#dc2626" stroke-width="1.6"/>
      <circle cx="400" cy="66" r="2.6" fill="#dc2626"/>
      <!-- RIGHT SUNROOM (416..646): ONE GRAND 204px PANORAMIC BAMBOO & BROOK WINDOW (436..640)! -->
      <rect x="436" y="24" width="204" height="100" rx="5" fill="${winSky}" stroke="${bam}" stroke-width="3.2"/>
      ${winCel(s, 600, 46, 10, winSky)}
      <path d="M436 106 Q504 72 572 96 Q610 80 640 94 L640 124 L436 124 Z" fill="${s.isNight ? "#14532d" : "#86efac"}"/>
      <rect x="436" y="106" width="204" height="18" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.65"/>
      <line x1="464" y1="115" x2="546" y2="115" stroke="#ffffff" stroke-width="1.2" opacity="0.6" class="h-drift"/>
      <g stroke="${s.isNight ? "#15803d" : "#16a34a"}" stroke-width="3.6" class="h-drift-slow">
        <line x1="458" y1="26" x2="454" y2="124"/><line x1="484" y1="26" x2="488" y2="124"/>
        <line x1="578" y1="26" x2="574" y2="124"/><line x1="612" y1="26" x2="616" y2="124"/>
      </g>
      <g fill="${s.isNight ? "#166534" : "#22c55e"}" opacity="0.86">
        <ellipse cx="470" cy="48" rx="11" ry="3.4" transform="rotate(-18 470 48)"/>
        <ellipse cx="498" cy="62" rx="11" ry="3.4" transform="rotate(16 498 62)"/>
        <ellipse cx="592" cy="52" rx="12" ry="3.5" transform="rotate(-16 592 52)"/>
      </g>
      <line x1="538" y1="24" x2="538" y2="124" stroke="${bam}" stroke-width="2.2"/>
      ${!s.isNight ? `<polygon points="460,26 550,26 492,148 424,148" fill="url(#hsSunbeam)" opacity="0.32"/>` : ""}
      <!-- Continuous 660px bamboo-plank floor -->
      <rect x="0" y="148" width="660" height="60" fill="${s.isNight ? "#6e5534" : "#bf9d65"}"/>
      ${perspFloor(148, 0, 660, "#452c10", 0.25, 64)}
      <line x1="0" y1="148" x2="660" y2="148" stroke="#452c10" stroke-width="2"/>
    `;
  });

  // T4-2: 🌳 阳光树洞屋 (660px, mainOriginX=240: LEFT Sunlit Forest Observatory 0..232 + Hollow Oak Trunk Arch x=226..260 + RIGHT Cozy Hollow Hall 260..660!)
  R.registerHouseArt("treehole", (dp) => {
    const s = skyOf(dp);
    const id = `th6_${s.phase}`;
    const wTop = s.isNight ? "#634022" : "#8b5d33";
    const wBot = s.isNight ? "#8f6940" : "#c69663";
    const bark = s.isNight ? "#422712" : "#5c381a";
    const winSky = s.isNight ? "#0d1832" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wTop}"/><stop offset="100%" stop-color="${wBot}"/></linearGradient>
      </defs>
      <!-- Continuous 660px warm carved oak-heart interior -->
      <rect width="660" height="208" fill="url(#${id}_w)"/>
      <g stroke="#4a2e16" stroke-width="1.2" opacity="0.3" fill="none">
        ${[68, 178, 314, 424, 520, 608].map(x => `<path d="M${x} 16 Q${x + 6} 82 ${x - 4} 148"/>`).join("")}
      </g>
      <!-- Curved organic oak-bark ceiling & end walls -->
      <path d="M0 0 H660 V208 H644 V148 Q646 72 630 18 Q450 4 256 18 Q130 4 20 20 Q12 84 18 148 H0 Z" fill="${bark}"/>
      <!-- LEFT OBSERVATORY CHAMBER (18..226): ONE GRAND 190px ARCHED FOREST CANOPY WINDOW (24..214)! -->
      <path d="M24 124 V60 A95 36 0 0 1 214 60 V124 Z" fill="${winSky}" stroke="#4a2a12" stroke-width="3.6"/>
      ${winCel(s, 176, 48, 10, winSky)}
      <path d="M24 110 Q76 74 134 98 Q176 72 214 96 V124 H24 Z" fill="${s.isNight ? "#166534" : "#4ade80"}"/>
      <path d="M24 118 Q94 94 214 112 V124 H24 Z" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <line x1="119" y1="24" x2="119" y2="124" stroke="#4a2a12" stroke-width="2.2"/>
      ${!s.isNight ? `<polygon points="44,124 194,124 148,184 12,184" fill="url(#hsSunbeam)" opacity="0.42"/>` : `<polygon points="44,124 194,124 148,184 12,184" fill="#93c5fd" opacity="0.14"/>`}
      <!-- ARCHITECTURAL PARTITION: Carved Living Oak-Trunk Archway Pillar (x=226..260) -->
      <path d="M226 14 H260 V148 H250 Q244 82 248 24 Q242 20 236 24 Q240 82 234 148 H226 Z" fill="${bark}"/>
      <rect x="234" y="20" width="18" height="128" fill="${bark}" stroke="#3b1f0d" stroke-width="1.2"/>
      <ellipse cx="243" cy="64" rx="5.5" ry="7" fill="${wTop}" stroke="#3b1f0d" stroke-width="1"/>
      <circle cx="243" cy="65" r="2.6" fill="#fef08a" opacity="0.88"/>
      <!-- Hanging moss vine draping from oak archway -->
      <path d="M254 18 Q266 44 258 68" stroke="${s.isNight ? "#14532d" : "#22c55e"}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <!-- RIGHT MAIN HOLLOW HALL (260..644): Carrot-Jar Bookshelf + Carved Heartwood Art (NO second window!) -->
      <rect x="292" y="64" width="84" height="6" rx="2" fill="#4a2a12"/>
      <rect x="304" y="46" width="14" height="18" rx="4" fill="#fef3c7" stroke="#92400e" stroke-width="1"/>
      <path d="M311 51 L314 61 L308 61 Z" fill="#f97316"/>
      <rect x="328" y="48" width="8" height="16" rx="1" fill="#dc2626"/>
      <rect x="337" y="51" width="7" height="13" rx="1" fill="#0d9488"/>
      <rect x="345" y="47" width="8" height="17" rx="1" fill="#d97706"/>
      <!-- Warm carved round oak-ring wall relief on far right -->
      <circle cx="516" cy="70" r="28" fill="${wTop}" stroke="#4a2a12" stroke-width="2"/>
      <circle cx="516" cy="70" r="19" fill="none" stroke="#c69663" stroke-width="1.1" opacity="0.48"/>
      <circle cx="516" cy="70" r="10" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.38"/>
      <!-- Continuous 660px oak plank floor -->
      <rect x="0" y="148" width="660" height="60" fill="${s.isNight ? "#633c1e" : "#85542d"}"/>
      ${perspFloor(148, 0, 660, "#3b1f0d", 0.28, 64)}
      <line x1="0" y1="148" x2="660" y2="148" stroke="#3b1f0d" stroke-width="2"/>
    `;
  });

  // T4-3: 🛖 莫干山原木屋 (660px, mainOriginX=0: Left Hearth Living Room 0..388 + Cedar Post-and-Beam Arch x=384..414 + Right Panoramic Mountain Sunroom 414..660!)
  R.registerHouseArt("moganshan_cabin", (dp) => {
    const s = skyOf(dp);
    const id = `mg6_${s.phase}`;
    const log1 = s.isNight ? "#693b1d" : "#ad6232";
    const log2 = s.isNight ? "#4a2711" : "#80431d";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));
    return `
      <defs>
        <linearGradient id="${id}_l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${log2}"/><stop offset="48%" stop-color="${log1}"/><stop offset="100%" stop-color="${log2}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 660px red-cedar cabin log wall! -->
      <rect width="660" height="208" fill="url(#${id}_l)"/>
      ${[22, 44, 66, 88, 110, 132].map(y => `
        <line x1="0" y1="${y}" x2="660" y2="${y}" stroke="${log2}" stroke-width="2.4"/>
        <line x1="0" y1="${y + 2}" x2="660" y2="${y + 2}" stroke="#fde68a" stroke-width="0.65" opacity="0.22"/>
      `).join("")}
      <!-- LEFT HEARTH LIVING ROOM (0..384): Grand River-Stone Fireplace + Topographic Mountain Map (NO duplicate small window!) -->
      <rect x="148" y="0" width="44" height="74" fill="${s.isNight ? "#475569" : "#788596"}" stroke="#334155" stroke-width="1.3"/>
      <rect x="134" y="72" width="72" height="76" rx="2" fill="${s.isNight ? "#475569" : "#64748b"}" stroke="#334155" stroke-width="1.5"/>
      <rect x="128" y="68" width="84" height="8" rx="2" fill="#451a03"/>
      <path d="M150 148 V112 A20 18 0 0 1 190 112 V148 Z" fill="#18181b"/>
      <circle cx="170" cy="136" r="24" fill="#f97316" opacity="0.22"/>
      <path d="M159 146 Q162 126 169 119 Q175 131 179 123 Q184 138 178 146 Z" fill="#f97316" class="h-pulse"/>
      <path d="M164 146 Q168 132 172 130 Q176 140 174 146 Z" fill="#fde047"/>
      <!-- Framed Moganshan Mountain Trail Map & Pine Shelf (x=254..356) -->
      <rect x="256" y="34" width="96" height="58" rx="3" fill="${s.isNight ? "#d6cbb8" : "#fef7e6"}" stroke="#451a03" stroke-width="2.6"/>
      <path d="M262 82 L284 54 L306 74 L326 48 L346 82 Z" fill="${s.isNight ? "#166534" : "#4ade80"}" opacity="0.72"/>
      <path d="M264 78 Q296 64 344 74" fill="none" stroke="#ea580c" stroke-width="1.4" stroke-dasharray="4 3"/>
      <circle cx="326" cy="52" r="3" fill="#dc2626"/>
      <rect x="262" y="108" width="84" height="5.5" rx="2" fill="#451a03"/>
      <rect x="274" y="96" width="9" height="12" rx="1.5" fill="#d97706"/><circle cx="308" cy="102" r="5.5" fill="#15803d"/>
      <!-- ARCHITECTURAL PARTITION: Heavy Cedar Post-and-Beam Archway (x=384..414) -->
      <rect x="384" y="0" width="28" height="148" fill="${log2}" stroke="#361c0b" stroke-width="1.6"/>
      <rect x="389" y="0" width="18" height="148" fill="#5c3318"/>
      <rect x="378" y="0" width="40" height="18" fill="#361c0b"/>
      <circle cx="398" cy="56" r="5" fill="#fde047" opacity="0.88"/>
      <circle cx="398" cy="56" r="14" fill="#fde047" opacity="0.18"/>
      <!-- RIGHT PANORAMIC SUNROOM (414..660): ONE MASSIVE 208px MOUNTAIN PICTURE WINDOW (432..640)! -->
      <rect x="432" y="22" width="208" height="104" rx="5" fill="${winSky}" stroke="#361c0b" stroke-width="3.6"/>
      ${winCel(s, 602, 44, 10, winSky)}
      <path d="M432 104 Q482 64 534 92 Q584 58 640 88 V126 H432 Z" fill="${s.isNight ? "#166534" : "#4ade80"}" opacity="0.76"/>
      <path d="M432 112 L472 78 L516 108 L564 70 L614 106 L640 86 V126 H432 Z" fill="${s.isNight ? "#14532d" : "#15803d"}"/>
      <rect x="432" y="114" width="208" height="12" fill="${s.isNight ? "#1e3a5f" : "#60a5fa"}" opacity="0.58"/>
      <line x1="536" y1="22" x2="536" y2="126" stroke="#361c0b" stroke-width="2.4"/>
      ${!s.isNight ? `<polygon points="452,24 548,24 494,148 416,148" fill="url(#hsSunbeam)" opacity="0.34"/>` : ""}
      <!-- Continuous 660px red-cedar floor -->
      <rect x="0" y="148" width="660" height="60" fill="${s.isNight ? "#543018" : "#8c5228"}"/>
      ${perspFloor(148, 0, 660, "#361c0b", 0.3, 64)}
      <line x1="0" y1="148" x2="660" y2="148" stroke="#361c0b" stroke-width="2.2"/>
    `;
  });

  // T4-4: 🌻 向日葵玻璃花房 (660px, mainOriginX=120: SYMMETRIC 3-Bay 360° Victorian Conservatory across entire 660px!)
  R.registerHouseArt("sunflower_glasshouse", (dp) => {
    const s = skyOf(dp);
    const id = `sg6_${s.phase}`;
    const frame = s.isNight ? "#cbd5e1" : "#ffffff";
    const knee = s.isNight ? "#b8b2a6" : "#faf5eb";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="60%" stop-color="${s.c[1]}"/><stop offset="100%" stop-color="${s.c[2]}"/>
        </linearGradient>
      </defs>
      <!-- Continuous 660px open sunlit sky & rolling sunflower meadow -->
      <rect width="660" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(18, 642, 26, 44, 78)}${moonCrescent(564, 34, 14, s.c[0])}` : `<circle cx="564" cy="${s.isDusk ? 44 : 34}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <path d="M0 114 Q165 92 330 112 Q495 94 660 108 V148 H0 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      ${[[44,86,10.5],[92,92,9.5],[176,84,11],[246,90,10],[328,82,12],[408,90,10.5],[482,84,11],[568,88,10.5],[622,82,11]].map(([fx, fy, fr]) => `
        <g transform="translate(${fx}, ${fy})">
          <line x1="0" y1="0" x2="0" y2="${132 - fy}" stroke="#15803d" stroke-width="2.8"/>
          <ellipse cx="-7" cy="18" rx="6.5" ry="3.2" fill="#22c55e" transform="rotate(-24 -7 18)"/>
          <ellipse cx="7" cy="24" rx="6.5" ry="3.2" fill="#16a34a" transform="rotate(24 7 24)"/>
          <circle cx="0" cy="0" r="${fr}" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
          <circle cx="0" cy="0" r="${(fr * 0.46).toFixed(1)}" fill="#78350f"/>
        </g>
      `).join("")}
      ${!s.isNight ? `<polygon points="260,0 364,0 288,148 184,148" fill="url(#hsSunbeam)" opacity="0.44"/><polygon points="510,0 594,0 536,148 456,148" fill="url(#hsSunbeam)" opacity="0.34"/>` : ""}
      <!-- Full 660px Victorian Wrought-Iron Glass Bays + Ornate Wing Pillars at x=120 & x=540 -->
      <rect x="0" y="0" width="660" height="126" fill="url(#hsGlassSheen)" opacity="0.4"/>
      <g stroke="${frame}" stroke-width="2.6" fill="none">
        <line x1="0" y1="24" x2="660" y2="24"/>
        ${[110, 220, 330, 440, 550].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="126"/>`).join("")}
        <path d="M0 24 Q55 6 110 24 Q165 6 220 24 Q275 6 330 24 Q385 6 440 24 Q495 6 550 24 Q605 6 660 24"/>
      </g>
      <!-- Sculpted White Victorian Archway Columns dividing 3 Bays (x=114..126 & x=534..546) -->
      ${[114, 534].map(cx => `
        <rect x="${cx}" y="0" width="12" height="148" fill="${frame}" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="${cx - 3}" y="20" width="18" height="6" rx="2" fill="${frame}" stroke="#94a3b8" stroke-width="0.9"/>
      `).join("")}
      <rect x="0" y="126" width="660" height="22" fill="${knee}" stroke="#d6cfc2" stroke-width="1.2"/>
      <!-- Continuous 660px warm terracotta tile conservatory floor -->
      <rect x="0" y="148" width="660" height="60" fill="${s.isNight ? "#875742" : "#d99d80"}"/>
      ${perspFloor(148, 0, 660, "#7c3d22", 0.25, 62)}
      <line x1="0" y1="148" x2="660" y2="148" stroke="#7c3d22" stroke-width="2"/>
    `;
  });

  // T4-5: 🏡 湖畔风车磨坊屋 (660px, mainOriginX=240: LEFT Lakeside Windmill Bay 0..232 + European Half-Timber Arch x=226..256 + RIGHT Warm Bakery Hall 256..660!)
  R.registerHouseArt("windmill_mill", (dp) => {
    const s = skyOf(dp);
    const id = `wm6_${s.phase}`;
    const wall = s.isNight ? "#c8bfb0" : "#faf4e8";
    const wallB = s.isNight ? "#b0a696" : "#ebe2d0";
    const beam = s.isNight ? "#422712" : "#783f1c";
    const winSky = s.isNight ? "#0b132b" : (s.isDusk ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#93c5fd"));
    return `
      <defs>
        <linearGradient id="${id}_w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wall}"/><stop offset="100%" stop-color="${wallB}"/></linearGradient>
      </defs>
      <rect width="660" height="208" fill="url(#${id}_w)"/>
      <!-- Continuous European timber ceiling beam & blue-white Delft tiled dado across 660px -->
      <rect x="0" y="0" width="660" height="20" fill="${beam}"/>
      <rect x="0" y="122" width="660" height="26" fill="${s.isNight ? "#475569" : "#dbeafe"}" opacity="0.72"/>
      <g stroke="${s.isNight ? "#334155" : "#60a5fa"}" stroke-width="0.8" opacity="0.55">
        ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 28}" y1="122" x2="${i * 28}" y2="148"/>`).join("")}
        <line x1="0" y1="135" x2="660" y2="135"/>
      </g>
      <line x1="0" y1="122" x2="660" y2="122" stroke="${beam}" stroke-width="2.2"/>
      <rect x="0" y="20" width="14" height="128" fill="${beam}"/><rect x="646" y="20" width="14" height="128" fill="${beam}"/>
      <!-- Exposed Dutch/Tudor Half-Timber Wall Framing across Bakery Hall (256..646) -->
      <g stroke="${beam}" stroke-width="4" opacity="0.82">
        <line x1="398" y1="20" x2="398" y2="122"/><line x1="538" y1="20" x2="538" y2="122"/>
        <line x1="250" y1="64" x2="398" y2="20" stroke-width="3" opacity="0.5"/><line x1="538" y1="20" x2="646" y2="64" stroke-width="3" opacity="0.5"/>
      </g>
      <!-- LEFT LAKESIDE VIEWING BAY (14..226): ONE GRAND 196px ARCHED LAKESIDE & WINDMILL WINDOW (20..216)! -->
      <path d="M20 122 V56 A98 32 0 0 1 216 56 V122 Z" fill="${winSky}" stroke="${beam}" stroke-width="3.6"/>
      ${winCel(s, 58, 50, 8.5, winSky)}
      <path d="M20 100 Q118 84 216 98 V122 H20 Z" fill="${s.isNight ? "#14532d" : "#4ade80"}"/>
      <rect x="20" y="102" width="196" height="20" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.82"/>
      <line x1="40" y1="112" x2="108" y2="112" stroke="#ffffff" stroke-width="1.1" opacity="0.58" class="h-drift"/>
      <!-- Iconic Stone Windmill Tower outside Left Panoramic Window (sails controlled by interactive hotspot!) -->
      <g transform="translate(142, 72)">
        <polygon points="-11,34 -6,0 6,0 11,34" fill="${s.isNight ? "#475569" : "#b45309"}" stroke="#451a03" stroke-width="1"/>
        <path d="M-7 0 Q0 -8 7 0 Z" fill="#451a03"/>
        <rect x="-2.5" y="14" width="5" height="8" rx="2.5" fill="#fef08a" opacity="0.88"/>
      </g>
      <!-- ARCHITECTURAL PARTITION: Half-Timbered Oak Post & Diagonal Brace Archway (x=226..256) -->
      <rect x="228" y="20" width="22" height="128" fill="${beam}"/>
      <path d="M250 20 L282 54 M228 20 L196 54" stroke="${beam}" stroke-width="6" stroke-linecap="round"/>
      <!-- RIGHT WARM MILL BAKERY HALL (256..646): Spice Shelf, Brick Bread Oven, Wheat Sheaves & Carved Mill Wheel! -->
      <rect x="284" y="68" width="92" height="5.5" rx="2" fill="${beam}"/>
      <rect x="296" y="48" width="16" height="20" rx="3" fill="#fef3c7" stroke="#92400e" stroke-width="1"/>
      <rect x="318" y="52" width="14" height="16" rx="2.5" fill="#fed7aa" stroke="#92400e" stroke-width="1"/>
      <path d="M352 68 Q348 50 342 44 M354 68 Q356 48 360 42 M356 68 Q362 52 368 46" stroke="#eab308" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Warm European Brick Baking Hearth (420..514) -->
      <path d="M426 148 V86 A42 26 0 0 1 510 86 V148 Z" fill="${s.isNight ? "#7c2d12" : "#b45309"}" stroke="#451a03" stroke-width="1.6"/>
      <path d="M442 148 V116 A26 20 0 0 1 494 116 V148 Z" fill="#18181b"/>
      <path d="M454 146 Q462 128 468 124 Q474 134 480 128 Q484 140 478 146 Z" fill="#f97316" class="h-pulse"/>
      <path d="M460 146 Q467 134 474 146 Z" fill="#fde047"/>
      <!-- Carved Wooden Mill-Gear Relief above Hearth & Tied Golden Wheat Sheaf -->
      <circle cx="468" cy="48" r="18" fill="${s.isNight ? "#5c3416" : "#a1622e"}" stroke="#451a03" stroke-width="2"/>
      <circle cx="468" cy="48" r="12" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="4 3"/>
      <circle cx="468" cy="48" r="4" fill="#fef08a"/>
      <g transform="translate(618, 146)">
        <ellipse cx="0" cy="-10" rx="14" ry="12" fill="#f5e6c8" stroke="#a16207" stroke-width="1.2"/>
        <ellipse cx="-14" cy="-6" rx="11" ry="9" fill="#ede0c0" stroke="#a16207" stroke-width="1.1"/>
      </g>
      <!-- Continuous 660px oak mill floor -->
      <rect x="0" y="148" width="660" height="60" fill="${s.isNight ? "#634224" : "#ad7a46"}"/>
      ${perspFloor(148, 0, 660, "#3b220c", 0.28, 64)}
      <line x1="0" y1="148" x2="660" y2="148" stroke="#3b220c" stroke-width="2"/>
    `;
  });

  // ============================================================
  // PART 3: T5 — 3 NATIVE SEAMLESS 760px HANGZHOU RESIDENCES (ZERO 41px STRIPS!)
  // ============================================================

  // T5-1: 🏙️ 丽晶国际 (760px, mainOriginX=0: Seamless 760px Qianjiang Sky, Loft 0..416 + Extended Sky-Bar Terrace 416..760)
  R.registerHouseArt("regent_intl", (dp) => {
    const s = skyOf(dp);
    const id = `rg7_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight ? ["#0b1026", "#23194d", "#6b2b6e", "#d96b6b", "#fbbf77"]
      : (s.isDusk ? ["#1d184a", "#7e2a70", "#db4d6d", "#fb923c", "#fde68a"]
        : (s.isDawn ? ["#60a5fa", "#bfdbfe", "#fbcfe8", "#fed7aa", "#fef9c3"] : ["#2563eb", "#60a5fa", "#bae6fd", "#e0f2fe", "#f8fafc"]));
    const riv = s.isNight ? ["#2c2459", "#192145", "#0e152e"] : (s.isDusk ? ["#4b3668", "#2d2859", "#181d3d"] : ["#93c5fd", "#38bdf8", "#0284c7"]);
    const wallC = s.isNight ? ["#2c3244", "#232838", "#1a1f2c"] : (s.isDusk ? ["#515973", "#41485e", "#31374a"] : ["#edf1f7", "#dce3ee", "#c5cfde"]);
    const flrC = s.isNight ? ["#454c5e", "#383e4e", "#282d3a"] : (s.isDusk ? ["#6d758c", "#596175", "#434a5c"] : ["#eef2f6", "#dce3ec", "#c4cedb"]);
    const deckC = s.isNight ? ["#2d3446", "#191e2b"] : (s.isDusk ? ["#6b5344", "#4a382d"] : ["#d6b286", "#b58d5e"]);
    const bld = lit ? ["#181c36", "#141830", "#1a1f3d", "#12162b", "#191e38"] : ["#94a3b8", "#7c8ea6", "#a3b3c6", "#6b7d96", "#889ab2"];
    const lotusC = lit ? ["#67e8f9", "#818cf8", "#312e81"] : ["#ffffff", "#e2e8f0", "#94a3b8"];
    const winOp = lit ? "0.78" : "0.42";
    const glowOp = lit ? "0.95" : "0.22";
    const frameC = s.isNight ? "#0f172a" : (s.isDusk ? "#1e293b" : "#475569");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="38%" stop-color="${sky[1]}"/><stop offset="72%" stop-color="${sky[2]}"/><stop offset="92%" stop-color="${sky[3]}"/><stop offset="100%" stop-color="${sky[4]}"/></linearGradient>
        <linearGradient id="${id}_riv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${riv[0]}"/><stop offset="55%" stop-color="${riv[1]}"/><stop offset="100%" stop-color="${riv[2]}"/></linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${wallC[0]}"/><stop offset="60%" stop-color="${wallC[1]}"/><stop offset="100%" stop-color="${wallC[2]}"/></linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${flrC[0]}"/><stop offset="50%" stop-color="${flrC[1]}"/><stop offset="100%" stop-color="${flrC[2]}"/></linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${deckC[0]}"/><stop offset="100%" stop-color="${deckC[1]}"/></linearGradient>
        <linearGradient id="${id}_lotus" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${lotusC[0]}"/><stop offset="55%" stop-color="${lotusC[1]}"/><stop offset="100%" stop-color="${lotusC[2]}"/></linearGradient>
      </defs>
      <!-- Continuous 760px Qianjiang Sky & River -->
      <rect width="760" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(200, 748, 22, 17, 74)}${moonCrescent(678, 34, 12, sky[0])}` : `<circle cx="678" cy="${s.isDusk ? 40 : 30}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.94"/>`}
      <path d="M180 118 Q380 110 580 116 Q670 112 760 118 V124 H180 Z" fill="${lit ? "#1e1b4b" : "#64748b"}" opacity="0.78"/>
      <rect x="180" y="122" width="580" height="28" fill="url(#${id}_riv)"/>
      <g opacity="${lit ? "0.52" : "0.62"}" stroke-linecap="round">
        <line x1="220" y1="128" x2="274" y2="128" stroke="${lit ? "#f472b6" : "#ffffff"}" stroke-width="1.4" class="h-drift"/>
        <line x1="484" y1="129" x2="544" y2="129" stroke="${lit ? "#38bdf8" : "#ffffff"}" stroke-width="1.6" class="h-drift"/>
        <line x1="646" y1="133" x2="736" y2="133" stroke="${lit ? "#fde047" : "#e0f2fe"}" stroke-width="1.4" class="h-drift-slow"/>
      </g>
      <!-- CBD Skyline spanning 190..754 seamlessly (including Gate of Hangzhou + 7-Petal Lotus Bowl!) -->
      <rect x="200" y="62" width="30" height="60" fill="${bld[0]}"/><rect x="238" y="40" width="34" height="82" fill="${bld[1]}"/>
      <rect x="282" y="54" width="28" height="68" fill="${bld[2]}"/><rect x="318" y="34" width="38" height="88" fill="${bld[3]}"/>
      <rect x="430" y="52" width="38" height="70" fill="${bld[1]}"/>
      <!-- Gate of Hangzhou (杭州之门) -->
      <path d="M484 122 L490 32 L506 24 L509 122 Z" fill="${bld[3]}" stroke="${lit ? "#38bdf8" : "#cbd5e1"}" stroke-width="0.7"/>
      <path d="M521 122 L524 24 L540 32 L546 122 Z" fill="${bld[3]}" stroke="${lit ? "#f472b6" : "#cbd5e1"}" stroke-width="0.7"/>
      <path d="M490 62 Q515 86 540 62 L541 72 Q515 96 489 72 Z" fill="${lit ? "#1e1b4b" : "#475569"}" stroke="${lit ? "#fde047" : "#e2e8f0"}" stroke-width="0.9"/>
      <!-- Hangzhou Olympic Lotus Bowl (大莲花) -->
      <g transform="translate(608, 122)">
        <path d="M-40 0 Q-38 -26 -22 -22 Q-14 -34 0 -28 Q14 -34 22 -22 Q38 -26 40 0 Z" fill="url(#${id}_lotus)" fill-opacity="${lit ? "0.84" : "0.95"}" stroke="${lit ? "#bae6fd" : "#475569"}" stroke-width="1"/>
        <path d="M-20 0 Q-12 -30 0 -28 Q12 -30 20 0" fill="none" stroke="#fef08a" stroke-width="1.2" opacity="0.88"/>
      </g>
      <rect x="664" y="40" width="46" height="82" fill="${bld[1]}"/><rect x="716" y="56" width="38" height="66" fill="${bld[0]}"/>
      <line x1="664" y1="40" x2="710" y2="40" stroke="#22d3ee" stroke-width="1.8" opacity="${glowOp}"/>
      <g fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}">
        <rect x="245" y="54" width="20" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="325" y="46" width="24" height="3"/>
        <rect x="671" y="52" width="32" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/><rect x="671" y="66" width="32" height="3" fill="${lit ? "#f472b6" : "#cbd5e1"}"/>
        <rect x="723" y="68" width="24" height="3"/><rect x="723" y="82" width="24" height="3" fill="${lit ? "#38bdf8" : "#cbd5e1"}"/>
      </g>
      <!-- INDOOR DOUBLE-HEIGHT LOFT (0..416) -->
      <rect x="0" y="0" width="186" height="148" fill="url(#${id}_wall)"/>
      <rect x="186" y="0" width="230" height="20" fill="${s.isNight ? "#181d2b" : (s.isDusk ? "#2c3347" : "#cbd5e1")}"/>
      <!-- 2F Mezzanine Loft + Floating Oak Staircase -->
      <rect x="0" y="0" width="186" height="54" fill="${s.isNight ? "#1a1f30" : (s.isDusk ? "#313952" : "#e2e8f0")}"/>
      <rect x="14" y="28" width="54" height="24" rx="3" fill="${lit ? "#334155" : "#94a3b8"}"/><rect x="18" y="34" width="46" height="18" rx="3" fill="#fff"/>
      <rect x="18" y="36" width="16" height="8" rx="3" fill="#f97316"/>
      <rect x="104" y="20" width="44" height="32" rx="2" fill="${lit ? "#272e42" : "#cbd5e1"}" stroke="#64748b" stroke-width="1"/>
      <rect x="0" y="52" width="178" height="7" fill="${frameC}"/>
      <line x1="0" y1="59" x2="178" y2="59" stroke="#22d3ee" stroke-width="1.5" opacity="${lit ? "0.95" : "0.28"}"/>
      <line x1="126" y1="148" x2="176" y2="56" stroke="${frameC}" stroke-width="4"/>
      ${[138, 124, 110, 96, 82, 68].map((y, i) => `<rect x="${124 + i * 8}" y="${y}" width="25" height="4" rx="1" fill="#c79a63" stroke="#451a03" stroke-width="0.6"/>`).join("")}
      <!-- Steel-grid panoramic loft window (186..384) & open sliding door (384..416) -->
      <rect x="186" y="20" width="198" height="128" fill="url(#hsGlassSheen)" opacity="0.28" stroke="${frameC}" stroke-width="2.4"/>
      <line x1="252" y1="20" x2="252" y2="148" stroke="${frameC}" stroke-width="1.6"/>
      <line x1="318" y1="20" x2="318" y2="148" stroke="${frameC}" stroke-width="1.6"/>
      <rect x="384" y="20" width="32" height="128" fill="none" stroke="#64748b" stroke-width="2.2"/>
      <rect x="384" y="20" width="12" height="128" fill="url(#hsGlassSheen)" opacity="0.3" stroke="#64748b" stroke-width="1.1"/>
      <!-- OUTDOOR SKY TERRACE (416..760): Full continuous festoon lights, glass neon rail, bar & stools -->
      <path d="M418 16 Q526 44 636 22 Q704 38 758 18" fill="none" stroke="${lit ? "#475569" : "#94a3b8"}" stroke-width="1.1"/>
      ${[456, 502, 548, 594, 646, 696, 738].map((x, i) => `<circle cx="${x}" cy="${24 + (i % 3) * 4}" r="2.6" fill="${lit ? "#fef08a" : "#f1f5f9"}" class="${lit ? (i % 2 ? "h-twinkle" : "h-twinkle-d1") : ""}"/>`).join("")}
      <rect x="416" y="114" width="344" height="34" fill="#38bdf8" opacity="${lit ? "0.14" : "0.1"}"/>
      <line x1="416" y1="114" x2="760" y2="114" stroke="${frameC}" stroke-width="3.2"/>
      <line x1="416" y1="116" x2="760" y2="116" stroke="#22d3ee" stroke-width="1.4" opacity="${glowOp}"/>
      ${[500, 588, 676, 756].map(x => `<line x1="${x}" y1="114" x2="${x}" y2="148" stroke="#64748b" stroke-width="1.8"/>`).join("")}
      <!-- Floors: Loft Terrazzo (0..416) + Continuous Outdoor Deck (416..760) -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      ${perspFloor(148, 0, 416, lit ? "#202533" : "#94a3b8", 0.36, 94)}
      <rect x="416" y="148" width="344" height="60" fill="url(#${id}_deck)"/>
      ${perspFloor(148, 416, 760, lit ? "#0f172a" : "#785028", 0.38, 72)}
      <line x1="416" y1="148" x2="416" y2="208" stroke="${lit ? "#475569" : "#94a3b8"}" stroke-width="4"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="${lit ? "#f472b6" : "#ffffff"}" stroke-width="1.2" opacity="0.8"/>
      <!-- Outdoor Sky-Bar Table & Stools -->
      <g transform="translate(646, 166)">
        <ellipse cx="0" cy="5" rx="46" ry="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="-42" y="-18" width="14" height="4.5" rx="2" fill="#f472b6"/><line x1="-35" y1="-13" x2="-35" y2="4" stroke="#94a3b8" stroke-width="2"/>
        <rect x="28" y="-18" width="14" height="4.5" rx="2" fill="#f472b6"/><line x1="35" y1="-13" x2="35" y2="4" stroke="#94a3b8" stroke-width="2"/>
        <rect x="-24" y="-28" width="48" height="5" rx="2" fill="#0f172a" stroke="#22d3ee" stroke-width="1.3"/>
        <line x1="0" y1="-23" x2="0" y2="4" stroke="#64748b" stroke-width="3"/>
        <rect x="-15" y="-36" width="5.5" height="8" rx="1" fill="#38bdf8"/><rect x="10" y="-35" width="5.5" height="7" rx="1" fill="#fb7185"/>
        <rect x="-3" y="-37" width="6" height="9" rx="2" fill="#fef08a" class="h-pulse"/>
      </g>
    `;
  });

  // T5-2: 🏢 和安居小区 (760px, mainOriginX=340: LEFT Sunset String-Light Balcony 0..340 + Sliding Door 340..370 + RIGHT Warm Oak Apartment 340..760!)
  R.registerHouseArt("heanju", (dp) => {
    const s = skyOf(dp);
    const id = `hj7_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const hSky = s.isNight ? ["#0b1120", "#1e293b", "#312e81"]
      : (s.isDusk ? ["#6366f1", "#fb923c", "#fde68a"] : (s.isDawn ? ["#93c5fd", "#fbcfe8", "#fed7aa"] : ["#60a5fa", "#bae6fd", "#e0f2fe"]));
    const blds = s.isNight ? ["#1e293b", "#172033", "#1e273d", "#151d2e"]
      : (s.isDusk ? ["#c26a4e", "#b57d50", "#9c6f4f", "#8c6345"] : ["#94a3b8", "#8195ab", "#9fb0c4", "#b0bfcf"]);
    const wCol = lit ? "#fde047" : "#e0f2fe";
    const wOp = s.isNight ? "0.88" : (s.isDusk ? "0.72" : "0.55");
    const wallS = s.isNight ? ["#dfd5c5", "#d1c5b2"] : ["#faf5eb", "#efe6d5"];
    const balcS = s.isNight ? ["#475569", "#334155"] : (s.isDusk ? ["#b6b0b8", "#898594"] : ["#cbd5e1", "#94a3b8"]);
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${hSky[0]}"/><stop offset="55%" stop-color="${hSky[1]}"/><stop offset="100%" stop-color="${hSky[2]}"/></linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wallS[0]}"/><stop offset="100%" stop-color="${wallS[1]}"/></linearGradient>
        <linearGradient id="${id}_balc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${balcS[0]}"/><stop offset="100%" stop-color="${balcS[1]}"/></linearGradient>
      </defs>
      <!-- Continuous 760px Sky & Hangzhou City Skyline -->
      <rect width="760" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(16, 540, 22, 23, 72)}${moonCrescent(118, 36, 14, hSky[0])}` : `<circle cx="118" cy="${s.isDusk ? 44 : 34}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <!-- Seamless City Skyline across Left Balcony (0..340) & Living Room Window (384..526) -->
      ${[[18,74,44],[70,50,56],[134,68,48],[190,54,54],[252,72,46],[304,60,40],[392,72,42],[442,52,50],[498,68,36]].map(([x, y, w], i) => `
        <rect x="${x}" y="${y}" width="${w}" height="${148 - y}" fill="${blds[i % 4]}" opacity="0.88"/>
        <rect x="${x + 10}" y="${y + 12}" width="7" height="9" rx="1" fill="${wCol}" opacity="${wOp}"/>
        <rect x="${x + w - 18}" y="${y + 12}" width="7" height="9" rx="1" fill="${wCol}" opacity="${wOp}"/>
        <rect x="${x + 10}" y="${y + 30}" width="7" height="9" rx="1" fill="${wCol}" opacity="${wOp}"/>
      `).join("")}
      <!-- LEFT OUTDOOR BALCONY (0..340): Festoon Lights, Glass Handrail, Rattan Lounge & Planters -->
      <path d="M4 22 Q110 46 220 26 Q280 42 338 22" fill="none" stroke="${lit ? "#475569" : "#94a3b8"}" stroke-width="1"/>
      ${[48, 96, 146, 198, 250, 298].map((x, i) => `<circle cx="${x}" cy="${30 + (i % 2) * 5}" r="2.6" fill="${lit ? "#fef08a" : "#f8fafc"}" class="${lit ? (i % 2 ? "h-twinkle" : "h-twinkle-d1") : ""}"/>`).join("")}
      <rect x="0" y="114" width="340" height="34" fill="${s.isNight ? "#93c5fd" : "#e0f2fe"}" opacity="0.18"/>
      <line x1="0" y1="114" x2="340" y2="114" stroke="#475569" stroke-width="2.6"/>
      ${[68, 150, 232, 312].map(x => `<line x1="${x}" y1="114" x2="${x}" y2="148" stroke="#64748b" stroke-width="1.6"/>`).join("")}
      <!-- RIGHT WARM APARTMENT LIVING ROOM (340..760): Sliding Door 340..370 + Panoramic Window 384..526 + Cozy Feature Wall 526..760 -->
      <rect x="526" y="0" width="234" height="148" fill="url(#${id}_wall)"/>
      <rect x="340" y="0" width="186" height="24" fill="${s.isNight ? "#cfc2ae" : "#ebe1ce"}"/>
      <rect x="370" y="24" width="14" height="124" fill="url(#${id}_wall)"/>
      <rect x="526" y="114" width="234" height="34" fill="${s.isNight ? "#c8baa6" : "#ebe1ce"}" opacity="0.55"/>
      <line x1="526" y1="114" x2="760" y2="114" stroke="#b8ab96" stroke-width="1.5"/>
      <!-- Open sliding glass doorway (340..370) & wide balcony window (384..526) -->
      <rect x="340" y="24" width="30" height="124" fill="none" stroke="#475569" stroke-width="2.2"/>
      <rect x="358" y="24" width="12" height="124" fill="url(#hsGlassSheen)" opacity="0.3" stroke="#64748b" stroke-width="1.2"/>
      <rect x="384" y="24" width="142" height="122" fill="url(#hsGlassSheen)" opacity="0.28" stroke="#64748b" stroke-width="2.4"/>
      <line x1="455" y1="24" x2="455" y2="146" stroke="#64748b" stroke-width="1.8"/>
      <!-- AC Unit & Framed Carrot Art on Right Wall (526..760) -->
      <rect x="634" y="30" width="84" height="22" rx="5" fill="${s.isNight ? "#e5e7eb" : "#ffffff"}" stroke="#cbd5e1" stroke-width="1.4"/>
      <circle cx="708" cy="37" r="1.6" fill="#22c55e" class="h-twinkle"/>
      <rect x="556" y="44" width="58" height="46" rx="3" fill="${s.isNight ? "#e5e7eb" : "#ffffff"}" stroke="#a8a29e" stroke-width="2"/>
      <rect x="562" y="50" width="46" height="34" rx="1.5" fill="${s.isNight ? "#f5ebd6" : "#fff7ed"}"/>
      <circle cx="585" cy="67" r="11" fill="#fed7aa"/><text x="585" y="71" font-size="11" text-anchor="middle">🥕</text>
      <!-- Floors: Left Outdoor Tile Deck (0..340) + Right Warm Oak Floor (340..760) -->
      <rect x="0" y="148" width="340" height="60" fill="url(#${id}_balc)"/>
      ${perspFloor(148, 0, 340, s.isNight ? "#1e293b" : "#64748b", 0.34, 72)}
      <rect x="340" y="148" width="420" height="60" fill="${s.isNight ? "#c8bca8" : "#e5dac6"}"/>
      ${perspFloor(148, 340, 760, "#9e8e74", 0.25, 76)}
      <line x1="340" y1="148" x2="340" y2="208" stroke="#64748b" stroke-width="3.6"/>
      <line x1="340" y1="148" x2="340" y2="208" stroke="#e2e8f0" stroke-width="1"/>
      <!-- Left Balcony Cozy Rattan Chair & Planter -->
      <g transform="translate(106, 162)">
        <ellipse cx="0" cy="4" rx="30" ry="5" fill="rgba(0,0,0,0.2)"/>
        <path d="M-24 -2 L-16 -24 L18 -24 L26 -2 Z" fill="${s.isNight ? "#92400e" : "#d97706"}" stroke="#78350f" stroke-width="1.2"/>
        <rect x="-24" y="-8" width="50" height="8" rx="4" fill="${s.isNight ? "#d6cbb8" : "#fffbeb"}" stroke="#a8a29e" stroke-width="0.9"/>
      </g>
      <g transform="translate(292, 156)">
        <path d="M-9 0 L-7 -15 L7 -15 L9 0 Z" fill="#c25934" stroke="#7c2d12" stroke-width="1"/>
        <ellipse cx="0" cy="-19" rx="11" ry="8" fill="${s.isNight ? "#15803d" : "#22c55e"}"/>
      </g>
    `;
  });

  // T5-3: 🌳 西溪北苑 (760px, mainOriginX=0: Seamless 760px Wetland Panorama, Oak Bay-Window Hall 0..416 + Extended Cedar Pergola Balcony 416..760)
  R.registerHouseArt("xixi_beiyuan", (dp) => {
    const s = skyOf(dp);
    const id = `xb7_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight ? ["#091426", "#162947", "#213a5e", "#1a383a"]
      : (s.isDusk ? ["#4338ca", "#ea580c", "#fbbf24", "#fde68a"] : (s.isDawn ? ["#7aa7e8", "#fbcfe8", "#fef3c7", "#d1fae5"] : ["#38bdf8", "#bae6fd", "#e0f2fe", "#ecfdf5"]));
    const treeM = s.isNight ? "#14532d" : "#15803d";
    const treeL = s.isNight ? "#166534" : "#22c55e";
    const wallC = s.isNight ? ["#ddd3c2", "#cbbda8"] : ["#fffcf5", "#efe6d6"];
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="48%" stop-color="${sky[1]}"/><stop offset="82%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/></linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/></linearGradient>
      </defs>
      <!-- Continuous 760px Xixi Wetland Sky, Misty Hills & Water -->
      <rect width="760" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(80, 748, 22, 37, 66)}${moonCrescent(658, 34, 13, sky[0])}` : `<circle cx="658" cy="${s.isDusk ? 44 : 34}" r="15" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <path d="M0 108 Q160 66 320 98 Q480 62 640 94 Q700 80 760 92 V148 H0 Z" fill="${s.isNight ? "#153a34" : "#6ee7b7"}" opacity="0.54"/>
      <rect x="0" y="122" width="760" height="26" fill="${s.isNight ? "#16354d" : "#7dd3fc"}" opacity="0.62"/>
      <line x1="464" y1="132" x2="544" y2="132" stroke="#ffffff" stroke-width="1.2" opacity="0.55" class="h-drift"/>
      <line x1="610" y1="136" x2="718" y2="136" stroke="#ffffff" stroke-width="1.1" opacity="0.5" class="h-drift-slow"/>
      <!-- Xixi Fire-Persimmon Trees & Rowing Boat (nested transform!) -->
      <g transform="translate(514, 132)"><g class="h-drift-slow">
        <path d="M-16 0 Q0 6 18 0 L14 4 Q0 8 -14 4 Z" fill="#5c2d0e"/>
        <path d="M-6 0 Q2 -10 10 0 Z" fill="#d9a55b" stroke="#78350f" stroke-width="0.9"/>
      </g></g>
      <circle cx="446" cy="94" r="18" fill="${treeM}"/><circle cx="440" cy="90" r="3" fill="#f97316"/><circle cx="454" cy="96" r="3" fill="#ea580c"/>
      <circle cx="718" cy="92" r="22" fill="${treeL}"/><circle cx="712" cy="88" r="3.2" fill="#f97316"/><circle cx="726" cy="94" r="3" fill="#ea580c"/>
      <!-- INDOOR OAK LIVING HALL (0..416) -->
      <rect x="0" y="0" width="416" height="22" fill="${s.isNight ? "#cfc5b4" : "#faf5eb"}"/>
      <rect x="0" y="0" width="416" height="10" fill="${s.isNight ? "#8f693e" : "#c79a63"}"/>
      <rect x="0" y="22" width="84" height="126" fill="url(#${id}_wall)"/>
      <g fill="${s.isNight ? "#9c754b" : "#d4a674"}" opacity="0.88"><rect x="6" y="22" width="5" height="126"/><rect x="16" y="22" width="5" height="126"/><rect x="26" y="22" width="5" height="126"/></g>
      <rect x="372" y="22" width="12" height="126" fill="url(#${id}_wall)"/>
      <!-- Wide Wetland Bay Window (84..372) + Built-in Cushioned Bench -->
      <rect x="84" y="22" width="288" height="90" fill="rgba(255,255,255,0.06)" stroke="#8c7a62" stroke-width="2.2"/>
      <line x1="180" y1="22" x2="180" y2="112" stroke="#8c7a62" stroke-width="1.4"/><line x1="276" y1="22" x2="276" y2="112" stroke="#8c7a62" stroke-width="1.4"/>
      <rect x="84" y="112" width="288" height="36" fill="${s.isNight ? "#d8cebc" : "#f3eadb"}" stroke="#c8b698" stroke-width="1.4"/>
      <rect x="86" y="106" width="284" height="10" rx="4" fill="${s.isNight ? "#ede5d2" : "#fffbeb"}" stroke="#d4b483" stroke-width="1.1"/>
      <rect x="384" y="22" width="32" height="126" fill="none" stroke="#78716c" stroke-width="2.2"/>
      <!-- OUTDOOR CEDAR WETLAND BALCONY (416..760) -->
      <rect x="416" y="0" width="344" height="14" fill="${s.isNight ? "#593718" : "#8c5828"}"/>
      ${[462, 560, 658, 742].map(x => `<rect x="${x}" y="0" width="8" height="18" fill="${s.isNight ? "#42260f" : "#6b3e18"}"/>`).join("")}
      <rect x="416" y="114" width="344" height="34" fill="#e0f2fe" opacity="0.18"/>
      <line x1="416" y1="114" x2="760" y2="114" stroke="#78350f" stroke-width="3"/>
      ${[504, 598, 692].map(x => `<line x1="${x}" y1="114" x2="${x}" y2="148" stroke="#92400e" stroke-width="1.8"/>`).join("")}
      <!-- Floors: Oak Indoor (0..416) + Continuous Teak Deck (416..760) -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#b8a890" : "#e5d5bc"}"/>
      ${perspFloor(148, 0, 416, "#8c7454", 0.34, 88)}
      <rect x="416" y="148" width="344" height="60" fill="${s.isNight ? "#5c3b20" : "#a87442"}"/>
      ${perspFloor(148, 416, 760, "#451a03", 0.34, 72)}
      <line x1="416" y1="148" x2="416" y2="208" stroke="#64748b" stroke-width="3.6"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#fef3c7" stroke-width="1"/>
      <!-- Outdoor cedar lounge chair -->
      <g transform="translate(612, 166)">
        <ellipse cx="0" cy="5" rx="38" ry="5.5" fill="rgba(0,0,0,0.2)"/>
        <path d="M-24 -4 L-18 -26 L20 -26 L26 -4 Z" fill="#b45309" stroke="#5c2d0e" stroke-width="1.2"/>
        <rect x="-20" y="-22" width="40" height="16" rx="5" fill="#fffbeb" stroke="#d4b483" stroke-width="1"/>
      </g>
    `;
  });

  // ============================================================
  // PART 4: T6 — 4 NATIVE SEAMLESS 920px LUXURY HANGZHOU ESTATES
  //   ZERO SKY SEAMS! Mix of Center-Salon Dual-Garden & 3-Zone Portal Estates!
  // ============================================================

  // T6-1: 🏡 西溪壹号别墅 (920px, mainOriginX=250: WEST Koi Lotus Boardwalk 0..250 + CENTER Walnut Grand Hall 250..670 + EAST Lakeside Guqin Pavilion & Waterfall 670..920!)
  R.registerHouseArt("xixi", (dp) => {
    const s = skyOf(dp);
    const id = `xx9_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const xSky = s.isNight ? ["#090f24", "#172554", "#1e3a5f", "#134e4a"]
      : (s.isDusk ? ["#4338ca", "#f97316", "#fde68a", "#fed7aa"] : (s.isDawn ? ["#93c5fd", "#fce7f3", "#fef3c7", "#d1fae5"] : ["#7dd3fc", "#e0f2fe", "#fef9c3", "#d1fae5"]));
    const mtBack = s.isNight ? "#134e4a" : (s.isDusk ? "#586274" : "#86efac");
    const mtFront = s.isNight ? "#0f3d3e" : (s.isDusk ? "#3d5e58" : "#34d399");
    const waterCol = s.isNight ? "#1e3a5f" : (s.isDusk ? "#fb923c" : "#7dd3fc");
    const deckS = s.isNight ? ["#69462a", "#4a2f1a"] : (s.isDusk ? ["#a87042", "#784922"] : ["#b88352", "#8b5a2b"]);
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${xSky[0]}"/><stop offset="48%" stop-color="${xSky[1]}"/><stop offset="82%" stop-color="${xSky[2]}"/><stop offset="100%" stop-color="${xSky[3]}"/></linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${deckS[0]}"/><stop offset="100%" stop-color="${deckS[1]}"/></linearGradient>
      </defs>
      <!-- ONE CONTINUOUS 920px Xixi Wetland Sky, Mountain Range & Glistening Lake! -->
      <rect width="920" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(18, 902, 34, 61, 74)}${moonCrescent(784, 34, 15, xSky[0])}` : `<circle cx="784" cy="${s.isDusk ? 46 : 34}" r="17" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <path d="M0 108 Q120 66 240 96 Q360 60 480 94 Q600 62 720 96 Q820 68 920 92 V148 H0 Z" fill="${mtBack}" opacity="${s.isNight ? "0.78" : "0.5"}"/>
      <path d="M0 120 Q160 94 320 116 Q480 96 640 118 Q780 94 920 116 V148 H0 Z" fill="${mtFront}" opacity="${s.isNight ? "0.86" : "0.56"}"/>
      <rect x="0" y="124" width="920" height="24" fill="${waterCol}" opacity="${s.isNight ? "0.76" : "0.5"}"/>
      <line x1="60" y1="134" x2="144" y2="134" stroke="#fff" stroke-width="1.1" opacity="0.52" class="h-drift"/>
      <line x1="420" y1="134" x2="510" y2="134" stroke="#fff" stroke-width="1.1" opacity="0.5" class="h-drift-slow"/>
      <line x1="720" y1="136" x2="810" y2="136" stroke="#fff" stroke-width="1.1" opacity="0.52" class="h-drift"/>
      <!-- WEST BOARDWALK (0..250): Ancient Weeping Willow, Stone Lantern & Koi Lotus Pond -->
      <g transform="translate(62, 148)">
        <path d="M0 0 Q-4 -44 8 -84" stroke="#5c2d0e" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="8" cy="-88" rx="36" ry="18" fill="${s.isNight ? "#14532d" : "#22c55e"}" opacity="0.9"/>
        <g stroke="${s.isNight ? "#166534" : "#15803d"}" stroke-width="1.5" fill="none" opacity="0.78" class="h-drift-slow">
          <path d="M-12 -78 Q-18 -44 -10 -18"/><path d="M2 -74 Q-2 -40 4 -14"/><path d="M18 -76 Q22 -44 16 -18"/>
        </g>
      </g>
      <g transform="translate(192, 148)">
        <rect x="-5" y="-14" width="10" height="14" rx="1.5" fill="#94a3b8" stroke="#475569" stroke-width="0.9"/>
        <rect x="-7" y="-24" width="14" height="10" rx="1.5" fill="${lit ? "#fef08a" : "#e2e8f0"}" stroke="#475569" stroke-width="0.9"/>
        <path d="M-11 -24 Q0 -33 11 -24 Z" fill="#64748b"/>
      </g>
      <ellipse cx="136" cy="136" rx="12" ry="3.6" fill="#15803d"/><circle cx="136" cy="134" r="3" fill="#f9a8d4"/>
      <line x1="0" y1="132" x2="250" y2="132" stroke="#78350f" stroke-width="2" opacity="0.82"/>
      ${[50, 130, 210].map(x => `<line x1="${x}" y1="132" x2="${x}" y2="148" stroke="#78350f" stroke-width="2"/>`).join("")}
      <!-- EAST LAKESIDE TEA & GUQIN PAVILION (670..920): Upturned Eaves + Sculpted Organic Taihu Rockery Waterfall! -->
      <path d="M844 148 L850 112 Q862 96 870 78 Q886 64 900 84 Q912 90 920 110 V148 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}" stroke="#334155" stroke-width="1.2"/>
      <path d="M858 148 L866 116 Q880 100 896 118 L908 148 Z" fill="${s.isNight ? "#334155" : "#64748b"}" opacity="0.72"/>
      <ellipse cx="876" cy="84" rx="14" ry="6" fill="${s.isNight ? "#14532d" : "#22c55e"}" opacity="0.82"/>
      <path d="M876 90 Q886 116 878 148" stroke="#7dd3fc" stroke-width="7" fill="none" opacity="0.86" stroke-linecap="round"/>
      <path d="M884 102 Q890 126 886 148" stroke="#bae6fd" stroke-width="3.5" fill="none" opacity="0.72" stroke-linecap="round"/>
      <line x1="878" y1="92" x2="878" y2="146" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="6 5" class="h-flow-rev"/>
      <ellipse cx="882" cy="147" rx="16" ry="3.5" fill="#e0f2fe" opacity="0.65" class="h-pulse"/>
      <path d="M718 52 Q782 22 846 52 L834 56 Q782 34 730 56 Z" fill="${s.isNight ? "#0f172a" : "#334155"}" stroke="#d4af37" stroke-width="1.2"/>
      <rect x="736" y="54" width="6" height="94" fill="#7c2d12"/><rect x="822" y="54" width="6" height="94" fill="#7c2d12"/>
      <circle cx="782" cy="56" r="6" fill="${lit ? "#fde047" : "#ef4444"}"/>
      <line x1="670" y1="132" x2="920" y2="132" stroke="#78350f" stroke-width="2" opacity="0.82"/>
      ${[710, 784, 854].map(x => `<line x1="${x}" y1="132" x2="${x}" y2="148" stroke="#78350f" stroke-width="2"/>`).join("")}
      <!-- CENTER LUXURY WALNUT GRAND VILLA SALON (250..670) with Twin Bronze Sliding Glass Doors! -->
      <rect x="250" y="0" width="420" height="22" fill="#5c2d0e"/>
      <rect x="250" y="20" width="420" height="2.6" fill="#fde68a" opacity="${s.isNight ? "0.92" : "0.68"}"/>
      ${[250, 344, 460, 576, 658].map(x => `<rect x="${x}" y="0" width="12" height="24" fill="#451a03"/>`).join("")}
      <!-- Panoramic Wetland Glass Curtain Wall (278..642) + Left & Right Open Sliding Doors! -->
      <rect x="278" y="23" width="364" height="125" fill="url(#hsGlassSheen)" opacity="0.22" stroke="#78716c" stroke-width="1.8"/>
      <line x1="400" y1="23" x2="400" y2="148" stroke="#78716c" stroke-width="1.5" opacity="0.7"/>
      <line x1="520" y1="23" x2="520" y2="148" stroke="#78716c" stroke-width="1.5" opacity="0.7"/>
      <rect x="250" y="23" width="28" height="125" fill="none" stroke="#57534e" stroke-width="2.2"/>
      <rect x="642" y="23" width="28" height="125" fill="none" stroke="#57534e" stroke-width="2.2"/>
      <!-- Floors: West Teak Boardwalk (0..250) + Center Travertine Salon (250..670) + East Teak Boardwalk (670..920) -->
      <rect x="0" y="148" width="250" height="60" fill="url(#${id}_deck)"/>
      ${perspFloor(148, 0, 250, "#3b1d08", 0.36, 54)}
      <rect x="250" y="148" width="420" height="60" fill="${s.isNight ? "#c8bfb0" : "#e8e1d4"}"/>
      ${perspFloor(148, 250, 670, "#9e927f", 0.28, 76)}
      <rect x="670" y="148" width="250" height="60" fill="url(#${id}_deck)"/>
      ${perspFloor(148, 670, 920, "#3b1d08", 0.36, 54)}
      <!-- Twin Bronze Sliding-Door Floor Tracks at x=250 & x=670 -->
      <line x1="250" y1="148" x2="250" y2="208" stroke="#57534e" stroke-width="3.8"/><line x1="250" y1="148" x2="250" y2="208" stroke="#fde68a" stroke-width="1"/>
      <line x1="670" y1="148" x2="670" y2="208" stroke="#57534e" stroke-width="3.8"/><line x1="670" y1="148" x2="670" y2="208" stroke="#fde68a" stroke-width="1"/>
      <!-- East Pavilion Guqin Zither Table -->
      <g transform="translate(782, 154)">
        <rect x="-24" y="-12" width="48" height="5" rx="2" fill="#5c2d0e" stroke="#d4af37" stroke-width="0.9"/>
        <line x1="-18" y1="-7" x2="-18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/><line x1="18" y1="-7" x2="18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/>
        <path d="M-20 -13 L20 -13 L16 -17 L-18 -17 Z" fill="#92400e" stroke="#fbbf24" stroke-width="0.7"/>
      </g>
    `;
  });

  // T6-2: 🌆 武林壹号天幕平层 (920px, mainOriginX=0: Left Black-Gold Penthouse 0..416 + Center Canal Firepit Deck 416..670 + Brass-Glass Portal Arch 666..688 + Right Sky Infinity Pool & Champagne Bar 688..920!)
  R.registerHouseArt("wulin_yihao", (dp) => {
    const s = skyOf(dp);
    const id = `wl9_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight ? ["#050816", "#0f1d3d", "#223059", "#3b335c"]
      : (s.isDusk ? ["#1e1b4b", "#7c2d6e", "#f97316", "#fde68a"] : (s.isDawn ? ["#5b88d6", "#f5c2d1", "#fde68a", "#fef3c7"] : ["#3b82f6", "#7dd3fc", "#bae6fd", "#e0f2fe"]));
    const canalC = s.isNight ? ["#172554", "#0a1229"] : (s.isDusk ? ["#3b2a5c", "#172042"] : ["#7dd3fc", "#0284c7"]);
    const bld = lit ? ["#0f172a", "#131c33", "#0e1529", "#141e36", "#111930"] : ["#94a3b8", "#7c8ea6", "#6b7d96", "#889ab2", "#a3b3c6"];
    const flrC = s.isNight ? ["#292e3d", "#1e222e", "#13161f"] : (s.isDusk ? ["#4a4654", "#383440", "#26232d"] : ["#f3efe6", "#e4ddd0", "#cfc6b4"]);
    const deckC = s.isNight ? ["#1e2433", "#0d1018"] : (s.isDusk ? ["#474352", "#2d2a36"] : ["#cbd5e1", "#94a3b8"]);
    const winOp = lit ? "0.8" : "0.4";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="48%" stop-color="${sky[1]}"/><stop offset="84%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/></linearGradient>
        <linearGradient id="${id}_canal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${canalC[0]}"/><stop offset="100%" stop-color="${canalC[1]}"/></linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${flrC[0]}"/><stop offset="55%" stop-color="${flrC[1]}"/><stop offset="100%" stop-color="${flrC[2]}"/></linearGradient>
        <linearGradient id="${id}_deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${deckC[0]}"/><stop offset="100%" stop-color="${deckC[1]}"/></linearGradient>
      </defs>
      <!-- ONE CONTINUOUS 920px Grand Canal & Wulin CBD Sky! -->
      <rect width="920" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(120, 906, 36, 71, 70)}${moonCrescent(806, 32, 13, sky[0])}` : `<circle cx="806" cy="${s.isDusk ? 40 : 32}" r="15" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <rect x="0" y="120" width="920" height="28" fill="url(#${id}_canal)"/>
      <!-- Continuous Hangzhou CBD Towers across 118..914 -->
      ${[[120,54,32],[160,38,40],[260,46,44],[312,60,38],[434,44,42],[544,36,50],[604,52,42],[714,56,42],[766,38,48],[824,48,46],[876,62,38]].map(([x, y, w], i) => `
        <rect x="${x}" y="${y}" width="${w}" height="${122 - y}" fill="${bld[i % 5]}"/>
        <rect x="${x + 6}" y="${y + 10}" width="${w - 12}" height="2.6" fill="${lit ? "#fde68a" : "#e2e8f0"}" opacity="${winOp}"/>
        <rect x="${x + 6}" y="${y + 22}" width="${w - 12}" height="2.6" fill="${lit ? "#38bdf8" : "#cbd5e1"}" opacity="${winOp}"/>
      `).join("")}
      <!-- Twin Iconic Global Center Spires -->
      <polygon points="212,122 224,28 238,28 250,122" fill="${bld[2]}" stroke="${lit ? "#fbbf24" : "#cbd5e1"}" stroke-width="0.7"/>
      <polygon points="488,122 502,24 518,24 532,122" fill="${bld[2]}" stroke="${lit ? "#fbbf24" : "#cbd5e1"}" stroke-width="0.8"/>
      <!-- Canal Cruise Boat (nested transform!) -->
      <g transform="translate(474, 134)"><g class="h-drift-slow">
        <path d="M-18 0 H18 L13 4 H-13 Z" fill="#78350f" stroke="#fde047" stroke-width="0.7"/>
        <rect x="-11" y="-6" width="22" height="6" rx="1" fill="${lit ? "#fef08a" : "#fffdf8"}" opacity="0.92"/>
      </g></g>
      <!-- INDOOR BLACK-GOLD PENTHOUSE (0..416) -->
      <rect x="0" y="0" width="416" height="20" fill="${lit ? "#12141c" : "#e5dfd3"}"/>
      <line x1="0" y1="20" x2="416" y2="20" stroke="url(#hsGoldH)" stroke-width="2.2"/>
      <!-- Floor-to-ceiling Illuminated Wine Cellar Wall (0..106) -->
      <rect x="0" y="20" width="106" height="128" fill="${lit ? "#161822" : "#dfd8cc"}"/>
      <rect x="8" y="26" width="90" height="116" rx="3" fill="${lit ? "#231914" : "#5c4028"}" stroke="url(#hsGoldH)" stroke-width="1.3"/>
      ${[46, 68, 90, 112].map(y => `<line x1="12" y1="${y}" x2="94" y2="${y}" stroke="#d4af37" stroke-width="1" opacity="0.7"/><rect x="20" y="${y - 10}" width="5" height="10" rx="1" fill="#7f1d1d"/><rect x="34" y="${y - 10}" width="5" height="10" rx="1" fill="#14532d"/><rect x="56" y="${y - 10}" width="5" height="10" rx="1" fill="#7f1d1d"/><rect x="74" y="${y - 10}" width="5" height="10" rx="1" fill="#92400e"/>`).join("")}
      <rect x="106" y="20" width="278" height="128" fill="url(#hsGlassSheen)" opacity="0.2" stroke="#334155" stroke-width="2"/>
      <rect x="384" y="20" width="32" height="128" fill="none" stroke="url(#hsGoldH)" stroke-width="2"/>
      <!-- CONTINUOUS OUTDOOR SKY DECK (416..920) with Brushed-Brass Pergola Portal Divider at x=666..688! -->
      <rect x="416" y="116" width="504" height="32" fill="#38bdf8" opacity="0.16"/>
      <line x1="416" y1="116" x2="920" y2="116" stroke="url(#hsGoldH)" stroke-width="2.6"/>
      <!-- Sleek Black-Gold Architectural Portal Arch separating Firepit Terrace & Sky Infinity Pool (x=666..688) -->
      <rect x="666" y="12" width="10" height="136" fill="${lit ? "#12141c" : "#334155"}" stroke="url(#hsGoldH)" stroke-width="1.2"/>
      <rect x="666" y="10" width="254" height="8" fill="${lit ? "#12141c" : "#334155"}" stroke="url(#hsGoldH)" stroke-width="1.2"/>
      <line x1="676" y1="18" x2="920" y2="18" stroke="#fde047" stroke-width="1.2" opacity="0.72"/>
      <!-- Floors: Indoor Black-Gold Marble (0..416) + Continuous Outdoor Slate Deck (416..920) -->
      <rect x="0" y="148" width="416" height="60" fill="url(#${id}_flr)"/>
      ${perspFloor(148, 0, 416, "#d4af37", 0.26, 86)}
      <rect x="416" y="148" width="504" height="60" fill="url(#${id}_deck)"/>
      ${perspFloor(148, 416, 920, "#64748b", 0.28, 76)}
      <line x1="416" y1="148" x2="416" y2="208" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <!-- Zone 2: Cloud Sunken Fire-Pit Lounge (x=546) -->
      <g transform="translate(546, 160)">
        <ellipse cx="0" cy="4" rx="34" ry="8" fill="#1e293b" stroke="url(#hsGoldH)" stroke-width="1.4"/>
        <ellipse cx="0" cy="2" rx="22" ry="5" fill="#0f172a"/>
        <path d="M-10 2 Q-4 -14 0 -18 Q5 -10 10 2 Z" fill="#f97316" class="h-pulse"/>
        <path d="M-5 2 Q0 -10 5 2 Z" fill="#fef08a"/>
      </g>
      <!-- Zone 3: Sky Infinity Glass Pool & Champagne Ice-Bucket Bar (698..904) -->
      <rect x="708" y="156" width="150" height="36" rx="8" fill="${s.isNight ? "#0369a1" : "#38bdf8"}" stroke="url(#hsGoldH)" stroke-width="2"/>
      <line x1="726" y1="170" x2="796" y2="170" stroke="#e0f2fe" stroke-width="1.3" opacity="0.65" class="h-drift"/>
      <line x1="772" y1="180" x2="844" y2="180" stroke="#bae6fd" stroke-width="1.1" opacity="0.55" class="h-drift-slow"/>
      <g transform="translate(884, 150)">
        <rect x="-12" y="-18" width="24" height="18" rx="3" fill="#1e293b" stroke="url(#hsGoldH)" stroke-width="1.2"/>
        <path d="M-4 -18 L-6 -28 L6 -28 L4 -18 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8"/>
        <rect x="-2" y="-35" width="4" height="8" rx="1" fill="#15803d"/><circle cx="0" cy="-35.5" r="1.4" fill="#fde047"/>
      </g>
    `;
  });

  // T6-3: 🌹 云栖玫瑰园法式庄园 (920px, mainOriginX=250: WEST Versailles Rose Fountain 0..250 + CENTER French Salon 250..670 + EAST White Piano Conservatory 670..920!)
  R.registerHouseArt("yunqi_rose", (dp) => {
    const s = skyOf(dp);
    const id = `yr9_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight ? ["#0b1124", "#1d2948", "#2e3b60", "#3b3252"]
      : (s.isDusk ? ["#4338ca", "#e1596a", "#fb923c", "#fde68a"] : (s.isDawn ? ["#7aa7e8", "#fbcfe8", "#fde68a", "#ffe4e6"] : ["#60a5fa", "#bae6fd", "#fef3c7", "#fde2e4"]));
    const wallC = s.isNight ? ["#ddd3c3", "#cabda8"] : ["#fffdf8", "#f0e5d1"];
    const flrC = s.isNight ? ["#cfc2ae", "#b8a991"] : ["#f5ede0", "#dfd2bc"];
    const outFlr = s.isNight ? "#8a857d" : "#e5dfd3";
    const cypD = s.isNight ? "#0d381e" : "#14532d";
    const cypL = s.isNight ? "#14532d" : "#15803d";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="52%" stop-color="${sky[1]}"/><stop offset="88%" stop-color="${sky[2]}"/><stop offset="100%" stop-color="${sky[3]}"/></linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/></linearGradient>
        <linearGradient id="${id}_flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${flrC[0]}"/><stop offset="100%" stop-color="${flrC[1]}"/></linearGradient>
      </defs>
      <!-- ONE CONTINUOUS 920px Wuyun Mountain Chateau Sky & Rolling Tea Hills -->
      <rect width="920" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(16, 904, 32, 81, 70)}${moonCrescent(796, 34, 14, sky[0])}` : `<circle cx="796" cy="${s.isDusk ? 42 : 34}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <path d="M0 106 Q160 62 320 98 Q480 58 640 94 Q780 68 920 92 V148 H0 Z" fill="${s.isNight ? "#153a34" : "#6ee7b7"}" opacity="0.54"/>
      <path d="M0 122 Q230 94 460 116 Q690 90 920 114 V148 H0 Z" fill="${s.isNight ? "#134e4a" : "#34d399"}" opacity="0.58"/>
      <!-- WEST GARDEN (0..250): Cypress Trees, Climbing Rose Pergola & 3-Tier Versailles Fountain! -->
      <ellipse cx="26" cy="110" rx="11" ry="30" fill="${cypD}"/><ellipse cx="226" cy="110" rx="11" ry="30" fill="${cypD}"/>
      <rect x="0" y="128" width="250" height="20" rx="4" fill="${cypL}"/>
      <g transform="translate(126, 148)">
        <rect x="-76" y="-76" width="10" height="76" fill="${s.isNight ? "#cbd5e1" : "#faf5eb"}" stroke="#94a3b8" stroke-width="1"/>
        <rect x="66" y="-76" width="10" height="76" fill="${s.isNight ? "#cbd5e1" : "#faf5eb"}" stroke="#94a3b8" stroke-width="1"/>
        <path d="M-74 -76 Q0 -104 74 -76" fill="none" stroke="${cypD}" stroke-width="10" stroke-linecap="round"/>
        ${[[-64,-78],[-32,-88],[0,-92],[32,-88],[64,-78]].map(([rx, ry], i) => `<circle cx="${rx}" cy="${ry}" r="6" fill="${i % 2 ? "#e11d48" : "#f472b6"}"/>`).join("")}
        <ellipse cx="0" cy="-2" rx="42" ry="10" fill="${s.isNight ? "#94a3b8" : "#e2e8f0"}" stroke="#64748b" stroke-width="1.3"/>
        <ellipse cx="0" cy="-3" rx="34" ry="7" fill="${s.isNight ? "#0284c7" : "#38bdf8"}" opacity="0.88"/>
        <rect x="-5" y="-32" width="10" height="29" fill="#f8fafc"/><ellipse cx="0" cy="-20" rx="22" ry="5.5" fill="#f8fafc"/>
        <path d="M0 -36 V-50 M0 -48 Q-12 -40 -16 -22 M0 -48 Q12 -40 16 -22" stroke="#bae6fd" stroke-width="1.8" fill="none" stroke-dasharray="4 3" class="h-flow"/>
      </g>
      <!-- EAST CONSERVATORY (670..920): White Iron French Rose Gazebo & White Grand Piano! -->
      <path d="M718 148 V54 A78 40 0 0 1 874 54 V148" fill="none" stroke="#fffbeb" stroke-width="3.5"/>
      <path d="M734 148 V60 A62 32 0 0 1 858 60 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      ${[[728,68],[750,38],[796,22],[842,38],[864,68]].map(([rx, ry]) => `<circle cx="${rx}" cy="${ry}" r="6.5" fill="#15803d"/><circle cx="${rx}" cy="${ry}" r="3.2" fill="#f43f5e"/>`).join("")}
      <!-- CENTER FRENCH CHATEAU SALON (250..670) with Carved Marble Fireplace & Twin Arched Windows! -->
      <path d="M250 0 H670 V148 H250 Z M404 146 V58 A50 34 0 0 1 504 58 V146 Z M522 146 V58 A50 34 0 0 1 622 58 V146 Z" fill="url(#${id}_wall)" fill-rule="evenodd"/>
      <rect x="250" y="0" width="420" height="18" fill="${s.isNight ? "#cfc2ac" : "#f0e4cd"}"/>
      <line x1="250" y1="18" x2="670" y2="18" stroke="url(#hsGoldH)" stroke-width="2"/>
      <!-- Marble Fireplace & Gilded Painting (280..378) -->
      <rect x="282" y="92" width="94" height="56" rx="2" fill="${s.isNight ? "#e2d9c8" : "#f8f4eb"}" stroke="#c9b89c" stroke-width="1.5"/>
      <rect x="276" y="87" width="106" height="7" rx="2" fill="#fffdf8" stroke="#d4af37" stroke-width="1.2"/>
      <path d="M302 148 V116 A27 20 0 0 1 356 116 V148 Z" fill="#18181b" stroke="#d4af37" stroke-width="1.3"/>
      <path d="M316 146 Q324 126 329 120 Q335 132 341 124 Q345 138 339 146 Z" fill="#f97316" class="h-pulse"/>
      <rect x="296" y="30" width="66" height="46" rx="3" fill="#fef3c7" stroke="url(#hsGoldH)" stroke-width="2.4"/>
      <rect x="301" y="35" width="56" height="36" fill="#bae6fd"/><path d="M301 62 Q329 48 357 60 V71 H301 Z" fill="#4ade80"/>
      <!-- Twin Gilded Arched Windows + Sculpted French Limestone Pilasters & Rose Garlands framing Salon Edges (x=250 & x=670) -->
      <path d="M404 146 V58 A50 34 0 0 1 504 58 V146 Z" fill="none" stroke="#d4af37" stroke-width="2.4"/>
      <path d="M522 146 V58 A50 34 0 0 1 622 58 V146 Z" fill="none" stroke="#d4af37" stroke-width="2.4"/>
      <rect x="242" y="0" width="16" height="148" fill="${s.isNight ? "#bfb29d" : "#efe5d2"}" stroke="#d4af37" stroke-width="1.3"/>
      <rect x="662" y="0" width="16" height="148" fill="${s.isNight ? "#bfb29d" : "#efe5d2"}" stroke="#d4af37" stroke-width="1.3"/>
      <rect x="238" y="0" width="444" height="8" rx="2" fill="${s.isNight ? "#334155" : "#64748b"}" stroke="#d4af37" stroke-width="1"/>
      <path d="M242 22 Q232 54 242 86 Q234 112 244 132 M678 22 Q688 54 678 86 Q686 112 676 132" stroke="#15803d" stroke-width="2.4" fill="none"/>
      ${[[239,40],[242,74],[239,108],[681,40],[678,74],[681,108]].map(([rx, ry]) => `<circle cx="${rx}" cy="${ry}" r="3.4" fill="#f43f5e"/>`).join("")}
      <!-- Floors: West Limestone Terrace (0..250) + Center Salon Marble (250..670) + East Conservatory Stone (670..920) -->
      <rect x="0" y="148" width="250" height="60" fill="${outFlr}"/>
      ${perspFloor(148, 0, 250, "#94a3b8", 0.32, 60)}
      <rect x="250" y="148" width="420" height="60" fill="url(#${id}_flr)"/>
      ${perspFloor(148, 250, 670, "#cbb898", 0.36, 78)}
      <rect x="670" y="148" width="250" height="60" fill="${outFlr}"/>
      ${perspFloor(148, 670, 920, "#d4af37", 0.28, 60)}
      <line x1="250" y1="148" x2="250" y2="208" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <line x1="670" y1="148" x2="670" y2="208" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <!-- East Conservatory White Grand Piano (x=796) -->
      <g transform="translate(796, 152)">
        <ellipse cx="0" cy="4" rx="34" ry="6" fill="rgba(0,0,0,0.2)"/>
        <path d="M-26 -8 C-26 -28 4 -34 26 -16 C32 -11 32 -2 24 -2 L-26 -2 Z" fill="#fffdf8" stroke="#d4af37" stroke-width="1.4"/>
        <path d="M-20 -18 L24 -34 L26 -30 L-16 -14 Z" fill="#ffffff" stroke="#d4af37" stroke-width="1.1"/>
        <rect x="-24" y="-8" width="24" height="5" fill="#1e293b"/>
        <line x1="-20" y1="-2" x2="-20" y2="7" stroke="#d4af37" stroke-width="2.2"/><line x1="20" y1="-2" x2="20" y2="7" stroke="#d4af37" stroke-width="2.2"/>
      </g>
    `;
  });

  // T6-4: 🏯 江南里中式合院 (920px, mainOriginX=0: Left Rosewood Hall 0..416 + Center Moon-Gate Courtyard 416..676 + Octagonal Garden Portal x=672..704 + Right Waterfall Guqin Pavilion 704..920!)
  R.registerHouseArt("jiangnanli", (dp) => {
    const s = skyOf(dp);
    const id = `jn9_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const sky = s.isNight ? ["#0a1224", "#1a2845", "#263a5c"]
      : (s.isDusk ? ["#3b336b", "#d96b43", "#fde68a"] : (s.isDawn ? ["#8ab4e8", "#f5d0d8", "#fef3c7"] : ["#6ca6e8", "#cbe8fc", "#f0f9f4"]));
    const plaster = s.isNight ? "#cbd5e1" : "#ffffff";
    const tile = s.isNight ? "#0f172a" : "#1e293b";
    const wallC = s.isNight ? ["#dfd8ca", "#ccc3b2"] : ["#fcfaf4", "#ebe5d8"];
    const treeM = s.isNight ? "#14532d" : "#15803d";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/></linearGradient>
        <linearGradient id="${id}_wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a1c12"/><stop offset="100%" stop-color="#2e0f09"/></linearGradient>
        <linearGradient id="${id}_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${wallC[0]}"/><stop offset="100%" stop-color="${wallC[1]}"/></linearGradient>
        <clipPath id="${id}_mg"><circle cx="556" cy="104" r="36"/></clipPath>
      </defs>
      <!-- ONE CONTINUOUS 920px Serene Jiangnan Sky -->
      <rect width="920" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight ? `${genStars(180, 906, 28, 91, 68)}${moonCrescent(804, 32, 13, sky[0])}` : `<circle cx="804" cy="${s.isDusk ? 40 : 32}" r="14" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.9"/>`}
      <path d="M180 112 Q320 82 480 104 Q680 76 920 98 V148 H180 Z" fill="${s.isNight ? "#153a34" : "#4ade80"}" opacity="0.52"/>
      <!-- CENTER COURTYARD (416..676): Stepped Horse-Head Wall (马头墙) + Circular Moon Gate (月洞门) -->
      <path d="M416 148 V52 H446 V42 H486 V54 H676 V148 Z" fill="${plaster}" stroke="#94a3b8" stroke-width="0.9"/>
      <path d="M414 52 H448 V40 H488 V52 H678 V45 H492 V34 H442 V46 H414 Z" fill="${tile}"/>
      <g clip-path="url(#${id}_mg)">
        <rect x="518" y="66" width="76" height="76" fill="${s.isNight ? "#162947" : (s.isDusk ? "#f59e0b" : "#bae6fd")}"/>
        <path d="M518 108 Q556 94 594 106 V142 H518 Z" fill="${s.isNight ? "#153a34" : "#86efac"}" opacity="0.65"/>
        <rect x="518" y="114" width="76" height="28" fill="${s.isNight ? "#1e3a5f" : "#38bdf8"}" opacity="0.78"/>
      </g>
      <circle cx="556" cy="104" r="36" fill="none" stroke="${tile}" stroke-width="3.2"/>
      <rect x="536" y="54" width="40" height="11" rx="1.5" fill="#1e293b" stroke="#d4af37" stroke-width="0.9"/>
      <text x="556" y="62" font-size="6.8" font-weight="900" fill="#fde68a" text-anchor="middle">江 南 里</text>
      <!-- Hanging red silk courtyard lantern -->
      <line x1="494" y1="48" x2="494" y2="62" stroke="#d4af37" stroke-width="1.3"/>
      <ellipse cx="494" cy="71" rx="8.5" ry="10.5" fill="#dc2626" stroke="#fbbf24" stroke-width="1.2"/>
      <line x1="494" y1="82" x2="494" y2="92" stroke="#ef4444" stroke-width="1.8"/>
      <!-- ARCHITECTURAL PARTITION: Authentic Jiangnan Octagonal Courtyard Portal Wall (八角洞门 x=672..706)! -->
      <path d="M672 44 H706 V148 H698 V74 L689 62 L680 74 V148 H672 Z" fill="${plaster}" stroke="#94a3b8" stroke-width="1"/>
      <path d="M668 46 L689 34 L710 46 L706 50 L689 40 L672 50 Z" fill="${tile}"/>
      <!-- RIGHT REAR SCHOLAR'S GARDEN (706..920): Sculpted Organic Taihu Rockery Waterfall + Guqin Pavilion! -->
      <path d="M848 148 L854 110 Q866 94 874 76 Q890 62 904 82 Q914 92 920 112 V148 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}" stroke="#334155" stroke-width="1.2"/>
      <path d="M862 148 L870 116 Q884 100 900 118 L912 148 Z" fill="${s.isNight ? "#334155" : "#64748b"}" opacity="0.72"/>
      <ellipse cx="882" cy="82" rx="14" ry="6" fill="${s.isNight ? "#14532d" : "#22c55e"}" opacity="0.82"/>
      <path d="M880 88 Q890 116 882 148" stroke="#7dd3fc" stroke-width="7" fill="none" opacity="0.86" stroke-linecap="round"/>
      <line x1="882" y1="90" x2="882" y2="146" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="6 5" class="h-flow-rev"/>
      <ellipse cx="884" cy="147" rx="16" ry="3.5" fill="#e0f2fe" opacity="0.65" class="h-pulse"/>
      <path d="M736 52 Q800 22 864 52 L852 56 Q800 34 748 56 Z" fill="${tile}" stroke="#d4af37" stroke-width="1.2"/>
      <rect x="754" y="54" width="6" height="94" fill="#7c2d12"/><rect x="840" y="54" width="6" height="94" fill="#7c2d12"/>
      <circle cx="800" cy="56" r="5.5" fill="${lit ? "#fde047" : "#ef4444"}"/>
      <!-- INDOOR ROSEWOOD GRAND HALL (0..416) -->
      <rect x="0" y="0" width="184" height="148" fill="url(#${id}_wall)"/>
      <rect x="376" y="22" width="8" height="126" fill="url(#${id}_wall)"/>
      <rect x="0" y="0" width="416" height="22" fill="url(#${id}_wood)"/>
      <rect x="0" y="22" width="16" height="126" fill="url(#${id}_wood)"/><rect x="172" y="22" width="12" height="126" fill="url(#${id}_wood)"/>
      <!-- 3-Panel Ink Landscape Folding Screen -->
      ${[26, 70, 114].map(x => `<rect x="${x}" y="34" width="42" height="84" fill="${s.isNight ? "#ebe4d5" : "#fffdf7"}" stroke="#5c2d0e" stroke-width="1.8"/>`).join("")}
      <path d="M28 96 Q54 68 88 86 Q116 62 154 88 V116 H28 Z" fill="#64748b" opacity="0.48"/>
      <circle cx="136" cy="52" r="5" fill="#dc2626" opacity="0.8"/>
      <rect x="184" y="22" width="192" height="126" fill="url(#hsGlassSheen)" opacity="0.22" stroke="#4a1c12" stroke-width="2.4"/>
      <line x1="248" y1="22" x2="248" y2="148" stroke="#5c2d0e" stroke-width="1.5"/><line x1="312" y1="22" x2="312" y2="148" stroke="#5c2d0e" stroke-width="1.5"/>
      <rect x="384" y="22" width="32" height="126" fill="none" stroke="#4a1c12" stroke-width="2.4"/>
      <!-- Floors: Gold-Brick Indoor (0..416) + Continuous Courtyard Slate & Winding Koi Stream (416..920) -->
      <rect x="0" y="148" width="416" height="60" fill="${s.isNight ? "#475569" : "#64748b"}"/>
      ${perspFloor(148, 0, 416, "#334155", 0.42, 82)}
      <rect x="416" y="148" width="504" height="60" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
      <path d="M416 184 Q536 164 656 184 Q780 198 920 174 V208 H416 Z" fill="${s.isNight ? "#0369a1" : "#0ea5e9"}" opacity="0.74"/>
      <ellipse cx="526" cy="186" rx="5.5" ry="2" fill="#ef4444" class="h-drift"/>
      <ellipse cx="744" cy="190" rx="5.5" ry="2" fill="#f59e0b" class="h-drift-slow"/>
      <polygon points="532,166 584,166 590,196 526,196" fill="${s.isNight ? "#94a3b8" : "#cbd5e1"}" stroke="#475569" stroke-width="1.2"/>
      <line x1="416" y1="148" x2="416" y2="208" stroke="#d4af37" stroke-width="2.6"/>
      <!-- East Pavilion Guqin Table -->
      <g transform="translate(800, 152)">
        <rect x="-24" y="-12" width="48" height="5" rx="2" fill="#5c2d0e" stroke="#d4af37" stroke-width="0.9"/>
        <line x1="-18" y1="-7" x2="-18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/><line x1="18" y1="-7" x2="18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/>
        <path d="M-20 -13 L20 -13 L16 -17 L-18 -17 Z" fill="#92400e" stroke="#fbbf24" stroke-width="0.7"/>
      </g>
    `;
  });

  // ============================================================
  // PART 5: T7 — 5 CENTERED-HALL 1080px 3-WING WORLD WONDERS (mainOriginX=330)
  //   West Wing (0..330) | Center Grand Sanctuary (330..750) | East Wing (750..1080)
  // ============================================================

  // T7-1: 🌋 熔岩黑曜石堡 (1080px: West Dragonflame Forge | Center Obsidian Cathedral | East Crimson Dragon Altar)
  R.registerHouseArt("obsidian_fortress", (dp) => {
    const s = skyOf(dp);
    const id = `ob4_${s.phase}`;
    const bg = s.isNight ? ["#0e0407", "#360a0d", "#9a3412"]
      : (s.isDusk ? ["#3b0764", "#c2410c", "#fbbf24"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fdba74"] : ["#38bdf8", "#bae6fd", "#fed7aa"]));
    const stone = s.isNight ? "#18141c" : (s.isDusk ? "#2d1b24" : "#57534e");
    const flr = s.isNight ? "#16141a" : (s.isDusk ? "#292226" : "#a8a29e");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="56%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient>
      </defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? genStars(20, 1060, 32, 71, 84) : `<circle cx="540" cy="${s.isDusk ? 48 : 38}" r="22" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.9"/>`}
      <!-- Sweeping volcanic mountain range + Glowing Magma Fissures + Smoking Caldera -->
      <path d="M0 148 L74 84 L154 126 L246 66 L342 118 L442 64 L540 108 L646 58 L754 118 L864 66 L970 120 L1080 78 V148 Z" fill="${s.isNight ? "#1c0d10" : "#574742"}" opacity="0.88"/>
      <path d="M246 72 L264 112 L252 146 M646 64 L630 104 L644 146 M864 72 L884 114 L870 146" fill="none" stroke="#f97316" stroke-width="2.2" opacity="0.72" stroke-linecap="round"/>
      <path d="M108 148 L156 62 L200 62 L248 148 Z" fill="${s.isNight ? "#14090c" : "#443632"}" stroke="#7c2d12" stroke-width="1"/>
      <ellipse cx="178" cy="62" rx="22" ry="6" fill="#f97316" class="h-pulse"/>
      <!-- Four dramatic molten lava waterfalls -->
      ${[54, 376, 682, 994].map(lx => `
        <rect x="${lx}" y="26" width="22" height="122" fill="#ea580c" opacity="0.9"/>
        <line x1="${lx + 11}" y1="26" x2="${lx + 11}" y2="148" stroke="#fef08a" stroke-width="4.5" stroke-dasharray="14 8" class="h-flow-rev"/>
      `).join("")}
      <!-- Gothic Basalt Vaulted Cathedral Arches + Hanging Iron Dragonfire Braziers + Monumental Wing Colonnades -->
      <path d="M0 0 H1080 V38 Q945 8 810 38 Q675 8 540 38 Q405 8 270 38 Q135 8 0 38 Z" fill="${stone}" stroke="#f59e0b" stroke-width="1.6"/>
      ${[124, 444, 636, 832].map(bx => `
        <line x1="${bx}" y1="20" x2="${bx}" y2="48" stroke="#78350f" stroke-width="1.6"/>
        <path d="M${bx - 12} 48 L${bx + 12} 48 L${bx + 7} 56 L${bx - 7} 56 Z" fill="#27272a" stroke="#f59e0b" stroke-width="1"/>
        <path d="M${bx - 7} 48 Q${bx} 34 ${bx + 7} 48 Z" fill="#f97316" class="h-pulse"/>
        <circle cx="${bx}" cy="44" r="14" fill="#f97316" opacity="0.16"/>
      `).join("")}
      ${[16, 318, 740, 1042].map(cx => `
        <rect x="${cx}" y="22" width="22" height="126" fill="${stone}" stroke="#f59e0b" stroke-width="1.3"/>
        <line x1="${cx + 11}" y1="36" x2="${cx + 11}" y2="136" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="6 6" class="h-pulse"/>
      `).join("")}
      <!-- West Wing: Dragonflame Rune Anvil Forge (x=176) -->
      <g transform="translate(176, 142)">
        <ellipse cx="0" cy="4" rx="46" ry="8" fill="#f97316" opacity="0.3"/>
        <polygon points="-36,4 -28,-16 28,-16 36,4" fill="#27272a" stroke="#f59e0b" stroke-width="1.4"/>
        <path d="M-20 -16 L-26 -30 H26 L18 -16 Z" fill="#18181b" stroke="#fbbf24" stroke-width="1.4"/>
      </g>
      <!-- East Wing: Molten Obsidian Dragon Altar Spire + Carved Dragon-Wing Crest (x=910) -->
      <g transform="translate(910, 146)">
        <path d="M-64 -42 Q-46 -78 -14 -56 M64 -42 Q46 -78 14 -56" fill="none" stroke="url(#hsGoldH)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M-54 -28 Q-36 -56 -18 -40 M54 -28 Q36 -56 18 -40" fill="none" stroke="#f97316" stroke-width="1.8" stroke-linecap="round"/>
        <polygon points="-38,0 -26,-52 0,-74 26,-52 38,0" fill="#18121e" stroke="url(#hsGoldH)" stroke-width="1.8"/>
        <circle cx="0" cy="-38" r="14" fill="#ea580c" stroke="#fef08a" stroke-width="1.8" class="h-pulse"/>
      </g>
      <!-- Glowing Obsidian Floor with Magma Veins -->
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, "#f97316", 0.28, 72)}
      <path d="M40 172 L130 182 L210 168 M470 178 L580 166 L690 184 M820 170 L940 186 L1040 168" fill="none" stroke="#f97316" stroke-width="1.4" opacity="0.62"/>
      <line x1="0" y1="148" x2="1080" y2="148" stroke="#f97316" stroke-width="2.6"/>
    `;
  });

  // T7-2: 🏛️ 海底水晶神殿 (1080px: West Conch Corridor | Center Pearl Crystal Cathedral | East Poseidon Trident Sanctum)
  R.registerHouseArt("atlantis", (dp) => {
    const s = skyOf(dp);
    const id = `at4_${s.phase}`;
    const sea = s.isNight ? ["#031e36", "#054a75", "#042238"]
      : (s.isDusk ? ["#1e3a5f", "#0e7490", "#b45309"] : (s.isDawn ? ["#0284c7", "#38bdf8", "#fbcfe8"] : ["#0284c7", "#38bdf8", "#7dd3fc"]));
    const flr = s.isNight ? "#0d354d" : (s.isDusk ? "#1e4b63" : "#bae6fd");
    return `
      <defs>
        <linearGradient id="${id}_sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sea[0]}"/><stop offset="52%" stop-color="${sea[1]}"/><stop offset="100%" stop-color="${sea[2]}"/></linearGradient>
        <linearGradient id="${id}_ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0f2fe" stop-opacity="${s.isNight ? "0.22" : "0.46"}"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="1080" height="208" fill="url(#${id}_sea)"/>
      <g class="h-aurora">
        <polygon points="80,0 140,0 84,148 34,148" fill="url(#${id}_ray)"/>
        <polygon points="390,0 470,0 414,148 340,148" fill="url(#${id}_ray)"/>
        <polygon points="620,0 700,0 644,148 570,148" fill="url(#${id}_ray)"/>
        <polygon points="900,0 976,0 924,148 854,148" fill="url(#${id}_ray)"/>
      </g>
      <path d="M0 148 Q160 118 320 138 Q540 104 760 136 Q930 112 1080 134 V148 Z" fill="${s.isNight ? "#062c44" : "#0369a1"}" opacity="0.6"/>
      <!-- Lush Bioluminescent Coral Gardens & Golden Fish Schools behind the Crystal Arches -->
      ${[[82,146,"#f472b6"],[268,146,"#34d399"],[442,146,"#fb7185"],[646,146,"#38bdf8"],[806,146,"#a855f7"],[998,146,"#f472b6"]].map(([cx, cy, col]) => `
        <path d="M${cx} ${cy} Q${cx - 10} ${cy - 18} ${cx - 16} ${cy - 28} M${cx} ${cy} Q${cx} ${cy - 22} ${cx + 2} ${cy - 34} M${cx} ${cy} Q${cx + 10} ${cy - 18} ${cx + 15} ${cy - 26}" stroke="${col}" stroke-width="3.6" fill="none" stroke-linecap="round" opacity="0.72"/>
      `).join("")}
      <g class="h-drift" opacity="0.72" fill="#fde047">
        ${[[140,86],[154,82],[166,90],[782,66],[796,62],[808,70]].map(([fx, fy]) => `<ellipse cx="${fx}" cy="${fy}" rx="4.5" ry="2"/><polygon points="${fx - 4.5},${fy} ${fx - 8},${fy - 2.4} ${fx - 8},${fy + 2.4}"/>`).join("")}
      </g>
      <!-- Gliding Manta Ray & Properly Nested Floating Jellyfish -->
      <path d="M210 56 Q242 40 278 52 Q254 64 248 76 Q238 62 210 56 Z" fill="${s.isNight ? "#0c4a6e" : "#0284c7"}" opacity="0.72" class="h-drift-slow"/>
      <g transform="translate(680, 46)"><g class="h-float-slow">
        <path d="M-16 0 A16 12 0 0 1 16 0 Q0 4 -16 0 Z" fill="#38bdf8" opacity="0.82"/>
        <path d="M-10 2 Q-12 14 -8 24 M0 3 Q2 16 -2 28 M10 2 Q13 14 9 24" stroke="#bae6fd" stroke-width="1.1" fill="none"/>
      </g></g>
      <g transform="translate(410, 58)"><g class="h-float">
        <path d="M-14 0 A14 11 0 0 1 14 0 Q0 4 -14 0 Z" fill="#f472b6" opacity="0.82"/>
        <path d="M-8 1 Q-10 10 -6 20 M0 2 Q2 12 -1 24 M8 1 Q11 10 7 20" stroke="#fbcfe8" stroke-width="1.1" fill="none"/>
      </g></g>
      <!-- Three Grand Faceted Crystal Cathedral Domes! -->
      ${[170, 540, 910].map(cx => `
        <path d="M${cx - 154} 148 V72 A154 74 0 0 1 ${cx + 154} 72 V148" fill="none" stroke="${s.isNight ? "#7dd3fc" : "#ffffff"}" stroke-width="2.4" opacity="0.72"/>
        <path d="M${cx - 130} 148 V78 A130 60 0 0 1 ${cx + 130} 78 V148" fill="none" stroke="#e0f2fe" stroke-width="1.1" opacity="0.46"/>
      `).join("")}
      <!-- Fluted Pearl-Marble Corinthian Columns dividing West / Center / East Wings -->
      ${[16, 320, 740, 1044].map(cx => `
        <rect x="${cx}" y="44" width="20" height="104" rx="2" fill="url(#hsIvory)" opacity="${s.isNight ? "0.85" : "0.95"}"/>
        <line x1="${cx + 6}" y1="48" x2="${cx + 6}" y2="144" stroke="#94a3b8" stroke-width="0.9"/>
        <line x1="${cx + 14}" y1="48" x2="${cx + 14}" y2="144" stroke="#94a3b8" stroke-width="0.9"/>
        <rect x="${cx - 4}" y="39" width="28" height="6.5" rx="2" fill="url(#hsGoldH)"/>
      `).join("")}
      <!-- East Wing: Poseidon Trident Sanctuary Pedestal (x=910) -->
      <g transform="translate(910, 146)">
        <rect x="-34" y="-12" width="68" height="12" rx="3" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.4"/>
        <line x1="0" y1="-12" x2="0" y2="-76" stroke="url(#hsGoldV)" stroke-width="3.2"/>
        <path d="M-16 -62 Q-16 -46 0 -46 Q16 -46 16 -62" fill="none" stroke="url(#hsGoldH)" stroke-width="2.6"/>
        <polygon points="0,-86 -4,-74 4,-74" fill="#fef08a"/>
        <polygon points="-16,-70 -20,-58 -12,-58" fill="#fef08a"/><polygon points="16,-70 12,-58 20,-58" fill="#fef08a"/>
      </g>
      ${[88, 280, 480, 620, 810, 990].map((bx, i) => `<circle cx="${bx}" cy="${62 + (i % 3) * 18}" r="${2.5 + (i % 3)}" fill="none" stroke="#e0f2fe" stroke-width="1.1" class="${i % 2 ? "h-steam" : "h-steam-d1"}"/>`).join("")}
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#38bdf8" : "#ffffff", 0.34, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="${s.isNight ? "#38bdf8" : "#ffffff"}" stroke-width="2.4"/>
    `;
  });

  // T7-3: ☁️ 天空之城浮岛宫 (1080px: West Rainbow Prism Terrace | Center Ivory Sky Hall | East Airship Mooring Spire)
  R.registerHouseArt("sky_castle", (dp) => {
    const s = skyOf(dp);
    const id = `sc4_${s.phase}`;
    const bg = s.isNight ? ["#080d22", "#1e1b4b", "#312e81"]
      : (s.isDusk ? ["#4338ca", "#f472b6", "#fde68a"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fef9c3"] : ["#0284c7", "#7dd3fc", "#fffbeb"]));
    const cl1 = s.isNight ? "#475569" : (s.isDusk ? "#fbcfe8" : "#ffffff");
    const cl2 = s.isNight ? "#334155" : (s.isDusk ? "#fed7aa" : "#fffbeb");
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? `${genStars(20, 1060, 36, 82, 90)}${moonCrescent(890, 38, 16, bg[0])}` : `<circle cx="890" cy="${s.isDusk ? 46 : 36}" r="18" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92"/>`}
      <path d="M320 148 A220 124 0 0 1 760 148" fill="none" stroke="url(#hsPrism)" stroke-width="10" opacity="${s.isNight ? "0.24" : "0.48"}"/>
      <!-- Properly Nested Floating Sky Islands with Cascading Sky-Waterfalls! -->
      ${[[190, 66, 0.95], [540, 54, 1.18], [886, 68, 0.92]].map(([ix, iy, sc]) => `
        <g transform="translate(${ix}, ${iy}) scale(${sc})"><g class="h-float-slow">
          <path d="M-42 14 L-18 36 L0 44 L18 34 L42 14 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}" stroke="#cbd5e1" stroke-width="0.9"/>
          <path d="M-42 14 Q0 6 42 14 Q18 20 -42 14 Z" fill="${s.isNight ? "#15803d" : "#4ade80"}"/>
          <path d="M12 16 Q16 38 14 68" stroke="#7dd3fc" stroke-width="4" fill="none" opacity="0.72" stroke-dasharray="6 4" class="h-flow-rev"/>
          <rect x="-28" y="-8" width="56" height="22" fill="${s.isNight ? "#cbd5e1" : "url(#hsIvory)"}" stroke="url(#hsGoldH)" stroke-width="1"/>
          <polygon points="-26,-8 -18,-26 -10,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/>
          <polygon points="10,-8 18,-26 26,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/>
          <polygon points="-9,-8 0,-36 9,-8" fill="#fbbf24" stroke="#fffbeb" stroke-width="0.8"/>
        </g></g>
      `).join("")}
      <!-- Multi-Puff Billowing Cumulus Cloud Sea with Golden Sunlight Rims -->
      <g class="h-drift-slow" opacity="${s.isNight ? "0.78" : "0.96"}">
        ${[50, 140, 240, 350, 460, 570, 680, 790, 900, 1010].map((cx, i) => `
          <ellipse cx="${cx}" cy="${134 + (i % 2) * 8}" rx="${64 + (i % 3) * 16}" ry="${20 + (i % 2) * 6}" fill="${i % 2 ? cl2 : cl1}"/>
          <ellipse cx="${cx - 24}" cy="${124 + (i % 2) * 6}" rx="${32 + (i % 2) * 10}" ry="14" fill="${cl1}" stroke="#fef08a" stroke-width="0.6" stroke-opacity="0.45"/>
        `).join("")}
      </g>
      <!-- Grand Ivory Sky-Palace Colonnade & Winged Classical Balustrades -->
      <path d="M320 0 H760 V24 Q540 6 320 24 Z" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      ${[16, 322, 740, 1044].map(cx => `
        <rect x="${cx}" y="20" width="18" height="128" fill="${flr}" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="${cx - 4}" y="20" width="26" height="7" rx="2" fill="url(#hsGoldH)"/>
      `).join("")}
      <line x1="34" y1="126" x2="322" y2="126" stroke="url(#hsGoldH)" stroke-width="3"/>
      <line x1="758" y1="126" x2="1044" y2="126" stroke="url(#hsGoldH)" stroke-width="3"/>
      ${[74, 124, 234, 284, 796, 846, 964, 1014].map(bx => `<rect x="${bx}" y="128" width="5" height="20" rx="2" fill="${flr}" stroke="#d4af37" stroke-width="0.6"/>`).join("")}
      <!-- East Mooring Crystal Spire (x=910) -->
      <g transform="translate(910, 146)">
        <polygon points="-24,0 -12,-70 0,-86 12,-70 24,0" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
        <circle cx="0" cy="-94" r="9" fill="#38bdf8" stroke="#fef08a" stroke-width="1.6" class="h-pulse"/>
      </g>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#64748b" : "#d4af37", 0.25, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6"/>
    `;
  });

  // T7-4: ❄️ 极光冰晶宫殿 (1080px: West Aurora Prism | Center Arctic Mirror Cathedral | East Crystal Wind-Chime Shrine)
  R.registerHouseArt("aurora_ice_palace", (dp) => {
    const s = skyOf(dp);
    const id = `ai4_${s.phase}`;
    const bg = s.isNight ? ["#030f22", "#0a2d54", "#19527a"]
      : (s.isDusk ? ["#312e81", "#7e22ce", "#fbcfe8"] : (s.isDawn ? ["#38bdf8", "#bae6fd", "#fce7f3"] : ["#0ea5e9", "#7dd3fc", "#f0f9ff"]));
    const mtn = s.isNight ? "#0f3a60" : (s.isDusk ? "#4c1d95" : "#7dd3fc");
    const flr = s.isNight ? "#0e3a5c" : (s.isDusk ? "#3b2f63" : "#bae6fd");
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight || s.isDusk ? genStars(16, 1064, 34, 91, 82) : `<circle cx="540" cy="46" r="24" fill="#ffffff" opacity="0.82"/><circle cx="540" cy="46" r="46" fill="none" stroke="#e0f2fe" stroke-width="1.6" opacity="0.68"/>`}
      <!-- Multi-layered Jagged Nordic Fjord Peaks with Snowy Ridges -->
      <path d="M0 148 L80 88 L160 128 L260 72 L370 124 L490 64 L610 122 L730 70 L850 126 L960 78 L1080 148 Z" fill="${mtn}" opacity="0.86"/>
      <path d="M80 88 L98 112 L68 106 Z M260 72 L284 102 L244 96 Z M490 64 L516 98 L470 92 Z M730 70 L754 100 L714 94 Z M960 78 L982 106 L944 100 Z" fill="#e0f2fe" opacity="0.45"/>
      <!-- Sweeping Gothic Ice-Crystal Cathedral Arches + Hanging Crystal Stalactite Icicles -->
      ${[0, 330, 750].map((ox, idx) => {
        const ww = idx === 1 ? 420 : 330;
        return `<path d="M${ox} 0 H${ox + ww} V38 Q${ox + ww * 0.75} 6 ${ox + ww * 0.5} 48 Q${ox + ww * 0.25} 6 ${ox} 38 Z" fill="${s.isNight ? "#7dd3fc" : "#ffffff"}" fill-opacity="${s.isNight ? "0.24" : "0.42"}" stroke="#e0f2fe" stroke-width="1.5"/>
          <path d="M${ox + 34} 24 L${ox + 38} 52 L${ox + 42} 22 M${ox + ww - 42} 22 L${ox + ww - 38} 54 L${ox + ww - 34} 24" fill="#e0f2fe" fill-opacity="0.56"/>`;
      }).join("")}
      ${[16, 322, 742, 1048].map(cx => `
        <polygon points="${cx},34 ${cx + 7},20 ${cx + 14},34 ${cx + 14},148 ${cx},148" fill="${s.isNight ? "#7dd3fc" : "#ffffff"}" fill-opacity="0.34" stroke="#bae6fd" stroke-width="1.2"/>
        <line x1="${cx + 7}" y1="32" x2="${cx + 7}" y2="144" stroke="#ffffff" stroke-width="1" opacity="0.55"/>
      `).join("")}
      <!-- Properly Nested Floating Crystal Wind-Chime Prism (x=906) -->
      <g transform="translate(906, 78)"><g class="h-float">
        <polygon points="0,-34 18,0 0,34 -18,0" fill="#e0f2fe" fill-opacity="0.58" stroke="#ffffff" stroke-width="1.6"/>
        <line x1="0" y1="-34" x2="0" y2="34" stroke="#38bdf8" stroke-width="1.2"/>
      </g></g>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      <rect x="0" y="148" width="1080" height="60" fill="url(#hsGlassSheen)" opacity="0.5"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#bae6fd" : "#ffffff", 0.36, 72)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="${s.isNight ? "#7dd3fc" : "#ffffff"}" stroke-width="2.4"/>
    `;
  });

  // T7-5: 🏺 空中花园黄金阁 (1080px: West Life Aqueduct | Center Terraced Hanging Pavilion | East Golden Butterfly Dome)
  R.registerHouseArt("hanging_gardens", (dp) => {
    const s = skyOf(dp);
    const id = `hg4_${s.phase}`;
    const bg = s.isNight ? ["#090f24", "#1e293b", "#312e81"]
      : (s.isDusk ? ["#7c2d12", "#f97316", "#fde68a"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fef3c7"] : ["#0ea5e9", "#bae6fd", "#fef3c7"]));
    const ter = s.isNight ? "#94a3b8" : "#f3ead8";
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    const vine = s.isNight ? "#14532d" : "#22c55e";
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? `${genStars(20, 1060, 34, 101, 82)}${moonCrescent(860, 38, 15, bg[0])}` : `<circle cx="860" cy="${s.isDusk ? 46 : 36}" r="16" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92"/>`}
      <!-- Three Sculpted Arched Babylonian Sandstone Ziggurat Terraces with Lush Hanging Gardens & Turquoise Waterfalls! -->
      ${[176, 540, 906].map((cx, i) => {
        const dy = i * 4;
        const sand1 = s.isNight ? "#6e5a44" : "#e8d5b5";
        const sand2 = s.isNight ? "#8a7358" : "#f6e9cf";
        const archIn = s.isNight ? "#1e293b" : "#8c6d46";
        return `
          <!-- Lower Arched Sandstone Colonnade -->
          <rect x="${cx - 102}" y="${94 - dy}" width="204" height="${54 + dy}" rx="2" fill="${sand1}" stroke="#d4af37" stroke-width="1.3"/>
          ${[-74, -42, 42, 74].map(ax => `<path d="M${cx + ax - 11} 148 V${114 - dy} A11 10 0 0 1 ${cx + ax + 11} ${114 - dy} V148 Z" fill="${archIn}" opacity="0.72"/>`).join("")}
          <!-- Upper Arched Pavilion Tier -->
          <rect x="${cx - 66}" y="${60 - dy}" width="132" height="34" rx="2" fill="${sand2}" stroke="#d4af37" stroke-width="1.3"/>
          ${[-42, 42].map(ax => `<path d="M${cx + ax - 9} ${94 - dy} V${74 - dy} A9 8 0 0 1 ${cx + ax + 9} ${74 - dy} V${94 - dy} Z" fill="${archIn}" opacity="0.68"/>`).join("")}
          <!-- Golden Date Palms & Cascading Floral Bushes spilling over every terrace edge! -->
          ${[-92, -52, 52, 92].map((bx, bi) => `
            <ellipse cx="${cx + bx}" cy="${94 - dy}" rx="18" ry="8" fill="${bi % 2 ? "#15803d" : vine}"/>
            <circle cx="${cx + bx - 5}" cy="${92 - dy}" r="3.2" fill="${bi % 2 ? "#f472b6" : "#fde047"}"/>
            <circle cx="${cx + bx + 6}" cy="${95 - dy}" r="2.8" fill="#fb7185"/>
          `).join("")}
          ${[-56, 56].map(bx => `<ellipse cx="${cx + bx}" cy="${60 - dy}" rx="15" ry="7" fill="${vine}"/><circle cx="${cx + bx}" cy="${58 - dy}" r="3" fill="#f472b6"/>`).join("")}
          <!-- Shimmering Turquoise Cascading Waterfall + White Spray Mist -->
          <path d="M${cx - 15} ${62 - dy} Q${cx - 18} 106 ${cx - 14} 148 H${cx + 14} Q${cx + 18} 106 ${cx + 15} ${62 - dy} Z" fill="${s.isNight ? "#0284c7" : "#38bdf8"}" opacity="0.86"/>
          <line x1="${cx - 4}" y1="${64 - dy}" x2="${cx - 4}" y2="146" stroke="#e0f2fe" stroke-width="3" stroke-dasharray="10 6" class="h-flow-rev"/>
          <line x1="${cx + 5}" y1="${70 - dy}" x2="${cx + 5}" y2="146" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 7" class="h-flow-rev"/>
          <ellipse cx="${cx}" cy="147" rx="26" ry="5" fill="#e0f2fe" opacity="0.62" class="h-pulse"/>
        `;
      }).join("")}
      <!-- Grand Ivory-Gold Colonnade + Hanging Vine Curtains -->
      <rect x="0" y="0" width="1080" height="24" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      ${[16, 320, 740, 1042].map(px => `<rect x="${px}" y="24" width="22" height="124" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.4"/>`).join("")}
      <g stroke="${s.isNight ? "#052e16" : "#15803d"}" stroke-width="2.6" fill="none" class="h-drift-slow">
        ${[76, 266, 396, 684, 814, 1004].map(vx => `<path d="M${vx} 24 Q${vx - 8} 66 ${vx + 6} 102 Q${vx} 122 ${vx + 8} 138"/>`).join("")}
      </g>
      <g fill="${vine}">
        ${[78, 268, 398, 686, 816, 1006].map(vx => `<circle cx="${vx}" cy="58" r="6"/><circle cx="${vx + 4}" cy="92" r="5.5"/>`).join("")}
      </g>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#64748b" : "#d4af37", 0.26, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6"/>
    `;
  });

  // ============================================================
  // PART 6: T8 — 5 CENTERED-HALL 1240px INTERSTELLAR PANORAMAS (mainOriginX=410)
  //   West Module (0..410) | Center Observation Hall (410..830) | East Module (830..1240)
  // ============================================================

  // T8-1: 🌕 月球静海科研舱 (1240px)
  R.registerHouseArt("lunar_base", (dp) => {
    const s = skyOf(dp);
    const id = `lb5_${s.phase}`;
    const sky = s.isNight ? ["#030612", "#091026"] : (s.isDusk ? ["#17143b", "#4c1d95"] : ["#0f2557", "#3b82f6"]);
    const surf = s.isNight ? "#475569" : (s.isDusk ? "#78716c" : "#e2e8f0");
    const crat = s.isNight ? "#334155" : (s.isDusk ? "#57534e" : "#cbd5e1");
    const flr = s.isNight ? "#1e293b" : (s.isDusk ? "#475569" : "#f1f5f9");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="100%" stop-color="${sky[1]}"/></linearGradient>
        <radialGradient id="${id}_earth" cx="38%" cy="35%" r="65%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="55%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#0f172a"/></radialGradient>
        <linearGradient id="${id}_sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="url(#${id}_sky)"/>
      <ellipse cx="480" cy="48" rx="140" ry="30" transform="rotate(-10 480 48)" fill="#7c3aed" opacity="0.2"/>
      <ellipse cx="940" cy="52" rx="150" ry="32" transform="rotate(8 940 52)" fill="#06b6d4" opacity="0.16"/>
      ${genStars(12, 1228, 68, 111, 108)}
      <!-- Planet 1: Grand Blue Earthrise in West-Center Sky (x=280, y=54) — Properly Nested! -->
      <g transform="translate(280, 54)"><g class="h-float-slow">
        <circle cx="0" cy="0" r="39" fill="#38bdf8" opacity="0.2"/>
        <circle cx="0" cy="0" r="31" fill="url(#${id}_earth)" stroke="#93c5fd" stroke-width="1.3"/>
        <path d="M-18 -10 Q-2 -22 12 -8 Q20 2 6 16 Q-10 20 -16 6 Z" fill="#22c55e" opacity="0.78"/>
        <path d="M-25 3 Q0 -8 25 5" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.76" stroke-linecap="round"/>
      </g></g>
      <!-- Planet 2: Ringed Saturn in Center Sky (x=660, y=50) -->
      <g transform="translate(660, 50)"><g class="h-float">
        <ellipse cx="0" cy="0" rx="44" ry="10" transform="rotate(-16)" fill="none" stroke="#fde68a" stroke-width="3.2" opacity="0.78"/>
        <circle cx="0" cy="0" r="19" fill="url(#${id}_sat)"/>
        <path d="M-42 12 A44 10 -16 0 0 42 -12" fill="none" stroke="#fef3c7" stroke-width="2.8" opacity="0.9"/>
      </g></g>
      <!-- Planet 3: Swirling Jupiter in East Sky (x=990, y=56) -->
      <g transform="translate(990, 56)"><g class="h-float-slow">
        <circle cx="0" cy="0" r="24" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
        <path d="M-22 -6 Q0 -11 22 -5 M-23 4 Q0 0 23 5 M-19 12 Q0 9 19 13" stroke="#fef3c7" stroke-width="2.4" fill="none" opacity="0.62"/>
        <ellipse cx="7" cy="6" rx="5.5" ry="3.2" fill="#dc2626" opacity="0.82"/>
      </g></g>
      <!-- Lunar Tranquility Surface & Craters across 1240px -->
      <path d="M0 116 Q160 100 320 118 Q520 128 720 108 Q960 124 1240 104 V148 H0 Z" fill="${surf}"/>
      ${[96, 360, 560, 810, 1080].map((cx, i) => `<ellipse cx="${cx}" cy="${128 + (i % 2) * 5}" rx="${26 + (i % 3) * 8}" ry="7.5" fill="${crat}" stroke="#94a3b8" stroke-width="0.9"/>`).join("")}
      <!-- Triple Geodesic Domes + Pressurized Airlock Bulkheads at x=402 & x=824 -->
      ${[0, 410, 830].map((ox, i) => {
        const ww = i === 1 ? 420 : 410;
        return `<path d="M${ox} 148 Q${ox + ww * 0.5} -14 ${ox + ww} 148" fill="none" stroke="${s.isNight ? "#94a3b8" : "#ffffff"}" stroke-width="2.8" opacity="0.68"/>`;
      }).join("")}
      ${[402, 822].map(bx => `<rect x="${bx}" y="18" width="16" height="130" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/><line x1="${bx + 8}" y1="28" x2="${bx + 8}" y2="140" stroke="#38bdf8" stroke-width="1.4" opacity="0.72"/>`).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.25, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4"/>
    `;
  });

  // T8-2: 🚀 太空火箭舱 (1240px: West Warp Bridge | Center Panoramic Galaxy Observatory | East Engine Bay)
  R.registerHouseArt("rocket", (dp) => {
    const s = skyOf(dp);
    const id = `rk5_${s.phase}`;
    const hull = s.isNight ? "#1e293b" : (s.isDusk ? "#475569" : "#cbd5e1");
    const deck = s.isNight ? "#0c1322" : (s.isDusk ? "#263147" : "#cbd5e1");
    return `
      <defs>
        <linearGradient id="${id}_sp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#020617"/><stop offset="50%" stop-color="${s.isNight ? "#1e1b4b" : "#0c2d57"}"/><stop offset="100%" stop-color="#090d1f"/></linearGradient>
        <linearGradient id="${id}_sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="${hull}"/>
      <rect x="24" y="14" width="1192" height="128" rx="18" fill="url(#${id}_sp)" stroke="#38bdf8" stroke-width="2"/>
      ${genStars(32, 1208, 74, 123, 128)}
      <ellipse cx="320" cy="64" rx="110" ry="26" transform="rotate(-16 320 64)" fill="#a855f7" opacity="0.22"/>
      <ellipse cx="860" cy="72" rx="130" ry="28" transform="rotate(12 860 72)" fill="#0ea5e9" opacity="0.2"/>
      <!-- Properly Nested Saturn & Rotating Spiral Galaxy -->
      <g transform="translate(310, 74)"><g class="h-float-slow">
        <ellipse cx="0" cy="0" rx="48" ry="11" transform="rotate(-18)" fill="none" stroke="#fde68a" stroke-width="3.2" opacity="0.82"/>
        <circle cx="0" cy="0" r="22" fill="url(#${id}_sat)"/>
        <path d="M-46 14 A48 11 -18 0 0 46 -14" fill="none" stroke="#fef3c7" stroke-width="2.6" opacity="0.9"/>
      </g></g>
      <g transform="translate(740, 72)" opacity="0.76"><g class="h-spin-slow">
        <ellipse cx="0" cy="0" rx="68" ry="22" transform="rotate(-14)" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="6"/>
        <circle cx="0" cy="0" r="10" fill="#fffbeb"/>
      </g></g>
      <!-- Pressurized Starship Bulkhead Ribs framing West / Center / East -->
      ${[402, 822].map(rx => `
        <rect x="${rx}" y="14" width="18" height="128" fill="${hull}" stroke="#64748b" stroke-width="1.4"/>
        <line x1="${rx + 9}" y1="22" x2="${rx + 9}" y2="136" stroke="#38bdf8" stroke-width="1.4" opacity="0.72"/>
      `).join("")}
      <!-- West Bridge Flight Telemetry Screen -->
      <rect x="44" y="42" width="118" height="58" rx="7" fill="#081222" stroke="#38bdf8" stroke-width="1.4"/>
      <text x="150" y="57" font-size="6.5" font-family="monospace" font-weight="800" fill="#7dd3fc" text-anchor="end">WARP 9.9</text>
      <path d="M56 78 L72 68 L88 82 L106 66 L124 78 L146 70" fill="none" stroke="#22d3ee" stroke-width="1.7" stroke-dasharray="6 3" class="h-flow"/>
      <!-- East Bay Glowing Warp Reactor Column (x=1130) -->
      <g transform="translate(1130, 78)">
        <rect x="-18" y="-62" width="36" height="124" fill="#0f172a" stroke="#38bdf8" stroke-width="1.6"/>
        <rect x="-8" y="-56" width="16" height="112" fill="#38bdf8" opacity="0.74" class="h-pulse"/>
        <line x1="-18" y1="-26" x2="18" y2="-26" stroke="#f59e0b" stroke-width="2.2"/>
        <line x1="-18" y1="26" x2="18" y2="26" stroke="#f59e0b" stroke-width="2.2"/>
      </g>
      <rect x="0" y="148" width="1240" height="60" fill="${deck}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.25, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4"/>
    `;
  });

  // T8-3: 🛰️ 火星红岩生态穹顶 (1240px: West Hydroponics Bio-Lab | Center Valles Marineris Dome | East Ingenuity Helipad)
  R.registerHouseArt("mars_dome", (dp) => {
    const s = skyOf(dp);
    const id = `md5_${s.phase}`;
    const sky = s.isNight ? ["#0a0714", "#280f14", "#5c1d14"] : (s.isDusk ? ["#2c1028", "#9a3412", "#7dd3fc"] : ["#c2410c", "#fb923c", "#ffedd5"]);
    const m1 = s.isNight ? "#431407" : "#b45309";
    const m2 = s.isNight ? "#5c200c" : "#ea580c";
    const flr = s.isNight ? "#27272a" : "#e7e5e4";
    return `
      <defs><linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/></linearGradient></defs>
      <rect width="1240" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight || s.isDusk ? `${genStars(20, 1220, 54, 134, 86)}<circle cx="620" cy="40" r="11" fill="#cbd5e1" opacity="0.9"/><circle cx="584" cy="30" r="5" fill="#94a3b8" opacity="0.82"/>`
      : `<circle cx="620" cy="40" r="16" fill="#fffbeb" opacity="0.92"/>`}
      <path d="M0 112 L90 78 L180 108 L290 72 L420 112 L540 68 L670 114 L810 74 L940 110 L1080 76 L1240 102 V148 H0 Z" fill="${m1}"/>
      <path d="M0 130 Q260 114 540 130 Q840 116 1240 126 V148 H0 Z" fill="${m2}"/>
      <!-- Triple Pressurized Mars Geodesic Domes + Airlock Rib Arches at x=404 & x=824 -->
      ${[0, 410, 830].map((ox, i) => {
        const ww = i === 1 ? 420 : 410;
        return `<path d="M${ox} 148 C${ox + 36} 12 ${ox + ww - 36} 12 ${ox + ww} 148" fill="url(#hsGlassSheen)" opacity="0.18" stroke="#f8fafc" stroke-width="2.6"/>`;
      }).join("")}
      ${[404, 822].map(bx => `<rect x="${bx}" y="22" width="14" height="126" fill="#3f3f46" stroke="#fb923c" stroke-width="1.2"/>`).join("")}
      <!-- East Helipad Markings (x=1042) -->
      <ellipse cx="1042" cy="144" rx="44" ry="8" fill="#18181b" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="8 4"/>
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#fb923c", 0.28, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#fb923c" stroke-width="2.4"/>
    `;
  });

  // T8-4: 🪐 土星冰环观景站 (1240px: West Ice-Harvester Bay | Center Cassini Ring Gallery | East Orbital Zero-G Gate)
  R.registerHouseArt("saturn_ring_station", (dp) => {
    const s = skyOf(dp);
    const id = `sr5_${s.phase}`;
    const bg = s.isNight ? ["#040714", "#1b1745", "#2e2870"] : (s.isDusk ? ["#312e81", "#7c2d6e", "#f59e0b"] : ["#0284c7", "#7dd3fc", "#fef3c7"]);
    const deck = s.isNight ? "#162033" : (s.isDusk ? "#334155" : "#e2e8f0");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="60%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient>
        <linearGradient id="${id}_pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffbeb"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="url(#${id}_bg)"/>
      ${genStars(16, 1224, 68, 145, 118)}
      <!-- Colossal Banded Saturn + Wide Grazing Cassini Ice Rings & Orbiting Diamond Ice Boulders -->
      <ellipse cx="620" cy="68" rx="420" ry="34" transform="rotate(-7 620 68)" fill="none" stroke="#e0f2fe" stroke-width="14" opacity="0.42"/>
      <ellipse cx="620" cy="68" rx="368" ry="26" transform="rotate(-7 620 68)" fill="none" stroke="#fde68a" stroke-width="5" opacity="0.52"/>
      <circle cx="620" cy="68" r="46" fill="url(#${id}_pl)" stroke="#fef3c7" stroke-width="1"/>
      <path d="M578 58 Q620 64 662 54 M576 74 Q620 82 664 70 M584 88 Q620 94 656 84" stroke="#92400e" stroke-width="2.8" fill="none" opacity="0.34"/>
      <path d="M620 22 A46 46 0 0 1 620 114 A30 46 0 0 0 620 22 Z" fill="#0f172a" opacity="0.36"/>
      <path d="M204 120 A420 34 -7 0 0 1036 16" fill="none" stroke="#e0f2fe" stroke-width="12" opacity="0.82"/>
      <path d="M262 114 A362 26 -7 0 0 978 22" fill="none" stroke="#fde68a" stroke-width="3.6" stroke-dasharray="22 10" class="h-flow"/>
      ${[[304,104,5],[452,96,4],[818,52,5.5],[944,34,4]].map(([ix, iy, ir], i) => `<polygon points="${ix},${iy - ir} ${ix + ir * 1.2},${iy} ${ix},${iy + ir} ${ix - ir},${iy}" fill="#e0f2fe" opacity="0.88" class="${i % 2 ? "h-twinkle" : "h-twinkle-d1"}"/>`).join("")}
      <!-- Platinum Station Framing & Bulkhead Pillars -->
      <rect x="0" y="0" width="1240" height="20" fill="${deck}"/>
      <line x1="0" y1="20" x2="1240" y2="20" stroke="#38bdf8" stroke-width="1.8"/>
      ${[18, 404, 824, 1208].map(px => `<rect x="${px}" y="20" width="14" height="128" fill="${deck}" stroke="#38bdf8" stroke-width="1.1"/>`).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${deck}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.26, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4"/>
    `;
  });

  // T8-5: ☀️ 戴森球恒星殿 (1240px: West Plasma Conduit | Center Captive Star & Dyson Rings | East Solar-Sail Launch Dock)
  R.registerHouseArt("dyson_sphere", (dp) => {
    const s = skyOf(dp);
    const id = `ds5_${s.phase}`;
    const bg = s.isNight ? ["#fef08a", "#f59e0b", "#451a03", "#090402"] : (s.isDusk ? ["#ffffff", "#fde047", "#ea580c", "#431407"] : ["#ffffff", "#fef9c3", "#fde68a", "#f59e0b"]);
    const pil = s.isNight ? "#18120e" : "#451a03";
    const flr = s.isNight ? "#1c140c" : (s.isDusk ? "#451a03" : "#fef3c7");
    return `
      <defs><radialGradient id="${id}_st" cx="50%" cy="44%" r="60%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="28%" stop-color="${bg[1]}"/><stop offset="65%" stop-color="${bg[2]}"/><stop offset="100%" stop-color="${bg[3]}"/></radialGradient></defs>
      <rect width="1240" height="208" fill="url(#${id}_st)"/>
      ${s.isNight ? genStars(20, 1220, 48, 156, 118) : ""}
      <!-- Colossal Captive Star + Orbiting Hexagonal 24K Solar-Collector Arrays & Dyson Rings at Center (x=620) -->
      <g transform="translate(620, 72)">
        <circle cx="0" cy="0" r="68" fill="#fde047" opacity="0.22" class="h-pulse"/>
        <circle cx="0" cy="0" r="44" fill="${s.isNight ? "#180a02" : "#ffffff"}" stroke="#fef08a" stroke-width="4" class="h-pulse"/>
        <g class="h-spin-slow">
          <ellipse cx="0" cy="0" rx="232" ry="44" fill="none" stroke="url(#hsGoldH)" stroke-width="4" stroke-dasharray="28 12"/>
          ${[-196, -110, 110, 196].map(hx => `<polygon points="${hx},-10 ${hx + 12},-4 ${hx + 12},8 ${hx},14 ${hx - 12},8 ${hx - 12},-4" fill="#451a03" fill-opacity="0.82" stroke="#fef08a" stroke-width="1.4"/>`).join("")}
        </g>
        <g class="h-spin-rev"><ellipse cx="0" cy="0" rx="154" ry="30" transform="rotate(-15)" fill="none" stroke="#fef08a" stroke-width="2.6" stroke-dasharray="16 8"/></g>
      </g>
      <!-- Hexagonal Golden Megastructure Buttresses dividing 3 Halls -->
      ${[0, 390, 810, 1180].map(px => `<polygon points="${px},0 ${px + 54},0 ${px + 38},148 ${px + 16},148" fill="${pil}" stroke="url(#hsGoldH)" stroke-width="1.8"/>`).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#d97706", 0.26, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="url(#hsGoldH)" stroke-width="2.8"/>
    `;
  });

  // ============================================================
  // PART 7: T9 — 5 COMPLETELY DISTINCT 1400px DIMENSIONAL SANCTUARIES (mainOriginX=490)
  //   ZERO SHARED TEMPLATES! Each sanctuary has bespoke architecture, colonnades & skyline!
  // ============================================================

  // T9-1: 🔮 量子镜像浮殿 (1400px — Faceted Crystal Mirror Fractal Cathedral!)
  R.registerHouseArt("quantum_mirror", (dp) => {
    const s = skyOf(dp);
    const id = `qm5_${s.phase}`;
    const bg = s.isNight ? ["#070518", "#1a1746", "#0d1b36"] : (s.isDusk ? ["#3b0764", "#9d174d", "#fbcfe8"] : ["#bae6fd", "#f0f9ff", "#ede9fe"]);
    const flr = s.isNight ? "#0b0e24" : (s.isDusk ? "#311842" : "#e2e8f0");
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? genStars(14, 1386, 78, 201, 120) : `<polygon points="480,0 920,0 1040,148 360,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      <!-- Three Infinite Receding Fractal Crystal Mirror Corridors + Prismatic Floor Light-Caustics -->
      ${[210, 700, 1190].map((cx, i) => `
        <polygon points="${cx},4 ${cx + 154},78 ${cx},148 ${cx - 154},78" fill="none" stroke="${i === 1 ? "#f472b6" : "#38bdf8"}" stroke-width="1.4" opacity="0.45"/>
        <polygon points="${cx},12 ${cx + 122},78 ${cx},144 ${cx - 122},78" fill="${i === 1 ? "#f472b6" : "#38bdf8"}" fill-opacity="0.06" stroke="${i === 1 ? "#f472b6" : "#38bdf8"}" stroke-width="2" opacity="0.86"/>
        <polygon points="${cx},28 ${cx + 84},78 ${cx},128 ${cx - 84},78" fill="none" stroke="#c084fc" stroke-width="1.6" opacity="0.84"/>
        <polygon points="${cx},46 ${cx + 48},78 ${cx},110 ${cx - 48},78" fill="${s.isNight ? "#22d3ee" : "#ffffff"}" fill-opacity="0.24" stroke="#fde047" stroke-width="1.5" class="h-pulse"/>
        <polygon points="${cx},60 ${cx + 22},78 ${cx},96 ${cx - 22},78" fill="#ffffff" fill-opacity="0.28"/>
        <ellipse cx="${cx}" cy="156" rx="76" ry="7" fill="${i === 1 ? "#f472b6" : "#38bdf8"}" opacity="0.16"/>
      `).join("")}
      <!-- Floating Faceted Crystal Prisms & Levitating Polyhedra Shards -->
      ${[446, 954].map((px, i) => `
        <polygon points="${px},0 ${px + 20},20 ${px + 11},148 ${px - 11},148 ${px - 20},20" fill="${s.isNight ? "#1e1b4b" : "#ffffff"}" fill-opacity="0.82" stroke="${i ? "#f472b6" : "#38bdf8"}" stroke-width="1.8"/>
        <line x1="${px}" y1="10" x2="${px}" y2="144" stroke="#fde047" stroke-width="1.3" opacity="0.8"/>
      `).join("")}
      ${[[348,38],[548,32],[852,32],[1052,38]].map(([sx, sy], i) => `
        <g transform="translate(${sx}, ${sy})"><g class="${i % 2 ? "h-float" : "h-float-slow"}">
          <polygon points="0,-12 9,0 0,12 -9,0" fill="${i % 2 ? "#38bdf8" : "#f472b6"}" fill-opacity="0.55" stroke="#ffffff" stroke-width="1"/>
        </g></g>`).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, "#38bdf8", 0.3, 76)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="url(#hsPrism)" stroke-width="2.8"/>
    `;
  });

  // T9-2: 🌌 次元虫洞方舟 (1400px — Curved Obsidian-Titanium Star-Ark Tunneling Through a Wormhole!)
  R.registerHouseArt("wormhole", (dp) => {
    const s = skyOf(dp);
    const id = `wh5_${s.phase}`;
    const bg = s.isNight ? ["#240952", "#0f0722", "#020108"] : (s.isDusk ? ["#5b21b6", "#9d174d", "#1e1b4b"] : ["#fffbeb", "#bae6fd", "#c7d2fe"]);
    const flr = s.isNight ? "#110926" : (s.isDusk ? "#2b1347" : "#dbeafe");
    return `
      <defs><radialGradient id="${id}_bg" cx="50%" cy="42%" r="68%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="55%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></radialGradient></defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${genStars(14, 1386, 84, 212, 122)}
      <!-- Curved Einstein-Rosen Spacetime Mesh Warping into the Central Wormhole Throat (x=700) -->
      <g stroke="#7c3aed" stroke-width="1" fill="none" opacity="0.34">
        <path d="M0 16 Q350 28 700 74 Q1050 28 1400 16"/>
        <path d="M0 54 Q350 56 700 74 Q1050 56 1400 54"/>
        <path d="M0 104 Q350 96 700 74 Q1050 96 1400 104"/>
        <path d="M0 144 Q350 128 700 74 Q1050 128 1400 144"/>
      </g>
      <g transform="translate(700, 74)">
        <ellipse cx="0" cy="0" rx="284" ry="58" fill="#7c3aed" opacity="0.1"/>
        <ellipse cx="0" cy="0" rx="236" ry="50" fill="none" stroke="#a855f7" stroke-width="3.4" stroke-dasharray="24 10" class="h-flow" opacity="0.88"/>
        <ellipse cx="0" cy="0" rx="174" ry="36" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-dasharray="18 8" class="h-flow-rev"/>
        <ellipse cx="0" cy="0" rx="116" ry="24" fill="none" stroke="#f59e0b" stroke-width="2.6" stroke-dasharray="20 6" class="h-flow"/>
        <circle cx="0" cy="0" r="36" fill="${s.isNight ? "#020106" : "#fffbeb"}" stroke="#f59e0b" stroke-width="2.4"/>
        <ellipse cx="0" cy="0" rx="92" ry="10" fill="none" stroke="#fef08a" stroke-width="2.6"/>
      </g>
      <!-- Curved Titanium Ark Hull Rib Arches + Floating Monoliths -->
      ${[0, 350, 700, 1050].map(ox => `<path d="M${ox} 148 Q${ox + 175} -8 ${ox + 350} 148" fill="none" stroke="#c084fc" stroke-width="2.2" opacity="0.52"/>`).join("")}
      ${[210, 444, 956, 1190].map((ox, i) => `
        <g transform="translate(${ox}, 70)"><g class="${i % 2 ? "h-float" : "h-float-slow"}">
          <polygon points="0,-42 16,0 0,42 -16,0" fill="url(#hsObsidian)" stroke="${i % 2 ? "#ec4899" : "#38bdf8"}" stroke-width="1.5"/>
          <line x1="0" y1="-26" x2="0" y2="26" stroke="#fef08a" stroke-width="1.1" opacity="0.72"/>
        </g></g>`).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, "#c084fc", 0.28, 78)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="#c084fc" stroke-width="2.8"/>
    `;
  });

  // T9-3: ⏳ 时光裂隙钟楼 (1400px — Gothic-Celestial Brass Clockwork Cathedral & Floating Hourglasses!)
  R.registerHouseArt("time_clocktower", (dp) => {
    const s = skyOf(dp);
    const id = `tc5_${s.phase}`;
    const bg = s.isNight ? ["#2f1552", "#120a22", "#07050f"] : (s.isDusk ? ["#f59e0b", "#7c2d6e", "#1e1b4b"] : ["#fffbeb", "#bae6fd", "#38bdf8"]);
    const flr = s.isNight ? "#120c1f" : (s.isDusk ? "#2e1a36" : "#f3ead8");
    const archC = s.isNight ? "#24163b" : "#78350f";
    return `
      <defs><radialGradient id="${id}_bg" cx="50%" cy="42%" r="65%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="56%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></radialGradient></defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? genStars(14, 1386, 76, 223, 120) : `<polygon points="520,0 880,0 980,148 420,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      <!-- Soaring Gothic Cathedral Vaulted Tracery Arches framing Clockwork Wings -->
      <path d="M0 0 H1400 V34 Q1170 4 930 34 Q700 2 470 34 Q230 4 0 34 Z" fill="${archC}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      <!-- Grand Celestial Rose Clockface + Roman Markers + Swinging Gilded Pendulum (x=700) -->
      <g transform="translate(700, 74)">
        <circle cx="0" cy="0" r="82" fill="none" stroke="url(#hsGoldH)" stroke-width="1.4" opacity="0.52"/>
        <circle cx="0" cy="0" r="72" fill="${s.isNight ? "#1e1b4b" : "#fffbeb"}" fill-opacity="0.68" stroke="url(#hsGoldH)" stroke-width="3.2"/>
        ${[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
          const rad = (deg * Math.PI) / 180;
          return `<line x1="${(Math.cos(rad)*58).toFixed(1)}" y1="${(Math.sin(rad)*58).toFixed(1)}" x2="${(Math.cos(rad)*68).toFixed(1)}" y2="${(Math.sin(rad)*68).toFixed(1)}" stroke="#fde68a" stroke-width="${deg % 90 === 0 ? 2.4 : 1.2}"/>`;
        }).join("")}
        <g class="h-spin-slow"><circle cx="0" cy="0" r="54" fill="none" stroke="#d97706" stroke-width="4.5" stroke-dasharray="7 8"/></g>
        <g class="h-spin-rev"><circle cx="0" cy="0" r="36" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="10 6"/></g>
        <line x1="0" y1="0" x2="0" y2="-46" stroke="${s.isNight ? "#fef08a" : "#b45309"}" stroke-width="2.8" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="34" y2="16" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="5.5" fill="#fef08a"/>
      </g>
      <!-- Properly Nested Interlocking Flanking Clockwork Gear Trains & Floating Golden Hourglasses! -->
      ${[210, 446, 954, 1190].map((gx, i) => `
        <g transform="translate(${gx}, ${66 + (i % 2) * 14})" opacity="0.82"><g class="${i % 2 ? "h-spin-slow" : "h-spin-rev"}">
          <circle cx="0" cy="0" r="${30 + (i % 2) * 8}" fill="none" stroke="#d97706" stroke-width="4.8" stroke-dasharray="6 6"/>
          <circle cx="0" cy="0" r="15" fill="none" stroke="#fde047" stroke-width="1.6"/>
          <line x1="-26" y1="0" x2="26" y2="0" stroke="#f59e0b" stroke-width="1.4"/><line x1="0" y1="-26" x2="0" y2="26" stroke="#f59e0b" stroke-width="1.4"/>
        </g></g>`).join("")}
      ${[332, 1068].map((hx, i) => `
        <g transform="translate(${hx}, 56)"><g class="${i ? "h-float-slow" : "h-float"}">
          <polygon points="-10,-16 10,-16 0,0 -10,16 10,16 0,0" fill="#fde047" fill-opacity="0.34" stroke="url(#hsGoldH)" stroke-width="1.4"/>
          <line x1="-12" y1="-16" x2="12" y2="-16" stroke="url(#hsGoldH)" stroke-width="2.2"/>
          <line x1="-12" y1="16" x2="12" y2="16" stroke="url(#hsGoldH)" stroke-width="2.2"/>
        </g></g>`).join("")}
      <!-- Gothic Brass Clocktower Rib Pillars -->
      ${[16, 470, 912, 1366].map(px => `
        <rect x="${px}" y="0" width="18" height="148" fill="${archC}" stroke="url(#hsGoldH)" stroke-width="1.5"/>
        <polygon points="${px - 4},18 ${px + 9},4 ${px + 22},18" fill="url(#hsGoldH)"/>
      `).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, "#d97706", 0.28, 78)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="url(#hsGoldH)" stroke-width="2.8"/>
    `;
  });

  // T9-4: 🌠 银河核心星云阁 (1400px — Ethereal Celestial Jade & Gold Chinese Sky-Palace above Spiral Galaxy!)
  R.registerHouseArt("galactic_core", (dp) => {
    const s = skyOf(dp);
    const id = `gc5_${s.phase}`;
    const bg = s.isNight ? ["#0a3d42", "#141d4a", "#050816"] : (s.isDusk ? ["#0e7490", "#6b21a8", "#1e1b4b"] : ["#ecfdf5", "#a7f3d0", "#38bdf8"]);
    const flr = s.isNight ? "#071e26" : (s.isDusk ? "#134e4a" : "#d1fae5");
    return `
      <defs><radialGradient id="${id}_bg" cx="50%" cy="44%" r="66%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="54%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></radialGradient></defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${genStars(14, 1386, 86, 234, 122)}
      <!-- Sweeping Ethereal Multi-Arm Milky Way Nebula Ribbons + Swirling Galactic Core (x=700) -->
      <path d="M0 96 Q240 44 520 76 Q700 94 880 76 Q1160 44 1400 96" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="26" opacity="0.18"/>
      <path d="M0 78 Q340 112 700 76 Q1060 40 1400 84" fill="none" stroke="url(#hsAuroraGold)" stroke-width="14" opacity="0.16"/>
      <g transform="translate(700, 76)" opacity="0.86"><g class="h-spin-slow">
        <ellipse cx="0" cy="0" rx="256" ry="52" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="12"/>
        <ellipse cx="0" cy="0" rx="176" ry="36" transform="rotate(18)" fill="none" stroke="url(#hsAuroraGold)" stroke-width="8"/>
        <ellipse cx="0" cy="0" rx="108" ry="22" transform="rotate(-14)" fill="none" stroke="#f472b6" stroke-width="4" opacity="0.72"/>
      </g></g>
      <circle cx="700" cy="76" r="34" fill="#34d399" opacity="0.22" class="h-pulse"/>
      <circle cx="700" cy="76" r="20" fill="#ffffff" opacity="0.95" class="h-pulse"/>
      <!-- Upturned Jade-and-Gold Celestial Chinese Pavilion Eaves (飞檐斗拱) across all 1400px -->
      <path d="M0 0 H1400 V26 Q1190 6 980 26 Q700 2 420 26 Q210 6 0 26 Z" fill="#064e3b" stroke="url(#hsGoldH)" stroke-width="2"/>
      ${[190, 344, 574, 826, 1056, 1210].map(lx => `
        <line x1="${lx}" y1="16" x2="${lx}" y2="34" stroke="url(#hsGoldH)" stroke-width="1.2"/>
        <path d="M${lx - 7} 34 H${lx + 7} L${lx + 5} 48 H${lx - 5} Z" fill="#fef08a" fill-opacity="0.86" stroke="#d4af37" stroke-width="1"/>
        <line x1="${lx}" y1="48" x2="${lx}" y2="56" stroke="#ef4444" stroke-width="1.4"/>
      `).join("")}
      <!-- Jade Pillars & Carved White-Jade Cloud Balustrades along Horizon -->
      ${[22, 474, 908, 1358].map(px => `
        <rect x="${px}" y="22" width="18" height="126" rx="2" fill="#065f46" stroke="url(#hsGoldH)" stroke-width="1.3"/>
        <rect x="${px - 4}" y="20" width="26" height="6" rx="1.5" fill="url(#hsGoldH)"/>
      `).join("")}
      <line x1="0" y1="128" x2="1400" y2="128" stroke="#6ee7b7" stroke-width="2.4" opacity="0.8"/>
      <line x1="0" y1="138" x2="1400" y2="138" stroke="#d1fae5" stroke-width="1" opacity="0.45"/>
      ${Array.from({ length: 18 }, (_, i) => `<rect x="${44 + i * 76}" y="128" width="5" height="20" rx="1.5" fill="#a7f3d0" opacity="0.62"/>`).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, "#34d399", 0.3, 78)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="#34d399" stroke-width="2.6"/>
    `;
  });

  // T9-5: 🌀 奇点视界王庭 (1400px — Imperial Obsidian & 24K Gold Gargantua Event-Horizon Throne Court!)
  R.registerHouseArt("singularity_court", (dp) => {
    const s = skyOf(dp);
    const id = `sg5_${s.phase}`;
    const bg = s.isNight ? ["#04020a", "#110924", "#1f103b"] : (s.isDusk ? ["#2e1065", "#9a3412", "#fde68a"] : ["#e0f2fe", "#fef9c3", "#fde68a"]);
    const flr = s.isNight ? "#0d0917" : (s.isDusk ? "#261530" : "#f8f4e8");
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${genStars(14, 1386, 86, 245, 122)}
      <!-- True Interstellar-Style Gargantua Black Hole with Upper & Lower Gravitational-Lensing Photon Arches (x=700)! -->
      <g transform="translate(700, 78)">
        <ellipse cx="0" cy="0" rx="310" ry="36" fill="#f59e0b" opacity="0.14"/>
        <!-- Bent upper & lower gravitational lensing photon arches wrapping over/under the event horizon -->
        <path d="M-112 0 A112 68 0 0 1 112 0" fill="none" stroke="#f59e0b" stroke-width="10" opacity="0.42"/>
        <path d="M-92 0 A92 58 0 0 1 92 0" fill="none" stroke="#fef08a" stroke-width="3.6" opacity="0.88"/>
        <path d="M-84 0 A84 48 0 0 0 84 0" fill="none" stroke="#fb923c" stroke-width="5" opacity="0.58"/>
        <!-- Wide Doppler-brightened accretion disc -->
        <ellipse cx="0" cy="0" rx="270" ry="26" fill="none" stroke="#f59e0b" stroke-width="12" opacity="0.76" class="h-pulse"/>
        <ellipse cx="0" cy="0" rx="224" ry="18" fill="none" stroke="#fef08a" stroke-width="3.4" stroke-dasharray="28 12" class="h-flow"/>
        <circle cx="0" cy="0" r="50" fill="none" stroke="url(#hsGoldH)" stroke-width="3.4"/>
        <circle cx="0" cy="0" r="43" fill="${s.isNight ? "#020106" : "#fffbeb"}" stroke="#a855f7" stroke-width="2"/>
        <!-- Foreground relativistic light arc sweeping across the dark event horizon -->
        <path d="M-266 0 Q0 24 266 0" fill="none" stroke="#fef9c3" stroke-width="4.4" opacity="0.96"/>
      </g>
      <!-- Sweeping 24K Gold Imperial Archways & Floating Runic Obelisk Columns -->
      <path d="M28 148 V64 A210 56 0 0 1 468 64 V148 M932 148 V64 A210 56 0 0 1 1372 64 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="1.8" opacity="0.62"/>
      ${[18, 468, 912, 1362].map(px => `
        <polygon points="${px},148 ${px + 4},18 ${px + 10},4 ${px + 16},18 ${px + 20},148" fill="url(#hsObsidian)" stroke="url(#hsGoldH)" stroke-width="1.5"/>
        <line x1="${px + 10}" y1="36" x2="${px + 10}" y2="136" stroke="#fde047" stroke-width="1.2" stroke-dasharray="6 8" opacity="0.68"/>
        <circle cx="${px + 10}" cy="24" r="5.5" fill="#fef08a" class="h-pulse"/>
      `).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, "#f59e0b", 0.28, 78)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="url(#hsGoldH)" stroke-width="2.8"/>
    `;
  });

  // ============================================================
  // PART 8: T10 — 👑 太初星穹御苑 (1640px ULTIMATE 4-ZONE CREATOR PALACE, mainOriginX=610!)
  // ============================================================
  R.registerHouseArt("secret_palace", (dp) => {
    const s = skyOf(dp);
    const id = `t10_${s.phase}`;
    const pSky = s.isNight ? ["#050819", "#171442", "#2d1e6b", "#4c1d95"]
      : (s.isDusk ? ["#1e1338", "#581c68", "#c2410c", "#fde68a"]
        : (s.isDawn ? ["#38bdf8", "#bae6fd", "#fbcfe8", "#fef3c7"] : ["#0284c7", "#7dd3fc", "#e0f2fe", "#fffbeb"]));
    const clC = s.isNight ? ["#334155", "#1e293b", "#4c1d95"] : (s.isDusk ? ["#fed7aa", "#fef3c7", "#fbcfe8"] : ["#ffffff", "#fffbeb", "#f0f9ff"]);
    const flr = s.isNight ? "#1b1d36" : (s.isDusk ? "#3c2848" : "url(#hsIvory)");
    const colFill = s.isNight ? "#334155" : "url(#hsIvory)";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pSky[0]}"/><stop offset="42%" stop-color="${pSky[1]}"/><stop offset="74%" stop-color="${pSky[2]}"/><stop offset="100%" stop-color="${pSky[3]}"/></linearGradient>
        <radialGradient id="${id}_rose" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFFBEB"/><stop offset="45%" stop-color="#FDE047"/><stop offset="78%" stop-color="#F97316"/><stop offset="100%" stop-color="${s.isNight ? "#7C3AED" : "#0284C7"}"/></radialGradient>
        <linearGradient id="${id}_falls" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#c084fc"/></linearGradient>
      </defs>
      <rect width="1640" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight || s.isDusk ? genStars(14, 1626, 108, 303, 120) : `<polygon points="150,0 320,0 390,148 90,148" fill="url(#hsSunbeam)" opacity="0.34"/><polygon points="720,0 920,0 990,148 650,148" fill="url(#hsSunbeam)" opacity="0.3"/>`}
      ${s.isNight ? moonCrescent(1480, 38, 18, pSky[0]) : `<circle cx="1480" cy="${s.isDusk ? 46 : 36}" r="20" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92"/>`}
      <!-- Continuous Luminous Zodiac Constellation & Golden-Silk Nebula Canopy across 1640px! -->
      <path d="M0 54 Q260 12 520 50 Q820 88 1140 36 Q1420 8 1640 48" fill="none" stroke="url(#hsAuroraGold)" stroke-width="26" opacity="${s.isNight ? "0.18" : "0.12"}"/>
      <path d="M0 86 Q340 42 740 82 Q1180 112 1640 58" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="20" opacity="${s.isNight ? "0.18" : "0.12"}"/>
      <g stroke="#fde68a" stroke-width="0.7" opacity="0.34" fill="none">
        <path d="M68 42 L116 28 L156 50 M464 36 L520 22 L568 44 M894 34 L946 22 L992 46 M1324 34 L1382 20 L1436 44"/>
      </g>
      <!-- Golden-Rimmed Sea of Clouds across full 1640px -->
      <g opacity="${s.isNight ? "0.52" : "0.9"}" class="h-drift-slow">
        ${[80, 230, 410, 620, 820, 1020, 1240, 1440, 1590].map((cx, i) => `
          <ellipse cx="${cx}" cy="${136 + (i % 2) * 8}" rx="${82 + (i % 3) * 24}" ry="22" fill="${clC[i % 3]}"/>
          <ellipse cx="${cx - 28}" cy="${126 + (i % 2) * 6}" rx="42" ry="13" fill="${clC[(i + 1) % 3]}" stroke="#fde68a" stroke-width="0.6" stroke-opacity="0.4"/>
        `).join("")}
      </g>
      <!-- Palace Upper Gilded Entablature Cornice across 1640px -->
      <rect x="0" y="0" width="1640" height="16" fill="${s.isNight ? "#12102a" : "#f5ebd6"}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      <!-- ZONE 1 (0..410): 🏛️ 星穹神谕殿 (Rose Carrot Celestial Window + Starlight Hanging Lanterns) -->
      <g transform="translate(210, 76)">
        <circle cx="0" cy="0" r="70" fill="#f59e0b" opacity="0.12"/>
        <g class="h-spin-slow" opacity="0.84"><circle cx="0" cy="0" r="64" fill="none" stroke="#fde047" stroke-width="1.6" stroke-dasharray="12 6"/></g>
        <g class="h-spin-rev" opacity="0.84"><circle cx="0" cy="0" r="46" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="8 5"/></g>
        <circle cx="0" cy="0" r="28" fill="${s.isNight ? "#1e1333" : "#fffbeb"}" stroke="url(#hsGoldH)" stroke-width="2.4"/>
        <circle cx="0" cy="0" r="21" fill="url(#${id}_rose)" opacity="0.94"/><text x="0" y="6" font-size="18" text-anchor="middle">🥕</text>
      </g>
      <path d="M24 148 V52 A74 36 0 0 1 172 52 V148 M248 148 V52 A74 36 0 0 1 396 52 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4"/>
      ${[98, 322].map(lx => `<line x1="${lx}" y1="16" x2="${lx}" y2="42" stroke="url(#hsGoldH)" stroke-width="1.3"/><polygon points="${lx},42 ${lx + 9},54 ${lx},66 ${lx - 9},54" fill="#fef08a" fill-opacity="0.72" stroke="#f59e0b" stroke-width="1"/>`).join("")}
      <!-- ZONE 2 (410..860): ⏳ 创世日晷星台 & 青铜编钟台 (Center-West Atrium!) -->
      <g transform="translate(760, 76)">
        <circle cx="0" cy="0" r="54" fill="#fde047" opacity="0.14"/>
        <g class="h-spin-slow"><ellipse cx="0" cy="0" rx="126" ry="40" fill="none" stroke="url(#hsGoldH)" stroke-width="2.8" stroke-dasharray="18 8"/></g>
        <g class="h-spin-rev"><ellipse cx="0" cy="0" rx="92" ry="54" transform="rotate(22)" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="12 7"/></g>
        <circle cx="0" cy="0" r="24" fill="#fef08a" opacity="0.92" class="h-pulse"/><circle cx="0" cy="0" r="14" fill="#ffffff"/>
      </g>
      <!-- Ornate Dragon-Beam Bronze Chime-Bell Pavilion Rack (青铜编钟架 x=510) -->
      <g transform="translate(510, 146)">
        <rect x="-42" y="-6" width="84" height="6" rx="2" fill="#451a03" stroke="url(#hsGoldH)" stroke-width="1.2"/>
        <line x1="-32" y1="-6" x2="-32" y2="-62" stroke="url(#hsGoldV)" stroke-width="3.6"/><line x1="32" y1="-6" x2="32" y2="-62" stroke="url(#hsGoldV)" stroke-width="3.6"/>
        <path d="M-44 -60 Q-36 -72 -26 -62 H26 Q36 -72 44 -60 L38 -54 H-38 Z" fill="url(#hsGoldH)" stroke="#fffbeb" stroke-width="0.8"/>
        <line x1="-32" y1="-36" x2="32" y2="-36" stroke="url(#hsGoldH)" stroke-width="2.2"/>
        ${[-20, -10, 0, 10, 20].map((bx, i) => `
          <polygon points="${bx - 3.6},-54 ${bx + 3.6},-54 ${bx + 4.8},${-38 + i * 1.4} ${bx - 4.8},${-38 + i * 1.4}" fill="url(#hsGoldV)" stroke="#fffbeb" stroke-width="0.6"/>
          <polygon points="${bx - 4.2},-34 ${bx + 4.2},-34 ${bx + 5.6},${-12 + i * 1.6} ${bx - 5.6},${-12 + i * 1.6}" fill="url(#hsGoldV)" stroke="#fef08a" stroke-width="0.6"/>
        `).join("")}
      </g>
      <!-- ZONE 3 (860..1240): 🌊 浮空星河水苑 (Floating Cloud-Cliff Starlight Waterfall + Arched Jade Moon Bridge + Lotus Star-Pond!) -->
      <g transform="translate(1060, 0)">
        <path d="M-74 28 Q-44 10 0 18 Q44 10 74 28 L52 46 H-52 Z" fill="${s.isNight ? "#312e81" : "#e2e8f0"}" stroke="url(#hsGoldH)" stroke-width="1.3"/>
        <path d="M-38 38 Q-46 94 -54 148 H54 Q46 94 38 38 Z" fill="url(#${id}_falls)" opacity="0.64"/>
        <path d="M-20 40 Q-26 94 -28 148 M0 38 V148 M20 40 Q26 94 28 148" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-dasharray="12 7" class="h-flow-rev"/>
        <ellipse cx="0" cy="148" rx="96" ry="12" fill="#38bdf8" opacity="0.48"/>
        <ellipse cx="0" cy="148" rx="64" ry="7" fill="none" stroke="#fef08a" stroke-width="1.4" class="h-ripple"/>
        <path d="M-136 148 Q0 88 136 148" fill="none" stroke="url(#hsGoldH)" stroke-width="4.6"/>
        <path d="M-128 134 Q0 76 128 134" fill="none" stroke="#fef08a" stroke-width="1.8" opacity="0.88"/>
        ${[-84, -42, 0, 42, 84].map(bx => {
          const u = bx / 136;
          const yBot = (148 - 30 * (1 - u * u)).toFixed(1);
          const yTop = (134 - 29 * (1 - u * u)).toFixed(1);
          return `<line x1="${bx}" y1="${yBot}" x2="${bx}" y2="${yTop}" stroke="url(#hsGoldH)" stroke-width="1.6"/>`;
        }).join("")}
      </g>
      <!-- ZONE 4 (1240..1640): 👑 造物主天穹神坛 (Tiered White-Marble & 24K Gold Imperial Stairway Altar + Radiant Crown Halo!) -->
      <path d="M1260 148 V64 A180 68 0 0 1 1620 64 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <path d="M1284 148 V70 A156 54 0 0 1 1596 70 V148" fill="none" stroke="#fef08a" stroke-width="1.2" opacity="0.58"/>
      <g transform="translate(1440, 146)">
        <circle cx="0" cy="-54" r="46" fill="#fde047" opacity="0.16" class="h-pulse"/>
        <polygon points="-76,0 -62,-10 62,-10 76,0" fill="${colFill}" stroke="url(#hsGoldH)" stroke-width="1.3"/>
        <polygon points="-56,-10 -44,-22 44,-22 56,-10" fill="url(#hsGoldH)" opacity="0.92"/>
        <ellipse cx="0" cy="-48" rx="40" ry="11" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-dasharray="14 6" class="h-flow"/>
        <polygon points="-16,-40 -19,-64 -7,-52 0,-70 7,-52 19,-64 16,-40" fill="url(#hsGoldH)" stroke="#fffbeb" stroke-width="1.2" class="h-float"/>
        <circle cx="0" cy="-50" r="3.4" fill="#ef4444" stroke="#fef08a" stroke-width="0.9" class="h-float"/>
      </g>
      <!-- Monumental 24K Gold-Capped Palace Columns framing all 4 Grand Zones & Center Atrium (610..1030) -->
      ${[18, 404, 600, 1024, 1230, 1602].map(cx => `
        <rect x="${cx}" y="22" width="20" height="126" rx="2" fill="${colFill}" stroke="#d4af37" stroke-width="1.2"/>
        <rect x="${cx - 5}" y="16" width="30" height="8" rx="2" fill="url(#hsGoldH)"/>
        <rect x="${cx - 4}" y="142" width="28" height="6" rx="1.5" fill="url(#hsGoldH)"/>
      `).join("")}
      <rect x="0" y="148" width="1640" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1640, "#d4af37", s.isNight ? 0.34 : 0.28, 78)}
      <line x1="0" y1="148" x2="1640" y2="148" stroke="url(#hsGoldH)" stroke-width="3"/>
      <line x1="0" y1="152" x2="1640" y2="152" stroke="#fef08a" stroke-width="0.9" opacity="0.65"/>
    `;
  });

  global.TooTooArtWonders = { getExtensionSvg: () => "" };
})(typeof window !== "undefined" ? window : globalThis);
