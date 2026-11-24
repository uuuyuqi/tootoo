// Renders the exact packaged HTML/CSS/JS in a nonpersistent WKWebView.
// Request URLs are loopback only; API/storage state belongs to the fixture.
import AppKit
import Foundation
import WebKit

struct LayoutError: Error, CustomStringConvertible {
    let description: String
    init(_ message: String) { description = message }
}

@MainActor
final class LayoutHarness: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    let url: URL
    let window = NSWindow(contentRect: NSRect(x: 60, y: 60, width: 452, height: 620),
                          styleMask: [.titled, .closable], backing: .buffered, defer: false)
    var running = false
    lazy var web: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.addUserScript(WKUserScript(source: """
            window.fetch = async () => ({ ok: false, status: 503, json: async () => ({ fixture: true }) });
            window.EventSource = class { close() {} };
            """, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        return WKWebView(frame: NSRect(x: 0, y: 0, width: 452, height: 620), configuration: configuration)
    }()

    init(_ url: URL) { self.url = url }

    func applicationDidFinishLaunching(_ notification: Notification) {
        window.title = "TooToo 452pt isolated WKWebView"
        window.contentView = web
        window.makeKeyAndOrderFront(nil)
        web.navigationDelegate = self
        web.load(URLRequest(url: url))
        DispatchQueue.main.asyncAfter(deadline: .now() + 25) { self.fail(LayoutError("WKWebView timeout")) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !running else { return }
        running = true
        Task { @MainActor in
            do { try await run(); exit(0) }
            catch { fail(error) }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        fail(error)
    }

    private func fail(_ error: Error) -> Never {
        FileHandle.standardError.write(Data(("FAIL: \(error)\n").utf8))
        exit(1)
    }

    private func eval(_ code: String) async throws -> Any? {
        try await withCheckedThrowingContinuation { (next: CheckedContinuation<Any?, Error>) in
            web.evaluateJavaScript(code) { result, error in
                if let error { next.resume(throwing: error) }
                else { next.resume(returning: result) }
            }
        }
    }

    private func verify(_ name: String, _ js: String) async throws {
        guard let result = try await eval(js) as? String else { throw LayoutError("invalid fixture result for \(name)") }
        guard result.hasPrefix("PASS:") else { throw LayoutError("\(name): \(result)") }
        print(result)
    }

    private func run() async throws {
        let harness = """
            (() => {
             const id = s => document.getElementById(s);
             const rect = n => n.getBoundingClientRect();
             const check = (ok, label, extra = {}) => { if (!ok) throw Error(label + ' ' + JSON.stringify(extra)); };
             const visible = n => n && getComputedStyle(n).display !== 'none' && rect(n).width > 0;
             const quota = id('topQuota'), row = id('xpWrap'), text = id('xpText'), rail = row.querySelector('.xp-track');
             const title = document.querySelector('.brand-title'), mood = id('bunnyMood'), logo = id('brandLogo');
             const brandRow = document.querySelector('.brand-row'), controls = document.querySelector('.topbar .controls');
             menuBarQuotaBar = 'gem7d';
             renderTopQuota({ quotas: { antigravity: { buckets: [{
                key: 'antigravity:gemini_7d', label: 'Gemini Models · Weekly', used_percent: 16,
                resets_at: Math.floor(Date.now() / 1000) + 16 * 3600,
             }] }} });
             state.data = { today_tokens: ACTUAL, evo_peak_tokens: ACTUAL };
             carrotDiskState.home = cloneHomeState({xp_boost: {day: getTodayKey(), tokens: XP}});
             minimalMode = SIMPLE;
             debugState.active = DEBUG;
             debugState.simTokens = DEBUG ? 3.1e9 : null;
             finishBoot();
             renderBunnyState(getEffectiveTodayTokens());
             renderEvoModal();
             return () => {
             const badge = text.querySelector('.xp-boost-tag');
             check(innerWidth === WIDTH, 'viewport', {innerWidth});
             check(document.body.classList.contains('popover-mode') === POPOVER, 'popover CSS mode');
             check(!!badge === BADGE, 'badge visibility', {case:'CASE', tokens:getEffectiveTodayTokens()});
             check(row.classList.contains('has-xp-boost') === BADGE, 'boost layout class');
             const styleRules = [...document.styleSheets].flatMap(sheet => [...sheet.cssRules])
                .filter(rule => rule.selectorText?.includes('.xp-track'))
                .map(rule => ({name:rule.selectorText, css:rule.style.width, matches:rail.matches(rule.selectorText)}));
             check(Math.abs(rect(rail).width - RAIL) < 0.5, 'rail width', {
                case:'CASE', expected:RAIL, actual:rect(rail).width, computed:getComputedStyle(rail).width,
                body:document.body.className, row:row.className,
                variable:getComputedStyle(rail).getPropertyValue('--xp-track-width'),
                minWidth:getComputedStyle(rail).minWidth, inline:rail.style.cssText, styleRules,
             });
             if (BADGE) {
                const amount = badge.querySelector('.xp-boost-amount');
                const icon = badge.querySelector('.xp-boost-icon');
                check(visible(amount) === !ICON && visible(icon) === ICON, 'amount vs icon');
                check(getComputedStyle(badge).fontSize === '8.5px' && amount.textContent === '+95M', 'compact badge');
                check(row.title === text.title && /真实 Token/.test(row.title) &&
                      /扭蛋\\/宝箱经验包 95M（仅今日生效，不计入真实用量与费用）/.test(row.title), 'XP tooltip');
                check(id('evoProgressBox').textContent.includes('含经验包 +95M'), 'evolution tooltip text');
                const xp = rect(row), q = rect(quota), bp = rect(badge), tp = rect(text);
                check(xp.right <= q.left + 0.5 && bp.right <= q.left + 0.5 &&
                      tp.right <= q.left + 0.5 &&
                      q.right <= innerWidth + 0.5 && document.documentElement.scrollWidth <= innerWidth,
                      'no XP/quota collision or horizontal overflow', {xp: xp.right, text: tp.right, badge: bp.right, quota: q.left, edge: q.right, page: document.documentElement.scrollWidth});
                const value = text.querySelector('.xp-value');
                const quotaTop = quota.querySelector('.tq-top');
                check(id('tqName').textContent === 'Gemini Models · Weekly' && id('tqPct').textContent === '剩 84%' &&
                      rect(id('tqName')).right <= rect(id('tqPct')).left + 0.5 &&
                      quotaTop.scrollWidth <= quotaTop.clientWidth + 1, 'quota copy must remain intact');
                if (POPOVER) check(rect(brandRow).bottom <= rect(controls).top + 0.5, 'brand must not cross the controls row');
                if (!ICON && WIDTH === 452) check(value.scrollWidth <= value.clientWidth + 1 &&
                      value.textContent === '770.86M / 1B', 'Lv6 progress remains fully visible');
                check(rect(value).right <= bp.left + 0.5 && bp.top >= xp.top - 0.5 &&
                      bp.bottom <= xp.bottom + 0.5 && rect(title).bottom <= xp.top + 0.5 &&
                      rect(mood).right <= q.left + 0.5 && rect(logo).right <= rect(mood).left + 0.5 &&
                      rect(title).height < 22 && xp.height < 18 && rect(quota.querySelector('.tq-top')).height < 18,
                      'single-line title/XP/quota', {titleHeight: rect(title).height, xpHeight: xp.height, quotaHeight: rect(quota.querySelector('.tq-top')).height, mood: rect(mood).right, quota: q.left});
                check(document.querySelector('#evoGrid .current')?.dataset.locked === '0', 'current evolution unlocked');
             } else {
                check(!text.hasAttribute('title') && row.title === '点击查看九阶战力进化图鉴' &&
                      !id('evoProgressBox').textContent.includes('含经验包'), 'legacy text and tooltip restored');
             }
             check(id('evoHint').textContent.includes('战力经验 = 今日 Token + 扭蛋/宝箱经验包'), 'evolution footer');
             return 'PASS: WKWebView CASE (' + (badge ? (ICON ? '⚡' : '+95M') : text.textContent) + ')';
             };
            })()
            """
        func check(_ name: String, actual: String, xp: String = "95e6",
                   width: Int = 452, rail: Int = 36, badge: Bool = true,
                   icon: Bool = false, simple: Bool = false, debug: Bool = false) async throws {
            let replacements = [
                ("ACTUAL", actual), ("XP", xp), ("WIDTH", String(width)), ("RAIL", String(rail)),
                ("BADGE", String(badge)), ("ICON", String(icon)), ("SIMPLE", String(simple)),
                ("DEBUG", String(debug)), ("POPOVER", String(width == 452)), ("CASE", name),
            ]
            // Replace only uppercase whole-word fixture placeholders; do not
            // rewrite the production strings/JavaScript such as XP captions.
            var js = harness
            for (key, value) in replacements { js = js.replacingOccurrences(of: "\\b" + key + "\\b", with: value, options: .regularExpression) }
            // The live popover is measured after WebKit has committed the
            // rendered state, not while the update mutates layout classes.
            _ = try await eval("window.__tootooLayoutFixtureCheck = (" + js + "); true")
            try await Task.sleep(nanoseconds: 100_000_000)
            try await verify(name, "window.__tootooLayoutFixtureCheck()")
        }
        try await check("452 Lv6", actual: "675.86e6")
        try await check("452 Lv9 star", actual: "4.975e9", icon: true)
        try await check("452 EX Lv10", actual: "50.03e9", icon: true)
        try await check("452 no boost", actual: "675.86e6", xp: "0", rail: 52, badge: false)
        try await check("452 simple", actual: "675.86e6", rail: 52, badge: false, simple: true)
        try await check("452 debug simulation", actual: "675.86e6", rail: 52, badge: false, debug: true)
        window.setContentSize(NSSize(width: 900, height: 650))
        _ = try await eval("document.body.classList.remove('popover-mode'); true")
        try await Task.sleep(nanoseconds: 150_000_000)
        try await check("900 EX amount", actual: "50.03e9", width: 900, rail: 78)
    }
}

@main
struct QuotaLayoutSmoke {
    @MainActor static func main() {
        guard CommandLine.arguments.count == 2, let url = URL(string: CommandLine.arguments[1]),
              url.scheme == "http", url.host == "127.0.0.1", url.user == nil, url.password == nil else {
            FileHandle.standardError.write(Data("usage: xp-boost-layout <loopback fixture URL>\n".utf8))
            exit(2)
        }
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)
        let harness = LayoutHarness(url)
        app.delegate = harness
        app.run()
    }
}
