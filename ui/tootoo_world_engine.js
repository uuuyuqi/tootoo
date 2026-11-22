// ============================================================
// TooToo Living World & Bespoke Diegetic Mechanisms Engine (T1 -> T10)
//   - Zero copy-pasted pills, zero reskins, zero idle battery waste!
//   - Every single one of the 39 houses has bespoke diegetic interactive props,
//     custom SVG spectacles & tailored synthesized WebAudio sound effects.
// ============================================================
(function (global) {
  const MAX_AMBIENT_NODES = 10;

  const roomState = {
    streetLampOn: true,
    curtainsClosed: false,
    lampOn: true,
    // T2 toggles
    t2BulbOn: true,
    t2SnailHidden: false,
    t2FairyGlow: false,
    // T3/T4 toggles
    fireBoost: false,
    sprinklerRainbow: false,
    windmillTurbo: false,
    t4LanternOn: true,
    t4MushroomsGlow: false,
    // T5/T6 toggles
    neonIdx: 0,
    t5RattanOn: true,
    chandelierMode: 0, // 0 warm, 1 starlight, 2 party
    t6FirepitBoost: false,
    // T7 toggles
    lavaErupt: false,
    magmaPulse: false,
    whaleVisit: false,
    rainbowBridge: false,
    auroraMode: 0, // 0 emerald-cyan, 1 violet-rose, 2 solar-gold, 3 prism
    iceLotusBloom: false,
    flowersBloom: false,
    // T8 bespoke toggles
    holoPlanet: 0, // 0 Earth, 1 Saturn, 2 Mars, 3 BlackHole
    marsBioUv: false,
    marsShield: false,
    dysonOverclock: false,
    // T9 bespoke toggles
    timeSpeed: 1, // 1 normal, 2 turbo, -1 reverse
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

  // ---- Zone Navigation Bar (Strictly Aligned with Varied Left / Center / Right Layouts!) ----
  function getZones(houseId) {
    const R = global.TooTooRegistry;
    const h = R && R.getHouse(houseId);
    if (!h || (h.worldWidth || 420) <= 420) return [];
    const map = {
      // T3 (560px)
      bamboo_basket:       [{ name: "左侧茶角", x: 76 }, { name: "竹筐主卧", x: 350 }],
      cardboard:           [{ name: "主纸箱", x: 210 }, { name: "漫画磁带角", x: 486 }],
      wood_crate:          [{ name: "工具工坊", x: 76 }, { name: "木箱主室", x: 350 }],
      canvas_tent:         [{ name: "油灯前厅", x: 72 }, { name: "中心大帐", x: 280 }, { name: "吉他角", x: 488 }],
      vintage_van:         [{ name: "房车客厅", x: 210 }, { name: "复古驾驶舱", x: 486 }],
      // T4 (660px)
      bamboo_pavilion:     [{ name: "雅致茶厅", x: 210 }, { name: "全景观竹轩", x: 540 }],
      treehole:            [{ name: "树冠观景室", x: 120 }, { name: "树洞主厅", x: 450 }],
      moganshan_cabin:     [{ name: "壁炉客厅", x: 210 }, { name: "竹海巨窗室", x: 540 }],
      sunflower_glasshouse:[{ name: "西育苗跨", x: 68 }, { name: "阳光花厅", x: 330 }, { name: "东花海跨", x: 590 }],
      windmill_mill:       [{ name: "湖景风车廊", x: 120 }, { name: "磨坊主厅", x: 450 }],
      // T5 (760px)
      regent_intl:         [{ name: "双层LOFT", x: 210 }, { name: "钱江露台", x: 590 }],
      heanju:              [{ name: "观景左阳台", x: 170 }, { name: "暖光客厅", x: 550 }],
      xixi_beiyuan:        [{ name: "湿地横厅", x: 210 }, { name: "雪松阳台", x: 590 }],
      // T6 (920px)
      xixi:                [{ name: "锦鲤莲栈", x: 126 }, { name: "居中主厅", x: 460 }, { name: "古琴茶亭", x: 794 }],
      wulin_yihao:         [{ name: "黑金主厅", x: 210 }, { name: "云端围炉", x: 546 }, { name: "无边泳池", x: 800 }],
      yunqi_rose:          [{ name: "凡尔赛喷泉", x: 126 }, { name: "法式沙龙", x: 460 }, { name: "钢琴花亭", x: 794 }],
      jiangnanli:          [{ name: "红木中堂", x: 210 }, { name: "月洞曲水庭", x: 550 }, { name: "飞瀑古琴轩", x: 810 }],
      // T7 (1080px, Centered Main Sanctuary 330..750)
      obsidian_fortress:   [{ name: "西·龙焰锻炉", x: 176 }, { name: "中·黑曜主殿", x: 540 }, { name: "东·御龙祭坛", x: 910 }],
      atlantis:            [{ name: "西·法螺回廊", x: 174 }, { name: "中·水晶主殿", x: 540 }, { name: "东·海王圣坛", x: 910 }],
      sky_castle:          [{ name: "西·彩虹棱台", x: 180 }, { name: "中·羽翼主殿", x: 540 }, { name: "东·飞艇港塔", x: 910 }],
      aurora_ice_palace:   [{ name: "西·极光棱台", x: 176 }, { name: "中·冰镜主殿", x: 540 }, { name: "东·风铃圣殿", x: 906 }],
      hanging_gardens:     [{ name: "西·生命水渠", x: 176 }, { name: "中·花瀑主廊", x: 540 }, { name: "东·金蝶穹亭", x: 906 }],
      // T8 (1240px, Centered Observation Hall 410..830)
      lunar_base:          [{ name: "西·地月通信", x: 205 }, { name: "中·静海主舱", x: 620 }, { name: "东·失重实验", x: 1035 }],
      rocket:              [{ name: "西·曲率舰桥", x: 205 }, { name: "中·全息星廊", x: 620 }, { name: "东·曲率引擎", x: 1035 }],
      mars_dome:           [{ name: "西·水培萝卜", x: 205 }, { name: "中·峡谷穹顶", x: 620 }, { name: "东·直升机坪", x: 1035 }],
      saturn_ring_station: [{ name: "西·碎冰牵引", x: 205 }, { name: "中·冰环画廊", x: 620 }, { name: "东·轨道失重", x: 1035 }],
      dyson_sphere:        [{ name: "西·日冕导流", x: 205 }, { name: "中·恒星中枢", x: 620 }, { name: "东·光子帆港", x: 1035 }],
      // T9 (1400px, Centered Dimensional Sanctum 490..910)
      quantum_mirror:      [{ name: "① 西星门·隐圣", x: 210 }, { name: "② 万花筒主殿", x: 700 }, { name: "③ 变形·分身廊", x: 1068 }, { name: "④ 东折跃门", x: 1296 }],
      wormhole:            [{ name: "① 西星门·隐圣", x: 210 }, { name: "② 虫洞引力厅", x: 700 }, { name: "③ 变形·分身廊", x: 1068 }, { name: "④ 东折跃门", x: 1296 }],
      time_clocktower:     [{ name: "① 西星门·隐圣", x: 210 }, { name: "② 时光齿轮殿", x: 700 }, { name: "③ 变形·分身廊", x: 1068 }, { name: "④ 东折跃门", x: 1296 }],
      galactic_core:       [{ name: "① 西星门·隐圣", x: 210 }, { name: "② 银心星云阁", x: 700 }, { name: "③ 变形·分身廊", x: 1068 }, { name: "④ 东折跃门", x: 1296 }],
      singularity_court:   [{ name: "① 西星门·隐圣", x: 210 }, { name: "② 视界奇点庭", x: 700 }, { name: "③ 变形·分身廊", x: 1068 }, { name: "④ 东折跃门", x: 1296 }],
      // T10 (1640px, Centered Celestial Atrium 610..1030)
      secret_palace:       [{ name: "① 星穹神谕殿", x: 210 }, { name: "② 日晷编钟台", x: 640 }, { name: "③ 星河水苑", x: 1060 }, { name: "④ 造物主神坛", x: 1440 }],
    };
    return map[houseId] || [];
  }

  function getDirtySignature(houseId) {
    resetForHouseChange(houseId);
    return [
      roomState.streetLampOn ? 1 : 0,
      roomState.curtainsClosed ? 1 : 0,
      roomState.lampOn ? 1 : 0,
      roomState.t2BulbOn ? 1 : 0,
      roomState.t2SnailHidden ? 1 : 0,
      roomState.t2FairyGlow ? 1 : 0,
      roomState.fireBoost ? 1 : 0,
      roomState.sprinklerRainbow ? 1 : 0,
      roomState.windmillTurbo ? 1 : 0,
      roomState.t4LanternOn ? 1 : 0,
      roomState.t4MushroomsGlow ? 1 : 0,
      roomState.neonIdx,
      roomState.t5RattanOn ? 1 : 0,
      roomState.chandelierMode,
      roomState.t6FirepitBoost ? 1 : 0,
      roomState.lavaErupt ? 1 : 0,
      roomState.magmaPulse ? 1 : 0,
      roomState.whaleVisit ? 1 : 0,
      roomState.rainbowBridge ? 1 : 0,
      roomState.auroraMode,
      roomState.iceLotusBloom ? 1 : 0,
      roomState.flowersBloom ? 1 : 0,
      roomState.holoPlanet,
      roomState.marsBioUv ? 1 : 0,
      roomState.marsShield ? 1 : 0,
      roomState.dysonOverclock ? 1 : 0,
      roomState.timeSpeed,
      roomState.creatorTime || "-",
      roomState.creatorWeather || "-",
      bunnyFx.invisible ? 1 : 0,
      bunnyFx.glow ? 1 : 0,
      bunnyFx.scaleMode,
      bunnyFx.lowGrav ? 1 : 0,
      bunnyFx.prismClone ? 1 : 0,
    ].join(":");
  }

  // Subtle diegetic star-glint cue (discoverable without ugly pill text!)
  function glint(x, y, col = "#fef08a") {
    return `<path d="M${x} ${y - 4.5} L${x + 1.2} ${y - 1.2} L${x + 4.5} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4.5} L${x - 1.2} ${y + 1.2} L${x - 4.5} ${y} L${x - 1.2} ${y - 1.2} Z" fill="${col}" class="h-sparkle-glint"/>`;
  }

  // ---- Render Diegetic Interactive Hotspots & Living Props inside the SVG World ----
  function renderInteractiveLayerSvg(house, dp) {
    if (!house) return "";
    resetForHouseChange(house.id);
    const tier = house.tier || 1;
    const id = house.id;
    const isNight = !!(dp && dp.isNight);
    let svg = "";

    // =========================================================================
    // T1: 露宿马路边 — Street Lamp + Stray Black Cat (ROOT-ANCHORED WAGGING TAIL!)
    // =========================================================================
    if (tier === 1) {
      svg += `
        <g class="h-hotspot" data-hotspot="t1_lamp" transform="translate(98, 46)">
          <title>点击开关暖黄路灯</title>
          <circle cx="0" cy="0" r="18" fill="transparent"/>
          ${roomState.streetLampOn
            ? `<circle cx="0" cy="0" r="12" fill="#fef08a" opacity="0.22" pointer-events="none"/>`
            : ""}
        </g>
        <!-- Stray Black Kitten: Tail anchored INSIDE body at (7, 1) with smooth SMIL wag! -->
        <g class="h-hotspot" data-hotspot="t1_cat" transform="translate(342, 152)">
          <title>点击撸路边小黑猫</title>
          <circle cx="0" cy="-4" r="18" fill="transparent"/>
          <path d="M7 1 Q16 -2 15 -13" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-11 7 1;13 7 1;-11 7 1" dur="2.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
          </path>
          <ellipse cx="0" cy="0" rx="10" ry="7" fill="#1e293b"/>
          <circle cx="-6" cy="-7" r="6" fill="#1e293b"/>
          <polygon points="-11,-11 -9,-17 -5,-12" fill="#1e293b"/>
          <polygon points="-4,-12 -1,-17 0,-11" fill="#1e293b"/>
          <polygon points="-9.8,-11.8 -8.8,-15 -6.6,-12.2" fill="#f472b6" opacity="0.45"/>
          <circle cx="-8" cy="-7" r="1.25" fill="#fde047"/><circle cx="-4" cy="-7" r="1.25" fill="#fde047"/>
          <circle cx="-6" cy="-5.2" r="0.7" fill="#f472b6"/>
        </g>`;
    }

    // =========================================================================
    // T2: 5 Shelters — EACH shelter has UNIQUE living critters & interactive toys!
    //   (ALL nested <g> transforms — ZERO CSS override!)
    // =========================================================================
    if (tier === 2) {
      if (id === "wall_corner") {
        svg += `
          <!-- Wall-top Orange Tabby Cat sitting squarely on flat brick parapet (y=46) with root-anchored wagging tail -->
          <g class="h-hotspot" data-hotspot="t2_wall_cat" transform="translate(155, 41)">
            <title>点击逗墙头打盹的小橘猫！</title>
            <circle cx="0" cy="-4" r="16" fill="transparent"/>
            <path d="M7 0 Q14 -4 13 -13" stroke="#ea580c" stroke-width="2.4" fill="none" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-12 7 0;12 7 0;-12 7 0" dur="2.4s" repeatCount="indefinite"/>
            </path>
            <ellipse cx="0" cy="0" rx="9.5" ry="6.5" fill="#f97316" stroke="#9a3412" stroke-width="0.7"/>
            <circle cx="-6" cy="-6" r="5.5" fill="#fb923c" stroke="#9a3412" stroke-width="0.7"/>
            <polygon points="-10.5,-10 -9,-15.5 -5,-11" fill="#f97316"/><polygon points="-4,-11 -1,-15.5 0,-10" fill="#f97316"/>
            <path d="M-8.5 -6 Q-7.5 -7 -6.5 -6 M-4.5 -6 Q-3.5 -7 -2.5 -6" stroke="#451a03" stroke-width="1" fill="none"/>
          </g>
          <!-- Red-Brick Crawling Seven-Spot Ladybug (on side brick wall x=84..132) -->
          <g class="h-hotspot" data-hotspot="t2_ladybug" transform="translate(106, 134)"><g class="h-drift">
            <title>点点爬红砖的七星瓢虫！</title>
            <circle cx="0" cy="0" r="13" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="5.5" ry="4.2" fill="#ef4444" stroke="#18181b" stroke-width="0.9"/>
            <circle cx="-5.5" cy="0" r="2.6" fill="#18181b"/>
            <circle cx="-1" cy="-1.5" r="0.9" fill="#18181b"/><circle cx="2" cy="0.6" r="0.9" fill="#18181b"/><circle cx="0" cy="1.8" r="0.8" fill="#18181b"/>
          </g></g>
          <!-- Clickable Lean-to Warm String Bulb -->
          <g class="h-hotspot" data-hotspot="t2_bulb" transform="translate(204, 112)">
            <title>点击开关雨棚暖光小灯泡</title>
            <circle cx="0" cy="0" r="14" fill="transparent"/>
            ${roomState.t2BulbOn ? `<circle cx="0" cy="4" r="24" fill="#fbbf24" opacity="${isNight ? "0.32" : "0.18"}" pointer-events="none"/><circle cx="0" cy="0" r="4.6" fill="#fef08a" stroke="#d97706" stroke-width="0.9"/>` : `<circle cx="0" cy="0" r="4.2" fill="#94a3b8" stroke="#475569" stroke-width="0.9"/>`}
          </g>`;
      } else if (id === "pot") {
        svg += `
          <!-- Fluttering Golden-Pink Butterfly -->
          <g class="h-hotspot" data-hotspot="t2_butterfly" transform="translate(336, 86)"><g class="h-float">
            <title>点点花园小蝴蝶，看它翩翩起舞！</title>
            <circle cx="0" cy="0" r="15" fill="transparent"/>
            <ellipse cx="-5" cy="-2" rx="5.8" ry="4.2" transform="rotate(-24 -5 -2)" fill="#fbbf24" stroke="#b45309" stroke-width="0.6"/>
            <ellipse cx="5" cy="-2" rx="5.8" ry="4.2" transform="rotate(24 5 -2)" fill="#fbbf24" stroke="#b45309" stroke-width="0.6"/>
            <ellipse cx="-4" cy="3" rx="3.6" ry="2.6" fill="#f472b6"/><ellipse cx="4" cy="3" rx="3.6" ry="2.6" fill="#f472b6"/>
            <line x1="0" y1="-4" x2="0" y2="5" stroke="#1e293b" stroke-width="1.2"/>
          </g></g>
          <!-- Cute Meadow Snail (clear of mushroom at x=88..105; tucks into shell on click!) -->
          <g class="h-hotspot" data-hotspot="t2_snail" transform="translate(62, 160)">
            <title>点点花盆边害羞的小蜗牛！</title>
            <circle cx="0" cy="0" r="14" fill="transparent"/>
            ${roomState.t2SnailHidden ? "" : `<ellipse cx="-3" cy="2" rx="8.5" ry="3.2" fill="#fde68a" stroke="#92400e" stroke-width="0.7"/>
              <line x1="-10" y1="0" x2="-12" y2="-5" stroke="#92400e" stroke-width="1"/><line x1="-8" y1="0" x2="-8" y2="-5" stroke="#92400e" stroke-width="1"/>
              <circle cx="-12" cy="-5.4" r="1" fill="#18181b"/><circle cx="-8" cy="-5.4" r="1" fill="#18181b"/>`}
            <circle cx="2" cy="-2" r="5.8" fill="#d97706" stroke="#78350f" stroke-width="1"/>
            <path d="M2 -2 m-3 0 a3 3 0 1 1 5.2 2" fill="none" stroke="#fef3c7" stroke-width="1.1"/>
          </g>
          <!-- Blowable White Dandelion Puff -->
          <g class="h-hotspot" data-hotspot="t2_dandelion" transform="translate(354, 156)">
            <title>点击吹散蒲公英绒毛！</title>
            <circle cx="0" cy="-14" r="15" fill="transparent"/>
            <path d="M0 4 Q-2 -8 0 -18" stroke="#15803d" stroke-width="1.8" fill="none"/>
            <circle cx="0" cy="-20" r="8.5" fill="#ffffff" fill-opacity="0.78" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2 2"/>
            <circle cx="0" cy="-20" r="3" fill="#fef3c7"/>
            ${glint(7, -26)}
          </g>`;
      } else if (id === "hay_pile") {
        svg += `
          <!-- Shimmering Field Dragonfly -->
          <g class="h-hotspot" data-hotspot="t2_dragonfly" transform="translate(96, 78)"><g class="h-float">
            <title>点点田野蓝蜻蜓！</title>
            <circle cx="0" cy="0" r="15" fill="transparent"/>
            <ellipse cx="-7" cy="-3" rx="8" ry="2.2" transform="rotate(-14 -7 -3)" fill="#bae6fd" opacity="0.82"/>
            <ellipse cx="7" cy="-3" rx="8" ry="2.2" transform="rotate(14 7 -3)" fill="#bae6fd" opacity="0.82"/>
            <ellipse cx="-6" cy="1" rx="6" ry="1.8" transform="rotate(10 -6 1)" fill="#7dd3fc" opacity="0.72"/>
            <ellipse cx="6" cy="1" rx="6" ry="1.8" transform="rotate(-10 6 1)" fill="#7dd3fc" opacity="0.72"/>
            <line x1="0" y1="-5" x2="0" y2="11" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="0" cy="-5.5" r="2.2" fill="#0369a1"/>
          </g></g>
          <!-- Cozy Meadow Hedgehog -->
          <g class="h-hotspot" data-hotspot="t2_hedgehog" transform="translate(336, 158)">
            <title>点点草垛边打滚的小刺猬！</title>
            <circle cx="0" cy="-2" r="15" fill="transparent"/>
            <path d="M-11 2 A11 9 0 0 1 11 2 Z" fill="#78350f" stroke="#451a03" stroke-width="1"/>
            <path d="M-9 -2 L-11 -6 M-4 -6 L-5 -10 M2 -6 L3 -10 M8 -3 L10 -7" stroke="#451a03" stroke-width="1.3" stroke-linecap="round"/>
            <ellipse cx="-9" cy="1" rx="4.5" ry="3.4" fill="#fed7aa"/>
            <circle cx="-12.5" cy="0.5" r="1.1" fill="#18181b"/><circle cx="-9" cy="-0.4" r="1" fill="#18181b"/>
          </g>
          <!-- Golden Field Fireflies -->
          <g class="h-hotspot" data-hotspot="t2_firefly" transform="translate(324, 92)"><g class="h-float-slow">
            <title>点点发光田间萤火虫！</title>
            <circle cx="0" cy="0" r="14" fill="transparent"/>
            <circle cx="0" cy="0" r="7" fill="#fef08a" opacity="${isNight ? "0.35" : "0.18"}"/>
            <circle cx="0" cy="0" r="2.4" fill="#fde047" class="h-twinkle"/>
            <circle cx="11" cy="-7" r="1.9" fill="#a7f3d0" class="h-twinkle-d1"/>
          </g></g>`;
      } else if (id === "moss_rocks") {
        svg += `
          <!-- Creekside Singing Green Frog -->
          <g class="h-hotspot" data-hotspot="t2_frog" transform="translate(88, 158)">
            <title>点点溪畔小青蛙，它会呱呱跳水花！</title>
            <circle cx="0" cy="-2" r="15" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="8.5" ry="5.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
            <circle cx="-4" cy="-5" r="2.8" fill="#4ade80" stroke="#14532d" stroke-width="0.9"/>
            <circle cx="4" cy="-5" r="2.8" fill="#4ade80" stroke="#14532d" stroke-width="0.9"/>
            <circle cx="-4" cy="-5" r="1.1" fill="#18181b"/><circle cx="4" cy="-5" r="1.1" fill="#18181b"/>
            <path d="M-3 -1 Q0 1.5 3 -1" stroke="#14532d" stroke-width="1" fill="none"/>
          </g>
          <!-- Glowing Moss-Stone Firefly Cluster -->
          <g class="h-hotspot" data-hotspot="t2_firefly" transform="translate(332, 88)"><g class="h-float-slow">
            <title>点点发光小萤火虫群！</title>
            <circle cx="0" cy="0" r="15" fill="transparent"/>
            <circle cx="0" cy="0" r="8" fill="#fef08a" opacity="${isNight ? "0.38" : "0.2"}"/>
            <circle cx="0" cy="0" r="2.5" fill="#fde047" class="h-twinkle"/>
            <circle cx="12" cy="-6" r="2" fill="#a7f3d0" class="h-twinkle-d1"/>
            <circle cx="-9" cy="7" r="1.8" fill="#fef08a" class="h-twinkle-d2"/>
          </g></g>
          <!-- Creek Skipping Stone (on the sparkling blue brook!) -->
          <g class="h-hotspot" data-hotspot="t2_ripple_stone" transform="translate(378, 184)">
            <title>点击在溪边打水漂！</title>
            <circle cx="0" cy="0" r="14" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="8.5" ry="3.4" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>
            ${glint(0, -6, "#7dd3fc")}
          </g>`;
      } else {
        // giant_mushroom
        svg += `
          ${roomState.t2FairyGlow ? `<g pointer-events="none" opacity="0.34"><ellipse cx="210" cy="72" rx="126" ry="36" fill="#fef08a" class="h-pulse"/></g>` : ""}
          <!-- Forest Fairy Light Orb -->
          <g class="h-hotspot" data-hotspot="t2_fairy" transform="translate(96, 74)"><g class="h-float">
            <title>点点童话小精灵光球，点亮发光蘑菇伞！</title>
            <circle cx="0" cy="0" r="15" fill="transparent"/>
            <circle cx="0" cy="0" r="10" fill="#f0abfc" opacity="0.32" class="h-pulse"/>
            <ellipse cx="-6" cy="-2" rx="5" ry="2.2" transform="rotate(-24 -6 -2)" fill="#e0f2fe" opacity="0.86"/>
            <ellipse cx="6" cy="-2" rx="5" ry="2.2" transform="rotate(24 6 -2)" fill="#e0f2fe" opacity="0.86"/>
            <circle cx="0" cy="0" r="3.4" fill="#ffffff" stroke="#c084fc" stroke-width="0.9"/>
          </g></g>
          <!-- Iridescent Blue Morpho Butterfly -->
          <g class="h-hotspot" data-hotspot="t2_morpho" transform="translate(334, 84)"><g class="h-float-slow">
            <title>点点森林蓝闪蝶！</title>
            <circle cx="0" cy="0" r="15" fill="transparent"/>
            <ellipse cx="-5.5" cy="-2" rx="6" ry="4.4" transform="rotate(-24 -5.5 -2)" fill="#38bdf8" stroke="#1d4ed8" stroke-width="0.7"/>
            <ellipse cx="5.5" cy="-2" rx="6" ry="4.4" transform="rotate(24 5.5 -2)" fill="#38bdf8" stroke="#1d4ed8" stroke-width="0.7"/>
            <ellipse cx="-4" cy="3.2" rx="3.8" ry="2.6" fill="#0284c7"/><ellipse cx="4" cy="3.2" rx="3.8" ry="2.6" fill="#0284c7"/>
            <line x1="0" y1="-4.5" x2="0" y2="5.5" stroke="#0f172a" stroke-width="1.2"/>
          </g></g>
          <!-- Bouncy Mini-Mushroom Trampoline (cleanly spaced right of baby orange mushroom at 332!) -->
          <g class="h-hotspot" data-hotspot="t2_mini_shroom" transform="translate(368, 162)">
            <title>点点Q弹小蘑菇散播金色孢子！</title>
            <circle cx="0" cy="-4" r="15" fill="transparent"/>
            <rect x="-3.5" y="-4" width="7" height="10" rx="2" fill="#fef3c7" stroke="#92400e" stroke-width="0.9"/>
            <path d="M-12 -3 A12 10 0 0 1 12 -3 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
            <circle cx="-4" cy="-7" r="1.8" fill="#ffffff"/><circle cx="4.5" cy="-6.5" r="1.5" fill="#ffffff"/>
          </g>`;
      }
    }

    // =========================================================================
    // T3 (560px) & T4 (660px): Clickable Window Curtains + 2 Bespoke Toys per House!
    // =========================================================================
    if (tier === 3 || tier === 4) {
      const w = house.indoorWindow || { x0: 274, x1: 356, y0: 42, y1: 105 };
      const cw = w.x1 - w.x0;
      const ch = w.y1 - w.y0;
      const cCol = tier === 3 ? "#fef3c7" : "#fff7ed";
      const cEdge = tier === 3 ? "#d97706" : "#b45309";
      svg += `
        <g class="h-hotspot" data-hotspot="toggle_curtains">
          <title>${roomState.curtainsClosed ? "点击拉开窗帘欣赏窗外风景" : "点击拉上温馨窗帘"}</title>
          <line x1="${w.x0 - 6}" y1="${w.y0 - 3}" x2="${w.x1 + 6}" y2="${w.y0 - 3}" stroke="${cEdge}" stroke-width="2.4" stroke-linecap="round"/>
          ${roomState.curtainsClosed
            ? `<rect x="${w.x0 - 1}" y="${w.y0 - 1}" width="${cw / 2 + 1}" height="${ch + 3}" rx="2" fill="${cCol}" stroke="${cEdge}" stroke-width="1" opacity="0.94"/>
               <rect x="${w.x0 + cw / 2}" y="${w.y0 - 1}" width="${cw / 2 + 1}" height="${ch + 3}" rx="2" fill="${cCol}" stroke="${cEdge}" stroke-width="1" opacity="0.94"/>`
            : `<path d="M${w.x0 - 2} ${w.y0 - 2} L${w.x0 + 16} ${w.y0 - 2} Q${w.x0 + 8} ${w.y0 + ch * 0.5} ${w.x0 + 13} ${w.y1 + 2} L${w.x0 - 2} ${w.y1 + 2} Z" fill="${cCol}" stroke="${cEdge}" stroke-width="0.9" opacity="0.88"/>
               <path d="M${w.x1 + 2} ${w.y0 - 2} L${w.x1 - 16} ${w.y0 - 2} Q${w.x1 - 8} ${w.y0 + ch * 0.5} ${w.x1 - 13} ${w.y1 + 2} L${w.x1 + 2} ${w.y1 + 2} Z" fill="${cCol}" stroke="${cEdge}" stroke-width="0.9" opacity="0.88"/>`}
          <rect x="${w.x0}" y="${w.y0}" width="${cw}" height="${ch}" fill="transparent"/>
        </g>`;

      // T3 Bespoke Toys (2 unique per house!)
      if (id === "bamboo_basket") {
        svg += `
          <g class="h-hotspot" data-hotspot="t3_bamboo_knot" transform="translate(72, 48)">
            <title>点击拨动好运红竹结铃铛！</title>
            <circle cx="0" cy="6" r="16" fill="transparent"/>
            <line x1="0" y1="-28" x2="0" y2="-4" stroke="#78350f" stroke-width="1.5"/>
            <circle cx="0" cy="0" r="6.5" fill="#dc2626" stroke="#fbbf24" stroke-width="1.2"/>
            <path d="M-3 7 L-4 20 M0 7 L0 22 M3 7 L4 20" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            ${glint(8, -4)}
          </g>
          <g class="h-hotspot" data-hotspot="t3_bamboo_kettle" transform="translate(74, 134)">
            <title>点击烧沸竹炭小茶壶！</title>
            <circle cx="0" cy="-6" r="18" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="12" ry="8" fill="#5c4018" stroke="#291b09" stroke-width="1.1"/>
            <path d="M-11 -2 Q-18 -6 -16 -12 M-6 -8 Q0 -16 6 -8" fill="none" stroke="#92400e" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M-2 -14 Q-4 -20 0 -24 M3 -14 Q5 -20 2 -24" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.7" class="h-steam"/>
          </g>`;
      } else if (id === "cardboard") {
        svg += `
          <g class="h-hotspot" data-hotspot="t3_radio" transform="translate(468, 126)">
            <title>点击播放纸箱里的复古磁带随身听！</title>
            <circle cx="0" cy="-4" r="18" fill="transparent"/>
            <rect x="-15" y="-10" width="30" height="16" rx="3" fill="#334155" stroke="#94a3b8" stroke-width="1.1"/>
            <circle cx="-7" cy="-2" r="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
            <circle cx="7" cy="-2" r="4" fill="#0f172a" stroke="#f472b6" stroke-width="1"/>
            <rect x="-6" y="-8" width="12" height="3.5" rx="1" fill="#fef08a"/>
            ${glint(14, -12)}
          </g>
          <g class="h-hotspot" data-hotspot="toggle_lamp" transform="translate(508, 132)">
            <title>点击开关暖光小台灯</title>
            ${roomState.lampOn ? `<circle cx="0" cy="-22" r="24" fill="#fde68a" opacity="0.26" pointer-events="none"/>` : ""}
            <rect x="-6" y="-3" width="12" height="4" rx="1.5" fill="#78350f"/>
            <line x1="0" y1="-3" x2="0" y2="-16" stroke="#92400e" stroke-width="2.2"/>
            <polygon points="-10,-15 10,-15 6,-27 -6,-27" fill="${roomState.lampOn ? "#fef08a" : "#cbd5e1"}" stroke="#92400e" stroke-width="1"/>
          </g>`;
      } else if (id === "wood_crate") {
        svg += `
          <g class="h-hotspot" data-hotspot="toggle_lamp" transform="translate(74, 34)">
            <title>点击开关爱迪生工业罩灯</title>
            ${roomState.lampOn ? `<circle cx="0" cy="14" r="28" fill="#fde68a" opacity="0.22" pointer-events="none"/>` : ""}
            <line x1="0" y1="-14" x2="0" y2="6" stroke="#334155" stroke-width="1.8"/>
            <path d="M-11 10 Q0 2 11 10 Z" fill="#334155" stroke="#94a3b8" stroke-width="0.9"/>
            <circle cx="0" cy="14" r="5" fill="${roomState.lampOn ? "#fef08a" : "#64748b"}"/>
          </g>
          <g class="h-hotspot" data-hotspot="t3_crate_gear" transform="translate(74, 114)">
            <title>点击旋动工坊黄铜八音盒齿轮！</title>
            <circle cx="0" cy="0" r="16" fill="transparent"/>
            <g class="h-spin-slow">
              <circle cx="0" cy="0" r="10" fill="none" stroke="#f59e0b" stroke-width="3.2" stroke-dasharray="4 3"/>
              <circle cx="0" cy="0" r="4" fill="#fef08a" stroke="#92400e" stroke-width="1"/>
            </g>
          </g>`;
      } else if (id === "canvas_tent") {
        svg += `
          <g class="h-hotspot" data-hotspot="toggle_lamp" transform="translate(68, 118)">
            <title>点击点亮复古黄铜露营油灯</title>
            ${roomState.lampOn ? `<circle cx="0" cy="0" r="24" fill="#fde68a" opacity="0.26" pointer-events="none"/>` : ""}
            <rect x="-7" y="-8" width="14" height="16" rx="3" fill="${roomState.lampOn ? "#fef08a" : "#94a3b8"}" stroke="#92400e" stroke-width="1.3"/>
            <rect x="-9" y="8" width="18" height="4" rx="1.5" fill="#78350f"/>
            <path d="M-6 -8 Q0 -16 6 -8" fill="none" stroke="#92400e" stroke-width="1.5"/>
          </g>
          <g class="h-hotspot" data-hotspot="t3_guitar" transform="translate(494, 120)">
            <title>点击拨响露营民谣木吉他！</title>
            <circle cx="0" cy="-6" r="22" fill="transparent"/>
            <ellipse cx="0" cy="8" rx="11" ry="13" fill="#d97706" stroke="#78350f" stroke-width="1.2"/>
            <ellipse cx="0" cy="-6" rx="8" ry="9" fill="#f59e0b" stroke="#78350f" stroke-width="1.1"/>
            <circle cx="0" cy="6" r="4" fill="#451a03"/>
            <rect x="-2" y="-30" width="4" height="22" fill="#78350f"/>
            <rect x="-4" y="-34" width="8" height="6" rx="1.5" fill="#451a03"/>
            ${glint(10, -20)}
          </g>`;
      } else if (id === "vintage_van") {
        svg += `
          <g class="h-hotspot" data-hotspot="t3_van_horn" transform="translate(490, 112)">
            <title>点击按响复古面包车方向盘喇叭并闪大灯！</title>
            <circle cx="0" cy="0" r="18" fill="transparent"/>
            <circle cx="0" cy="0" r="11" fill="none" stroke="#fefce8" stroke-width="2.6"/>
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#fefce8" stroke-width="1.6"/>
            <line x1="0" y1="0" x2="0" y2="10" stroke="#fefce8" stroke-width="1.6"/>
            <circle cx="0" cy="0" r="3.4" fill="#f97316"/>
            ${glint(10, -10)}
          </g>
          <g class="h-hotspot" data-hotspot="t3_van_radio" transform="translate(532, 112)">
            <title>点击打开复古房车公路电台！</title>
            <rect x="-13" y="-8" width="26" height="14" rx="2.5" fill="#1e293b" stroke="#fbbf24" stroke-width="1.1"/>
            <line x1="-9" y1="-2" x2="9" y2="-2" stroke="#38bdf8" stroke-width="1.4"/>
            <circle cx="-7" cy="3" r="1.6" fill="#fef08a"/><circle cx="7" cy="3" r="1.6" fill="#f472b6"/>
          </g>`;
      }

      // T4 Bespoke Nature Toys (2 unique per villa!)
      if (id === "bamboo_pavilion") {
        svg += `
          <g class="h-hotspot" data-hotspot="t4_lantern" transform="translate(162, 38)">
            <title>点击开关中式纸雕宫灯</title>
            ${roomState.t4LanternOn ? `<circle cx="0" cy="12" r="24" fill="#fde68a" opacity="0.22" pointer-events="none"/>` : ""}
            <line x1="0" y1="-18" x2="0" y2="2" stroke="#5c4018" stroke-width="1.4"/>
            <rect x="-9" y="2" width="18" height="20" rx="4" fill="${roomState.t4LanternOn ? "#fef3c7" : "#cbd5e1"}" stroke="#5c4018" stroke-width="1.2"/>
            <line x1="0" y1="22" x2="0" y2="30" stroke="#dc2626" stroke-width="1.6"/>
          </g>
          <g class="h-hotspot" data-hotspot="t4_bamboo" transform="translate(592, 134)">
            <title>点击敲响溪畔竹筒惊鹿「咚」一声！</title>
            <rect x="-20" y="-14" width="40" height="26" fill="transparent"/>
            <line x1="-15" y1="0" x2="15" y2="-9" stroke="#16a34a" stroke-width="5.5" stroke-linecap="round"/>
            <line x1="0" y1="-4" x2="0" y2="11" stroke="#14532d" stroke-width="2.6"/>
            ${glint(12, -12, "#7dd3fc")}
          </g>`;
      } else if (id === "treehole") {
        svg += `
          <g class="h-hotspot" data-hotspot="t4_owl" transform="translate(186, 112)">
            <title>点点窗台上的树洞小猫头鹰！</title>
            <circle cx="0" cy="0" r="16" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="9" ry="10.5" fill="#92400e" stroke="#451a03" stroke-width="1"/>
            <circle cx="-3.4" cy="-3" r="3" fill="#fef08a"/><circle cx="3.4" cy="-3" r="3" fill="#fef08a"/>
            <circle cx="-3.4" cy="-3" r="1.2" fill="#18181b"/><circle cx="3.4" cy="-3" r="1.2" fill="#18181b"/>
            <polygon points="0,-1 -2.2,2.2 2.2,2.2" fill="#f59e0b"/>
          </g>
          <g class="h-hotspot" data-hotspot="t4_mushrooms" transform="translate(516, 126)">
            <title>点击点亮树洞荧光夜光蘑菇！</title>
            ${roomState.t4MushroomsGlow ? `<circle cx="0" cy="-6" r="28" fill="#34d399" opacity="0.26" class="h-pulse" pointer-events="none"/>` : ""}
            <rect x="-3" y="0" width="6" height="12" rx="2" fill="#fef3c7"/>
            <path d="M-13 2 A13 10 0 0 1 13 2 Z" fill="${roomState.t4MushroomsGlow ? "#34d399" : "#f59e0b"}" stroke="#451a03" stroke-width="1"/>
            <rect x="11" y="4" width="4" height="8" rx="1.5" fill="#fef3c7"/>
            <path d="M6 6 A7 6 0 0 1 20 6 Z" fill="${roomState.t4MushroomsGlow ? "#38bdf8" : "#ea580c"}" stroke="#451a03" stroke-width="0.9"/>
          </g>`;
      } else if (id === "moganshan_cabin") {
        svg += `
          <g class="h-hotspot" data-hotspot="t4_fireplace" transform="translate(170, 134)">
            <title>点击给莫干山壁炉添柴旺火！</title>
            <circle cx="0" cy="0" r="${roomState.fireBoost ? 34 : 20}" fill="#f97316" opacity="${roomState.fireBoost ? "0.38" : "0.18"}"/>
            ${roomState.fireBoost ? `<path d="M-14 12 Q-8 -16 0 -22 Q8 -6 14 -14 Q18 6 10 12 Z" fill="#fde047" class="h-pulse"/>` : ""}
          </g>
          <g class="h-hotspot" data-hotspot="t4_spyglass" transform="translate(476, 134)">
            <title>点击黄铜观山望远镜，看仙鹤飞过莫干山竹海！</title>
            <circle cx="0" cy="0" r="18" fill="transparent"/>
            <line x1="0" y1="0" x2="-8" y2="14" stroke="#451a03" stroke-width="2.2"/>
            <line x1="0" y1="0" x2="8" y2="14" stroke="#451a03" stroke-width="2.2"/>
            <rect x="-15" y="-8" width="30" height="7" rx="3" transform="rotate(-14)" fill="#f59e0b" stroke="#78350f" stroke-width="1.1"/>
            ${glint(12, -12)}
          </g>`;
      } else if (id === "sunflower_glasshouse") {
        svg += `
          <g class="h-hotspot" data-hotspot="t4_sprinkler" transform="translate(586, 32)">
            <title>点击开启花房喷雾折射七彩室内彩虹！</title>
            <circle cx="0" cy="0" r="16" fill="transparent"/>
            <rect x="-12" y="-6" width="24" height="10" rx="4" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
            <circle cx="0" cy="-1" r="2.5" fill="#e0f2fe"/>
            ${roomState.sprinklerRainbow ? `<path d="M-290 108 A160 88 0 0 1 20 108" fill="none" stroke="url(#hsPrism)" stroke-width="8" opacity="0.62" pointer-events="none"/>` : ""}
          </g>
          <g class="h-hotspot" data-hotspot="t4_sunflower_bee" transform="translate(68, 86)"><g class="h-float">
            <title>点点采蜜小胖蜂，摇落金色向日葵花雨！</title>
            <circle cx="0" cy="0" r="16" fill="transparent"/>
            <ellipse cx="0" cy="-5" rx="4.5" ry="2.6" fill="#e0f2fe" opacity="0.86"/>
            <ellipse cx="0" cy="0" rx="6.5" ry="4.5" fill="#facc15" stroke="#451a03" stroke-width="1"/>
            <line x1="-2" y1="-4" x2="-2" y2="4" stroke="#18181b" stroke-width="1.6"/>
            <line x1="2" y1="-4" x2="2" y2="4" stroke="#18181b" stroke-width="1.6"/>
          </g></g>`;
      } else if (id === "windmill_mill") {
        svg += `
          <g class="h-hotspot" data-hotspot="t4_windmill" transform="translate(142, 72)">
            <title>点击切换湖畔磨坊风车疾风加速模式！</title>
            <circle cx="0" cy="0" r="26" fill="transparent"/>
            <g class="${roomState.windmillTurbo ? "h-spin-fast" : "h-spin-slow"}">
              <line x1="-24" y1="0" x2="24" y2="0" stroke="#fef3c7" stroke-width="2.4"/>
              <line x1="0" y1="-24" x2="0" y2="24" stroke="#fef3c7" stroke-width="2.4"/>
              <rect x="4" y="-3" width="18" height="5" fill="#fde68a" opacity="0.82" stroke="#92400e" stroke-width="0.6"/>
              <rect x="-22" y="-2" width="18" height="5" fill="#fde68a" opacity="0.82" stroke="#92400e" stroke-width="0.6"/>
              <rect x="-3" y="-22" width="5" height="18" fill="#fde68a" opacity="0.82" stroke="#92400e" stroke-width="0.6"/>
              <rect x="-2" y="4" width="5" height="18" fill="#fde68a" opacity="0.82" stroke="#92400e" stroke-width="0.6"/>
            </g>
            <circle cx="0" cy="0" r="3.4" fill="#451a03"/>
          </g>
          <g class="h-hotspot" data-hotspot="t4_mill_clock" transform="translate(580, 68)">
            <title>点击敲响欧式布谷鸟磨坊壁钟！</title>
            <circle cx="0" cy="0" r="18" fill="transparent"/>
            <path d="M-12 10 V-6 L0 -18 L12 -6 V10 Z" fill="#92400e" stroke="#451a03" stroke-width="1.3"/>
            <circle cx="0" cy="0" r="6.5" fill="#fffbeb" stroke="#d97706" stroke-width="1"/>
            <line x1="0" y1="0" x2="0" y2="-4" stroke="#18181b" stroke-width="1.2"/>
            <line x1="0" y1="0" x2="3.5" y2="1" stroke="#dc2626" stroke-width="1.1"/>
            <line x1="0" y1="10" x2="0" y2="22" stroke="#d97706" stroke-width="1.4"/><circle cx="0" cy="23" r="2.6" fill="#f59e0b"/>
          </g>`;
      }
    }

    // =========================================================================
    // T5 (760px): Electric Sheer Curtains + 2 Bespoke Hangzhou Residence Toys!
    // =========================================================================
    if (tier === 5) {
      const w = house.indoorWindow || { x0: 186, x1: 384, y0: 20, y1: 148 };
      if (roomState.curtainsClosed) {
        svg += `<rect x="${w.x0}" y="${w.y0}" width="${w.x1 - w.x0}" height="${w.y1 - w.y0}" fill="#fffdf8" opacity="0.58" pointer-events="none"/>`;
      }
      svg += `
        <g class="h-hotspot" data-hotspot="toggle_curtains" transform="translate(${w.x0 + 14}, ${w.y0 + 18})">
          <title>点击电动开合落地纱帘</title>
          <rect x="-7" y="-12" width="14" height="24" rx="4" fill="rgba(15,23,42,0.72)" stroke="#e2e8f0" stroke-width="0.9"/>
          <path d="M-3 -3 L0 -7 L3 -3 M-3 3 L0 7 L3 3" stroke="#fef08a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        </g>`;
      if (id === "regent_intl") {
        const neonCols = ["#f472b6", "#38bdf8", "#a855f7"];
        const nc = neonCols[roomState.neonIdx % 3];
        svg += `
          <!-- Live synchronized LOFT & Sky-Terrace Neon LED Ambient Glow -->
          <g pointer-events="none">
            <rect x="0" y="59" width="186" height="89" fill="${nc}" opacity="${isNight ? "0.1" : "0.05"}"/>
            <line x1="0" y1="59" x2="178" y2="59" stroke="${nc}" stroke-width="2.4" opacity="0.92"/>
            <line x1="416" y1="116" x2="760" y2="116" stroke="${nc}" stroke-width="2" opacity="${isNight ? "0.9" : "0.45"}"/>
          </g>
          <g class="h-hotspot" data-hotspot="t5_neon" transform="translate(82, 76)">
            <title>点击切换丽晶 LOFT 三色赛博霓虹灯带！</title>
            <rect x="-34" y="-12" width="68" height="22" rx="6" fill="rgba(15,23,42,0.82)" stroke="${nc}" stroke-width="1.8"/>
            <text x="0" y="3" font-size="8.2" font-family="monospace" font-weight="900" fill="${nc}" text-anchor="middle">LOFT ⚡</text>
          </g>
          <g class="h-hotspot" data-hotspot="t5_skybar" transform="translate(646, 134)">
            <title>点击露台霓虹吧台，点亮钱江世纪城大莲花灯光秀！</title>
            <circle cx="0" cy="0" r="22" fill="transparent"/>
            ${glint(0, -10, nc)}
          </g>`;
      } else if (id === "heanju") {
        svg += `
          <g class="h-hotspot" data-hotspot="t5_vinyl" transform="translate(612, 138)">
            <title>点击播放客厅复古黑胶唱片！</title>
            <circle cx="0" cy="-6" r="20" fill="transparent"/>
            <rect x="-18" y="-12" width="36" height="14" rx="2.5" fill="#78350f" stroke="#d97706" stroke-width="1"/>
            <ellipse cx="0" cy="-12" rx="12" ry="3.2" fill="#18181b"/><circle cx="0" cy="-12" r="2.2" fill="#ef4444"/>
            ${glint(14, -18)}
          </g>
          <g class="h-hotspot" data-hotspot="t5_balcony_chime" transform="translate(152, 42)">
            <title>点击摇响阳台玻璃风铃！</title>
            <circle cx="0" cy="8" r="16" fill="transparent"/>
            <line x1="0" y1="-16" x2="0" y2="0" stroke="#94a3b8" stroke-width="1.2"/>
            <path d="M-8 6 A8 8 0 0 1 8 6 Z" fill="#bae6fd" fill-opacity="0.78" stroke="#38bdf8" stroke-width="1.2"/>
            <rect x="-2.5" y="10" width="5" height="12" rx="1" fill="#f472b6" class="h-drift"/>
          </g>`;
      } else {
        svg += `
          <g class="h-hotspot" data-hotspot="t5_egrets" transform="translate(694, 134)">
            <title>点击湿地望远镜，召唤成群白鹭掠过西溪！</title>
            <circle cx="0" cy="0" r="20" fill="transparent"/>
            <line x1="0" y1="0" x2="-8" y2="16" stroke="#475569" stroke-width="2"/>
            <line x1="0" y1="0" x2="8" y2="16" stroke="#475569" stroke-width="2"/>
            <rect x="-14" y="-8" width="28" height="7" rx="3" transform="rotate(-14)" fill="#f8fafc" stroke="#334155" stroke-width="1.1"/>
            ${glint(12, -12, "#7dd3fc")}
          </g>
          <g class="h-hotspot" data-hotspot="t5_rattan_lamp" transform="translate(588, 36)">
            <title>点击开关湿地藤编吊灯</title>
            ${roomState.t5RattanOn ? `<circle cx="0" cy="6" r="22" fill="#fde68a" opacity="0.24" pointer-events="none"/>` : ""}
            <line x1="0" y1="-22" x2="0" y2="-4" stroke="#78350f" stroke-width="1.4"/>
            <path d="M-10 4 Q0 -10 10 4 Z" fill="#d9a55b" stroke="#78350f" stroke-width="1.1"/>
            <circle cx="0" cy="6" r="3.6" fill="${roomState.t5RattanOn ? "#fef08a" : "#94a3b8"}"/>
          </g>`;
      }
    }

    // =========================================================================
    // T6 (920px): Luxury Chandelier + 2 Bespoke Mansion Wing Spectacles!
    // =========================================================================
    if (tier === 6) {
      const chCols = ["#fde047", "#38bdf8", "#f472b6"];
      const chC = chCols[roomState.chandelierMode % 3];
      const chX = (house.mainOriginX || 0) + 210;
      svg += `
        <g class="h-hotspot" data-hotspot="t6_chandelier" transform="translate(${chX}, 28)">
          <title>点击切换顶豪水晶吊灯色温（暖金/星蓝/派对粉）</title>
          <circle cx="0" cy="0" r="24" fill="${chC}" opacity="0.2"/>
          <polygon points="-15,-4 15,-4 9,8 -9,8" fill="${chC}" stroke="#fff" stroke-width="0.9"/>
        </g>`;
      if (id === "xixi") {
        svg += `
          <g class="h-hotspot" data-hotspot="t6_koi" transform="translate(136, 144)">
            <title>点击西溪莲池投喂跃水锦鲤！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -10, "#f9a8d4")}
          </g>
          <g class="h-hotspot" data-hotspot="t6_guqin" transform="translate(782, 142)">
            <title>点击水上茶亭抚琴一曲《高山流水》！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -14)}
          </g>`;
      } else if (id === "wulin_yihao") {
        svg += `
          <g class="h-hotspot" data-hotspot="t6_firepit" transform="translate(546, 148)">
            <title>点击旺燃云端围炉篝火！</title>
            <circle cx="0" cy="0" r="26" fill="${roomState.t6FirepitBoost ? "#f97316" : "transparent"}" opacity="0.28"/>
            ${roomState.t6FirepitBoost ? `<path d="M-12 6 Q-4 -20 0 -26 Q6 -12 12 6 Z" fill="#fef08a" class="h-pulse" pointer-events="none"/>` : ""}
            ${glint(0, -16, "#fb923c")}
          </g>
          <g class="h-hotspot" data-hotspot="t6_champagne" transform="translate(884, 132)">
            <title>点击高空无边泳池开香槟，燃放大运河璀璨烟花！</title>
            <circle cx="0" cy="0" r="26" fill="transparent"/>${glint(0, -20)}
          </g>`;
      } else if (id === "yunqi_rose") {
        svg += `
          <g class="h-hotspot" data-hotspot="t6_fountain" transform="translate(126, 126)">
            <title>点击启动凡尔赛三层玫瑰喷泉水幕！</title>
            <circle cx="0" cy="0" r="32" fill="transparent"/>${glint(0, -24, "#bae6fd")}
          </g>
          <g class="h-hotspot" data-hotspot="t6_piano" transform="translate(796, 142)">
            <title>点击弹奏白色三角钢琴，洒落浪漫玫瑰花瓣！</title>
            <circle cx="0" cy="0" r="30" fill="transparent"/>${glint(0, -22, "#f472b6")}
          </g>`;
      } else {
        svg += `
          <g class="h-hotspot" data-hotspot="t6_koi" transform="translate(556, 148)">
            <title>点击在月洞门曲水桥边投喂锦鲤！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -14, "#fde047")}
          </g>
          <g class="h-hotspot" data-hotspot="t6_guqin" transform="translate(800, 140)">
            <title>点击在太湖石飞瀑亭抚一曲古琴！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -14)}
          </g>`;
      }
    }

    // =========================================================================
    // T7 (1080px, Centered Main Sanctuary 330..750): 3 Unique Diegetic Wonders per Palace!
    // =========================================================================
    if (tier === 7) {
      if (id === "obsidian_fortress") {
        svg += `
          ${roomState.lavaErupt ? `<g pointer-events="none"><path d="M158 62 Q178 4 198 62" fill="#f97316" class="h-pulse"/><circle cx="178" cy="24" r="20" fill="#fef08a" opacity="0.72"/></g>` : ""}
          ${roomState.magmaPulse ? `<path d="M24 148 H1056" stroke="#fde047" stroke-width="5" opacity="0.45" class="h-pulse" pointer-events="none"/>` : ""}
          <g class="h-hotspot" data-hotspot="t7_lava" transform="translate(176, 126)">
            <title>点击敲击龙焰符文锻炉，引爆火山熔岩喷发！</title>
            <circle cx="0" cy="-14" r="26" fill="transparent"/>
            <circle cx="0" cy="-22" r="10" fill="#fde047" opacity="0.78" class="h-pulse"/>${glint(0, -34, "#fb923c")}
          </g>
          <g class="h-hotspot" data-hotspot="t7_magma_orb" transform="translate(540, 56)">
            <title>点击主殿黑曜石熔岩核心，点亮全殿千尺熔金符脉！</title>
            <circle cx="0" cy="0" r="22" fill="#f97316" opacity="0.22" class="h-pulse"/>
            <polygon points="0,-16 12,0 0,16 -12,0" fill="#ea580c" stroke="#fef08a" stroke-width="1.5"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_dragon" transform="translate(910, 108)">
            <title>点击赤金御龙祭坛，召唤赤焰火龙展翼掠过黑曜苍穹！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -24, "#fde047")}
          </g>`;
      } else if (id === "atlantis") {
        svg += `
          ${roomState.whaleVisit ? `
            <g class="h-swim-across" pointer-events="none" opacity="0.86">
              <path d="M-80 68 Q-30 34 40 52 Q78 62 110 46 Q96 68 112 82 Q70 72 28 78 Q-36 86 -80 68 Z" fill="#0ea5e9" stroke="#bae6fd" stroke-width="1.4"/>
              <circle cx="-48" cy="64" r="2.6" fill="#fff"/>
            </g>` : ""}
          <g class="h-hotspot" data-hotspot="t7_whale" transform="translate(174, 130)">
            <title>点击珍珠法螺圣座，召唤深海蓝鲸游过海底水晶穹顶！</title>
            <circle cx="0" cy="0" r="24" fill="transparent"/>
            <path d="M-12 6 C-12 -10 10 -12 14 0 C10 10 -6 12 -12 6 Z" fill="#fffbeb" stroke="#38bdf8" stroke-width="1.5"/>
            <path d="M-6 2 Q2 -6 8 0" fill="none" stroke="#f472b6" stroke-width="1.2"/>${glint(10, -10, "#7dd3fc")}
          </g>
          <g class="h-hotspot" data-hotspot="t7_jelly_dance" transform="translate(540, 56)">
            <title>点击发光深海水母群，奏响海底荧光泡泡舞！</title>
            <circle cx="0" cy="0" r="22" fill="#f472b6" opacity="0.16" class="h-pulse"/>
            <path d="M-13 0 A13 10 0 0 1 13 0 Q0 4 -13 0 Z" fill="#f472b6" stroke="#fbcfe8" stroke-width="1"/>
            <path d="M-6 2 Q-8 10 -4 18 M0 3 Q2 12 -1 20 M6 2 Q9 10 5 18" stroke="#bae6fd" stroke-width="1.1" fill="none"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_trident" transform="translate(910, 96)">
            <title>点击海王三叉戟，释放万丈海蓝神光与深海潮汐！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(0, -34, "#fef08a")}
          </g>`;
      } else if (id === "sky_castle") {
        svg += `
          ${roomState.rainbowBridge ? `<path d="M220 148 Q540 34 860 148" fill="none" stroke="url(#hsPrism)" stroke-width="14" opacity="0.72" pointer-events="none"/>` : ""}
          <g class="h-hotspot" data-hotspot="t7_rainbow" transform="translate(180, 122)">
            <title>点击七彩云海棱镜台，升起横贯云海的彩虹天桥！</title>
            <circle cx="0" cy="0" r="24" fill="transparent"/>
            <polygon points="0,-20 15,8 -15,8" fill="url(#hsPrism)" opacity="0.86" stroke="#fff" stroke-width="1.4"/>${glint(0, -24)}
          </g>
          <g class="h-hotspot" data-hotspot="t7_sky_bells" transform="translate(540, 48)">
            <title>点击云殿风之竖琴，奏响天籁并放飞白羽流光！</title>
            <circle cx="0" cy="0" r="22" fill="transparent"/>
            <path d="M-14 10 C-14 -12 14 -12 14 10 Z" fill="none" stroke="url(#hsGoldH)" stroke-width="2"/>
            <line x1="-6" y1="-4" x2="-6" y2="10" stroke="#fef08a" stroke-width="1"/><line x1="0" y1="-6" x2="0" y2="10" stroke="#fef08a" stroke-width="1"/><line x1="6" y1="-4" x2="6" y2="10" stroke="#fef08a" stroke-width="1"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_airship" transform="translate(910, 62)">
            <title>点击浮空飞艇港灯塔，召唤云端蒸汽飞艇巡航天空之城！</title>
            <circle cx="0" cy="0" r="26" fill="transparent"/>${glint(0, -14, "#7dd3fc")}
          </g>`;
      } else if (id === "aurora_ice_palace") {
        const aCols = [["#22d3ee", "#34d399"], ["#c084fc", "#f472b6"], ["#fde047", "#fb923c"], ["#38bdf8", "#f472b6"]][roomState.auroraMode % 4];
        svg += `
          <g class="h-aurora" pointer-events="none" opacity="0.56">
            <path d="M0 36 Q260 6 540 42 Q820 74 1080 26" fill="none" stroke="${aCols[0]}" stroke-width="16"/>
            <path d="M60 62 Q360 22 680 58 Q920 82 1060 40" fill="none" stroke="${aCols[1]}" stroke-width="10"/>
          </g>
          ${roomState.iceLotusBloom ? [420, 540, 660].map(lx => `<g pointer-events="none" transform="translate(${lx}, 152)"><ellipse cx="0" cy="0" rx="22" ry="5" fill="#bae6fd" opacity="0.55"/><polygon points="0,-14 8,-2 0,4 -8,-2" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1"/></g>`).join("") : ""}
          <g class="h-hotspot" data-hotspot="t7_aurora" transform="translate(176, 122)">
            <title>点击折光冰棱尖碑，自由切换四色极光天幕！</title>
            <circle cx="0" cy="0" r="24" fill="transparent"/>
            <polygon points="0,-24 12,4 0,14 -12,4" fill="${aCols[0]}" fill-opacity="0.7" stroke="#ffffff" stroke-width="1.4"/>${glint(0, -28, aCols[0])}
          </g>
          <g class="h-hotspot" data-hotspot="t7_ice_lotus" transform="translate(540, 144)">
            <title>点击北极镜冰地面，绽放璀璨冰晶霜莲！</title>
            <circle cx="0" cy="0" r="24" fill="transparent"/>
            <ellipse cx="0" cy="0" rx="18" ry="5" fill="none" stroke="#bae6fd" stroke-width="1.4" stroke-dasharray="4 3"/>${glint(0, -6, "#bae6fd")}
          </g>
          <g class="h-hotspot" data-hotspot="t7_chime" transform="translate(906, 78)">
            <title>点击永冬水晶冰风铃，奏出清澈极地天籁！</title>
            <circle cx="0" cy="0" r="28" fill="transparent"/>${glint(14, -22, "#e0f2fe")}
          </g>`;
      } else {
        svg += `
          ${roomState.flowersBloom ? [120, 224, 440, 540, 640, 820, 960].map((fx, i) => `<circle cx="${fx}" cy="${114 - (i % 3) * 18}" r="7.5" fill="${i % 2 ? "#f472b6" : "#fde047"}" class="h-pulse" pointer-events="none"/>`).join("") : ""}
          <g class="h-hotspot" data-hotspot="t7_bloom" transform="translate(176, 126)">
            <title>点击巴比伦生命水渠轮闸，触发三层悬园百花齐放！</title>
            <circle cx="0" cy="0" r="24" fill="transparent"/>
            <circle cx="0" cy="0" r="13" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4"/>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#fde047" stroke-width="1.6"/><line x1="0" y1="-12" x2="0" y2="12" stroke="#fde047" stroke-width="1.6"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_petals" transform="translate(540, 44)">
            <title>点击黄金藤铃，洒下满殿馥郁花瓣雨！</title>
            <circle cx="0" cy="0" r="22" fill="transparent"/>
            <path d="M-9 8 Q0 -12 9 8 Z" fill="url(#hsGoldH)" stroke="#fffbeb" stroke-width="1"/>
            <circle cx="0" cy="10" r="3" fill="#f472b6"/>
          </g>
          <g class="h-hotspot" data-hotspot="t7_butterflies" transform="translate(906, 126)">
            <title>点击黄金蜜莲台，放飞成群闪耀金蝶翩翩起舞！</title>
            <circle cx="0" cy="0" r="26" fill="transparent"/>
            <ellipse cx="0" cy="4" rx="16" ry="5" fill="#fef08a" stroke="#d97706" stroke-width="1.2"/>${glint(0, -10)}
          </g>`;
      }
    }

    // =========================================================================
    // T8 (1240px, Centered Hall 410..830): 15 COMPLETELY BESPOKE DIEGETIC SCI-FI GADGETS!
    //   ZERO copy-pasted "唤流星" pills! Every T8 station has 3 unique physical sci-fi toys!
    // =========================================================================
    if (tier === 8) {
      if (id === "lunar_base") {
        svg += `
          <!-- West Module (x=196): Parabolic Moon-to-Earth Deep-Space Laser Dish -->
          <g class="h-hotspot" data-hotspot="t8_lunar_earth" transform="translate(196, 134)">
            <title>点击地月深空激光天线，向蔚蓝地球发送算力光束信号！</title>
            <circle cx="0" cy="-14" r="26" fill="transparent"/>
            <rect x="-12" y="0" width="24" height="12" rx="2" fill="#334155" stroke="#38bdf8" stroke-width="1.1"/>
            <path d="M-16 -14 Q0 -4 14 -24" fill="none" stroke="#f8fafc" stroke-width="3.2" stroke-linecap="round"/>
            <line x1="-1" y1="-12" x2="10" y2="-28" stroke="#38bdf8" stroke-width="1.6"/>
            <circle cx="10" cy="-28" r="3" fill="#22d3ee" class="h-pulse"/>${glint(14, -32, "#7dd3fc")}
          </g>
          <!-- Center Hall (x=684): Interactive Apollo Lunar Rover -->
          <g class="h-hotspot" data-hotspot="t8_lunar_rover" transform="translate(684, 124)">
            <title>点击阿波罗月球车，派它驰骋静海陨石坑巡逻！</title>
            <circle cx="0" cy="-6" r="24" fill="transparent"/>
            <rect x="-15" y="-9" width="30" height="8" rx="2" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
            <line x1="-8" y1="-9" x2="-8" y2="-20" stroke="#cbd5e1" stroke-width="1.5"/>
            <circle cx="-8" cy="-21" r="2.6" fill="#38bdf8" class="h-pulse"/>
            <circle cx="-10" cy="1" r="3.4" fill="#0f172a"/><circle cx="0" cy="1" r="3.4" fill="#0f172a"/><circle cx="10" cy="1" r="3.4" fill="#0f172a"/>
            ${glint(10, -18)}
          </g>
          <!-- East Module (x=1038): Sleek Diegetic 1/6G Hexagonal Antigravity Floor Pad -->
          <g class="h-hotspot" data-hotspot="t8_lowgrav" transform="translate(1038, 146)">
            <title>点击 1/6G 月球失重舱阀（当前：${bunnyFx.lowGrav ? "失重漂浮中" : "标准重力"}）</title>
            <ellipse cx="0" cy="0" rx="34" ry="8" fill="${bunnyFx.lowGrav ? "#0ea5e9" : "#1e293b"}" fill-opacity="${bunnyFx.lowGrav ? "0.42" : "0.78"}" stroke="#38bdf8" stroke-width="1.6"/>
            <ellipse cx="0" cy="0" rx="20" ry="4.5" fill="none" stroke="${bunnyFx.lowGrav ? "#fef08a" : "#7dd3fc"}" stroke-width="1.2" class="${bunnyFx.lowGrav ? "h-ripple" : ""}"/>
            ${bunnyFx.lowGrav ? `<path d="M-10 -8 L0 -20 L10 -8 M-6 -2 L0 -12 L6 -2" fill="none" stroke="#7dd3fc" stroke-width="1.6" stroke-linecap="round" class="h-float"/>` : `<path d="M-8 -6 L0 -14 L8 -6" fill="none" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round"/>`}
          </g>`;
      } else if (id === "rocket") {
        const hNames = ["🌍 蔚蓝地球", "🪐 土星冰环", "🔴 火星奇观", "🌀 视界黑洞"];
        const hCols = ["#38bdf8", "#f59e0b", "#ef4444", "#a855f7"];
        const hc = hCols[roomState.holoPlanet % 4];
        svg += `
          <!-- West Bridge (x=196): Glowing Warp 9.9 Throttle Lever -->
          <g class="h-hotspot" data-hotspot="t8_warp" transform="translate(196, 136)">
            <title>点击推进曲率引擎跃迁拉杆，触发超光速星轨跃迁！</title>
            <circle cx="0" cy="-14" r="24" fill="transparent"/>
            <polygon points="-16,8 -12,-6 12,-6 16,8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.3"/>
            <line x1="0" y1="-6" x2="8" y2="-26" stroke="#cbd5e1" stroke-width="2.6" stroke-linecap="round"/>
            <rect x="2" y="-30" width="14" height="7" rx="3" fill="#22d3ee" stroke="#ffffff" stroke-width="1"/>
            ${glint(14, -34, "#22d3ee")}
          </g>
          <!-- Center Bridge (x=620): 3D Holographic Galaxy Pedestal -->
          <g class="h-hotspot" data-hotspot="t8_holo" transform="translate(620, 144)">
            <title>点击切换立体全息星图投影（当前：${hNames[roomState.holoPlanet % 4]}）</title>
            <polygon points="-20,0 -13,-12 13,-12 20,0" fill="#1e293b" stroke="#38bdf8" stroke-width="1.3"/>
            <polygon points="-11,-12 11,-12 24,-56 -24,-56" fill="${hc}" opacity="0.16"/>
            <g class="h-float">
              <circle cx="0" cy="-36" r="14" fill="${hc}" opacity="0.78" stroke="#fff" stroke-width="1"/>
              ${roomState.holoPlanet % 4 === 1 ? `<ellipse cx="0" cy="-36" rx="22" ry="5" transform="rotate(-14 0 -36)" fill="none" stroke="#fef08a" stroke-width="1.6"/>` : ""}
            </g>
          </g>
          <!-- East Engine Bay (x=1042): Alien First-Contact Radar Dome -->
          <g class="h-hotspot" data-hotspot="t8_ufo" transform="translate(1042, 134)">
            <title>点击深空外星接触信标，邀友善飞碟与彗星编队护航！</title>
            <circle cx="0" cy="-12" r="26" fill="transparent"/>
            <rect x="-14" y="0" width="28" height="12" rx="3" fill="#1e293b" stroke="#c084fc" stroke-width="1.2"/>
            <path d="M-12 0 A12 12 0 0 1 12 0 Z" fill="#a855f7" fill-opacity="0.45" stroke="#e879f9" stroke-width="1.4"/>
            <circle cx="0" cy="-16" r="4" fill="#34d399" class="h-pulse"/>${glint(10, -22, "#34d399")}
          </g>`;
      } else if (id === "mars_dome") {
        svg += `
          ${roomState.marsShield ? `<path d="M410 148 C446 12 794 12 830 148" fill="none" stroke="#fde047" stroke-width="5" stroke-dasharray="14 6" opacity="0.76" class="h-flow" pointer-events="none"/>` : ""}
          <!-- West Module (x=204): Martian Hydroponic Glass Carrot Bio-Pod -->
          <g class="h-hotspot" data-hotspot="t8_mars_bio" transform="translate(204, 144)">
            <title>点击火星水培生态舱，切换紫光灯培育发光火星萝卜！</title>
            <rect x="-24" y="-44" width="48" height="44" rx="18" fill="${roomState.marsBioUv ? "#a855f7" : "#38bdf8"}" fill-opacity="${roomState.marsBioUv ? "0.28" : "0.14"}" stroke="#f8fafc" stroke-width="1.5"/>
            <rect x="-22" y="-8" width="44" height="8" rx="2" fill="#7c2d12"/>
            ${[-10, 0, 10].map(cx => `
              <path d="M${cx - 3} -8 L${cx + 3} -8 L${cx} ${roomState.marsBioUv ? "-24" : "-16"} Z" fill="#f97316"/>
              <path d="M${cx} ${roomState.marsBioUv ? "-24" : "-16"} L${cx - 4} ${roomState.marsBioUv ? "-32" : "-22"} M${cx} ${roomState.marsBioUv ? "-24" : "-16"} L${cx + 4} ${roomState.marsBioUv ? "-32" : "-22"}" stroke="${roomState.marsBioUv ? "#4ade80" : "#16a34a"}" stroke-width="1.8" stroke-linecap="round"/>
            `).join("")}
            <line x1="-14" y1="-38" x2="14" y2="-38" stroke="${roomState.marsBioUv ? "#e879f9" : "#94a3b8"}" stroke-width="2.4" stroke-linecap="round"/>
          </g>
          <!-- Center Dome (x=648): Zhurong Mars Rover & Electromagnetic Dust-Shield Emitter -->
          <g class="h-hotspot" data-hotspot="t8_mars_rover" transform="translate(648, 134)">
            <title>点击火星漫游车，发射激光探岩并启动金色防沙尘能量护盾！</title>
            <circle cx="0" cy="-6" r="24" fill="transparent"/>
            <rect x="-15" y="-9" width="30" height="7.5" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="1"/>
            <polygon points="-24,-6 -15,-9 -15,-3" fill="#2563eb"/><polygon points="24,-6 15,-9 15,-3" fill="#2563eb"/>
            <line x1="-7" y1="-9" x2="-7" y2="-19" stroke="#cbd5e1" stroke-width="1.6"/>
            <circle cx="-7" cy="-20" r="2.6" fill="#22c55e" class="h-pulse"/>
            <circle cx="-10" cy="0" r="3.2" fill="#18181b"/><circle cx="0" cy="0" r="3.2" fill="#18181b"/><circle cx="10" cy="0" r="3.2" fill="#18181b"/>
            ${glint(12, -20, "#fb923c")}
          </g>
          <!-- East Module (x=1042): Mars "Ingenuity" Coaxial Helicopter on Helipad -->
          <g class="h-hotspot" data-hotspot="t8_mars_drone" transform="translate(1042, 134)">
            <title>点击「机智号」火星直升机，起飞巡航水手峡谷！</title>
            <circle cx="0" cy="-8" r="26" fill="transparent"/>
            <line x1="-18" y1="-16" x2="18" y2="-16" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="-14" y1="-12" x2="14" y2="-12" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="0" y1="-16" x2="0" y2="-6" stroke="#94a3b8" stroke-width="1.8"/>
            <rect x="-6" y="-6" width="12" height="9" rx="2" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
            <path d="M-5 3 L-11 10 M5 3 L11 10" stroke="#64748b" stroke-width="1.4"/>${glint(14, -22, "#fde047")}
          </g>`;
      } else if (id === "saturn_ring_station") {
        svg += `
          <!-- West Module (x=202): Cassini Ice-Crystal Tractor Beam Emitter -->
          <g class="h-hotspot" data-hotspot="t8_saturn_ice" transform="translate(202, 136)">
            <title>点击碎冰牵引光束塔，捕捉卡西尼环璀璨冰晶划过视窗！</title>
            <circle cx="0" cy="-14" r="26" fill="transparent"/>
            <polygon points="-14,10 -8,-12 8,-12 14,10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.3"/>
            <circle cx="0" cy="-18" r="8" fill="#7dd3fc" fill-opacity="0.48" stroke="#e0f2fe" stroke-width="1.4"/>
            <circle cx="0" cy="-18" r="3" fill="#ffffff" class="h-pulse"/>${glint(12, -26, "#7dd3fc")}
          </g>
          <!-- Center Gallery (x=620): Crystalline Saturn-Ring Gravity Harp on Obsidian Pedestal -->
          <g class="h-hotspot" data-hotspot="t8_saturn_harp" transform="translate(620, 134)">
            <title>点击拨动冰环引力水晶竖琴，奏响星环共振天籁！</title>
            <circle cx="0" cy="-14" r="28" fill="transparent"/>
            <polygon points="-20,14 -14,6 14,6 20,14" fill="#0f172a" stroke="#38bdf8" stroke-width="1.3"/>
            <path d="M-16 8 C-20 -18 4 -34 18 -18 L14 8 Z" fill="rgba(15,23,42,0.55)" stroke="url(#hsGoldH)" stroke-width="2.4"/>
            <line x1="-8" y1="-12" x2="-8" y2="8" stroke="#7dd3fc" stroke-width="1.2"/>
            <line x1="0" y1="-22" x2="0" y2="8" stroke="#fef08a" stroke-width="1.2"/>
            <line x1="8" y1="-16" x2="8" y2="8" stroke="#7dd3fc" stroke-width="1.2"/>${glint(14, -26)}
          </g>
          <!-- East Module (x=1040): Platinum Orbital Zero-G Arch Gate -->
          <g class="h-hotspot" data-hotspot="t8_lowgrav" transform="translate(1040, 146)">
            <title>点击轨道失重滑翔门（当前：${bunnyFx.lowGrav ? "失重滑翔中" : "人工重力"}）</title>
            <path d="M-24 2 V-30 A24 22 0 0 1 24 -30 V2" fill="none" stroke="${bunnyFx.lowGrav ? "#22d3ee" : "#94a3b8"}" stroke-width="3"/>
            <ellipse cx="0" cy="0" rx="24" ry="6" fill="${bunnyFx.lowGrav ? "#38bdf8" : "#1e293b"}" fill-opacity="0.45" stroke="#38bdf8" stroke-width="1.2"/>
            ${bunnyFx.lowGrav ? `<path d="M-8 -16 L0 -26 L8 -16" fill="none" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round" class="h-float"/>` : ""}
          </g>`;
      } else {
        // dyson_sphere
        svg += `
          ${roomState.dysonOverclock ? `<g pointer-events="none"><ellipse cx="620" cy="76" rx="240" ry="52" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="20 8" class="h-flow"/><circle cx="620" cy="76" r="56" fill="#fde047" opacity="0.24" class="h-pulse"/></g>` : ""}
          <!-- West Module (x=204): Solar Corona Plasma Conduit Spire -->
          <g class="h-hotspot" data-hotspot="t8_dyson_flare" transform="translate(204, 134)">
            <title>点击恒星日冕导流塔，引爆金色太阳耀斑电弧！</title>
            <circle cx="0" cy="-14" r="26" fill="transparent"/>
            <polygon points="-14,12 -6,-24 6,-24 14,12" fill="#451a03" stroke="url(#hsGoldH)" stroke-width="1.5"/>
            <circle cx="0" cy="-30" r="8" fill="#f97316" stroke="#fef08a" stroke-width="1.6" class="h-pulse"/>${glint(12, -38)}
          </g>
          <!-- Center Hall (x=620): Floating 24K Dyson Compute Honeycomb Core -->
          <g class="h-hotspot" data-hotspot="t8_dyson_compute" transform="translate(620, 132)">
            <title>点击戴森算力超频矩阵（当前：${roomState.dysonOverclock ? "超频过载中" : "稳态供能"}）</title>
            <circle cx="0" cy="-10" r="26" fill="transparent"/>
            <g class="h-float">
              <polygon points="0,-24 14,-16 14,0 0,8 -14,0 -14,-16" fill="${roomState.dysonOverclock ? "#f59e0b" : "#18120e"}" stroke="#fef08a" stroke-width="1.8"/>
              <circle cx="0" cy="-8" r="5" fill="#ffffff" class="h-pulse"/>
            </g>
          </g>
          <!-- East Module (x=1044): Golden Solar-Sail Cruiser Launch Cradle -->
          <g class="h-hotspot" data-hotspot="t8_dyson_sail" transform="translate(1044, 134)">
            <title>点击光子帆发射锚，放飞黄金光子帆星舰乘星光巡航！</title>
            <circle cx="0" cy="-14" r="28" fill="transparent"/>
            <polygon points="-18,12 18,12 10,2 -10,2" fill="#451a03" stroke="url(#hsGoldH)" stroke-width="1.3"/>
            <polygon points="0,-28 20,-10 0,2 -20,-10" fill="url(#hsGoldH)" opacity="0.86" stroke="#fffbeb" stroke-width="1.1"/>
            <line x1="0" y1="-28" x2="0" y2="2" stroke="#ffffff" stroke-width="1.2"/>${glint(16, -24)}
          </g>`;
      }
    }

    // =========================================================================
    // T9 (1400px, Centered Sanctum 490..910):
    //   Sleek DIEGETIC Arcane Artifacts (NO clunky text pills!)
    //   + 5 UNIQUE Signature 6th Cosmic Miracles (1 bespoke per T9 sanctuary)!
    // =========================================================================
    if (tier === 9) {
      const t9Cfg = {
        quantum_mirror:    { hs: "t9_kaleido",  title: "点击万花筒折射核心，绽放全殿七彩光束矩阵！", col: "#38bdf8", base: "#0f172a", trim: "#38bdf8", p1: "#38bdf8", p2: "#f472b6", xs: [96, 256, 378, 1022, 1144, 1304] },
        wormhole:          { hs: "t9_gravwave", title: "点击虫洞奇点核心，释放全殿时空引力波脉冲！", col: "#c084fc", base: "#1c1033", trim: "#c084fc", p1: "#a855f7", p2: "#38bdf8", xs: [112, 286, 404, 996, 1114, 1288] },
        time_clocktower:   { hs: "t9_timerev",  title: "点击黄金时空钟摆，切换全殿时光流速与倒流！", col: "#f59e0b", base: "#3b1c0a", trim: "#f59e0b", p1: "#f59e0b", p2: "#fde047", xs: [104, 266, 384, 1016, 1134, 1296] },
        galactic_core:     { hs: "t9_nova",     title: "点击银心翡翠超新星，绽放亿万星团光潮！",     col: "#34d399", base: "#064e3b", trim: "#6ee7b7", p1: "#34d399", p2: "#fef08a", xs: [108, 274, 392, 1008, 1126, 1292] },
        singularity_court: { hs: "t9_horizon",  title: "点击卡冈图雅视界奇点，激发引力透镜与王庭失重！", col: "#fde047", base: "#18120e", trim: "#fde047", p1: "#f59e0b", p2: "#c084fc", xs: [98, 254, 376, 1024, 1146, 1302] },
      }[id] || { hs: "t9_kaleido", title: "点击激发次元奇观！", col: "#38bdf8", base: "#0f172a", trim: "#38bdf8", p1: "#a855f7", p2: "#38bdf8", xs: [104, 276, 388, 1012, 1124, 1296] };
      const [xPL, xInv, xGlw, xScl, xCln, xPR] = t9Cfg.xs;

      svg += `
        <!-- Far-Left Bespoke-Themed Dimensional Warp Portal -->
        <g class="h-hotspot" data-hotspot="t9_portal_l" transform="translate(${xPL}, 122)">
          <title>🌀 次元传送门(西)：瞬间折跃 1190px 抵达东翼星门！</title>
          <ellipse cx="0" cy="0" rx="22" ry="32" fill="${t9Cfg.p1}" opacity="0.22" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="17" ry="26" fill="none" stroke="${t9Cfg.p1}" stroke-width="2.4" stroke-dasharray="10 5" class="h-flow"/>
          <ellipse cx="0" cy="0" rx="9" ry="15" fill="${t9Cfg.p2}" opacity="0.5"/>
        </g>
        <!-- West-Inner Theme-Styled Invisibility Prism Obelisk -->
        <g class="h-hotspot" data-hotspot="t9_invis" transform="translate(${xInv}, 134)">
          <title>👻 量子隐身棱镜（当前：${bunnyFx.invisible ? "隐身潜行中" : "点击隐身"}）</title>
          <polygon points="-15,12 -10,2 10,2 15,12" fill="${t9Cfg.base}" stroke="${t9Cfg.trim}" stroke-width="1.3"/>
          <g class="h-float">
            <polygon points="0,-32 13,-14 0,4 -13,-14" fill="${bunnyFx.invisible ? "#38bdf8" : t9Cfg.base}" fill-opacity="${bunnyFx.invisible ? "0.84" : "0.66"}" stroke="${t9Cfg.trim}" stroke-width="1.6"/>
            <circle cx="0" cy="-14" r="3.6" fill="#e0f2fe" opacity="${bunnyFx.invisible ? "1" : "0.55"}"/>
          </g>
        </g>
        <!-- West-Inner Theme-Styled Holy Glow Sun-Crystal Altar -->
        <g class="h-hotspot" data-hotspot="t9_glow" transform="translate(${xGlw}, 134)">
          <title>✨ 圣光增幅神晶（当前：${bunnyFx.glow ? "圣光耀世中" : "点击发光"}）</title>
          <polygon points="-15,12 -10,2 10,2 15,12" fill="${t9Cfg.base}" stroke="${t9Cfg.trim}" stroke-width="1.3"/>
          <circle cx="0" cy="-16" r="19" fill="#fde047" opacity="${bunnyFx.glow ? "0.46" : "0.16"}" class="h-pulse"/>
          <g class="h-float-slow">
            <polygon points="0,-33 10,-16 0,0 -10,-16" fill="#fef08a" stroke="${t9Cfg.trim}" stroke-width="1.5"/>
          </g>
        </g>
        <!-- CENTER (x=700): BESPOKE 6th SIGNATURE COSMIC MIRACLE FOR THIS SPECIFIC T9 SANCTUARY! -->
        ${id === "time_clocktower" && roomState.timeSpeed !== 1 ? `
          <g pointer-events="none" transform="translate(700, 74)">
            <g class="${roomState.timeSpeed === -1 ? "h-spin-rev-fast" : "h-spin-fast"}">
              <circle cx="0" cy="0" r="56" fill="none" stroke="${roomState.timeSpeed === -1 ? "#38bdf8" : "#fde047"}" stroke-width="2.4" stroke-dasharray="14 8" opacity="0.86"/>
              <circle cx="0" cy="0" r="44" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 10" opacity="0.68"/>
            </g>
            ${roomState.timeSpeed === -1 ? `<g fill="#fde047" opacity="0.85"><circle cx="-20" cy="24" r="2" class="h-steam"/><circle cx="18" cy="28" r="2.2" class="h-steam-d1"/><circle cx="0" cy="34" r="1.8" class="h-steam"/></g>` : ""}
          </g>` : ""}
        <g class="h-hotspot" data-hotspot="${t9Cfg.hs}" transform="translate(700, 76)">
          <title>${t9Cfg.title}</title>
          <circle cx="0" cy="0" r="34" fill="transparent"/>
          <circle cx="0" cy="0" r="24" fill="${t9Cfg.col}" opacity="0.16" class="h-pulse"/>
          ${glint(26, -24, t9Cfg.col)}${glint(-26, 22, "#ffffff")}
        </g>
        <!-- East-Inner Theme-Styled Size-Morph Runic Monolith -->
        <g class="h-hotspot" data-hotspot="t9_scale" transform="translate(${xScl}, 134)">
          <title>📏 维度缩放射线碑（当前：${bunnyFx.scaleMode === "giant" ? "巨无霸兔" : bunnyFx.scaleMode === "mini" ? "迷你兔" : "标准体型"}）</title>
          <polygon points="-15,12 -10,2 10,2 15,12" fill="${t9Cfg.base}" stroke="${t9Cfg.trim}" stroke-width="1.3"/>
          <rect x="-10" y="-28" width="20" height="30" rx="6" fill="${t9Cfg.base}" stroke="${t9Cfg.trim}" stroke-width="1.6"/>
          <path d="M0 -23 L5 -17 H-5 Z M0 -3 L5 -9 H-5 Z" fill="${bunnyFx.scaleMode !== "normal" ? "#fde047" : t9Cfg.trim}"/>
        </g>
        <!-- East-Inner Theme-Styled Quantum Prism Clone Mirror -->
        <g class="h-hotspot" data-hotspot="t9_clone" transform="translate(${xCln}, 134)">
          <title>🌈 量子幻彩分身镜（当前：${bunnyFx.prismClone ? "分身同舞中" : "点击召唤分身"}）</title>
          <polygon points="-15,12 -10,2 10,2 15,12" fill="${t9Cfg.base}" stroke="${t9Cfg.trim}" stroke-width="1.3"/>
          <ellipse cx="0" cy="-16" rx="13" ry="19" fill="${bunnyFx.prismClone ? "url(#hsPrism)" : t9Cfg.base}" opacity="0.82" stroke="${t9Cfg.trim}" stroke-width="1.8"/>
          <ellipse cx="0" cy="-16" rx="7" ry="12" fill="none" stroke="#ffffff" stroke-width="0.9" opacity="0.58"/>
        </g>
        <!-- Far-Right Bespoke-Themed Dimensional Warp Portal -->
        <g class="h-hotspot" data-hotspot="t9_portal_r" transform="translate(${xPR}, 122)">
          <title>🌀 次元传送门(东)：瞬间折跃返回西翼！</title>
          <ellipse cx="0" cy="0" rx="22" ry="32" fill="${t9Cfg.p2}" opacity="0.22" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="17" ry="26" fill="none" stroke="${t9Cfg.p2}" stroke-width="2.4" stroke-dasharray="10 5" class="h-flow-rev"/>
          <ellipse cx="0" cy="0" rx="9" ry="15" fill="${t9Cfg.p1}" opacity="0.5"/>
        </g>`;
    }

    // =========================================================================
    // T10 (1640px, Centered Atrium 610..1030): Sovereign Creator Landmarks!
    // =========================================================================
    if (tier === 10) {
      svg += `
        <g class="h-hotspot" data-hotspot="t10_portal_l" transform="translate(96, 124)">
          <title>🌀 星穹传送阵(西)：瞬间跨越 1450px 抵达造物主神坛！</title>
          <ellipse cx="0" cy="0" rx="18" ry="28" fill="#fde047" opacity="0.24" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="15" ry="23" fill="none" stroke="url(#hsGoldH)" stroke-width="2.4" stroke-dasharray="9 5" class="h-flow"/>
        </g>
        <g class="h-hotspot" data-hotspot="t10_chimes" transform="translate(510, 122)">
          <title>🎐 点击敲响太初黄金创世编钟，奏响仙乐宫商和弦！</title>
          <circle cx="0" cy="0" r="30" fill="transparent"/>${glint(0, -24)}
        </g>
        <g class="h-hotspot" data-hotspot="t10_fountain" transform="translate(1060, 126)">
          <title>✨ 点击在星河水苑许愿，激起漫天黄金星雨！</title>
          <circle cx="0" cy="0" r="32" fill="transparent"/>${glint(0, -14, "#7dd3fc")}
        </g>
        <g class="h-hotspot" data-hotspot="t10_dragon" transform="translate(1440, 110)">
          <title>🐉 点击造物主御龙神坛，召唤星河金龙巡游 1640px 太初天穹！</title>
          <circle cx="0" cy="0" r="32" fill="transparent"/>${glint(0, -24)}
        </g>
        <g class="h-hotspot" data-hotspot="t10_portal_r" transform="translate(1544, 124)">
          <title>🌀 星穹传送阵(东)：瞬间折跃返回星穹神谕殿！</title>
          <ellipse cx="0" cy="0" rx="18" ry="28" fill="#c084fc" opacity="0.26" class="h-pulse"/>
          <ellipse cx="0" cy="0" rx="15" ry="23" fill="none" stroke="#fef08a" stroke-width="2.4" stroke-dasharray="9 5" class="h-flow-rev"/>
        </g>`;
    }

    return `<g id="homeInteractiveLayer">${svg}</g>`;
  }

  // ---- Lightweight DOM-Capped SVG Spectacle Spawner (0% Idle Waste!) ----
  function appendAmbientNode(innerHtml, cls, ttlMs) {
    const layer = document.getElementById("homeAmbientLayer");
    if (!layer) return;
    while (layer.childNodes.length >= MAX_AMBIENT_NODES) {
      layer.removeChild(layer.firstChild);
    }
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");
    if (cls) g.setAttribute("class", cls);
    g.innerHTML = innerHtml;
    layer.appendChild(g);
    setTimeout(() => { if (g.parentNode) g.remove(); }, ttlMs);
  }

  function spawnShootingStar(worldW, golden = false) {
    const sx = 60 + Math.random() * (worldW - 120);
    const sy = 8 + Math.random() * 54;
    const len = 38 + Math.random() * 34;
    appendAmbientNode(
      `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx - len).toFixed(1)}" y2="${(sy - len * 0.42).toFixed(1)}" stroke="${golden ? "#fef08a" : "#e0f2fe"}" stroke-width="${golden ? "2.4" : "1.8"}" stroke-linecap="round"/>
       <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${golden ? "2.8" : "2.1"}" fill="#ffffff"/>`,
      "h-meteor-fly", 1450
    );
  }

  function spawnCosmicVisitor(worldW, kind = "auto") {
    const y = 26 + Math.random() * 56;
    const pick = kind === "auto" ? ["comet", "ufo", "planet", "probe"][Math.floor(Math.random() * 4)] : kind;
    if (pick === "dragon") {
      appendAmbientNode(
        `<g transform="translate(0, ${y.toFixed(0)})">
           <path d="M-90 8 Q-55 -16 -20 4 Q15 20 50 -2 Q80 -14 108 2" fill="none" stroke="url(#hsGoldH)" stroke-width="6.5" stroke-linecap="round"/>
           <path d="M-86 8 Q-55 -12 -20 4 Q15 16 50 -2 Q80 -10 106 2" fill="none" stroke="#fef08a" stroke-width="2.4" stroke-dasharray="10 6"/>
           <circle cx="110" cy="2" r="7" fill="#f59e0b" stroke="#fef08a" stroke-width="1.5"/>
           <circle cx="113" cy="0" r="1.8" fill="#ffffff"/>
           <path d="M104 -4 L96 -14 M108 -5 L103 -15" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>
         </g>`,
        "h-dragon-fly", 6800
      );
      return;
    }
    let body = "";
    if (pick === "airship") {
      body = `<ellipse cx="0" cy="0" rx="28" ry="12" fill="#fffbeb" stroke="#d97706" stroke-width="1.4"/><line x1="-26" y1="0" x2="26" y2="0" stroke="#f59e0b" stroke-width="1.6"/><rect x="-8" y="13" width="16" height="7" rx="2" fill="#78350f" stroke="#d97706" stroke-width="1"/>`;
    } else if (pick === "ufo") {
      body = `<ellipse cx="0" cy="0" rx="15" ry="4.8" fill="#cbd5e1" stroke="#38bdf8" stroke-width="1.1"/><path d="M-7 -2 A7 6 0 0 1 7 -2 Z" fill="#7dd3fc" opacity="0.9"/><circle cx="-7" cy="1" r="1.3" fill="#fde047"/><circle cx="0" cy="2" r="1.3" fill="#f472b6"/><circle cx="7" cy="1" r="1.3" fill="#34d399"/>`;
    } else if (pick === "planet") {
      const c = ["#38bdf8", "#f472b6", "#34d399", "#fbbf24"][Math.floor(Math.random() * 4)];
      body = `<circle cx="0" cy="0" r="11" fill="${c}" stroke="#fff" stroke-width="0.9"/><ellipse cx="0" cy="0" rx="19" ry="4.5" transform="rotate(-18)" fill="none" stroke="#fef08a" stroke-width="1.4"/>`;
    } else {
      body = `<line x1="-26" y1="0" x2="0" y2="0" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round" opacity="0.76"/><circle cx="0" cy="0" r="3.4" fill="#ffffff"/>`;
    }
    appendAmbientNode(`<g transform="translate(0, ${y.toFixed(0)})">${body}</g>`, "h-visitor-fly", 8200);
  }

  // Bespoke Indie-Game SVG VFX Spectacles!
  function spawnWarpJump(worldW) {
    let lines = "";
    const cols = ["#38bdf8", "#ffffff", "#fef08a", "#c084fc"];
    for (let i = 0; i < 18; i++) {
      const x = 180 + (i * 68) % (worldW - 120);
      const y = 20 + ((i * 29) % 116);
      const len = 46 + (i % 4) * 28;
      lines += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${cols[i % 4]}" stroke-width="${i % 3 === 0 ? 2.4 : 1.5}" stroke-linecap="round" opacity="0.88"/>`;
    }
    appendAmbientNode(lines, "h-warp-streak", 1250);
  }

  function spawnLaserBeam(x1, y1, x2, y2, col = "#38bdf8", width = 4) {
    appendAmbientNode(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${width * 2.2}" opacity="0.28" stroke-linecap="round"/>
       <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="${width * 0.65}" stroke-linecap="round"/>
       <circle cx="${x2}" cy="${y2}" r="${width * 4}" fill="${col}" opacity="0.35"/>`,
      "h-beam-shoot", 2250
    );
  }

  function spawnMarsDrone(sx, sy) {
    appendAmbientNode(
      `<g transform="translate(${sx}, ${sy})">
         <line x1="-18" y1="-10" x2="18" y2="-10" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round"/>
         <line x1="0" y1="-10" x2="0" y2="0" stroke="#e2e8f0" stroke-width="1.6"/>
         <rect x="-5" y="0" width="10" height="7" rx="2" fill="#f59e0b" stroke="#fff" stroke-width="0.9"/>
       </g>`,
      "h-drone-fly", 4900
    );
  }

  function spawnLunarRoverCruise(sx, sy) {
    appendAmbientNode(
      `<g transform="translate(${sx}, ${sy})">
         <rect x="-14" y="-8" width="28" height="7" rx="2" fill="#ffffff" stroke="#38bdf8" stroke-width="1.1"/>
         <circle cx="-8" cy="2" r="3" fill="#0f172a"/><circle cx="8" cy="2" r="3" fill="#0f172a"/>
         <circle cx="-18" cy="0" r="2.2" fill="#e2e8f0" opacity="0.7"/>
       </g>`,
      "h-rover-drive", 5300
    );
  }

  function spawnSolarSailShip(sx, sy) {
    appendAmbientNode(
      `<g transform="translate(${sx}, ${sy})">
         <polygon points="0,-24 22,-4 0,16 -22,-4" fill="url(#hsGoldH)" opacity="0.9" stroke="#ffffff" stroke-width="1.2"/>
         <line x1="22" y1="-4" x2="64" y2="-4" stroke="#fef08a" stroke-width="2.4" opacity="0.7" stroke-linecap="round"/>
       </g>`,
      "h-sail-glide", 5900
    );
  }

  function spawnEgretFlock(sx, sy) {
    const birds = [[0, 0], [-22, -10], [-42, 4], [-60, -8]].map(([dx, dy]) =>
      `<path d="M${sx + dx - 8} ${sy + dy} Q${sx + dx - 3} ${sy + dy - 6} ${sx + dx} ${sy + dy} Q${sx + dx + 3} ${sy + dy - 6} ${sx + dx + 8} ${sy + dy}" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>`
    ).join("");
    appendAmbientNode(birds, "h-egret-fly", 4500);
  }

  function spawnButterflySwarm(sx, sy) {
    const cols = ["#fde047", "#f472b6", "#38bdf8", "#fbbf24"];
    const swarm = [[0, 0], [-18, -14], [14, -8], [-32, 6], [26, -16]].map(([dx, dy], i) =>
      `<g transform="translate(${sx + dx}, ${sy + dy})">
         <ellipse cx="-4" cy="0" rx="4.5" ry="3" transform="rotate(-20 -4 0)" fill="${cols[i % 4]}"/>
         <ellipse cx="4" cy="0" rx="4.5" ry="3" transform="rotate(20 4 0)" fill="${cols[i % 4]}"/>
       </g>`
    ).join("");
    appendAmbientNode(swarm, "h-butter-dance", 3900);
  }

  function spawnFireworkBurst(cx, cy, col) {
    let rays = "";
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      const x2 = (cx + Math.cos(a) * 26).toFixed(1);
      const y2 = (cy + Math.sin(a) * 26).toFixed(1);
      rays += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2" stroke-linecap="round"/>`;
    }
    appendAmbientNode(`<g>${rays}<circle cx="${cx}" cy="${cy}" r="5" fill="#ffffff"/></g>`, "h-firework-pop", 1500);
  }

  function spawnGravWave(cx, cy, col) {
    appendAmbientNode(
      `<circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${col}" stroke-width="3.2" opacity="0.88"/>
       <circle cx="${cx}" cy="${cy}" r="24" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.8"/>`,
      "h-grav-wave", 1950
    );
  }

  function spawnKoiLeap(cx, cy) {
    appendAmbientNode(
      `<g transform="translate(${cx}, ${cy})">
         <ellipse cx="0" cy="0" rx="8" ry="3.2" fill="#f97316" stroke="#fff" stroke-width="0.7"/>
         <polygon points="-8,0 -13,-3.5 -13,3.5" fill="#ef4444"/>
       </g>`,
      "h-koi-leap", 1400
    );
  }

  function startAmbientLoop(getHouseFn) {
    stopAmbientLoop();
    ambientTimer = setInterval(() => {
      if (document.hidden) return;
      const modal = document.getElementById("homeModal");
      if (!modal || !modal.classList.contains("open")) return;
      const house = typeof getHouseFn === "function" ? getHouseFn() : null;
      if (!house) return;
      const t = house.tier || 1;
      const w = house.worldWidth || 420;
      if (t >= 8) {
        if (Math.random() < (t === 10 && roomState.creatorWeather === "aurora_meteor" ? 0.85 : 0.48)) {
          spawnShootingStar(w, t === 10);
        }
        if (Math.random() < 0.18) {
          spawnCosmicVisitor(w, "auto");
        }
      }
    }, 2800);
  }

  function stopAmbientLoop() {
    if (ambientTimer) {
      clearInterval(ambientTimer);
      ambientTimer = null;
    }
  }

  // ---- Handle Click on Every Bespoke Interactive World Hotspot! ----
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
      // === T1 ===
      case "t1_lamp":
        roomState.streetLampOn = !roomState.streetLampOn;
        redraw();
        flash(["💡", "✨"], roomState.streetLampOn ? "💡 暖黄路灯亮起，街头温暖多了～" : "🌙 熄灭路灯看星星～");
        return true;
      case "t1_cat":
        playTone(620, 0.08, "sine", 0.04); setTimeout(() => playTone(740, 0.12, "sine", 0.04), 90);
        flash(["🐱", "❤️", "✨"], "🐱 喵呜～小黑猫甩着尾巴蹭了蹭兔兔！", null);
        return true;

      // === T2 (5 Unique Shelters!) ===
      case "t2_wall_cat":
        playTone(580, 0.09, "sine", 0.045); setTimeout(() => playTone(680, 0.13, "sine", 0.04), 95);
        flash(["🐈", "❤️", "🧱"], "🐈 墙头小橘猫伸了个懒腰，呼噜呼噜打招呼～", null);
        return true;
      case "t2_ladybug":
        flash(["🐞", "🍀", "✨"], "🐞 七星瓢虫爬过红砖墙，给兔兔带来今日欧气！");
        return true;
      case "t2_bulb":
        roomState.t2BulbOn = !roomState.t2BulbOn;
        redraw();
        flash(["💡", "✨"], roomState.t2BulbOn ? "💡 点亮墙角雨棚小暖灯，躲雨更安心！" : "🌙 关上雨棚灯泡听风声～");
        return true;
      case "t2_butterfly":
        spawnButterflySwarm(336, 92);
        flash(["🦋", "🌸", "✨"], "🦋 金粉蝴蝶振翅起舞，绕着花盆转圈圈！");
        return true;
      case "t2_snail":
        roomState.t2SnailHidden = !roomState.t2SnailHidden;
        redraw();
        flash(["🐌", "🌿"], roomState.t2SnailHidden ? "🐌 羞羞！小蜗牛嗖地缩回壳里啦～" : "🐌 小蜗牛探出触角偷偷看兔兔！");
        return true;
      case "t2_dandelion":
        spawnButterflySwarm(340, 140);
        flash(["🌬️", "🤍", "✨"], "🌬️ 呼～吹散一朵蒲公英，白色绒毛飘向远方！", "cache");
        return true;
      case "t2_dragonfly":
        flash(["🪰", "✨", "🌾"], "✨ 蓝翅膀小蜻蜓点水掠过干草垛！", "cache");
        return true;
      case "t2_hedgehog":
        flash(["🦔", "🥕", "❤️"], "🦔 害羞的小刺猬在草堆边滚出半颗迷你胡萝卜！");
        return true;
      case "t2_firefly":
        flash(["✨", "🌟", "💫"], "✨ 成群萤火虫亮起微光，夏夜童话感拉满啦～", "cache");
        return true;
      case "t2_frog":
        playTone(220, 0.09, "triangle", 0.06); setTimeout(() => playTone(280, 0.12, "triangle", 0.06), 110);
        spawnGravWave(88, 166, "#7dd3fc");
        flash(["🐸", "💧", "✨"], "🐸 呱呱！溪畔小青蛙扑通跳起一圈水花！", null);
        return true;
      case "t2_ripple_stone":
        spawnGravWave(348, 174, "#bae6fd");
        playTone(480, 0.06, "sine", 0.04); setTimeout(() => playTone(560, 0.06, "sine", 0.035), 90);
        flash(["🪨", "💧", "✨"], "💧 打了个漂亮的三连水漂，涟漪层层荡开！", null);
        return true;
      case "t2_fairy":
        roomState.t2FairyGlow = !roomState.t2FairyGlow;
        redraw();
        flash(["🧚", "✨", "🍄"], roomState.t2FairyGlow ? "✨ 森林小精灵洒下金粉，大蘑菇伞发出童话柔光！" : "🧚 小精灵俏皮地眨眨眼～", "gold");
        return true;
      case "t2_morpho":
        spawnButterflySwarm(334, 86);
        flash(["🦋", "💙", "✨"], "🦋 蓝闪蝶扇动流光双翼掠过童话林地！");
        return true;
      case "t2_mini_shroom":
        playTone(340, 0.08, "sine", 0.05); setTimeout(() => playTone(540, 0.1, "sine", 0.05), 60);
        flash(["🍄", "✨", "🌟"], "🍄 Boing～Q弹小蘑菇弹出金色孢子云！", null);
        return true;

      // === T3 & T4 Curtains + Bespoke Craft & Nature Toys ===
      case "toggle_curtains":
        roomState.curtainsClosed = !roomState.curtainsClosed;
        redraw();
        flash(["🪟", "✨"], roomState.curtainsClosed ? "🪟 拉上窗帘，窝在私密小家超安心～" : "☀️ 拉开窗帘，迎接窗外好风景！");
        return true;
      case "toggle_lamp":
        roomState.lampOn = !roomState.lampOn;
        redraw();
        flash(["💡", "✨"], roomState.lampOn ? "💡 点亮暖黄氛围灯，屋里瞬间温馨起来！" : "🌙 关上台灯省电护眼～");
        return true;
      case "t3_bamboo_knot":
        [660, 880, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.16, "sine", 0.04), i * 80));
        flash(["🧧", "🔔", "✨"], "🧧 拨动红竹结铃铛，清脆祈福今日算力长虹！", null);
        return true;
      case "t3_bamboo_kettle":
        playTone(780, 0.22, "sine", 0.035);
        flash(["🫖", "♨️", "🍃"], "🫖 竹炭茶壶咕嘟烧沸，满屋清雅竹叶茶香！", null);
        return true;
      case "t3_radio":
        [523, 659, 784, 659, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.11, "square", 0.025), i * 90));
        flash(["📻", "🎵", "🎶", "✨"], "📻 纸箱复古磁带机响起 8-bit 欢快写码 BGM！", null);
        return true;
      case "t3_crate_gear":
        [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.12, "triangle", 0.04), i * 75));
        flash(["⚙️", "✨", "🔧"], "⚙️ 拧动工坊黄铜八音盒齿轮，清脆机械律动响起！", null);
        return true;
      case "t3_guitar":
        [330, 415, 494, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.24, "triangle", 0.045), i * 65));
        flash(["🎸", "🎵", "🏕️", "✨"], "🎸 拨响露营木吉他，温柔民谣伴着串灯流淌～", null);
        return true;
      case "t3_van_horn":
        playTone(392, 0.11, "sawtooth", 0.03); setTimeout(() => playTone(494, 0.14, "sawtooth", 0.03), 130);
        spawnLaserBeam(546, 86, 560, 74, "#fef08a", 6);
        flash(["🚐", "📣", "✨"], "📣 嘀嘀！按响复古房车喇叭，车灯照亮江边夜色！", null);
        return true;
      case "t3_van_radio":
        [440, 523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.15, "sine", 0.04), i * 95));
        flash(["📻", "🌅", "🎶"], "📻 调频公路电台播放江畔落日 Synthwave！", null);
        return true;

      // === T4 Nature Villas ===
      case "t4_lantern":
        roomState.t4LanternOn = !roomState.t4LanternOn;
        redraw();
        flash(["🏮", "✨"], roomState.t4LanternOn ? "🏮 点亮纸雕宫灯，茶厅映出温润竹影～" : "🌙 熄灯听窗外竹林风声～");
        return true;
      case "t4_bamboo":
        playTone(620, 0.08, "triangle", 0.08);
        spawnGravWave(592, 144, "#7dd3fc");
        flash(["🎋", "💧", "✨"], "🎋「咚！」清脆竹筒惊鹿声回荡溪畔竹林～", null);
        return true;
      case "t4_owl":
        playTone(440, 0.14, "sine", 0.05); setTimeout(() => playTone(370, 0.2, "sine", 0.05), 140);
        flash(["🦉", "❤️", "🌳"], "🦉 咕咕～窗台小猫头鹰拍拍翅膀眨大眼！", null);
        return true;
      case "t4_mushrooms":
        roomState.t4MushroomsGlow = !roomState.t4MushroomsGlow;
        redraw();
        flash(["🍄", "✨", "💚"], roomState.t4MushroomsGlow ? "🍄 树洞夜光蘑菇绽放梦幻翡翠森林荧光！" : "🌿 荧光蘑菇收起微光～", "cache");
        return true;
      case "t4_fireplace":
        roomState.fireBoost = !roomState.fireBoost;
        redraw();
        flash(["🔥", "🪵", "✨"], roomState.fireBoost ? "🔥 添了一把红松木，壁炉火星噼啪作响！" : "🪵 调小火候，暖洋洋刚刚好～", "gold");
        return true;
      case "t4_spyglass":
        spawnEgretFlock(442, 62);
        flash(["🔭", "🦢", "🏔️"], "🔭 望远镜里一群白鹤振翅飞过莫干山竹海！", "cache");
        return true;
      case "t4_sprinkler":
        roomState.sprinklerRainbow = !roomState.sprinklerRainbow;
        redraw();
        flash(["💧", "🌈", "🌻"], roomState.sprinklerRainbow ? "🌈 花房细雾折射出梦幻七彩室内彩虹！" : "💧 关闭喷雾，向日葵喝饱水啦～", "cache");
        return true;
      case "t4_sunflower_bee":
        spawnButterflySwarm(78, 92);
        flash(["🐝", "🌻", "✨"], "🐝 胖胖小蜜蜂抖落一地金色向日葵花蜜星粉！");
        return true;
      case "t4_windmill":
        roomState.windmillTurbo = !roomState.windmillTurbo;
        redraw();
        flash(["🌀", "🍃", "✨"], roomState.windmillTurbo ? "🌀 疾风模式！湖畔风车呼呼加速卷起湖面涟漪！" : "🍃 回到悠闲微风转速～", "cache");
        return true;
      case "t4_mill_clock":
        playTone(659, 0.12, "sine", 0.05); setTimeout(() => playTone(523, 0.18, "sine", 0.05), 140);
        flash(["🕰️", "🐦", "🎶"], "🕰️ 咕咕～欧式布谷鸟磨坊钟准点报时！", null);
        return true;

      // === T5 Hangzhou City Residences ===
      case "t5_neon":
        roomState.neonIdx = (roomState.neonIdx + 1) % 3;
        redraw();
        flash(["⚡", "💜", "💙"], "🌃 切换丽晶 LOFT 赛博霓虹氛围灯带！", "cache");
        return true;
      case "t5_skybar":
        spawnLaserBeam(515, 122, 470, 12, "#38bdf8", 3);
        spawnLaserBeam(608, 118, 650, 10, "#f472b6", 3);
        spawnFireworkBurst(564, 38, "#fde047");
        flash(["🍸", "🌃", "✨"], "🌃 点亮钱江世纪城杭州之门 × 大莲花璀璨灯光秀！", "gold");
        return true;
      case "t5_vinyl":
        [523, 659, 784, 988].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "triangle", 0.045), i * 110));
        flash(["🎵", "🎶", "💿"], "💿 复古黑胶转动，温柔爵士乐飘满房间～", null);
        return true;
      case "t5_balcony_chime":
        [1046, 1175, 1318, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.2, "sine", 0.035), i * 85));
        flash(["🎐", "🍃", "✨"], "🎐 晚风吹响阳台玻璃风铃，叮咚清脆好治愈！", null);
        return true;
      case "t5_egrets":
        spawnEgretFlock(430, 58);
        flash(["🕊️", "🌿", "✨"], "🕊️ 透过望远镜召唤一群白鹭优雅飞过西溪湿地！", "cache");
        return true;
      case "t5_rattan_lamp":
        roomState.t5RattanOn = !roomState.t5RattanOn;
        redraw();
        flash(["🏮", "✨"], roomState.t5RattanOn ? "🏮 点亮湿地藤编暖灯，晚风更柔和啦～" : "🌙 关灯静听西溪蛙声～");
        return true;

      // === T6 Luxury Estates ===
      case "t6_chandelier":
        roomState.chandelierMode = (roomState.chandelierMode + 1) % 3;
        redraw();
        flash(["💎", "✨", "🌟"], ["💡 切换暖金水晶光！", "🌌 切换星夜蓝微光！", "🥂 切换派对玫瑰钻光！"][roomState.chandelierMode], "gold");
        return true;
      case "t6_koi":
        spawnKoiLeap(house.id === "xixi" ? 112 : 532, 162);
        setTimeout(() => spawnKoiLeap(house.id === "xixi" ? 148 : 576, 166), 240);
        spawnGravWave(house.id === "xixi" ? 136 : 556, 174, "#fde047");
        flash(["🎏", "💧", "🪷", "✨"], "🎏 撒一把锦鲤鱼食，红白锦鲤跃出水面讨个鸿运！", "cache");
        return true;
      case "t6_guqin":
        [392, 440, 523, 587, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.24, "triangle", 0.045), i * 105));
        flash(["🎵", "🏯", "🍃", "✨"], "🏯 抚琴一曲《高山流水》，太湖石飞瀑叮咚和鸣～", null);
        return true;
      case "t6_firepit":
        roomState.t6FirepitBoost = !roomState.t6FirepitBoost;
        redraw();
        flash(["🔥", "🥂", "✨"], roomState.t6FirepitBoost ? "🔥 云端围炉火苗蹿起，运河夜色浪漫拉满！" : "🔥 调回舒缓壁炉柔光～", "gold");
        return true;
      case "t6_champagne":
        spawnFireworkBurst(768, 36, "#fde047");
        setTimeout(() => spawnFireworkBurst(838, 28, "#f472b6"), 260);
        setTimeout(() => spawnFireworkBurst(696, 44, "#38bdf8"), 520);
        flash(["🥂", "🎆", "✨", "🌟"], "🥂 砰！高空无边泳池开香槟，大运河夜空绽放绚丽烟花！", "ssr");
        return true;
      case "t6_fountain":
        spawnGravWave(126, 144, "#bae6fd");
        spawnLaserBeam(126, 110, 126, 52, "#7dd3fc", 3);
        flash(["⛲", "🌹", "💧", "✨"], "⛲ 凡尔赛三层玫瑰喷泉水柱冲天，水雾泛起微光！", "cache");
        return true;
      case "t6_piano":
        [523, 659, 784, 1046, 988, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.22, "sine", 0.048), i * 90));
        spawnButterflySwarm(804, 126);
        flash(["🎹", "🌹", "🎵", "🎶"], "🎹 白色三角钢琴流淌出优雅夜曲，玫瑰花瓣漫天飞舞～", null);
        return true;

      // === T7 World Wonders (3 per palace!) ===
      case "t7_lava":
        roomState.lavaErupt = !roomState.lavaErupt;
        redraw();
        flash(["🌋", "🔥", "⚡"], roomState.lavaErupt ? "🌋 龙焰锻炉过载！火山口喷涌冲天熔浆！" : "🌋 火山熔炉归于平稳燃烧～", "ssr");
        return true;
      case "t7_magma_orb":
        roomState.magmaPulse = !roomState.magmaPulse;
        redraw();
        spawnGravWave(540, 56, "#f97316");
        flash(["🔥", "💎", "⚡"], "💎 唤醒黑曜石熔岩核心，千尺熔金地脉共鸣闪烁！", "gold");
        return true;
      case "t7_dragon":
        spawnCosmicVisitor(w, "dragon");
        flash(["🐉", "🔥", "✨"], "🐉 赤金火龙回应召唤，展翼掠过 1080px 黑曜苍穹！", "ssr");
        return true;
      case "t7_whale":
        roomState.whaleVisit = true;
        redraw();
        setTimeout(() => { roomState.whaleVisit = false; }, 7600);
        playTone(196, 0.45, "sine", 0.05);
        flash(["🐋", "🫧", "🌊", "✨"], "🐋 吹响深海法螺！巨型蓝鲸优雅游过海底水晶穹顶！", null);
        return true;
      case "t7_jelly_dance":
        spawnGravWave(540, 56, "#f472b6");
        flash(["🪼", "🫧", "✨"], "🪼 荧光水母群共舞，洒下漫天粉蓝星海泡泡！", "cache");
        return true;
      case "t7_trident":
        spawnLaserBeam(910, 62, 910, 4, "#38bdf8", 5);
        spawnGravWave(910, 76, "#fde047");
        flash(["🔱", "⚡", "🌊", "💎"], "🔱 海王三叉戟直贯苍穹，亚特兰蒂斯神光万丈！", "ssr");
        return true;
      case "t7_rainbow":
        roomState.rainbowBridge = !roomState.rainbowBridge;
        redraw();
        flash(["🌈", "☁️", "✨"], roomState.rainbowBridge ? "🌈 七彩彩虹天桥横贯万米云海！" : "☁️ 彩虹隐入流云～", "ssr");
        return true;
      case "t7_sky_bells":
        [659, 784, 988, 1318].forEach((f, i) => setTimeout(() => playTone(f, 0.24, "sine", 0.045), i * 85));
        spawnEgretFlock(380, 64);
        flash(["🎶", "🕊️", "☁️", "✨"], "🎶 云殿风之竖琴响起，白鸽与羽毛掠过天空之城！", null);
        return true;
      case "t7_airship":
        spawnCosmicVisitor(w, "airship");
        flash(["⛵", "☁️", "✨"], "⛵ 云端蒸汽飞艇鸣笛起航，巡航浮岛皇城！", "gold");
        return true;
      case "t7_aurora":
        roomState.auroraMode = (roomState.auroraMode + 1) % 4;
        redraw();
        flash(["🌌", "❄️", "✨"], ["🌌 翡翠北极光降临！", "💜 紫粉梦境极光！", "🌟 黄金日冕极光！", "🌈 幻彩全谱极光！"][roomState.auroraMode], "ssr");
        return true;
      case "t7_ice_lotus":
        roomState.iceLotusBloom = !roomState.iceLotusBloom;
        redraw();
        spawnGravWave(540, 148, "#bae6fd");
        flash(["❄️", "🪷", "💎"], roomState.iceLotusBloom ? "❄️ 北极镜冰地面绽放三朵剔透冰晶霜莲！" : "❄️ 冰莲化作霜雾轻散～", "cache");
        return true;
      case "t7_chime":
        [880, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.25, "sine", 0.045), i * 85));
        flash(["❄️", "🔔", "✨", "💎"], "🔔 永冬水晶冰风铃奏出清澈极地天籁！", null);
        return true;
      case "t7_bloom":
        roomState.flowersBloom = !roomState.flowersBloom;
        redraw();
        flash(["🌺", "🌸", "🌼", "✨"], roomState.flowersBloom ? "🌺 巴比伦生命水渠涌动，三层悬园百花齐放！" : "🌿 花瓣轻落碧水～", "ssr");
        return true;
      case "t7_petals":
        spawnButterflySwarm(540, 68);
        flash(["🌸", "🌼", "✨"], "🌸 轻摇黄金藤铃，悬园洒下芬芳金色花瓣雨！", "gold");
        return true;
      case "t7_butterflies":
        spawnButterflySwarm(906, 120);
        setTimeout(() => spawnButterflySwarm(780, 96), 280);
        flash(["🦋", "✨", "🌟"], "🦋 成群黄金蝴蝶从穹顶花亭腾空起舞！", "gold");
        return true;

      // === T8 Interstellar Stations (15 COMPLETELY UNIQUE Sci-Fi Spectacles!) ===
      case "t8_lunar_earth":
        spawnLaserBeam(206, 106, 280, 54, "#22d3ee", 3.5);
        spawnGravWave(280, 54, "#38bdf8");
        playTone(880, 0.1, "sine", 0.04); setTimeout(() => playTone(1318, 0.16, "sine", 0.04), 110);
        flash(["📡", "🌍", "✨"], "📡 地月激光通信成功！收到来自杭州的胡萝卜补给回执！", null);
        return true;
      case "t8_lunar_rover":
        spawnLunarRoverCruise(684, 126);
        spawnShootingStar(w, true);
        flash(["🚗", "🌕", "🌠"], "🌕 阿波罗月球车驶出静海基地巡逻，顺带捕获一颗流星！", "gold");
        return true;
      case "t8_warp":
        spawnWarpJump(w);
        setTimeout(() => spawnWarpJump(w), 320);
        [220, 330, 440, 660, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.16, "sawtooth", 0.025), i * 65));
        flash(["🚀", "⚡", "🌌", "✨"], "🚀 WARP 9.9 启动！星舰进入超光速曲率跃迁！", null);
        return true;
      case "t8_holo":
        roomState.holoPlanet = (roomState.holoPlanet + 1) % 4;
        redraw();
        flash(["🪐", "🌍", "✨"], `🔭 全息星图切换为：${["🌍 蔚蓝地球", "🪐 土星冰环", "🔴 火星奇观", "🌀 视界黑洞"][roomState.holoPlanet]}！`, "cache");
        return true;
      case "t8_ufo":
        spawnCosmicVisitor(w, "ufo");
        setTimeout(() => spawnCosmicVisitor(w, "comet"), 420);
        spawnGravWave(1042, 120, "#c084fc");
        flash(["🛸", "☄️", "✨"], "🛸 深空信标回应！友善外星飞碟与彗星编队前来护航！", "ssr");
        return true;
      case "t8_mars_bio":
        roomState.marsBioUv = !roomState.marsBioUv;
        redraw();
        flash(["🌱", "🥕", "💜"], roomState.marsBioUv ? "💜 开启紫外生态培育灯，火星水培胡萝卜瞬间爆长！" : "🌱 切回火星自然光照模式～", "cache");
        return true;
      case "t8_mars_rover":
        roomState.marsShield = !roomState.marsShield;
        redraw();
        spawnLaserBeam(641, 114, 578, 132, "#22c55e", 2.8);
        flash(["🛰️", "🛡️", "✨"], roomState.marsShield ? "🛡️ 祝融号激光扫岩完成，金色防沙尘能量护盾展开！" : "🛰️ 沙尘平息，收起穹顶护盾～", "gold");
        return true;
      case "t8_mars_drone":
        spawnMarsDrone(1042, 126);
        playTone(420, 0.16, "triangle", 0.04); setTimeout(() => playTone(580, 0.18, "triangle", 0.035), 140);
        flash(["🚁", "🔴", "✨"], "🚁「机智号」火星直升机旋翼全开，腾空巡航水手峡谷！", null);
        return true;
      case "t8_saturn_ice":
        spawnLaserBeam(202, 118, 368, 72, "#7dd3fc", 4.5);
        for (let i = 0; i < 4; i++) setTimeout(() => spawnShootingStar(w, false), i * 180);
        flash(["🧊", "🪐", "✨"], "🧊 牵引光束捕获卡西尼环钻石碎冰，冰晶彗星擦窗划过！", "ssr");
        return true;
      case "t8_saturn_harp":
        [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => playTone(f, 0.28, "sine", 0.045), i * 80));
        spawnGravWave(620, 94, "#fde68a");
        flash(["🎶", "🪐", "✨"], "🎶 拨动土星冰环引力竖琴，金色星环随乐声荡漾波纹！", null);
        return true;
      case "t8_dyson_flare":
        spawnLaserBeam(204, 104, 620, 76, "#f97316", 5);
        spawnGravWave(620, 76, "#fde047");
        flash(["☀️", "⚡", "🔥"], "☀️ 恒星日冕导流塔爆发金色耀斑电弧，算力充能 999%！", "ssr");
        return true;
      case "t8_dyson_compute":
        roomState.dysonOverclock = !roomState.dysonOverclock;
        redraw();
        flash(["⚡", "☀️", "🌟"], roomState.dysonOverclock ? "⚡ 戴森球进入超频过载模式，恒星聚能环全速奔涌！" : "☀️ 戴森核心恢复稳态供能～", "gold");
        return true;
      case "t8_dyson_sail":
        spawnSolarSailShip(1044, 92);
        spawnLaserBeam(1044, 122, 920, 86, "#fef08a", 3.5);
        flash(["⛵", "☀️", "✨"], "⛵ 黄金光子帆星舰乘着恒星光压驶向星海深处！", "ssr");
        return true;
      case "t8_lowgrav":
        bunnyFx.lowGrav = !bunnyFx.lowGrav;
        redraw();
        flash(["🪶", "🚀", "✨"], bunnyFx.lowGrav ? "🪶 失重模式开启！点击地面看兔兔轻盈超高漂浮跳！" : "⚓ 恢复标准人工重力～", "gold");
        return true;

      // === T9 Dimensional Sanctuaries (5 Core Powers + 5 Bespoke 6th Cosmic Miracles!) ===
      case "t9_portal_l":
        teleportTo(1235, 178);
        spawnGravWave(1296, 122, "#38bdf8");
        flash(["🌀", "⚡", "✨"], "🌀 次元折跃成功！瞬移 1190px 抵达东翼星门！", "ssr");
        return true;
      case "t9_portal_r":
        teleportTo(165, 178);
        spawnGravWave(104, 122, "#c084fc");
        flash(["🌀", "⚡", "✨"], "🌀 次元折跃成功！瞬移返回西翼星门！", "ssr");
        return true;
      case "t9_invis":
        bunnyFx.invisible = !bunnyFx.invisible;
        redraw(); updateBunnyDom();
        flash(["👻", "💠", "✨"], bunnyFx.invisible ? "👻 量子隐身发动！兔兔进入半透明潜行态！" : "🐰 解除隐身，兔兔现形啦！", "cache");
        return true;
      case "t9_glow":
        bunnyFx.glow = !bunnyFx.glow;
        redraw(); updateBunnyDom();
        flash(["✨", "🌟", "👑"], bunnyFx.glow ? "✨ 圣光增幅！兔兔全身散发璀璨黄金光辉！" : "🌙 收起圣光光环～", "ssr");
        return true;
      case "t9_scale":
        bunnyFx.scaleMode = bunnyFx.scaleMode === "normal" ? "giant" : (bunnyFx.scaleMode === "giant" ? "mini" : "normal");
        redraw(); updateBunnyDom();
        flash(["📏", "⚡", "✨"], bunnyFx.scaleMode === "giant" ? "🦖 巨化射线命中！变身 1.42× 霸气巨无霸兔！" : bunnyFx.scaleMode === "mini" ? "🔬 缩小射线命中！变身 0.68× 超萌迷你袖珍兔！" : "🐰 恢复标准可爱体型！", "gold");
        return true;
      case "t9_clone":
        bunnyFx.prismClone = !bunnyFx.prismClone;
        redraw();
        flash(["🌈", "✨", "👯"], bunnyFx.prismClone ? "🌈 量子叠加态！幻彩分身兔现身同频起舞！" : "✨ 量子分身坍缩归一！", "ssr");
        return true;
      case "t9_kaleido":
        spawnLaserBeam(210, 78, 700, 78, "#38bdf8", 3);
        spawnLaserBeam(700, 78, 1190, 78, "#f472b6", 3);
        spawnLaserBeam(700, 12, 700, 148, "#fde047", 3);
        flash(["🔮", "🌈", "✨"], "🔮 万花筒量子光阵激活，七彩激光折射全殿镜像！", "ssr");
        return true;
      case "t9_gravwave":
        spawnGravWave(700, 74, "#c084fc");
        setTimeout(() => spawnGravWave(700, 74, "#38bdf8"), 280);
        setTimeout(() => spawnGravWave(700, 74, "#fde047"), 560);
        flash(["🌌", "🌀", "⚡"], "🌌 爱因斯坦-罗森虫洞释放三重时空引力波脉冲！", "ssr");
        return true;
      case "t9_timerev":
        roomState.timeSpeed = roomState.timeSpeed === 1 ? 2 : (roomState.timeSpeed === 2 ? -1 : 1);
        redraw();
        [440, 392, 330].forEach((f, i) => setTimeout(() => playTone(f, 0.28, "sine", 0.05), i * 120));
        flash(["⏳", "🕰️", "✨"], roomState.timeSpeed === 2 ? "⏩ 时光加速 2×！全殿黄金齿轮飞旋！" : roomState.timeSpeed === -1 ? "⏪ 时光倒流启动！金沙逆流回溯时空！" : "⏳ 恢复标准时间流速～", null);
        return true;
      case "t9_nova":
        spawnGravWave(700, 76, "#34d399");
        spawnFireworkBurst(700, 76, "#fef08a");
        for (let i = 0; i < 4; i++) setTimeout(() => spawnShootingStar(w, true), i * 180);
        flash(["🌠", "💚", "✨"], "🌠 银心超新星璀璨绽放，亿万星团在仙阙外闪耀！", "ssr");
        return true;
      case "t9_horizon":
        bunnyFx.lowGrav = !bunnyFx.lowGrav;
        redraw();
        spawnGravWave(700, 78, "#fde047");
        flash(["🌀", "👑", "🪶"], bunnyFx.lowGrav ? "🌀 卡冈图雅视界共振！引力透镜暴涨并开启王庭失重！" : "🌀 视界引力归于平稳～", "ssr");
        return true;

      // === T10 Sovereign Creator Palace ===
      case "t10_portal_l":
        teleportTo(1480, 178);
        flash(["🌀", "👑", "✨"], "🌀 星穹传送！瞬间跨殿降临造物主神坛！", "ssr");
        return true;
      case "t10_portal_r":
        teleportTo(175, 178);
        flash(["🌀", "🏛️", "✨"], "🌀 星穹传送！瞬移返回星穹神谕殿！", "ssr");
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
        spawnGravWave(1060, 146, "#38bdf8");
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
