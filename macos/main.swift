import AppKit
import CoreFoundation
import Foundation
import IOKit.pwr_mgt
import WebKit

// MARK: - 9-Tier Bunny Evolution Helper

struct BunnyTierInfo {
    let level: Int
    let name: String
    let minTokens: Double
}

let BUNNY_TIERS: [BunnyTierInfo] = [
    BunnyTierInfo(level: 1, name: "软萌兔", minTokens: 0),
    BunnyTierInfo(level: 2, name: "热身兔", minTokens: 10_000_000),
    BunnyTierInfo(level: 3, name: "认真兔", minTokens: 30_000_000),
    BunnyTierInfo(level: 4, name: "暴击兔", minTokens: 100_000_000),
    BunnyTierInfo(level: 5, name: "超赛爆气兔", minTokens: 300_000_000),
    BunnyTierInfo(level: 6, name: "红魔兔", minTokens: 600_000_000),
    BunnyTierInfo(level: 7, name: "狱火魔神兔", minTokens: 1_000_000_000),
    BunnyTierInfo(level: 8, name: "星渊霸王兔", minTokens: 1_500_000_000),
    BunnyTierInfo(level: 9, name: "创世飞升兔", minTokens: 3_000_000_000),
    BunnyTierInfo(level: 10, name: "奇点终焉兔", minTokens: 50_000_000_000),
]

func bunnyTier(for tokens: Double) -> BunnyTierInfo {
    var cur = BUNNY_TIERS[0]
    for t in BUNNY_TIERS {
        if tokens >= t.minTokens { cur = t }
    }
    return cur
}

// MARK: - 9-Tier Bunny Menu Bar Icon (Retina CoreGraphics Template)

func makeBunnyMenuBarIcon(tier: Int = 1, compactForBar: Bool = false) -> NSImage {
    let size = NSSize(width: 22, height: 18)
    let image = NSImage(size: size, flipped: false) { _ in
        guard let ctx = NSGraphicsContext.current?.cgContext else { return false }
        // Work in a 36x36 coordinate space (flipped vertically from SVG -> CoreGraphics bottom-up)
        if compactForBar {
            // Shrink & lift slightly so the bottom 2pt quota bar has clean breathing room below the bunny
            let scale: CGFloat = 14.2 / 36.0
            ctx.translateBy(x: (22.0 - 14.2) / 2.0, y: 17.5)
            ctx.scaleBy(x: scale, y: -scale)
        } else {
            let scale: CGFloat = 18.0 / 36.0
            ctx.translateBy(x: 2.0, y: 18.0)
            ctx.scaleBy(x: scale, y: -scale)
        }

        func fillRect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ r: CGFloat) {
            NSBezierPath(roundedRect: NSRect(x: x, y: y, width: w, height: h), xRadius: r, yRadius: r).fill()
        }

        func rotatedEar(cx: CGFloat, cy: CGFloat, deg: CGFloat, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat, r: CGFloat) {
            ctx.saveGState()
            ctx.translateBy(x: cx, y: cy)
            ctx.rotate(by: deg * .pi / 180.0)
            ctx.translateBy(x: -cx, y: -cy)
            fillRect(x, y, w, h, r)
            ctx.restoreGState()
        }

        func fillPoly(_ pts: [(CGFloat, CGFloat)]) {
            guard let first = pts.first else { return }
            let p = NSBezierPath()
            p.move(to: NSPoint(x: first.0, y: first.1))
            for pt in pts.dropFirst() { p.line(to: NSPoint(x: pt.0, y: pt.1)) }
            p.close()
            p.fill()
        }

        NSColor.black.setFill()
        NSColor.black.setStroke()

        switch tier {
        case 2: // 热身兔: headband + flying tails
            rotatedEar(cx: 13, cy: 15, deg: -11, x: 9.5, y: 3.0, w: 5.5, h: 14.0, r: 2.75)
            rotatedEar(cx: 23, cy: 15, deg: 11, x: 21.0, y: 3.0, w: 5.5, h: 14.0, r: 2.75)
            let tail = NSBezierPath()
            tail.lineWidth = 2.4; tail.lineCapStyle = .round
            tail.move(to: NSPoint(x: 28, y: 17.5)); tail.line(to: NSPoint(x: 34.5, y: 16.0))
            tail.move(to: NSPoint(x: 28, y: 19.5)); tail.line(to: NSPoint(x: 33.8, y: 21.2))
            tail.stroke()
            fillRect(6.5, 13.5, 23.0, 18.0, 9.0)
            ctx.setBlendMode(.clear)
            fillRect(7.0, 17.0, 22.0, 2.3, 0.8)
            NSBezierPath(ovalIn: NSRect(x: 12.1, y: 21.4, width: 3.3, height: 3.3)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.6, y: 21.4, width: 3.3, height: 3.3)).fill()

        case 3: // 认真兔: headband + flowing tails + sharp focused brows & locked-in eyes
            rotatedEar(cx: 13, cy: 15, deg: -12, x: 9.5, y: 2.8, w: 5.4, h: 13.6, r: 2.7)
            rotatedEar(cx: 23, cy: 15, deg: 12, x: 21.1, y: 2.8, w: 5.4, h: 13.6, r: 2.7)
            let tail = NSBezierPath()
            tail.lineWidth = 2.4; tail.lineCapStyle = .round
            tail.move(to: NSPoint(x: 27.5, y: 17.6)); tail.line(to: NSPoint(x: 34.8, y: 15.8))
            tail.move(to: NSPoint(x: 27.6, y: 19.6)); tail.line(to: NSPoint(x: 34.2, y: 22.0))
            tail.stroke()
            fillRect(6.5, 13.8, 23.0, 17.8, 8.9)
            ctx.setBlendMode(.clear)
            fillRect(7.4, 17.3, 21.2, 2.2, 0.8)
            let brows = NSBezierPath()
            brows.lineWidth = 2.0; brows.lineCapStyle = .round
            brows.move(to: NSPoint(x: 10.4, y: 20.2)); brows.line(to: NSPoint(x: 15.6, y: 21.6))
            brows.move(to: NSPoint(x: 25.6, y: 20.2)); brows.line(to: NSPoint(x: 20.4, y: 21.6))
            brows.stroke()
            NSBezierPath(ovalIn: NSRect(x: 11.8, y: 22.0, width: 3.0, height: 3.0)).fill()
            NSBezierPath(ovalIn: NSRect(x: 21.2, y: 22.0, width: 3.0, height: 3.0)).fill()

        case 4: // 暴击兔: clean round head + blazing lightning crest + crit eyes
            rotatedEar(cx: 12, cy: 15, deg: -16, x: 8.8, y: 3.8, w: 5.2, h: 13.2, r: 2.6)
            rotatedEar(cx: 24, cy: 15, deg: 16, x: 22.0, y: 3.8, w: 5.2, h: 13.2, r: 2.6)
            // Lightning bolt crest between ears
            fillPoly([(19.6, 2.0), (15.2, 9.2), (18.2, 9.2), (16.4, 15.0), (21.2, 7.6), (18.2, 7.6)])
            fillRect(6.5, 14.0, 23.0, 17.6, 8.8)
            ctx.setBlendMode(.clear)
            fillPoly([(10.6, 19.8), (16.0, 21.4), (11.5, 23.4)])
            fillPoly([(25.4, 19.8), (20.0, 21.4), (24.5, 23.4)])

        case 5: // 超赛爆气兔: spiky aura + upright hair tufts
            let aura = NSBezierPath()
            let pts: [(CGFloat, CGFloat)] = [
                (18, 1), (21.5, 6.5), (28, 4.5), (26.5, 11.5), (33.8, 13), (29.5, 19),
                (33.2, 26), (27, 29.5), (18, 32), (9, 29.5), (2.8, 26), (6.5, 19),
                (2.2, 13), (9.5, 11.5), (8, 4.5), (14.5, 6.5)
            ]
            aura.move(to: NSPoint(x: pts[0].0, y: pts[0].1))
            for pt in pts.dropFirst() { aura.line(to: NSPoint(x: pt.0, y: pt.1)) }
            aura.close()
            aura.lineWidth = 1.9
            aura.stroke()
            rotatedEar(cx: 13, cy: 15, deg: -14, x: 10.0, y: 3.5, w: 5.0, h: 12.5, r: 2.2)
            rotatedEar(cx: 23, cy: 15, deg: 14, x: 21.0, y: 3.5, w: 5.0, h: 12.5, r: 2.2)
            fillRect(7.5, 14.0, 21.0, 16.5, 8.0)
            ctx.setBlendMode(.clear)
            NSBezierPath(ovalIn: NSRect(x: 12.3, y: 20.0, width: 3.3, height: 3.3)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.4, y: 20.0, width: 3.3, height: 3.3)).fill()

        case 6: // 红魔兔: curved devil horns + slanted eyes
            rotatedEar(cx: 12, cy: 15, deg: -18, x: 8.4, y: 4.2, w: 5.0, h: 13.0, r: 2.5)
            rotatedEar(cx: 24, cy: 15, deg: 18, x: 22.6, y: 4.2, w: 5.0, h: 13.0, r: 2.5)
            fillPoly([(13.5, 14.5), (11.5, 8.2), (15.5, 5.5), (14.8, 10.2), (16.5, 14.0)])
            fillPoly([(22.5, 14.5), (24.5, 8.2), (20.5, 5.5), (21.2, 10.2), (19.5, 14.0)])
            fillRect(6.5, 13.8, 23.0, 17.8, 8.8)
            ctx.setBlendMode(.clear)
            fillPoly([(10.5, 19.5), (16.2, 21.6), (11.4, 23.4)])
            fillPoly([(25.5, 19.5), (19.8, 21.6), (24.6, 23.4)])

        case 7: // 狱火魔神兔: grand horns + bat wings + third eye
            fillPoly([(7.0, 21.5), (1.0, 14.2), (2.4, 24.8), (7.2, 26.2)])
            fillPoly([(29.0, 21.5), (35.0, 14.2), (33.6, 24.8), (28.8, 26.2)])
            rotatedEar(cx: 12, cy: 15, deg: -22, x: 8.2, y: 4.5, w: 4.8, h: 12.5, r: 2.4)
            rotatedEar(cx: 24, cy: 15, deg: 22, x: 23.0, y: 4.5, w: 4.8, h: 12.5, r: 2.4)
            fillPoly([(13.2, 14.8), (10.5, 8.0), (15.8, 2.2), (14.6, 8.5), (16.4, 14.0)])
            fillPoly([(22.8, 14.8), (25.5, 8.0), (20.2, 2.2), (21.4, 8.5), (19.6, 14.0)])
            fillRect(6.8, 14.0, 22.4, 17.6, 8.5)
            ctx.setBlendMode(.clear)
            fillPoly([(18.0, 15.6), (19.5, 17.8), (18.0, 20.0), (16.5, 17.8)])
            fillPoly([(10.5, 20.6), (16.0, 22.4), (11.4, 24.0)])
            fillPoly([(25.5, 20.6), (20.0, 22.4), (24.6, 24.0)])

        case 8: // 星渊霸王兔: royal crown between ears
            rotatedEar(cx: 12, cy: 16, deg: -16, x: 8.6, y: 4.2, w: 5.2, h: 13.0, r: 2.6)
            rotatedEar(cx: 24, cy: 16, deg: 16, x: 22.2, y: 4.2, w: 5.2, h: 13.0, r: 2.6)
            fillPoly([(12.8, 14.2), (13.6, 7.2), (16.2, 10.5), (18.0, 5.5), (19.8, 10.5), (22.4, 7.2), (23.2, 14.2)])
            fillRect(6.5, 14.2, 23.0, 17.6, 8.8)
            ctx.setBlendMode(.clear)
            NSBezierPath(ovalIn: NSRect(x: 12.0, y: 20.4, width: 3.4, height: 3.4)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.6, y: 20.4, width: 3.4, height: 3.4)).fill()

        case 9: // 创世飞升兔: floating halo + angel wings
            let halo = NSBezierPath(ovalIn: NSRect(x: 9.6, y: 1.0, width: 16.8, height: 4.2))
            halo.lineWidth = 2.0
            halo.stroke()
            fillPoly([(6.8, 21.0), (1.0, 16.2), (2.4, 24.8), (7.0, 25.4)])
            fillPoly([(29.2, 21.0), (35.0, 16.2), (33.6, 24.8), (29.0, 25.4)])
            rotatedEar(cx: 13, cy: 16, deg: -11, x: 9.6, y: 5.8, w: 5.4, h: 12.0, r: 2.7)
            rotatedEar(cx: 23, cy: 16, deg: 11, x: 21.0, y: 5.8, w: 5.4, h: 12.0, r: 2.7)
            fillRect(6.5, 14.6, 23.0, 17.2, 8.6)
            ctx.setBlendMode(.clear)
            NSBezierPath(ovalIn: NSRect(x: 12.0, y: 20.8, width: 3.4, height: 3.4)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.6, y: 20.8, width: 3.4, height: 3.4)).fill()

        case 10: // EX 奇点终焉兔 (50B): diamond singularity star + orbital ring + cosmic wings
            let orbit = NSBezierPath(ovalIn: NSRect(x: 2.2, y: 9.8, width: 31.6, height: 6.4))
            orbit.lineWidth = 1.6
            orbit.stroke()
            fillPoly([(18.0, 0.8), (20.4, 4.6), (18.0, 8.2), (15.6, 4.6)])
            fillPoly([(6.5, 19.5), (0.8, 13.0), (2.0, 25.5), (7.0, 26.8)])
            fillPoly([(29.5, 19.5), (35.2, 13.0), (34.0, 25.5), (29.0, 26.8)])
            rotatedEar(cx: 13, cy: 16, deg: -14, x: 9.2, y: 5.6, w: 5.2, h: 12.0, r: 2.6)
            rotatedEar(cx: 23, cy: 16, deg: 14, x: 21.6, y: 5.6, w: 5.2, h: 12.0, r: 2.6)
            fillRect(6.8, 14.6, 22.4, 17.2, 8.6)
            ctx.setBlendMode(.clear)
            fillPoly([(13.6, 19.8), (15.6, 22.2), (13.6, 24.6), (11.6, 22.2)])
            fillPoly([(22.4, 19.8), (24.4, 22.2), (22.4, 24.6), (20.4, 22.2)])

        default: // Lv.1 软萌兔
            rotatedEar(cx: 13, cy: 15, deg: -9, x: 9.5, y: 3.0, w: 5.6, h: 14.0, r: 2.8)
            rotatedEar(cx: 23, cy: 15, deg: 13, x: 20.8, y: 3.5, w: 5.6, h: 13.5, r: 2.8)
            fillRect(6.5, 13.5, 23.0, 18.2, 9.1)
            ctx.setBlendMode(.clear)
            NSBezierPath(ovalIn: NSRect(x: 12.1, y: 19.6, width: 3.4, height: 3.8)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.5, y: 19.6, width: 3.4, height: 3.8)).fill()
            fillRect(16.6, 23.4, 2.8, 1.7, 0.85)
        }

        ctx.setBlendMode(.normal)
        return true
    }
    image.isTemplate = true
    return image
}

// MARK: - Free Port Finder

func findFreePort(preferred: UInt16 = 17891) -> UInt16 {
    func tryBind(_ port: UInt16) -> UInt16? {
        let sock = socket(AF_INET, SOCK_STREAM, 0)
        guard sock >= 0 else { return nil }
        defer { close(sock) }
        var opt: Int32 = 1
        setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, socklen_t(MemoryLayout<Int32>.size))
        var addr = sockaddr_in()
        addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = port.bigEndian
        addr.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))
        let res = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard res == 0 else { return nil }
        var assigned = sockaddr_in()
        var len = socklen_t(MemoryLayout<sockaddr_in>.size)
        let ok = withUnsafeMutablePointer(to: &assigned) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                getsockname(sock, $0, &len)
            }
        }
        guard ok == 0 else { return nil }
        return UInt16(bigEndian: assigned.sin_port)
    }
    if let p = tryBind(preferred) { return p }
    return tryBind(0) ?? preferred
}

// MARK: - Popover WebView Controller

class TelemetryWebViewController: NSViewController, WKScriptMessageHandler, WKNavigationDelegate {
    let url: URL
    let onAction: (String, [String: Any]) -> Void
    var onPageReady: (() -> Void)?
    private(set) var isPageReady = false
    private var needsTelemetryRefresh = false
    private var webView: WKWebView!

    init(url: URL, size: NSSize, onAction: @escaping (String, [String: Any]) -> Void) {
        self.url = url
        self.onAction = onAction
        super.init(nibName: nil, bundle: nil)
        self.preferredContentSize = size
    }

    required init?(coder: NSCoder) { fatalError() }

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "tootoo")
        let wv = WKWebView(frame: NSRect(origin: .zero, size: preferredContentSize), configuration: config)
        wv.setValue(false, forKey: "drawsBackground")
        wv.navigationDelegate = self
        self.webView = wv
        self.view = wv
        wv.load(URLRequest(url: url))
    }

    func evalJS(_ js: String) {
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func requestTelemetryRefresh() {
        guard isPageReady else {
            needsTelemetryRefresh = true
            return
        }
        evalJS("window.__refreshTelemetry && window.__refreshTelemetry();")
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isPageReady = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isPageReady = true
        onPageReady?()
        if needsTelemetryRefresh {
            needsTelemetryRefresh = false
            requestTelemetryRefresh()
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let target = navigationAction.request.url else { decisionHandler(.cancel); return }
        if matchesAppPage(target) {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            if navigationAction.navigationType == .linkActivated, target.scheme == "https" {
                NSWorkspace.shared.open(target)
            }
        }
    }

    private func matchesAppPage(_ target: URL) -> Bool {
        target.scheme == url.scheme && target.host == url.host && target.port == url.port
            && target.path == url.path && target.user == nil && target.password == nil
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if let dict = message.body as? [String: Any], let action = dict["action"] as? String {
            let privileged = ["getKeepAwakeState", "setKeepAwake", "getUpdateState", "checkForUpdate", "installUpdate", "openUpdateRelease"]
            if privileged.contains(action) {
                guard message.frameInfo.isMainFrame, let frameURL = message.frameInfo.request.url,
                      matchesAppPage(frameURL) else { return }
            }
            DispatchQueue.main.async {
                self.onAction(action, dict)
            }
        }
    }
}

// MARK: - Main App Delegate

// Configurable menu bar fields in display order
let ALL_MENUBAR_FIELDS: [(key: String, label: String)] = [
    ("tokens",  "用量 (Tokens)"),
    ("cost",    "费用 ($)"),
    ("tps",     "速度 (TPS)"),
    ("ttft",    "首字 (TTFT)"),
    ("q_gem5h", "Gemini 5h 剩余额度"),
    ("q_gem7d", "Gemini 周 剩余额度"),
    ("q_cg5h",  "C/G 5h 剩余额度"),
    ("q_cg7d",  "C/G 周 剩余额度"),
    ("q_argon7d", "Gemini 4 Argon 周额度"),
    ("q_codex", "Codex 剩余额度"),
    ("q_grokbot", "Grok Bot 周剩余额度"),
]

struct TodayMetrics {
    let tokens: Double
    let effectiveTodayTokens: Double
    let cost: Double
    let tps: Double?
    let ttft: Double?
    let gem5hRem: Int?
    let gem7dRem: Int?
    let cg5hRem: Int?
    let cg7dRem: Int?
    let argon7dRem: Int?
    let codexRem: Int?
    let codexWeekly: Bool
    let grokBotWeeklyRem: Int?
}

// Bottom micro quota bar options for menu bar
let ALL_QUOTA_BAR_MODES: [(key: String, label: String)] = [
    ("none",  "关闭"),
    ("auto",  "自动"),
    ("gem5h", "Gemini 5h"),
    ("gem7d", "Gemini 周"),
    ("cg5h",  "C/G 5h"),
    ("cg7d", "C/G 周"),
    ("argon7d", "Gemini 4 Argon 周额度"),
    ("codex", "Codex 周"),
    ("grokbot", "Grok Bot 周剩余额度"),
]

func selectQuotaBar(mode: String, bars: [(key: String, remaining: Int?, label: String)]) -> (key: String, remaining: Int?, label: String)? {
    if mode == "none" { return nil }
    if mode == "auto" { return bars.first { $0.remaining != nil } }
    return bars.first { $0.key == mode }
}

func grokBotWeeklyRemaining(_ quotas: [String: Any], now: TimeInterval = Date().timeIntervalSince1970) -> Int? {
    guard let grok = quotas["grokbot"] as? [String: Any],
          (grok["state"] as? String) != "expired",
          let buckets = grok["buckets"] as? [[String: Any]] else { return nil }
    if let rawExpiry = grok["expires_at"], !(rawExpiry is NSNull) {
        guard let expiry = rawExpiry as? NSNumber, CFGetTypeID(expiry) != CFBooleanGetTypeID(),
              expiry.doubleValue.isFinite, expiry.doubleValue > now else { return nil }
    }
    for bucket in buckets where (bucket["key"] as? String) == "grokbot:weekly" {
        guard let amount = bucket["used_percent"] as? NSNumber,
              CFGetTypeID(amount) != CFBooleanGetTypeID() else { continue }
        let used = amount.doubleValue
        guard used.isFinite, (0.0...100.0).contains(used) else { continue }
        if let rawReset = bucket["resets_at"], !(rawReset is NSNull) {
            guard let reset = rawReset as? NSNumber, CFGetTypeID(reset) != CFBooleanGetTypeID(),
                  reset.doubleValue.isFinite, reset.doubleValue > now else { continue }
        }
        return Int((100.0 - used).rounded())
    }
    return nil
}

class MenuBarQuotaBarView: NSView {
    var percent: Int? = nil { didSet { needsDisplay = true } }

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func draw(_ dirtyRect: NSRect) {
        guard let pct = percent else { return }
        let clamped = CGFloat(max(0, min(100, pct))) / 100.0
        let barRect = NSRect(x: 0, y: 0, width: bounds.width, height: bounds.height)
        guard barRect.width >= 8 else { return }
        let radius = barRect.height / 2.0

        // Subtle track that adapts to light/dark menu bar
        let isDark = effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        let trackColor = isDark
            ? NSColor.white.withAlphaComponent(0.24)
            : NSColor.black.withAlphaComponent(0.18)
        trackColor.setFill()
        NSBezierPath(roundedRect: barRect, xRadius: radius, yRadius: radius).fill()

        // Remaining quota fill (healthy teal/green -> low amber -> critical red)
        let fillW = max(barRect.height, barRect.width * clamped)
        let fillRect = NSRect(x: 0, y: 0, width: min(barRect.width, fillW), height: barRect.height)
        let fillColor: NSColor
        if pct <= 15 {
            fillColor = NSColor(srgbRed: 0.94, green: 0.27, blue: 0.27, alpha: 0.98)
        } else if pct <= 30 {
            fillColor = NSColor(srgbRed: 0.96, green: 0.62, blue: 0.05, alpha: 0.98)
        } else {
            fillColor = isDark
                ? NSColor(srgbRed: 0.20, green: 0.85, blue: 0.65, alpha: 0.98)
                : NSColor(srgbRed: 0.05, green: 0.58, blue: 0.45, alpha: 0.98)
        }
        fillColor.setFill()
        NSBezierPath(roundedRect: fillRect, xRadius: radius, yRadius: radius).fill()
    }
}

#if TOOTOO_DEBUG
private let variantName = "TooToo-Debug"
private let variantPreferredPort: UInt16 = 17892
private let variantMenuPrefix = " DBG"
private let keepAwakeReason = "TooToo-Debug Keep Awake (AI Coding)"
#else
private let variantName = "TooToo"
private let variantPreferredPort: UInt16 = 17891
private let variantMenuPrefix = ""
private let keepAwakeReason = "TooToo Keep Awake (AI Coding)"
#endif

class AppDelegate: NSObject, NSApplicationDelegate, NSPopoverDelegate {
    private var statusItem: NSStatusItem!
    private var quotaBarView: MenuBarQuotaBarView?
    private var popover: NSPopover!
    private lazy var popoverLifecycle = PopoverLifecycle { [weak self] snapshot in
        self?.popoverVC?.evalJS(snapshot.javaScript)
    }
    private var popoverVC: TelemetryWebViewController?
    private var fullWindow: NSWindow?
    private var fullWindowVC: TelemetryWebViewController?
    private var backendProcess: Process?
    private var port: UInt16 = variantPreferredPort
    private let quotaForceToken = UUID().uuidString + UUID().uuidString
    private var statusTimer: Timer?
    private var eventMonitor: Any?
    private var menuBarFields: [String] = ["tokens", "cost"]
    private var menuBarQuotaBar: String = "auto"
    private let keepAwakeDurations = [0, 60, 120, 240, 480]
    private var keepAwakeMode = "off"
    private var preferredKeepAwakeMode = "system"
    private var keepAwakeDurationMin = 0
    private var keepAwakeExpiresAt: Date?
    private var keepAwakeAssertionID: IOPMAssertionID?
    private var keepAwakeTimer: Timer?
    private var keepAwakeError: String?
    private var baseStatusToolTip = variantName
    private var currentTier: BunnyTierInfo = BUNNY_TIERS[0]
    private var lastMetrics: TodayMetrics?
    private var issuedSummaryRefresh: UInt64 = 0
    private var appliedSummaryRefresh: UInt64 = 0
    #if TOOTOO_MENU_SMOKE
    private var smokeSummaryCompletions = 0
    #endif
    private var showUpdateSettingsWhenLoaded = false
    private lazy var updateController = NativeUpdateController(backendIsRunning: { [weak self] in
        self?.backendProcess?.isRunning == true
    }, executable: { [weak self] in
        self?.findPythonExecutable() ?? "/usr/bin/python3"
    }, publishState: { [weak self] js in
        self?.popoverVC?.evalJS(js)
        self?.fullWindowVC?.evalJS(js)
    })
    #if TOOTOO_DEBUG
    private var debugTierOverride: Int? = nil
    #endif

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        if let saved = UserDefaults.standard.array(forKey: "tootoo_menubar_fields") as? [String] {
            menuBarFields = saved
        } else {
            // Default: Tokens · Cost (configurable anytime)
            menuBarFields = ["tokens", "cost"]
        }
        if let savedBar = UserDefaults.standard.string(forKey: "tootoo_menubar_quota_bar"),
           ALL_QUOTA_BAR_MODES.contains(where: { $0.key == savedBar }) {
            menuBarQuotaBar = savedBar
        } else {
            menuBarQuotaBar = "auto"
        }

        let defaults = keepAwakeDefaults
        if let savedMode = defaults.string(forKey: "tootoo_keep_awake_mode"),
           ["system", "display"].contains(savedMode) {
            preferredKeepAwakeMode = savedMode
        }
        let savedDuration = defaults.integer(forKey: "tootoo_keep_awake_duration")
        if keepAwakeDurations.contains(savedDuration) { keepAwakeDurationMin = savedDuration }
        #if TOOTOO_KEEP_AWAKE_SMOKE
        if ProcessInfo.processInfo.arguments.contains("--keep-awake-ci") {
            startKeepAwakeSmoke()
            return
        }
        #endif

        #if TOOTOO_MENU_SMOKE
        let args = ProcessInfo.processInfo.arguments
        if args.count == 3, args[1] == "--menu-summary-ci", let fixturePort = UInt16(args[2]) {
            startMenuSummarySmoke(port: fixturePort)
            return
        }
        #endif

        port = findFreePort(preferred: variantPreferredPort)
        startBackend()
        setupStatusItem()
        setupPopover()
        updateController.start(port: port)

        waitForBackend { [weak self] in
            self?.refreshMenuBarSummary()
            self?.prewarmPopover()
        }

        statusTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.refreshMenuBarSummary()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        keepAwakeTimer?.invalidate()
        _ = releaseKeepAwakeAssertion()
        stopBackend()
    }

    // MARK: Keep Awake

    private var keepAwakeDefaults: UserDefaults {
        #if TOOTOO_KEEP_AWAKE_SMOKE
        if ProcessInfo.processInfo.arguments.contains("--keep-awake-ci"),
           let suite = ProcessInfo.processInfo.environment["TOOTOO_KEEP_AWAKE_CI_SUITE"],
           let defaults = UserDefaults(suiteName: suite) { return defaults }
        #endif
        return .standard
    }

    /// Keep the tracked ID if IOKit ever refuses to release it. Never create a
    /// second assertion while the old one might still be held.
    @discardableResult
    private func releaseKeepAwakeAssertion() -> Bool {
        guard let id = keepAwakeAssertionID else { return true }
        guard IOPMAssertionRelease(id) == kIOReturnSuccess else { return false }
        keepAwakeAssertionID = nil
        return true
    }

    private func applyKeepAwake(mode: String, durationMin: Int, persist: Bool) {
        guard ["off", "system", "display"].contains(mode),
              keepAwakeDurations.contains(durationMin) else { return }

        keepAwakeError = nil
        guard releaseKeepAwakeAssertion() else {
            keepAwakeError = "未能关闭防休眠，请重试或退出 \(variantName)。"
            syncKeepAwakeToWeb()
            return
        }
        keepAwakeTimer?.invalidate()
        keepAwakeTimer = nil
        keepAwakeExpiresAt = nil
        keepAwakeMode = "off"
        keepAwakeDurationMin = durationMin
        if persist {
            let defaults = keepAwakeDefaults
            defaults.set(durationMin, forKey: "tootoo_keep_awake_duration")
            if mode != "off" {
                preferredKeepAwakeMode = mode
                defaults.set(mode, forKey: "tootoo_keep_awake_mode")
            }
        }
        defer { syncKeepAwakeToWeb() }
        guard mode != "off" else { return }

        let assertionType = mode == "system"
            ? kIOPMAssertionTypePreventUserIdleSystemSleep
            : kIOPMAssertionTypePreventUserIdleDisplaySleep
        var id: IOPMAssertionID = 0
        let result = IOPMAssertionCreateWithName(assertionType as CFString,
                                                IOPMAssertionLevel(kIOPMAssertionLevelOn),
                                                keepAwakeReason as CFString, &id)
        guard result == kIOReturnSuccess else {
            keepAwakeError = "macOS 未能开启防休眠，请重试。"
            return
        }
        keepAwakeAssertionID = id
        keepAwakeMode = mode
        if durationMin > 0 {
            var seconds = Double(durationMin) * 60
            #if TOOTOO_KEEP_AWAKE_SMOKE
            if ProcessInfo.processInfo.arguments.contains("--keep-awake-ci") { seconds = 5 }
            #endif
            let expiry = Date().addingTimeInterval(seconds)
            keepAwakeExpiresAt = expiry
            scheduleKeepAwakeExpiry(at: expiry, durationMin: durationMin, retries: 3)
        }
    }

    private func scheduleKeepAwakeExpiry(at date: Date, durationMin: Int, retries: Int) {
        let timer = Timer(fire: date, interval: 0, repeats: false) { [weak self] fired in
            guard let self = self, self.keepAwakeTimer === fired else { return }
            self.applyKeepAwake(mode: "off", durationMin: durationMin, persist: false)
            // A failed release keeps the tracked ID, never creates another,
            // and only retries a few times after the deadline.
            if self.keepAwakeAssertionID != nil, retries > 0 {
                self.scheduleKeepAwakeExpiry(at: Date().addingTimeInterval(15),
                                             durationMin: durationMin, retries: retries - 1)
            }
        }
        keepAwakeTimer = timer
        RunLoop.main.add(timer, forMode: .common)
    }

    private func keepAwakeRemainingText() -> String {
        guard let expiry = keepAwakeExpiresAt else { return "" }
        let mins = max(0, Int(ceil(expiry.timeIntervalSinceNow / 60)))
        return " · 剩 " + (mins >= 60 ? "\(mins / 60) 小时 \(mins % 60) 分钟" : "\(mins) 分钟")
    }

    private func updateKeepAwakeToolTip() {
        let suffix = keepAwakeMode == "off" ? "" : " · ☕ 防休眠中" + keepAwakeRemainingText()
        statusItem?.button?.toolTip = baseStatusToolTip + suffix
    }

    private func syncKeepAwakeToWeb() {
        updateKeepAwakeToolTip()
        let state: [String: Any] = [
            "mode": keepAwakeMode,
            "preferredMode": preferredKeepAwakeMode,
            "durationMin": keepAwakeDurationMin,
            "expiresAt": keepAwakeExpiresAt.map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull(),
            "error": keepAwakeError as Any? ?? NSNull(),
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: state),
              let json = String(data: data, encoding: .utf8) else { return }
        let js = "window.__onKeepAwakeState && window.__onKeepAwakeState(\(json));"
        popoverVC?.evalJS(js)
        fullWindowVC?.evalJS(js)
    }

    private func makeKeepAwakeMenu() -> NSMenuItem {
        let submenu = NSMenu()
        let label = ["off": "关闭", "system": "防休眠（可息屏）", "display": "屏幕常亮"][keepAwakeMode] ?? "关闭"
        let status = NSMenuItem(title: "当前：\(label)\(keepAwakeRemainingText())", action: nil, keyEquivalent: "")
        status.isEnabled = false
        submenu.addItem(status)
        if let error = keepAwakeError {
            let item = NSMenuItem(title: error, action: nil, keyEquivalent: "")
            item.isEnabled = false
            submenu.addItem(item)
        }
        submenu.addItem(.separator())
        for (mode, title) in [("off", "关闭"), ("system", "开启：系统不休眠（允许息屏）"), ("display", "开启：保持屏幕常亮")] {
            let item = NSMenuItem(title: title, action: #selector(selectKeepAwakeMode(_:)), keyEquivalent: "")
            item.target = self
            item.representedObject = mode
            item.state = mode == keepAwakeMode ? .on : .off
            submenu.addItem(item)
        }
        submenu.addItem(.separator())
        for minutes in keepAwakeDurations {
            let item = NSMenuItem(title: minutes == 0 ? "不限时" : "\(minutes / 60) 小时",
                                  action: #selector(selectKeepAwakeDuration(_:)), keyEquivalent: "")
            item.target = self
            item.tag = minutes
            item.state = minutes == keepAwakeDurationMin ? .on : .off
            submenu.addItem(item)
        }
        let parent = NSMenuItem(title: "☕ 保持电脑唤醒", action: nil, keyEquivalent: "")
        parent.submenu = submenu
        return parent
    }

    @objc private func selectKeepAwakeMode(_ item: NSMenuItem) {
        guard let mode = item.representedObject as? String else { return }
        applyKeepAwake(mode: mode, durationMin: keepAwakeDurationMin, persist: true)
    }

    @objc private func selectKeepAwakeDuration(_ item: NSMenuItem) {
        applyKeepAwake(mode: keepAwakeMode, durationMin: item.tag, persist: true)
    }

    #if TOOTOO_KEEP_AWAKE_SMOKE
    private func startKeepAwakeSmoke() {
        print("TOOTOO_KEEP_AWAKE_CI_READY"); fflush(stdout)
        DispatchQueue.global(qos: .utility).async { [weak self] in
            while let line = readLine() {
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    let parts = line.split(separator: " ")
                    switch parts.first.map(String.init) {
                    case "quit": NSApp.terminate(nil)
                    case "state": break
                    default:
                        if parts.count == 2, let minutes = Int(parts[1]) {
                            self.applyKeepAwake(mode: String(parts[0]), durationMin: minutes, persist: true)
                        }
                    }
                    print("mode=\(self.keepAwakeMode) preferred=\(self.preferredKeepAwakeMode) duration=\(self.keepAwakeDurationMin)")
                    fflush(stdout)
                }
            }
        }
    }
    #endif

    // MARK: Backend Lifecycle

    private func findPythonExecutable() -> String {
        let candidates = [
            "/opt/homebrew/bin/python3",
            "/usr/local/bin/python3",
            "/usr/bin/python3",
        ]
        for c in candidates where FileManager.default.isExecutableFile(atPath: c) {
            return c
        }
        return "/usr/bin/python3"
    }

    private func startBackend() {
        guard let resPath = Bundle.main.resourcePath else { return }
        let serverScript = (resPath as NSString).appendingPathComponent("server.py")
        guard FileManager.default.fileExists(atPath: serverScript) else {
            NSLog("TooToo: server.py not found at %@", serverScript)
            return
        }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: findPythonExecutable())
        proc.arguments = [serverScript, "--host", "127.0.0.1", "--port", "\(port)", "--no-open"]
        proc.currentDirectoryURL = URL(fileURLWithPath: resPath)
        var env = ProcessInfo.processInfo.environment
        env["PYTHONUNBUFFERED"] = "1"
        env["PYTHONDONTWRITEBYTECODE"] = "1" // Keep the verified bundle’s resource seal intact.
        // New installs read automatically only after backend eligibility checks.
        // Respect an existing explicit AGY opt-out and administrator overrides.
        let agyOff = env["TOOTOO_AGY_CLI"] == "off" || UserDefaults.standard.bool(forKey: "agyQuotaAutoDisabled")
        env["TOOTOO_AGY_CLI"] = agyOff ? "off" : "auto"
        env["TOOTOO_CODEX_QUOTA_AUTO"] = env["TOOTOO_CODEX_QUOTA_AUTO"] == "off" ? "off" : "auto"
        env["TOOTOO_UPDATE_NONCE"] = updateController.backendNonce
        env["TOOTOO_QUOTA_FORCE_TOKEN"] = quotaForceToken
        #if TOOTOO_DEBUG
        env["TOOTOO_DEBUG"] = "1"
        if env["TOOTOO_HOME"]?.isEmpty != false && env["TOOTOO_DATA_DIR"]?.isEmpty != false {
            let home = env["HOME"].flatMap { $0.isEmpty ? nil : $0 } ?? NSHomeDirectory()
            env["TOOTOO_HOME"] = (home as NSString).appendingPathComponent(".tootoo-debug")
        }
        #else
        env.removeValue(forKey: "TOOTOO_DEBUG")
        #endif
        proc.environment = env
        proc.standardOutput = FileHandle.nullDevice
        proc.standardError = FileHandle.nullDevice

        do {
            try proc.run()
            self.backendProcess = proc
        } catch {
            NSLog("TooToo: failed to start backend: %@", error.localizedDescription)
        }
    }

    private func stopBackend() {
        if let proc = backendProcess, proc.isRunning {
            proc.terminate()
            proc.waitUntilExit()
        }
        backendProcess = nil
    }

    private func waitForBackend(attempts: Int = 30, completion: @escaping () -> Void) {
        guard attempts > 0 else { completion(); return }
        let url = URL(string: "http://127.0.0.1:\(port)/")!
        var req = URLRequest(url: url)
        req.timeoutInterval = 0.5
        URLSession.shared.dataTask(with: req) { _, resp, _ in
            if let http = resp as? HTTPURLResponse, http.statusCode == 200 {
                DispatchQueue.main.async { completion() }
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    self.waitForBackend(attempts: attempts - 1, completion: completion)
                }
            }
        }.resume()
    }

    // MARK: Status Bar & Menu

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        guard let button = statusItem.button else { return }
        button.image = makeBunnyMenuBarIcon()
        button.imagePosition = .imageLeading
        button.title = variantMenuPrefix.isEmpty ? " tootoo" : variantMenuPrefix
        button.toolTip = baseStatusToolTip
        button.font = NSFont.monospacedDigitSystemFont(ofSize: 11.5, weight: .medium)
        button.target = self
        button.action = #selector(statusBarClicked(_:))
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])

        let qv = MenuBarQuotaBarView(frame: .zero)
        qv.isHidden = true
        button.addSubview(qv)
        self.quotaBarView = qv
    }

    @objc private func statusBarClicked(_ sender: NSStatusBarButton) {
        guard let event = NSApp.currentEvent else {
            togglePopover()
            return
        }
        if event.type == .rightMouseUp || event.modifierFlags.contains(.control) {
            showContextMenu()
        } else {
            togglePopover()
        }
    }

    private func makeContextMenu() -> NSMenu {
        let menu = NSMenu()
        let tierItem = NSMenuItem(title: "当前形态：Lv.\(currentTier.level) \(currentTier.name)", action: nil, keyEquivalent: "")
        tierItem.isEnabled = false
        menu.addItem(tierItem)
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "打开完整大屏窗口", action: #selector(openFullWindow), keyEquivalent: "o")
        menu.addItem(withTitle: "在浏览器中打开", action: #selector(openInBrowser), keyEquivalent: "b")
        menu.addItem(withTitle: "立即刷新数据", action: #selector(manualRefresh), keyEquivalent: "r")
        menu.addItem(NSMenuItem.separator())

        let modeMenu = NSMenu()
        // Quick presets
        let presets: [(String, [String])] = [
            ("预设：用量 · 费用 (推荐)", ["tokens", "cost"]),
            ("预设：用量 · 费用 · Gemini 5h", ["tokens", "cost", "q_gem5h"]),
            ("预设：用量 · 费用 · Codex", ["tokens", "cost", "q_codex"]),
            ("预设：用量 · Gemini · Codex", ["tokens", "q_gem5h", "q_codex"]),
            ("预设：速度 · 用量", ["tps", "tokens"]),
            ("预设：仅小兔子图标", []),
        ]
        for (title, fields) in presets {
            let item = NSMenuItem(title: title, action: #selector(selectPreset(_:)), keyEquivalent: "")
            item.representedObject = fields
            item.state = (menuBarFields == fields) ? .on : .off
            modeMenu.addItem(item)
        }
        modeMenu.addItem(NSMenuItem.separator())
        // Individual toggles
        for f in ALL_MENUBAR_FIELDS {
            if f.key == "q_argon7d" && lastMetrics?.argon7dRem == nil && !menuBarFields.contains(f.key) { continue }
            if f.key == "q_grokbot" && lastMetrics?.grokBotWeeklyRem == nil && !menuBarFields.contains(f.key) { continue }
            let item = NSMenuItem(title: "显示 \(f.label)", action: #selector(toggleField(_:)), keyEquivalent: "")
            item.representedObject = f.key
            item.state = menuBarFields.contains(f.key) ? .on : .off
            modeMenu.addItem(item)
        }
        modeMenu.addItem(NSMenuItem.separator())
        let qBarHeader = NSMenuItem(title: "底部额度进度条", action: nil, keyEquivalent: "")
        qBarHeader.isEnabled = false
        modeMenu.addItem(qBarHeader)
        for q in ALL_QUOTA_BAR_MODES {
            if q.key == "argon7d" && lastMetrics?.argon7dRem == nil && menuBarQuotaBar != q.key { continue }
            if q.key == "grokbot" && lastMetrics?.grokBotWeeklyRem == nil && menuBarQuotaBar != q.key { continue }
            let item = NSMenuItem(title: "  \(q.label)", action: #selector(selectQuotaBarMode(_:)), keyEquivalent: "")
            if q.key == "argon7d" { item.toolTip = "独立于 Gemini 通用周额度" }
            item.representedObject = q.key
            item.state = (menuBarQuotaBar == q.key) ? .on : .off
            modeMenu.addItem(item)
        }
        let modeParent = NSMenuItem(title: "菜单栏显示配置", action: nil, keyEquivalent: "")
        modeParent.submenu = modeMenu
        menu.addItem(modeParent)
        menu.addItem(makeKeepAwakeMenu())
        let version = updateController.availableVersion
        let updateTitle = version.map { "发现新版本 v\($0) · 立即更新" } ?? "检查更新…"
        let updateItem = NSMenuItem(title: updateTitle, action: #selector(openUpdatesFromMenu), keyEquivalent: "")
        updateItem.target = self
        menu.addItem(updateItem)

        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "退出 \(variantName)", action: #selector(quitApp), keyEquivalent: "q")

        return menu
    }

    private func showContextMenu() {
        statusItem.menu = makeContextMenu()
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }

    @objc private func selectPreset(_ sender: NSMenuItem) {
        if let fields = sender.representedObject as? [String] {
            setMenuBarFields(fields)
        }
    }

    @objc private func toggleField(_ sender: NSMenuItem) {
        guard let key = sender.representedObject as? String else { return }
        var next = menuBarFields
        if let idx = next.firstIndex(of: key) {
            next.remove(at: idx)
        } else {
            next.append(key)
        }
        setMenuBarFields(next)
    }

    @objc private func selectQuotaBarMode(_ sender: NSMenuItem) {
        if let mode = sender.representedObject as? String {
            setMenuBarQuotaBar(mode)
        }
    }

    private func setMenuBarQuotaBar(_ mode: String) {
        guard ALL_QUOTA_BAR_MODES.contains(where: { $0.key == mode }) else { return }
        menuBarQuotaBar = mode
        UserDefaults.standard.set(mode, forKey: "tootoo_menubar_quota_bar")
        if let m = lastMetrics {
            applyMenuBarMetrics(m)
        } else {
            refreshMenuBarSummary()
        }
        syncFieldsToWeb()
    }

    private func setMenuBarFields(_ fields: [String]) {
        menuBarFields = fields
        UserDefaults.standard.set(fields, forKey: "tootoo_menubar_fields")
        if let m = lastMetrics {
            applyMenuBarMetrics(m)
        } else {
            refreshMenuBarSummary()
        }
        syncFieldsToWeb()
    }

    private func syncFieldsToWeb() {
        if let data = try? JSONSerialization.data(withJSONObject: menuBarFields),
           let jsonStr = String(data: data, encoding: .utf8) {
            let escapedBar = menuBarQuotaBar.replacingOccurrences(of: "\"", with: "")
            let js = "window.__onMenuBarFields && window.__onMenuBarFields(\(jsonStr), \"\(escapedBar)\");"
            popoverVC?.evalJS(js)
            fullWindowVC?.evalJS(js)
        }
    }

    @objc private func openUpdatesFromMenu() {
        showUpdateSettingsWhenLoaded = true
        openFullWindow()
        openUpdateSettingsIfReady()
        updateController.sync()
        if updateController.availableVersion == nil { updateController.check(force: true) }
    }

    private func openUpdateSettingsIfReady() {
        guard showUpdateSettingsWhenLoaded, let vc = fullWindowVC, vc.isPageReady else { return }
        showUpdateSettingsWhenLoaded = false
        vc.evalJS("window.__openUpdateSettings && window.__openUpdateSettings();")
    }

    @objc private func manualRefresh() {
        refreshMenuBarSummary(force: true)
        popoverVC?.requestTelemetryRefresh()
        fullWindowVC?.requestTelemetryRefresh()
    }

    @objc private func openInBrowser() {
        closePopover()
        if let url = URL(string: "http://127.0.0.1:\(port)/") {
            NSWorkspace.shared.open(url)
        }
    }

    @objc private func quitApp() {
        NSApp.terminate(nil)
    }

    // MARK: Popover & Full Window

    private func setupPopover() {
        popover = NSPopover()
        popover.behavior = .transient
        popover.animates = true
        popover.delegate = self
    }

    private func ensurePopoverVC() -> TelemetryWebViewController {
        if let vc = popoverVC { return vc }
        let url = URL(string: "http://127.0.0.1:\(port)/?mode=popover")!
        let vc = TelemetryWebViewController(url: url, size: NSSize(width: 452, height: 640)) { [weak self] action, payload in
            self?.handleWebAction(action, payload: payload)
        }
        vc.onPageReady = { [weak self] in self?.popoverLifecycle.sync() }
        popoverVC = vc
        return vc
    }

    private func prewarmPopover() {
        let vc = ensurePopoverVC()
        _ = vc.view
    }

    private func togglePopover() {
        if popoverLifecycle.visible {
            closePopover()
        } else {
            guard statusItem.button != nil else { return }
            popoverLifecycle.openRequested()
            showPopover()
        }
    }

    private func showPopover() {
        guard let button = statusItem.button else { return }
        let vc = ensurePopoverVC()
        if popover.contentViewController !== vc { popover.contentViewController = vc }
        popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func closePopover() {
        // Also cancel an open request AppKit has not finished showing yet.
        popoverLifecycle.willClose()
        stopOutsideClickMonitor()
        popover.performClose(nil)
    }

    private func startOutsideClickMonitor() {
        stopOutsideClickMonitor()
        eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
            if self?.popoverLifecycle.visible == true { self?.closePopover() }
        }
    }

    private func stopOutsideClickMonitor() {
        if let mon = eventMonitor {
            NSEvent.removeMonitor(mon)
            eventMonitor = nil
        }
    }

    func popoverWillClose(_ notification: Notification) {
        popoverLifecycle.willClose()
        stopOutsideClickMonitor()
    }

    func popoverDidShow(_ notification: Notification) {
        guard popoverLifecycle.visible else {
            popover.performClose(nil)
            return
        }
        popoverLifecycle.didShow()
        startOutsideClickMonitor()
    }

    func popoverDidClose(_ notification: Notification) {
        guard !popover.isShown else { return }
        if popoverLifecycle.didClose(isShown: false) { showPopover() }
    }

    @objc func openFullWindow() {
        closePopover()
        if let win = fullWindow {
            win.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        let url = URL(string: "http://127.0.0.1:\(port)/")!
        let vc = TelemetryWebViewController(url: url, size: NSSize(width: 1280, height: 820)) { [weak self] action, payload in
            self?.handleWebAction(action, payload: payload)
        }
        fullWindowVC = vc
        vc.onPageReady = { [weak self] in self?.openUpdateSettingsIfReady() }

        let win = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        win.title = "tootoo // AI 编程速度与用量仪表盘"
        win.contentViewController = vc
        win.center()
        win.isReleasedWhenClosed = false
        win.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        fullWindow = win
    }

    private func handleWebAction(_ action: String, payload: [String: Any]) {
        switch action {
        case "openWindow":
            openFullWindow()
        case "openBrowser":
            openInBrowser()
        case "quit":
            quitApp()
        case "refreshed":
            refreshMenuBarSummary()
        case "getUpdateState":
            updateController.sync()
        case "checkForUpdate":
            updateController.check(force: true)
        case "installUpdate":
            updateController.install()
        case "openUpdateRelease":
            updateController.openRelease()
        case "getKeepAwakeState":
            syncKeepAwakeToWeb()
        case "setKeepAwake":
            if let mode = payload["mode"] as? String, let duration = payload["durationMin"] as? Int {
                applyKeepAwake(mode: mode, durationMin: duration, persist: true)
            }
        case "getMenuBarFields":
            syncFieldsToWeb()
        case "setMenuBarFields":
            if let fields = payload["fields"] as? [String] {
                setMenuBarFields(fields)
            }
        case "setMenuBarQuotaBar":
            if let mode = payload["mode"] as? String {
                setMenuBarQuotaBar(mode)
            }
        #if TOOTOO_DEBUG
        case "setDebugTier":
            if let lv = payload["level"] as? Int, (1...10).contains(lv) {
                debugTierOverride = lv
                let tier = BUNNY_TIERS.first(where: { $0.level == lv }) ?? BUNNY_TIERS[0]
                self.currentTier = tier
                self.statusItem.button?.image = makeBunnyMenuBarIcon(tier: lv)
            } else {
                debugTierOverride = nil
                if let m = lastMetrics {
                    applyMenuBarMetrics(m)
                } else {
                    refreshMenuBarSummary()
                }
            }
        #endif
        default:
            break
        }
    }

    // MARK: Live Menu Bar Telemetry Title

    private func fmtTokens(_ n: Double) -> String {
        if n >= 1e9 { return String(format: "%.2fB", n / 1e9) }
        if n >= 1e6 { return String(format: "%.1fM", n / 1e6) }
        if n >= 1e3 { return String(format: "%.0fK", n / 1e3) }
        return "\(Int(n))"
    }

    private func fmtCost(_ c: Double) -> String {
        if c >= 100 { return String(format: "$%.0f", c) }
        if c >= 10 { return String(format: "$%.1f", c) }
        return String(format: "$%.2f", c)
    }

    private func refreshMenuBarSummary(force: Bool = false) {
        // Only the bunny's tier includes today's reward XP. Usage text is raw.
        issuedSummaryRefresh += 1
        let request = issuedSummaryRefresh
        fetchSummary(range: "today", force: force) { [weak self] metrics in
            DispatchQueue.main.async {
                guard let self, request >= self.appliedSummaryRefresh else { return }
                #if TOOTOO_MENU_SMOKE
                defer { self.smokeSummaryCompletions += 1 }
                #endif
                if let metrics {
                    self.appliedSummaryRefresh = request
                    self.lastMetrics = metrics
                    self.applyMenuBarMetrics(metrics)
                } else if self.lastMetrics == nil && request == self.issuedSummaryRefresh {
                    self.currentTier = BUNNY_TIERS[0]
                    self.statusItem.button?.image = makeBunnyMenuBarIcon(tier: 1)
                    self.statusItem.button?.title = variantMenuPrefix + (self.menuBarFields.isEmpty ? "" : " 0")
                    self.quotaBarView?.percent = nil
                    self.quotaBarView?.isHidden = true
                    let pinnedBar = ALL_QUOTA_BAR_MODES.first {
                        $0.key == self.menuBarQuotaBar && $0.key != "none" && $0.key != "auto"
                    }
                    self.baseStatusToolTip = pinnedBar.map { "\(variantName) · \($0.label) 暂无数据" } ?? variantName
                    self.updateKeepAwakeToolTip()
                }
            }
        }
    }

    #if TOOTOO_MENU_SMOKE
    private func startMenuSummarySmoke(port fixturePort: UInt16) {
        port = fixturePort
        menuBarFields = ["tokens"]
        menuBarQuotaBar = "gem5h"
        setupStatusItem()
        setupPopover()
        guard !smokeMenuFieldKeys().contains("q_grokbot"), !smokeMenuFieldKeys().contains("grokbot") else {
            fatalError("Grok Bot menu choices should be hidden before data or selection")
        }
        menuBarFields.append("q_grokbot")
        menuBarQuotaBar = "grokbot"
        guard smokeMenuFieldKeys().contains("q_grokbot"), smokeMenuFieldKeys().contains("grokbot") else {
            fatalError("Persisted Grok Bot choices must be accessible without current data")
        }
        menuBarFields = ["tokens"]
        menuBarQuotaBar = "gem5h"
        refreshMenuBarSummary()
        smokeWait(1, polls: 120) { [weak self] in self?.verifyMenuSummarySmoke() }
    }

    private func smokeMenuFieldKeys() -> [String] {
        makeContextMenu().items.first { $0.title == "菜单栏显示配置" }?.submenu?.items.compactMap {
            $0.representedObject as? String
        } ?? []
    }

    private func smokeWait(_ count: Int, polls: Int, done: @escaping () -> Void) {
        if smokeSummaryCompletions >= count {
            DispatchQueue.main.async(execute: done)
        } else if polls > 0 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
                self?.smokeWait(count, polls: polls - 1, done: done)
            }
        } else {
            fatalError("Timed out waiting for native menu summary")
        }
    }

    private func smokeMetricsStillValid() -> Bool {
        return lastMetrics?.tokens == 590_000_000 && currentTier.level == 6
            && statusItem.button?.attributedTitle.string == " 590.0M" && quotaBarView?.percent == 75
            && quotaBarView?.isHidden == false
    }

    private func verifyMenuSummarySmoke() {
        guard smokeMetricsStillValid() else { fatalError("Effective XP must change tier, not raw menu token text") }
        guard let snapshot = lastMetrics,
              snapshot.grokBotWeeklyRem == 37,
              smokeMenuFieldKeys().contains("q_grokbot"), smokeMenuFieldKeys().contains("grokbot") else {
            fatalError("Valid Grok Bot weekly should populate both native menu choices")
        }
        menuBarFields = ["q_grokbot"]
        menuBarQuotaBar = "grokbot"
        applyMenuBarMetrics(snapshot)
        DispatchQueue.main.async {
            guard self.statusItem.button?.attributedTitle.string == " GrokBot 37%",
                  self.quotaBarView?.percent == 37,
                  self.baseStatusToolTip.contains("Grok Bot 周 剩余 37%") else {
                fatalError("Pinned Grok Bot text/bar did not render the weekly figure")
            }
            print("PASS native Grok Bot menu choices, pinned weekly bar and text")
            self.menuBarFields = ["tokens"]
            self.menuBarQuotaBar = "gem5h"
            self.applyMenuBarMetrics(snapshot)
            self.smokeOpenUpdates()
        }
    }

    private func smokeOpenUpdates() {
        openUpdatesFromMenu()
        // A simultaneous popover message must not consume the pending full-window intent.
        handleWebAction("getUpdateState", payload: [:])
        smokeWaitForFullWindow(polls: 200)
    }

    private func smokeWaitForFullWindow(polls: Int) {
        guard fullWindowVC?.isPageReady == true else {
            if polls == 0 { fatalError("Timed out waiting for full dashboard page") }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
                self?.smokeWaitForFullWindow(polls: polls - 1)
            }
            return
        }
        manualRefresh()
        smokeWait(2, polls: 120) { [weak self] in
            guard self?.smokeMetricsStillValid() == true else {
                fatalError("Transient forced polling failure cleared the last good menu summary")
            }
            // Leave the run loop alive long enough for WebKit's beacons to drain.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                print("PASS native menu summary, stale snapshot, force, and update readiness")
                NSApp.terminate(nil)
            }
        }
    }
    #endif

    private func remPct(from usedNum: Any?) -> Int? {
        guard let used = (usedNum as? NSNumber)?.doubleValue else { return nil }
        return max(0, min(100, Int((100.0 - used).rounded())))
    }

    private func fetchSummary(range: String, force: Bool, completion: @escaping (TodayMetrics?) -> Void) {
        let forceQuery = force ? "&force=1" : ""
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/telemetry?range=\(range)&tool=all\(forceQuery)") else {
            completion(nil); return
        }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 12)
        if force { request.setValue(quotaForceToken, forHTTPHeaderField: "X-TooToo-Quota-Force") }
        URLSession.shared.dataTask(with: request) { data, response, _ in
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode),
                  let data = data,
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let kpi = obj["kpi"] as? [String: Any] else {
                completion(nil); return
            }
            guard let tok = (kpi["tokens"] as? NSNumber)?.doubleValue, tok.isFinite, tok >= 0 else {
                completion(nil); return
            }
            let effective = (obj["effective_today_tokens"] as? NSNumber)?.doubleValue
                ?? (obj["today_tokens"] as? NSNumber)?.doubleValue ?? tok
            let evolutionTokens = effective.isFinite && effective >= 0 ? effective : tok
            let cost = (kpi["cost"] as? NSNumber)?.doubleValue ?? 0
            let tps = (kpi["tps"] as? NSNumber)?.doubleValue
            let ttft = (kpi["ttft_p50"] as? NSNumber)?.doubleValue

            var gem5h: Int? = nil
            var gem7d: Int? = nil
            var cg5h: Int? = nil
            var cg7d: Int? = nil
            var argon7d: Int? = nil
            var codex: Int? = nil
            var codexWeekly = false

            let quotas = obj["quotas"] as? [String: Any] ?? [:]
            if let agy = quotas["antigravity"] as? [String: Any],
               let buckets = agy["buckets"] as? [[String: Any]] {
                for b in buckets {
                    let key = (b["key"] as? String) ?? ""
                    if key == "antigravity:gemini_5h" { gem5h = self.remPct(from: b["used_percent"]) }
                    else if key == "antigravity:gemini_7d" { gem7d = self.remPct(from: b["used_percent"]) }
                    else if key == "antigravity:cg_5h" { cg5h = self.remPct(from: b["used_percent"]) }
                    else if key == "antigravity:cg_7d" { cg7d = self.remPct(from: b["used_percent"]) }
                    else if key == "antigravity:argon_7d" { argon7d = self.remPct(from: b["used_percent"]) }
                }
            }
            if let cx = quotas["codex"] as? [String: Any] {
                let buckets = ["primary", "secondary"].compactMap { key -> (remaining: Int, weekly: Bool)? in
                    guard let bucket = cx[key] as? [String: Any],
                          let remaining = self.remPct(from: bucket["used_percent"]) else { return nil }
                    let rawWindow = bucket["window_minutes"]
                    let minutes = (rawWindow as? NSNumber)?.intValue ?? (rawWindow as? String).flatMap(Int.init)
                    return (remaining, minutes == 10080)
                }
                if let selected = buckets.first(where: { $0.weekly }) ?? buckets.first {
                    codex = selected.remaining
                    codexWeekly = selected.weekly
                }
            }

            completion(TodayMetrics(
                tokens: tok, effectiveTodayTokens: evolutionTokens, cost: cost, tps: tps, ttft: ttft,
                gem5hRem: gem5h, gem7dRem: gem7d, cg5hRem: cg5h, cg7dRem: cg7d, argon7dRem: argon7d, codexRem: codex, codexWeekly: codexWeekly,
                grokBotWeeklyRem: grokBotWeeklyRemaining(quotas)
            ))
        }.resume()
    }

    private func applyMenuBarMetrics(_ m: TodayMetrics) {
        let tier = bunnyTier(for: m.effectiveTodayTokens)
        let bothGem = menuBarFields.contains("q_gem5h") && menuBarFields.contains("q_gem7d")
        var parts: [String] = []
        for f in menuBarFields {
            switch f {
            case "tokens":
                parts.append(fmtTokens(m.tokens))
            case "cost":
                parts.append(fmtCost(m.cost))
            case "tps":
                if let t = m.tps { parts.append(String(format: "%.0f/s", t)) }
            case "ttft":
                if let l = m.ttft { parts.append(String(format: "%.1fs", l)) }
            case "q_gem5h":
                if let v = m.gem5hRem { parts.append(bothGem ? "Gem5h \(v)%" : "Gem \(v)%") }
            case "q_gem7d":
                if let v = m.gem7dRem { parts.append("Gem周 \(v)%") }
            case "q_cg5h":
                if let v = m.cg5hRem { parts.append("C/G \(v)%") }
            case "q_cg7d":
                if let v = m.cg7dRem { parts.append("C/G周 \(v)%") }
            case "q_argon7d":
                if let v = m.argon7dRem { parts.append("Argon周 \(v)%") }
            case "q_codex":
                if let v = m.codexRem { parts.append("Codex \(v)%") }
            case "q_grokbot":
                if let v = m.grokBotWeeklyRem { parts.append("GrokBot \(v)%") }
            default:
                break
            }
        }
        let title = parts.isEmpty ? "" : (" " + parts.joined(separator: " · "))

        // Resolve bottom micro quota bar value & tooltip
        let quotaBars: [(key: String, remaining: Int?, label: String)] = [
            ("gem5h", m.gem5hRem, "Gemini 5h"),
            ("gem7d", m.gem7dRem, "Gemini 周"),
            ("cg5h", m.cg5hRem, "C/G 5h"),
            ("cg7d", m.cg7dRem, "C/G 周"),
            ("argon7d", m.argon7dRem, "Gemini 4 Argon 周额度"),
            ("codex", m.codexRem, m.codexWeekly ? "Codex 周" : "Codex"),
            // Add Grok Bot as a final Auto candidate; existing precedence is unchanged.
            ("grokbot", m.grokBotWeeklyRem, "Grok Bot 周"),
        ]
        DispatchQueue.main.async {
            guard let button = self.statusItem.button else { return }
            let chosenBar = selectQuotaBar(mode: self.menuBarQuotaBar, bars: quotaBars)
            let barPct = chosenBar?.remaining
            let barName = chosenBar?.label ?? ""
            let title = variantMenuPrefix + title
            let hasText = !title.isEmpty
            let compactIcon = (!hasText && barPct != nil)
            #if TOOTOO_DEBUG
            if let dbg = self.debugTierOverride {
                let dbgTier = BUNNY_TIERS.first(where: { $0.level == dbg }) ?? tier
                self.currentTier = dbgTier
                button.image = makeBunnyMenuBarIcon(tier: dbg, compactForBar: compactIcon)
            } else {
                self.currentTier = tier
                button.image = makeBunnyMenuBarIcon(tier: tier.level, compactForBar: compactIcon)
            }
            #else
            self.currentTier = tier
            button.image = makeBunnyMenuBarIcon(tier: tier.level, compactForBar: compactIcon)
            #endif

            if let pct = barPct {
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: NSFont.monospacedDigitSystemFont(ofSize: 11.0, weight: .medium),
                    .baselineOffset: 2.0,
                ]
                let attrStr = NSAttributedString(string: title, attributes: attrs)
                button.attributedTitle = attrStr
                self.baseStatusToolTip = "\(variantName) · \(barName) 剩余 \(pct)%"

                let positionBar = {
                    guard let btn = self.statusItem.button,
                          let qv = self.quotaBarView else { return }
                    let b = btn.bounds
                    guard b.width > 0, b.height > 0 else { return }
                    let barH: CGFloat = 2.0
                    let barY: CGFloat = btn.isFlipped ? (b.height - barH - 1.5) : 1.5
                    let barX: CGFloat
                    let targetW: CGFloat

                    if hasText, let cell = btn.cell as? NSButtonCell {
                        let tRect = cell.titleRect(forBounds: b)
                        let trimmed = title.trimmingCharacters(in: .whitespaces)
                        let leadSpaces = title.prefix { $0 == " " }
                        let leadW = NSAttributedString(string: String(leadSpaces), attributes: attrs).size().width
                        let glyphW = NSAttributedString(string: trimmed, attributes: attrs).size().width
                        let rawX = tRect.minX + leadW
                        let maxW = max(12.0, b.width - rawX - 4.0)
                        targetW = max(12.0, min(glyphW, maxW))
                        barX = rawX
                    } else if let cell = btn.cell as? NSButtonCell {
                        let iRect = cell.imageRect(forBounds: b)
                        targetW = 14.0
                        barX = iRect.midX - targetW / 2.0
                    } else {
                        targetW = 14.0
                        barX = (b.width - targetW) / 2.0
                    }

                    qv.frame = NSRect(x: barX.rounded(.toNearestOrAwayFromZero), y: barY, width: targetW.rounded(.toNearestOrAwayFromZero), height: barH)
                    qv.percent = pct
                    qv.isHidden = false
                }

                button.layoutSubtreeIfNeeded()
                positionBar()
                // Re-align on next runloop tick once NSStatusBar finishes resizing the item width
                DispatchQueue.main.async { positionBar() }
            } else {
                button.attributedTitle = NSAttributedString(
                    string: title,
                    attributes: [.font: NSFont.monospacedDigitSystemFont(ofSize: 11.5, weight: .medium)]
                )
                self.baseStatusToolTip = barName.isEmpty ? variantName : "\(variantName) · \(barName) 暂无数据"
                self.quotaBarView?.percent = nil
                self.quotaBarView?.isHidden = true
            }
            self.updateKeepAwakeToolTip()
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
