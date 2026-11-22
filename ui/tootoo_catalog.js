/* ============================================================================
 * TooToo Raising Economy, Live-Ops Events, Friday Rent Coupons & Content Registry
 * ----------------------------------------------------------------------------
 * 42 Houses (T1..T10, 0.8/1.0/1.2/1.4/1.6 per tier) with Purchase Gifts
 * ~100 Decors (5 slots) + 44 Wearables (3 slots) + Seasonal Festival Exclusives
 * Friday 14:00-18:00 "辛苦一周" Weekly Rental Coupon (85% 8折 / 15% 3折神券)
 * ============================================================================ */
(function (global) {
  "use strict";

  const ECONOMY = {
    version: 4,
    mintUnitTokens: 10e6,
    baseCheckinCoins: 1,
    rentEquityRate: 0.5,      // 50% of paid rent accumulates toward buying out the house
    rentEquityCapRate: 0.4,   // Max 40% of house purchase price can be offset by rent equity
    giftRefundRate: 0.5,      // Buying a house whose gift you already own refunds 50% of gift price
    fridayStartHour: 14,      // Friday 14:00 - 18:00 local time
    fridayEndHour: 18,
    fridayEpicChance: 0.15,   // 15% chance for 3折神券, 85% chance for 8折租房券
    fridayCouponDays: 7,
    gradeMeta: {
      basic:  { label: "",          cls: "basic",  order: 1 },
      craft:  { label: "精工",      cls: "craft",  order: 2 },
      luxury: { label: "奢华",      cls: "luxury", order: 3 },
      mythic: { label: "传世",      cls: "mythic", order: 4 },
      event:  { label: "限时限定",  cls: "event",  order: 5 },
      secret: { label: "✦ 隐藏款",  cls: "secret", order: 6 },
    },
    houseTiers: [
      { tier: 1,  label: "T1 起点" },
      { tier: 2,  label: "T2 蜗居" },
      { tier: 3,  label: "T3 手作" },
      { tier: 4,  label: "T4 林间" },
      { tier: 5,  label: "T5 杭州" },
      { tier: 6,  label: "T6 顶豪" },
      { tier: 7,  label: "T7 奇观" },
      { tier: 8,  label: "T8 星际" },
      { tier: 9,  label: "T9 次元" },
      { tier: 10, label: "T10 神居" },
    ],
  };

  // ---- Seasonal & Live-Ops Festival Calendar ----
  const EVENTS = [
    {
      id: "prog1024",
      icon: "💻",
      name: "1024 程序员节",
      badge: "1024限定",
      accent: "#10b981",
      bannerBg: "linear-gradient(135deg, rgba(6, 78, 59, 0.94), rgba(15, 23, 42, 0.94))",
      bannerText: "💻 1024 程序员节狂欢 · 每日签到额外 +1 币，限时上架极客代码装扮！",
      dateRanges: [["10-20", "10-27"]],
      shopDiscount: 1.0,
      checkinBonus: 1,
    },
    {
      id: "blackfriday",
      icon: "🏷️",
      name: "黑色星期五",
      badge: "黑五限定",
      accent: "#f59e0b",
      bannerBg: "linear-gradient(135deg, rgba(24, 24, 27, 0.96), rgba(120, 53, 15, 0.94))",
      bannerText: "🏷️ 黑色星期五特惠 · 全场常驻房型/装潢/服饰 8 折，限时开放黑金限定藏品！",
      dateRanges: [["11-24", "11-30"]],
      shopDiscount: 0.8,
      checkinBonus: 0,
    },
    {
      id: "christmas",
      icon: "🎄",
      name: "圣诞奇遇季",
      badge: "圣诞限定",
      accent: "#ef4444",
      bannerBg: "linear-gradient(135deg, rgba(127, 29, 29, 0.94), rgba(20, 83, 45, 0.94))",
      bannerText: "🎄 圣诞奇遇季开启 · 每日签到额外 +1 币，限时上架星光圣诞树与雪绒圣诞帽！",
      dateRanges: [["12-18", "12-28"]],
      shopDiscount: 1.0,
      checkinBonus: 1,
    },
    {
      id: "springfest",
      icon: "🧧",
      name: "新春贺岁季",
      badge: "春节限定",
      accent: "#e11d48",
      bannerBg: "linear-gradient(135deg, rgba(153, 27, 27, 0.96), rgba(180, 83, 9, 0.94))",
      bannerText: "🧧 新春贺岁大吉 · 每日签到额外 +2 币，限时上架喜庆双福灯笼与醒狮贺岁帽！",
      dateRanges: [["01-20", "02-18"]],
      shopDiscount: 1.0,
      checkinBonus: 2,
    },
  ];

  // ---- Houses Catalog: 42 Houses across T1..T10 (T2..T9 at strict 0.8/1.0/1.2/1.4/1.6 tiers) ----
  // weatherMode: "outdoor" (T1 exposed) | "shelter" (T2 arch shelter + outdoor meadow) | "window" (T3/T4 indoor+window) | "terrace" (T5/T6 720px side-scrolling indoor+outdoor) | "none" (T7..T10 cosmic/wonder)
  const HOUSES = [
    // ---- T1 起点 ----
    {
      id: "street", tier: 1, icon: "🛣️", name: "露宿马路边", price: 0, tierTag: "起点", grade: "basic",
      rentable: false, series: "初始起点", tags: ["起点", "户外", "街头"],
      slots: [], weatherMode: "outdoor", worldWidth: 420, hotTableStyle: null,
      desc: "暖黄路灯与旧报纸铺地，捧着热咖啡从零起家",
    },

    // ---- T2 简陋落脚（基准 20：0.8 / 1.0 / 1.2 / 1.4 / 1.6）----
    {
      id: "wall_corner", tier: 2, icon: "🧱", name: "废弃墙角窝", price: 16, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 1, rent30d: 5, series: "新手落脚", tags: ["墙角", "红砖", "可租房", "喝热水"],
      slots: [], weatherMode: "shelter", worldWidth: 420, hotTableStyle: "crate",
      shelterArch: { x0: 138, x1: 268, yMax: 170, shape: "lean_to" },
      gift: { kind: "wear", id: "paper_boat" },
      desc: "背风红砖残墙配斜搭木板雨棚，遮风避雨并解锁棚内喝热水",
    },
    {
      id: "pot", tier: 2, icon: "🪴", name: "简陋花盆屋", price: 20, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 2, rent30d: 6, series: "新手落脚", tags: ["新手", "花盆", "可租房", "喝热水"],
      slots: [], weatherMode: "shelter", worldWidth: 420, hotTableStyle: "stump",
      shelterArch: { x0: 168, x1: 252, yMax: 170 },
      gift: { kind: "decor", id: "carrot_sprout" },
      desc: "青草蘑菇间的红陶拱门花盆屋，从此能遮风挡雨并解锁屋内小桌喝热水",
    },
    {
      id: "hay_pile", tier: 2, icon: "🌿", name: "蓬松小草堆", price: 24, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 2, rent30d: 7, series: "新手落脚", tags: ["草堆", "田野", "可租房", "喝热水"],
      slots: [], weatherMode: "shelter", worldWidth: 420, hotTableStyle: "stump",
      shelterArch: { x0: 162, x1: 258, yMax: 170 },
      gift: { kind: "decor", id: "straw_mat" },
      desc: "晒满阳光的田野干草垛小洞，窝进去满鼻稻草清香与暖意",
    },
    {
      id: "moss_rocks", tier: 2, icon: "🪨", name: "苔藓石头堆", price: 28, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 2, rent30d: 8, series: "新手落脚", tags: ["石头堆", "苔藓", "溪畔", "可租房"],
      slots: [], weatherMode: "shelter", worldWidth: 420, hotTableStyle: "stump",
      shelterArch: { x0: 164, x1: 256, yMax: 170 },
      gift: { kind: "decor", id: "firefly_stone_lamp" },
      desc: "溪畔青苔鹅卵石搭出的避风石穴，夏凉冬暖还有萤火微光",
    },
    {
      id: "giant_mushroom", tier: 2, icon: "🍄", name: "野生大蘑菇棚", price: 32, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 3, rent30d: 10, series: "新手落脚", tags: ["蘑菇", "森林", "童话", "可租房"],
      slots: [], weatherMode: "shelter", worldWidth: 420, hotTableStyle: "stump",
      shelterArch: { x0: 158, x1: 262, yMax: 170 },
      gift: { kind: "wear", id: "mushroom_cap" },
      desc: "雨后林地撑开巨伞的红白波点蘑菇屋檐，仿佛住进童话森林",
    },

    // ---- T3 手作蜗居（基准 80：0.8 / 1.0 / 1.2 / 1.4 / 1.6，解锁 bed + light，500px 宽敞单间 + 互动窗帘！）----
    {
      id: "bamboo_basket", tier: 3, icon: "🧺", name: "废旧竹编筐屋", price: 64, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 4, rent30d: 13, series: "手作居所", tags: ["竹筐", "手作", "可租房", "互动窗帘"],
      slots: ["bed", "light"], weatherMode: "window", worldWidth: 500, hotTableStyle: "stump",
      indoorWindow: { x0: 274, x1: 356, y0: 44, y1: 104, shape: "rect" },
      gift: { kind: "decor", id: "woven_pouf" },
      desc: "倒扣大号老竹编筐开出透气小窗与温馨角柜，可拉合竹帘并正式开启家具与灯饰装潢！",
    },
    {
      id: "cardboard", tier: 3, icon: "📦", name: "工业纸箱屋", price: 80, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 6, rent30d: 18, series: "经典居所", tags: ["装潢入门", "纸箱", "可租房", "互动窗帘"],
      slots: ["bed", "light"], weatherMode: "window", worldWidth: 500, hotTableStyle: "crate",
      indoorWindow: { x0: 275, x1: 361, y0: 43, y1: 105, shape: "rect" },
      gift: { kind: "decor", id: "cardboard_sofa" },
      desc: "加厚双层瓦楞纸箱配手绘开窗与小书架，可开关纸窗帘与暖光灯，开启装潢之旅！",
    },
    {
      id: "wood_crate", tier: 3, icon: "🪵", name: "工地木板箱屋", price: 96, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 6, rent30d: 20, series: "手作居所", tags: ["木板箱", "工业风", "可租房"],
      slots: ["bed", "light"], weatherMode: "window", worldWidth: 500, hotTableStyle: "crate",
      indoorWindow: { x0: 274, x1: 360, y0: 42, y1: 104, shape: "rect" },
      gift: { kind: "decor", id: "fairy_bulb" },
      desc: "松木货运板条箱配铁艺合页、工具洞洞板与工业窗帘，硬核复古工业风",
    },
    {
      id: "canvas_tent", tier: 3, icon: "⛺", name: "露营帆布帐篷", price: 112, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 7, rent30d: 22, series: "手作居所", tags: ["露营", "帐篷", "串灯", "可租房"],
      slots: ["bed", "light"], weatherMode: "window", worldWidth: 500, hotTableStyle: "wood",
      indoorWindow: { x0: 274, x1: 356, y0: 40, y1: 108, shape: "arch" },
      gift: { kind: "decor", id: "camping_lantern" },
      desc: "米白防泼水三角帆布帐配氛围串灯与木吉他角，拉合帐帘随时逃离工位去野营",
    },
    {
      id: "vintage_van", tier: 3, icon: "🚐", name: "复古露营面包车", price: 128, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 8, rent30d: 26, series: "手作居所", tags: ["房车", "复古", "江边", "可租房"],
      slots: ["bed", "light"], weatherMode: "window", worldWidth: 500, hotTableStyle: "wood",
      indoorWindow: { x0: 244, x1: 374, y0: 40, y1: 104, shape: "rect" },
      gift: { kind: "decor", id: "van_plaid_mat" },
      desc: "停在江边草地的薄荷绿复古改装房车，宽景车窗与复古驾驶舱尽享日出江风",
    },

    // ---- T4 林间独栋（基准 360：600px 全景大窗林间度假屋 + 专属自然互动机关！）----
    {
      id: "bamboo_pavilion", tier: 4, icon: "🎋", name: "溪畔竹林小筑", price: 288, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 18, rent30d: 58, series: "山野雅居", tags: ["竹林", "溪畔", "新中式", "大窗"],
      slots: ["bed", "light", "garden"], weatherMode: "window", worldWidth: 600, hotTableStyle: "tea",
      indoorWindow: { x0: 266, x1: 356, y0: 34, y1: 108, shape: "arch" },
      gift: { kind: "decor", id: "bamboo_tea_table" },
      desc: "600px 宽景竹林雅筑配全景溪畔大窗与互动竹筒惊鹿，听风煮茶解锁绿植槽位",
    },
    {
      id: "treehole", tier: 4, icon: "🌳", name: "阳光树洞屋", price: 360, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 24, rent30d: 75, series: "经典居所", tags: ["树洞", "林间", "可租房", "猫头鹰"],
      slots: ["bed", "light", "garden"], weatherMode: "window", worldWidth: 600, hotTableStyle: "stump",
      indoorWindow: { x0: 274, x1: 350, y0: 32, y1: 106, shape: "arch" },
      gift: { kind: "decor", id: "balcony_monstera" },
      desc: "600px 老橡树双室树洞与森林落地大窗，窗台驻守着会眨眼互动的小猫头鹰",
    },
    {
      id: "moganshan_cabin", tier: 4, icon: "🛖", name: "莫干山原木屋", price: 432, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 26, rent30d: 86, series: "山野雅居", tags: ["莫干山", "木屋", "壁炉", "大窗"],
      slots: ["bed", "light", "garden"], weatherMode: "window", worldWidth: 600, hotTableStyle: "wood",
      indoorWindow: { x0: 256, x1: 368, y0: 34, y1: 106, shape: "rect" },
      gift: { kind: "decor", id: "pinecone_sconce" },
      desc: "600px 红雪松斜顶山野木屋配全景山林观景窗与可添柴互动的暖融石壁炉",
    },
    {
      id: "sunflower_glasshouse", tier: 4, icon: "🌻", name: "向日葵玻璃花房", price: 504, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 30, rent30d: 100, series: "山野雅居", tags: ["花房", "玻璃", "彩虹喷雾", "大窗"],
      slots: ["bed", "light", "garden"], weatherMode: "window", worldWidth: 600, hotTableStyle: "wood",
      indoorWindow: { x0: 238, x1: 382, y0: 24, y1: 120, shape: "rect" },
      gift: { kind: "decor", id: "glass_succulent_wall" },
      desc: "600px 全玻璃拱顶阳光花房，推窗尽是金黄花海，点击花房喷雾器还能折射室内彩虹",
    },
    {
      id: "windmill_mill", tier: 4, icon: "🏡", name: "湖畔风车磨坊屋", price: 576, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 35, rent30d: 115, series: "山野雅居", tags: ["风车", "湖畔", "欧式", "大窗"],
      slots: ["bed", "light", "garden"], weatherMode: "window", worldWidth: 600, hotTableStyle: "wood",
      indoorWindow: { x0: 262, x1: 364, y0: 30, y1: 110, shape: "arch" },
      gift: { kind: "decor", id: "windmill_copper_lamp" },
      desc: "600px 欧式水岸磨坊楼配超宽湖景落地窗，点击磨坊风车可加速旋转卷起湖面涟漪",
    },

    // ---- T5 杭州城市住宅（760px 精装横厅 + 室外露台，电动纱帘 + 氛围互动！）----
    {
      id: "regent_intl", tier: 5, icon: "🏙️", name: "丽晶国际", price: 1020, tierTag: "住宅", grade: "craft",
      rentable: true, rent7d: 62, rent30d: 205, series: "杭州城市住宅", tags: ["丽晶国际", "LOFT", "可出门", "霓虹互动"],
      slots: ["bed", "light", "floor", "garden"], weatherMode: "terrace", worldWidth: 760, hotTableStyle: "cyber",
      indoorWindow: { x0: 186, x1: 384, y0: 20, y1: 148 }, terraceRailY: 114,
      outdoorNote: "🌃 站在高空串灯露台看杭州之门和大莲花夜景，氛围感拉满！",
      gift: { kind: "decor", id: "sunset_floor_lamp" },
      desc: "760px 钱江世纪城双层挑高网红 LOFT，可切换三色赛博霓虹墙与电动纱帘，推门看大莲花",
    },
    {
      id: "heanju", tier: 5, icon: "🏢", name: "和安居小区", price: 1280, tierTag: "住宅", grade: "craft",
      rentable: true, rent7d: 78, rent30d: 260, series: "杭州城市住宅", tags: ["和安居", "阳台", "可出门", "黑胶"],
      slots: ["bed", "light", "floor", "garden"], weatherMode: "terrace", worldWidth: 760, hotTableStyle: "wood",
      indoorWindow: { x0: 233, x1: 373, y0: 25, y1: 145 }, terraceRailY: 114,
      outdoorNote: "🪑 露台藤椅吹晚风太舒服啦～",
      gift: { kind: "decor", id: "rattan_balcony_set" },
      desc: "760px 暖光大露台精装公寓，自带可播放音符的复古黑胶机与观星露台，解锁地面铺装",
    },
    {
      id: "xixi_beiyuan", tier: 5, icon: "🌳", name: "西溪北苑", price: 1790, tierTag: "住宅", grade: "craft",
      rentable: true, rent7d: 108, rent30d: 360, series: "杭州城市住宅", tags: ["西溪北苑", "湿地", "飘窗", "观鸟"],
      slots: ["bed", "light", "floor", "garden"], weatherMode: "terrace", worldWidth: 760, hotTableStyle: "wood",
      indoorWindow: { x0: 84, x1: 372, y0: 22, y1: 112 }, terraceRailY: 114,
      outdoorNote: "🦆 湿地木阳台外满眼西溪火柿、摇橹船和白鹭，空气真清新！",
      gift: { kind: "decor", id: "wood_floor" },
      desc: "760px 原木格栅大横厅配湿地木阳台与观鸟望远镜，点击可召唤成群白鹭掠过苇荡",
    },

    // ---- T6 杭州顶豪名邸（920px 三区奢华私家大世界 + 全5槽 + 顶豪专属互动！）----
    {
      id: "xixi", tier: 6, icon: "🏡", name: "西溪壹号别墅", price: 6800, tierTag: "顶豪", grade: "luxury",
      rentable: true, rent7d: 390, rent30d: 1360, series: "杭州顶豪名邸", tags: ["西溪", "920px三区", "可出门", "锦鲤"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "terrace", worldWidth: 920, hotTableStyle: "tea",
      indoorWindow: { x0: 23, x1: 385, y0: 24, y1: 147 }, terraceRailY: 132,
      outdoorNote: "🏮 西溪临水栈道直通私家水上茶亭与锦鲤莲池，太雅致啦～",
      gift: { kind: "decor", id: "koi_pond" },
      desc: "920px 三区大别墅！胡桃木落地大厅直通西溪水栈园林与私家水上茶亭，可投喂锦鲤听荷风",
    },
    {
      id: "wulin_yihao", tier: 6, icon: "🌆", name: "武林壹号天幕平层", price: 8160, tierTag: "顶豪", grade: "luxury",
      rentable: true, rent7d: 490, rent30d: 1630, series: "杭州顶豪名邸", tags: ["武林壹号", "920px三区", "无边泳池", "酒墙"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "terrace", worldWidth: 920, hotTableStyle: "marble",
      indoorWindow: { x0: 106, x1: 384, y0: 20, y1: 148 }, terraceRailY: 116,
      outdoorNote: "🥂 从云端围炉露台一路逛到高空无边泳池香槟吧，俯瞰杭城万家灯火！",
      gift: { kind: "decor", id: "marble_tile" },
      desc: "920px 三区黑金顶豪！发光红酒墙、270° 运河天幕、云端围炉露台与高空无边泳池香槟吧",
    },
    {
      id: "yunqi_rose", tier: 6, icon: "🌹", name: "云栖玫瑰园法式庄园", price: 9520, tierTag: "顶豪", grade: "luxury",
      rentable: true, rent7d: 570, rent30d: 1900, series: "杭州顶豪名邸", tags: ["云栖玫瑰园", "920px三区", "钢琴", "喷泉"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "terrace", worldWidth: 920, hotTableStyle: "marble",
      indoorWindow: { x0: 154, x1: 372, y0: 24, y1: 146, shape: "twin_arch" }, terraceRailY: null,
      outdoorNote: "🌹 漫步玫瑰花廊、听凡尔赛喷泉水声，再去花亭弹一曲白色三角钢琴！",
      gift: { kind: "decor", id: "versailles_rose_fountain" },
      desc: "920px 三区传世法式庄园！雕花壁炉大厅、凡尔赛玫瑰喷泉花园与可弹奏的白色三角钢琴亭",
    },
    {
      id: "jiangnanli", tier: 6, icon: "🏯", name: "江南里中式合院", price: 10880, tierTag: "顶豪", grade: "luxury",
      rentable: true, rent7d: 650, rent30d: 2180, series: "杭州顶豪名邸", tags: ["江南里", "920px三区", "古琴", "假山"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "terrace", worldWidth: 920, hotTableStyle: "tea",
      indoorWindow: { x0: 184, x1: 376, y0: 22, y1: 148 }, terraceRailY: null,
      outdoorNote: "🏯 踏过月洞门与石板桥，太湖石瀑布旁抚一曲古琴，江南画卷尽收眼底！",
      gift: { kind: "decor", id: "taihu_pine_bonsai" },
      desc: "920px 三区运河中式合院！红木中堂、月洞门曲水锦鲤庭院与太湖石瀑布古琴轩",
    },

    // ---- T7 世界奇观殿堂（1080px 三翼宏伟奇观宫殿 + 专属奇观级大互动！）----
    {
      id: "obsidian_fortress", tier: 7, icon: "🌋", name: "熔岩黑曜石堡", price: 15040, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 900, rent30d: 3000, series: "奇观殿堂", tags: ["1080px三翼", "火山喷发", "巨龙", "奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1080, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "obsidian_brazier_lamp" },
      desc: "1080px 三翼火山黑曜石巨堡！熔岩瀑布殿、龙焰符文锻炉与赤金火山祭坛，可触发熔岩喷发与火龙掠空",
    },
    {
      id: "atlantis", tier: 7, icon: "🏛️", name: "海底水晶神殿", price: 18800, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 1080, rent30d: 3680, series: "奇观殿堂", tags: ["1080px三翼", "海底巨鲸", "三叉戟", "奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1080, hotTableStyle: "marble",
      gift: { kind: "decor", id: "biolum_reef" },
      desc: "1080px 三翼亚特兰蒂斯神殿！吹响法螺召唤深海巨鲸与水母群舞，点亮海王三叉戟神光",
    },
    {
      id: "sky_castle", tier: 7, icon: "☁️", name: "天空之城浮岛宫", price: 22560, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 1350, rent30d: 4500, series: "奇观殿堂", tags: ["1080px三翼", "彩虹桥", "浮空飞艇", "奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1080, hotTableStyle: "celestial",
      gift: { kind: "decor", id: "cloud_feather_chandelier" },
      desc: "1080px 三翼万米云海浮岛皇城！点亮祭坛升起七彩天桥，召唤云端蒸汽飞艇巡航",
    },
    {
      id: "aurora_ice_palace", tier: 7, icon: "❄️", name: "极光冰晶宫殿", price: 26320, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 1580, rent30d: 5260, series: "奇观殿堂", tags: ["1080px三翼", "三色极光", "冰风铃", "奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1080, hotTableStyle: "marble",
      gift: { kind: "decor", id: "aurora_swan_pool" },
      desc: "1080px 三翼北极蓝冰大教堂！点击冰棱镜自由切换三色极光天幕，轻敲水晶冰风铃奏响天籁",
    },
    {
      id: "hanging_gardens", tier: 7, icon: "🏺", name: "空中花园黄金阁", price: 30080, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 1800, rent30d: 6000, series: "奇观殿堂", tags: ["1080px三翼", "百花盛放", "金蝶群", "奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1080, hotTableStyle: "celestial",
      gift: { kind: "decor", id: "hanging_gold_vines" },
      desc: "1080px 三翼巴比伦黄金悬园！开启生命水渠触发百花齐放，于金蝶亭放飞成群闪耀金蝶",
    },

    // ---- T8 星际宇航时代（1240px 史诗太空全景 + 随机流星/行星/星舰 + 低重力跳跃！）----
    {
      id: "lunar_base", tier: 8, icon: "🌕", name: "月球静海科研舱", price: 33600, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 2000, rent30d: 6720, series: "星际传世", tags: ["1240px星际", "流星雨", "地出", "低重力"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1240, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "holo_earth_globe" },
      desc: "1240px 巨幕月球科研基地！蔚蓝地球、土星、随机流星与星舰掠过苍穹，可开低重力失重高跳",
    },
    {
      id: "rocket", tier: 8, icon: "🚀", name: "太空火箭舱", price: 42000, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 2400, rent30d: 8200, series: "星际传世", tags: ["1240px星际", "曲率航行", "流星", "全息星图"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1240, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "cyber_pod" },
      desc: "1240px 旗舰级曲率星舰长廊！双环土星、木星风暴、许愿流星雨与可切换星球的立体全息台",
    },
    {
      id: "mars_dome", tier: 8, icon: "🛰️", name: "火星红岩生态穹顶", price: 50400, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 3020, rent30d: 10080, series: "星际传世", tags: ["1240px星际", "双卫星", "漫游车", "低重力"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1240, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "mars_redrock_floor" },
      desc: "1240px 水手峡谷全景红岩穹顶！观测火卫双星、召唤火星流星与发射无人机，支持低重力漫步",
    },
    {
      id: "saturn_ring_station", tier: 8, icon: "🪐", name: "土星冰环观景站", price: 58800, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 3520, rent30d: 11760, series: "星际传世", tags: ["1240px星际", "冰环奇观", "流星雨", "低重力"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1240, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "saturn_stardust_pool" },
      desc: "1240px 紧贴土星卡西尼冰环的白金轨道画廊！碎冰星尘、彗星流星擦窗划过，自带失重实验舱",
    },
    {
      id: "dyson_sphere", tier: 8, icon: "☀️", name: "戴森球恒星殿", price: 67200, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 4030, rent30d: 13440, series: "星际传世", tags: ["1240px星际", "恒星巨构", "星际奇观"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1240, hotTableStyle: "celestial",
      gift: { kind: "decor", id: "stellar_ring_throne" },
      desc: "1240px 24K金蜂巢恒星巨构神殿！环绕燃烧恒星与旋转聚能星环，可超频恒星脉冲与低重力飞行",
    },

    // ---- T9 次元神域（1400px 四区次元神殿 + 兔兔隐身/发光/传送门/巨化缩小/量子分身机关！）----
    {
      id: "quantum_mirror", tier: 9, icon: "🔮", name: "量子镜像浮殿", price: 78400, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 4700, rent30d: 15680, series: "次元神域", tags: ["1400px四区", "隐身/发光", "传送门", "量子分身"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1400, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "quantum_prism_array" },
      desc: "1400px 四区量子折跃神殿！内置隐身棱镜、圣光水晶、跨殿传送门、巨化/迷你射线与幻彩分身机关",
    },
    {
      id: "wormhole", tier: 9, icon: "🌌", name: "次元虫洞方舟", price: 98000, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 5600, rent30d: 18800, series: "次元神域", tags: ["1400px四区", "黑洞虫洞", "传送门", "变形机关"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1400, hotTableStyle: "cyber",
      gift: { kind: "decor", id: "quantum_throne" },
      desc: "1400px 四区黑金吸积盘方舟！兔兔可穿行左右次元传送门瞬移千里，自由触发隐身、发光与巨化",
    },
    {
      id: "time_clocktower", tier: 9, icon: "⏳", name: "时光裂隙钟楼", price: 117600, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 7050, rent30d: 23520, series: "次元神域", tags: ["1400px四区", "时空齿轮", "隐身/发光", "传送门"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1400, hotTableStyle: "celestial",
      gift: { kind: "decor", id: "hourglass_star_pool" },
      desc: "1400px 四区悬空黄金齿轮圣殿！内置时空流速轮、隐身棱镜、圣光台、变形射线与双界星门",
    },
    {
      id: "galactic_core", tier: 9, icon: "🌠", name: "银河核心星云阁", price: 137200, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 8230, rent30d: 27440, series: "次元神域", tags: ["1400px四区", "银心星云", "量子分身", "传送门"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1400, hotTableStyle: "celestial",
      gift: { kind: "decor", id: "starlight_floor" },
      desc: "1400px 四区翡翠银心流光殿！横跨亿万星团悬桥，集齐隐身、圣光、巨化缩小、分身与瞬移机关",
    },
    {
      id: "singularity_court", tier: 9, icon: "🌀", name: "奇点视界王庭", price: 156800, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 9400, rent30d: 31360, series: "次元神域", tags: ["1400px四区", "卡冈图雅", "全套机关", "传送门"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "none", worldWidth: 1400, hotTableStyle: "celestial",
      gift: { kind: "wear", id: "horizon_halo_cape" },
      desc: "1400px 四区终极卡冈图雅黑金行宫！双层引力透镜环绕，可让兔兔隐身、发光、巨化、分身与虫洞瞬移",
    },

    // ---- T10 隐藏终极（1640px 造物主宇宙皇宫：自由切换时间 + 天气 + 极光流星 + 全神权机关 + 星河金龙！）----
    {
      id: "secret_palace", tier: 10, icon: "🏰", name: "太初星穹御苑", price: 220000, tierTag: "隐藏款", grade: "secret", secret: true,
      rentable: true, rent7d: 12000, rent30d: 39800, series: "太初隐藏", tags: ["1640px皇宫", "掌控时间", "敕令天气", "星河神龙"],
      slots: ["bed", "light", "floor", "garden", "pool"], weatherMode: "creator", worldWidth: 1640, hotTableStyle: "celestial",
      gift: { kind: "wear", id: "taichu_carrot_halo" },
      desc: "1640px 四大主题区终极宇宙皇宫！拥有造物主天权神坛：随心一键切换晨昼暮夜与晴雨雪极光流星，畅玩全套兔兔神权、编钟奏乐与召唤星河金龙！",
      unlockReq: { needHouse: "wormhole", orTier: 8, label: "拥有「次元虫洞方舟」或达到 Lv.8 星渊霸王兔" },
    },
  ];

  // ---- Decor Catalog (~100 items, strictly ordered by tier & 0.8~1.6 ladder) ----
  const DECORS = [
    // ========== 1. bed (家具/主位) ==========
    { id: "straw_mat",             slot: "bed", icon: "🌾", name: "干草暖软垫",       price: 30,    grade: "basic",  series: "质朴软装", tags: ["干草", "新手"], desc: "晒过太阳的软蓬蓬编织干草窝，兔兔打滚很香" },
    { id: "woven_pouf",            slot: "bed", icon: "🧺", name: "编织草垫坐墩",     price: 60,    grade: "basic",  series: "质朴软装", tags: ["蒲团", "编织"], desc: "手工蒲草密编圆墩，盘腿冥想或小憩都很舒服" },
    { id: "cardboard_sofa",        slot: "bed", icon: "📦", name: "纸箱手搓沙发",     price: 75,    grade: "basic",  series: "质朴软装", tags: ["纸箱", "沙发"], desc: "双层瓦楞纸手搓沙发配条纹软垫与萝卜抱枕" },
    { id: "canvas_lounger",        slot: "bed", icon: "🪑", name: "折叠帆布躺椅",     price: 90,    grade: "basic",  series: "质朴软装", tags: ["露营", "躺椅"], desc: "榉木支架米白厚帆布露营躺椅，阳光下秒睡" },
    { id: "beanbag_chair",         slot: "bed", icon: "🫧", name: "宜家风懒人豆袋",   price: 105,   grade: "basic",  series: "质朴软装", tags: ["豆袋", "软绵"], desc: "陷进去就起不来的焦糖橘颗粒绒懒人豆袋沙发" },
    { id: "vintage_iron_bed",      slot: "bed", icon: "🛏️", name: "复古铁艺单人床",   price: 120,   grade: "basic",  series: "质朴软装", tags: ["单人床", "铁艺"], desc: "奶油雕花铁艺床架配格纹棉被与软枕头" },

    { id: "rattan_balcony_set",    slot: "bed", icon: "🪑", name: "阳台小藤椅茶几",   price: 210,   grade: "craft",  series: "城市精装", tags: ["藤椅", "茶几", "阳台"], desc: "手工编藤靠背椅配玻璃小圆几与两盏热茶" },
    { id: "bamboo_tea_table",      slot: "bed", icon: "🍵", name: "竹影清茶案",       price: 240,   grade: "craft",  series: "山野雅居", tags: ["竹案", "清茶", "禅意"], desc: "老青竹矮茶案配粗陶茶壶与青蒲垫，煮茶听雨" },
    { id: "muji_desk",             slot: "bed", icon: "💻", name: "原木码农升降桌",   price: 260,   grade: "craft",  series: "极客办公", tags: ["码农", "双屏", "原木"], desc: "胡桃实木桌配双屏算力监控、机械键盘与热咖啡" },
    { id: "tatami_table",          slot: "bed", icon: "🍵", name: "日式榻榻米矮几",   price: 310,   grade: "craft",  series: "城市精装", tags: ["榻榻米", "暖桌"], desc: "蔺草编织榻榻米配暖炉矮几与橘子果盘" },
    { id: "walnut_tea_table",      slot: "bed", icon: "🫖", name: "新中式胡桃木茶台", price: 365,   grade: "craft",  series: "杭州雅居", tags: ["胡桃木", "茶台", "新中式"], desc: "黑胡桃大板功夫茶台，紫砂壶青烟袅袅" },
    { id: "french_velvet_chaise",  slot: "bed", icon: "🛋️", name: "法式中古丝绒躺椅", price: 415,   grade: "craft",  series: "城市精装", tags: ["中古", "丝绒", "贵妃榻"], desc: "孔雀绿丝绒拉扣贵妃榻，优雅弧线配胡桃木腿" },

    { id: "italian_leather_sofa",  slot: "bed", icon: "🛋️", name: "意式真皮转角沙发", price: 700,   grade: "luxury", series: "顶豪轻奢", tags: ["意式", "真皮", "转角"], desc: "焦糖鞍革意式极简转角大沙发，低饱和高级感" },
    { id: "velvet_sofa",           slot: "bed", icon: "🛋️", name: "西溪云朵大沙发",   price: 880,   grade: "luxury", series: "西溪轻奢", tags: ["沙发", "奶油", "轻奢"], desc: "意式奶油羊羔绒云朵沙发，黄铜细脚配羊绒搭毯" },
    { id: "marble_coffee_bar",     slot: "bed", icon: "☕", name: "大理石岛台咖啡吧", price: 1060,  grade: "luxury", series: "顶豪轻奢", tags: ["岛台", "咖啡机", "大理石"], desc: "雪花白大理石中岛配意式拉杆咖啡机与高脚吧凳" },
    { id: "massage_space_chair",   slot: "bed", icon: "💺", name: "全自动按摩太空椅", price: 1230,  grade: "luxury", series: "顶豪轻奢", tags: ["按摩椅", "放松", "顶豪"], desc: "香槟金零压头等舱按摩椅，写完代码全身舒缓" },
    { id: "fireplace_bookcase",    slot: "bed", icon: "🔥", name: "整面落地藏书壁炉柜", price: 1410, grade: "luxury", series: "顶豪轻奢", tags: ["壁炉", "书柜", "法式"], desc: "挑高胡桃木整墙藏书阁嵌入跃动电子真火壁炉" },

    { id: "holo_sleep_pod",        slot: "bed", icon: "🫧", name: "全息休眠玻璃舱",   price: 3840,  grade: "mythic", series: "未来星际", tags: ["休眠舱", "全息", "星际"], desc: "星舰级弧形玻璃恒温生态休眠舱，浮现柔和脉冲心率波" },
    { id: "cyber_pod",             slot: "bed", icon: "🛸", name: "零重力电竞舱",     price: 4800,  grade: "mythic", series: "未来星际", tags: ["电竞", "悬浮", "赛博"], desc: "黑曜石反重力悬浮座舱，三联全息曲面屏+脉冲悬停环" },
    { id: "stellar_ring_throne",   slot: "bed", icon: "☀️", name: "恒星能量环王座",   price: 7840,  grade: "mythic", series: "星渊传世", tags: ["戴森球", "恒星", "王座"], desc: "白金弧形王座背悬微型燃烧恒星与三层聚能金环" },
    { id: "quantum_throne",        slot: "bed", icon: "👑", name: "奇点星环王座",     price: 9800,  grade: "mythic", series: "星渊传世", tags: ["王座", "黑洞", "黄金"], desc: "24K金浮雕黑曜丝绒王座，背悬实时旋转黑洞吸积盘与双星轨仪" },
    {
      id: "secret_carrot_throne", slot: "bed", icon: "🥕", name: "黄金萝卜浮空圣座", price: 28800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "王座", "萝卜"],
      desc: "象牙白金新月华盖圣座，悬顶多面琥珀水晶萝卜棱镜与极光纱幔",
      unlockReq: { needDecor: "quantum_throne", orTier: 7, label: "拥有「奇点星环王座」或达到 Lv.7 狱火魔神兔" },
    },

    // ========== 2. light (灯饰/墙面) ==========
    { id: "firefly_stone_lamp",    slot: "light", icon: "🪨", name: "萤火石小夜灯",     price: 28,    grade: "basic",  series: "质朴软装", tags: ["萤火", "夜灯"], desc: "溪畔萤光石与玻璃瓶挂成的森系小夜灯，微光点点" },
    { id: "fairy_bulb",            slot: "light", icon: "💡", name: "暖黄钨丝小灯泡",   price: 35,    grade: "basic",  series: "质朴软装", tags: ["暖光", "复古"], desc: "黄铜灯头复古爱迪生钨丝泡，把小屋照得暖融融" },
    { id: "paper_lantern_small",   slot: "light", icon: "🏮", name: "旧纸糊小灯笼",     price: 42,    grade: "basic",  series: "质朴软装", tags: ["纸灯笼", "暖光"], desc: "米白宣纸竹骨小灯笼，透出温柔暖橘微光" },
    { id: "camping_lantern",       slot: "light", icon: "🪔", name: "复古露营马灯",     price: 50,    grade: "basic",  series: "质朴软装", tags: ["马灯", "露营"], desc: "复古墨绿搪瓷煤油风露营灯，灯芯暖火摇曳" },
    { id: "industrial_cage_lamp",  slot: "light", icon: "🔦", name: "工业风铁网吊灯",   price: 56,    grade: "basic",  series: "质朴软装", tags: ["工业风", "铁网"], desc: "黑铁丝防爆网罩工地吊灯，粗犷又硬核" },

    { id: "sunset_floor_lamp",     slot: "light", icon: "🌇", name: "落地霓虹日落灯",   price: 130,   grade: "craft",  series: "网红氛围", tags: ["日落灯", "霓虹", "丽晶"], desc: "投射巨幅橘粉日落光晕的网红氛围光束，随手出片" },
    { id: "carrot_neon",           slot: "light", icon: "🥕", name: "霓虹胡萝卜灯牌",   price: 160,   grade: "craft",  series: "极客办公", tags: ["霓虹", "胡萝卜"], desc: "熏黑亚克力双层玻璃霓虹灯管，深夜氛围感拉满" },
    { id: "pinecone_sconce",       slot: "light", icon: "🌲", name: "暖炉松果壁灯",     price: 190,   grade: "craft",  series: "山野雅居", tags: ["松果", "壁灯", "莫干山"], desc: "红雪松雕花松果形琥珀玻璃吊灯，林间暖炉气息" },
    { id: "bauhaus_mushroom_lamp", slot: "light", icon: "🍄", name: "包豪斯蘑菇台灯",   price: 225,   grade: "craft",  series: "设计家居", tags: ["包豪斯", "中古", "蘑菇灯"], desc: "奶白蛋挞玻璃蘑菇灯罩配镀铬杆，中古设计经典" },
    { id: "windmill_copper_lamp",  slot: "light", icon: "🔔", name: "复古铜铃风车灯",   price: 250,   grade: "craft",  series: "山野雅居", tags: ["风车", "铜铃", "复古"], desc: "古铜小风车转轮吊灯配星芒灯罩，轻盈旋转" },
    { id: "star_projector",        slot: "light", icon: "🌌", name: "卧室星空投影仪",   price: 280,   grade: "craft",  series: "浪漫家居", tags: ["星空", "投影"], desc: "天幕投射浪漫星云流雾、黄金星宿连线与闪烁繁星" },

    { id: "french_iron_lamp",      slot: "light", icon: "🕯️", name: "法式雕花铁艺灯",   price: 940,   grade: "luxury", series: "顶豪轻奢", tags: ["法式", "铁艺", "烛台"], desc: "黑金锻铁卷草枝形烛台吊灯，复古南法庄园格调" },
    { id: "crystal_chandelier",    slot: "light", icon: "✨", name: "轻奢水晶大吊灯",   price: 1180,  grade: "luxury", series: "西溪轻奢", tags: ["水晶", "吊灯", "法式"], desc: "法式双层鎏金枝形水晶灯，切割琉璃垂坠折射暖芒" },
    { id: "molecular_glass_lamp",  slot: "light", icon: "🫧", name: "意式分子玻璃吊灯", price: 1420,  grade: "luxury", series: "顶豪轻奢", tags: ["意式", "分子灯", "大平层"], desc: "黄铜几何骨架错落悬浮烟熏琥珀玻璃球，现代艺术感" },
    { id: "gilded_palace_lantern", slot: "light", icon: "🏮", name: "新中式铜鎏金宫灯", price: 1650,  grade: "luxury", series: "江南名邸", tags: ["中式", "宫灯", "鎏金"], desc: "八角红木鎏金镂空雕花宫灯，玉石灯片温润如月" },
    { id: "cloud_feather_chandelier", slot: "light", icon: "🪶", name: "云海白羽吊灯",  price: 1890,  grade: "luxury", series: "奇观殿堂", tags: ["白羽", "天空之城", "梦幻"], desc: "轻盈发光白羽环绕而成的悬浮云环吊灯，飘落圣羽星尘" },

    { id: "obsidian_brazier_lamp", slot: "light", icon: "🔥", name: "黑曜熔金火盆灯",   price: 3360,  grade: "mythic", series: "奇观殿堂", tags: ["熔岩", "火盆", "黑曜石"], desc: "铁链悬吊的黑曜石巨型符文火盆，炽金焰浪翻涌" },
    { id: "aurora_holo",           slot: "light", icon: "🌈", name: "全息极光天幕",     price: 4200,  grade: "mythic", series: "未来星际", tags: ["极光", "全息"], desc: "双角全息棱镜投射流动翡青紫金极光丝幕与垂落光帘" },
    { id: "holo_earth_globe",      slot: "light", icon: "🌍", name: "全息悬浮地球仪",   price: 5040,  grade: "mythic", series: "未来星际", tags: ["地球", "全息", "月球"], desc: "自转蔚蓝全息地球与卫星轨道光环悬于穹顶中央" },
    { id: "quantum_prism_array",   slot: "light", icon: "🔮", name: "多维折光水晶阵",   price: 5880,  grade: "mythic", series: "次元神域", tags: ["量子", "水晶", "折光"], desc: "五枚浮空几何折光棱镜实时交织多维全息光网" },
    {
      id: "secret_astrolabe_dome", slot: "light", icon: "🌟", name: "太初黄金星仪穹顶", price: 14800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "星仪", "黄金"],
      desc: "双层反向自转24K金浑天星仪，中央悬浮曜石日光棱镜与圣光束",
      unlockReq: { needDecor: "aurora_holo", orTier: 6, label: "拥有「全息极光天幕」或达到 Lv.6 红魔兔" },
    },
    // Festival limited lights
    {
      id: "evt_1024_matrix", slot: "light", icon: "💻", name: "1024 二进制极客霓虹幕", price: 320, grade: "event", eventId: "prog1024",
      series: "1024限定", tags: ["1024", "极客", "代码", "限定"],
      desc: "1024程序员节限时限定：翡翠绿荧光代码矩阵灯幕，闪烁 0101 与 1024 脉冲光带",
    },
    {
      id: "evt_cny_lantern", slot: "light", icon: "🏮", name: "大红双福喜庆灯笼", price: 360, grade: "event", eventId: "springfest",
      series: "春节限定", tags: ["春节", "灯笼", "年味", "限定"],
      desc: "新春贺岁限时限定：鎏金流苏大红宫灯成双垂挂，暖红光晕把小家映得红红火火",
    },

    // ========== 3. floor (地面/地毯) ==========
    { id: "van_plaid_mat",         slot: "floor", icon: "🧺", name: "格纹车载小毯",     price: 76,    grade: "basic",  series: "质朴软装", tags: ["野餐毯", "复古"], desc: "薄荷与奶油格纹棉麻露营毯，房车与野餐必备" },
    { id: "plaid_rug",             slot: "floor", icon: "🧶", name: "暖格编织地毯",     price: 95,    grade: "basic",  series: "质朴软装", tags: ["地毯", "复古"], desc: "苏格兰朱红暖格手工羊毛毯，带金线锁边与流苏" },
    { id: "hemp_round_rug",        slot: "floor", icon: "⭕", name: "麻绳手编圆毯",     price: 115,   grade: "basic",  series: "质朴软装", tags: ["麻绳", "森系"], desc: "同心圆手工黄麻编织圆毯，自然质朴原木百搭" },
    { id: "pebble_mat",            slot: "floor", icon: "🪨", name: "鹅卵石防滑垫",     price: 135,   grade: "basic",  series: "质朴软装", tags: ["鹅卵石", "庭院"], desc: "温润雨花鹅卵石拼接步道垫，脚感舒压又有趣" },
    { id: "retro_pattern_tile",    slot: "floor", icon: "💠", name: "复古花砖拼接地",   price: 152,   grade: "basic",  series: "复古家居", tags: ["花砖", "南洋", "复古"], desc: "墨绿奶油几何手工水泥花砖，南洋咖啡馆同款" },

    { id: "cream_microcement",     slot: "floor", icon: "⬜", name: "奶白微水泥地坪",   price: 290,   grade: "craft",  series: "城市精装", tags: ["微水泥", "极简", "侘寂"], desc: "一体无缝柔光奶白微水泥，高级侘寂极简底色" },
    { id: "wood_floor",            slot: "floor", icon: "🪵", name: "人字拼实木地板",   price: 360,   grade: "craft",  series: "城市精装", tags: ["木地板", "人字拼"], desc: "温润胡桃木透视人字拼地板，窗影微光折射木纹" },
    { id: "chevron_oak_floor",     slot: "floor", icon: "🍂", name: "法式鱼骨纹橡木地", price: 430,   grade: "craft",  series: "城市精装", tags: ["鱼骨拼", "法式", "橡木"], desc: "烟熏浅橡木对称鱼骨拼地板，法式浪漫质感拉满" },
    { id: "terrazzo_floor",        slot: "floor", icon: "🎨", name: "水磨石彩点地板",   price: 505,   grade: "craft",  series: "设计家居", tags: ["水磨石", "艺术"], desc: "奶咖基底点缀琥珀蓝绿天然石子，清新艺术画廊感" },
    { id: "suzhou_brick_floor",    slot: "floor", icon: "🏯", name: "苏式青砖海棠纹地", price: 575,   grade: "craft",  series: "江南雅居", tags: ["青砖", "海棠纹", "中式"], desc: "古法御窑金砖配铜嵌海棠花窗纹，江南风雅" },

    { id: "persian_silk_rug",      slot: "floor", icon: "🪡", name: "波斯手工真丝地毯", price: 1100,  grade: "luxury", series: "顶豪轻奢", tags: ["波斯毯", "真丝", "藏品"], desc: "绯红藏蓝真丝手织繁复藤蔓纹古董地毯，流苏金线" },
    { id: "marble_tile",           slot: "floor", icon: "🏛️", name: "鱼肚白大理石砖",   price: 1380,  grade: "luxury", series: "西溪轻奢", tags: ["大理石", "金脉"], desc: "抛光卡拉卡塔白石配24K金脉与黄铜嵌条，镜面光泽" },
    { id: "blackgold_marble",      slot: "floor", icon: "🖤", name: "黑金花奢石拼花地", price: 1660,  grade: "luxury", series: "顶豪轻奢", tags: ["黑金花", "奢石", "大平层"], desc: "意大利黑金花天然奢石配菱格金线拼花，气场全开" },
    { id: "sky_glass_walkway",     slot: "floor", icon: "☁️", name: "全景玻璃栈道地板", price: 1930,  grade: "luxury", series: "顶豪轻奢", tags: ["玻璃栈道", "云海", "高空"], desc: "高透钢化夹胶云端栈道，脚下云雾缓缓流淌" },
    { id: "jade_gold_floor",       slot: "floor", icon: "💚", name: "翡翠玉石镶金地面", price: 2210,  grade: "luxury", series: "江南名邸", tags: ["翡翠", "玉石", "镶金"], desc: "帝王绿冰种透光玉石拼板镶24K云雷金线，温润流光" },

    { id: "mars_redrock_floor",    slot: "floor", icon: "🪐", name: "火星赤岩玻璃地",   price: 4480,  grade: "mythic", series: "未来星际", tags: ["火星", "赤岩", "生态舱"], desc: "高强度舱底观察玻璃封存火星赤砂与能量导轨" },
    { id: "starlight_floor",       slot: "floor", icon: "🌠", name: "银河星轨光感地",   price: 5600,  grade: "mythic", series: "未来星际", tags: ["星轨", "银河", "光感"], desc: "深空蓝晶玻璃地面，内嵌流动银河星云、双金轨与步步生辉光涟漪" },
    { id: "antigrav_tile_matrix",  slot: "floor", icon: "⚡", name: "反重力浮砖矩阵地", price: 6720,  grade: "mythic", series: "次元神域", tags: ["反重力", "矩阵", "量子"], desc: "错落呼吸悬浮的六边形黑曜量子磁力砖，霓虹流光脉动" },
    {
      id: "secret_prism_mirror", slot: "floor", icon: "💎", name: "镜花水月星镜地", price: 16800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "镜面", "极光"],
      desc: "天空之镜琉璃金缮地面，流动彩虹极光倒影、光涟漪与星花浮瓣",
      unlockReq: { needDecor: "starlight_floor", orTier: 7, label: "拥有「银河星轨光感地」或达到 Lv.7 狱火魔神兔" },
    },
    // Festival limited floor
    {
      id: "evt_bf_goldrug", slot: "floor", icon: "🖤", name: "黑金狂欢菱格丝绒毯", price: 420, grade: "event", eventId: "blackfriday",
      series: "黑五限定", tags: ["黑五", "黑金", "地毯", "限定"],
      desc: "黑色星期五限时限定：曜黑丝绒织锦配24K烫金菱格几何纹与流苏金边",
    },

    // ========== 4. garden (绿植/花园) ==========
    { id: "carrot_sprout",         slot: "garden", icon: "🌱", name: "窗台小萝卜苗",     price: 36,    grade: "basic",  series: "质朴软装", tags: ["萝卜苗", "新手"], desc: "小泥碗里刚刚破土的两片翠绿萝卜芽，萌化人心" },
    { id: "mini_carrot_pot",       slot: "garden", icon: "🥕", name: "窗台胡萝卜盆栽",   price: 45,    grade: "basic",  series: "质朴软装", tags: ["盆栽", "胡萝卜"], desc: "红陶釉盆里冒头的饱满小胡萝卜，青翠羽叶生机满满" },
    { id: "ceramic_succulent_trio", slot: "garden", icon: "🌵", name: "陶瓷多肉三件套",  price: 54,    grade: "basic",  series: "质朴软装", tags: ["多肉", "陶瓷"], desc: "奶白釉小盆里的玉露、熊童子与桃蛋，胖乎乎超治愈" },
    { id: "hydro_coin_plant",      slot: "garden", icon: "🍀", name: "水培铜钱草小瓶",   price: 63,    grade: "basic",  series: "质朴软装", tags: ["铜钱草", "水培"], desc: "清透玻璃圆瓶水培满瓶圆润铜钱草，寓意财源滚滚" },
    { id: "hanging_pothos_basket", slot: "garden", icon: "🌿", name: "悬挂绿萝藤篮",     price: 72,    grade: "basic",  series: "质朴软装", tags: ["绿萝", "藤篮"], desc: "编藤吊篮垂下层叠翡翠绿萝瀑布，空气清新剂" },

    { id: "celadon_pothos_rack",   slot: "garden", icon: "🏺", name: "青瓷水培绿萝架",   price: 145,   grade: "craft",  series: "杭州雅居", tags: ["龙泉青瓷", "双云里"], desc: "龙泉粉青瓷瓶立于原木花几，枝叶清雅如画" },
    { id: "balcony_monstera",      slot: "garden", icon: "🪴", name: "阳台龟背竹绿角",   price: 180,   grade: "craft",  series: "城市精装", tags: ["龟背竹", "绿植"], desc: "竖纹白瓷高脚盆栽，开背龟背竹与垂藤绿意盎然" },
    { id: "fiddle_leaf_fig",       slot: "garden", icon: "🌳", name: "琴叶榕落地大盆",   price: 215,   grade: "craft",  series: "城市精装", tags: ["琴叶榕", "北欧"], desc: "挺拔大叶网红琴叶榕配编织海草篮，客厅颜值担当" },
    { id: "glass_succulent_wall",  slot: "garden", icon: "🌻", name: "玻璃花架多肉墙",   price: 250,   grade: "craft",  series: "山野雅居", tags: ["花架", "花房", "多肉"], desc: "三层金框玻璃阶梯花架，错落满摆彩虹多肉与向日葵" },
    { id: "bird_of_paradise",      slot: "garden", icon: "🦜", name: "南洋风天堂鸟绿景", price: 290,   grade: "craft",  series: "度假家居", tags: ["天堂鸟", "热带"], desc: "硕大芭蕉叶与橙蓝鹤望兰绽放，瞬间置身海岛度假" },

    { id: "jiangnan_bamboo_rockery", slot: "garden", icon: "🎋", name: "江南翠竹假山景", price: 780,   grade: "luxury", series: "江南园林", tags: ["翠竹", "假山", "禅意"], desc: "青石叠山配潇湘翠竹与白砂枯山水，文人雅趣" },
    { id: "sakura_garden",         slot: "garden", icon: "🌸", name: "樱花庭院小花园",   price: 980,   grade: "luxury", series: "西溪轻奢", tags: ["樱花", "庭院", "飘瓣"], desc: "苍劲古樱盆景配青苔石灯笼，粉白花瓣实时随风飘落" },
    { id: "monet_hydrangea_arch",  slot: "garden", icon: "💐", name: "莫奈绣球花拱门",   price: 1180,  grade: "luxury", series: "顶豪轻奢", tags: ["绣球", "莫奈", "花拱"], desc: "蓝紫粉白无尽夏绣球簇拥的法式铁艺花拱，落英缤纷" },
    { id: "taihu_pine_bonsai",     slot: "garden", icon: "🌲", name: "苏式太湖石迎客松", price: 1370,  grade: "luxury", series: "江南名邸", tags: ["太湖石", "迎客松", "江南里"], desc: "瘦皱漏透太湖奇石托起苍翠盘虬迎客松，大家气象" },
    { id: "ancient_podocarpus",    slot: "garden", icon: "🏯", name: "百年罗汉松古盆景", price: 1570,  grade: "luxury", series: "江南名邸", tags: ["罗汉松", "古树", "镇宅"], desc: "价值连城的造型百年雀舌罗汉松，云片层叠镇宅纳福" },

    { id: "hanging_gold_vines",    slot: "garden", icon: "🌿", name: "悬空黄金藤蔓廊",   price: 2880,  grade: "mythic", series: "奇观殿堂", tags: ["空中花园", "黄金藤"], desc: "白金浮柱垂落发光翠金藤蔓与露珠光球，仙气缭绕" },
    { id: "biolum_reef",           slot: "garden", icon: "🪸", name: "发光星花珊瑚园",   price: 3600,  grade: "mythic", series: "奇观殿堂", tags: ["珊瑚", "荧光"], desc: "紫晶与海玻璃荧光珊瑚簇，绽放发光星莲与漂浮萤火孢子" },
    { id: "zerog_crystal_biosphere", slot: "garden", icon: "🔮", name: "零重力水晶生态球", price: 4320, grade: "mythic", series: "未来星际", tags: ["生态球", "零重力", "星际"], desc: "悬浮自转的透明生态微缩星球，内含微缩星林与漂浮雨露" },
    {
      id: "secret_golden_carrot_tree", slot: "garden", icon: "🌳", name: "琉璃黄金萝卜神树", price: 12800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "神树", "萝卜"],
      desc: "象牙鎏金盘根神树，翠金琉璃叶间垂挂发光琥珀水晶萝卜灯",
      unlockReq: { needDecor: "biolum_reef", orTier: 6, label: "拥有「发光星花珊瑚园」或达到 Lv.6 红魔兔" },
    },
    // Festival limited garden
    {
      id: "evt_xmas_tree", slot: "garden", icon: "🎄", name: "星光礼物圣诞树", price: 380, grade: "event", eventId: "christmas",
      series: "圣诞限定", tags: ["圣诞", "圣诞树", "礼物", "限定"],
      desc: "圣诞奇遇季限时限定：挂满霓虹彩灯球与鎏金顶星的常青圣诞树，树下堆满红绿礼盒",
    },

    // ========== 5. pool (泳池/水景) ==========
    { id: "stone_water_bowl",      slot: "pool", icon: "🪨", name: "石头流水小钵池",   price: 415,   grade: "craft",  series: "江南园林", tags: ["石钵", "流水"], desc: "青石凿出的禅意莲花小水钵，清泉潺潺涟漪轻漾" },
    { id: "koi_pond",              slot: "pool", icon: "🎏", name: "锦鲤荷花景观池",   price: 520,   grade: "craft",  series: "江南园林", tags: ["锦鲤", "荷花"], desc: "鹅卵石禅意荷塘，清波荷花间红白锦鲤与金鲤悠游" },
    { id: "bamboo_drip_basin",     slot: "pool", icon: "🎋", name: "青砖竹筒滴水景",   price: 625,   grade: "craft",  series: "江南园林", tags: ["竹筒", "惊鹿", "青砖"], desc: "青砖围砌的小水景配青竹引泉，清脆水声解乏" },
    { id: "jiangnan_brook_pool",   slot: "pool", icon: "🌊", name: "江南叠水小溪潭",   price: 730,   grade: "craft",  series: "江南园林", tags: ["叠水", "溪潭"], desc: "双层太湖石阶叠水小潭，清溪绕石落珠如玉" },

    { id: "sunroom_jacuzzi",       slot: "pool", icon: "🛁", name: "玻璃阳光按摩浴缸", price: 1760,  grade: "luxury", series: "顶豪轻奢", tags: ["浴缸", "泡泡", "SPA"], desc: "恒温气泡水疗按摩池，满池绵密泡泡与玫瑰花瓣" },
    { id: "infinity_pool",         slot: "pool", icon: "🏊", name: "恒温湛蓝无边泳池", price: 2200,  grade: "luxury", series: "西溪轻奢", tags: ["泳池", "小黄鸭"], desc: "莱姆石边无边恒温池，水波焦散光纹+水下灯带+漂浮小黄鸭" },
    { id: "versailles_rose_fountain", slot: "pool", icon: "🌹", name: "凡尔赛玫瑰喷泉", price: 2640, grade: "luxury", series: "顶豪轻奢", tags: ["喷泉", "法式", "玫瑰园"], desc: "三层白大理石雕花法式喷泉，水柱跃动玫瑰花瓣飘浮" },
    { id: "sky_cantilever_pool",   slot: "pool", icon: "🏙️", name: "高空透明悬挑泳池", price: 3080, grade: "luxury", series: "顶豪轻奢", tags: ["透明泳池", "悬挑", "武林"], desc: "全透明亚克力边云端悬挑无边泳池，波光倒映霓虹" },

    { id: "hot_spring",            slot: "pool", icon: "♨️", name: "星空温泉泡泡汤池", price: 3800,  grade: "mythic", series: "京都汤泉", tags: ["温泉", "柚子"], desc: "京都风玄武岩露天汤池，竹筒惊鹿注水、漂浮柚子与袅袅热气" },
    { id: "aurora_swan_pool",      slot: "pool", icon: "🦢", name: "极光冰雕天鹅池",   price: 4560,  grade: "mythic", series: "奇观殿堂", tags: ["冰雕", "天鹅", "极光"], desc: "晶莹冰雕双天鹅拱卫的翡翠极光冰泉，寒雾闪烁星芒" },
    { id: "saturn_stardust_pool",  slot: "pool", icon: "🪐", name: "冰环星尘水幕池",   price: 6240,  grade: "mythic", series: "未来星际", tags: ["土星", "星尘", "水幕"], desc: "环形悬浮冰晶水幕池，流转淡紫土星光环与液态星尘" },
    { id: "portal_fountain",       slot: "pool", icon: "🌀", name: "悬浮时空光瀑喷泉", price: 7800,  grade: "mythic", series: "星渊传世", tags: ["时空", "喷泉"], desc: "黑金符文八角池配双浮空玉环，反重力螺旋光水倒流星核" },
    { id: "hourglass_star_pool",   slot: "pool", icon: "⏳", name: "逆流沙漏星池",     price: 9360,  grade: "mythic", series: "次元神域", tags: ["沙漏", "逆流", "时光"], desc: "24K金浮空时光沙漏矗立星池中央，金色时砂向上逆流" },
    {
      id: "secret_starlight_cascade", slot: "pool", icon: "🌌", name: "银河琉璃浮空天池", price: 21800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "天池", "银河"],
      desc: "云雾托举的月牙白金浮空星池，黄金月门倾泻星瀑与光影金鲤",
      unlockReq: { needDecor: "portal_fountain", orTier: 8, label: "拥有「悬浮时空光瀑喷泉」或达到 Lv.8 星渊霸王兔" },
    },
    // ========== Gacha-Exclusive Decors (扭蛋机限定家居装潢) ==========
    { id: "gacha_carrot_cushion", slot: "bed",    icon: "🧸", name: "软萌胡萝卜抱枕窝",   price: 60,   grade: "craft",  gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "抱枕"], desc: "扭蛋限定：蓬松橘白胡萝卜云朵大抱枕窝，软乎乎一躺就不想起来" },
    { id: "gacha_lucky_flower",   slot: "garden", icon: "🌼", name: "幸运星花盆栽",       price: 80,   grade: "craft",  gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "盆栽"], desc: "扭蛋限定：彩陶扭蛋壳种出的发光四叶幸运星花，微风摇曳散落星粉" },
    { id: "gacha_mini_machine",   slot: "bed",    icon: "🎰", name: "迷你复古扭蛋机摆件", price: 240,  grade: "luxury", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "摆件"], desc: "扭蛋限定 SR：摆在屋里的缩小版兔耳扭蛋机，玻璃球里彩蛋闪闪发亮" },
    { id: "gacha_bubble_lights",  slot: "light",  icon: "🫧", name: "梦幻泡泡彩灯串",     price: 260,  grade: "luxury", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "彩灯"], desc: "扭蛋限定 SR：糖果色七彩扭蛋泡泡灯串垂落天花板，柔和光晕流转" },
    { id: "gacha_crystal_dome",   slot: "light",  icon: "💎", name: "银河扭蛋水晶穹顶灯", price: 1200, grade: "mythic", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "SSR", "穹顶灯"], desc: "扭蛋限定 SSR：24K金环托举的棱镜星河水晶吊灯，满屋流淌虹彩星辉" },
  ];

  // ---- Wearables Catalog (44 items: hats / outfits / accessories) ----
  const WEARABLES = [
    // ========== hat (头饰/帽子) ==========
    { id: "paper_boat",     slot: "hat", icon: "📰", name: "折纸报纸小船帽",   price: 18,    grade: "basic",  series: "街头日常", tags: ["报纸", "新手"], desc: "旧报纸手折的小船帽，质朴又呆萌" },
    { id: "mushroom_cap",   slot: "hat", icon: "🍄", name: "孢子蘑菇小伞帽",   price: 32,    grade: "basic",  series: "林野萌物", tags: ["蘑菇", "可爱"], desc: "红白波点圆润大蘑菇伞帽，林间避雨萌力翻倍" },
    { id: "worn_cap",       slot: "hat", icon: "🪣", name: "破旧洗水渔夫帽",   price: 45,    grade: "basic",  series: "街头日常", tags: ["渔夫帽", "日常"], desc: "带缝线补丁的做旧水洗渔夫帽，街头松弛感" },
    { id: "anc_headphones", slot: "hat", icon: "🎧", name: "头戴降噪耳机",     price: 110,   grade: "craft",  series: "极客办公", tags: ["耳机", "降噪", "码农"], desc: "哑光钛灰主动降噪大耳罩，戴上瞬间屏蔽一切打扰" },
    { id: "knit_beanie",    slot: "hat", icon: "🧶", name: "胡萝卜毛线帽",     price: 140,   grade: "craft",  series: "秋冬暖居", tags: ["毛线帽", "保暖"], desc: "暖橘绞花手织毛线帽+雪白毛球，软糯保暖" },
    { id: "newsboy_cap",    slot: "hat", icon: "🤠", name: "复古报童鸭舌帽",   price: 220,   grade: "craft",  series: "文艺穿搭", tags: ["报童帽", "英伦"], desc: "人字纹粗花呢复古八角报童帽，西湖漫步文艺范" },
    { id: "tier3_band",     slot: "hat", icon: "🔥", name: "疾风烈焰额带结",   price: 260,   grade: "craft",  minTier: 3, series: "战力限定", tags: ["Lv3", "烈焰"], desc: "认真兔专属限定：赤金烈焰飘带与火焰纹章" },
    { id: "beret_art",      slot: "hat", icon: "🎨", name: "复古羊毛贝雷帽",   price: 320,   grade: "craft",  series: "文艺穿搭", tags: ["贝雷帽", "复古"], desc: "斜戴酒红羊毛画家贝雷帽配金针胸徽，文艺范儿" },
    { id: "phd_mortarboard", slot: "hat", icon: "🎓", name: "博士方帽流苏",    price: 520,   grade: "craft",  series: "学者风范", tags: ["博士帽", "学霸"], desc: "深墨绒面博士方帽配24K金穗流苏，学术顶会气场" },
    { id: "tier5_scouter",  slot: "hat", icon: "📡", name: "赛亚战力探测镜",   price: 980,   grade: "luxury", minTier: 5, series: "战力限定", tags: ["Lv5", "探测镜"], desc: "超赛兔专属限定：翡翠全息HUD镜片实时扫描算力" },
    { id: "cc_pearl_hat",   slot: "hat", icon: "👒", name: "CC 双环珍珠礼帽",  price: 1880,  grade: "luxury", series: "顶奢高定", tags: ["高定", "珍珠", "礼帽"], desc: "高定象牙宽檐礼帽，黑丝缎带配虹彩珍珠链与双金环" },
    { id: "ice_crystal_tiara", slot: "hat", icon: "💎", name: "冰晶皇冠发箍",  price: 3200,  grade: "mythic", series: "极光高定", tags: ["冰晶", "皇冠", "发箍"], desc: "多面切割极光蓝钻白金冠冕发箍，折射星芒寒辉" },
    {
      id: "secret_celestial_crown", slot: "hat", icon: "👑", name: "星穹圣光金冠", price: 16800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "皇冠", "黄金"],
      desc: "24K镂空星芒皇冠配朱红晶钻、双翼月桂金羽与浮空圣光环",
      unlockReq: { needWear: "cc_pearl_hat", orTier: 8, label: "拥有「CC 双环珍珠礼帽」或达到 Lv.8 星渊霸王兔" },
    },
    // Festival limited hats
    {
      id: "evt_1024_visor", slot: "hat", icon: "🥽", name: "1024 绿码荧光护目镜", price: 240, grade: "event", eventId: "prog1024",
      series: "1024限定", tags: ["1024", "极客", "护目镜", "限定"],
      desc: "1024程序员节限时限定：赛博翡翠全息荧光护目镜，自带 0 Bug 幸运光环",
    },
    {
      id: "evt_xmas_hat", slot: "hat", icon: "🎅", name: "雪绒铃铛圣诞帽", price: 180, grade: "event", eventId: "christmas",
      series: "圣诞限定", tags: ["圣诞", "圣诞帽", "限定"],
      desc: "圣诞奇遇季限时限定：绯红天鹅绒配雪白软绒檐与金色小铃铛，节日氛围满分",
    },
    {
      id: "evt_cny_lion", slot: "hat", icon: "🦁", name: "瑞兔醒狮贺岁帽", price: 260, grade: "event", eventId: "springfest",
      series: "春节限定", tags: ["春节", "醒狮", "国潮", "限定"],
      desc: "新春贺岁限时限定：朱红鎏金国潮小醒狮头套配绒球与额头招财金纹",
    },

    // ========== outfit (服饰/披风) ==========
    { id: "waste_letter",  slot: "outfit", icon: "📄", name: "废弃信纸小披风",   price: 22,    grade: "basic",  series: "街头日常", tags: ["信纸", "新手"], desc: "泛黄方格信纸配红色邮票系成的迷你披风" },
    { id: "patch_scarf",   slot: "outfit", icon: "🧣", name: "补丁格子小围巾",   price: 58,    grade: "basic",  series: "街头日常", tags: ["围巾", "保暖"], desc: "奶奶缝的红白拼布针织围巾，暖和又软萌" },
    { id: "plaid_dev_shirt", slot: "outfit", icon: "🎽", name: "格子码农衬衫",   price: 95,    grade: "basic",  series: "极客办公", tags: ["格子衫", "码农"], desc: "红蓝经典法兰绒格纹衬衫，写代码自带 20% 架构师Buff" },
    { id: "hoodie_dev",    slot: "outfit", icon: "🧥", name: "码农深灰连帽卫衣", price: 220,   grade: "craft",  series: "极客办公", tags: ["码农", "卫衣"], desc: "极客标配连帽抽绳卫衣配胸前像素胡萝卜标" },
    { id: "geek_tech_vest", slot: "outfit", icon: "🥼", name: "极客风工装马甲",  price: 360,   grade: "craft",  series: "极客办公", tags: ["工装", "机能", "马甲"], desc: "多口袋机能风军绿工装马甲配快拆卡扣与徽章" },
    { id: "tier4_spark",   slot: "outfit", icon: "⚡", name: "雷电暴击金肩章",   price: 480,   grade: "craft",  minTier: 4, series: "战力限定", tags: ["Lv4", "雷电"], desc: "暴击兔专属限定：双肩黄金战甲跃动高频暴击电弧" },
    { id: "jiangnan_brocade_jacket", slot: "outfit", icon: "👘", name: "江南织锦新中式马褂", price: 880, grade: "luxury", series: "江南风雅", tags: ["新中式", "盘扣", "织锦"], desc: "黛青宋锦立领斜襟盘扣马褂，暗绣金竹纹温润儒雅" },
    { id: "trench_bb",     slot: "outfit", icon: "🧥", name: "BBR 经典格纹风衣", price: 1280,  grade: "luxury", series: "顶奢高定", tags: ["风衣", "英伦", "高定"], desc: "英伦驼色双排扣翻领风衣，格纹内衬与腰带扣" },
    { id: "velvet_tuxedo", slot: "outfit", icon: "🤵", name: "高定黑丝绒礼服",   price: 2200,  grade: "luxury", series: "顶奢高定", tags: ["礼服", "丝绒", "领结"], desc: "曜黑丝绒戗驳领晚宴西装，配绯红丝缎领结与金袖扣" },
    { id: "tier6_collar",  slot: "outfit", icon: "😈", name: "暗红魔纹尖刺领",   price: 2680,  grade: "luxury", minTier: 6, series: "战力限定", tags: ["Lv6", "魔纹"], desc: "红魔兔专属限定：黑曜天鹅绒立领配血钻魔纹胸针" },
    { id: "h_silk_cape",   slot: "outfit", icon: "🧣", name: "HM 橘橙真丝斗篷",  price: 4800,  grade: "mythic", series: "顶奢高定", tags: ["高定", "真丝", "斗篷"], desc: "爱马橘真丝缎面垂坠斗篷，鎏金马衔链扣与滚金边" },
    { id: "horizon_halo_cape", slot: "outfit", icon: "🌌", name: "视界光环圣披风", price: 8800, grade: "mythic", series: "次元神域", tags: ["奇点", "光环", "披风"], desc: "驯服黑洞视界的黑金引力光环披风，裙摆流淌炽金星弧" },
    {
      id: "secret_nebula_mantle", slot: "outfit", icon: "🌌", name: "极光星穹帝王袍", price: 24800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "帝王袍", "星云"],
      desc: "深空星云织锦礼袍配24K星仪金肩甲、翡翠星扣与流动星尘下摆",
      unlockReq: { needWear: "h_silk_cape", orTier: 9, label: "拥有「HM 橘橙真丝斗篷」或达到 Lv.9 创世飞升兔" },
    },

    // ========== acc (包包/配饰) ==========
    { id: "plastic_bag",   slot: "acc", icon: "🛍️", name: "透明菜篮小拎袋",     price: 28,    grade: "basic",  series: "街头日常", tags: ["菜篮", "新手"], desc: "拎着一根新鲜脆萝卜的接地气半透明买菜袋" },
    { id: "iced_americano", slot: "acc", icon: "☕", name: "冰美式手拎杯",       price: 48,    grade: "basic",  series: "极客办公", tags: ["冰美式", "续命", "咖啡"], desc: "早C晚A续命冰美式配冰块与绿色吸管，精神抖擞" },
    { id: "canvas_tote",   slot: "acc", icon: "🎒", name: "复古帆布小书包",     price: 120,   grade: "craft",  series: "文艺穿搭", tags: ["帆布包", "日常"], desc: "百搭米白斜挎帆布包配焦糖皮扣，装满生产力" },
    { id: "mini_mech_kb",  slot: "acc", icon: "⌨️", name: "客制化迷你机械键盘", price: 260,   grade: "craft",  series: "极客办公", tags: ["机械键盘", "客制化", "RGB"], desc: "阳极铝 65% 客制化机械键盘，微光 RGB 轴体随行敲代码" },
    { id: "rangefinder_camera", slot: "acc", icon: "📷", name: "复古旁轴胶片相机", price: 680, grade: "craft", series: "文艺穿搭", tags: ["胶片相机", "旁轴", "徕卡"], desc: "银黑黄铜旁轴胶片相机挂于胸侧，定格西湖光影" },
    { id: "iv_bucket",     slot: "acc", icon: "👜", name: "IV 老花水桶包包",    price: 1480,  grade: "luxury", series: "顶奢高定", tags: ["包包", "老花", "高定"], desc: "栗棕老花暗纹抽绳水桶包，植鞣皮提手与鎏金铭牌" },
    { id: "gci_shades",    slot: "acc", icon: "🕶️", name: "GCI 复古金边墨镜",   price: 2180,  grade: "luxury", series: "顶奢高定", tags: ["墨镜", "高定"], desc: "琥珀渐变金丝双梁大牌墨镜，自带高光流闪" },
    { id: "croc_briefcase", slot: "acc", icon: "💼", name: "鳄鱼纹公文包",       price: 3400,  grade: "luxury", series: "顶奢高定", tags: ["公文包", "鳄鱼纹", "总裁"], desc: "深栗手工鳄鱼压纹真皮手提公文包，18K金锁扣" },
    { id: "tier8_scepter", slot: "acc", icon: "👑", name: "星渊星辰维度权杖",   price: 6400,  grade: "mythic", minTier: 8, series: "战力限定", tags: ["Lv8", "权杖"], desc: "星渊霸王兔专属限定：浮空黄金星环权杖与旋转星芒" },
    { id: "rlx_watch",     slot: "acc", icon: "⌚", name: "RLX 绿水鬼机械表",   price: 7800,  grade: "mythic", series: "顶奢高定", tags: ["机械表", "绿水鬼", "顶奢"], desc: "18K金狗牙圈翡翠太阳纹表盘，放大镜日历与金链光泽" },
    { id: "floating_compute_cube", slot: "acc", icon: "🔮", name: "悬浮算力魔方", price: 9600, grade: "mythic", series: "未来星际", tags: ["魔方", "算力", "悬浮"], desc: "身侧自转的霓虹量子立方体，源源不断吞吐十亿级 Token" },
    { id: "tier10_orb",    slot: "acc", icon: "🛸", name: "量子浮游星能炮",     price: 12800, grade: "mythic", minTier: 10, series: "战力限定", tags: ["50B", "浮游炮"], desc: "50B 隐藏款专属限定：双翼棱镜浮游炮与量子光环" },
    { id: "taichu_carrot_halo", slot: "acc", icon: "✨", name: "太初圣光小萝卜光环", price: 18800, grade: "mythic", series: "太初臻礼", tags: ["太初", "光环", "小萝卜"], desc: "太初星穹御苑尊享赠礼：两枚发光黄金水晶小萝卜环绕兔兔流转圣辉" },
    {
      id: "secret_time_astrolabe", slot: "acc", icon: "⏳", name: "太初星轨怀表仪", price: 32000, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "怀表", "星轨"],
      desc: "悬浮自转24K金机械星轨怀表仪，环绕微型水晶萝卜卫星与金辉",
      unlockReq: { needWear: "rlx_watch", orTier: 10, label: "拥有「RLX 绿水鬼机械表」或解锁 50B 奇点终焉兔" },
    },
    // Festival limited acc
    {
      id: "evt_bf_vipbag", slot: "acc", icon: "🛍️", name: "黑五限定烫金购物袋", price: 280, grade: "event", eventId: "blackfriday",
      series: "黑五限定", tags: ["黑五", "购物袋", "黑金", "限定"],
      desc: "黑色星期五限时限定：曜黑漆皮手提袋配 24K 烫金 VIP 蝴蝶结丝带，满载战利品",
    },
    // ========== Gacha-Exclusive Wearables (扭蛋机限定小饰品) ==========
    { id: "gacha_clover_clip", slot: "hat",    icon: "🍀", name: "幸运四叶草发卡",   price: 60,   grade: "craft",  gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "发卡"], desc: "扭蛋限定 R：翡翠四叶草金边小发卡别在兔耳旁，欧气值+100%" },
    { id: "gacha_capsule_bag", slot: "acc",    icon: "🧸", name: "迷你扭蛋斜挎包",   price: 75,   grade: "craft",  gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "小包"], desc: "扭蛋限定 R：圆滚滚双色透明扭蛋壳斜挎小包，里面装着小金星" },
    { id: "gacha_ribbon_cape", slot: "outfit", icon: "🎀", name: "幻彩星愿丝带披肩", price: 240,  grade: "luxury", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "披肩"], desc: "扭蛋限定 SR：丁香紫与樱花粉渐变星纱披肩，胸口系着鎏金蝴蝶结" },
    { id: "gacha_star_wand",   slot: "acc",    icon: "⭐", name: "星愿幸运魔法棒",   price: 260,  grade: "luxury", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "魔法棒"], desc: "扭蛋限定 SR：自带星光拖尾的黄金翼星魔法棒，挥一挥好运降临" },
    { id: "gacha_prism_crown", slot: "hat",    icon: "👑", name: "传世幻彩扭蛋皇冠", price: 1200, grade: "mythic", gachaOnly: true, series: "扭蛋限定", tags: ["扭蛋限定", "SSR", "皇冠"], desc: "扭蛋限定 SSR：镶嵌七彩棱镜宝石的 24K 鎏金小皇冠，自带神圣星环" },
  ];

  // ---- Extensible Plugin SVG Art Registry ----
  const decorArtMap = new Map();
  const wearArtMap = new Map();
  const houseArtMap = new Map();
  const houseFgMap = new Map();

  // Register handcrafted SVG art for the 4 flagship festival decor items
  decorArtMap.set("evt_1024_matrix", () => `
    <g>
      <rect x="128" y="14" width="164" height="36" rx="7" fill="#051612" stroke="#10b981" stroke-width="1.8" filter="url(#hsGlowSm)"/>
      <rect x="134" y="19" width="152" height="26" rx="4" fill="#022c22"/>
      <text x="210" y="34" font-size="11.5" font-family="monospace" font-weight="900" fill="#34d399" text-anchor="middle" filter="url(#hsGlowSm)">&lt;1024 // OK/&gt;</text>
      <text x="150" y="42" font-size="5.5" font-family="monospace" fill="#6ee7b7" opacity="0.72" class="h-twinkle">010010</text>
      <text x="268" y="42" font-size="5.5" font-family="monospace" fill="#6ee7b7" opacity="0.72" text-anchor="end" class="h-twinkle-d1">101100</text>
      <polygon points="136,50 284,50 318,124 102,124" fill="#10b981" opacity="0.09" class="h-pulse"/>
    </g>
  `);

  decorArtMap.set("evt_cny_lantern", () => `
    <g>
      <path d="M126 0 Q210 18 294 0" fill="none" stroke="#f59e0b" stroke-width="1.6"/>
      ${[156, 264].map((cx, i) => `
        <g class="${i === 0 ? "h-drift-slow" : "h-drift"}">
          <line x1="${cx}" y1="6" x2="${cx}" y2="18" stroke="#f59e0b" stroke-width="1.4"/>
          <ellipse cx="${cx}" cy="34" rx="18" ry="15" fill="#dc2626" stroke="#fbbf24" stroke-width="1.3" filter="url(#hsGlowSm)"/>
          <ellipse cx="${cx}" cy="34" rx="10" ry="15" fill="none" stroke="#f59e0b" stroke-width="0.9" opacity="0.72"/>
          <rect x="${cx - 8}" y="17" width="16" height="4" rx="1.5" fill="#fbbf24"/>
          <rect x="${cx - 8}" y="47" width="16" height="4" rx="1.5" fill="#fbbf24"/>
          <text x="${cx}" y="38" font-size="10" font-weight="900" fill="#fef08a" text-anchor="middle">福</text>
          <line x1="${cx}" y1="51" x2="${cx}" y2="64" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="${cx}" cy="54" r="2.1" fill="#fde047"/>
        </g>
      `).join("")}
      <circle cx="156" cy="34" r="30" fill="#ef4444" opacity="0.14" class="h-pulse"/>
      <circle cx="264" cy="34" r="30" fill="#ef4444" opacity="0.14" class="h-pulse"/>
    </g>
  `);

  decorArtMap.set("evt_bf_goldrug", () => `
    <g>
      <ellipse cx="210" cy="180" rx="126" ry="22" fill="#000" opacity="0.22"/>
      <ellipse cx="210" cy="178" rx="122" ry="19.5" fill="#18181b" stroke="#f59e0b" stroke-width="2"/>
      <ellipse cx="210" cy="178" rx="112" ry="16" fill="none" stroke="#fde047" stroke-width="1.1" stroke-dasharray="6 4"/>
      <path d="M138 178 L174 164 L210 178 L246 164 L282 178 L246 192 L210 178 L174 192 Z" fill="none" stroke="#fbbf24" stroke-width="1.1" opacity="0.72"/>
      <polygon points="210,171 218,178 210,185 202,178" fill="#fbbf24" opacity="0.88" class="h-pulse"/>
    </g>
  `);

  decorArtMap.set("evt_xmas_tree", () => `
    <g transform="translate(362, 160)">
      <ellipse cx="0" cy="4" rx="26" ry="5.5" fill="rgba(0,0,0,0.2)"/>
      <rect x="-5" y="-12" width="10" height="14" rx="1.5" fill="#78350f"/>
      <rect x="-24" y="-8" width="13" height="10" rx="1.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.9"/>
      <line x1="-17.5" y1="-8" x2="-17.5" y2="2" stroke="#fde047" stroke-width="1.8"/>
      <rect x="11" y="-9" width="13" height="11" rx="1.5" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.9"/>
      <line x1="17.5" y1="-9" x2="17.5" y2="2" stroke="#fde047" stroke-width="1.8"/>
      <polygon points="0,-78 -26,-12 26,-12" fill="#15803d" stroke="#14532d" stroke-width="1.2"/>
      <polygon points="0,-84 -21,-32 21,-32" fill="#16a34a" stroke="#14532d" stroke-width="1.1"/>
      <polygon points="0,-90 -15,-52 15,-52" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
      <path d="M-11 -56 Q0 -48 11 -56 M-17 -36 Q0 -26 17 -36 M-22 -18 Q0 -10 22 -18" fill="none" stroke="#fde047" stroke-width="1.2" opacity="0.82"/>
      <circle cx="-8" cy="-42" r="2.4" fill="#ef4444" class="h-twinkle"/>
      <circle cx="9" cy="-46" r="2.2" fill="#38bdf8" class="h-twinkle-d1"/>
      <circle cx="0" cy="-30" r="2.5" fill="#fde047" class="h-twinkle-d2"/>
      <circle cx="-13" cy="-22" r="2.3" fill="#f472b6" class="h-twinkle"/>
      <circle cx="13" cy="-22" r="2.3" fill="#ef4444" class="h-twinkle-d1"/>
      <path d="M0 -98 L2.6 -92 L9 -91.2 L4.2 -86.8 L5.5 -80.5 L0 -83.8 L-5.5 -80.5 L-4.2 -86.8 L-9 -91.2 L-2.6 -92 Z" fill="#fde047" stroke="#f59e0b" stroke-width="0.7" filter="url(#hsGlowSm)" class="h-pulse"/>
    </g>
  `);

  wearArtMap.set("evt_1024_visor", () => `
    <g>
      <rect x="8.8" y="18.6" width="18.4" height="5.4" rx="2.4" fill="#064e3b" fill-opacity="0.78" stroke="#34d399" stroke-width="0.9"/>
      <line x1="10.8" y1="20.6" x2="15.2" y2="20.6" stroke="#6ee7b7" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="20.2" y1="22.1" x2="25.2" y2="22.1" stroke="#a7f3d0" stroke-width="0.7" stroke-linecap="round"/>
      <circle cx="25.8" cy="19.6" r="0.8" fill="#34d399" class="h-twinkle"/>
    </g>
  `);

  wearArtMap.set("evt_xmas_hat", () => `
    <g>
      <path d="M10.4 15.2 Q18 6.2 26.8 11.4 Q28.6 12.6 29.4 15.4 L24.6 15.4 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.7" stroke-linejoin="round"/>
      <rect x="9.6" y="13.8" width="16.8" height="3.0" rx="1.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.45"/>
      <circle cx="29.6" cy="15.6" r="2.1" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.45"/>
      <circle cx="29.6" cy="17.8" r="1.15" fill="#fde047" stroke="#d97706" stroke-width="0.35"/>
    </g>
  `);

  wearArtMap.set("evt_cny_lion", () => `
    <g>
      <path d="M9.6 16.0 Q18 8.6 26.4 16.0 L25.0 17.4 Q18 14.8 11.0 17.4 Z" fill="#dc2626" stroke="#f59e0b" stroke-width="0.85"/>
      <circle cx="10.2" cy="15.4" r="2.0" fill="#fef08a" stroke="#d97706" stroke-width="0.45"/>
      <circle cx="25.8" cy="15.4" r="2.0" fill="#fef08a" stroke="#d97706" stroke-width="0.45"/>
      <circle cx="18.0" cy="12.6" r="2.4" fill="#fde047" stroke="#b45309" stroke-width="0.5"/>
      <text x="18.0" y="13.7" font-size="3.1" font-weight="900" fill="#b91c1c" text-anchor="middle">王</text>
      <circle cx="14.2" cy="14.6" r="0.9" fill="#ffffff"/><circle cx="21.8" cy="14.6" r="0.9" fill="#ffffff"/>
    </g>
  `);

  wearArtMap.set("evt_bf_vipbag", () => `
    <g transform="translate(26.5, 24.0)">
      <path d="M-2.2 -1.2 Q0 -4.2 2.2 -1.2" fill="none" stroke="#fbbf24" stroke-width="0.85"/>
      <rect x="-4.2" y="-1.2" width="8.4" height="8.6" rx="1.2" fill="#18181b" stroke="#f59e0b" stroke-width="0.8"/>
      <text x="0" y="4.8" font-size="3.4" font-family="monospace" font-weight="900" fill="#fde047" text-anchor="middle">VIP</text>
    </g>
  `);

  // ---- Helper Functions ----
  function isDateInRanges(ranges, now) {
    if (!Array.isArray(ranges) || !ranges.length) return false;
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const cur = `${mm}-${dd}`;
    return ranges.some(([start, end]) => {
      if (start <= end) return cur >= start && cur <= end;
      return cur >= start || cur <= end;
    });
  }

  function getActiveEvents(mockEventId = null, now = new Date()) {
    if (mockEventId === "none") return [];
    if (mockEventId) {
      const found = EVENTS.find(e => e.id === mockEventId);
      return found ? [{ ...found, mocked: true }] : [];
    }
    return EVENTS.filter(e => isDateInRanges(e.dateRanges, now));
  }

  function getEventById(id) {
    return EVENTS.find(e => e.id === id) || null;
  }

  function getEffectivePrice(item, activeEvents = []) {
    const base = Math.max(0, Number(item && item.price) || 0);
    if (!item || base === 0) {
      return { price: 0, originalPrice: 0, onSale: false, discountLabel: "" };
    }
    if (typeof item.salePrice === "number" && item.salePrice < base) {
      return {
        price: Math.max(1, Math.round(item.salePrice)),
        originalPrice: base,
        onSale: true,
        discountLabel: "特惠",
      };
    }
    if (!item.secret && !item.eventId && Array.isArray(activeEvents) && activeEvents.length) {
      let bestDisc = 1.0;
      let label = "";
      activeEvents.forEach(ev => {
        if (typeof ev.shopDiscount === "number" && ev.shopDiscount > 0 && ev.shopDiscount < bestDisc) {
          bestDisc = ev.shopDiscount;
          label = `${Math.round(bestDisc * 10)}折`;
        }
      });
      if (bestDisc < 1.0) {
        return {
          price: Math.max(1, Math.round(base * bestDisc)),
          originalPrice: base,
          onSale: true,
          discountLabel: label,
        };
      }
    }
    return { price: base, originalPrice: base, onSale: false, discountLabel: "" };
  }

  function isItemAvailable(item, activeEvents = [], isOwned = false) {
    if (!item) return false;
    if (item.gachaOnly) return !!isOwned;
    if (!item.eventId) return true;
    if (isOwned) return true;
    return activeEvents.some(ev => ev.id === item.eventId);
  }

  function getCheckinTotalReward(activeEvents = []) {
    let bonus = 0;
    let bonusNames = [];
    (activeEvents || []).forEach(ev => {
      if (ev.checkinBonus > 0) {
        bonus += ev.checkinBonus;
        bonusNames.push(ev.name);
      }
    });
    return { base: ECONOMY.baseCheckinCoins, bonus, total: ECONOMY.baseCheckinCoins + bonus, bonusNames };
  }

  function formatCoins(n) {
    return Number(n || 0).toLocaleString("en-US");
  }

  // ---- O(1) Indexed Maps ----
  const houseById = new Map();
  const decorById = new Map();
  const wearById = new Map();
  const decorsBySlot = new Map();
  const wearsBySlot = new Map();

  function buildSearchKey(it) {
    return [
      it.name || "",
      it.desc || "",
      it.series || "",
      it.tierTag || "",
      Array.isArray(it.tags) ? it.tags.join(" ") : "",
      it.id || "",
    ].join(" ").toLowerCase();
  }

  function rebuildIndexes() {
    houseById.clear();
    HOUSES.forEach(h => {
      h._search = buildSearchKey(h);
      houseById.set(h.id, h);
    });
    decorById.clear();
    decorsBySlot.clear();
    DECORS.forEach(d => {
      d._search = buildSearchKey(d);
      decorById.set(d.id, d);
      if (!decorsBySlot.has(d.slot)) decorsBySlot.set(d.slot, []);
      decorsBySlot.get(d.slot).push(d);
    });
    wearById.clear();
    wearsBySlot.clear();
    WEARABLES.forEach(w => {
      w._search = buildSearchKey(w);
      wearById.set(w.id, w);
      if (!wearsBySlot.has(w.slot)) wearsBySlot.set(w.slot, []);
      wearsBySlot.get(w.slot).push(w);
    });
  }
  rebuildIndexes();

  // ---- House Purchase Gift Helpers ----
  function getHouseGift(house) {
    if (!house || !house.gift || !house.gift.id) return null;
    const kind = house.gift.kind === "wear" ? "wear" : "decor";
    const item = kind === "wear" ? wearById.get(house.gift.id) : decorById.get(house.gift.id);
    if (!item) return null;
    const refundCoins = Math.max(1, Math.round((Number(item.price) || 0) * ECONOMY.giftRefundRate));
    return { kind, item, refundCoins };
  }

  // ---- Friday 14:00-18:00 "辛苦一周" Weekly Rental Coupon Engine ----
  function getIsoWeekKey(now = new Date()) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  function getFridayWindowInfo(homeState, mockActive = false, now = new Date()) {
    const weekKey = getIsoWeekKey(now);
    const day = now.getDay(); // 5 = Friday
    const hr = now.getHours();
    const min = now.getMinutes();
    const inRealWindow = day === 5 && hr >= ECONOMY.fridayStartHour && hr < ECONOMY.fridayEndHour;
    const isOpen = !!mockActive || inRealWindow;
    const claimed = !!(homeState && homeState.friday_claim_week === weekKey);
    const minsLeft = inRealWindow ? Math.max(1, (ECONOMY.fridayEndHour - hr) * 60 - min) : (mockActive ? 180 : 0);
    return {
      isOpen,
      inRealWindow,
      mocked: !!mockActive && !inRealWindow,
      weekKey,
      claimed,
      canClaim: isOpen && !claimed,
      minsLeft,
    };
  }

  function getValidCoupons(homeState, nowMs = Date.now(), kind = null) {
    const list = (homeState && Array.isArray(homeState.coupons)) ? homeState.coupons : [];
    return list
      .filter(c => {
        if (!c || !c.id || !(Number(c.expires_at) > nowMs)) return false;
        if (!(Number(c.discount) > 0 && Number(c.discount) < 1)) return false;
        const ck = c.kind === "wear" ? "wear" : "rent";
        if (kind && ck !== kind) return false;
        return true;
      })
      .sort((a, b) => a.discount - b.discount || a.expires_at - b.expires_at);
  }

  function getBestRentCoupon(homeState, nowMs = Date.now()) {
    const valid = getValidCoupons(homeState, nowMs, "rent");
    return valid.length ? valid[0] : null;
  }

  function getBestWearCoupon(homeState, nowMs = Date.now()) {
    const valid = getValidCoupons(homeState, nowMs, "wear");
    return valid.length ? valid[0] : null;
  }

  function getWearPriceWithCoupon(item, activeEvents = [], coupon = null) {
    const eff = getEffectivePrice(item, activeEvents);
    if (!coupon || !(Number(coupon.discount) > 0 && Number(coupon.discount) < 1) || eff.price <= 0) {
      return { ...eff, basePriceBeforeCoupon: eff.price, couponApplied: null, savedByCoupon: 0 };
    }
    const discounted = Math.max(1, Math.round(eff.price * Number(coupon.discount)));
    const dLabel = `${Math.round(Number(coupon.discount) * 10)}折券`;
    return {
      price: discounted,
      originalPrice: eff.originalPrice || eff.price,
      basePriceBeforeCoupon: eff.price,
      onSale: discounted < (eff.originalPrice || eff.price),
      discountLabel: eff.onSale ? `${eff.discountLabel}+${dLabel}` : dLabel,
      couponApplied: coupon,
      savedByCoupon: Math.max(0, eff.price - discounted),
    };
  }

  function rollFridayCoupon(forceEpic = false, nowMs = Date.now()) {
    const isEpic = forceEpic || Math.random() < ECONOMY.fridayEpicChance;
    const discount = isEpic ? 0.3 : 0.8;
    const expiresAt = nowMs + ECONOMY.fridayCouponDays * 86400000;
    return {
      id: `fri_${nowMs}_${Math.random().toString(36).slice(2, 7)}`,
      kind: "rent",
      discount,
      label: isEpic ? "🔥 3折租房神券" : "🏷️ 8折租房券",
      rarity: isEpic ? "epic" : "normal",
      expires_at: expiresAt,
      source: "friday",
    };
  }

  // ---- Leasing & Rent-to-Own Equity Helpers ----
  function getLeaseExpiresAt(houseId, homeState) {
    const leases = (homeState && homeState.leases) || {};
    const exp = Number(leases[houseId] || 0);
    return exp > Date.now() ? exp : 0;
  }

  function isHouseLeased(houseId, homeState) {
    return getLeaseExpiresAt(houseId, homeState) > 0;
  }

  function formatLeaseRemaining(expiresAtMs) {
    const diff = Math.max(0, Number(expiresAtMs || 0) - Date.now());
    if (diff <= 0) return "已到期";
    const totalHours = Math.ceil(diff / 3600000);
    const days = Math.floor(totalHours / 24);
    const hrs = totalHours % 24;
    if (days >= 1) return hrs > 0 ? `剩 ${days}天${hrs}h` : `剩 ${days}天`;
    return `剩 ${Math.max(1, hrs)}小时`;
  }

  function getHouseRentPrice(house, days, activeEvents = [], coupon = null) {
    if (!house || !house.rentable) return null;
    const base = days >= 30
      ? (house.rent30d || Math.max(10, Math.round(house.price * 0.2)))
      : (house.rent7d || Math.max(5, Math.round(house.price * 0.06)));
    const eff = getEffectivePrice({ ...house, price: base }, activeEvents);
    if (coupon && Number(coupon.discount) > 0 && Number(coupon.discount) < 1) {
      const discounted = Math.max(1, Math.round(eff.price * Number(coupon.discount)));
      const dLabel = `${Math.round(Number(coupon.discount) * 10)}折券`;
      return {
        price: discounted,
        originalPrice: eff.originalPrice || base,
        basePriceBeforeCoupon: eff.price,
        onSale: discounted < (eff.originalPrice || base),
        discountLabel: eff.onSale ? `${eff.discountLabel}+${dLabel}` : dLabel,
        couponApplied: coupon,
        savedByCoupon: Math.max(0, eff.price - discounted),
      };
    }
    return { ...eff, basePriceBeforeCoupon: eff.price, couponApplied: null, savedByCoupon: 0 };
  }

  function getHouseBuyoutInfo(house, homeState, activeEvents = []) {
    const baseEff = getEffectivePrice(house, activeEvents);
    const paidRent = Math.max(0, Number((homeState && homeState.rent_equity && homeState.rent_equity[house.id]) || 0));
    const maxCredit = Math.floor(baseEff.price * ECONOMY.rentEquityCapRate);
    const equityCredit = Math.min(maxCredit, Math.floor(paidRent * ECONOMY.rentEquityRate));
    const finalPrice = Math.max(1, baseEff.price - equityCredit);
    return {
      price: house.price === 0 ? 0 : finalPrice,
      originalPrice: baseEff.originalPrice,
      baseEffectivePrice: baseEff.price,
      equityCredit,
      onSale: baseEff.onSale,
      discountLabel: baseEff.discountLabel,
    };
  }

  // ---- Public Extensible Registry API ----
  const Registry = {
    economy: ECONOMY,
    events: EVENTS,
    houses: HOUSES,
    decors: DECORS,
    wearables: WEARABLES,

    getHouse: (id) => houseById.get(id) || null,
    getDecor: (id) => decorById.get(id) || null,
    getWearable: (id) => wearById.get(id) || null,
    getDecorsBySlot: (slot) => decorsBySlot.get(slot) || [],
    getWearsBySlot: (slot) => wearsBySlot.get(slot) || [],

    getHouseGift,
    getIsoWeekKey,
    getFridayWindowInfo,
    getValidCoupons,
    getBestRentCoupon,
    getBestWearCoupon,
    getWearPriceWithCoupon,
    rollFridayCoupon,

    getActiveEvents,
    getEventById,
    getEffectivePrice,
    isItemAvailable,
    getCheckinTotalReward,
    formatCoins,
    getLeaseExpiresAt,
    isHouseLeased,
    formatLeaseRemaining,
    getHouseRentPrice,
    getHouseBuyoutInfo,

    registerEvent(ev) {
      if (!ev || !ev.id) return;
      const idx = EVENTS.findIndex(x => x.id === ev.id);
      if (idx >= 0) EVENTS[idx] = ev;
      else EVENTS.push(ev);
    },
    registerHouse(item, artFn) {
      if (!item || !item.id) return;
      const idx = HOUSES.findIndex(x => x.id === item.id);
      if (idx >= 0) HOUSES[idx] = item;
      else HOUSES.push(item);
      if (typeof artFn === "function") houseArtMap.set(item.id, artFn);
      rebuildIndexes();
    },
    registerDecor(item, artFn) {
      if (!item || !item.id) return;
      const idx = DECORS.findIndex(x => x.id === item.id);
      if (idx >= 0) DECORS[idx] = item;
      else DECORS.push(item);
      if (typeof artFn === "function") decorArtMap.set(item.id, artFn);
      rebuildIndexes();
    },
    registerWearable(item, artFn) {
      if (!item || !item.id) return;
      const idx = WEARABLES.findIndex(x => x.id === item.id);
      if (idx >= 0) WEARABLES[idx] = item;
      else WEARABLES.push(item);
      if (typeof artFn === "function") wearArtMap.set(item.id, artFn);
      rebuildIndexes();
    },
    registerDecorArt(id, fn) { if (id && typeof fn === "function") decorArtMap.set(id, fn); },
    registerWearArt(id, fn)  { if (id && typeof fn === "function") wearArtMap.set(id, fn); },
    registerHouseArt(id, fn) { if (id && typeof fn === "function") houseArtMap.set(id, fn); },
    registerHouseFg(id, fn)  { if (id && typeof fn === "function") houseFgMap.set(id, fn); },
    getDecorArt(id, ctx)     { const fn = decorArtMap.get(id); return fn ? fn(ctx) : ""; },
    getWearArt(id, pfx)      { const fn = wearArtMap.get(id);  return fn ? fn(pfx || "st") : ""; },
    getHouseArt(id, dp)      { const fn = houseArtMap.get(id); return fn ? fn(dp) : ""; },
    getHouseFg(id, dp)       { const fn = houseFgMap.get(id);  return fn ? fn(dp) : ""; },
  };

  global.TooTooRegistry = Registry;
})(typeof window !== "undefined" ? window : globalThis);
