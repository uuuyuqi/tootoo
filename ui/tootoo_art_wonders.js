// ============================================================
// TooToo Grand Multi-Wing Panoramic House Art (T3-T6 Extensions + Full Rebuilt T7-T10 Palaces)
// World Scale Ladder:
//   T1/T2: 420px | T3: 500px | T4: 600px | T5: 760px | T6: 920px
//   T7: 1080px (3-Wing Wonders) | T8: 1240px (Interstellar Panoramas)
//   T9: 1400px (4-Zone Dimensional Sanctuaries) | T10: 1640px (Creator's Celestial Palace)
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

  function starField(list) {
    return list.map(([x, y, r, col], i) => {
      const cls = i % 3 === 0 ? "h-twinkle" : (i % 3 === 1 ? "h-twinkle-d1" : "h-twinkle-d2");
      return `<circle cx="${x}" cy="${y}" r="${r || 1.2}" fill="${col || "#fff"}" class="${cls}"/>`;
    }).join("");
  }

  function genStars(x0, x1, count, seed = 7, yMax = 118) {
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
      const r = (0.8 + (i % 4) * 0.35).toFixed(2);
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
      const dx = (x - mid) * 0.16;
      lines += `<line x1="${x.toFixed(0)}" y1="${y0}" x2="${(x + dx).toFixed(0)}" y2="${y0 + 60}" stroke="${stroke}" stroke-width="0.8" opacity="${(op * 0.85).toFixed(2)}"/>`;
    }
    return lines;
  }

  function moonCrescent(cx, cy, r, bgCol) {
    return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef08a" opacity="0.95" filter="url(#hsGlowSm)"/><circle cx="${cx + r * 0.42}" cy="${cy - r * 0.25}" r="${r * 0.85}" fill="${bgCol}"/></g>`;
  }

  // ============================================================
  // PART 1: SEAMLESS PANORAMIC EXTENSIONS FOR T3 (500px), T4 (600px), T5 (760px), T6 (920px)
  // ============================================================
  function getExtensionSvg(houseId, dp) {
    const s = skyOf(dp);
    const n = s.isNight;
    const d = s.isDusk;
    const winSky = n ? "#0c142c" : (d ? "#fb923c" : (s.isDawn ? "#fbcfe8" : "#bae6fd"));

    // ---- T3 Extensions (420..500: Cozy Craft Alcove with Bookshelf / Pinboard / Guitar) ----
    if (["bamboo_basket", "cardboard", "wood_crate", "canvas_tent", "vintage_van"].includes(houseId)) {
      const pal = {
        bamboo_basket: { w: n ? "#7d6032" : "#d4ac68", trim: "#5c4018", flr: n ? "#6b5026" : "#b0894a", accent: "#dc2626" },
        cardboard:     { w: n ? "#a17c54" : "#d4ae7e", trim: "#785028", flr: n ? "#7d5933" : "#a87c4b", accent: "#f59e0b" },
        wood_crate:    { w: n ? "#6e4e2b" : "#bd8e56", trim: "#334155", flr: n ? "#634322" : "#9c6d3c", accent: "#38bdf8" },
        canvas_tent:   { w: n ? "#9a8f7e" : "#efe5d1", trim: "#8c5a2b", flr: n ? "#3f4e3c" : "#6b8266", accent: "#fde047" },
        vintage_van:   { w: n ? "#2f5c52" : "#5eead4", trim: "#0f766e", flr: n ? "#5c4024" : "#a87946", accent: "#f97316" },
      }[houseId];
      return `
        <g>
          <rect x="419" y="0" width="81" height="148" fill="${pal.w}"/>
          <rect x="419" y="0" width="81" height="20" fill="${pal.trim}" opacity="0.72"/>
          <rect x="419" y="148" width="81" height="60" fill="${pal.flr}"/>
          <line x1="419" y1="148" x2="500" y2="148" stroke="${pal.trim}" stroke-width="2"/>
          ${perspFloor(148, 420, 500, pal.trim, 0.22, 32)}
          <!-- Cozy Craft Reading Shelf + Wall Polaroids + Mini Acoustic Guitar -->
          <rect x="430" y="34" width="56" height="34" rx="3" fill="${n ? "#4a3b2c" : "#fef3c7"}" stroke="${pal.trim}" stroke-width="1.3"/>
          <rect x="436" y="40" width="16" height="18" rx="1.5" fill="#fff" stroke="#cbd5e1" stroke-width="0.8"/>
          <circle cx="444" cy="47" r="4" fill="#fb923c"/>
          <rect x="458" y="42" width="22" height="14" rx="1.5" fill="#e0f2fe" stroke="#94a3b8" stroke-width="0.8"/>
          <path d="M460 54 L466 47 L472 52 L478 46 L478 54 Z" fill="#22c55e"/>
          <rect x="428" y="84" width="60" height="5" rx="2" fill="${pal.trim}"/>
          <rect x="434" y="69" width="7" height="15" rx="1" fill="#ef4444"/>
          <rect x="442" y="72" width="6" height="12" rx="1" fill="#0ea5e9"/>
          <rect x="449" y="67" width="8" height="17" rx="1" fill="#eab308"/>
          <circle cx="472" cy="77" r="6" fill="#22c55e"/>
          <rect x="467" y="80" width="10" height="5" rx="1.5" fill="#c25934"/>
          <!-- Wooden crate side-table & acoustic ukulele -->
          <g transform="translate(466, 134)">
            <ellipse cx="0" cy="4" rx="11" ry="13" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
            <ellipse cx="0" cy="-10" rx="8" ry="9" fill="#f59e0b" stroke="#78350f" stroke-width="1.1"/>
            <circle cx="0" cy="2" r="4" fill="#451a03"/>
            <rect x="-2" y="-34" width="4" height="22" fill="#78350f"/>
            <rect x="-4" y="-38" width="8" height="6" rx="1.5" fill="#451a03"/>
          </g>
        </g>`;
    }

    // ---- T4 Extensions (420..600: HUGE Panoramic Scenic Picture Window + Nature Sanctuary Wing!) ----
    if (["bamboo_pavilion", "treehole", "moganshan_cabin", "sunflower_glasshouse", "windmill_mill"].includes(houseId)) {
      const cfg = {
        bamboo_pavilion:      { wall: n ? "#c5beac" : "#f4eedf", trim: n ? "#26422c" : "#3f6b46", flr: n ? "#6e5534" : "#bf9d65", hill1: n ? "#14532d" : "#86efac", hill2: n ? "#0f3d21" : "#22c55e", water: n ? "#1e3a5f" : "#38bdf8" },
        treehole:             { wall: n ? "#734c29" : "#a87643", trim: "#4a2a12", flr: n ? "#633c1e" : "#85542d", hill1: n ? "#14532d" : "#4ade80", hill2: n ? "#052e16" : "#15803d", water: n ? "#1e3a5f" : "#60a5fa" },
        moganshan_cabin:      { wall: n ? "#5c3318" : "#9c572a", trim: "#451a03", flr: n ? "#543018" : "#8c5228", hill1: n ? "#1e3a5f" : "#4ade80", hill2: n ? "#14532d" : "#166534", water: n ? "#1e293b" : "#93c5fd" },
        sunflower_glasshouse: { wall: n ? "#b8b2a6" : "#faf5eb", trim: n ? "#cbd5e1" : "#ffffff", flr: n ? "#875742" : "#d99d80", hill1: n ? "#14532d" : "#4ade80", hill2: n ? "#15803d" : "#22c55e", water: "#facc15" },
        windmill_mill:        { wall: n ? "#bdb4a5" : "#f5ede0", trim: n ? "#422712" : "#783f1c", flr: n ? "#634224" : "#ad7a46", hill1: n ? "#14532d" : "#4ade80", hill2: n ? "#166534" : "#16a34a", water: n ? "#1e3a5f" : "#38bdf8" },
      }[houseId];
      const isGlass = houseId === "sunflower_glasshouse";
      const flowers = isGlass ? [445, 480, 518, 558, 582].map((fx, i) => `
        <g transform="translate(${fx}, ${78 + (i % 2) * 10})">
          <line x1="0" y1="0" x2="0" y2="54" stroke="#15803d" stroke-width="2.6"/>
          <circle cx="0" cy="0" r="10.5" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
          <circle cx="0" cy="0" r="4.8" fill="#78350f"/>
        </g>`).join("") : "";
      return `
        <g>
          <rect x="419" y="0" width="181" height="148" fill="${isGlass ? winSky : cfg.wall}"/>
          ${!isGlass ? `<rect x="419" y="0" width="181" height="20" fill="${cfg.trim}"/>` : ""}
          <!-- HUGE 150px Panoramic Floor-to-Ceiling Nature View Window! -->
          <rect x="432" y="${isGlass ? 0 : 22}" width="152" height="${isGlass ? 126 : 112}" rx="${isGlass ? 0 : 6}" fill="${winSky}" stroke="${cfg.trim}" stroke-width="3"/>
          ${n ? `${genStars(438, 578, 12, 31, 66)}${moonCrescent(552, 42, 10, winSky)}` : `<circle cx="552" cy="${d ? 50 : 40}" r="13" fill="${d ? "#fb923c" : "#fde047"}" opacity="0.9" filter="url(#hsGlowMd)"/>`}
          <path d="M432 104 Q478 68 524 94 Q556 72 584 96 L584 134 L432 134 Z" fill="${cfg.hill1}"/>
          <path d="M432 116 Q492 94 584 112 L584 134 L432 134 Z" fill="${cfg.hill2}"/>
          ${!isGlass ? `<rect x="432" y="116" width="152" height="18" fill="${cfg.water}" opacity="0.65"/>
            <line x1="452" y1="124" x2="508" y2="124" stroke="#fff" stroke-width="1" opacity="0.55" class="h-drift"/>
            <line x1="508" y1="22" x2="508" y2="134" stroke="${cfg.trim}" stroke-width="2.2"/>
            ${!n ? `<polygon points="446,24 510,24 468,148 416,148" fill="url(#hsSunbeam)" opacity="0.34"/>` : ""}`
          : `${flowers}
             <g stroke="${cfg.trim}" stroke-width="2.6" fill="none">
               <line x1="420" y1="24" x2="600" y2="24"/><line x1="504" y1="0" x2="504" y2="126"/><line x1="588" y1="0" x2="588" y2="126"/>
               <path d="M420 24 Q462 6 504 24 Q546 6 588 24"/>
             </g>
             <rect x="419" y="126" width="181" height="22" fill="${cfg.wall}" stroke="#d6cfc2" stroke-width="1.2"/>`}
          <!-- Warm floor continuation -->
          <rect x="419" y="148" width="181" height="60" fill="${cfg.flr}"/>
          ${perspFloor(148, 420, 600, cfg.trim, 0.24, 48)}
          <line x1="419" y1="148" x2="600" y2="148" stroke="${cfg.trim}" stroke-width="2.2"/>
        </g>`;
    }

    // ---- T5 Extensions (720..760: Extra Terrace Lookout Edge) ----
    if (["regent_intl", "heanju", "xixi_beiyuan"].includes(houseId)) {
      const deckC = houseId === "xixi_beiyuan" ? (n ? "#5c3b20" : "#a87442") : (n ? "#334155" : "#94a3b8");
      const skyC = n ? "#1e293b" : (d ? "#fb923c" : "#bae6fd");
      return `
        <g>
          <rect x="719" y="0" width="41" height="148" fill="${skyC}"/>
          ${n ? genStars(722, 756, 5, 19, 80) : ""}
          <rect x="722" y="70" width="32" height="78" fill="${n ? "#1e293b" : "#94a3b8"}" opacity="0.72"/>
          <rect x="719" y="114" width="41" height="34" fill="#93c5fd" opacity="0.18"/>
          <line x1="719" y1="114" x2="760" y2="114" stroke="#475569" stroke-width="2.6"/>
          <rect x="719" y="148" width="41" height="60" fill="${deckC}"/>
          <line x1="719" y1="148" x2="760" y2="148" stroke="#475569" stroke-width="1.6"/>
        </g>`;
    }

    // ---- T6 Extensions (720..920: 3rd LUXURY GRAND COURTYARD / SKY-POOL / PIANO PAVILION WING!) ----
    if (["xixi", "wulin_yihao", "yunqi_rose", "jiangnanli"].includes(houseId)) {
      const skyTop = n ? "#0b132b" : (d ? "#4338ca" : (s.isDawn ? "#93c5fd" : "#60a5fa"));
      const skyBot = n ? "#1e293b" : (d ? "#fde68a" : (s.isDawn ? "#fef3c7" : "#e0f2fe"));
      const gid = `t6ext_${houseId}_${s.phase}`;
      if (houseId === "wulin_yihao") {
        // High-altitude Sky Infinity Spa Pool + Champagne Lounge overlooking Grand Canal!
        return `
          <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${skyTop}"/><stop offset="100%" stop-color="${skyBot}"/></linearGradient></defs>
          <g>
            <rect x="719" y="0" width="201" height="148" fill="url(#${gid})"/>
            ${n ? genStars(726, 912, 16, 41, 72) : ""}
            <rect x="734" y="64" width="38" height="84" fill="${n ? "#172033" : "#94a3b8"}" opacity="0.88"/>
            <rect x="786" y="42" width="46" height="106" fill="${n ? "#1e293b" : "#64748b"}" opacity="0.92"/>
            <rect x="844" y="58" width="52" height="90" fill="${n ? "#151d2e" : "#7c8fa6"}" opacity="0.88"/>
            ${n ? `<rect x="796" y="54" width="8" height="8" fill="#fde047"/><rect x="812" y="54" width="8" height="8" fill="#fde047"/><rect x="858" y="72" width="8" height="8" fill="#38bdf8"/><rect x="876" y="72" width="8" height="8" fill="#fde047"/>` : ""}
            <!-- Sky Infinity Glass Pool Deck -->
            <rect x="719" y="116" width="201" height="32" fill="#38bdf8" opacity="0.22"/>
            <line x1="719" y1="116" x2="920" y2="116" stroke="url(#hsGoldH)" stroke-width="2.4"/>
            <rect x="719" y="148" width="201" height="60" fill="${n ? "#181c28" : "#cbd5e1"}"/>
            <rect x="748" y="154" width="154" height="38" rx="8" fill="${n ? "#0369a1" : "#38bdf8"}" stroke="url(#hsGoldH)" stroke-width="2"/>
            <line x1="766" y1="168" x2="836" y2="168" stroke="#e0f2fe" stroke-width="1.3" opacity="0.65" class="h-drift"/>
            <line x1="812" y1="179" x2="884" y2="179" stroke="#bae6fd" stroke-width="1.1" opacity="0.55" class="h-drift-slow"/>
            <!-- Champagne Ice Bucket Bar -->
            <g transform="translate(894, 146)">
              <rect x="-12" y="-18" width="24" height="18" rx="3" fill="#1e293b" stroke="url(#hsGoldH)" stroke-width="1.2"/>
              <path d="M-4 -18 L-6 -28 L6 -28 L4 -18 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8"/>
              <rect x="-2" y="-35" width="4" height="8" rx="1" fill="#15803d"/>
              <circle cx="0" cy="-35.5" r="1.4" fill="#fde047"/>
            </g>
          </g>`;
      }
      if (houseId === "yunqi_rose") {
        // Versailles Rose Conservatory Gazebo + White Grand Piano!
        return `
          <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${skyTop}"/><stop offset="100%" stop-color="${skyBot}"/></linearGradient></defs>
          <g>
            <rect x="719" y="0" width="201" height="148" fill="url(#${gid})"/>
            ${n ? genStars(726, 912, 14, 52, 70) : ""}
            <path d="M719 112 Q784 82 850 106 Q888 88 920 102 L920 148 L719 148 Z" fill="${n ? "#14532d" : "#4ade80"}" opacity="0.72"/>
            <!-- White Iron French Conservatory Gazebo Arch -->
            <path d="M744 148 V54 A78 40 0 0 1 900 54 V148" fill="none" stroke="#fffbeb" stroke-width="3.5"/>
            <path d="M760 148 V60 A62 32 0 0 1 884 60 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="1.4"/>
            ${[[754,68],[776,38],[822,22],[868,38],[890,68]].map(([rx,ry]) => `<circle cx="${rx}" cy="${ry}" r="6.5" fill="#15803d"/><circle cx="${rx}" cy="${ry}" r="3.2" fill="#f43f5e"/>`).join("")}
            <rect x="719" y="148" width="201" height="60" fill="${n ? "#cbd5e1" : "#f5f0e4"}"/>
            ${perspFloor(148, 720, 920, "#d4af37", 0.25, 48)}
            <!-- Luxury White Grand Piano -->
            <g transform="translate(822, 152)">
              <ellipse cx="0" cy="4" rx="34" ry="6" fill="rgba(0,0,0,0.2)"/>
              <path d="M-26 -8 C-26 -28 4 -34 26 -16 C32 -11 32 -2 24 -2 L-26 -2 Z" fill="#fffdf8" stroke="#d4af37" stroke-width="1.4"/>
              <path d="M-20 -18 L24 -34 L26 -30 L-16 -14 Z" fill="#ffffff" stroke="#d4af37" stroke-width="1.1"/>
              <line x1="12" y1="-29" x2="12" y2="-16" stroke="#b45309" stroke-width="1.2"/>
              <rect x="-24" y="-8" width="24" height="5" fill="#1e293b"/>
              <line x1="-22" y1="-5.5" x2="-2" y2="-5.5" stroke="#fff" stroke-width="2" stroke-dasharray="2 1.5"/>
              <line x1="-20" y1="-2" x2="-20" y2="7" stroke="#d4af37" stroke-width="2.2"/>
              <line x1="20" y1="-2" x2="20" y2="7" stroke="#d4af37" stroke-width="2.2"/>
            </g>
          </g>`;
      }
      // xixi & jiangnanli: Classical Jiangnan Waterside Tea & Guqin Pavilion + Taihu Rockery Waterfall!
      return `
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${skyTop}"/><stop offset="100%" stop-color="${skyBot}"/></linearGradient></defs>
        <g>
          <rect x="719" y="0" width="201" height="148" fill="url(#${gid})"/>
          ${n ? genStars(726, 912, 14, 63, 72) : ""}
          <path d="M719 102 Q790 68 860 94 Q894 76 920 88 L920 148 L719 148 Z" fill="${n ? "#0f3d3e" : "#34d399"}" opacity="0.68"/>
          <!-- Taihu Rockery + Cascading Miniature Waterfall -->
          <path d="M862 148 L870 92 Q890 76 912 96 L920 148 Z" fill="${n ? "#475569" : "#94a3b8"}" stroke="#334155" stroke-width="1.2"/>
          <path d="M886 96 Q892 122 884 148" stroke="#7dd3fc" stroke-width="6" fill="none" opacity="0.82"/>
          <line x1="886" y1="96" x2="886" y2="148" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="6 5" class="h-flow-rev"/>
          <!-- Upturned Eaves Waterside Tea & Guqin Pavilion -->
          <path d="M736 52 Q800 22 864 52 L852 56 Q800 34 748 56 Z" fill="${n ? "#0f172a" : "#334155"}" stroke="#d4af37" stroke-width="1.2"/>
          <rect x="754" y="54" width="6" height="94" fill="#7c2d12"/>
          <rect x="840" y="54" width="6" height="94" fill="#7c2d12"/>
          <circle cx="800" cy="56" r="6" fill="${n ? "#fde047" : "#ef4444"}" filter="url(#hsGlowSm)"/>
          <rect x="719" y="148" width="201" height="60" fill="${n ? "#5c3b20" : "#a87442"}"/>
          ${perspFloor(148, 720, 920, "#451a03", 0.3, 44)}
          <!-- Guqin / Tea Zither Table -->
          <g transform="translate(800, 152)">
            <rect x="-24" y="-12" width="48" height="5" rx="2" fill="#5c2d0e" stroke="#d4af37" stroke-width="0.9"/>
            <line x1="-18" y1="-7" x2="-18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/>
            <line x1="18" y1="-7" x2="18" y2="4" stroke="#5c2d0e" stroke-width="2.4"/>
            <path d="M-20 -13 L20 -13 L16 -17 L-18 -17 Z" fill="#92400e" stroke="#fbbf24" stroke-width="0.7"/>
          </g>
        </g>`;
    }
    return "";
  }

  // ============================================================
  // PART 2: T7 — 5 FULL 1080px 3-WING WORLD WONDER SANCTUARIES!
  // ============================================================

  // T7-1: 🌋 熔岩黑曜石堡 (1080px: 熔岩主殿 -> 龙焰锻炉 -> 赤金火山祭坛)
  R.registerHouseArt("obsidian_fortress", (dp) => {
    const s = skyOf(dp);
    const id = `ob3_${s.phase}`;
    const lit = s.isNight || s.isDusk;
    const bg = s.isNight ? ["#0e0407", "#360a0d", "#9a3412"]
      : (s.isDusk ? ["#3b0764", "#c2410c", "#fbbf24"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fdba74"] : ["#38bdf8", "#bae6fd", "#fed7aa"]));
    const stone = s.isNight ? "#18141c" : (s.isDusk ? "#2d1b24" : "#57534e");
    const flr = s.isNight ? "#16141a" : (s.isDusk ? "#292226" : "#a8a29e");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="56%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient>
      </defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? genStars(20, 1060, 32, 71, 88) : `<circle cx="560" cy="${s.isDusk ? 54 : 40}" r="22" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92" filter="url(#hsGlowLg)"/>`}
      <!-- Sweeping volcanic mountain range across 1080px -->
      <path d="M0 148 L70 84 L145 126 L230 68 L320 118 L430 62 L540 112 L640 52 L750 118 L860 66 L965 120 L1080 78 L1080 148 Z" fill="${s.isNight ? "#1c0d10" : "#574742"}" opacity="0.82"/>
      <!-- Giant active caldera smoking cone at center Wing 2 (x=640) -->
      <path d="M568 148 L618 62 L662 62 L712 148 Z" fill="${s.isNight ? "#14090c" : "#443632"}"/>
      <ellipse cx="640" cy="62" rx="22" ry="6" fill="#f97316" filter="url(#hsGlowMd)" class="h-pulse"/>
      <!-- Four dramatic molten lava waterfalls -->
      ${[64, 344, 628, 974].map(lx => `
        <rect x="${lx}" y="26" width="24" height="122" fill="#ea580c" opacity="0.9" filter="url(#hsGlowSm)"/>
        <line x1="${lx + 12}" y1="26" x2="${lx + 12}" y2="148" stroke="#fef08a" stroke-width="5" stroke-dasharray="14 8" class="h-flow-rev"/>
      `).join("")}
      <!-- Gothic Basalt Vaulted Cathedral Arches spanning all 3 wings -->
      <path d="M0 0 H1080 V38 Q945 8 810 38 Q675 8 540 38 Q405 8 270 38 Q135 8 0 38 Z" fill="${stone}" stroke="#f59e0b" stroke-width="1.6"/>
      ${[126, 286, 446, 766, 916].map(cx => `
        <rect x="${cx}" y="22" width="22" height="126" fill="${stone}" stroke="#f59e0b" stroke-width="1.2"/>
        <line x1="${cx + 11}" y1="38" x2="${cx + 11}" y2="134" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="6 6" class="h-pulse"/>
      `).join("")}
      <!-- Wing 2: Suspended Dragonflame Rune Anvil Forge (x=540) -->
      <g transform="translate(540, 142)">
        <ellipse cx="0" cy="4" rx="46" ry="8" fill="#f97316" opacity="0.34" filter="url(#hsGlowSm)"/>
        <polygon points="-36,4 -28,-16 28,-16 36,4" fill="#27272a" stroke="#f59e0b" stroke-width="1.4"/>
        <path d="M-20 -16 L-26 -30 H26 L18 -16 Z" fill="#18181b" stroke="#fbbf24" stroke-width="1.4"/>
        <circle cx="0" cy="-38" r="10" fill="#fde047" opacity="0.72" filter="url(#hsGlowMd)" class="h-pulse"/>
      </g>
      <!-- Wing 3: Molten Obsidian Dragon Altar & Spire (x=860) -->
      <g transform="translate(860, 146)">
        <polygon points="-38,0 -26,-52 0,-74 26,-52 38,0" fill="#18121e" stroke="url(#hsGoldH)" stroke-width="1.8"/>
        <circle cx="0" cy="-38" r="14" fill="#ea580c" stroke="#fef08a" stroke-width="1.8" filter="url(#hsGlowMd)" class="h-pulse"/>
      </g>
      <!-- Glowing Obsidian Floor with Magma Veins across 1080px -->
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, "#f97316", 0.28, 72)}
      <path d="M40 172 L130 182 L210 168 M470 178 L580 166 L690 184 M820 170 L940 186 L1040 168" fill="none" stroke="#f97316" stroke-width="1.4" opacity="0.65"/>
      <line x1="0" y1="148" x2="1080" y2="148" stroke="#f97316" stroke-width="2.6" ${lit ? 'filter="url(#hsGlowSm)"' : ""}/>
    `;
  });

  // T7-2: 🏛️ 海底水晶神殿 (1080px: 珍珠主殿 -> 巨幕深海鲸鱼穹顶 -> 海王三叉戟圣坛)
  R.registerHouseArt("atlantis", (dp) => {
    const s = skyOf(dp);
    const id = `at3_${s.phase}`;
    const sea = s.isNight ? ["#031e36", "#054a75", "#042238"]
      : (s.isDusk ? ["#1e3a5f", "#0e7490", "#b45309"] : (s.isDawn ? ["#0284c7", "#38bdf8", "#fbcfe8"] : ["#0284c7", "#38bdf8", "#7dd3fc"]));
    const flr = s.isNight ? "#0d354d" : (s.isDusk ? "#1e4b63" : "#bae6fd");
    return `
      <defs>
        <linearGradient id="${id}_sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sea[0]}"/><stop offset="52%" stop-color="${sea[1]}"/><stop offset="100%" stop-color="${sea[2]}"/></linearGradient>
        <linearGradient id="${id}_ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0f2fe" stop-opacity="${s.isNight ? "0.24" : "0.48"}"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="1080" height="208" fill="url(#${id}_sea)"/>
      <!-- Volumetric ocean light shafts across all 3 wings -->
      <g class="h-aurora">
        <polygon points="80,0 140,0 84,148 34,148" fill="url(#${id}_ray)"/>
        <polygon points="360,0 440,0 384,148 310,148" fill="url(#${id}_ray)"/>
        <polygon points="640,0 730,0 670,148 590,148" fill="url(#${id}_ray)"/>
        <polygon points="900,0 976,0 924,148 854,148" fill="url(#${id}_ray)"/>
      </g>
      <!-- Distant sunken Atlantis ruins & coral reefs across seabed -->
      <path d="M0 148 Q160 118 320 138 Q540 104 760 136 Q930 112 1080 134 L1080 148 Z" fill="${s.isNight ? "#062c44" : "#0369a1"}" opacity="0.55"/>
      <!-- Wing 2: Gliding Abyssal Manta Rays + Glowing Coral Reef -->
      <path d="M510 56 Q542 40 578 52 Q554 64 548 76 Q538 62 510 56 Z" fill="${s.isNight ? "#0c4a6e" : "#0284c7"}" opacity="0.72" class="h-drift-slow"/>
      <g class="h-float" filter="url(#hsGlowSm)">
        <path d="M318 58 A14 11 0 0 1 346 58 Q332 62 318 58 Z" fill="#f472b6" opacity="0.82"/>
        <path d="M324 59 Q320 68 325 77 M332 60 Q334 70 331 82 M340 59 Q344 68 339 77" stroke="#fbcfe8" stroke-width="1.1" fill="none"/>
      </g>
      <g class="h-float-slow" transform="translate(680, 44)" filter="url(#hsGlowSm)">
        <path d="M-16 0 A16 12 0 0 1 16 0 Q0 4 -16 0 Z" fill="#38bdf8" opacity="0.82"/>
        <path d="M-10 2 Q-12 14 -8 24 M0 3 Q2 16 -2 28 M10 2 Q13 14 9 24" stroke="#bae6fd" stroke-width="1.1" fill="none"/>
      </g>
      <!-- Three Grand Faceted Crystal Cathedral Domes! -->
      ${[210, 560, 910].map(cx => `
        <path d="M${cx - 170} 148 V72 A170 76 0 0 1 ${cx + 170} 72 V148" fill="none" stroke="${s.isNight ? "#7dd3fc" : "#ffffff"}" stroke-width="2.4" opacity="0.72"/>
        <path d="M${cx - 144} 148 V78 A144 62 0 0 1 ${cx + 144} 78 V148" fill="none" stroke="#e0f2fe" stroke-width="1.1" opacity="0.46"/>
      `).join("")}
      <!-- Fluted Pearl-Marble Corinthian Columns with 24K Gold Capitals -->
      ${[26, 376, 728, 1034].map(cx => `
        <rect x="${cx}" y="44" width="20" height="104" rx="2" fill="url(#hsIvory)" opacity="${s.isNight ? "0.85" : "0.95"}"/>
        <line x1="${cx + 6}" y1="48" x2="${cx + 6}" y2="144" stroke="#94a3b8" stroke-width="0.9"/>
        <line x1="${cx + 14}" y1="48" x2="${cx + 14}" y2="144" stroke="#94a3b8" stroke-width="0.9"/>
        <rect x="${cx - 4}" y="39" width="28" height="6.5" rx="2" fill="url(#hsGoldH)"/>
      `).join("")}
      <!-- Wing 3: Glowing Poseidon Trident Sanctuary Pedestal (x=910) -->
      <g transform="translate(910, 146)">
        <rect x="-34" y="-12" width="68" height="12" rx="3" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.4"/>
        <line x1="0" y1="-12" x2="0" y2="-76" stroke="url(#hsGoldV)" stroke-width="3.2"/>
        <path d="M-16 -62 Q-16 -46 0 -46 Q16 -46 16 -62" fill="none" stroke="url(#hsGoldH)" stroke-width="2.6"/>
        <polygon points="0,-86 -4,-74 4,-74" fill="#fef08a" filter="url(#hsGlowSm)"/>
        <polygon points="-16,-70 -20,-58 -12,-58" fill="#fef08a"/>
        <polygon points="16,-70 12,-58 20,-58" fill="#fef08a"/>
      </g>
      <!-- Rising Bubbles -->
      ${[88, 290, 480, 620, 810, 990].map((bx, i) => `<circle cx="${bx}" cy="${62 + (i % 3) * 18}" r="${2.5 + (i % 3)}" fill="none" stroke="#e0f2fe" stroke-width="1.1" class="${i % 2 ? "h-steam" : "h-steam-d1"}"/>`).join("")}
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#38bdf8" : "#ffffff", 0.34, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="${s.isNight ? "#38bdf8" : "#ffffff"}" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // T7-3: ☁️ 天空之城浮岛宫 (1080px: 羽翼主殿 -> 云海彩虹天桥长廊 -> 浮空飞艇港)
  R.registerHouseArt("sky_castle", (dp) => {
    const s = skyOf(dp);
    const id = `sc3_${s.phase}`;
    const bg = s.isNight ? ["#080d22", "#1e1b4b", "#312e81"]
      : (s.isDusk ? ["#4338ca", "#f472b6", "#fde68a"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fef9c3"] : ["#0284c7", "#7dd3fc", "#fffbeb"]));
    const cl1 = s.isNight ? "#475569" : (s.isDusk ? "#fbcfe8" : "#ffffff");
    const cl2 = s.isNight ? "#334155" : (s.isDusk ? "#fed7aa" : "#fffbeb");
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? `${genStars(20, 1060, 36, 82, 92)}${moonCrescent(890, 38, 16, bg[0])}` : `<circle cx="890" cy="${s.isDusk ? 46 : 36}" r="18" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92" filter="url(#hsGlowLg)"/>`}
      <!-- Rainbow horizon arc over Wing 2 -->
      <path d="M360 148 A200 124 0 0 1 760 148" fill="none" stroke="url(#hsPrism)" stroke-width="10" opacity="${s.isNight ? "0.26" : "0.52"}" filter="url(#hsGlowSm)"/>
      <!-- Multiple Floating Sky Islands with Spires & Waterfalls -->
      ${[[210, 74, 1], [560, 62, 1.15], [880, 78, 0.9]].map(([ix, iy, sc]) => `
        <g class="h-float-slow" transform="translate(${ix}, ${iy}) scale(${sc})">
          <path d="M-38 14 L0 38 L38 14 Z" fill="${s.isNight ? "#475569" : "#94a3b8"}"/>
          <rect x="-26" y="-8" width="52" height="22" fill="${s.isNight ? "#cbd5e1" : "url(#hsIvory)"}" stroke="#94a3b8" stroke-width="0.9"/>
          <polygon points="-24,-8 -16,-24 -8,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/>
          <polygon points="8,-8 16,-24 24,-8" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}"/>
          <polygon points="-8,-8 0,-34 8,-8" fill="#fbbf24"/>
        </g>
      `).join("")}
      <!-- Volumetric Cloud Sea across 1080px -->
      <g class="h-drift-slow" opacity="${s.isNight ? "0.78" : "0.94"}">
        ${[70, 190, 340, 480, 640, 790, 940, 1040].map((cx, i) => `<ellipse cx="${cx}" cy="${128 + (i % 2) * 10}" rx="${54 + (i % 3) * 14}" ry="${18 + (i % 2) * 6}" fill="${i % 2 ? cl2 : cl1}"/>`).join("")}
      </g>
      <!-- Grand Ivory Sky-Palace Colonnade + Wing 2 Balustrade + Wing 3 Airship Mooring Spire -->
      <path d="M0 0 H420 V24 Q210 6 0 24 Z M720 0 H1080 V24 Q900 6 720 24 Z" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      ${[26, 376, 740, 1036].map(cx => `
        <rect x="${cx}" y="20" width="18" height="128" fill="${flr}" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="${cx - 4}" y="20" width="26" height="7" rx="2" fill="url(#hsGoldH)"/>
      `).join("")}
      <!-- Wing 2 Open-Air Marble Cloud Balustrade -->
      <line x1="394" y1="126" x2="740" y2="126" stroke="url(#hsGoldH)" stroke-width="3"/>
      ${[430, 480, 530, 580, 630, 680, 720].map(bx => `<rect x="${bx}" y="126" width="5" height="22" fill="${flr}" stroke="#cbd5e1" stroke-width="0.7"/>`).join("")}
      <!-- Wing 3 Mooring Crystal Tower -->
      <g transform="translate(910, 146)">
        <polygon points="-24,0 -12,-70 0,-86 12,-70 24,0" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.6"/>
        <circle cx="0" cy="-94" r="9" fill="#38bdf8" stroke="#fef08a" stroke-width="1.6" filter="url(#hsGlowMd)" class="h-pulse"/>
      </g>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#64748b" : "#d4af37", 0.25, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6"/>
    `;
  });

  // T7-4: ❄️ 极光冰晶宫殿 (1080px: 哥特冰殿 -> 极光镜湖大厅 -> 永冬冰风铃圣殿)
  R.registerHouseArt("aurora_ice_palace", (dp) => {
    const s = skyOf(dp);
    const id = `ai3_${s.phase}`;
    const bg = s.isNight ? ["#030f22", "#0a2d54", "#19527a"]
      : (s.isDusk ? ["#312e81", "#7e22ce", "#fbcfe8"] : (s.isDawn ? ["#38bdf8", "#bae6fd", "#fce7f3"] : ["#0ea5e9", "#7dd3fc", "#f0f9ff"]));
    const mtn = s.isNight ? "#0f3a60" : (s.isDusk ? "#4c1d95" : "#7dd3fc");
    const flr = s.isNight ? "#0e3a5c" : (s.isDusk ? "#3b2f63" : "#bae6fd");
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight || s.isDusk ? `${genStars(16, 1064, 34, 91, 84)}
        <g class="h-aurora" filter="url(#hsGlowMd)" opacity="${s.isNight ? "0.95" : "0.66"}">
          <path d="M0 44 Q180 6 360 38 Q540 70 720 26 Q900 58 1080 20" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="24" opacity="0.78"/>
          <path d="M40 68 Q260 28 490 56 Q720 82 1040 36" fill="none" stroke="url(#hsAuroraGold)" stroke-width="13" opacity="0.54"/>
        </g>`
      : `<circle cx="540" cy="46" r="24" fill="#ffffff" opacity="0.82" filter="url(#hsGlowLg)"/>
         <circle cx="540" cy="46" r="46" fill="none" stroke="#e0f2fe" stroke-width="1.6" opacity="0.68"/>`}
      <!-- Snow-Capped Arctic Fjord Mountain Range -->
      <path d="M0 148 L80 96 L160 132 L260 82 L370 128 L490 74 L610 126 L730 80 L850 130 L960 88 L1080 148 Z" fill="${mtn}" opacity="0.8"/>
      <!-- Sweeping Gothic Ice-Crystal Cathedral Arches across all 3 wings -->
      ${[0, 360, 720].map(ox => `
        <path d="M${ox} 0 H${ox + 360} V38 Q${ox + 270} 6 ${ox + 180} 48 Q${ox + 90} 6 ${ox} 38 Z" fill="${s.isNight ? "#7dd3fc" : "#ffffff"}" fill-opacity="${s.isNight ? "0.22" : "0.42"}" stroke="#e0f2fe" stroke-width="1.4"/>
        <rect x="${ox + 174}" y="46" width="12" height="102" fill="${s.isNight ? "#7dd3fc" : "#ffffff"}" fill-opacity="0.26" stroke="#bae6fd" stroke-width="1"/>
      `).join("")}
      <!-- Wing 3: Giant Floating Crystal Wind-Chime Prism (x=900) -->
      <g transform="translate(900, 78)" class="h-float" filter="url(#hsGlowMd)">
        <polygon points="0,-34 18,0 0,34 -18,0" fill="#e0f2fe" fill-opacity="0.55" stroke="#ffffff" stroke-width="1.6"/>
        <line x1="0" y1="-34" x2="0" y2="34" stroke="#38bdf8" stroke-width="1.2"/>
      </g>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      <rect x="0" y="148" width="1080" height="60" fill="url(#hsGlassSheen)" opacity="0.55"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#bae6fd" : "#ffffff", 0.36, 72)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="${s.isNight ? "#7dd3fc" : "#ffffff"}" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // T7-5: 🏺 空中花园黄金阁 (1080px: 巴比伦主廊 -> 三层瀑布花瀑中庭 -> 黄金蝴蝶穹顶亭)
  R.registerHouseArt("hanging_gardens", (dp) => {
    const s = skyOf(dp);
    const id = `hg3_${s.phase}`;
    const bg = s.isNight ? ["#090f24", "#1e293b", "#312e81"]
      : (s.isDusk ? ["#7c2d12", "#f97316", "#fde68a"] : (s.isDawn ? ["#60a5fa", "#fbcfe8", "#fef3c7"] : ["#0ea5e9", "#bae6fd", "#fef3c7"]));
    const flr = s.isNight ? "#cbd5e1" : "url(#hsIvory)";
    const vine = s.isNight ? "#14532d" : "#22c55e";
    return `
      <defs><linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="52%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient></defs>
      <rect width="1080" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight ? `${genStars(20, 1060, 32, 102, 86)}${moonCrescent(890, 38, 15, bg[0])}` : `<circle cx="890" cy="${s.isDusk ? 46 : 36}" r="17" fill="${s.isDusk ? "#fb923c" : "#fde047"}" opacity="0.92" filter="url(#hsGlowLg)"/>`}
      <!-- Wing 2: Stepped 3-Tier Babylonian Hanging Waterfall Citadel -->
      <rect x="420" y="96" width="240" height="52" fill="${s.isNight ? "#94a3b8" : "#f3ead8"}" stroke="#d4af37" stroke-width="1.3"/>
      <rect x="456" y="68" width="168" height="28" fill="${s.isNight ? "#cbd5e1" : "#faf4e6"}" stroke="#d4af37" stroke-width="1.3"/>
      <rect x="496" y="46" width="88" height="22" fill="${flr}" stroke="#d4af37" stroke-width="1.2"/>
      <rect x="524" y="48" width="32" height="100" fill="${s.isNight ? "#1d4ed8" : "#38bdf8"}" opacity="0.82"/>
      <line x1="540" y1="48" x2="540" y2="148" stroke="#e0f2fe" stroke-width="5" stroke-dasharray="10 6" class="h-flow-rev"/>
      <!-- Grand Ivory-Gold Colonnade across 1080px -->
      <rect x="0" y="0" width="1080" height="24" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      ${[28, 366, 704, 1034].map(cx => `<rect x="${cx}" y="24" width="22" height="124" fill="${flr}" stroke="url(#hsGoldH)" stroke-width="1.4"/>`).join("")}
      <!-- Lush Hanging Emerald Vines & Golden Flowers -->
      ${[76, 134, 316, 444, 636, 770, 960].map((vx, i) => `
        <path d="M${vx} 24 Q${vx - 8} 60 ${vx + 4} 94 Q${vx - 4} 116 ${vx + 4} 130" stroke="${s.isNight ? "#052e16" : "#15803d"}" stroke-width="2.6" fill="none" class="h-drift-slow"/>
        <circle cx="${vx}" cy="${56 + (i % 2) * 14}" r="6" fill="${vine}"/>
        <circle cx="${vx + 2}" cy="${82 + (i % 3) * 8}" r="5.5" fill="${vine}"/>
        <circle cx="${vx}" cy="${66 + (i % 2) * 16}" r="3.2" fill="${i % 2 ? "#fde047" : "#f472b6"}"/>
      `).join("")}
      <!-- Wing 3: Golden Butterfly Rotunda Gazebo (x=880) -->
      <path d="M812 148 V66 A68 38 0 0 1 948 66 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="3.2"/>
      <circle cx="880" cy="30" r="7" fill="#fef08a" stroke="#d97706" stroke-width="1.4" filter="url(#hsGlowSm)"/>
      <rect x="0" y="148" width="1080" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1080, s.isNight ? "#64748b" : "#d4af37", 0.25, 68)}
      <line x1="0" y1="148" x2="1080" y2="148" stroke="url(#hsGoldH)" stroke-width="2.6"/>
    `;
  });

  // ============================================================
  // PART 3: T8 — 5 FULL 1240px EPIC INTERSTELLAR PANORAMAS!
  // (Panoramic Multi-Planet Views, Nebulae, Stars, Spaceships, Observatories!)
  // ============================================================

  // T8-1: 🌕 月球静海科研舱 (1240px: 生态科研舱 -> 巨幕地出+土星+星云观测廊 -> 玉兔发射台)
  R.registerHouseArt("lunar_base", (dp) => {
    const s = skyOf(dp);
    const id = `lb4_${s.phase}`;
    const sky = s.isNight ? ["#030612", "#090f24"] : (s.isDusk ? ["#171238", "#3b1768"] : (s.isDawn ? ["#0f2557", "#3b82f6"] : ["#0c2461", "#38bdf8"]));
    const surf = s.isNight ? "#475569" : (s.isDusk ? "#78716c" : "#cbd5e1");
    const crat = s.isNight ? "#334155" : (s.isDusk ? "#57534e" : "#94a3b8");
    const flr = s.isNight ? "#162033" : (s.isDusk ? "#334155" : "#e2e8f0");
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="100%" stop-color="${sky[1]}"/></linearGradient>
        <radialGradient id="${id}_earth" cx="38%" cy="35%" r="65%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="55%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#0f172a"/></radialGradient>
        <linearGradient id="${id}_sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="url(#${id}_sky)"/>
      <!-- Vast Deep-Space Starfield & Colorful Nebulae -->
      <ellipse cx="480" cy="48" rx="140" ry="30" transform="rotate(-10 480 48)" fill="#7c3aed" opacity="0.22" filter="url(#hsGlowMd)"/>
      <ellipse cx="940" cy="52" rx="150" ry="32" transform="rotate(8 940 52)" fill="#06b6d4" opacity="0.18" filter="url(#hsGlowMd)"/>
      ${genStars(12, 1228, 72, 111, 108)}
      <!-- Planet 1: Grand Blue Earthrise with swirling clouds (x=310) -->
      <g transform="translate(310, 56)" class="h-float-slow">
        <circle cx="0" cy="0" r="39" fill="#38bdf8" opacity="0.24" filter="url(#hsGlowMd)"/>
        <circle cx="0" cy="0" r="31" fill="url(#${id}_earth)" stroke="#93c5fd" stroke-width="1.3"/>
        <path d="M-18 -10 Q-2 -22 12 -8 Q20 2 6 16 Q-10 20 -16 6 Z" fill="#22c55e" opacity="0.78"/>
        <path d="M-25 3 Q0 -8 25 5" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.76" stroke-linecap="round"/>
      </g>
      <!-- Planet 2: Distant Ringed Saturn (x=660) -->
      <g transform="translate(660, 52)" class="h-float">
        <ellipse cx="0" cy="0" rx="44" ry="10" transform="rotate(-16)" fill="none" stroke="#fde68a" stroke-width="3.2" opacity="0.78"/>
        <circle cx="0" cy="0" r="19" fill="url(#${id}_sat)"/>
        <path d="M-42 12 A44 10 -16 0 0 42 -12" fill="none" stroke="#fef3c7" stroke-width="2.8" opacity="0.9"/>
      </g>
      <!-- Planet 3: Swirling Rose-Gold Gas Giant Jupiter (x=990) -->
      <g transform="translate(990, 58)" class="h-float-slow">
        <circle cx="0" cy="0" r="24" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
        <path d="M-22 -6 Q0 -11 22 -5 M-23 4 Q0 0 23 5 M-19 12 Q0 9 19 13" stroke="#fef3c7" stroke-width="2.4" fill="none" opacity="0.62"/>
        <ellipse cx="7" cy="6" rx="5.5" ry="3.2" fill="#dc2626" opacity="0.82"/>
      </g>
      <!-- Lunar Tranquility Surface & Craters across 1240px -->
      <path d="M0 116 Q160 100 320 118 Q520 128 720 108 Q960 124 1240 104 L1240 148 L0 148 Z" fill="${surf}"/>
      ${[96, 360, 560, 810, 1080].map((cx, i) => `<ellipse cx="${cx}" cy="${128 + (i % 2) * 5}" rx="${26 + (i % 3) * 8}" ry="7.5" fill="${crat}" stroke="#94a3b8" stroke-width="0.9"/>`).join("")}
      <!-- Lunar Rover on Horizon (x=760) -->
      <g transform="translate(760, 124)">
        <rect x="-14" y="-8" width="28" height="7" rx="2" fill="#f8fafc" stroke="#64748b" stroke-width="0.9"/>
        <line x1="-8" y1="-8" x2="-8" y2="-18" stroke="#cbd5e1" stroke-width="1.5"/>
        <circle cx="-8" cy="-19" r="2.4" fill="#38bdf8" filter="url(#hsGlowSm)"/>
        <circle cx="-9" cy="1" r="3.2" fill="#0f172a"/><circle cx="0" cy="1" r="3.2" fill="#0f172a"/><circle cx="9" cy="1" r="3.2" fill="#0f172a"/>
      </g>
      <!-- Triple Interconnected Pressurized Geodesic Domes -->
      ${[0, 413, 826].map(ox => `
        <path d="M${ox} 148 Q${ox + 206} -16 ${ox + 414} 148" fill="none" stroke="${s.isNight ? "#94a3b8" : "#ffffff"}" stroke-width="2.8" opacity="0.68"/>
        <path d="M${ox + 64} 148 L${ox + 124} 64 L${ox + 207} 46 L${ox + 290} 64 L${ox + 350} 148" fill="none" stroke="#64748b" stroke-width="1.2" opacity="0.45"/>
      `).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.25, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // T8-2: 🚀 太空火箭舱 (1240px: 曲率舰桥 -> 270°全景星舰观景长廊 -> 曲率引擎花园舱)
  R.registerHouseArt("rocket", (dp) => {
    const s = skyOf(dp);
    const id = `rk4_${s.phase}`;
    const hull = s.isNight ? "#1e293b" : (s.isDusk ? "#475569" : "#cbd5e1");
    const deck = s.isNight ? "#0c1322" : (s.isDusk ? "#263147" : "#cbd5e1");
    return `
      <defs>
        <linearGradient id="${id}_sp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#020617"/><stop offset="50%" stop-color="${s.isNight ? "#1e1b4b" : "#0c2d57"}"/><stop offset="100%" stop-color="#090d1f"/></linearGradient>
        <linearGradient id="${id}_sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="${hull}"/>
      <!-- Massive Panoramic Starship Hull Window spanning x=24..1216! -->
      <rect x="24" y="14" width="1192" height="128" rx="18" fill="url(#${id}_sp)" stroke="#38bdf8" stroke-width="2"/>
      ${genStars(32, 1208, 76, 123, 128)}
      <ellipse cx="320" cy="64" rx="110" ry="26" transform="rotate(-16 320 64)" fill="#a855f7" opacity="0.24" filter="url(#hsGlowMd)"/>
      <ellipse cx="860" cy="72" rx="130" ry="28" transform="rotate(12 860 72)" fill="#0ea5e9" opacity="0.22" filter="url(#hsGlowMd)"/>
      <!-- Saturn + Spiral Galaxy + Warp Core visible through panoramic bridge -->
      <g transform="translate(310, 76)" class="h-float-slow">
        <ellipse cx="0" cy="0" rx="48" ry="11" transform="rotate(-18)" fill="none" stroke="#fde68a" stroke-width="3.2" opacity="0.82"/>
        <circle cx="0" cy="0" r="22" fill="url(#${id}_sat)"/>
        <path d="M-46 14 A48 11 -18 0 0 46 -14" fill="none" stroke="#fef3c7" stroke-width="2.6" opacity="0.9"/>
      </g>
      <g transform="translate(740, 74)" class="h-spin-slow" opacity="0.72">
        <ellipse cx="0" cy="0" rx="68" ry="22" transform="rotate(-14)" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="6" filter="url(#hsGlowMd)"/>
        <circle cx="0" cy="0" r="10" fill="#fffbeb" filter="url(#hsGlowSm)"/>
      </g>
      <!-- Aerospace Bulkhead Ribs dividing Bridge / Observatory / Warp Bay -->
      ${[188, 520, 940].map(rx => `
        <rect x="${rx}" y="14" width="18" height="128" fill="${hull}" stroke="#64748b" stroke-width="1.4"/>
        <line x1="${rx + 9}" y1="22" x2="${rx + 9}" y2="136" stroke="#38bdf8" stroke-width="1.4" opacity="0.7"/>
      `).join("")}
      <!-- Wing 1 Flight Telemetry Console -->
      <rect x="44" y="42" width="118" height="58" rx="7" fill="#081222" stroke="#38bdf8" stroke-width="1.4"/>
      <text x="150" y="57" font-size="6.5" font-family="monospace" font-weight="800" fill="#7dd3fc" text-anchor="end">WARP 9.9</text>
      <path d="M56 78 L72 68 L88 82 L106 66 L124 78 L146 70" fill="none" stroke="#22d3ee" stroke-width="1.7" stroke-dasharray="6 3" class="h-flow"/>
      <!-- Wing 3 Glowing Warp Engine Reactor Column (x=1080) -->
      <g transform="translate(1080, 78)">
        <rect x="-18" y="-62" width="36" height="124" fill="#0f172a" stroke="#38bdf8" stroke-width="1.6"/>
        <rect x="-8" y="-56" width="16" height="112" fill="#38bdf8" opacity="0.72" filter="url(#hsGlowMd)" class="h-pulse"/>
        <line x1="-18" y1="-26" x2="18" y2="-26" stroke="#f59e0b" stroke-width="2.2"/>
        <line x1="-18" y1="26" x2="18" y2="26" stroke="#f59e0b" stroke-width="2.2"/>
      </g>
      <rect x="0" y="148" width="1240" height="60" fill="${deck}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.25, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // T8-3: 🛰️ 火星红岩生态穹顶 (1240px: 水手峡谷生态舱 -> 全景红岩火星双月观测廊 -> 火星星港)
  R.registerHouseArt("mars_dome", (dp) => {
    const s = skyOf(dp);
    const id = `md4_${s.phase}`;
    const sky = s.isNight ? ["#0a0714", "#280f14", "#5c1d14"] : (s.isDusk ? ["#2c1028", "#9a3412", "#7dd3fc"] : ["#c2410c", "#fb923c", "#ffedd5"]);
    const m1 = s.isNight ? "#431407" : "#b45309";
    const m2 = s.isNight ? "#5c200c" : "#ea580c";
    const flr = s.isNight ? "#27272a" : "#e7e5e4";
    return `
      <defs><linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sky[0]}"/><stop offset="56%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[2]}"/></linearGradient></defs>
      <rect width="1240" height="208" fill="url(#${id}_sky)"/>
      ${s.isNight || s.isDusk ? `${genStars(20, 1220, 56, 134, 86)}
        <circle cx="620" cy="40" r="11" fill="#cbd5e1" opacity="0.9"/><circle cx="584" cy="30" r="5" fill="#94a3b8" opacity="0.82"/>`
      : `<circle cx="620" cy="40" r="16" fill="#fffbeb" opacity="0.92" filter="url(#hsGlowMd)"/>`}
      <path d="M0 112 L90 78 L180 108 L290 72 L420 112 L540 68 L670 114 L810 74 L940 110 L1080 76 L1240 102 L1240 148 L0 148 Z" fill="${m1}"/>
      <path d="M0 130 Q260 114 540 130 Q840 116 1240 126 L1240 148 L0 148 Z" fill="${m2}"/>
      <!-- Mars Bio-Pod Greenhouse Trees + Mars Rover Convoy -->
      ${[520, 740].map(rx => `
        <g transform="translate(${rx}, 134)">
          <rect x="-14" y="-8" width="28" height="6.5" rx="1.5" fill="#e2e8f0"/>
          <line x1="-8" y1="-8" x2="-8" y2="-16" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="-8" cy="-17" r="2.2" fill="#38bdf8"/>
          <circle cx="-9" cy="0" r="3" fill="#1e293b"/><circle cx="0" cy="0" r="3" fill="#1e293b"/><circle cx="9" cy="0" r="3" fill="#1e293b"/>
        </g>`).join("")}
      ${[0, 413, 826].map(ox => `
        <path d="M${ox} 148 C${ox + 36} 12 ${ox + 378} 12 ${ox + 414} 148" fill="url(#hsGlassSheen)" opacity="0.2" stroke="#f8fafc" stroke-width="2.6"/>
        <line x1="${ox + 207}" y1="30" x2="${ox + 207}" y2="148" stroke="#cbd5e1" stroke-width="1.4" opacity="0.45"/>
      `).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#fb923c", 0.28, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#fb923c" stroke-width="2.4"/>
    `;
  });

  // T8-4: 🪐 土星冰环观景站 (1240px: 白金环形主厅 -> 巨幅卡西尼冰环擦窗画廊 -> 轨道跃迁实验室)
  R.registerHouseArt("saturn_ring_station", (dp) => {
    const s = skyOf(dp);
    const id = `sr4_${s.phase}`;
    const bg = s.isNight ? ["#040714", "#1b1745", "#2e2870"] : (s.isDusk ? ["#312e81", "#7c2d6e", "#f59e0b"] : ["#0284c7", "#7dd3fc", "#fef3c7"]);
    const deck = s.isNight ? "#162033" : (s.isDusk ? "#334155" : "#e2e8f0");
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="60%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient>
        <linearGradient id="${id}_pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffbeb"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
      </defs>
      <rect width="1240" height="208" fill="url(#${id}_bg)"/>
      ${genStars(16, 1224, 72, 145, 118)}
      <!-- Colossal Banded Saturn + Wide Grazing Icy Rings spanning Wing 1..Wing 3! -->
      <ellipse cx="640" cy="94" rx="380" ry="38" transform="rotate(-9 640 94)" fill="none" stroke="#e0f2fe" stroke-width="11" opacity="0.52"/>
      <circle cx="640" cy="94" r="56" fill="url(#${id}_pl)" filter="url(#hsGlowMd)"/>
      <path d="M588 80 Q640 88 692 76 M586 102 Q640 110 694 98" stroke="#92400e" stroke-width="3" fill="none" opacity="0.34"/>
      <path d="M266 154 A380 38 -9 0 0 1014 34" fill="none" stroke="#e0f2fe" stroke-width="11" opacity="0.82"/>
      <path d="M310 146 A330 30 -9 0 0 970 42" fill="none" stroke="#fde68a" stroke-width="3.5" stroke-dasharray="22 10" class="h-flow"/>
      <!-- Platinum Station Framing -->
      <rect x="0" y="0" width="1240" height="20" fill="${deck}"/>
      <line x1="0" y1="20" x2="1240" y2="20" stroke="#38bdf8" stroke-width="1.8"/>
      ${[22, 412, 826, 1204].map(px => `<rect x="${px}" y="20" width="14" height="128" fill="${deck}" stroke="#38bdf8" stroke-width="1"/>`).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${deck}"/>
      ${perspFloor(148, 0, 1240, "#38bdf8", 0.26, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="#38bdf8" stroke-width="2.4" filter="url(#hsGlowSm)"/>
    `;
  });

  // T8-5: ☀️ 戴森球恒星殿 (1240px: 黄金蜂巢主殿 -> 燃烧恒星日冕聚能长廊 -> 恒星算力中枢)
  R.registerHouseArt("dyson_sphere", (dp) => {
    const s = skyOf(dp);
    const id = `ds4_${s.phase}`;
    const bg = s.isNight ? ["#fef08a", "#f59e0b", "#451a03", "#090402"] : (s.isDusk ? ["#ffffff", "#fde047", "#ea580c", "#431407"] : ["#ffffff", "#fef9c3", "#fde68a", "#f59e0b"]);
    const pil = s.isNight ? "#18120e" : "#451a03";
    const flr = s.isNight ? "#1c140c" : (s.isDusk ? "#451a03" : "#fef3c7");
    return `
      <defs><radialGradient id="${id}_st" cx="50%" cy="44%" r="60%"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="28%" stop-color="${bg[1]}"/><stop offset="65%" stop-color="${bg[2]}"/><stop offset="100%" stop-color="${bg[3]}"/></radialGradient></defs>
      <rect width="1240" height="208" fill="url(#${id}_st)"/>
      ${s.isNight ? genStars(20, 1220, 48, 156, 118) : ""}
      <!-- Colossal Captive Star & Counter-Rotating 24K Dyson Megastructure Rings at Center Wing 2 -->
      <g transform="translate(620, 78)">
        <circle cx="0" cy="0" r="46" fill="${s.isNight ? "#180a02" : "#ffffff"}" stroke="#fef08a" stroke-width="4" filter="url(#hsGlowLg)" class="h-pulse"/>
        <g class="h-spin-slow"><ellipse cx="0" cy="0" rx="210" ry="42" fill="none" stroke="url(#hsGoldH)" stroke-width="4" stroke-dasharray="28 12"/></g>
        <g class="h-spin-rev"><ellipse cx="0" cy="0" rx="148" ry="30" transform="rotate(-15)" fill="none" stroke="#fef08a" stroke-width="2.6" stroke-dasharray="16 8"/></g>
      </g>
      <!-- Hexagonal Golden Megastructure Buttresses -->
      ${[0, 380, 810, 1180].map(px => `<polygon points="${px},0 ${px + 60},0 ${px + 42},148 ${px + 18},148" fill="${pil}" stroke="url(#hsGoldH)" stroke-width="1.8"/>`).join("")}
      <rect x="0" y="148" width="1240" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1240, "#d97706", 0.26, 76)}
      <line x1="0" y1="148" x2="1240" y2="148" stroke="url(#hsGoldH)" stroke-width="2.8" filter="url(#hsGlowSm)"/>
    `;
  });

  // ============================================================
  // PART 4: T9 — 5 FULL 1400px 4-ZONE DIMENSIONAL SANCTUARIES!
  // ============================================================
  function buildT9Sanctuary(cfg, dp) {
    const s = skyOf(dp);
    const id = `t9_${cfg.key}_${s.phase}`;
    const bg = s.isNight ? cfg.nightBg : (s.isDusk ? cfg.duskBg : cfg.dayBg);
    const flr = s.isNight ? cfg.nightFlr : (s.isDusk ? cfg.duskFlr : cfg.dayFlr);
    return `
      <defs>
        <linearGradient id="${id}_bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="50%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/>
        </linearGradient>
      </defs>
      <rect width="1400" height="208" fill="url(#${id}_bg)"/>
      ${s.isNight || s.isDusk ? genStars(14, 1386, 86, cfg.seed, 122) : `<polygon points="520,0 880,0 980,148 420,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      ${cfg.centerpiece(s)}
      <!-- Four Dimensional Wing Pillars framing the 4 Zones (0..350 | 350..700 | 700..1050 | 1050..1400) -->
      ${[16, 360, 1020, 1364].map(px => `
        <rect x="${px}" y="0" width="20" height="148" fill="${s.isNight ? "url(#hsObsidian)" : "url(#hsIvory)"}" stroke="${cfg.accent}" stroke-width="1.5"/>
        <line x1="${px + 10}" y1="18" x2="${px + 10}" y2="136" stroke="${cfg.accent}" stroke-width="1.5" stroke-dasharray="8 6" class="h-pulse"/>
      `).join("")}
      <rect x="0" y="148" width="1400" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1400, cfg.accent, 0.28, 80)}
      <line x1="0" y1="148" x2="1400" y2="148" stroke="${cfg.accent}" stroke-width="2.6" filter="url(#hsGlowSm)"/>
    `;
  }

  R.registerHouseArt("quantum_mirror", (dp) => buildT9Sanctuary({
    key: "qm", seed: 201, accent: "#38bdf8",
    nightBg: ["#08061a", "#1e1b4b", "#0f172a"], duskBg: ["#3b0764", "#9d174d", "#fbcfe8"], dayBg: ["#bae6fd", "#f0f9ff", "#ede9fe"],
    nightFlr: "#0d1026", duskFlr: "#311842", dayFlr: "#e2e8f0",
    centerpiece: (s) => `
      ${[210, 700, 1190].map((cx, i) => `
        <polygon points="${cx},12 ${cx + 116},80 ${cx},148 ${cx - 116},80" fill="none" stroke="${i === 1 ? "#f472b6" : "#38bdf8"}" stroke-width="1.8" opacity="0.76"/>
        <polygon points="${cx},32 ${cx + 80},80 ${cx},128 ${cx - 80},80" fill="none" stroke="#c084fc" stroke-width="1.5" opacity="0.78"/>
        <polygon points="${cx},50 ${cx + 46},80 ${cx},110 ${cx - 46},80" fill="${s.isNight ? "#22d3ee" : "#ffffff"}" fill-opacity="0.22" stroke="#fde047" stroke-width="1.4" class="h-pulse"/>
      `).join("")}`,
  }, dp));

  R.registerHouseArt("wormhole", (dp) => buildT9Sanctuary({
    key: "wh", seed: 212, accent: "#c084fc",
    nightBg: ["#290c5c", "#120928", "#03020a"], duskBg: ["#6d28d9", "#9d174d", "#1e1b4b"], dayBg: ["#fffbeb", "#bae6fd", "#e0f2fe"],
    nightFlr: "#120a2a", duskFlr: "#2b1347", dayFlr: "#dbeafe",
    centerpiece: (s) => `
      <g transform="translate(700, 74)">
        <ellipse cx="0" cy="0" rx="220" ry="48" fill="none" stroke="#a855f7" stroke-width="3" stroke-dasharray="24 10" class="h-flow" opacity="0.82"/>
        <ellipse cx="0" cy="0" rx="164" ry="34" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="18 8" class="h-flow-rev"/>
        <ellipse cx="0" cy="0" rx="112" ry="22" fill="none" stroke="#f59e0b" stroke-width="2.4" stroke-dasharray="20 6" class="h-flow"/>
        <circle cx="0" cy="0" r="34" fill="${s.isNight ? "#020106" : "#fffbeb"}" stroke="#f59e0b" stroke-width="2.2" filter="url(#hsGlowMd)"/>
        <ellipse cx="0" cy="0" rx="88" ry="10" fill="none" stroke="#fef08a" stroke-width="2.6" filter="url(#hsGlowSm)"/>
      </g>
      ${[210, 480, 920, 1190].map((ox, i) => `
        <g class="${i % 2 ? "h-float" : "h-float-slow"}">
          <polygon points="${ox},30 ${ox + 16},70 ${ox},112 ${ox - 16},70" fill="${s.isNight ? "url(#hsObsidian)" : "url(#hsIvory)"}" stroke="${i % 2 ? "#ec4899" : "#38bdf8"}" stroke-width="1.4"/>
        </g>`).join("")}`,
  }, dp));

  R.registerHouseArt("time_clocktower", (dp) => buildT9Sanctuary({
    key: "tc", seed: 223, accent: "#f59e0b",
    nightBg: ["#2f1552", "#120a22", "#07050f"], duskBg: ["#f59e0b", "#7c2d6e", "#1e1b4b"], dayBg: ["#fffbeb", "#bae6fd", "#38bdf8"],
    nightFlr: "#120c1f", duskFlr: "#2e1a36", dayFlr: "#f3ead8",
    centerpiece: (s) => `
      <g transform="translate(700, 78)">
        <circle cx="0" cy="0" r="72" fill="${s.isNight ? "#1e1b4b" : "#fffbeb"}" fill-opacity="0.62" stroke="url(#hsGoldH)" stroke-width="3"/>
        <g class="h-spin-slow"><circle cx="0" cy="0" r="60" fill="none" stroke="#d97706" stroke-width="5" stroke-dasharray="7 8"/></g>
        <g class="h-spin-rev"><circle cx="0" cy="0" r="38" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="10 6"/></g>
        <line x1="0" y1="0" x2="0" y2="-46" stroke="${s.isNight ? "#fef08a" : "#b45309"}" stroke-width="2.8" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="34" y2="16" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="5.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
      </g>
      ${[210, 490, 910, 1190].map((gx, i) => `
        <g transform="translate(${gx}, ${66 + (i % 2) * 14})" class="${i % 2 ? "h-spin-slow" : "h-spin-rev"}" opacity="0.72">
          <circle cx="0" cy="0" r="${28 + (i % 2) * 8}" fill="none" stroke="#d97706" stroke-width="4.5" stroke-dasharray="6 6"/>
          <circle cx="0" cy="0" r="14" fill="none" stroke="#fde047" stroke-width="1.5"/>
        </g>`).join("")}`,
  }, dp));

  R.registerHouseArt("galactic_core", (dp) => buildT9Sanctuary({
    key: "gc", seed: 234, accent: "#34d399",
    nightBg: ["#0a3d42", "#141d4a", "#050816"], duskBg: ["#0e7490", "#6b21a8", "#1e1b4b"], dayBg: ["#ecfdf5", "#a7f3d0", "#38bdf8"],
    nightFlr: "#071e26", duskFlr: "#134e4a", dayFlr: "#d1fae5",
    centerpiece: () => `
      <g transform="translate(700, 76)" class="h-spin-slow" opacity="0.78">
        <ellipse cx="0" cy="0" rx="240" ry="48" fill="none" stroke="url(#hsAuroraCyan)" stroke-width="12" filter="url(#hsGlowMd)"/>
        <ellipse cx="0" cy="0" rx="154" ry="32" transform="rotate(20)" fill="none" stroke="url(#hsAuroraGold)" stroke-width="8"/>
      </g>
      <circle cx="700" cy="76" r="22" fill="#ffffff" opacity="0.92" filter="url(#hsGlowLg)" class="h-pulse"/>
      <path d="M0 0 H1400 V24 Q1050 8 700 22 Q350 8 0 24 Z" fill="#064e3b" stroke="url(#hsGoldH)" stroke-width="1.8"/>`,
  }, dp));

  R.registerHouseArt("singularity_court", (dp) => buildT9Sanctuary({
    key: "sg", seed: 245, accent: "#f59e0b",
    nightBg: ["#04020a", "#110924", "#1f103b"], duskBg: ["#2e1065", "#9a3412", "#fde68a"], dayBg: ["#e0f2fe", "#fef9c3", "#fde68a"],
    nightFlr: "#0d0917", duskFlr: "#261530", dayFlr: "#f8f4e8",
    centerpiece: (s) => `
      <g transform="translate(700, 78)">
        <ellipse cx="0" cy="0" rx="246" ry="30" fill="none" stroke="#f59e0b" stroke-width="11" opacity="0.72" filter="url(#hsGlowMd)" class="h-pulse"/>
        <ellipse cx="0" cy="0" rx="212" ry="20" fill="none" stroke="#fef08a" stroke-width="3.2" stroke-dasharray="28 12" class="h-flow"/>
        <circle cx="0" cy="0" r="52" fill="none" stroke="url(#hsGoldH)" stroke-width="3.8" filter="url(#hsGlowSm)"/>
        <circle cx="0" cy="0" r="44" fill="${s.isNight ? "#020106" : "#fffbeb"}" stroke="#a855f7" stroke-width="2.2"/>
        <path d="M-240 0 Q0 28 240 0" fill="none" stroke="#fde047" stroke-width="4" opacity="0.94" filter="url(#hsGlowSm)"/>
      </g>`,
  }, dp));

  // ============================================================
  // PART 5: T10 — 👑 太初星穹御苑 (1640px ULTIMATE 4-ZONE CREATOR PALACE!)
  //   Zone 1 (0..420):     🏛️ 星穹神谕主殿 (Ivory Marble + Rose Carrot Window + 24K Columns)
  //   Zone 2 (420..840):   ⏳ 创世日晷星台 (Colossal Golden Armillary + Pentatonic Creation Chimes)
  //   Zone 3 (840..1240):  🌊 浮空星河水苑 (Starlight Waterfall + Crescent Moon Bridge + Lotus Pool)
  //   Zone 4 (1240..1640): 👑 造物主天穹观测殿 (Creator's Time/Weather Altar + Dragon Summoning Dais)
  // ============================================================
  R.registerHouseArt("secret_palace", (dp) => {
    const s = skyOf(dp);
    const id = `t10_${s.phase}`;
    const pSky = s.isNight ? ["#050819", "#171442", "#2d1e6b", "#4c1d95"]
      : (s.isDusk ? ["#1e1338", "#581c68", "#c2410c", "#fde68a"]
        : (s.isDawn ? ["#38bdf8", "#bae6fd", "#fbcfe8", "#fef3c7"]
          : ["#0284c7", "#7dd3fc", "#e0f2fe", "#fffbeb"]));
    const clC = s.isNight ? ["#334155", "#1e293b", "#4c1d95"] : (s.isDusk ? ["#fed7aa", "#fef3c7", "#fbcfe8"] : ["#ffffff", "#fffbeb", "#f0f9ff"]);
    const flr = s.isNight ? "#1b1d36" : (s.isDusk ? "#3c2848" : "url(#hsIvory)");
    const colFill = s.isNight ? "#334155" : "url(#hsIvory)";
    return `
      <defs>
        <linearGradient id="${id}_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${pSky[0]}"/><stop offset="42%" stop-color="${pSky[1]}"/><stop offset="74%" stop-color="${pSky[2]}"/><stop offset="100%" stop-color="${pSky[3]}"/>
        </linearGradient>
        <radialGradient id="${id}_rose" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFBEB"/><stop offset="45%" stop-color="#FDE047"/><stop offset="78%" stop-color="#F97316"/><stop offset="100%" stop-color="${s.isNight ? "#7C3AED" : "#0284C7"}"/>
        </radialGradient>
        <linearGradient id="${id}_falls" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
      </defs>
      <rect width="1640" height="208" fill="url(#${id}_sky)"/>
      <!-- Continuous Celestial Star Sea & Aurora Ribbons across 1640px -->
      ${s.isNight || s.isDusk ? genStars(14, 1626, 110, 303, 120) : `<polygon points="150,0 320,0 390,148 90,148" fill="url(#hsSunbeam)" opacity="0.34"/><polygon points="1360,0 1540,0 1600,148 1280,148" fill="url(#hsSunbeam)" opacity="0.34"/>`}
      ${s.isNight ? moonCrescent(1480, 38, 18, pSky[0]) : `<circle cx="1480" cy="${s.isDusk ? 46 : 36}" r="20" fill="${s.isDusk ? "#fb923c" : "#fef08a"}" opacity="0.92" filter="url(#hsGlowLg)"/>`}
      <!-- Golden-Rimmed Sea of Clouds floating below the 1640px Celestial Palace -->
      <g opacity="${s.isNight ? "0.48" : "0.88"}" class="h-drift-slow">
        ${[80, 230, 410, 620, 820, 1020, 1240, 1440, 1590].map((cx, i) => `<ellipse cx="${cx}" cy="${134 + (i % 2) * 8}" rx="${76 + (i % 3) * 24}" ry="22" fill="${clC[i % 3]}"/>`).join("")}
      </g>

      <!-- === ZONE 1 (0..420): 🏛️ 星穹神谕主殿 === -->
      <g transform="translate(210, 74)">
        <g class="h-spin-slow" opacity="0.8"><circle cx="0" cy="0" r="62" fill="none" stroke="#fde047" stroke-width="1.4" stroke-dasharray="12 6"/></g>
        <g class="h-spin-rev" opacity="0.8"><circle cx="0" cy="0" r="44" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="8 5"/></g>
        <circle cx="0" cy="0" r="32" fill="url(#${id}_rose)" opacity="0.35" filter="url(#hsGlowLg)"/>
        <circle cx="0" cy="0" r="27" fill="${s.isNight ? "#1e1333" : "#fffbeb"}" stroke="url(#hsGoldH)" stroke-width="2.4"/>
        <circle cx="0" cy="0" r="21" fill="url(#${id}_rose)" opacity="0.9"/>
        <text x="0" y="6" font-size="18" text-anchor="middle">🥕</text>
      </g>
      <path d="M24 148 V52 A74 36 0 0 1 172 52 V148 M248 148 V52 A74 36 0 0 1 396 52 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4"/>

      <!-- === ZONE 2 (420..840): ⏳ 创世日晷星台 (Colossal Golden Astrolabe + Creation Chimes) === -->
      <g transform="translate(630, 76)">
        <g class="h-spin-slow"><ellipse cx="0" cy="0" rx="116" ry="38" fill="none" stroke="url(#hsGoldH)" stroke-width="2.6" stroke-dasharray="18 8"/></g>
        <g class="h-spin-rev"><ellipse cx="0" cy="0" rx="86" ry="52" transform="rotate(22)" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="12 7"/></g>
        <circle cx="0" cy="0" r="24" fill="#fef08a" opacity="0.9" filter="url(#hsGlowLg)" class="h-pulse"/>
        <circle cx="0" cy="0" r="14" fill="#ffffff"/>
      </g>
      <!-- Pentatonic Golden Creation Chime Rack (x=500) -->
      <g transform="translate(500, 146)">
        <line x1="-26" y1="0" x2="-26" y2="-52" stroke="url(#hsGoldV)" stroke-width="3"/>
        <line x1="26" y1="0" x2="26" y2="-52" stroke="url(#hsGoldV)" stroke-width="3"/>
        <line x1="-32" y1="-52" x2="32" y2="-52" stroke="url(#hsGoldH)" stroke-width="3.6"/>
        ${[-18, -9, 0, 9, 18].map((bx, i) => `<rect x="${bx - 2.6}" y="-48" width="5.2" height="${16 + i * 3.5}" rx="2" fill="url(#hsGoldV)" stroke="#fffbeb" stroke-width="0.6"/>`).join("")}
      </g>

      <!-- === ZONE 3 (840..1240): 🌊 浮空星河水苑 (Starlight Waterfall + Crescent Moon Bridge) === -->
      <rect x="996" y="18" width="88" height="130" fill="url(#${id}_falls)" opacity="0.58" filter="url(#hsGlowSm)"/>
      <line x1="1020" y1="18" x2="1020" y2="148" stroke="#ffffff" stroke-width="3.5" stroke-dasharray="14 8" class="h-flow-rev"/>
      <line x1="1060" y1="18" x2="1060" y2="148" stroke="#fef08a" stroke-width="3" stroke-dasharray="10 7" class="h-flow-rev"/>
      <!-- Platinum Crescent Arch Bridge over Starlight Lotus Pool -->
      <path d="M900 148 Q1040 94 1180 148" fill="none" stroke="url(#hsGoldH)" stroke-width="4"/>
      <path d="M908 134 Q1040 82 1172 134" fill="none" stroke="#fef08a" stroke-width="1.6" opacity="0.82"/>
      <ellipse cx="1040" cy="148" rx="98" ry="10" fill="#38bdf8" opacity="0.45" filter="url(#hsGlowSm)"/>

      <!-- === ZONE 4 (1240..1640): 👑 造物主天穹观测殿 (Creator's Sovereign Dais) === -->
      <path d="M1260 148 V64 A180 68 0 0 1 1620 64 V148" fill="none" stroke="url(#hsGoldH)" stroke-width="3"/>
      <path d="M1292 148 V70 A148 54 0 0 1 1588 70 V148" fill="none" stroke="#fef08a" stroke-width="1.4" opacity="0.65"/>
      <!-- Sovereign Creator Pedestal & Floating Crown Halo (x=1440) -->
      <g transform="translate(1440, 146)">
        <polygon points="-56,0 -44,-14 44,-14 56,0" fill="url(#hsGoldH)" opacity="0.88"/>
        <ellipse cx="0" cy="-42" rx="34" ry="9" fill="none" stroke="#fef08a" stroke-width="2" class="h-pulse" filter="url(#hsGlowSm)"/>
        <polygon points="-14,-34 -16,-54 -6,-44 0,-60 6,-44 16,-54 14,-34" fill="url(#hsGoldH)" stroke="#fffbeb" stroke-width="1.1" class="h-float"/>
      </g>

      <!-- Monumental 24K Gold-Capped Palace Columns separating all 4 Grand Zones -->
      ${[18, 396, 824, 1234, 1602].map(cx => `
        <rect x="${cx}" y="22" width="20" height="126" rx="2" fill="${colFill}" stroke="#d4af37" stroke-width="1.2"/>
        <rect x="${cx - 5}" y="16" width="30" height="8" rx="2" fill="url(#hsGoldH)"/>
        <rect x="${cx - 4}" y="142" width="28" height="6" rx="1.5" fill="url(#hsGoldH)"/>
      `).join("")}

      <!-- Mirror-Polished Celestial Marble Floor with Gold Inlays across 1640px -->
      <rect x="0" y="148" width="1640" height="60" fill="${flr}"/>
      ${perspFloor(148, 0, 1640, "#d4af37", s.isNight ? 0.34 : 0.28, 78)}
      <line x1="0" y1="148" x2="1640" y2="148" stroke="url(#hsGoldH)" stroke-width="3" filter="url(#hsGlowSm)"/>
      <line x1="0" y1="152" x2="1640" y2="152" stroke="#fef08a" stroke-width="0.9" opacity="0.65"/>
    `;
  });

  global.TooTooArtWonders = { getExtensionSvg };
})(typeof window !== "undefined" ? window : globalThis);
