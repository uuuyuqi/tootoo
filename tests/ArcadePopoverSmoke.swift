// Standalone disposable macOS QA executable. Runs the app HTML in a real WKWebView
// inside an actual NSPopover. JavaScript clicks below are simulated, not trusted
// gestures; this deliberately does not claim audible Web Audio playback.
import AppKit
import Foundation
import WebKit

struct SmokeError: Error, CustomStringConvertible {
    let description: String
    init(_ message: String) { description = message }
}

@MainActor
final class Harness: NSObject, NSApplicationDelegate, WKNavigationDelegate, NSPopoverDelegate {
    let url: URL
    let testGacha: Bool
    let window = NSWindow(contentRect: NSRect(x: 120, y: 80, width: 520, height: 720),
                          styleMask: [.titled, .closable], backing: .buffered, defer: false)
    let anchor = NSButton(frame: NSRect(x: 20, y: 670, width: 150, height: 26))
    let popover = NSPopover()
    lazy var web: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 452, height: 640), configuration: configuration)
        view.setValue(false, forKey: "drawsBackground")
        return view
    }()
    var started = false
    var closeCount = 0
    var lifecycleError: Error?
    lazy var lifecycle = PopoverLifecycle { [weak self] snapshot in
        guard let self = self, self.started else { return }
        self.web.evaluateJavaScript(snapshot.javaScript + " true") { [weak self] _, error in
            if let error = error { self?.lifecycleError = error }
        }
    }

    init(_ url: URL, testGacha: Bool = false) {
        self.url = url
        self.testGacha = testGacha
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        window.title = "TooToo isolated arcade smoke"
        anchor.title = "QA popover anchor"
        window.contentView?.addSubview(anchor)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        let vc = NSViewController()
        vc.view = web
        vc.preferredContentSize = NSSize(width: 452, height: 640)
        popover.contentViewController = vc
        popover.behavior = .transient
        popover.animates = true
        popover.delegate = self
        web.navigationDelegate = self
        requestOpen()
        web.load(URLRequest(url: url))
        DispatchQueue.main.asyncAfter(deadline: .now() + 34) {
            self.fail(SmokeError("global timeout"))
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !started else { return }
        started = true
        lifecycle.sync()
        Task { @MainActor in
            do {
                if self.testGacha {
                    try await self.runGacha()
                    print("PASS: WKWebView/NSPopover lands N/MISS before the result; native close/reopen does not replay the interrupted SR draw")
                    exit(0)
                }
                try await self.run()
                print("PASS: WKWebView/NSPopover: both games pause, preserve, resume after animated close/immediate reopen, and intentionally reset")
                print("PASS: WKWebView OfflineAudioContext: production tone renders a non-silent buffer; mute renders silence (no audible-output check)")
                exit(0)
            } catch { self.fail(error) }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        fail(error)
    }

    private func requestOpen() {
        lifecycle.openRequested()
        showPopover()
    }

    private func showPopover() {
        popover.show(relativeTo: anchor.bounds, of: anchor, preferredEdge: .minY)
    }

    func popoverWillClose(_ notification: Notification) { lifecycle.willClose() }

    func popoverDidShow(_ notification: Notification) { lifecycle.didShow() }

    func popoverDidClose(_ notification: Notification) {
        guard !popover.isShown else { return }
        closeCount += 1
        if lifecycle.didClose(isShown: false) { showPopover() }
    }

    private func fail(_ error: Error) -> Never {
        FileHandle.standardError.write(Data(("FAIL: \(error)\n").utf8))
        exit(1)
    }

    private func evalJS(_ code: String) async throws -> Any? {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Any?, Error>) in
            web.evaluateJavaScript(code) { value, error in
                if let error = error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: value) }
            }
        }
    }

    private func assertJS(_ code: String, _ description: String) async throws {
        let result = try await evalJS(code)
        guard (result as? NSNumber)?.boolValue == true else {
            throw SmokeError(description + ": " + String(describing: result))
        }
    }

    private func waitFor(_ description: String, _ test: () async throws -> Bool) async throws {
        for _ in 0..<100 {
            if try await test() { return }
            try await Task.sleep(nanoseconds: 45_000_000)
        }
        throw SmokeError(description)
    }

    private func openGacha(_ tier: String) async throws {
        _ = try await evalJS("""
            sfxEnabled = false;
            debugState.active = true;
            debugState.gachaCoins = 5;
            debugState.gachaForce = "\(tier)";
            document.getElementById('bootLoader')?.remove();
            document.getElementById('gachaBtn').click();
            true
            """)
        try await assertJS("document.getElementById('gachaModal').classList.contains('open') && !document.hidden", "visible gacha modal")
    }

    private func runGacha() async throws {
        if (try await evalJS("matchMedia('(prefers-reduced-motion: reduce)').matches") as? NSNumber)?.boolValue == true {
            throw SmokeError("runner starts with Reduce Motion on; this fixture requires normal motion")
        }
        try await assertJS("DEV_DEBUG_ENABLED && typeof window.__onPopoverVisibility === 'function'", "packaged Debug JS bootstrap")
        for (index, tier) in ["N", "MISS"].enumerated() {
            try await openGacha(tier)
            _ = try await evalJS("""
                window.__qaGacha = {frames: [], done: false, result: null};
                (() => {
                    const machine = document.getElementById('gachaMachine');
                    const cap = machine.querySelector('.gm-dispensed');
                    const result = document.getElementById('gachaResult');
                    const button = document.getElementById('gachaPullBtn');
                    button.scrollIntoView({block: 'nearest'});
                    const check = window.__qaGacha;
                    const baselineY = () => cap.getBoundingClientRect().y - machine.getBoundingClientRect().y;
                    check.animationEvents = [];
                    // Wait until scroll/layout has painted and the popover has active frame delivery.
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        check.start = baselineY();
                        check.hiddenAtStart = +getComputedStyle(cap).opacity === 0;
                        const startedAt = performance.now();
                        const markAnimation = event => {
                            if (event.target === cap && event.animationName === 'gmDispense') {
                                check.animationEvents.push(event.type);
                            }
                        };
                        machine.addEventListener('animationstart', markAnimation);
                        machine.addEventListener('animationend', markAnimation);
                        button.click();
                        check.startedShaking = machine.classList.contains('shaking');
                        const frame = () => {
                            const rect = cap.getBoundingClientRect();
                            const y = baselineY();
                            const opacity = +getComputedStyle(cap).opacity;
                            const reveal = result.classList.contains('tier-\(tier)');
                            const landed = machine.classList.contains('dispensed');
                            check.frames.push({y, opacity, elapsed: Math.round(performance.now() - startedAt),
                                shake: machine.classList.contains('shaking'), drop: machine.classList.contains('dispensing'),
                                reveal, landed});
                            if ((landed && reveal && opacity === 1) || performance.now() - startedAt > 2800) {
                                check.result = check.hiddenAtStart && check.startedShaking &&
                                    check.frames.some(f => f.drop && f.opacity > 0 && f.y > check.start + 5 && !f.reveal) &&
                                    check.frames.every(f => !f.reveal || f.landed) &&
                                    landed && reveal && y > check.start + 12 && rect.bottom < button.getBoundingClientRect().y &&
                                    opacity === 1 && debugState.gachaSpent === \(index + 1);
                                machine.removeEventListener('animationstart', markAnimation);
                                machine.removeEventListener('animationend', markAnimation);
                                check.done = true;
                                return;
                            }
                            requestAnimationFrame(frame);
                        };
                        frame();
                    }));
                })();
                true
                """)
            try await waitFor(tier + " result after the visible drop") {
                (try await self.evalJS("window.__qaGacha.done") as? NSNumber)?.boolValue == true
            }
            try await assertJS("window.__qaGacha.result || JSON.stringify(window.__qaGacha)", tier + " visible drop, stable landing, one debit")
            _ = try await evalJS("document.getElementById('gachaCloseBtn').click(); true")
        }

        try await openGacha("SR")
        _ = try await evalJS("document.getElementById('gachaPullBtn').click(); true")
        let nextClose = closeCount + 1
        popover.performClose(nil)
        try await waitFor("native close callback") { self.closeCount >= nextClose }
        try await waitFor("WebKit received native hidden state") {
            (try await self.evalJS("!popoverVisible") as? NSNumber)?.boolValue == true
        }
        requestOpen()
        try await waitFor("native popover is visible again") {
            guard self.popover.isShown, self.lifecycle.visible else { return false }
            let visible = try await self.evalJS("!document.hidden && popoverVisible")
            return (visible as? NSNumber)?.boolValue == true
        }
        try await openGacha("SR")
        try await waitFor("SR still settles after native close/reopen") {
            (try await self.evalJS("document.getElementById('gachaResult').classList.contains('tier-SR')") as? NSNumber)?.boolValue == true
        }
        try await assertJS("""
            debugState.gachaSpent === 3 &&
            !document.getElementById('gachaMachine').matches('.dispensing,.dispensed') &&
            !document.getElementById('gachaResult').classList.contains('pop') &&
            !document.getElementById('gachaCinema').classList.contains('open')
            """, "interrupted draw has no late animation or double debit")
        if let lifecycleError = lifecycleError { throw lifecycleError }
    }

    private func run() async throws {
        try await assertJS("typeof window.__onPopoverVisibility === 'function'", "app JS bootstrap")
        _ = try await evalJS("sfxEnabled = false; true")
        for game in ["blaster", "rain"] {
            let prop = game + "State"
            let raf = game + "Raf"
            let keys = game == "blaster" ? "blKeys" : "rainKeys"
            _ = try await evalJS("""
                document.getElementById('arcadeBtn').click();
                document.querySelector('#arcadeTabs button[data-game="\(game)"]').click();
                document.getElementById('\(game)StartBtn').click();
                window.__qaArcadeRound = \(prop);
                true
                """)
            try await assertJS("!!\(prop)?.running && \(raf) !== null", game + " starts")
            let nextClose = closeCount + 1
            _ = try await evalJS("\(keys).left = true; true")
            popover.performClose(nil)
            try await waitFor(game + " native close callback") { self.closeCount >= nextClose }
            if let lifecycleError = lifecycleError { throw lifecycleError }
            try await assertJS("""
                \(prop) === window.__qaArcadeRound && \(prop).pausedForPopover &&
                !\(prop).running && \(raf) === null && !\(keys).left && !\(keys).right &&
                document.getElementById('\(game)Overlay').classList.contains('hidden')
                """, game + " paused in place")
            _ = try await evalJS("window.__qaArcadeTick = \(prop).lastTs; true")
            try await Task.sleep(nanoseconds: 250_000_000)
            try await assertJS("\(prop).lastTs === window.__qaArcadeTick", game + " no ticks while hidden")
            requestOpen()
            try await waitFor(game + " same round resumed after normal reopen") {
                try await self.resumed(prop: prop, raf: raf)
            }

            // Real animated AppKit close and immediate reopen in the same turn:
            // do not wait for didClose, WebKit, or any animation timer first.
            _ = try await evalJS("window.__qaArcadeTick = \(prop).lastTs; true")
            let rapidCloseCount = closeCount
            lifecycle.willClose()
            popover.performClose(nil)
            let stale = lifecycle.snapshot
            guard !stale.visible else { throw SmokeError(game + " native close request did not advance lifecycle") }
            requestOpen()
            try await waitFor(game + " shown and advancing after immediate reopen") {
                guard self.popover.isShown else { return false }
                return try await self.resumed(prop: prop, raf: raf)
            }
            // Some AppKit versions deliver didClose inline or cancel it during
            // reopen. Re-deliver the captured pre-reopen snapshot to exercise
            // WebKit's out-of-order guard on all supported runners.
            _ = try await evalJS(stale.javaScript + " true")
            _ = try await evalJS("window.__qaArcadeTick = \(prop).lastTs; true")
            try await Task.sleep(nanoseconds: 500_000_000)
            guard popover.isShown, lifecycle.visible else {
                throw SmokeError(game + " popover did not stay open")
            }
            try await assertJS("!!\(prop)?.running && !\(prop).pausedForPopover && \(raf) !== null && \(prop).lastTs > window.__qaArcadeTick && \(prop) === window.__qaArcadeRound", game + " survives stale close")
            if let lifecycleError = lifecycleError { throw lifecycleError }
            print("AppKit rapid close callbacks for \(game): \(closeCount - rapidCloseCount)")
            _ = try await evalJS("document.getElementById('arcadeCloseBtn').click(); true")
            try await assertJS("""
                !\(prop) && \(raf) === null &&
                !document.getElementById('\(game)Overlay').classList.contains('hidden')
                """, game + " intentional exit resets")
        }
        try await testOfflineSound()
    }

    private func resumed(prop: String, raf: String) async throws -> Bool {
        let result = try await evalJS("""
            \(prop) === window.__qaArcadeRound && \(prop).running && !\(prop).pausedForPopover &&
            \(raf) !== null && \(prop).lastTs > window.__qaArcadeTick
            """)
        return (result as? NSNumber)?.boolValue == true
    }

    // This exercises real WebKit oscillators, gain envelopes and PCM rendering
    // via the live app's playTone. The running facade deliberately avoids device
    // output, autoplay policy, and trusted-gesture dependencies.
    private func testOfflineSound() async throws {
        _ = try await evalJS("""
            window.__qaAudioResult = 'pending';
            (async () => {
                const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
                if (!Offline) throw new Error('OfflineAudioContext missing');
                const previous = audioCtx, wasEnabled = sfxEnabled;
                async function render(enabled) {
                    const offline = new Offline(1, 44100, 44100);
                    audioCtx = {
                        state: 'running', currentTime: 0, destination: offline.destination,
                        createOscillator: () => offline.createOscillator(),
                        createGain: () => offline.createGain()
                    };
                    sfxEnabled = enabled;
                    playTone(440, 0.16, 'sine', 0.08);
                    const buffer = await offline.startRendering();
                    return buffer.getChannelData(0).some(sample => Math.abs(sample) > 0.001);
                }
                try {
                    if (!(await render(true))) throw new Error('tone PCM was silent');
                    if (await render(false)) throw new Error('mute PCM was not silent');
                    window.__qaAudioResult = 'pass';
                } finally {
                    audioCtx = previous;
                    sfxEnabled = wasEnabled;
                }
            })().catch(error => { window.__qaAudioResult = 'error: ' + error; });
            true
            """)
        try await waitFor("offline Web Audio rendering completion") {
            let state = try await self.evalJS("window.__qaAudioResult") as? String
            if let state = state, state.hasPrefix("error:") { throw SmokeError(state) }
            return state == "pass"
        }
    }
}

@main
struct ArcadePopoverSmoke {
    @MainActor static func main() {
        guard (2...3).contains(CommandLine.arguments.count),
              let url = URL(string: CommandLine.arguments[1]),
              url.scheme == "http", url.host == "127.0.0.1",
              url.user == nil, url.password == nil else {
            fatalError("Usage: ArcadePopoverSmoke 'http://127.0.0.1:PORT/?mode=popover'")
        }
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)
        let harness = Harness(url, testGacha: CommandLine.arguments.dropFirst(2).first == "--gacha")
        app.delegate = harness
        app.run()
    }
}
