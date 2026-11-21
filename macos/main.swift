import AppKit
import Foundation
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
    BunnyTierInfo(level: 3, name: "拳击兔", minTokens: 30_000_000),
    BunnyTierInfo(level: 4, name: "肉筋兔", minTokens: 100_000_000),
    BunnyTierInfo(level: 5, name: "超赛爆气兔", minTokens: 300_000_000),
    BunnyTierInfo(level: 6, name: "红魔兔", minTokens: 600_000_000),
    BunnyTierInfo(level: 7, name: "狱火魔神兔", minTokens: 1_000_000_000),
    BunnyTierInfo(level: 8, name: "星渊霸王兔", minTokens: 1_500_000_000),
    BunnyTierInfo(level: 9, name: "创世飞升兔", minTokens: 3_000_000_000),
]

func bunnyTier(for tokens: Double) -> BunnyTierInfo {
    var cur = BUNNY_TIERS[0]
    for t in BUNNY_TIERS {
        if tokens >= t.minTokens { cur = t }
    }
    return cur
}

// MARK: - 9-Tier Bunny Menu Bar Icon (Retina CoreGraphics Template)

func makeBunnyMenuBarIcon(tier: Int = 1) -> NSImage {
    let size = NSSize(width: 22, height: 18)
    let image = NSImage(size: size, flipped: false) { _ in
        guard let ctx = NSGraphicsContext.current?.cgContext else { return false }
        // Work in a 36x36 coordinate space (flipped vertically from SVG -> CoreGraphics bottom-up)
        let scale: CGFloat = 18.0 / 36.0
        ctx.translateBy(x: 2.0, y: 18.0)
        ctx.scaleBy(x: scale, y: -scale)

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

        case 3: // 拳击兔: raised boxing gloves
            rotatedEar(cx: 13, cy: 15, deg: -12, x: 9.8, y: 2.8, w: 5.2, h: 13.2, r: 2.6)
            rotatedEar(cx: 23, cy: 15, deg: 12, x: 21.0, y: 2.8, w: 5.2, h: 13.2, r: 2.6)
            fillRect(7.4, 13.2, 21.2, 17.2, 8.4)
            NSBezierPath(ovalIn: NSRect(x: 0.8, y: 21.2, width: 8.2, height: 8.2)).fill()
            NSBezierPath(ovalIn: NSRect(x: 27.0, y: 21.2, width: 8.2, height: 8.2)).fill()
            ctx.setBlendMode(.clear)
            let brows = NSBezierPath()
            brows.lineWidth = 1.9; brows.lineCapStyle = .round
            brows.move(to: NSPoint(x: 11.4, y: 19.5)); brows.line(to: NSPoint(x: 15.6, y: 20.9))
            brows.move(to: NSPoint(x: 24.6, y: 19.5)); brows.line(to: NSPoint(x: 20.4, y: 20.9))
            brows.stroke()
            NSBezierPath(ovalIn: NSRect(x: 12.5, y: 21.8, width: 2.8, height: 2.8)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.7, y: 21.8, width: 2.8, height: 2.8)).fill()

        case 4: // 肉筋兔: flexed twin biceps!
            rotatedEar(cx: 13, cy: 14, deg: -10, x: 10.2, y: 2.4, w: 5.0, h: 12.6, r: 2.5)
            rotatedEar(cx: 23, cy: 14, deg: 10, x: 20.8, y: 2.4, w: 5.0, h: 12.6, r: 2.5)
            // Left flexed arm + fist
            NSBezierPath(ovalIn: NSRect(x: 1.0, y: 17.5, width: 5.4, height: 5.4)).fill()
            fillRect(1.2, 20.5, 4.4, 8.2, 2.2)
            fillRect(2.2, 24.4, 8.0, 5.2, 2.4)
            // Right flexed arm + fist
            NSBezierPath(ovalIn: NSRect(x: 29.6, y: 17.5, width: 5.4, height: 5.4)).fill()
            fillRect(30.4, 20.5, 4.4, 8.2, 2.2)
            fillRect(25.8, 24.4, 8.0, 5.2, 2.4)
            fillRect(8.8, 12.4, 18.4, 17.8, 6.8)
            ctx.setBlendMode(.clear)
            let brows = NSBezierPath()
            brows.lineWidth = 2.0; brows.lineCapStyle = .round
            brows.move(to: NSPoint(x: 11.4, y: 18.0)); brows.line(to: NSPoint(x: 16.0, y: 19.6))
            brows.move(to: NSPoint(x: 24.6, y: 18.0)); brows.line(to: NSPoint(x: 20.0, y: 19.6))
            brows.stroke()
            NSBezierPath(ovalIn: NSRect(x: 12.8, y: 20.5, width: 2.8, height: 2.8)).fill()
            NSBezierPath(ovalIn: NSRect(x: 20.4, y: 20.5, width: 2.8, height: 2.8)).fill()

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

    func reloadPage() {
        webView?.reload()
    }

    func evalJS(_ js: String) {
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if let dict = message.body as? [String: Any], let action = dict["action"] as? String {
            DispatchQueue.main.async {
                self.onAction(action, dict)
            }
        }
    }
}

// MARK: - Main App Delegate

// Configurable menu bar fields in display order: tokens, cost, tps, ttft
let ALL_MENUBAR_FIELDS: [(key: String, label: String)] = [
    ("tokens", "用量 (Tokens)"),
    ("cost",   "花费 ($)"),
    ("tps",    "速度 (TPS)"),
    ("ttft",   "首字 (TTFT)"),
]

struct TodayMetrics {
    let tokens: Double
    let cost: Double
    let tps: Double?
    let ttft: Double?
}

class AppDelegate: NSObject, NSApplicationDelegate, NSPopoverDelegate {
    private var statusItem: NSStatusItem!
    private var popover: NSPopover!
    private var popoverVC: TelemetryWebViewController?
    private var fullWindow: NSWindow?
    private var fullWindowVC: TelemetryWebViewController?
    private var backendProcess: Process?
    private var port: UInt16 = 17891
    private var statusTimer: Timer?
    private var eventMonitor: Any?
    private var menuBarFields: [String] = ["tokens", "cost"]
    private var currentTier: BunnyTierInfo = BUNNY_TIERS[0]
    private var lastMetrics: TodayMetrics?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        if let saved = UserDefaults.standard.array(forKey: "tootoo_menubar_fields") as? [String] {
            menuBarFields = saved
        } else {
            // Default: Tokens · Cost (configurable anytime)
            menuBarFields = ["tokens", "cost"]
        }

        port = findFreePort(preferred: 17891)
        startBackend()
        setupStatusItem()
        setupPopover()

        waitForBackend { [weak self] in
            self?.refreshMenuBarSummary()
            self?.prewarmPopover()
        }

        statusTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.refreshMenuBarSummary()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        stopBackend()
    }

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
        button.title = " tootoo"
        button.font = NSFont.monospacedDigitSystemFont(ofSize: 11.5, weight: .medium)
        button.target = self
        button.action = #selector(statusBarClicked(_:))
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
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

    private func showContextMenu() {
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
            ("预设：用量 · 花费 (推荐)", ["tokens", "cost"]),
            ("预设：速度 · 用量", ["tps", "tokens"]),
            ("预设：用量 · 速度 · 花费", ["tokens", "tps", "cost"]),
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
            let item = NSMenuItem(title: "显示 \(f.label)", action: #selector(toggleField(_:)), keyEquivalent: "")
            item.representedObject = f.key
            item.state = menuBarFields.contains(f.key) ? .on : .off
            modeMenu.addItem(item)
        }
        let modeParent = NSMenuItem(title: "菜单栏显示配置", action: nil, keyEquivalent: "")
        modeParent.submenu = modeMenu
        menu.addItem(modeParent)

        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "退出 TooToo", action: #selector(quitApp), keyEquivalent: "q")

        statusItem.menu = menu
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
            let js = "window.__onMenuBarFields && window.__onMenuBarFields(\(jsonStr));"
            popoverVC?.evalJS(js)
            fullWindowVC?.evalJS(js)
        }
    }

    @objc private func manualRefresh() {
        refreshMenuBarSummary()
        popoverVC?.reloadPage()
        fullWindowVC?.reloadPage()
    }

    @objc private func openInBrowser() {
        popover.performClose(nil)
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
        popoverVC = vc
        return vc
    }

    private func prewarmPopover() {
        let vc = ensurePopoverVC()
        _ = vc.view
    }

    private func togglePopover() {
        guard let button = statusItem.button else { return }
        if popover.isShown {
            popover.performClose(nil)
            stopOutsideClickMonitor()
        } else {
            let vc = ensurePopoverVC()
            popover.contentViewController = vc
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            NSApp.activate(ignoringOtherApps: true)
            vc.evalJS("window.__onPopoverOpen && window.__onPopoverOpen();")
            startOutsideClickMonitor()
        }
    }

    private func startOutsideClickMonitor() {
        stopOutsideClickMonitor()
        eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
            if let pop = self?.popover, pop.isShown {
                pop.performClose(nil)
                self?.stopOutsideClickMonitor()
            }
        }
    }

    private func stopOutsideClickMonitor() {
        if let mon = eventMonitor {
            NSEvent.removeMonitor(mon)
            eventMonitor = nil
        }
    }

    func popoverDidClose(_ notification: Notification) {
        stopOutsideClickMonitor()
        popoverVC?.evalJS("window.__onPopoverClose && window.__onPopoverClose();")
    }

    @objc func openFullWindow() {
        popover.performClose(nil)
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
        case "getMenuBarFields":
            syncFieldsToWeb()
        case "setMenuBarFields":
            if let fields = payload["fields"] as? [String] {
                setMenuBarFields(fields)
            }
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

    private func refreshMenuBarSummary() {
        // Bunny tier & menu bar strictly track TODAY's total tokens (resets to Lv.1 at midnight)
        fetchSummary(range: "today") { [weak self] metrics in
            guard let self = self else { return }
            if let m = metrics {
                self.lastMetrics = m
                self.applyMenuBarMetrics(m)
            } else {
                DispatchQueue.main.async {
                    self.currentTier = BUNNY_TIERS[0]
                    self.statusItem.button?.image = makeBunnyMenuBarIcon(tier: 1)
                    self.statusItem.button?.title = self.menuBarFields.isEmpty ? "" : " 0"
                }
            }
        }
    }

    private func fetchSummary(range: String, completion: @escaping (TodayMetrics?) -> Void) {
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/telemetry?range=\(range)&tool=all") else {
            completion(nil); return
        }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data,
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let kpi = obj["kpi"] as? [String: Any] else {
                completion(nil); return
            }
            let tok = (kpi["tokens"] as? NSNumber)?.doubleValue ?? 0
            let cost = (kpi["cost"] as? NSNumber)?.doubleValue ?? 0
            let tps = (kpi["tps"] as? NSNumber)?.doubleValue
            let ttft = (kpi["ttft_p50"] as? NSNumber)?.doubleValue
            completion(TodayMetrics(tokens: tok, cost: cost, tps: tps, ttft: ttft))
        }.resume()
    }

    private func applyMenuBarMetrics(_ m: TodayMetrics) {
        let tier = bunnyTier(for: m.tokens)
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
            default:
                break
            }
        }
        let title = parts.isEmpty ? "" : (" " + parts.joined(separator: " · "))

        DispatchQueue.main.async {
            self.currentTier = tier
            self.statusItem.button?.image = makeBunnyMenuBarIcon(tier: tier.level)
            self.statusItem.button?.title = title
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
