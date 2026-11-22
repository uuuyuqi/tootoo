/* ============================================================================
 * TooToo Handcrafted SVG Art Registry for All Expanded Decors (67) & Wearables (16)
 * ----------------------------------------------------------------------------
 * Stage Coordinate Contracts (420x208):
 *   - floor  : x=0..420, y=148..208
 *   - light  : x=0..420, y=0..68
 *   - bed    : x=28..154, base y≈168..174
 *   - garden : x=322..406, base y≈156..168
 *   - pool   : x=254..382, base y≈184..196
 * Mascot Coordinate Contracts (36x36):
 *   - hat    : crown y=6..16
 *   - outfit : body y=28..36
 *   - acc    : side/hand/aura x=2..34, y=10..35
 * ============================================================================ */
(function (global) {
  "use strict";
  const R = global.TooTooRegistry;
  if (!R) return;

  // ==================== 1. BED / FURNITURE (15 NEW) ====================

  R.registerDecorArt("woven_pouf", () => `
    <g>
      <ellipse cx="92" cy="170" rx="34" ry="7" fill="#000" opacity="0.16"/>
      <ellipse cx="92" cy="164" rx="32" ry="12" fill="#d4a359" stroke="#854d0e" stroke-width="1.5"/>
      <ellipse cx="92" cy="158" rx="30" ry="9.5" fill="#eab66a" stroke="#a16207" stroke-width="1.2"/>
      <ellipse cx="92" cy="158" rx="20" ry="6" fill="none" stroke="#92400e" stroke-width="1" stroke-dasharray="5 3"/>
      <ellipse cx="92" cy="158" rx="10" ry="3" fill="none" stroke="#92400e" stroke-width="0.9"/>
    </g>
  `);

  R.registerDecorArt("canvas_lounger", () => `
    <g>
      <ellipse cx="92" cy="171" rx="46" ry="6.5" fill="#000" opacity="0.16"/>
      <path d="M56 170 L84 134 M124 170 L94 142" stroke="#92400e" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M52 130 Q84 156 132 150 L126 160 Q76 164 46 136 Z" fill="#fef3c7" stroke="#a8a29e" stroke-width="1.3"/>
      <rect x="52" y="128" width="16" height="9" rx="4" fill="#ea580c" stroke="#9a3412" stroke-width="0.9" transform="rotate(24 60 132)"/>
    </g>
  `);

  R.registerDecorArt("beanbag_chair", () => `
    <g>
      <ellipse cx="92" cy="171" rx="44" ry="8" fill="#000" opacity="0.16"/>
      <path d="M52 162 C46 134 66 116 92 118 C118 116 138 134 132 162 C126 172 58 172 52 162 Z" fill="#f97316" stroke="#9a3412" stroke-width="1.6"/>
      <path d="M68 128 Q92 146 116 128" fill="none" stroke="#fed7aa" stroke-width="1.4" opacity="0.65"/>
      <ellipse cx="92" cy="148" rx="24" ry="9" fill="#fb923c" opacity="0.72"/>
    </g>
  `);

  R.registerDecorArt("vintage_iron_bed", () => `
    <g>
      <ellipse cx="92" cy="171" rx="54" ry="6.5" fill="#000" opacity="0.16"/>
      <path d="M44 170 V120 Q68 110 92 120 Q116 110 140 120 V170" fill="none" stroke="#475569" stroke-width="2.6"/>
      <path d="M56 120 V142 M92 120 V142 M128 120 V142" stroke="#64748b" stroke-width="1.5"/>
      <rect x="44" y="142" width="96" height="20" rx="5" fill="#fffdf8" stroke="#94a3b8" stroke-width="1.2"/>
      <rect x="66" y="142" width="74" height="20" rx="5" fill="#93c5fd" stroke="#3b82f6" stroke-width="1.1"/>
      <rect x="48" y="135" width="22" height="10" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="0.9"/>
    </g>
  `);

  R.registerDecorArt("rattan_balcony_set", () => `
    <g>
      <ellipse cx="92" cy="171" rx="50" ry="6.5" fill="#000" opacity="0.16"/>
      <!-- Rattan woven chair -->
      <path d="M46 168 L52 124 Q72 114 90 124 L94 168" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
      <rect x="52" y="144" width="38" height="10" rx="4" fill="#fffbeb" stroke="#a8a29e" stroke-width="0.9"/>
      <!-- Glass tea table -->
      <ellipse cx="122" cy="144" rx="22" ry="6" fill="#e0f2fe" stroke="#92400e" stroke-width="1.3"/>
      <path d="M110 148 L106 169 M134 148 L138 169" stroke="#78350f" stroke-width="2.2"/>
      <rect x="118" y="137" width="8" height="6" rx="1.5" fill="#fef3c7" stroke="#ea580c" stroke-width="0.8"/>
    </g>
  `);

  R.registerDecorArt("bamboo_tea_table", () => `
    <g>
      <ellipse cx="92" cy="171" rx="52" ry="6.5" fill="#000" opacity="0.16"/>
      <rect x="46" y="142" width="92" height="7" rx="3" fill="#4d7c53" stroke="#14532d" stroke-width="1.3"/>
      <line x1="56" y1="149" x2="54" y2="170" stroke="#3f6212" stroke-width="3.6" stroke-linecap="round"/>
      <line x1="128" y1="149" x2="130" y2="170" stroke="#3f6212" stroke-width="3.6" stroke-linecap="round"/>
      <!-- Clay teapot & wisps -->
      <ellipse cx="86" cy="136" rx="9" ry="6.5" fill="#9a3412" stroke="#431407" stroke-width="1"/>
      <path d="M86 128 Q84 121 88 117" stroke="#e2e8f0" stroke-width="1.1" fill="none" class="h-steam"/>
      <rect x="104" y="137" width="6" height="5" rx="1.5" fill="#ecfdf5" stroke="#047857" stroke-width="0.8"/>
    </g>
  `);

  R.registerDecorArt("tatami_table", () => `
    <g>
      <ellipse cx="92" cy="172" rx="54" ry="7.5" fill="#000" opacity="0.16"/>
      <rect x="38" y="156" width="108" height="14" rx="2.5" fill="#bef264" stroke="#4d7c0f" stroke-width="1.4"/>
      <rect x="54" y="138" width="76" height="8" rx="2" fill="#92400e" stroke="#451a03" stroke-width="1.2"/>
      <path d="M58 146 L52 162 L132 162 L126 146 Z" fill="#ef4444" opacity="0.86"/>
      <!-- Tangerine bowl -->
      <ellipse cx="92" cy="136" rx="12" ry="3.5" fill="#78350f"/>
      <circle cx="88" cy="133" r="3.4" fill="#f97316"/><circle cx="95" cy="133" r="3.4" fill="#fb923c"/>
    </g>
  `);

  R.registerDecorArt("walnut_tea_table", () => `
    <g>
      <ellipse cx="92" cy="171" rx="54" ry="6.5" fill="#000" opacity="0.18"/>
      <path d="M44 140 Q92 135 140 140 L138 148 Q92 145 46 148 Z" fill="#5c2d0e" stroke="#2e1304" stroke-width="1.4"/>
      <rect x="54" y="147" width="8" height="22" fill="#451a03"/><rect x="122" y="147" width="8" height="22" fill="#451a03"/>
      <!-- Kungfu Zisha teapot & incense smoke -->
      <ellipse cx="80" cy="134" rx="9" ry="6" fill="#7c2d12" stroke="#431407" stroke-width="1"/>
      <path d="M80 126 Q78 118 82 114" stroke="#fef3c7" stroke-width="1.1" fill="none" class="h-steam"/>
      <circle cx="104" cy="136" r="3.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>
      <circle cx="114" cy="136" r="3.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>
    </g>
  `);

  R.registerDecorArt("french_velvet_chaise", () => `
    <g>
      <ellipse cx="92" cy="171" rx="54" ry="7" fill="#000" opacity="0.18"/>
      <path d="M44 152 C42 122 56 116 74 128 C92 140 120 138 140 144 C144 152 138 162 124 162 L52 162 Z" fill="#0f766e" stroke="#134e4a" stroke-width="1.6"/>
      <circle cx="62" cy="138" r="1.6" fill="#fde047"/><circle cx="76" cy="144" r="1.6" fill="#fde047"/>
      <line x1="54" y1="162" x2="50" y2="171" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="128" y1="162" x2="132" y2="171" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/>
      <ellipse cx="64" cy="148" rx="10" ry="6" fill="#fef3c7" stroke="#d97706" stroke-width="0.9"/>
    </g>
  `);

  R.registerDecorArt("italian_leather_sofa", () => `
    <g>
      <ellipse cx="92" cy="171" rx="56" ry="7.5" fill="#000" opacity="0.18"/>
      <rect x="38" y="128" width="108" height="36" rx="8" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
      <rect x="44" y="132" width="46" height="18" rx="5" fill="#d97706"/>
      <rect x="94" y="132" width="46" height="18" rx="5" fill="#d97706"/>
      <rect x="42" y="148" width="100" height="14" rx="4" fill="#c26314" stroke="#78350f" stroke-width="1"/>
      <rect x="112" y="154" width="34" height="14" rx="4" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
    </g>
  `);

  R.registerDecorArt("marble_coffee_bar", () => `
    <g>
      <ellipse cx="92" cy="171" rx="54" ry="6.5" fill="#000" opacity="0.18"/>
      <rect x="42" y="128" width="100" height="40" rx="3" fill="url(#hsIvory)" stroke="#cbd5e1" stroke-width="1.4"/>
      <path d="M52 138 Q84 152 126 140" stroke="#d4af37" stroke-width="1" fill="none" opacity="0.65"/>
      <rect x="38" y="124" width="108" height="6" rx="2" fill="#ffffff" stroke="url(#hsGoldH)" stroke-width="1.2"/>
      <!-- Espresso lever machine -->
      <rect x="54" y="102" width="28" height="22" rx="3" fill="#334155" stroke="#94a3b8" stroke-width="1.2"/>
      <circle cx="68" cy="110" r="3" fill="#fef08a"/>
      <rect x="96" y="114" width="9" height="10" rx="2" fill="#fff7ed" stroke="#ea580c" stroke-width="0.9"/>
      <path d="M100 112 Q98 106 102 103" stroke="#e2e8f0" stroke-width="1" fill="none" class="h-steam"/>
    </g>
  `);

  R.registerDecorArt("massage_space_chair", () => `
    <g>
      <ellipse cx="92" cy="172" rx="48" ry="7" fill="#000" opacity="0.2"/>
      <path d="M50 156 C44 124 58 106 86 106 C104 106 116 116 118 134 L136 148 C142 158 132 168 112 168 L64 168 Z" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <path d="M62 152 L70 118 Q84 114 96 122 L92 146 L124 148 L120 160 L64 160 Z" fill="#1e293b" stroke="#f59e0b" stroke-width="1.1"/>
      <circle cx="110" cy="126" r="2.2" fill="#38bdf8" class="h-twinkle"/>
    </g>
  `);

  R.registerDecorArt("fireplace_bookcase", () => `
    <g>
      <rect x="38" y="84" width="108" height="84" rx="3" fill="#5c2d0e" stroke="#2e1304" stroke-width="1.6"/>
      <!-- Bookshelves -->
      <rect x="44" y="90" width="96" height="18" fill="#3b1d08"/>
      <rect x="48" y="94" width="7" height="14" fill="#dc2626"/><rect x="56" y="92" width="6" height="16" fill="#0d9488"/>
      <rect x="63" y="95" width="8" height="13" fill="#f59e0b"/><rect x="73" y="93" width="6" height="15" fill="#3b82f6"/>
      <rect x="98" y="93" width="7" height="15" fill="#ec4899"/><rect x="106" y="95" width="7" height="13" fill="#22c55e"/>
      <rect x="115" y="92" width="6" height="16" fill="#a855f7"/>
      <!-- Glowing modern hearth inside -->
      <rect x="62" y="124" width="60" height="44" rx="3" fill="#18181b" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      <path d="M74 164 Q82 140 92 134 Q98 148 106 138 Q112 152 108 164 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <path d="M82 164 Q90 148 96 146 Q102 156 100 164 Z" fill="#fde047"/>
    </g>
  `);

  R.registerDecorArt("holo_sleep_pod", () => `
    <g>
      <ellipse cx="92" cy="174" rx="52" ry="7.5" fill="#38bdf8" opacity="0.24" filter="url(#hsGlowMd)" class="h-pulse"/>
      <g class="h-float-slow">
        <rect x="42" y="138" width="100" height="28" rx="14" fill="url(#hsObsidian)" stroke="#38bdf8" stroke-width="1.8"/>
        <path d="M48 142 C58 108 126 108 136 142 Z" fill="#0ea5e9" fill-opacity="0.28" stroke="#bae6fd" stroke-width="1.4"/>
        <path d="M62 132 L74 132 L80 122 L88 140 L94 128 L104 132 L122 132" fill="none" stroke="#34d399" stroke-width="1.4" filter="url(#hsGlowSm)" class="h-pulse"/>
      </g>
    </g>
  `);

  R.registerDecorArt("stellar_ring_throne", () => `
    <g>
      <ellipse cx="92" cy="176" rx="48" ry="8" fill="#f59e0b" opacity="0.28" filter="url(#hsGlowMd)" class="h-pulse"/>
      <g class="h-float-slow">
        <g transform="translate(92, 102)">
          <circle cx="0" cy="0" r="16" fill="#fef08a" filter="url(#hsGlowMd)" class="h-pulse"/>
          <g class="h-spin-slow">
            <ellipse cx="0" cy="0" rx="34" ry="11" fill="none" stroke="url(#hsGoldH)" stroke-width="1.8"/>
            <ellipse cx="0" cy="0" rx="28" ry="9" transform="rotate(28)" fill="none" stroke="#fb923c" stroke-width="1.4"/>
          </g>
        </g>
        <path d="M68 158 L64 118 Q92 98 120 118 L116 158 Z" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="2"/>
        <rect x="64" y="146" width="56" height="14" rx="5" fill="#f59e0b" stroke="#fffbeb" stroke-width="1.2"/>
      </g>
    </g>
  `);

  // ==================== 2. LIGHT / CEILING (15 NEW) ====================

  R.registerDecorArt("firefly_stone_lamp", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="20" stroke="#78350f" stroke-width="1.4"/>
      <circle cx="210" cy="36" r="26" fill="#86efac" opacity="0.18" class="h-pulse"/>
      <rect x="199" y="22" width="22" height="26" rx="9" fill="#ecfdf5" fill-opacity="0.34" stroke="#86efac" stroke-width="1.3"/>
      <circle cx="206" cy="34" r="2.2" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
      <circle cx="215" cy="38" r="2.0" fill="#86efac" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
      <circle cx="210" cy="30" r="1.6" fill="#fde047" class="h-twinkle-d2"/>
    </g>
  `);

  R.registerDecorArt("paper_lantern_small", () => `
    <g class="h-drift-slow">
      <line x1="210" y1="0" x2="210" y2="18" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="210" cy="36" r="28" fill="#fed7aa" opacity="0.22" class="h-pulse"/>
      <ellipse cx="210" cy="36" rx="18" ry="16" fill="#fff7ed" stroke="#d97706" stroke-width="1.3"/>
      <path d="M193 30 H227 M192 36 H228 M193 42 H227" stroke="#f59e0b" stroke-width="0.7" opacity="0.6"/>
      <rect x="203" y="17" width="14" height="3.5" rx="1" fill="#78350f"/>
      <rect x="203" y="51" width="14" height="3.5" rx="1" fill="#78350f"/>
    </g>
  `);

  R.registerDecorArt("camping_lantern", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="16" stroke="#334155" stroke-width="1.6"/>
      <circle cx="210" cy="36" r="30" fill="#fbbf24" opacity="0.2" class="h-pulse"/>
      <path d="M198 20 Q210 12 222 20 Z" fill="#14532d" stroke="#052e16" stroke-width="1.2"/>
      <rect x="201" y="20" width="18" height="24" rx="4" fill="#fef3c7" stroke="#14532d" stroke-width="1.4"/>
      <path d="M210 38 Q206 31 210 26 Q214 31 210 38 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <rect x="198" y="44" width="24" height="6" rx="2" fill="#14532d"/>
    </g>
  `);

  R.registerDecorArt("industrial_cage_lamp", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="20" stroke="#1e293b" stroke-width="2"/>
      <polygon points="196,20 224,20 230,28 190,28" fill="#1e293b"/>
      <circle cx="210" cy="39" r="10" fill="#fef08a" filter="url(#hsGlowSm)"/>
      <path d="M196 28 L200 50 H220 L224 28 M204 28 L206 50 M216 28 L214 50 M198 39 H222" fill="none" stroke="#334155" stroke-width="1.3"/>
    </g>
  `);

  R.registerDecorArt("sunset_floor_lamp", () => `
    <g>
      <circle cx="210" cy="46" r="46" fill="#fb7185" opacity="0.26" filter="url(#hsGlowLg)" class="h-pulse"/>
      <circle cx="210" cy="46" r="28" fill="#fb923c" opacity="0.34" filter="url(#hsGlowMd)"/>
      <circle cx="210" cy="46" r="14" fill="#fef08a" opacity="0.52"/>
    </g>
  `);

  R.registerDecorArt("pinecone_sconce", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="18" stroke="#78350f" stroke-width="1.6"/>
      <circle cx="210" cy="36" r="28" fill="#fbbf24" opacity="0.22" class="h-pulse"/>
      <path d="M210 18 L224 32 L218 48 L202 48 L196 32 Z" fill="#d97706" stroke="#78350f" stroke-width="1.3"/>
      <path d="M200 32 L220 32 M203 40 L217 40" stroke="#fef08a" stroke-width="1.4" filter="url(#hsGlowSm)"/>
    </g>
  `);

  R.registerDecorArt("bauhaus_mushroom_lamp", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="20" stroke="#94a3b8" stroke-width="1.8"/>
      <circle cx="210" cy="38" r="30" fill="#fef3c7" opacity="0.22" class="h-pulse"/>
      <path d="M186 38 A24 20 0 0 1 234 38 Z" fill="#fffbeb" stroke="#d97706" stroke-width="1.3" filter="url(#hsGlowSm)"/>
      <ellipse cx="210" cy="38" rx="24" ry="4" fill="#fde68a"/>
    </g>
  `);

  R.registerDecorArt("windmill_copper_lamp", () => `
    <g>
      <line x1="210" y1="0" x2="210" y2="24" stroke="#b45309" stroke-width="1.8"/>
      <g transform="translate(210, 32)">
        <g class="h-spin-slow">
          <line x1="-22" y1="0" x2="22" y2="0" stroke="url(#hsGoldH)" stroke-width="2"/>
          <line x1="0" y1="-22" x2="0" y2="22" stroke="url(#hsGoldH)" stroke-width="2"/>
          <circle cx="22" cy="0" r="3.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
          <circle cx="-22" cy="0" r="3.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
          <circle cx="0" cy="22" r="3.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
          <circle cx="0" cy="-22" r="3.5" fill="#fef08a" filter="url(#hsGlowSm)"/>
        </g>
        <circle cx="0" cy="0" r="4" fill="#b45309" stroke="#fde047" stroke-width="1"/>
      </g>
    </g>
  `);

  R.registerDecorArt("french_iron_lamp", () => `
    <g>
      <ellipse cx="210" cy="34" rx="66" ry="24" fill="#fde68a" opacity="0.2" filter="url(#hsGlowLg)" class="h-pulse"/>
      <line x1="210" y1="0" x2="210" y2="24" stroke="#1e293b" stroke-width="2.2"/>
      <path d="M168 34 Q188 22 210 24 Q232 22 252 34" fill="none" stroke="#1e293b" stroke-width="2.2"/>
      <path d="M184 40 Q198 32 210 32 Q222 32 236 40" fill="none" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      ${[168, 190, 210, 230, 252].map((cx, i) => `
        <rect x="${cx - 1.5}" y="${i === 2 ? 18 : 24}" width="3" height="8" fill="#fffbeb"/>
        <ellipse cx="${cx}" cy="${i === 2 ? 15 : 21}" rx="2.4" ry="3.8" fill="#fef08a" filter="url(#hsGlowSm)"/>
      `).join("")}
    </g>
  `);

  R.registerDecorArt("molecular_glass_lamp", () => `
    <g>
      <ellipse cx="210" cy="34" rx="74" ry="26" fill="#fed7aa" opacity="0.22" filter="url(#hsGlowLg)" class="h-pulse"/>
      <line x1="210" y1="0" x2="210" y2="24" stroke="url(#hsGoldH)" stroke-width="2"/>
      <path d="M168 32 L210 24 L252 32 M186 44 L210 24 L234 44" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      ${[[168,32,7],[186,44,6.5],[210,28,8],[234,44,6.5],[252,32,7]].map(([cx,cy,r]) => `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef3c7" fill-opacity="0.82" stroke="#f59e0b" stroke-width="1" filter="url(#hsGlowSm)"/>
      `).join("")}
    </g>
  `);

  R.registerDecorArt("gilded_palace_lantern", () => `
    <g class="h-drift-slow">
      <line x1="210" y1="0" x2="210" y2="14" stroke="url(#hsGoldH)" stroke-width="2"/>
      <circle cx="210" cy="36" r="34" fill="#fbbf24" opacity="0.22" filter="url(#hsGlowMd)" class="h-pulse"/>
      <path d="M188 22 L210 12 L232 22 Z" fill="#7c2d12" stroke="url(#hsGoldH)" stroke-width="1.5"/>
      <rect x="193" y="22" width="34" height="26" rx="3" fill="#fef3c7" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <line x1="204" y1="22" x2="204" y2="48" stroke="#b45309" stroke-width="1.2"/>
      <line x1="216" y1="22" x2="216" y2="48" stroke="#b45309" stroke-width="1.2"/>
      <line x1="210" y1="48" x2="210" y2="62" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/>
    </g>
  `);

  R.registerDecorArt("cloud_feather_chandelier", () => `
    <g class="h-float-slow">
      <ellipse cx="210" cy="34" rx="76" ry="22" fill="#e0f2fe" opacity="0.26" filter="url(#hsGlowLg)" class="h-pulse"/>
      <ellipse cx="210" cy="32" rx="54" ry="12" fill="none" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      ${[-44,-26,-8,10,28,44].map((dx, i) => `
        <path d="M${210 + dx} 32 Q${210 + dx + 4} 44 ${210 + dx} 54 Q${210 + dx - 4} 44 ${210 + dx} 32 Z" fill="#ffffff" opacity="0.92" filter="url(#hsGlowSm)"/>
      `).join("")}
    </g>
  `);

  R.registerDecorArt("obsidian_brazier_lamp", () => `
    <g>
      <line x1="184" y1="0" x2="192" y2="30" stroke="#64748b" stroke-width="1.8" stroke-dasharray="3 2"/>
      <line x1="236" y1="0" x2="228" y2="30" stroke="#64748b" stroke-width="1.8" stroke-dasharray="3 2"/>
      <circle cx="210" cy="30" r="38" fill="#f97316" opacity="0.24" filter="url(#hsGlowLg)" class="h-pulse"/>
      <path d="M186 30 H234 L224 44 H196 Z" fill="#18181b" stroke="#f59e0b" stroke-width="1.6"/>
      <path d="M194 30 Q202 10 210 18 Q218 8 226 30 Z" fill="#f97316" filter="url(#hsGlowSm)" class="h-pulse"/>
      <path d="M202 30 Q210 16 218 30 Z" fill="#fef08a"/>
    </g>
  `);

  R.registerDecorArt("holo_earth_globe", () => `
    <g transform="translate(210, 34)">
      <circle cx="0" cy="0" r="26" fill="#38bdf8" opacity="0.2" filter="url(#hsGlowLg)" class="h-pulse"/>
      <g class="h-spin-slow">
        <ellipse cx="0" cy="0" rx="38" ry="11" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6 4"/>
      </g>
      <circle cx="0" cy="0" r="16" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.3" filter="url(#hsGlowSm)"/>
      <path d="M-9 -6 Q0 -12 8 -4 Q12 4 4 10 Q-6 12 -10 2 Z" fill="#34d399" opacity="0.86"/>
      <ellipse cx="0" cy="0" rx="16" ry="5.5" fill="none" stroke="#bae6fd" stroke-width="0.8" opacity="0.65"/>
    </g>
  `);

  R.registerDecorArt("quantum_prism_array", () => `
    <g>
      <path d="M134 32 L172 22 L210 34 L248 22 L286 32" fill="none" stroke="url(#hsPrism)" stroke-width="1.5" opacity="0.78" class="h-pulse"/>
      ${[[134,32,"#38bdf8"],[172,22,"#c084fc"],[210,34,"#fde047"],[248,22,"#f472b6"],[286,32,"#34d399"]].map(([x,y,c], i) => `
        <polygon points="${x},${y - 11} ${x + 7},${y} ${x},${y + 11} ${x - 7},${y}" fill="${c}" fill-opacity="0.72" stroke="#fff" stroke-width="0.9" filter="url(#hsGlowSm)" class="${i % 2 ? "h-float" : "h-float-slow"}"/>
      `).join("")}
    </g>
  `);

  // ==================== 3. FLOOR / CARPET (14 NEW) ====================

  R.registerDecorArt("van_plaid_mat", () => `
    <g>
      <ellipse cx="210" cy="180" rx="116" ry="19" fill="#000" opacity="0.14"/>
      <ellipse cx="210" cy="178" rx="112" ry="17" fill="#a7f3d0" stroke="#047857" stroke-width="1.5"/>
      <path d="M120 174 H300 M114 182 H306 M156 162 L150 194 M210 161 V195 M264 162 L270 194" stroke="#ffffff" stroke-width="1.4" opacity="0.7"/>
    </g>
  `);

  R.registerDecorArt("hemp_round_rug", () => `
    <g>
      <ellipse cx="210" cy="180" rx="112" ry="20" fill="#000" opacity="0.14"/>
      <ellipse cx="210" cy="178" rx="108" ry="18" fill="#d4b483" stroke="#92400e" stroke-width="1.5"/>
      <ellipse cx="210" cy="178" rx="84" ry="14" fill="none" stroke="#a16207" stroke-width="1.2" stroke-dasharray="6 3"/>
      <ellipse cx="210" cy="178" rx="58" ry="9.5" fill="none" stroke="#a16207" stroke-width="1.1"/>
      <ellipse cx="210" cy="178" rx="30" ry="5" fill="none" stroke="#92400e" stroke-width="1"/>
    </g>
  `);

  R.registerDecorArt("pebble_mat", () => `
    <g>
      <ellipse cx="210" cy="179" rx="114" ry="18" fill="#cbd5e1" stroke="#64748b" stroke-width="1.4"/>
      ${[[142,176,12,6,"#94a3b8"],[174,172,14,7,"#e2e8f0"],[206,178,15,7,"#94a3b8"],[242,174,13,6,"#cbd5e1"],[276,178,12,6,"#64748b"],[164,185,13,5,"#64748b"],[230,186,14,5,"#e2e8f0"]].map(([x,y,rx,ry,c]) =>
        `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="#475569" stroke-width="0.9"/>`
      ).join("")}
    </g>
  `);

  R.registerDecorArt("retro_pattern_tile", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#fef3c7"/>
      <path d="M0 168 H420 M0 188 H420 M60 148 L36 208 M135 148 L120 208 M210 148 V208 M285 148 L300 208 M360 148 L384 208" stroke="#0f766e" stroke-width="1.2" opacity="0.55"/>
      ${[96, 172, 248, 324].map(x => `<polygon points="${x},162 ${x + 12},168 ${x},174 ${x - 12},168" fill="#0f766e" opacity="0.5"/>`).join("")}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#0f766e" stroke-width="2"/>
    </g>
  `);

  R.registerDecorArt("cream_microcement", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#f5f0e6"/>
      <rect x="0" y="148" width="420" height="60" fill="url(#hsGlassSheen)" opacity="0.45"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#d6cfc2" stroke-width="2"/>
    </g>
  `);

  R.registerDecorArt("chevron_oak_floor", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#d4b483"/>
      <path d="M0 164 H420 M0 180 H420 M0 196 H420" stroke="#a6814c" stroke-width="1"/>
      <path d="M0 164 L30 148 L60 164 L90 148 L120 164 L150 148 L180 164 L210 148 L240 164 L270 148 L300 164 L330 148 L360 164 L390 148 L420 164" fill="none" stroke="#926c38" stroke-width="1" opacity="0.55"/>
      <path d="M0 180 L30 164 L60 180 L90 164 L120 180 L150 164 L180 180 L210 164 L240 180 L270 164 L300 180 L330 164 L360 180 L390 164 L420 180" fill="none" stroke="#926c38" stroke-width="1" opacity="0.55"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#855e2c" stroke-width="2"/>
    </g>
  `);

  R.registerDecorArt("terrazzo_floor", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#f3efe6"/>
      ${[[44,162,"#f97316"],[98,176,"#0d9488"],[148,160,"#f59e0b"],[194,186,"#6366f1"],[252,166,"#ec4899"],[308,182,"#10b981"],[364,164,"#f97316"],[72,194,"#3b82f6"],[286,196,"#eab308"],[344,192,"#0d9488"]].map(([x,y,c]) =>
        `<polygon points="${x},${y} ${x + 6},${y + 2} ${x + 3},${y + 6} ${x - 2},${y + 4}" fill="${c}" opacity="0.65"/>`
      ).join("")}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#cbd5e1" stroke-width="2"/>
    </g>
  `);

  R.registerDecorArt("suzhou_brick_floor", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#64748b"/>
      <path d="M0 168 H420 M0 188 H420 M70 148 L42 208 M140 148 L124 208 M210 148 V208 M280 148 L296 208 M350 148 L378 208" stroke="#334155" stroke-width="1.2"/>
      ${[105, 210, 315].map(x => `<ellipse cx="${x}" cy="178" rx="16" ry="6" fill="none" stroke="#d4af37" stroke-width="1.1" opacity="0.72"/>`).join("")}
      <line x1="0" y1="148" x2="420" y2="148" stroke="#d4af37" stroke-width="2"/>
    </g>
  `);

  R.registerDecorArt("persian_silk_rug", () => `
    <g>
      <ellipse cx="210" cy="180" rx="134" ry="22" fill="#000" opacity="0.18"/>
      <ellipse cx="210" cy="178" rx="130" ry="20" fill="#991b1b" stroke="#f59e0b" stroke-width="2"/>
      <ellipse cx="210" cy="178" rx="114" ry="16" fill="#1e3a8a" stroke="#fde047" stroke-width="1.2"/>
      <ellipse cx="210" cy="178" rx="76" ry="11" fill="#b91c1c" stroke="#fef08a" stroke-width="1" stroke-dasharray="5 3"/>
      <polygon points="210,170 226,178 210,186 194,178" fill="#fbbf24" opacity="0.9"/>
    </g>
  `);

  R.registerDecorArt("blackgold_marble", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#111318"/>
      <path d="M0 168 H420 M0 188 H420 M90 148 L50 208 M210 148 V208 M330 148 L370 208" stroke="#d4af37" stroke-width="0.9" opacity="0.55"/>
      <path d="M24 162 Q86 154 148 178 T268 164 T396 184" fill="none" stroke="url(#hsGoldH)" stroke-width="1.4" opacity="0.72"/>
      <rect x="0" y="148" width="420" height="60" fill="url(#hsGlassSheen)" opacity="0.28"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.2"/>
    </g>
  `);

  R.registerDecorArt("sky_glass_walkway", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#0284c7" fill-opacity="0.34"/>
      <g class="h-drift-slow" opacity="0.62">
        <ellipse cx="104" cy="176" rx="64" ry="14" fill="#ffffff"/>
        <ellipse cx="296" cy="184" rx="76" ry="15" fill="#e0f2fe"/>
      </g>
      <path d="M0 168 H420 M0 188 H420 M105 148 L72 208 M210 148 V208 M315 148 L348 208" stroke="#bae6fd" stroke-width="1.2" opacity="0.75"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#e0f2fe" stroke-width="2.4"/>
    </g>
  `);

  R.registerDecorArt("jade_gold_floor", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#047857"/>
      <ellipse cx="210" cy="178" rx="180" ry="22" fill="#34d399" opacity="0.28" class="h-pulse"/>
      <path d="M0 168 H420 M0 188 H420 M100 148 L66 208 M210 148 V208 M320 148 L354 208" stroke="url(#hsGoldH)" stroke-width="1.2" opacity="0.8"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsGoldH)" stroke-width="2.4"/>
    </g>
  `);

  R.registerDecorArt("mars_redrock_floor", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#7c2d12"/>
      <ellipse cx="116" cy="178" rx="48" ry="10" fill="#9a3412"/>
      <ellipse cx="308" cy="184" rx="54" ry="11" fill="#b45309" opacity="0.72"/>
      <path d="M0 168 H420 M0 188 H420" stroke="#fb923c" stroke-width="1.1" opacity="0.55"/>
      <rect x="0" y="148" width="420" height="60" fill="url(#hsGlassSheen)" opacity="0.32"/>
      <line x1="0" y1="148" x2="420" y2="148" stroke="#fb923c" stroke-width="2.2"/>
    </g>
  `);

  R.registerDecorArt("antigrav_tile_matrix", () => `
    <g>
      <rect x="0" y="148" width="420" height="60" fill="#09071a"/>
      ${[54, 132, 210, 288, 366].map((x, i) => `
        <polygon points="${x - 28},178 ${x - 14},166 ${x + 14},166 ${x + 28},178 ${x + 14},190 ${x - 14},190" fill="#1e1b4b" stroke="${i % 2 ? "#c084fc" : "#22d3ee"}" stroke-width="1.5" filter="url(#hsGlowSm)" class="${i % 2 ? "h-float" : "h-float-slow"}"/>
      `).join("")}
      <line x1="0" y1="148" x2="420" y2="148" stroke="url(#hsPrism)" stroke-width="2.2"/>
    </g>
  `);

  // ==================== 4. GARDEN / PLANTS (14 NEW) ====================

  R.registerDecorArt("carrot_sprout", () => `
    <g transform="translate(358, 162)">
      <ellipse cx="0" cy="4" rx="16" ry="3.5" fill="#000" opacity="0.16"/>
      <path d="M-12 2 L-9 -12 L9 -12 L12 2 Z" fill="#b45309" stroke="#78350f" stroke-width="1.3"/>
      <path d="M0 -12 Q-8 -24 -12 -18 Q-6 -14 0 -12 Q8 -24 12 -18 Q6 -14 0 -12 Z" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
    </g>
  `);

  R.registerDecorArt("ceramic_succulent_trio", () => `
    <g transform="translate(358, 162)">
      <ellipse cx="0" cy="4" rx="28" ry="4.5" fill="#000" opacity="0.15"/>
      ${[[-18,"#86efac"],[0,"#34d399"],[18,"#fda4af"]].map(([dx, c]) => `
        <rect x="${dx - 7}" y="-10" width="14" height="12" rx="3" fill="#fffdf8" stroke="#cbd5e1" stroke-width="1"/>
        <circle cx="${dx}" cy="-13" r="6" fill="${c}" stroke="#15803d" stroke-width="0.8"/>
      `).join("")}
    </g>
  `);

  R.registerDecorArt("hydro_coin_plant", () => `
    <g transform="translate(358, 162)">
      <ellipse cx="0" cy="4" rx="18" ry="4" fill="#000" opacity="0.15"/>
      <circle cx="0" cy="-10" r="13" fill="#bae6fd" fill-opacity="0.58" stroke="#38bdf8" stroke-width="1.2"/>
      <path d="M-5 -12 L-10 -32 M0 -12 L0 -36 M6 -12 L12 -30" stroke="#15803d" stroke-width="1.5"/>
      <circle cx="-10" cy="-33" r="5" fill="#22c55e"/><circle cx="0" cy="-38" r="5.5" fill="#4ade80"/><circle cx="12" cy="-31" r="4.8" fill="#16a34a"/>
    </g>
  `);

  R.registerDecorArt("hanging_pothos_basket", () => `
    <g transform="translate(358, 162)">
      <ellipse cx="0" cy="4" rx="22" ry="4.5" fill="#000" opacity="0.16"/>
      <path d="M-16 2 L-12 -18 L12 -18 L16 2 Z" fill="#d97706" stroke="#78350f" stroke-width="1.3"/>
      <path d="M-10 -18 Q-20 -36 -22 -12 M0 -18 Q0 -42 8 -20 M10 -18 Q22 -34 20 -8" stroke="#16a34a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="-18" cy="-24" r="5" fill="#22c55e"/><circle cx="2" cy="-32" r="6" fill="#4ade80"/><circle cx="18" cy="-22" r="5" fill="#15803d"/>
    </g>
  `);

  R.registerDecorArt("celadon_pothos_rack", () => `
    <g transform="translate(358, 164)">
      <rect x="-14" y="-12" width="28" height="14" rx="2" fill="#78350f"/>
      <ellipse cx="0" cy="-24" rx="11" ry="13" fill="#a7f3d0" stroke="#0d9488" stroke-width="1.4"/>
      <path d="M-4 -36 Q-14 -54 -6 -62 M4 -36 Q16 -52 10 -64" stroke="#15803d" stroke-width="2" fill="none"/>
      <circle cx="-8" cy="-58" r="5.5" fill="#22c55e"/><circle cx="11" cy="-60" r="5.5" fill="#16a34a"/>
    </g>
  `);

  R.registerDecorArt("fiddle_leaf_fig", () => `
    <g transform="translate(358, 165)">
      <ellipse cx="0" cy="4" rx="22" ry="4.5" fill="#000" opacity="0.16"/>
      <path d="M-15 2 L-13 -18 L13 -18 L15 2 Z" fill="#d4a359" stroke="#854d0e" stroke-width="1.3"/>
      <line x1="0" y1="-18" x2="0" y2="-56" stroke="#78350f" stroke-width="3.2"/>
      <ellipse cx="-12" cy="-42" rx="12" ry="8" fill="#15803d" transform="rotate(-28 -12 -42)"/>
      <ellipse cx="12" cy="-46" rx="12" ry="8" fill="#16a34a" transform="rotate(28 12 -46)"/>
      <ellipse cx="0" cy="-62" rx="13" ry="9" fill="#22c55e"/>
    </g>
  `);

  R.registerDecorArt("glass_succulent_wall", () => `
    <g transform="translate(358, 164)">
      <rect x="-22" y="-62" width="44" height="62" rx="3" fill="#e0f2fe" fill-opacity="0.28" stroke="url(#hsGoldH)" stroke-width="1.6"/>
      <line x1="-22" y1="-42" x2="22" y2="-42" stroke="#d4af37" stroke-width="1.2"/>
      <line x1="-22" y1="-22" x2="22" y2="-22" stroke="#d4af37" stroke-width="1.2"/>
      <circle cx="-10" cy="-48" r="5.5" fill="#facc15"/><circle cx="10" cy="-48" r="5" fill="#4ade80"/>
      <circle cx="-8" cy="-28" r="5.5" fill="#f472b6"/><circle cx="10" cy="-28" r="5" fill="#34d399"/>
      <circle cx="0" cy="-9" r="6" fill="#22c55e"/>
    </g>
  `);

  R.registerDecorArt("bird_of_paradise", () => `
    <g transform="translate(358, 165)">
      <path d="M-15 2 L-12 -20 L12 -20 L15 2 Z" fill="#fffdf8" stroke="#94a3b8" stroke-width="1.3"/>
      <ellipse cx="-14" cy="-46" rx="16" ry="7" fill="#15803d" transform="rotate(-48 -14 -46)"/>
      <ellipse cx="14" cy="-48" rx="16" ry="7" fill="#16a34a" transform="rotate(42 14 -48)"/>
      <path d="M0 -20 V-62 L12 -70 L4 -58 Z" fill="#f97316"/>
      <path d="M2 -62 L10 -64 L6 -56 Z" fill="#2563eb"/>
    </g>
  `);

  R.registerDecorArt("jiangnan_bamboo_rockery", () => `
    <g transform="translate(360, 164)">
      <ellipse cx="0" cy="4" rx="30" ry="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <path d="M-18 2 Q-12 -26 4 -24 Q16 -22 18 2 Z" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
      <g stroke="#15803d" stroke-width="2.6" class="h-drift-slow">
        <line x1="-8" y1="-20" x2="-10" y2="-76"/><line x1="6" y1="-18" x2="10" y2="-82"/>
      </g>
      <ellipse cx="-14" cy="-64" rx="10" ry="4" fill="#22c55e"/><ellipse cx="14" cy="-70" rx="11" ry="4" fill="#4ade80"/>
    </g>
  `);

  R.registerDecorArt("monet_hydrangea_arch", () => `
    <g transform="translate(360, 164)">
      <path d="M-26 2 V-52 A26 24 0 0 1 26 -52 V2" fill="none" stroke="#475569" stroke-width="2.4"/>
      <circle cx="-22" cy="-54" r="12" fill="#93c5fd"/><circle cx="0" cy="-72" r="14" fill="#c4b5fd"/>
      <circle cx="22" cy="-54" r="12" fill="#f9a8d4"/><circle cx="-10" cy="-64" r="9" fill="#fbcfe8"/>
      <circle cx="12" cy="-64" r="9" fill="#bae6fd"/>
      <ellipse cx="-14" cy="-24" rx="2.8" ry="1.5" fill="#93c5fd" class="h-petal"/>
      <ellipse cx="14" cy="-32" rx="2.6" ry="1.5" fill="#f9a8d4" class="h-petal-d1"/>
    </g>
  `);

  R.registerDecorArt("taihu_pine_bonsai", () => `
    <g transform="translate(362, 164)">
      <path d="M-24 2 L-20 -12 L20 -12 L24 2 Z" fill="#334155" stroke="url(#hsGoldH)" stroke-width="1.3"/>
      <path d="M-12 -12 Q-18 -34 -2 -44 Q14 -38 10 -12 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
      <path d="M-2 -34 Q-16 -56 14 -68" stroke="#5c2d0e" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="-14" cy="-58" rx="16" ry="6.5" fill="#14532d"/>
      <ellipse cx="14" cy="-70" rx="20" ry="7.5" fill="#15803d"/>
      <ellipse cx="4" cy="-50" rx="14" ry="5.5" fill="#166534"/>
    </g>
  `);

  R.registerDecorArt("ancient_podocarpus", () => `
    <g transform="translate(362, 164)">
      <rect x="-24" y="-14" width="48" height="16" rx="3" fill="#7c2d12" stroke="url(#hsGoldH)" stroke-width="1.4"/>
      <path d="M0 -14 Q-12 -40 4 -64 Q14 -72 22 -76" stroke="#451a03" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="-16" cy="-44" rx="16" ry="7" fill="#15803d"/><ellipse cx="18" cy="-54" rx="16" ry="7" fill="#166534"/>
      <ellipse cx="2" cy="-72" rx="22" ry="8.5" fill="#22c55e" stroke="#14532d" stroke-width="0.9"/>
    </g>
  `);

  R.registerDecorArt("hanging_gold_vines", () => `
    <g transform="translate(362, 164)">
      <rect x="-18" y="-82" width="36" height="8" rx="3" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.4" class="h-float-slow"/>
      <g stroke="#34d399" stroke-width="2.2" fill="none" class="h-drift">
        <path d="M-12 -74 Q-18 -44 -10 -12"/><path d="M0 -74 Q6 -40 -2 -6"/><path d="M12 -74 Q18 -46 10 -14"/>
      </g>
      <circle cx="-12" cy="-38" r="3" fill="#fef08a" filter="url(#hsGlowSm)" class="h-twinkle"/>
      <circle cx="2" cy="-24" r="3.2" fill="#fde047" filter="url(#hsGlowSm)" class="h-twinkle-d1"/>
      <circle cx="12" cy="-46" r="2.8" fill="#34d399" filter="url(#hsGlowSm)" class="h-twinkle-d2"/>
    </g>
  `);

  R.registerDecorArt("zerog_crystal_biosphere", () => `
    <g transform="translate(362, 134)">
      <ellipse cx="0" cy="34" rx="22" ry="5" fill="#38bdf8" opacity="0.26" filter="url(#hsGlowMd)" class="h-pulse"/>
      <g class="h-float">
        <circle cx="0" cy="0" r="28" fill="#0ea5e9" fill-opacity="0.22" stroke="#7dd3fc" stroke-width="1.8" filter="url(#hsGlowSm)"/>
        <path d="M-20 8 Q0 2 20 8 Q10 22 -10 22 Z" fill="#10b981" opacity="0.88"/>
        <circle cx="0" cy="-6" r="9" fill="#34d399" opacity="0.9"/>
        <g class="h-spin-slow"><ellipse cx="0" cy="0" rx="34" ry="8" transform="rotate(-18)" fill="none" stroke="url(#hsGoldH)" stroke-width="1.2"/></g>
      </g>
    </g>
  `);

  // ==================== 5. POOL / WATER FEATURES (9 NEW) ====================

  R.registerDecorArt("stone_water_bowl", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="4" rx="34" ry="8" fill="#000" opacity="0.16"/>
      <ellipse cx="0" cy="0" rx="32" ry="10" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
      <ellipse cx="0" cy="-1" rx="25" ry="7" fill="#38bdf8"/>
      <ellipse cx="0" cy="-1" rx="14" ry="4" fill="none" stroke="#e0f2fe" stroke-width="1" class="h-ripple"/>
      <circle cx="8" cy="-2" r="3" fill="#f9a8d4"/>
    </g>
  `);

  R.registerDecorArt("bamboo_drip_basin", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="44" ry="11" fill="#475569" stroke="#1e293b" stroke-width="1.6"/>
      <ellipse cx="0" cy="1" rx="36" ry="8" fill="#0ea5e9"/>
      <ellipse cx="0" cy="1" rx="20" ry="4.5" fill="none" stroke="#bae6fd" stroke-width="1" class="h-ripple"/>
      <path d="M30 0 V-22 L10 -14" stroke="#16a34a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <line x1="10" y1="-12" x2="10" y2="0" stroke="#bae6fd" stroke-width="1.8" stroke-dasharray="3 2" class="h-flow-rev"/>
    </g>
  `);

  R.registerDecorArt("jiangnan_brook_pool", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="52" ry="12" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
      <ellipse cx="0" cy="1" rx="44" ry="9.5" fill="#0284c7"/>
      <ellipse cx="-14" cy="-8" rx="18" ry="6" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>
      <path d="M-12 -5 Q-6 0 -2 4" stroke="#bae6fd" stroke-width="2.2" fill="none" stroke-dasharray="3 2" class="h-flow-rev"/>
      <ellipse cx="8" cy="2" rx="18" ry="4" fill="none" stroke="#e0f2fe" stroke-width="1" class="h-ripple"/>
    </g>
  `);

  R.registerDecorArt("sunroom_jacuzzi", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="52" ry="13" fill="url(#hsIvory)" stroke="#cbd5e1" stroke-width="1.8"/>
      <ellipse cx="0" cy="0" rx="44" ry="9.5" fill="#38bdf8"/>
      <circle cx="-18" cy="-1" r="4" fill="#ffffff" opacity="0.88" class="h-pulse"/>
      <circle cx="-6" cy="2" r="3.5" fill="#ffffff" opacity="0.82" class="h-pulse"/>
      <circle cx="14" cy="-2" r="4.2" fill="#ffffff" opacity="0.88" class="h-pulse"/>
      <circle cx="24" cy="1" r="3" fill="#f472b6" opacity="0.88"/>
      <path d="M-12 -8 Q-14 -18 -10 -24 M12 -8 Q14 -18 10 -24" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.65" class="h-steam"/>
    </g>
  `);

  R.registerDecorArt("versailles_rose_fountain", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="56" ry="13" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.8"/>
      <ellipse cx="0" cy="1" rx="48" ry="9.5" fill="#38bdf8"/>
      <rect x="-5" y="-22" width="10" height="22" fill="url(#hsIvory)" stroke="#cbd5e1" stroke-width="1"/>
      <ellipse cx="0" cy="-22" rx="18" ry="5" fill="url(#hsIvory)" stroke="url(#hsGoldH)" stroke-width="1.2"/>
      <path d="M0 -24 V-38 M0 -36 Q-18 -26 -24 -2 M0 -36 Q18 -26 24 -2" stroke="#bae6fd" stroke-width="2" fill="none" stroke-dasharray="5 3" class="h-flow"/>
      <circle cx="-26" cy="2" r="2.6" fill="#f43f5e"/><circle cx="26" cy="0" r="2.6" fill="#fb7185"/>
    </g>
  `);

  R.registerDecorArt("sky_cantilever_pool", () => `
    <g transform="translate(318, 186)">
      <rect x="-54" y="-12" width="108" height="22" rx="5" fill="#0284c7" fill-opacity="0.72" stroke="#bae6fd" stroke-width="2"/>
      <rect x="-50" y="-8" width="100" height="14" rx="3" fill="url(#hsWaterDeep)" opacity="0.85"/>
      <line x1="-42" y1="-2" x2="36" y2="-2" stroke="#e0f2fe" stroke-width="1.4" opacity="0.7" class="h-drift"/>
      <rect x="-54" y="8" width="108" height="3" fill="#38bdf8" filter="url(#hsGlowSm)" class="h-pulse"/>
    </g>
  `);

  R.registerDecorArt("aurora_swan_pool", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="56" ry="13" fill="#bae6fd" fill-opacity="0.45" stroke="#e0f2fe" stroke-width="1.8"/>
      <ellipse cx="0" cy="1" rx="48" ry="9.5" fill="url(#hsAuroraCyan)" opacity="0.72" class="h-aurora"/>
      <!-- Twin ice-sculpted swans -->
      <path d="M-26 0 Q-22 -22 -10 -18 Q-6 -14 -12 -6" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" filter="url(#hsGlowSm)"/>
      <path d="M26 0 Q22 -22 10 -18 Q6 -14 12 -6" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" filter="url(#hsGlowSm)"/>
      <circle cx="0" cy="-14" r="2.2" fill="#fef08a" class="h-twinkle"/>
    </g>
  `);

  R.registerDecorArt("saturn_stardust_pool", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="58" ry="13" fill="#1e1b4b" stroke="#7dd3fc" stroke-width="1.8"/>
      <ellipse cx="0" cy="1" rx="48" ry="9.5" fill="#312e81"/>
      <ellipse cx="0" cy="-10" rx="44" ry="8" transform="rotate(-10)" fill="none" stroke="#fde68a" stroke-width="2" stroke-dasharray="10 5" class="h-flow" filter="url(#hsGlowSm)"/>
      <circle cx="0" cy="-12" r="9" fill="#c084fc" filter="url(#hsGlowSm)" class="h-float"/>
    </g>
  `);

  R.registerDecorArt("hourglass_star_pool", () => `
    <g transform="translate(318, 186)">
      <ellipse cx="0" cy="2" rx="56" ry="13" fill="url(#hsObsidian)" stroke="url(#hsGoldH)" stroke-width="2"/>
      <ellipse cx="0" cy="1" rx="46" ry="9.5" fill="#1e1b4b" stroke="#fbbf24" stroke-width="1"/>
      <g class="h-float-slow">
        <path d="M-14 -42 H14 L2 -22 L14 -2 H-14 L-2 -22 Z" fill="#38bdf8" fill-opacity="0.24" stroke="url(#hsGoldH)" stroke-width="1.8"/>
        <!-- Reverse-flowing golden time sand -->
        <line x1="0" y1="-4" x2="0" y2="-38" stroke="#fef08a" stroke-width="2.2" stroke-dasharray="3 3" class="h-flow" filter="url(#hsGlowSm)"/>
      </g>
    </g>
  `);

  // ==================== 6. WEARABLES (16 NEW, 36x36 MASCOT SPACE) ====================

  // --- HATS (5) ---
  R.registerWearArt("mushroom_cap", () => `
    <g>
      <path d="M8.4 15.0 C9.2 8.2 26.8 8.2 27.6 15.0 Q18 16.6 8.4 15.0 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.85"/>
      <circle cx="13.2" cy="11.6" r="1.45" fill="#fffbeb"/>
      <circle cx="18.2" cy="10.2" r="1.7" fill="#fffbeb"/>
      <circle cx="23.2" cy="12.0" r="1.35" fill="#fffbeb"/>
    </g>
  `);

  R.registerWearArt("anc_headphones", () => `
    <g>
      <path d="M8.6 19.8 C8.4 10.6 27.6 10.6 27.4 19.8" fill="none" stroke="#334155" stroke-width="1.7" stroke-linecap="round"/>
      <rect x="6.4" y="17.8" width="3.6" height="6.8" rx="1.6" fill="#475569" stroke="#0f172a" stroke-width="0.7"/>
      <rect x="26.0" y="17.8" width="3.6" height="6.8" rx="1.6" fill="#475569" stroke="#0f172a" stroke-width="0.7"/>
      <circle cx="8.2" cy="21.2" r="0.7" fill="#38bdf8"/><circle cx="27.8" cy="21.2" r="0.7" fill="#38bdf8"/>
    </g>
  `);

  R.registerWearArt("newsboy_cap", () => `
    <g>
      <path d="M9.6 14.8 C10.4 9.6 25.4 9.2 26.6 14.4 Q18 16.0 9.6 14.8 Z" fill="#78716c" stroke="#292524" stroke-width="0.85"/>
      <path d="M10.2 14.6 Q18 13.4 27.8 15.6 Q22.0 16.2 15.8 15.4 Z" fill="#57534e" stroke="#292524" stroke-width="0.7"/>
      <circle cx="18" cy="10.2" r="0.8" fill="#44403c"/>
    </g>
  `);

  R.registerWearArt("phd_mortarboard", () => `
    <g>
      <polygon points="8.2,12.2 18,9.2 27.8,12.2 18,15.2" fill="#18181b" stroke="#3f3f46" stroke-width="0.75"/>
      <path d="M12.4 13.6 V15.6 Q18 16.8 23.6 15.6 V13.6" fill="#27272a" stroke="#18181b" stroke-width="0.6"/>
      <path d="M18 12.2 L26.2 13.4 L26.6 18.2" fill="none" stroke="#facc15" stroke-width="0.85" stroke-linecap="round"/>
      <circle cx="26.6" cy="18.6" r="1.0" fill="#fde047"/>
    </g>
  `);

  R.registerWearArt("ice_crystal_tiara", () => `
    <g>
      <path d="M11.4 14.4 L13.4 9.6 L15.6 12.2 L18 7.6 L20.4 12.2 L22.6 9.6 L24.6 14.4 Q18 15.6 11.4 14.4 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="0.75" stroke-linejoin="round"/>
      <polygon points="18,9.4 19.2,11.6 18,13.6 16.8,11.6" fill="#38bdf8" stroke="#ffffff" stroke-width="0.45"/>
      <circle cx="18" cy="7.2" r="0.8" fill="#ffffff" class="h-twinkle"/>
    </g>
  `);

  // --- OUTFITS (5) ---
  R.registerWearArt("plaid_dev_shirt", () => `
    <g>
      <path d="M8.6 29.0 L6.8 35.2 L29.2 35.2 L27.4 29.0 Q18 32.4 8.6 29.0 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.8"/>
      <path d="M12 30.5 V35.0 M18 31.2 V35.0 M24 30.5 V35.0 M8.5 32.2 H27.5 M7.8 34.0 H28.2" stroke="#1e3a8a" stroke-width="0.85" opacity="0.75"/>
      <path d="M14.2 29.8 L18 32.2 L21.8 29.8" fill="#ffffff" opacity="0.88"/>
    </g>
  `);

  R.registerWearArt("geek_tech_vest", () => `
    <g>
      <path d="M8.4 29.0 L6.4 35.2 L29.6 35.2 L27.6 29.0 Q18 32.4 8.4 29.0 Z" fill="#3f6212" stroke="#1a2e05" stroke-width="0.85"/>
      <line x1="18" y1="31.2" x2="18" y2="35.2" stroke="#1a2e05" stroke-width="0.9"/>
      <rect x="10.2" y="31.8" width="4.4" height="2.6" rx="0.5" fill="#4d7c0f" stroke="#ecfccb" stroke-width="0.4"/>
      <rect x="21.4" y="31.8" width="4.4" height="2.6" rx="0.5" fill="#4d7c0f" stroke="#ecfccb" stroke-width="0.4"/>
    </g>
  `);

  R.registerWearArt("jiangnan_brocade_jacket", () => `
    <g>
      <path d="M8.2 28.8 L6.2 35.3 L29.8 35.3 L27.8 28.8 Q18 32.5 8.2 28.8 Z" fill="#1e3a5f" stroke="#d4af37" stroke-width="0.88"/>
      <path d="M14.8 30.4 Q18 31.8 23.6 31.8 L24.2 35.0" fill="none" stroke="#fde047" stroke-width="0.7"/>
      <line x1="16.4" y1="31.6" x2="19.6" y2="31.6" stroke="#fde047" stroke-width="0.8"/>
      <line x1="16.4" y1="33.4" x2="19.6" y2="33.4" stroke="#fde047" stroke-width="0.8"/>
    </g>
  `);

  R.registerWearArt("velvet_tuxedo", () => `
    <g>
      <path d="M8.0 28.8 L6.0 35.3 L30.0 35.3 L28.0 28.8 Q18 32.5 8.0 28.8 Z" fill="#18181b" stroke="#52525b" stroke-width="0.85"/>
      <polygon points="14.2,29.8 18,34.4 21.8,29.8" fill="#ffffff"/>
      <polygon points="15.4,30.6 18,31.6 15.4,32.6" fill="#dc2626"/>
      <polygon points="20.6,30.6 18,31.6 20.6,32.6" fill="#dc2626"/>
      <circle cx="18" cy="31.6" r="0.6" fill="#facc15"/>
    </g>
  `);

  R.registerWearArt("horizon_halo_cape", (pfx) => `
    <g>
      <ellipse cx="18" cy="24.5" rx="15.2" ry="3.8" fill="none" stroke="#fbbf24" stroke-width="0.85" opacity="0.85" class="h-pulse"/>
      <path d="M6.8 28.4 L3.2 35.5 Q18 36.4 32.8 35.5 L29.2 28.4 Q18 33.2 6.8 28.4 Z" fill="#090517" stroke="#f59e0b" stroke-width="0.95"/>
      <path d="M5.6 34.4 Q18 35.4 30.4 34.4" fill="none" stroke="#a855f7" stroke-width="0.85"/>
      <circle cx="18" cy="31.4" r="1.4" fill="#090517" stroke="#fde047" stroke-width="0.7"/>
    </g>
  `);

  // --- ACCESSORIES (6) ---
  R.registerWearArt("iced_americano", () => `
    <g transform="translate(29.0, 29.0)">
      <line x1="0.8" y1="-4.6" x2="2.2" y2="-7.2" stroke="#16a34a" stroke-width="0.85" stroke-linecap="round"/>
      <path d="M-2.8 -3.6 H2.8 L2.1 3.6 H-2.1 Z" fill="#78350f" fill-opacity="0.86" stroke="#cbd5e1" stroke-width="0.65"/>
      <rect x="-1.6" y="-2.4" width="1.5" height="1.5" fill="#e0f2fe" opacity="0.8"/>
      <rect x="0.2" y="-1.8" width="1.4" height="1.4" fill="#e0f2fe" opacity="0.8"/>
      <rect x="-3.1" y="-4.4" width="6.2" height="1.1" rx="0.4" fill="#f8fafc"/>
    </g>
  `);

  R.registerWearArt("mini_mech_kb", () => `
    <g transform="translate(27.8, 30.2) rotate(-14)">
      <rect x="-5.4" y="-2.4" width="10.8" height="4.8" rx="0.9" fill="#1e293b" stroke="#94a3b8" stroke-width="0.65"/>
      <line x1="-3.8" y1="-0.8" x2="3.8" y2="-0.8" stroke="#38bdf8" stroke-width="0.9" stroke-dasharray="1.2 0.8"/>
      <line x1="-3.8" y1="0.9" x2="3.8" y2="0.9" stroke="#f472b6" stroke-width="0.9" stroke-dasharray="1.4 0.7"/>
    </g>
  `);

  R.registerWearArt("rangefinder_camera", () => `
    <g transform="translate(27.4, 30.0)">
      <rect x="-4.4" y="-2.8" width="8.8" height="5.6" rx="1.0" fill="#18181b" stroke="#cbd5e1" stroke-width="0.65"/>
      <rect x="-4.4" y="-2.8" width="8.8" height="1.7" rx="0.5" fill="#e2e8f0"/>
      <circle cx="0.2" cy="0.4" r="1.9" fill="#334155" stroke="#fbbf24" stroke-width="0.55"/>
      <circle cx="-2.8" cy="-1.9" r="0.55" fill="#dc2626"/>
    </g>
  `);

  R.registerWearArt("croc_briefcase", () => `
    <g transform="translate(29.2, 30.2)">
      <path d="M-1.8 -3.0 Q0 -4.8 1.8 -3.0" fill="none" stroke="#451a03" stroke-width="0.8"/>
      <rect x="-4.4" y="-3.0" width="8.8" height="6.2" rx="1.0" fill="#5c2d0e" stroke="#2e1304" stroke-width="0.7"/>
      <line x1="-4.4" y1="-0.8" x2="4.4" y2="-0.8" stroke="#78350f" stroke-width="0.5"/>
      <rect x="-1.1" y="-1.4" width="2.2" height="1.4" rx="0.3" fill="#facc15"/>
    </g>
  `);

  R.registerWearArt("floating_compute_cube", () => `
    <g transform="translate(30.4, 21.8)">
      <g class="h-float">
        <polygon points="0,-4.2 3.8,-2.0 3.8,2.2 0,4.4 -3.8,2.2 -3.8,-2.0" fill="#1e1b4b" stroke="#38bdf8" stroke-width="0.75"/>
        <path d="M-3.8 -2.0 L0 0.2 L3.8 -2.0 M0 0.2 V4.4" fill="none" stroke="#c084fc" stroke-width="0.65"/>
        <circle cx="0" cy="0.2" r="1.0" fill="#fef08a" class="h-twinkle"/>
      </g>
    </g>
  `);

  R.registerWearArt("taichu_carrot_halo", () => `
    <g>
      <g transform="translate(4.8, 22.0)">
        <g class="h-float">
          <circle cx="0" cy="0" r="3.4" fill="#fde047" opacity="0.24"/>
          <path d="M-1.2 -1.8 L1.2 -1.8 L0 2.6 Z" fill="#f97316" stroke="#fef08a" stroke-width="0.45"/>
          <path d="M0 -1.9 L-0.8 -3.2 M0 -1.9 L0.8 -3.2" stroke="#34d399" stroke-width="0.55"/>
        </g>
      </g>
      <g transform="translate(31.2, 22.0)">
        <g class="h-float-slow">
          <circle cx="0" cy="0" r="3.4" fill="#38bdf8" opacity="0.24"/>
          <path d="M-1.2 -1.8 L1.2 -1.8 L0 2.6 Z" fill="#f59e0b" stroke="#fffbeb" stroke-width="0.45"/>
          <path d="M0 -1.9 L-0.8 -3.2 M0 -1.9 L0.8 -3.2" stroke="#34d399" stroke-width="0.55"/>
        </g>
      </g>
    </g>
  `);

  // ==================== GACHA-EXCLUSIVE DECORS (5) ====================
  R.registerDecorArt("gacha_carrot_cushion", () => `
    <g>
      <ellipse cx="92" cy="171" rx="46" ry="7.5" fill="#000" opacity="0.16"/>
      <ellipse cx="92" cy="160" rx="42" ry="15" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
      <ellipse cx="92" cy="158" rx="34" ry="11" fill="#fed7aa" opacity="0.72"/>
      <!-- Plush hugging carrot pillow resting inside cushion nest -->
      <g transform="translate(88, 152) rotate(-12)">
        <path d="M-14 -4 Q0 -10 18 0 Q0 10 -14 4 Q-20 0 -14 -4 Z" fill="#f97316" stroke="#9a3412" stroke-width="1.1"/>
        <path d="M-6 -4 Q-4 0 -6 4 M4 -5 Q6 0 4 5" fill="none" stroke="#fed7aa" stroke-width="0.9" opacity="0.7"/>
        <path d="M-18 0 Q-25 -6 -21 -10 M-18 0 Q-26 0 -24 5" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
      </g>
      <circle cx="116" cy="153" r="4.5" fill="#fef08a" stroke="#f59e0b" stroke-width="0.8"/>
    </g>
  `);

  R.registerDecorArt("gacha_lucky_flower", () => `
    <g transform="translate(362, 160)">
      <ellipse cx="0" cy="4" rx="18" ry="4" fill="#000" opacity="0.16"/>
      <!-- Two-tone pastel gacha capsule planter pot -->
      <path d="M-12 -16 H12 L9 2 Q0 5 -9 2 Z" fill="#38bdf8" stroke="#0369a1" stroke-width="1.2"/>
      <rect x="-13.5" y="-19" width="27" height="4.5" rx="2" fill="#ffffff" stroke="#0369a1" stroke-width="1.1"/>
      <!-- Sprouting four-leaf clover & glowing lucky star blossom -->
      <path d="M0 -19 Q-4 -36 -10 -44 M0 -19 Q2 -40 0 -52 M0 -19 Q6 -35 12 -42" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/>
      <g fill="#22c55e" stroke="#15803d" stroke-width="0.7">
        <circle cx="-11" cy="-45" r="4"/><circle cx="-6" cy="-42" r="3.6"/>
        <circle cx="12" cy="-43" r="4"/><circle cx="8" cy="-40" r="3.6"/>
      </g>
      <path d="M0 -60 L2.2 -54.5 L8 -54 L3.6 -50.2 L5 -44.5 L0 -47.6 L-5 -44.5 L-3.6 -50.2 L-8 -54 L-2.2 -54.5 Z" fill="#fef08a" stroke="#f59e0b" stroke-width="0.9" filter="url(#hsGlowSm)" class="h-pulse"/>
      <circle cx="-14" cy="-54" r="1.5" fill="#fde047" class="h-twinkle"/>
      <circle cx="15" cy="-52" r="1.4" fill="#38bdf8" class="h-twinkle-d1"/>
    </g>
  `);

  R.registerDecorArt("gacha_mini_machine", () => `
    <g transform="translate(88, 168)">
      <ellipse cx="0" cy="3" rx="26" ry="5.5" fill="#000" opacity="0.18"/>
      <!-- Cute retro bunny-ear desktop gacha machine figurine -->
      <ellipse cx="-8" cy="-54" rx="3.4" ry="7.5" transform="rotate(-12 -8 -54)" fill="#fffdf8" stroke="#9a3412" stroke-width="1.2"/>
      <ellipse cx="8" cy="-54" rx="3.4" ry="7.5" transform="rotate(12 8 -54)" fill="#fffdf8" stroke="#9a3412" stroke-width="1.2"/>
      <circle cx="0" cy="-38" r="15" fill="#fff7ed" fill-opacity="0.88" stroke="#9a3412" stroke-width="1.4"/>
      <circle cx="-5" cy="-35" r="3.4" fill="#38bdf8"/><circle cx="5" cy="-35" r="3.4" fill="#c084fc"/>
      <circle cx="0" cy="-41" r="3.8" fill="#f59e0b"/><circle cx="0" cy="-32" r="3.1" fill="#fb7185"/>
      <path d="M-9 -44 A11 11 0 0 1 2 -50" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      <rect x="-14" y="-25" width="28" height="4.5" rx="2" fill="#f59e0b" stroke="#9a3412" stroke-width="1.1"/>
      <path d="M-13 -21 H13 L15 0 Q15 3 11 3 H-11 Q-15 3 -15 0 Z" fill="#f97316" stroke="#9a3412" stroke-width="1.4"/>
      <circle cx="0" cy="-12" r="5" fill="#fffbeb" stroke="#9a3412" stroke-width="1.1"/>
      <rect x="-4" y="-13.4" width="8" height="2.8" rx="1.2" fill="#f59e0b"/>
      <rect x="-6" y="-4.5" width="12" height="5" rx="2" fill="#7c2d12"/>
      <circle cx="0" cy="-2" r="2" fill="#fde047" class="h-twinkle"/>
    </g>
  `);

  R.registerDecorArt("gacha_bubble_lights", () => `
    <g>
      <path d="M24 6 Q116 32 210 18 Q304 32 396 6" fill="none" stroke="#94a3b8" stroke-width="1.3"/>
      <g filter="url(#hsGlowSm)">
        <circle cx="72"  cy="19" r="6.5" fill="#38bdf8" fill-opacity="0.86" stroke="#e0f2fe" stroke-width="1" class="h-float"/>
        <circle cx="136" cy="24" r="7.2" fill="#c084fc" fill-opacity="0.88" stroke="#f5d0fe" stroke-width="1" class="h-float-slow"/>
        <circle cx="210" cy="20" r="8.2" fill="#fde047" fill-opacity="0.92" stroke="#fffbeb" stroke-width="1.1" class="h-pulse"/>
        <circle cx="284" cy="24" r="7.2" fill="#f472b6" fill-opacity="0.88" stroke="#fce7f3" stroke-width="1" class="h-float"/>
        <circle cx="348" cy="19" r="6.5" fill="#34d399" fill-opacity="0.86" stroke="#d1fae5" stroke-width="1" class="h-float-slow"/>
      </g>
      <circle cx="104" cy="36" r="1.6" fill="#fef08a" class="h-twinkle"/>
      <circle cx="316" cy="36" r="1.6" fill="#f0abfc" class="h-twinkle-d1"/>
    </g>
  `);

  R.registerDecorArt("gacha_crystal_dome", () => `
    <g>
      <polygon points="158,14 262,14 316,148 104,148" fill="url(#hsSunbeam)" opacity="0.24" class="h-pulse"/>
      <line x1="210" y1="0" x2="210" y2="16" stroke="url(#hsGoldH)" stroke-width="2.4"/>
      <g transform="translate(210, 34)">
        <ellipse cx="0" cy="0" rx="52" ry="13" fill="none" stroke="url(#hsGoldH)" stroke-width="2" filter="url(#hsGlowSm)"/>
        <ellipse cx="0" cy="0" rx="36" ry="9" fill="none" stroke="url(#hsPrism)" stroke-width="1.5" stroke-dasharray="10 5" class="h-flow"/>
        <circle cx="0" cy="0" r="14" fill="#fffbeb" fill-opacity="0.88" stroke="url(#hsGoldH)" stroke-width="1.8" filter="url(#hsGlowMd)"/>
        <polygon points="0,-10 7,0 0,10 -7,0" fill="url(#hsPrism)" opacity="0.85" class="h-pulse"/>
        <circle cx="-44" cy="4" r="3" fill="#38bdf8" class="h-twinkle"/>
        <circle cx="44" cy="4" r="3" fill="#f472b6" class="h-twinkle-d1"/>
        <circle cx="0" cy="18" r="2.6" fill="#fde047" class="h-twinkle-d2"/>
      </g>
    </g>
  `);

  // ==================== GACHA-EXCLUSIVE WEARABLES (5) ====================
  R.registerWearArt("gacha_clover_clip", () => `
    <g transform="translate(10.8, 13.8) rotate(-18)">
      <circle cx="-1.6" cy="-1.4" r="1.7" fill="#22c55e" stroke="#14532d" stroke-width="0.45"/>
      <circle cx="1.6" cy="-1.4" r="1.7" fill="#4ade80" stroke="#14532d" stroke-width="0.45"/>
      <circle cx="-1.6" cy="1.4" r="1.7" fill="#4ade80" stroke="#14532d" stroke-width="0.45"/>
      <circle cx="1.6" cy="1.4" r="1.7" fill="#22c55e" stroke="#14532d" stroke-width="0.45"/>
      <circle cx="0" cy="0" r="1.0" fill="#fef08a"/>
    </g>
  `);

  R.registerWearArt("gacha_capsule_bag", () => `
    <g transform="translate(28.4, 29.5)">
      <path d="M-4.6 -5.4 Q-1 -1.8 0.4 -2.2" fill="none" stroke="#f59e0b" stroke-width="0.8"/>
      <circle cx="0" cy="0" r="4.0" fill="#c084fc" stroke="#6b21a8" stroke-width="0.7"/>
      <path d="M-3.8 0 A3.8 3.8 0 0 0 3.8 0 Z" fill="#ffffff"/>
      <line x1="-3.9" y1="0" x2="3.9" y2="0" stroke="#6b21a8" stroke-width="0.6"/>
      <circle cx="0" cy="-1.5" r="1.0" fill="#fef08a"/>
    </g>
  `);

  R.registerWearArt("gacha_ribbon_cape", () => `
    <g>
      <path d="M7.8 28.6 L4.8 35.4 Q18 36.4 31.2 35.4 L28.2 28.6 Q18 32.8 7.8 28.6 Z" fill="#a855f7" stroke="#f472b6" stroke-width="0.9"/>
      <path d="M9.6 30.8 Q18 34.4 26.4 30.8" fill="none" stroke="#fef08a" stroke-width="0.8" opacity="0.88"/>
      <polygon points="15.2,30.2 18,31.4 15.2,32.6" fill="#f472b6" stroke="#fde047" stroke-width="0.4"/>
      <polygon points="20.8,30.2 18,31.4 20.8,32.6" fill="#f472b6" stroke="#fde047" stroke-width="0.4"/>
      <circle cx="18" cy="31.4" r="0.95" fill="#fef08a"/>
    </g>
  `);

  R.registerWearArt("gacha_star_wand", () => `
    <g transform="translate(29.8, 25.0) rotate(18)">
      <line x1="0" y1="-2" x2="0" y2="8.5" stroke="#f59e0b" stroke-width="1.25" stroke-linecap="round"/>
      <path d="M-4.6 -3.8 Q-2 -6 0 -3.4 Q2 -6 4.6 -3.8 Q2.4 -1.4 0 -2.4 Q-2.4 -1.4 -4.6 -3.8 Z" fill="#f0abfc" opacity="0.88"/>
      <path d="M0 -7.6 L1.1 -4.7 L4.2 -4.5 L1.8 -2.6 L2.6 0.3 L0 -1.3 L-2.6 0.3 L-1.8 -2.6 L-4.2 -4.5 L-1.1 -4.7 Z" fill="#fef08a" stroke="#d97706" stroke-width="0.55" class="h-pulse"/>
    </g>
  `);

  R.registerWearArt("gacha_prism_crown", () => `
    <g>
      <ellipse cx="18" cy="9.2" rx="8.6" ry="2.2" fill="none" stroke="#fde047" stroke-width="0.65" opacity="0.72" class="h-pulse"/>
      <path d="M11.6 15.2 L10.6 9.6 L14.4 12.2 L18 7.8 L21.6 12.2 L25.4 9.6 L24.4 15.2 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="0.75" stroke-linejoin="round"/>
      <circle cx="18" cy="12.6" r="1.4" fill="#38bdf8"/>
      <circle cx="13.8" cy="13.2" r="1.0" fill="#ec4899"/>
      <circle cx="22.2" cy="13.2" r="1.0" fill="#a855f7"/>
      <circle cx="18" cy="7.2" r="1.0" fill="#ffffff" class="h-twinkle"/>
    </g>
  `);
})(typeof window !== "undefined" ? window : globalThis);
