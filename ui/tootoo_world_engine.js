// ============================================================
// TooToo Living World & Interactive Mechanisms Engine (T1 -> T10)
//   T1: Street lamp & stray kitten
//   T2: Cute interactive insects (ladybug / fireflies / butterflies / dragonfly)
//   T3: Clickable curtains & cozy craft lamp
//   T4: Panoramic curtains + bespoke nature toys (bamboo deer-scarer / owl / fireplace / rainbow sprinkler / turbo windmill)
//   T5: Electric sheer curtains + neon / vinyl record player / wetland egrets telescope
//   T6: Luxury drapes + chandelier dimmer + koi feeding / sky firepit / white grand piano / guqin
//   T7: Wonder-grade spectacles (lava eruption & dragon / deep-sea whale / rainbow skyship / 3-color aurora & ice chimes / flower bloom & gold butterflies)
//   T8: Interstellar spectacles (live random meteors + wish-upon-a-star / drifting planets & starships / low-gravity moon jump / holographic planet switcher)
//   T9: Dimensional Bunny-Transforming Shrines (Invisibility Prism / Holy Glow Crystal / Twin Teleport Portals / Giant-Mini Ray / Quantum Clone Mirror / Time Speed Wheel)
//   T10: Creator's Sovereign Palace (Live Time Control / Live Weather + Exclusive Aurora-Meteor Shower / All Bunny God Powers / Creation Chimes / Starlight Dragon)
// ============================================================
(function (global) {
  const roomState = {
    streetLampOn: true,
    curtainsClosed: false,
    lampOn: true,
    fireBoost: false,
    sprinklerRainbow: false,
    windmillTurbo: false,
    neonIdx: 0,
    chandelierMode: 0, // 0 warm, 1 starlight, 2 party
    lavaErupt: false,
    whaleVisit: false,
    rainbowBridge: false,
    auroraMode: 0, // 0 emerald-cyan, 1 violet-rose, 2 solar-gold
    flowersBloom: false,
    holoPlanet: 0, // 0 Earth, 1 Saturn, 2 Mars, 3 BlackHole
    timeSpeed: 1,  // 1 normal, 2 turbo, -1 reverse
    dragonActive: false,
    // T10 Creator Overrides (null = follow real/default)
    creatorTime: null,    // null | "dawn" | "day" | "dusk" | "night"
    creatorWeather: null, // null | "sunny" | "cloudy" | "windy" | "rain" | "snow" | "aurora_meteor"
  };

  const bunnyFx = {
    invisible: false,
    glow: false,
    scaleMode: "normal", // "normal" | "giant" | "mini"
    lowGrav: false,
    prismClone: false,
  };

  let ambientTimer = null;
  let lastHouseId = null;

  function resetForHouseChange(houseId) {
    if (lastHouseId === houseId) return;
    lastHouseId = houseId;
    const R = global.TooTooRegistry;
    const h = R && R.getHouse(houseId);
    const tier = (h && h.tier) || 1;
    // Reset bunny special states when stepping down to lower tiers where those devices don't exist
    if (tier < 8) bunnyFx.lowGrav = false;
    if (tier < 9) {
      bunnyFx.invisible = false;
      bunnyFx.glow = false;
      bunnyFx.scaleMode = "normal";
      bunnyFx.prismClone = false;
    }
    if (tier < 10) {
      roomState.creatorTime = null;
      roomState.creatorWeather = null;
    }
  }

  function getZones(houseId) {
    const R = global.TooTooRegistry;
    const h = R && R.getHouse(houseId);
    if (!h || (h.worldWidth || 420) <= 420) return [];
    const t = h.tier || 1;
    if (t === 3) return [{ name: "主卧", x: 200 }, { name: "书角", x: 452 }];
    if (t === 4) return [{ name: "主厅", x: 200 }, { name: "全景大窗", x: 500 }];
    if (t === 5) return [{ name: "精装客厅", x: 210 }, { name: "观景露台", x: 590 }];
    if (t === 6) {
      const w3 = houseId === "wulin_yihao" ? "云端泳池" : (houseId === "yunqi_rose" ? "钢琴花亭" : "临水琴亭");
      return [{ name: "奢华主厅", x: 210 }, { name: "私家园林", x: 560 }, { name: w3, x: 830 }];
    }
    if (t === 7) {
      const m = {
        obsidian_fortress: ["熔岩圣殿", "龙焰锻炉", "火山祭坛"],
        atlantis:          ["珍珠主殿", "巨鲸穹廊", "海王圣坛"],
        sky_castle:        ["羽翼主殿", "彩虹天桥", "浮空飞艇港"],
        aurora_ice_palace: ["冰棱主厅", "极光镜湖", "冰风铃圣殿"],
        hanging_gardens:   ["白金主廊", "三层花瀑", "金蝶花亭"],
      }[houseId] || ["主殿", "奇观中庭", "圣坛"];
      return [{ name: m[0], x: 210 }, { name: m[1], x: 540 }, { name: m[2], x: 900 }];
    }
    if (t === 8) {
      const m = {
        lunar_base:          ["生态主舱", "地出星廊", "低重力实验台"],
        rocket:              ["曲率舰桥", "星海长廊", "引擎核心舱"],
        mars_dome:           ["红岩主舱", "峡谷穹顶", "火星星港"],
        saturn_ring_station: ["白金主厅", "冰环画廊", "失重星门"],
        dyson_sphere:        ["蜂巢主殿", "恒星日冕", "算力中枢"],
      }[houseId] || ["主舱", "星海观测廊", "实验港"];
      return [{ name: m[0], x: 210 }, { name: m[1], x: 620 }, { name: m[2], x: 1050 }];
    }
    if (t === 9) {
      return [
        { name: "① 量子主殿", x: 200 },
        { name: "② 隐身·圣光坛", x: 540 },
        { name: "③ 变形·分身廊", x: 880 },
        { name: "④ 次元星门厅", x: 1220 },
      ];
    }
    if (t === 10) {
      return [
        { name: "① 星穹主殿", x: 210 },
        { name: "② 日晷编钟台", x: 620 },
        { name: "③ 星河水苑", x: 1040 },
        { name: "④ 造物主神坛", x: 1440 },
      ];
    }
    return [];
  }

  function getDirtySignature(houseId) {
    resetForHouseChange(houseId);
    return [
      roomState.streetLampOn ? 1 : 0,
      roomState.curtainsClosed ? 1 : 0,
      roomState.lampOn ? 1 : 0,
      roomState.fireBoost ? 1 : 0,
      roomState.sprinklerRainbow ? 1 : 0,
      roomState.windmillTurbo ? 1 : 0,
      roomState.neonIdx,
      roomState.chandelierMode,
      roomState.lavaErupt ? 1 : 0,
      roomState.whaleVisit ? 1 : 0,
      roomState.rainbowBridge ? 1 : 0,
      roomState.auroraMode,
      roomState.flowersBloom ? 1 : 0,
      roomState.holoPlanet,
      roomState.timeSpeed,
      roomState.dragonActive ? 1 : 0,
      roomState.creatorTime || "-",
      roomState.creatorWeather || "-",
      bunnyFx.invisible ? 1 : 0,
      bunnyFx.glow ? 1 : 0,
      bunnyFx.scaleMode,
      bunnyFx.lowGrav ? 1 : 0,
      bunnyFx.prismClone ? 1 : 0,
    ].join(":");
  }

  // ---- Render Interactive Hotspots & Living Props inside the SVG World ----
  function renderInteractiveLayerSvg(house, dp) {
    if (!house) return "";
    resetForHouseChange(house.id);
    const tier = house.tier || 1;
    const id = house.id;
    const isNight = !!(dp && dp.isNight);
    let svg = "";

    // === T1: Street Lamp Toggle + Stray Black Kitten ===
    if (tier === 1) {
      svg += `
        <g class="h-hotspot" data-hotspot="t1_lamp" transform="translate(96, 46)">
          <title>点击开关路灯</title>
          <circle cx="0" cy="0" r="14" fill="transparent"/>
          ${roomState.streetLampOn ? `<polygon points="0,4 -32,110 32,110" fill="#fef08a" opacity="0.16" pointer-events="none"/><circle cx="0" cy="0" r="6" fill="#fef08a" filter="url(#hsGlowSm)"/>` : `<circle cx="0" cy="0" r="4.5" fill="#64748b"/>`}
        </g>
        <g class="h-hotspot" data-hotspot="t1_cat" transform="translate(342, 152)">
          <title>点击撸路边小黑猫</title>
          <ellipse cx="0" cy="0" rx="10" ry="7" fill="#1e293b"/>
          <circle cx="-6" cy="-7" r="6" fill="#1e293b"/>
          <polygon points="-11,-11 -9,-17 -5,-12" fill="#1e293b"/><polygon points="-4,-12 -1,-17 0,-11" fill="#1e293b"/>
          <circle cx="-8" cy="-7" r="1.2" fill="#fde047"/><circle cx="-4" cy="-7" r="1.2" fill="#fde047"/>
          <path d="M8 0 Q16 -6 14 -14" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" class="h-drift"/>
        </g>`;
    }

    // === T2: Adorable Interactive Insects (Ladybug / Butterfly / Fireflies / Dragonfly)! ===
    if (tier === 2) {
      svg += `
        <!-- Cute Red Ladybug crawling near shelter -->
        <g class="h-hotspot h-drift" data-hotspot="t2_ladybug" transform="translate(88, 166)">
          <title>点点可爱七星瓢虫！</title>
          <circle cx="0" cy="0" r="12" fill="transparent"/>
          <ellipse cx="0" cy="0" rx="5.5" ry="4.2" fill="#ef4444" stroke="#18181b" stroke-width="0.9"/>
          <circle cx="-5.5" cy="0" r="2.6" fill="#18181b"/>
          <circle cx="-1" cy="-1.5" r="0.9" fill="#18181b"/><circle cx="2" cy="0.6" r="0.9" fill="#18181b"/><circle cx="0" cy="1.8" r="0.8" fill="#18181b"/>
        </g>
        <!-- Fluttering Golden Butterfly -->
        <g class="h-hotspot h-float" data-hotspot="t2_butterfly" transform="translate(328, 92)">
          <title>点点花园小蝴蝶，它会翩翩起舞！</title>
          <circle cx="0" cy="0" r="14" fill="transparent"/>
          <ellipse cx="-5" cy="-2" rx="5.5" ry="4" transform="rotate(-24 -5 -2)" fill="#fbbf24" stroke="#b45309" stroke-width="0.6"/>
          <ellipse cx="5" cy="-2" rx="5.5" ry="4" transform="rotate(24 5 -2)" fill="#fbbf24" stroke="#b45309" stroke-width="0.6"/>
          <ellipse cx="-4" cy="3" rx="3.5" ry="2.6" fill="#f472b6"/><ellipse cx="4" cy="3" rx="3.5" ry="2.6" fill="#f472b6"/>
          <line x1="0" y1="-4" x2="0" y2="5" stroke="#1e293b" stroke-width="1.2"/>
        </g>
        <!-- Glowing Firefly Cluster (extra magical at night, still clickable by day!) -->
        <g class="h-hotspot h-float-slow" data-hotspot="t2_firefly" transform="translate(124, 96)">
          <title>点点发光小萤火虫！</title>
          <circle cx="0" cy="0" r="14" fill="transparent"/>
          <circle cx="0" cy="0" r="6" fill="#fef08a" opacity="${isNight ? "0.42" : "0.22"}" filter="url(#hsGlowSm)"/>
          <circle cx="0" cy="0" r="2.4" fill="#fde047" class="h-twinkle"/>
          <circle cx="11" cy="-7" r="1.9" fill="#a7f3d0" class="h-twinkle-d1"/>
          <circle cx="-8" cy="8" r="1.7" fill="#fef08a" class="h-twinkle-d2"/>
        </g>`;
    }

    // === T3 & T4: Clickable Window Curtains + Cozy Lamp / Bespoke Nature Toys! ===
    if (tier === 3 || tier === 4) {
      const w = house.indoorWindow || { x0: 274, x1: 356, y0: 42, y1: 105 };
      const cw = w.x1 - w.x0;
      const ch = w.y1 - w.y0;
      const cCol = tier === 3 ? "#fef3c7" : "#fff7ed";
      const cEdge = tier === 3 ? "#d97706" : "#b45309";
      svg += `
        <!-- Interactive Window Curtains -->
        <g class="h-hotspot" data-hotspot="toggle_curtains">
          <title>${roomState.curtainsClosed ? "点击拉开窗帘看风景" : "点击拉上温馨窗帘"}</title>
          <line x1="${w.x0 - 6}" y1="${w.y0 - 3}" x2="${w.x1 + 6}" y2="${w.y0 - 3}" stroke="${cEdge}" stroke-width="2.4" stroke-linecap="round"/>
          ${roomState.curtainsClosed
            ? `<rect x="${w.x0 - 1}" y="${w.y0 - 1}" width="${cw / 2 + 1}" height="${ch + 3}" rx="2" fill="${cCol}" stroke="${cEdge}" stroke-width="1" opacity="0.94"/>
               <rect x="${w.x0 + cw / 2}" y="${w.y0 - 1}" width="${cw / 2 + 1}" height="${ch + 3}" rx="2" fill="${cCol}" stroke="${cEdge}" stroke-width="1" opacity="0.94"/>`
            : `<path d="M${w.x0 - 2} ${w.y0 - 2} L${w.x0 + 14} ${w.y0 - 2} Q${w.x0 + 7} ${w.y0 + ch * 0.5} ${w.x0 + 12} ${w.y1 + 2} L${w.x0 - 2} ${w.y1 + 2} Z" fill="${cCol}" stroke="${cEdge}" stroke-width="0.9" opacity="0.88"/>
               <path d="M${w.x1 + 2} ${w.y0 - 2} L${w.x1 - 14} ${w.y0 - 2} Q${w.x1 - 7} ${w.y0 + ch * 0.5} ${w.x1 - 12} ${w.y1 + 2} L${w.x1 + 2} ${w.y1 + 2} Z" fill="${cCol}" stroke="${cEdge}" stroke-width="0.9" opacity="0.88"/>`}
          <rect x="${w.x0}" y="${w.y0}" width="${cw}" height="${ch}" fill="transparent"/>
        </g>`;
      if (tier === 3) {
        // Clickable Cozy Lamp in the 500px right alcove!
        svg += `
          <g class="h-hotspot" data-hotspot="toggle_lamp" transform="translate(446, 146)">
            <title>点击开关暖光小台灯</title>
            ${roomState.lampOn ? `<circle cx="0" cy="-24" r="24" fill="#fde68a" opacity="0.28" filter="url(#hsGlowMd)" pointer-events="none"/>` : ""}
            <rect x="-6" y="-4" width="12" height="4" rx="1.5" fill="#78350f"/>
            <line x1="0" y1="-4" x2="0" y2="-18" stroke="#92400e" stroke-width="2.2"/>
            <polygon points="-10,-16 10,-16 6,-29 -6,-29" fill="${roomState.lampOn ? "#fef08a" : "#cbd5e1"}" stroke="#92400e" stroke-width="1"/>
          </g>`;
      }
      if (tier === 4) {
        // Panoramic Right-Wing Curtain + Bespoke T4 Interactive Nature Mechanism!
        if (id === "moganshan_cabin") {
          svg += `
            <g class="h-hotspot" data-hotspot="t4_fireplace" transform="translate(170, 134)">
              <title>点击给莫干山壁炉添柴旺火！</title>
              <circle cx="0" cy="0" r="${roomState.fireBoost ? 34 : 20}" fill="#f97316" opacity="${roomState.fireBoost ? "0.42" : "0.18"}" filter="url(#hsGlowMd)"/>
              ${roomState.fireBoost ? `<path d="M-14 12 Q-8 -16 0 -22 Q8 -6 14 -14 Q18 6 10 12 Z" fill="#fde047" class="h-pulse"/>` : ""}
            </g>`;
        } else if (id === "sunflower_glasshouse") {
          svg += `
            <g class="h-hotspot" data-hotspot="t4_sprinkler" transform="translate(508, 34)">
              <title>点击开启花房喷雾折射彩虹！</title>
              <rect x="-12" y="-6" width="24" height="10" rx="4" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
              <text x="0" y="2" font-size="7" text-anchor="middle" fill="#fff">💧</text>
              ${roomState.sprinklerRainbow ? `<path d="M-76 96 A76 62 0 0 1 76 96" fill="none" stroke="url(#hsPrism)" stroke-width="7" opacity="0.65" filter="url(#hsGlowSm)" pointer-events="none"/>` : ""}
            </g>`;
        } else if (id === "windmill_mill") {
          svg += `
            <g class="h-hotspot" data-hotspot="t4_windmill" transform="translate(510, 74)">
              <title>点击切换湖畔风车加速模式！</title>
              <circle cx="0" cy="0" r="24" fill="transparent"/>
              <g class="${roomState.windmillTurbo ? "h-spin-fast" : "h-spin-slow"}">
                <line x1="-22" y1="0" x2="22" y2="0" stroke="#fef3c7" stroke-width="2.4"/>
                <line x1="0" y1="-22" x2="0" y2="22" stroke="#fef3c7" stroke-width="2.4"/>
              </g>
              <circle cx="0" cy="0" r="3.5" fill="#f59e0b"/>
            </g>`;
        } else if (id === "treehole") {
          svg += `
            <g class="h-hotspot" data-hotspot="t4_owl" transform="translate(544, 108)">
              <title>点点窗台上的小猫头鹰！</title>
              <ellipse cx="0" cy="0" rx="8.5" ry="10" fill="#92400e" stroke="#451a03" stroke-width="1"/>
              <circle cx="-3.2" cy="-3" r="2.8" fill="#fef08a"/><circle cx="3.2" cy="-3" r="2.8" fill="#fef08a"/>
              <circle cx="-3.2" cy="-3" r="1.2" fill="#18181b"/><circle cx="3.2" cy="-3" r="1.2" fill="#18181b"/>
              <polygon points="0,-1 -2,2 2,2" fill="#f59e0b"/>
            </g>`;
        } else {
          // bamboo_pavilion shishi-odoshi bamboo deer-scarer
          svg += `
            <g class="h-hotspot" data-hotspot="t4_bamboo" transform="translate(520, 134)">
              <title>点击敲响竹筒惊鹿「咚」一声！</title>
              <rect x="-18" y="-12" width="36" height="22" fill="transparent"/>
              <line x1="-14" y1="0" x2="14" y2="-8" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
              <line x1="0" y1="-4" x2="0" y2="10" stroke="#14532d" stroke-width="2.4"/>
            </g>`;
        }
      }
    }

    // === T5: Electric Sheer Curtains + Lifestyle Interactive Gadgets! ===
    if (tier === 5) {
      const w = house.indoorWindow || { x0: 186, x1: 384, y0: 20, y1: 148 };
      if (roomState.curtainsClosed) {
        svg += `<rect x="${w.x0}" y="${w.y0}" width="${w.x1 - w.x0}" height="${w.y1 - w.y0}" fill="#fffdf8" opacity="0.58" pointer-events="none"/>`;
      }
      svg += `
        <g class="h-hotspot" data-hotspot="toggle_curtains" transform="translate(${w.x0 + 18}, ${w.y0 + 14})">
          <title>点击电动开合纱帘</title>
          <rect x="-14" y="-9" width="28" height="16" rx="8" fill="rgba(15,23,42,0.72)" stroke="#e2e8f0" stroke-width="0.9"/>
          <text x="0" y="2.5" font-size="7.2" fill="#fff" text-anchor="middle">${roomState.curtainsClosed ? "拉开" : "纱帘"}</text>
        </g>`;
      if (id === "regent_intl") {
        const neonCols = ["#f472b6", "#38bdf8", "#a855f7"];
        const nc = neonCols[roomState.neonIdx % neonCols.length];
        svg += `
          <g class="h-hotspot" data-hotspot="t5_neon" transform="translate(116, 48)">
            <title>点击切换丽晶赛博霓虹氛围色！</title>
            <rect x="-34" y="-12" width="68" height="22" rx="6" fill="rgba(15,23,42,0.75)" stroke="${nc}" stroke-width="1.8" filter="url(#hsGlowSm)"/>
            <text x="0" y="3" font-size="8.5" font-family="monospace" font-weight="900" fill="${nc}" text-anchor="middle">LOFT ⚡</text>
          </g>`;
      } else if (id === "heanju") {
        svg += `
          <g class="h-hotspot" data-hotspot="t5_vinyl" transform="translate(92, 136)">
            <title>点击播放复古黑胶唱片！</title>
            <rect x="-18" y="-12" width="36" height="14" rx="2.5" fill="#78350f" stroke="#d97706" stroke-width="1"/>
            <ellipse cx="0" cy="-12" rx="12" ry="3.2" fill="#18181b"/>
            <circle cx="0" cy="-12" r="2.2" fill="#ef4444"/>
          </g>`;
      } else {
        svg += `
          <g class="h-hotspot" data-hotspot="t5_egrets" transform="translate(656, 134)">
            <title>点击湿地望远镜召唤白鹭群飞过！</title>
            <line x1="0" y1="0" x2="-8" y2="16" stroke="#475569" stroke-width="2"/>
            <line x1="0" y1="0" x2="8" y2="16" stroke="#475569" stroke-width="2"/>
            <rect x="-14" y="-8" width="28" height="7" rx="3" transform="rotate(-14)" fill="#f8fafc" stroke="#334155" stroke-width="1.1"/>
          </g>`;
      }
    }

    // === T6: Luxury Chandelier Dimmer + Bespoke 3rd-Wing Mansion Interactions! ===
    if (tier === 6) {
      const chCols = ["#fde047", "#38bdf8", "#f472b6"];
      const chC = chCols[roomState.chandelierMode % 3];
      svg += `
        <g class="h-hotspot" data-hotspot="t6_chandelier" transform="translate(210, 28)">
          <title>点击切换顶豪水晶吊灯色温（暖金/星蓝/派对粉）</title>
          <circle cx="0" cy="0" r="24" fill="${chC}" opacity="0.22" filter="url(#hsGlowMd)"/>
          <polygon points="-14,-4 14,-4 8,8 -8,8" fill="${chC}" stroke="#fff" stroke-width="0.9"/>
        </g>`;
      if (id === "yunqi_rose") {
        svg += `<g class="h-hotspot" data-hotspot="t6_piano" transform="translate(822, 144)"><title>点击弹奏白色三角钢琴！</title><circle cx="0" cy="0" r="28" fill="transparent"/></g>`;
      } else if (id === "wulin_yihao") {
        svg += `<g class="h-hotspot" data-hotspot="t6_champagne" transform="translate(894, 132)"><title>点击开启云端香槟派对！</title><circle cx="0" cy="0" r="24" fill="transparent"/></g>`;
      } else if (id === "jiangnanli") {
        svg += `<g class="h-hotspot" data-hotspot="t6_guqin" transform="translate(800, 140)"><title>点击抚琴一曲，曲水流觞！</title><circle cx="0" cy="0" r="26" fill="transparent"/></g>`;
      } else {
        svg += `<g class="h-hotspot" data-hotspot="t6_koi" transform="translate(800, 140)"><title>点击在西溪水亭投喂锦鲤！</title><circle cx="0" cy="0" r="26" fill="transparent"/></g>`;
      }
    }

    // === T7: Monumental 1080px Wonder Mechanisms (2-3 Rich Interactive Spectacles per Palace!) ===
    if (tier === 7) {
      if (id === "obsidian_fortress") {
        svg += `
          ${roomState.lavaErupt ? `<g pointer-events="none"><path d="M622 62 Q640 8 658 62" fill="#f97316" filter="url(#hsGlowLg)" class="h-pulse"/><circle cx="640" cy="24" r="18" fill="#fef08a" opacity="0.72" filter="url(#hsGlowMd)"/></g>` : ""}
          <g class="h-hotspot" data-hotspot="t7_lava" transform="translate(540, 114)">
            <title>点击引爆龙焰锻炉 & 火山熔岩喷发！</title>
            <circle cx="0" cy="0" r="24" fill="#f97316" opacity="0.22" class="h-pulse"/>
            <text x="0" y="4" font-size="14" text-anchor="middle">🌋</text>
          </g>
          <g class="h-hotspot" data-hotspot="t7_dragon" transform="translate(860, 108)">
            <title>点击召唤赤焰火龙掠过苍穹！</title>
            <circle cx="0" cy="0" r="24" fill="#f59e0b" opacity="0.2" class="h-pulse"/>
            <text x="0" y="4" font-size="14" text-anchor="middle">🐉</text>
          </g>`;
      } else if (id === "atlantis") {
        svg += `
          ${roomState.whaleVisit ? `
            <g class="h-swim-across" pointer-events="none" opacity="0.82">
              <path d="M-80 68 Q-30 34 40 52 Q78 62 110 46 Q96 68 112 82 Q70 72 28 78 Q-36 86 -80 68 Z" fill="#0ea5e9" stroke="#bae6fd" stroke-width="1.4"/>
              <circle cx="-48" cy="64" r="2.6" fill="#fff"/>
            </g>` : ""}
          <g class="h-hotspot" data-hotspot="t7_whale" transform="translate(560, 126)">
            <title>点击吹响深海法螺，召唤深海巨鲸游过穹顶！</title>
            <circle cx="0" cy="0" r="22" fill="#38bdf8" opacity="0.24" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">🐚</text>
          </g>
          <g class="h-hotspot" data-hotspot="t7_trident" transform="translate(910, 96)">
            <title>点击点亮海王三叉戟神光！</title>
            <circle cx="0" cy="0" r="24" fill="#fde047" opacity="0.22" class="h-pulse"/>
          </g>`;
      } else if (id === "sky_castle") {
        svg += `
          ${roomState.rainbowBridge ? `<path d="M360 148 Q560 46 760 148" fill="none" stroke="url(#hsPrism)" stroke-width="14" opacity="0.72" filter="url(#hsGlowMd)" pointer-events="none"/>` : ""}
          <g class="h-hotspot" data-hotspot="t7_rainbow" transform="translate(560, 118)">
            <title>点击点亮云海七彩彩虹天桥！</title>
            <circle cx="0" cy="0" r="22" fill="#f472b6" opacity="0.24" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">🌈</text>
          </g>
          <g class="h-hotspot" data-hotspot="t7_airship" transform="translate(910, 72)">
            <title>点击召唤云端蒸汽飞艇巡航！</title>
            <circle cx="0" cy="0" r="24" fill="#38bdf8" opacity="0.22" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">⛵</text>
          </g>`;
      } else if (id === "aurora_ice_palace") {
        const aCols = [["#22d3ee", "#34d399"], ["#c084fc", "#f472b6"], ["#fde047", "#fb923c"]][roomState.auroraMode % 3];
        svg += `
          <g class="h-aurora" filter="url(#hsGlowMd)" pointer-events="none" opacity="0.58">
            <path d="M0 36 Q260 6 540 42 Q820 74 1080 26" fill="none" stroke="${aCols[0]}" stroke-width="16"/>
            <path d="M60 62 Q360 22 680 58 Q920 82 1060 40" fill="none" stroke="${aCols[1]}" stroke-width="10"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_aurora" transform="translate(540, 124)">
            <title>点击冰棱镜切换三色极光天幕！</title>
            <circle cx="0" cy="0" r="22" fill="${aCols[0]}" opacity="0.28" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">🌌</text>
          </g>
          <g class="h-hotspot" data-hotspot="t7_chime" transform="translate(900, 78)">
            <title>点击轻敲水晶冰风铃奏出空灵和弦！</title>
            <circle cx="0" cy="0" r="26" fill="transparent"/>
          </g>`;
      } else {
        svg += `
          ${roomState.flowersBloom ? [440, 480, 590, 636, 780, 840, 920].map((fx, i) => `<circle cx="${fx}" cy="${114 - (i % 3) * 16}" r="7" fill="${i % 2 ? "#f472b6" : "#fde047"}" filter="url(#hsGlowSm)" class="h-pulse" pointer-events="none"/>`).join("") : ""}
          <g class="h-hotspot" data-hotspot="t7_bloom" transform="translate(540, 126)">
            <title>点击开启生命水渠触发百花盛放！</title>
            <circle cx="0" cy="0" r="22" fill="#f472b6" opacity="0.26" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">🌺</text>
          </g>
          <g class="h-hotspot" data-hotspot="t7_butterflies" transform="translate(880, 118)">
            <title>点击在黄金亭放飞闪耀金蝶群！</title>
            <circle cx="0" cy="0" r="24" fill="#fde047" opacity="0.24" class="h-pulse"/>
            <text x="0" y="5" font-size="15" text-anchor="middle">🦋</text>
          </g>`;
      }
    }

    // === T8: 1240px Interstellar Mechanisms (Wish Meteor Shower + Hologram Planet Switcher + Low-Gravity Switch!) ===
    if (tier === 8) {
      const hNames = ["🌍 蔚蓝地球", "🪐 土星冰环", "🔴 火星奇观", "🌀 视界黑洞"];
      const hCols = ["#38bdf8", "#f59e0b", "#ef4444", "#a855f7"];
      const hc = hCols[roomState.holoPlanet % 4];
      svg += `
        <!-- Clickable Wishing Meteor Telescope (Wing 2 x=540) -->
        <g class="h-hotspot" data-hotspot="t8_meteor" transform="translate(540, 130)">
          <title>点击星空许愿仪，立即召唤一场璀璨流星雨！</title>
          <rect x="-24" y="-12" width="48" height="22" rx="11" fill="rgba(15,23,42,0.78)" stroke="#fde047" stroke-width="1.3"/>
          <text x="0" y="3" font-size="8.5" font-weight="800" fill="#fef08a" text-anchor="middle">🌠 唤流星</text>
        </g>
        <!-- Holographic Planet Projector Pedestal (Wing 2 x=760) -->
        <g class="h-hotspot" data-hotspot="t8_holo" transform="translate(760, 144)">
          <title>点击切换立体全息投影星球（当前：${hNames[roomState.holoPlanet % 4]}）</title>
          <polygon points="-18,0 -12,-12 12,-12 18,0" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
          <polygon points="-10,-12 10,-12 22,-54 -22,-54" fill="${hc}" opacity="0.16"/>
          <g class="h-float">
            <circle cx="0" cy="-36" r="14" fill="${hc}" opacity="0.72" stroke="#fff" stroke-width="1" filter="url(#hsGlowSm)"/>
            ${roomState.holoPlanet % 4 === 1 ? `<ellipse cx="0" cy="-36" rx="22" ry="5" transform="rotate(-14 0 -36)" fill="none" stroke="#fef08a" stroke-width="1.6"/>` : ""}
          </g>
        </g>
        <!-- Low-Gravity Antigravity Field Console (Wing 3 x=1060) -->
        <g class="h-hotspot" data-hotspot="t8_lowgrav" transform="translate(1060, 130)">
          <title>点击开关低重力失重模式：兔兔跳得超高超轻盈！</title>
          <rect x="-32" y="-14" width="64" height="24" rx="12" fill="${bunnyFx.lowGrav ? "rgba(14,165,233,0.88)" : "rgba(15,23,42,0.78)"}" stroke="#38bdf8" stroke-width="1.4" ${bunnyFx.lowGrav ? 'filter="url(#hsGlowSm)"' : ""}/>
          <text x="0" y="2" font-size="8.5" font-weight="800" fill="#fff" text-anchor="middle">🪶 ${bunnyFx.lowGrav ? "低重力:开" : "低重力:关"}</text>
        </g>`;
    }

    // === T9: 1400px 4-Zone Dimensional Bunny-Transforming Shrines & Twin Portals! ===
    if (tier === 9) {
      svg += `
        <!-- Left Dimensional Teleport Portal (Zone 1 x=112 <-> Zone 4 x=1288!) -->
        <g class="h-hotspot" data-hotspot="t9_portal_l" transform="translate(112, 124)">
          <title>🌀 次元传送门(左)：点击瞬间穿梭 1170px 到达右殿！</title>
          <ellipse cx="0" cy="0" rx="20" ry="30" fill="#a855f7" opacity="0.26" filter="url(#hsGlowMd)" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="16" ry="25" fill="none" stroke="#c084fc" stroke-width="2.4" stroke-dasharray="10 5" class="h-flow"/>
          <ellipse cx="0" cy="0" rx="9" ry="15" fill="#38bdf8" opacity="0.45"/>
          <text x="0" y="4" font-size="12" text-anchor="middle">🌀</text>
        </g>
        <!-- Invisibility Prism Shrine (Zone 2 x=480) -->
        <g class="h-hotspot" data-hotspot="t9_invis" transform="translate(480, 134)">
          <title>👻 隐身棱镜机关：点击让兔兔进入量子隐身态！</title>
          <polygon points="0,-34 16,-14 0,6 -16,-14" fill="${bunnyFx.invisible ? "#38bdf8" : "#1e293b"}" fill-opacity="0.72" stroke="#7dd3fc" stroke-width="1.6" class="h-float"/>
          <rect x="-24" y="4" width="48" height="14" rx="7" fill="rgba(15,23,42,0.82)" stroke="#38bdf8" stroke-width="1"/>
          <text x="0" y="13.5" font-size="7.5" font-weight="800" fill="#bae6fd" text-anchor="middle">👻 ${bunnyFx.invisible ? "隐身中" : "隐身仪"}</text>
        </g>
        <!-- Holy Glow Amplifier Crystal (Zone 2 x=600) -->
        <g class="h-hotspot" data-hotspot="t9_glow" transform="translate(600, 134)">
          <title>✨ 圣光增幅器：点击让兔兔全身散发耀眼金光！</title>
          <circle cx="0" cy="-16" r="16" fill="#fde047" opacity="${bunnyFx.glow ? "0.52" : "0.18"}" filter="url(#hsGlowMd)" class="h-pulse"/>
          <polygon points="0,-32 12,-16 0,0 -12,-16" fill="#fef08a" stroke="#f59e0b" stroke-width="1.5" class="h-float-slow"/>
          <rect x="-24" y="4" width="48" height="14" rx="7" fill="rgba(15,23,42,0.82)" stroke="#f59e0b" stroke-width="1"/>
          <text x="0" y="13.5" font-size="7.5" font-weight="800" fill="#fef08a" text-anchor="middle">✨ ${bunnyFx.glow ? "发光中" : "圣光台"}</text>
        </g>
        <!-- Size Morph Ray (Giant / Mini / Normal) (Zone 3 x=840) -->
        <g class="h-hotspot" data-hotspot="t9_scale" transform="translate(840, 134)">
          <title>📏 维度缩放射线：点击切换巨无霸兔 / 迷你袖珍兔！</title>
          <rect x="-14" y="-30" width="28" height="32" rx="6" fill="#1e1b4b" stroke="#f472b6" stroke-width="1.5"/>
          <text x="0" y="-10" font-size="13" text-anchor="middle">📏</text>
          <rect x="-26" y="4" width="52" height="14" rx="7" fill="rgba(15,23,42,0.82)" stroke="#f472b6" stroke-width="1"/>
          <text x="0" y="13.5" font-size="7.5" font-weight="800" fill="#fbcfe8" text-anchor="middle">${bunnyFx.scaleMode === "giant" ? "巨无霸" : bunnyFx.scaleMode === "mini" ? "迷你兔" : "变形仪"}</text>
        </g>
        <!-- Quantum Prism Clone Mirror (Zone 3 x=960) -->
        <g class="h-hotspot" data-hotspot="t9_clone" transform="translate(960, 134)">
          <title>🌈 量子分身镜：点击召唤幻彩分身兔同频起舞！</title>
          <ellipse cx="0" cy="-16" rx="14" ry="20" fill="${bunnyFx.prismClone ? "url(#hsPrism)" : "#0f172a"}" opacity="0.72" stroke="#f0abfc" stroke-width="1.8"/>
          <rect x="-26" y="4" width="52" height="14" rx="7" fill="rgba(15,23,42,0.82)" stroke="#c084fc" stroke-width="1"/>
          <text x="0" y="13.5" font-size="7.5" font-weight="800" fill="#f5d0fe" text-anchor="middle">🌈 ${bunnyFx.prismClone ? "分身:开" : "分身镜"}</text>
        </g>
        <!-- Right Dimensional Teleport Portal (Zone 4 x=1288 <-> Zone 1 x=112!) -->
        <g class="h-hotspot" data-hotspot="t9_portal_r" transform="translate(1288, 124)">
          <title>🌀 次元传送门(右)：点击瞬间折跃回主殿！</title>
          <ellipse cx="0" cy="0" rx="20" ry="30" fill="#38bdf8" opacity="0.28" filter="url(#hsGlowMd)" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="16" ry="25" fill="none" stroke="#7dd3fc" stroke-width="2.4" stroke-dasharray="10 5" class="h-flow-rev"/>
          <ellipse cx="0" cy="0" rx="9" ry="15" fill="#c084fc" opacity="0.45"/>
          <text x="0" y="4" font-size="12" text-anchor="middle">🌀</text>
        </g>`;
    }

    // === T10: 1640px Creator's Celestial Palace In-World Interactive Landmarks! ===
    if (tier === 10) {
      svg += `
        <!-- Zone 1 Left Celestial Warp Portal (x=96 <-> x=1554!) -->
        <g class="h-hotspot" data-hotspot="t10_portal_l" transform="translate(96, 124)">
          <title>🌀 星穹传送阵：瞬间跨越 1450px 抵达造物主神坛！</title>
          <ellipse cx="0" cy="0" rx="18" ry="28" fill="#fde047" opacity="0.24" filter="url(#hsGlowMd)" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="15" ry="23" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4" stroke-dasharray="9 5" class="h-flow"/>
          <text x="0" y="4" font-size="12" text-anchor="middle">🌀</text>
        </g>
        <!-- Zone 2 Pentatonic Creation Chimes (x=500) -->
        <g class="h-hotspot" data-hotspot="t10_chimes" transform="translate(500, 124)">
          <title>🎐 点击敲响创世编钟，奏响仙乐和弦！</title>
          <circle cx="0" cy="0" r="28" fill="transparent"/>
        </g>
        <!-- Zone 3 Starlight Waterfall Wish Pool (x=1040) -->
        <g class="h-hotspot" data-hotspot="t10_fountain" transform="translate(1040, 128)">
          <title>✨ 点击在星河水苑许愿，激起漫天星辰涟漪！</title>
          <circle cx="0" cy="0" r="28" fill="#38bdf8" opacity="0.18" class="h-pulse"/>
          <text x="0" y="4" font-size="13" text-anchor="middle">✨</text>
        </g>
        <!-- Zone 4 Sovereign Creator's Dragon Summon Dais (x=1440) -->
        <g class="h-hotspot" data-hotspot="t10_dragon" transform="translate(1440, 114)">
          <title>🐉 造物主御龙台：点击召唤星河金龙巡游 1640px 天穹！</title>
          <circle cx="0" cy="0" r="28" fill="#fde047" opacity="0.22" class="h-pulse"/>
          <text x="0" y="4" font-size="14" text-anchor="middle">🐉</text>
        </g>
        <!-- Zone 4 Right Celestial Warp Portal (x=1554 <-> x=96!) -->
        <g class="h-hotspot" data-hotspot="t10_portal_r" transform="translate(1554, 124)">
          <title>🌀 星穹传送阵：瞬间折跃回星穹主殿！</title>
          <ellipse cx="0" cy="0" rx="18" ry="28" fill="#c084fc" opacity="0.26" filter="url(#hsGlowMd)" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="15" ry="23" fill="none" stroke="#fef08a" stroke-width="2.4" stroke-dasharray="9 5" class="h-flow-rev"/>
          <text x="0" y="4" font-size="12" text-anchor="middle">🌀</text>
        </g>`;
    }

    return `<g id="homeInteractiveLayer">${svg}</g>`;
  }

  // ---- Dynamic Ambient Layer (Shooting Stars, Random Planets/Ships, Dragon Flyby, Fireflies) ----
  function spawnShootingStar(worldW, golden = false) {
    const layer = document.getElementById("homeAmbientLayer");
    if (!layer) return;
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");
    const sx = 60 + Math.random() * (worldW - 120);
    const sy = 8 + Math.random() * 54;
    const len = 38 + Math.random() * 34;
    g.setAttribute("class", "h-meteor-fly");
    g.innerHTML = `
      <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx - len).toFixed(1)}" y2="${(sy - len * 0.42).toFixed(1)}" stroke="${golden ? "#fef08a" : "#e0f2fe"}" stroke-width="${golden ? "2.4" : "1.8"}" stroke-linecap="round" filter="url(#hsGlowSm)"/>
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${golden ? "2.8" : "2.1"}" fill="#ffffff"/>`;
    layer.appendChild(g);
    setTimeout(() => g.remove(), 1450);
  }

  function spawnCosmicVisitor(worldW, kind = "auto") {
    const layer = document.getElementById("homeAmbientLayer");
    if (!layer) return;
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");
    const y = 26 + Math.random() * 58;
    const pick = kind === "auto" ? ["comet", "ufo", "planet", "probe"][Math.floor(Math.random() * 4)] : kind;
    g.setAttribute("class", pick === "dragon" ? "h-dragon-fly" : "h-visitor-fly");
    if (pick === "dragon") {
      g.innerHTML = `
        <g transform="translate(0, ${y.toFixed(0)})" filter="url(#hsGlowMd)">
          <path d="M-90 8 Q-55 -16 -20 4 Q15 20 50 -2 Q80 -14 108 2" fill="none" stroke="url(#hsGoldH)" stroke-width="6.5" stroke-linecap="round"/>
          <path d="M-86 8 Q-55 -12 -20 4 Q15 16 50 -2 Q80 -10 106 2" fill="none" stroke="#fef08a" stroke-width="2.4" stroke-dasharray="10 6"/>
          <circle cx="110" cy="2" r="7" fill="#f59e0b" stroke="#fef08a" stroke-width="1.5"/>
          <circle cx="113" cy="0" r="1.8" fill="#ffffff"/>
          <path d="M104 -4 L96 -14 M108 -5 L103 -15" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>
        </g>`;
      layer.appendChild(g);
      setTimeout(() => g.remove(), 6800);
      return;
    }
    if (pick === "airship") {
      g.innerHTML = `
        <g transform="translate(0, ${y.toFixed(0)})">
          <ellipse cx="0" cy="0" rx="28" ry="12" fill="#fffbeb" stroke="#d97706" stroke-width="1.4"/>
          <line x1="-26" y1="0" x2="26" y2="0" stroke="#f59e0b" stroke-width="1.6"/>
          <rect x="-8" y="13" width="16" height="7" rx="2" fill="#78350f" stroke="#d97706" stroke-width="1"/>
          <line x1="-6" y1="10" x2="-6" y2="13" stroke="#92400e"/><line x1="6" y1="10" x2="6" y2="13" stroke="#92400e"/>
        </g>`;
    } else if (pick === "ufo") {
      g.innerHTML = `
        <g transform="translate(0, ${y.toFixed(0)})" filter="url(#hsGlowSm)">
          <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="#cbd5e1" stroke="#38bdf8" stroke-width="1.1"/>
          <path d="M-7 -2 A7 6 0 0 1 7 -2 Z" fill="#7dd3fc" opacity="0.88"/>
          <circle cx="-7" cy="1" r="1.2" fill="#fde047"/><circle cx="0" cy="2" r="1.2" fill="#f472b6"/><circle cx="7" cy="1" r="1.2" fill="#34d399"/>
        </g>`;
    } else if (pick === "planet") {
      const pCols = ["#38bdf8", "#f472b6", "#34d399", "#fbbf24"];
      const c = pCols[Math.floor(Math.random() * pCols.length)];
      g.innerHTML = `
        <g transform="translate(0, ${y.toFixed(0)})" opacity="0.88">
          <circle cx="0" cy="0" r="11" fill="${c}" stroke="#fff" stroke-width="0.9" filter="url(#hsGlowSm)"/>
          <ellipse cx="0" cy="0" rx="19" ry="4.5" transform="rotate(-18)" fill="none" stroke="#fef08a" stroke-width="1.4"/>
        </g>`;
    } else {
      g.innerHTML = `
        <g transform="translate(0, ${y.toFixed(0)})" filter="url(#hsGlowSm)">
          <line x1="-26" y1="0" x2="0" y2="0" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round" opacity="0.72"/>
          <circle cx="0" cy="0" r="3.4" fill="#ffffff"/>
        </g>`;
    }
    layer.appendChild(g);
    setTimeout(() => g.remove(), 8200);
  }

  function startAmbientLoop(getHouseFn) {
    stopAmbientLoop();
    ambientTimer = setInterval(() => {
      const modal = document.getElementById("homeModal");
      if (!modal || !modal.classList.contains("open")) return;
      const house = typeof getHouseFn === "function" ? getHouseFn() : null;
      if (!house) return;
      const t = house.tier || 1;
      const w = house.worldWidth || 420;
      if (t >= 8) {
        // Frequent cosmic shooting stars & occasional wandering planets / UFOs / probes!
        if (Math.random() < (t === 10 && roomState.creatorWeather === "aurora_meteor" ? 0.92 : 0.62)) {
          spawnShootingStar(w, t === 10);
        }
        if (Math.random() < 0.24) {
          spawnCosmicVisitor(w, "auto");
        }
      }
    }, 2400);
  }

  function stopAmbientLoop() {
    if (ambientTimer) {
      clearInterval(ambientTimer);
      ambientTimer = null;
    }
  }

  // ---- Handle Click on Any Interactive World Hotspot! ----
  const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  let chimeIdx = 0;

  function handleHotspotClick(hsId, house, api) {
    const { showBubble, spawnParticles, playSfx, playTone, redraw, teleportTo, updateBunnyDom } = api;
    const w = (house && house.worldWidth) || 420;
    const flash = (glyphs, msg, sfx = "token") => {
      spawnParticles(glyphs, 50, 44);
      if (msg) showBubble(msg);
      if (sfx) playSfx(sfx);
    };

    switch (hsId) {
      case "t1_lamp":
        roomState.streetLampOn = !roomState.streetLampOn;
        redraw();
        flash(["💡", "✨"], roomState.streetLampOn ? "💡 路灯亮起，街头温暖多了～" : "🌙 熄灭路灯看星星～");
        return true;
      case "t1_cat":
        flash(["🐱", "❤️", "✨"], "🐱 喵呜～流浪小黑猫蹭了蹭兔兔！");
        return true;
      case "t2_ladybug":
        flash(["🐞", "✨", "🍀"], "🐞 七星瓢虫爬过草叶，给兔兔带来好运！");
        return true;
      case "t2_butterfly":
        flash(["🦋", "🌸", "✨"], "🦋 小蝴蝶围着兔兔耳朵翩翩起舞！");
        return true;
      case "t2_firefly":
        flash(["✨", "🌟", "💫"], "✨ 萤火虫闪烁微光，童话感拉满啦～", "cache");
        return true;
      case "toggle_curtains":
        roomState.curtainsClosed = !roomState.curtainsClosed;
        redraw();
        flash(["🪟", "✨"], roomState.curtainsClosed ? "🪟 拉上窗帘，窝在私密小家超安心～" : "☀️ 拉开窗帘，迎接窗外好风景！");
        return true;
      case "toggle_lamp":
        roomState.lampOn = !roomState.lampOn;
        redraw();
        flash(["💡", "✨"], roomState.lampOn ? "💡 点亮暖黄台灯，氛围感瞬间升温！" : "🌙 关上台灯省电护眼～");
        return true;
      case "t4_fireplace":
        roomState.fireBoost = !roomState.fireBoost;
        redraw();
        flash(["🔥", "✨", "🪵"], roomState.fireBoost ? "🔥 添了一把红松木，壁炉火星噼啪作响！" : "🪵 调小火候，暖洋洋刚刚好～", "gold");
        return true;
      case "t4_sprinkler":
        roomState.sprinklerRainbow = !roomState.sprinklerRainbow;
        redraw();
        flash(["💧", "🌈", "🌻"], roomState.sprinklerRainbow ? "🌈 花房细雾折射出梦幻室内小彩虹！" : "💧 关闭喷雾，向日葵喝饱水啦～", "cache");
        return true;
      case "t4_windmill":
        roomState.windmillTurbo = !roomState.windmillTurbo;
        redraw();
        flash(["🌀", "🍃", "✨"], roomState.windmillTurbo ? "🌀 疾风模式！湖畔风车呼呼加速旋转！" : "🍃 回到悠闲微风转速～", "cache");
        return true;
      case "t4_owl":
        playTone(440, 0.14, "sine", 0.05);
        setTimeout(() => playTone(370, 0.2, "sine", 0.05), 140);
        flash(["🦉", "❤️", "🌳"], "🦉 咕咕～树洞小猫头鹰朝兔兔眨了眨大眼睛！", null);
        return true;
      case "t4_bamboo":
        playTone(620, 0.08, "triangle", 0.08);
        flash(["🎋", "💧", "✨"], "🎋「咚！」清脆竹筒惊鹿声回荡竹林～", null);
        return true;
      case "t5_neon":
        roomState.neonIdx = (roomState.neonIdx + 1) % 3;
        redraw();
        flash(["⚡", "💜", "💙"], "🌃 切换丽晶 LOFT 赛博霓虹氛围灯带！", "cache");
        return true;
      case "t5_vinyl":
        [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "triangle", 0.045), i * 110));
        flash(["🎵", "🎶", "💿"], "💿 复古黑胶转动，温柔爵士乐飘满房间～", null);
        return true;
      case "t5_egrets":
        flash(["🕊️", "🌿", "✨"], "🕊️ 透过望远镜看到一群白鹭掠过西溪苇荡！", "cache");
        return true;
      case "t6_chandelier":
        roomState.chandelierMode = (roomState.chandelierMode + 1) % 3;
        redraw();
        flash(["💎", "✨", "🌟"], ["💡 切换暖金水晶光！", "🌌 切换星夜微光模式！", "🥂 切换派对星钻灯效！"][roomState.chandelierMode], "gold");
        return true;
      case "t6_piano":
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.22, "sine", 0.05), i * 95));
        flash(["🎹", "🎵", "🌹", "🎶"], "🎹 白色三角钢琴流淌出优雅的肖邦夜曲～", null);
        return true;
      case "t6_champagne":
        flash(["🥂", "✨", "🎆", "🌟"], "🥂 砰！高空无边泳池开香槟，敬自由的算力！", "ssr");
        return true;
      case "t6_guqin":
        [392, 440, 523, 587, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.24, "triangle", 0.045), i * 105));
        flash(["🎵", "🏯", "🍃", "✨"], "🏯 抚琴一曲《高山流水》，太湖石泉水叮咚和鸣～", null);
        return true;
      case "t6_koi":
        flash(["🎏", "💧", "✨", "🪷"], "🎏 撒一把锦鲤鱼食，红白锦鲤跃出水面讨喜气！", "cache");
        return true;
      case "t7_lava":
        roomState.lavaErupt = !roomState.lavaErupt;
        redraw();
        flash(["🌋", "🔥", "⚡"], roomState.lavaErupt ? "🌋 火山核心过载！龙焰熔浆冲天喷发！" : "🌋 熔炉归于平稳燃烧～", "ssr");
        return true;
      case "t7_dragon":
        spawnCosmicVisitor(w, "dragon");
        flash(["🐉", "🔥", "✨"], "🐉 赤金火龙回应召唤，展翼掠过黑曜石苍穹！", "ssr");
        return true;
      case "t7_whale":
        roomState.whaleVisit = true;
        redraw();
        setTimeout(() => { roomState.whaleVisit = false; }, 7500);
        flash(["🐋", "🫧", "🌊", "✨"], "🐋 吹响法螺！深海蓝鲸优雅游过海底水晶穹顶！", "ssr");
        return true;
      case "t7_trident":
        flash(["🔱", "⚡", "💎", "🌊"], "🔱 海王三叉戟共鸣，亚特兰蒂斯海蓝神光绽放！", "ssr");
        return true;
      case "t7_rainbow":
        roomState.rainbowBridge = !roomState.rainbowBridge;
        redraw();
        flash(["🌈", "☁️", "✨"], roomState.rainbowBridge ? "🌈 七彩天桥横贯万米云海！" : "☁️ 彩虹隐入流云～", "ssr");
        return true;
      case "t7_airship":
        spawnCosmicVisitor(w, "airship");
        flash(["⛵", "☁️", "✨"], "⛵ 云端蒸汽飞艇鸣笛驶过天空之城！", "gold");
        return true;
      case "t7_aurora":
        roomState.auroraMode = (roomState.auroraMode + 1) % 3;
        redraw();
        flash(["🌌", "❄️", "✨"], ["🌌 翡翠极光降临！", "💜 紫粉梦境极光！", "🌟 黄金日冕极光！"][roomState.auroraMode], "ssr");
        return true;
      case "t7_chime":
        [880, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.25, "sine", 0.045), i * 85));
        flash(["❄️", "🔔", "✨", "💎"], "🔔 水晶冰风铃奏出清澈的极地天籁！", null);
        return true;
      case "t7_bloom":
        roomState.flowersBloom = !roomState.flowersBloom;
        redraw();
        flash(["🌺", "🌸", "🌼", "✨"], roomState.flowersBloom ? "🌺 巴比伦生命水渠涌动，悬空百花齐放！" : "🌿 花瓣轻落水渠～", "ssr");
        return true;
      case "t7_butterflies":
        flash(["🦋", "✨", "🌟", "🦋", "🌼"], "🦋 成群黄金蝴蝶从花亭腾空起舞！", "gold");
        return true;
      case "t8_meteor":
        for (let i = 0; i < 6; i++) setTimeout(() => spawnShootingStar(w, i % 2 === 0), i * 190);
        spawnCosmicVisitor(w, "comet");
        flash(["🌠", "✨", "🌟", "💫"], "🌠 许愿流星雨划破深空！快许个算力暴涨的愿吧！", "ssr");
        return true;
      case "t8_holo":
        roomState.holoPlanet = (roomState.holoPlanet + 1) % 4;
        redraw();
        flash(["🪐", "🌍", "✨"], `🔭 全息星图切换为：${["🌍 蔚蓝地球", "🪐 土星冰环", "🔴 火星奇观", "🌀 视界黑洞"][roomState.holoPlanet]}！`, "cache");
        return true;
      case "t8_lowgrav":
        bunnyFx.lowGrav = !bunnyFx.lowGrav;
        redraw();
        flash(["🪶", "🚀", "✨"], bunnyFx.lowGrav ? "🪶 低重力模式开启！点地面看兔兔失重飘浮高跳！" : "⚓ 恢复标准重力～", "gold");
        return true;
      case "t9_portal_l":
        teleportTo(1235, 178);
        flash(["🌀", "⚡", "✨"], "🌀 次元折跃成功！瞬移 1120px 抵达右翼星门厅！", "ssr");
        return true;
      case "t9_portal_r":
        teleportTo(170, 178);
        flash(["🌀", "⚡", "✨"], "🌀 次元折跃成功！瞬移返回量子主殿！", "ssr");
        return true;
      case "t9_invis":
        bunnyFx.invisible = !bunnyFx.invisible;
        redraw();
        updateBunnyDom();
        flash(["👻", "✨", "💠"], bunnyFx.invisible ? "👻 量子隐身发动！兔兔进入半透明潜行态！" : "🐰 解除隐身，兔兔现形啦！", "cache");
        return true;
      case "t9_glow":
        bunnyFx.glow = !bunnyFx.glow;
        redraw();
        updateBunnyDom();
        flash(["✨", "🌟", "👑"], bunnyFx.glow ? "✨ 圣光增幅！兔兔全身散发璀璨黄金光辉！" : "🌙 收起圣光光环～", "ssr");
        return true;
      case "t9_scale":
        bunnyFx.scaleMode = bunnyFx.scaleMode === "normal" ? "giant" : (bunnyFx.scaleMode === "giant" ? "mini" : "normal");
        redraw();
        updateBunnyDom();
        flash(["📏", "✨", "⚡"], bunnyFx.scaleMode === "giant" ? "🦖 巨化射线命中！变身 1.42× 霸气巨无霸兔！" : bunnyFx.scaleMode === "mini" ? "🔬 缩小射线命中！变身 0.68× 超萌迷你袖珍兔！" : "🐰 恢复标准可爱体型！", "gold");
        return true;
      case "t9_clone":
        bunnyFx.prismClone = !bunnyFx.prismClone;
        redraw();
        flash(["🌈", "✨", "👯"], bunnyFx.prismClone ? "🌈 量子叠加态！幻彩分身兔现身同频起舞！" : "✨ 量子分身坍缩归一！", "ssr");
        return true;
      case "t10_portal_l":
        teleportTo(1480, 178);
        flash(["🌀", "👑", "✨"], "🌀 星穹传送！瞬间跨殿降临造物主观测穹顶！", "ssr");
        return true;
      case "t10_portal_r":
        teleportTo(175, 178);
        flash(["🌀", "🏛️", "✨"], "🌀 星穹传送！瞬移返回星穹神谕主殿！", "ssr");
        return true;
      case "t10_chimes": {
        const note = CHIME_NOTES[chimeIdx % CHIME_NOTES.length];
        chimeIdx++;
        playTone(note, 0.35, "sine", 0.06);
        setTimeout(() => playTone(note * 1.5, 0.25, "triangle", 0.035), 90);
        flash(["🎐", "🎵", "✨", "🌟"], "🎐 创世黄金编钟响起清越五声宫商和弦！", null);
        return true;
      }
      case "t10_fountain":
        for (let i = 0; i < 5; i++) setTimeout(() => spawnShootingStar(w, true), i * 160);
        flash(["🌊", "✨", "🌟", "🌠"], "✨ 在星河水苑许愿，漫天黄金流星回应了你！", "ssr");
        return true;
      case "t10_dragon":
        spawnCosmicVisitor(w, "dragon");
        for (let i = 0; i < 4; i++) setTimeout(() => spawnShootingStar(w, true), i * 220);
        flash(["🐉", "👑", "✨", "🎆"], "🐉 星河金龙降临！盘旋巡游 1640px 太初天穹！", "ssr");
        return true;
      default:
        return false;
    }
  }

  // ---- T10 Creator Sovereign Control Bar (Time + Weather + All Bunny Powers!) ----
  function renderT10CreatorBar(houseId) {
    const bar = document.getElementById("t10CreatorBar");
    if (!bar) return;
    if (houseId !== "secret_palace") {
      bar.style.display = "none";
      return;
    }
    bar.style.display = "flex";
    const tBtns = [
      ["dawn", "🌅晨"], ["day", "☀️昼"], ["dusk", "🌇暮"], ["night", "🌙夜"], ["", "🔄实时"],
    ];
    const wBtns = [
      ["sunny", "☀️晴"], ["cloudy", "⛅云"], ["windy", "🍃风"], ["rain", "🌧️雨"], ["snow", "❄️雪"], ["aurora_meteor", "🌠极光流星"],
    ];
    bar.innerHTML = `
      <div class="t10-row">
        <span class="t10-tag">👑 造物主时间:</span>
        ${tBtns.map(([k, lbl]) => `<button type="button" class="t10-btn${(roomState.creatorTime || "") === k ? " on" : ""}" data-t10-time="${k}">${lbl}</button>`).join("")}
      </div>
      <div class="t10-row">
        <span class="t10-tag">🌦️ 敕令天象:</span>
        ${wBtns.map(([k, lbl]) => `<button type="button" class="t10-btn${(roomState.creatorWeather || "aurora_meteor") === k ? " on" : ""}" data-t10-weather="${k}">${lbl}</button>`).join("")}
      </div>
      <div class="t10-row">
        <span class="t10-tag">✨ 兔兔神权:</span>
        <button type="button" class="t10-btn${bunnyFx.glow ? " on" : ""}" data-t10-fx="glow">✨圣光</button>
        <button type="button" class="t10-btn${bunnyFx.invisible ? " on" : ""}" data-t10-fx="invis">👻隐身</button>
        <button type="button" class="t10-btn${bunnyFx.lowGrav ? " on" : ""}" data-t10-fx="lowgrav">🪶低重力</button>
        <button type="button" class="t10-btn${bunnyFx.scaleMode !== "normal" ? " on" : ""}" data-t10-fx="scale">📏${bunnyFx.scaleMode === "giant" ? "巨化" : bunnyFx.scaleMode === "mini" ? "迷你" : "变形"}</button>
        <button type="button" class="t10-btn${bunnyFx.prismClone ? " on" : ""}" data-t10-fx="clone">🌈分身</button>
        <button type="button" class="t10-btn" data-t10-fx="dragon">🐉唤金龙</button>
      </div>`;
  }

  // ---- Interactive World Minimap + Zone Jump Pills (For ALL houses > 420px!) ----
  function renderWorldMinimap(houseId, bunnyX, camX) {
    const el = document.getElementById("homeWorldMinimap");
    if (!el) return;
    const R = global.TooTooRegistry;
    const h = R && R.getHouse(houseId);
    const w = (h && h.worldWidth) || 420;
    if (w <= 420) {
      el.style.display = "none";
      return;
    }
    el.style.display = "flex";
    const zones = getZones(houseId);
    const vpLeft = Math.max(0, Math.min(100, (camX / w) * 100));
    const vpWidth = Math.min(100, (420 / w) * 100);
    const bPct = Math.max(2, Math.min(98, (bunnyX / w) * 100));
    el.innerHTML = `
      <div class="hwm-zones">
        ${zones.map(z => {
          const active = Math.abs(bunnyX - z.x) < (w / Math.max(2, zones.length)) * 0.55;
          return `<button type="button" class="hwm-zbtn${active ? " on" : ""}" data-zone-x="${z.x}">${z.name}</button>`;
        }).join("")}
      </div>
      <div class="hwm-track" id="hwmTrack" title="点击地图任意位置让兔兔跳过去">
        <div class="hwm-vp" id="hwmVp" style="left:${vpLeft.toFixed(1)}%;width:${vpWidth.toFixed(1)}%"></div>
        <div class="hwm-dot" id="hwmDot" style="left:${bPct.toFixed(1)}%"></div>
      </div>`;
  }

  function updateMinimapLive(houseId, bunnyX, camX) {
    const vp = document.getElementById("hwmVp");
    const dot = document.getElementById("hwmDot");
    if (!vp || !dot) return;
    const R = global.TooTooRegistry;
    const h = R && R.getHouse(houseId);
    const w = (h && h.worldWidth) || 420;
    if (w <= 420) return;
    vp.style.left = Math.max(0, Math.min(100, (camX / w) * 100)).toFixed(1) + "%";
    dot.style.left = Math.max(2, Math.min(98, (bunnyX / w) * 100)).toFixed(1) + "%";
  }

  global.TooTooWorld = {
    roomState,
    bunnyFx,
    resetForHouseChange,
    getZones,
    getDirtySignature,
    renderInteractiveLayerSvg,
    handleHotspotClick,
    spawnShootingStar,
    spawnCosmicVisitor,
    startAmbientLoop,
    stopAmbientLoop,
    renderT10CreatorBar,
    renderWorldMinimap,
    updateMinimapLive,
  };
})(typeof window !== "undefined" ? window : globalThis);
