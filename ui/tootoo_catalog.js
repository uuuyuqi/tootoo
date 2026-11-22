/* ============================================================================
 * TooToo Raising Economy, Live-Ops Events & Extensible Content Registry
 * ----------------------------------------------------------------------------
 * Designed to scale to 300+ houses, decors, wearables, and seasonal events
 * (1024 Programmer's Day, Black Friday, Christmas, Spring Festival, etc.)
 * without editing ui/index.html.
 *
 * Daily Income Baselines (10M tokens = 1 萝卜币, Daily Check-In = +1 萝卜币):
 *   - Casual (30M/day):       4 币/day  (~120/mo)  -> Long-term home: 工业纸箱屋 (80)
 *   - Regular (100M/day):    11 币/day  (~330/mo)  -> Long-term home: 阳光树洞屋 (360)
 *   - Engineer (200M/day):   21 币/day  (~630/mo)  -> Long-term home: 和安居小区 (1,280)
 *   - Power AI (1B/day):    101 币/day  (~3030/mo) -> Dream mansion:  西溪壹号别墅 (6,800+)
 * ============================================================================ */
(function (global) {
  "use strict";

  const ECONOMY = {
    version: 3,
    mintUnitTokens: 10e6,
    baseCheckinCoins: 1,
    rentEquityRate: 0.5,      // 50% of paid rent accumulates toward buying out the house
    rentEquityCapRate: 0.4,   // Max 40% of house purchase price can be offset by rent equity
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
      { tier: 3,  label: "T3 纸箱" },
      { tier: 4,  label: "T4 林间" },
      { tier: 5,  label: "T5 公寓" },
      { tier: 6,  label: "T6 顶豪" },
      { tier: 7,  label: "T7 奇观" },
      { tier: 8,  label: "T8 星际" },
      { tier: 9,  label: "T9 次元" },
      { tier: 10, label: "T10 神居" },
    ],
  };

  // ---- Seasonal & Live-Ops Festival Calendar ----
  // dateRanges: [startMMDD, endMMDD] inclusive (supports year-wrap like 1225..0105)
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

  // ---- Houses Catalog (10-Tier Real Estate Progression + Leasing from 和安居 Onward) ----
  const HOUSES = [
    {
      id: "street", tier: 1, icon: "🛣️", name: "露宿马路边", price: 0, tierTag: "起点", grade: "basic",
      rentable: false, series: "初始起点", tags: ["起点", "户外", "街头"],
      slots: [],
      desc: "暖黄路灯与旧报纸铺地，捧着热咖啡从零起家（刮风下雨会淋湿哦）",
    },
    {
      id: "pot", tier: 2, icon: "🪴", name: "简陋花盆屋", price: 20, tierTag: "蜗居", grade: "basic",
      rentable: true, rent7d: 2, rent30d: 6,
      series: "新手落脚", tags: ["新手", "花盆", "可租房", "喝热水"],
      slots: [],
      desc: "青草蘑菇间的红陶拱门花盆屋，从此能遮风挡雨并解锁屋内小桌喝热水",
    },
    {
      id: "cardboard", tier: 3, icon: "📦", name: "工业纸箱屋", price: 80, tierTag: "可装潢", grade: "craft",
      rentable: true, rent7d: 6, rent30d: 18,
      series: "经典居所", tags: ["装潢入门", "纸箱", "可租房", "性价比"],
      slots: ["bed", "light"],
      desc: "加厚双层瓦楞纸箱配手绘开窗，正式开启家具与灯饰装潢！",
    },
    {
      id: "treehole", tier: 4, icon: "🌳", name: "阳光树洞屋", price: 360, tierTag: "林间", grade: "craft",
      rentable: true, rent7d: 24, rent30d: 75,
      series: "经典居所", tags: ["树洞", "林间", "可租房", "花园"],
      slots: ["bed", "light", "garden"],
      desc: "老橡树暖木树洞与圆拱阳光窗，温馨林间独栋并解锁绿植槽位",
    },
    {
      id: "heanju", tier: 5, icon: "🏢", name: "和安居小区", price: 1280, tierTag: "住宅", grade: "craft",
      rentable: true, rent7d: 78, rent30d: 260,
      series: "城市住宅", tags: ["和安居", "可租房", "阳台", "可出门", "地面"],
      slots: ["bed", "light", "floor", "garden"],
      desc: "城市精装公寓配横版可步出大露台与夜景串灯，支持租房入住，解锁地面铺装！",
    },
    {
      id: "xixi", tier: 6, icon: "🏡", name: "西溪壹号别墅", price: 6800, tierTag: "顶豪", grade: "luxury",
      rentable: true, rent7d: 390, rent30d: 1360,
      series: "顶豪名邸", tags: ["西溪", "别墅", "可租房", "顶豪", "可出门", "泳池"],
      slots: ["bed", "light", "floor", "garden", "pool"],
      desc: "胡桃木格栅与全景落地玻璃，步出即达江南水亭木栈园林，全 5 槽位解锁！",
    },
    {
      id: "atlantis", tier: 7, icon: "🏛️", name: "海底水晶神殿", price: 18800, tierTag: "奇观", grade: "luxury",
      rentable: true, rent7d: 1080, rent30d: 3680,
      series: "奇观殿堂", tags: ["海底", "神殿", "可租房", "无天气"],
      slots: ["bed", "light", "floor", "garden", "pool"],
      desc: "深海折射穹顶、镀金大理石神柱、水母与魔鬼鱼共游的永恒海底圣殿",
    },
    {
      id: "rocket", tier: 8, icon: "🚀", name: "太空火箭舱", price: 42000, tierTag: "星际", grade: "mythic",
      rentable: true, rent7d: 2400, rent30d: 8200,
      series: "星际传世", tags: ["太空", "火箭", "可租房", "土星"],
      slots: ["bed", "light", "floor", "garden", "pool"],
      desc: "拉丝钛合金星际观景舱，窗外双环土星与深空银河星云相伴",
    },
    {
      id: "wormhole", tier: 9, icon: "🌌", name: "次元虫洞方舟", price: 98000, tierTag: "终极", grade: "mythic",
      rentable: true, rent7d: 5600, rent30d: 18800,
      series: "星际传世", tags: ["虫洞", "黑洞", "可租房", "量子"],
      slots: ["bed", "light", "floor", "garden", "pool"],
      desc: "黑金相对论吸积盘虫洞、双浮空晶碑与透视黑曜石量子光桥甲板",
    },
    {
      id: "secret_palace", tier: 10, icon: "🏰", name: "太初星穹御苑", price: 220000, tierTag: "隐藏款", grade: "secret", secret: true,
      rentable: true, rent7d: 12000, rent30d: 39800,
      series: "太初隐藏", tags: ["隐藏", "星穹", "可租房", "殿堂"],
      slots: ["bed", "light", "floor", "garden", "pool"],
      desc: "云海之上象牙大理石与24K金星仪殿堂，彩绘萝卜玫瑰窗与流动金星瀑布",
      unlockReq: { needHouse: "wormhole", orTier: 8, label: "拥有「次元虫洞方舟」或达到 Lv.8 星渊霸王兔" },
    },
  ];

  // ---- Decor Catalog (Permanent + Festival Limited Editions) ----
  const DECORS = [
    // bed (家具/主位)
    { id: "straw_mat",      slot: "bed", icon: "🌾", name: "干草暖软垫",     price: 30,    grade: "basic",  series: "质朴软装", tags: ["干草", "新手"], desc: "晒过太阳的软蓬蓬编织干草窝，兔兔打滚很香" },
    { id: "cardboard_sofa", slot: "bed", icon: "📦", name: "纸箱手搓沙发",   price: 75,    grade: "basic",  series: "质朴软装", tags: ["纸箱", "沙发"], desc: "双层瓦楞纸手搓沙发配条纹软垫与萝卜抱枕" },
    { id: "muji_desk",      slot: "bed", icon: "💻", name: "原木码农升降桌", price: 260,   grade: "craft",  series: "极客办公", tags: ["码农", "双屏", "原木"], desc: "胡桃实木桌配双屏算力监控、机械键盘与热咖啡" },
    { id: "velvet_sofa",    slot: "bed", icon: "🛋️", name: "西溪云朵大沙发", price: 880,   grade: "luxury", series: "西溪轻奢", tags: ["沙发", "奶油", "轻奢"], desc: "意式奶油羊羔绒云朵沙发，黄铜细脚配羊绒搭毯" },
    { id: "cyber_pod",      slot: "bed", icon: "🛸", name: "零重力电竞舱",   price: 4800,  grade: "mythic", series: "未来星际", tags: ["电竞", "悬浮", "赛博"], desc: "黑曜石反重力悬浮座舱，三联全息曲面屏+脉冲悬停环" },
    { id: "quantum_throne", slot: "bed", icon: "👑", name: "奇点星环王座",   price: 9800,  grade: "mythic", series: "星渊传世", tags: ["王座", "黑洞", "黄金"], desc: "24K金浮雕黑曜丝绒王座，背悬实时旋转黑洞吸积盘与双星轨仪" },
    {
      id: "secret_carrot_throne", slot: "bed", icon: "🥕", name: "黄金萝卜浮空圣座", price: 28800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "王座", "萝卜"],
      desc: "象牙白金新月华盖圣座，悬顶多面琥珀水晶萝卜棱镜与极光纱幔",
      unlockReq: { needDecor: "quantum_throne", orTier: 7, label: "拥有「奇点星环王座」或达到 Lv.7 狱火魔神兔" },
    },

    // light (灯饰/墙面)
    { id: "fairy_bulb",         slot: "light", icon: "💡", name: "暖黄钨丝小灯泡", price: 35,    grade: "basic",  series: "质朴软装", tags: ["暖光", "复古"], desc: "黄铜灯头复古爱迪生钨丝泡，把小屋照得暖融融" },
    { id: "carrot_neon",        slot: "light", icon: "🥕", name: "霓虹胡萝卜灯牌", price: 160,   grade: "craft",  series: "极客办公", tags: ["霓虹", "胡萝卜"], desc: "熏黑亚克力双层玻璃霓虹灯管，深夜氛围感拉满" },
    { id: "star_projector",     slot: "light", icon: "🌌", name: "卧室星空投影仪", price: 280,   grade: "craft",  series: "浪漫家居", tags: ["星空", "投影"], desc: "天幕投射浪漫星云流雾、黄金星宿连线与闪烁繁星" },
    { id: "crystal_chandelier", slot: "light", icon: "✨", name: "轻奢水晶大吊灯", price: 1180,  grade: "luxury", series: "西溪轻奢", tags: ["水晶", "吊灯", "法式"], desc: "法式双层鎏金枝形水晶灯，切割琉璃垂坠折射暖芒" },
    { id: "aurora_holo",        slot: "light", icon: "🌈", name: "全息极光天幕",   price: 4200,  grade: "mythic", series: "未来星际", tags: ["极光", "全息"], desc: "双角全息棱镜投射流动翡青紫金极光丝幕与垂落光帘" },
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

    // floor (地面/地毯)
    { id: "plaid_rug",       slot: "floor", icon: "🧶", name: "暖格编织地毯",   price: 95,    grade: "basic",  series: "质朴软装", tags: ["地毯", "复古"], desc: "苏格兰朱红暖格手工羊毛毯，带金线锁边与流苏" },
    { id: "wood_floor",      slot: "floor", icon: "🪵", name: "人字拼实木地板", price: 360,   grade: "craft",  series: "城市精装", tags: ["木地板", "人字拼"], desc: "温润胡桃木透视人字拼地板，窗影微光折射木纹" },
    { id: "marble_tile",     slot: "floor", icon: "🏛️", name: "鱼肚白大理石砖", price: 1380,  grade: "luxury", series: "西溪轻奢", tags: ["大理石", "金脉"], desc: "抛光卡拉卡塔白石配24K金脉与黄铜嵌条，镜面光泽" },
    { id: "starlight_floor", slot: "floor", icon: "🌠", name: "银河星轨光感地", price: 5600,  grade: "mythic", series: "未来星际", tags: ["星轨", "银河", "光感"], desc: "深空蓝晶玻璃地面，内嵌流动银河星云、双金轨与步步生辉光涟漪" },
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

    // garden (绿植/花园)
    { id: "mini_carrot_pot",  slot: "garden", icon: "🌱", name: "窗台胡萝卜盆栽", price: 45,    grade: "basic",  series: "质朴软装", tags: ["盆栽", "胡萝卜"], desc: "红陶釉盆里冒头的饱满小胡萝卜，青翠羽叶生机满满" },
    { id: "balcony_monstera", slot: "garden", icon: "🪴", name: "阳台龟背竹绿角", price: 180,   grade: "craft",  series: "城市精装", tags: ["龟背竹", "绿植"], desc: "竖纹白瓷高脚盆栽，开背龟背竹与垂藤绿意盎然" },
    { id: "sakura_garden",    slot: "garden", icon: "🌸", name: "樱花庭院小花园", price: 980,   grade: "luxury", series: "西溪轻奢", tags: ["樱花", "庭院", "飘瓣"], desc: "苍劲古樱盆景配青苔石灯笼，粉白花瓣实时随风飘落" },
    { id: "biolum_reef",      slot: "garden", icon: "🪸", name: "发光星花珊瑚园", price: 3600,  grade: "mythic", series: "奇观殿堂", tags: ["珊瑚", "荧光"], desc: "紫晶与海玻璃荧光珊瑚簇，绽放发光星莲与漂浮萤火孢子" },
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

    // pool (泳池/水景)
    { id: "koi_pond",        slot: "pool", icon: "🎏", name: "锦鲤荷花景观池", price: 520,   grade: "craft",  series: "江南园林", tags: ["锦鲤", "荷花"], desc: "鹅卵石禅意荷塘，清波荷花间红白锦鲤与金鲤悠游" },
    { id: "infinity_pool",   slot: "pool", icon: "🏊", name: "恒温湛蓝无边泳池", price: 2200, grade: "luxury", series: "西溪轻奢", tags: ["泳池", "小黄鸭"], desc: "莱姆石边无边恒温池，水波焦散光纹+水下灯带+漂浮小黄鸭" },
    { id: "hot_spring",      slot: "pool", icon: "♨️", name: "星空温泉泡泡汤池", price: 3800, grade: "mythic", series: "京都汤泉", tags: ["温泉", "柚子"], desc: "京都风玄武岩露天汤池，竹筒惊鹿注水、漂浮柚子与袅袅热气" },
    { id: "portal_fountain", slot: "pool", icon: "🌀", name: "悬浮时空光瀑喷泉", price: 7800, grade: "mythic", series: "星渊传世", tags: ["时空", "喷泉"], desc: "黑金符文八角池配双浮空玉环，反重力螺旋光水倒流星核" },
    {
      id: "secret_starlight_cascade", slot: "pool", icon: "🌌", name: "银河琉璃浮空天池", price: 21800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "天池", "银河"],
      desc: "云雾托举的月牙白金浮空星池，黄金月门倾泻星瀑与光影金鲤",
      unlockReq: { needDecor: "portal_fountain", orTier: 8, label: "拥有「悬浮时空光瀑喷泉」或达到 Lv.8 星渊霸王兔" },
    },
  ];

  // ---- Wearables Catalog (Permanent + Tier-Exclusive + Festival Limited) ----
  const WEARABLES = [
    // hat (头饰/帽子)
    { id: "paper_boat",    slot: "hat", icon: "📰", name: "折纸报纸小船帽",   price: 18,    grade: "basic",  series: "街头日常", tags: ["报纸", "新手"], desc: "旧报纸手折的小船帽，质朴又呆萌" },
    { id: "worn_cap",      slot: "hat", icon: "🪣", name: "破旧洗水渔夫帽",   price: 45,    grade: "basic",  series: "街头日常", tags: ["渔夫帽", "日常"], desc: "带缝线补丁的做旧水洗渔夫帽，街头松弛感" },
    { id: "knit_beanie",   slot: "hat", icon: "🧶", name: "胡萝卜毛线帽",     price: 140,   grade: "craft",  series: "秋冬暖居", tags: ["毛线帽", "保暖"], desc: "暖橘绞花手织毛线帽+雪白毛球，软糯保暖" },
    { id: "tier3_band",    slot: "hat", icon: "🔥", name: "疾风烈焰额带结",   price: 260,   grade: "craft",  minTier: 3, series: "战力限定", tags: ["Lv3", "烈焰"], desc: "认真兔专属限定：赤金烈焰飘带与火焰纹章" },
    { id: "beret_art",     slot: "hat", icon: "🎨", name: "复古羊毛贝雷帽",   price: 320,   grade: "craft",  series: "文艺穿搭", tags: ["贝雷帽", "复古"], desc: "斜戴酒红羊毛画家贝雷帽配金针胸徽，文艺范儿" },
    { id: "tier5_scouter", slot: "hat", icon: "📡", name: "赛亚战力探测镜",   price: 980,   grade: "luxury", minTier: 5, series: "战力限定", tags: ["Lv5", "探测镜"], desc: "超赛兔专属限定：翡翠全息HUD镜片实时扫描算力" },
    { id: "cc_pearl_hat",  slot: "hat", icon: "👒", name: "CC 双环珍珠礼帽",  price: 1880,  grade: "luxury", series: "顶奢高定", tags: ["高定", "珍珠", "礼帽"], desc: "高定象牙宽檐礼帽，黑丝缎带配虹彩珍珠链与双金环" },
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

    // outfit (服饰/披风)
    { id: "waste_letter",  slot: "outfit", icon: "📄", name: "废弃信纸小披风", price: 22,    grade: "basic",  series: "街头日常", tags: ["信纸", "新手"], desc: "泛黄方格信纸配红色邮票系成的迷你披风" },
    { id: "patch_scarf",   slot: "outfit", icon: "🧣", name: "补丁格子小围巾", price: 58,    grade: "basic",  series: "街头日常", tags: ["围巾", "保暖"], desc: "奶奶缝的红白拼布针织围巾，暖和又软萌" },
    { id: "hoodie_dev",    slot: "outfit", icon: "🧥", name: "码农深灰连帽卫衣", price: 220, grade: "craft",  series: "极客办公", tags: ["码农", "卫衣"], desc: "极客标配连帽抽绳卫衣配胸前像素胡萝卜标" },
    { id: "tier4_spark",   slot: "outfit", icon: "⚡", name: "雷电暴击金肩章", price: 480,   grade: "craft",  minTier: 4, series: "战力限定", tags: ["Lv4", "雷电"], desc: "暴击兔专属限定：双肩黄金战甲跃动高频暴击电弧" },
    { id: "trench_bb",     slot: "outfit", icon: "🧥", name: "BBR 经典格纹风衣", price: 1280, grade: "luxury", series: "顶奢高定", tags: ["风衣", "英伦", "高定"], desc: "英伦驼色双排扣翻领风衣，格纹内衬与腰带扣" },
    { id: "tier6_collar",  slot: "outfit", icon: "😈", name: "暗红魔纹尖刺领", price: 2680,  grade: "luxury", minTier: 6, series: "战力限定", tags: ["Lv6", "魔纹"], desc: "红魔兔专属限定：黑曜天鹅绒立领配血钻魔纹胸针" },
    { id: "h_silk_cape",   slot: "outfit", icon: "🧣", name: "HM 橘橙真丝斗篷", price: 4800, grade: "mythic", series: "顶奢高定", tags: ["高定", "真丝", "斗篷"], desc: "爱马橘真丝缎面垂坠斗篷，鎏金马衔链扣与滚金边" },
    {
      id: "secret_nebula_mantle", slot: "outfit", icon: "🌌", name: "极光星穹帝王袍", price: 24800, grade: "secret", secret: true,
      series: "太初隐藏", tags: ["隐藏", "帝王袍", "星云"],
      desc: "深空星云织锦礼袍配24K星仪金肩甲、翡翠星扣与流动星尘下摆",
      unlockReq: { needWear: "h_silk_cape", orTier: 9, label: "拥有「HM 橘橙真丝斗篷」或达到 Lv.9 创世飞升兔" },
    },

    // acc (包包/配饰)
    { id: "plastic_bag",   slot: "acc", icon: "🛍️", name: "透明菜篮小拎袋",   price: 28,    grade: "basic",  series: "街头日常", tags: ["菜篮", "新手"], desc: "拎着一根新鲜脆萝卜的接地气半透明买菜袋" },
    { id: "canvas_tote",   slot: "acc", icon: "🎒", name: "复古帆布小书包",   price: 120,   grade: "craft",  series: "文艺穿搭", tags: ["帆布包", "日常"], desc: "百搭米白斜挎帆布包配焦糖皮扣，装满生产力" },
    { id: "iv_bucket",     slot: "acc", icon: "👜", name: "IV 老花水桶包包",  price: 1480,  grade: "luxury", series: "顶奢高定", tags: ["包包", "老花", "高定"], desc: "栗棕老花暗纹抽绳水桶包，植鞣皮提手与鎏金铭牌" },
    { id: "gci_shades",    slot: "acc", icon: "🕶️", name: "GCI 复古金边墨镜", price: 2180,  grade: "luxury", series: "顶奢高定", tags: ["墨镜", "高定"], desc: "琥珀渐变金丝双梁大牌墨镜，自带高光流闪" },
    { id: "tier8_scepter", slot: "acc", icon: "👑", name: "星渊星辰维度权杖", price: 6400,  grade: "mythic", minTier: 8, series: "战力限定", tags: ["Lv8", "权杖"], desc: "星渊霸王兔专属限定：浮空黄金星环权杖与旋转星芒" },
    { id: "rlx_watch",     slot: "acc", icon: "⌚", name: "RLX 绿水鬼机械表", price: 7800,  grade: "mythic", series: "顶奢高定", tags: ["机械表", "绿水鬼", "顶奢"], desc: "18K金狗牙圈翡翠太阳纹表盘，放大镜日历与金链光泽" },
    { id: "tier10_orb",    slot: "acc", icon: "🛸", name: "量子浮游星能炮",   price: 12800, grade: "mythic", minTier: 10, series: "战力限定", tags: ["50B", "浮游炮"], desc: "50B 隐藏款专属限定：双翼棱镜浮游炮与量子光环" },
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
  ];

  // ---- Extensible Plugin SVG Art Registry (for 300+ future decors/wearables/houses) ----
  const decorArtMap = new Map();
  const wearArtMap = new Map();
  const houseArtMap = new Map();

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
      <!-- Wrapped Christmas gifts under tree -->
      <rect x="-24" y="-8" width="13" height="10" rx="1.5" fill="#ef4444" stroke="#991b1b" stroke-width="0.9"/>
      <line x1="-17.5" y1="-8" x2="-17.5" y2="2" stroke="#fde047" stroke-width="1.8"/>
      <rect x="11" y="-9" width="13" height="11" rx="1.5" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.9"/>
      <line x1="17.5" y1="-9" x2="17.5" y2="2" stroke="#fde047" stroke-width="1.8"/>
      <!-- Layered pine tree boughs -->
      <polygon points="0,-78 -26,-12 26,-12" fill="#15803d" stroke="#14532d" stroke-width="1.2"/>
      <polygon points="0,-84 -21,-32 21,-32" fill="#16a34a" stroke="#14532d" stroke-width="1.1"/>
      <polygon points="0,-90 -15,-52 15,-52" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
      <!-- Twinkling ornaments & gold garland -->
      <path d="M-11 -56 Q0 -48 11 -56 M-17 -36 Q0 -26 17 -36 M-22 -18 Q0 -10 22 -18" fill="none" stroke="#fde047" stroke-width="1.2" opacity="0.82"/>
      <circle cx="-8" cy="-42" r="2.4" fill="#ef4444" class="h-twinkle"/>
      <circle cx="9" cy="-46" r="2.2" fill="#38bdf8" class="h-twinkle-d1"/>
      <circle cx="0" cy="-30" r="2.5" fill="#fde047" class="h-twinkle-d2"/>
      <circle cx="-13" cy="-22" r="2.3" fill="#f472b6" class="h-twinkle"/>
      <circle cx="13" cy="-22" r="2.3" fill="#ef4444" class="h-twinkle-d1"/>
      <!-- Glowing golden star topper -->
      <path d="M0 -98 L2.6 -92 L9 -91.2 L4.2 -86.8 L5.5 -80.5 L0 -83.8 L-5.5 -80.5 L-4.2 -86.8 L-9 -91.2 L-2.6 -92 Z" fill="#fde047" stroke="#f59e0b" stroke-width="0.7" filter="url(#hsGlowSm)" class="h-pulse"/>
    </g>
  `);

  // Register handcrafted SVG art for the 4 flagship festival wearable items (36x36 bunny coordinates)
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
      return cur >= start || cur <= end; // wraps across New Year
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
    // Secret items & limited event items keep their prestige price unless item explicitly defines salePrice
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

  // ---- O(1) Indexed Maps + Pre-computed Search Haystacks (Scales cleanly to 1000+ items!) ----
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

  function getHouseRentPrice(house, days, activeEvents = []) {
    if (!house || !house.rentable) return null;
    const base = days >= 30
      ? (house.rent30d || Math.max(10, Math.round(house.price * 0.2)))
      : (house.rent7d || Math.max(5, Math.round(house.price * 0.06)));
    return getEffectivePrice({ ...house, price: base }, activeEvents);
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

    // O(1) indexed getters
    getHouse: (id) => houseById.get(id) || null,
    getDecor: (id) => decorById.get(id) || null,
    getWearable: (id) => wearById.get(id) || null,
    getDecorsBySlot: (slot) => decorsBySlot.get(slot) || [],
    getWearsBySlot: (slot) => wearsBySlot.get(slot) || [],

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

    // Plugin registration API for adding 100s of items or new events dynamically
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
    getDecorArt(id, ctx)     { const fn = decorArtMap.get(id); return fn ? fn(ctx) : ""; },
    getWearArt(id, pfx)      { const fn = wearArtMap.get(id);  return fn ? fn(pfx || "st") : ""; },
    getHouseArt(id, dp)      { const fn = houseArtMap.get(id); return fn ? fn(dp) : ""; },
  };

  global.TooTooRegistry = Registry;
})(typeof window !== "undefined" ? window : globalThis);
