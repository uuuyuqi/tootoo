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
    var closeError: Error?

    init(_ url: URL) { self.url = url }

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
        popover.animates = false
        popover.delegate = self
        web.navigationDelegate = self
        popover.show(relativeTo: anchor.bounds, of: anchor, preferredEdge: .minY)
        web.load(URLRequest(url: url))
        DispatchQueue.main.asyncAfter(deadline: .now() + 34) {
            self.fail(SmokeError("global timeout"))
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard !started else { return }
        started = true
        Task { @MainActor in
            do {
                try await self.run()
                print("PASS: WKWebView/NSPopover: both games pause, preserve, resume, and intentionally reset")
                print("PASS: WKWebView OfflineAudioContext: production tone renders a non-silent buffer; mute renders silence (no audible-output check)")
                exit(0)
            } catch { self.fail(error) }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        fail(error)
    }

    func popoverDidClose(_ notification: Notification) {
        web.evaluateJavaScript("window.__onPopoverClose()") { _, error in
            if let error = error { self.closeError = error }
            self.closeCount += 1
        }
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
        for _ in 0..<70 {
            if try await test() { return }
            try await Task.sleep(nanoseconds: 45_000_000)
        }
        throw SmokeError(description)
    }

    private func run() async throws {
        try await assertJS("typeof window.__onPopoverOpen === 'function' && typeof window.__onPopoverClose === 'function'", "app JS bootstrap")
        _ = try await evalJS("sfxEnabled = false; window.__onPopoverOpen(); true")
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
            if let closeError = closeError { throw closeError }
            try await assertJS("""
                \(prop) === window.__qaArcadeRound && \(prop).pausedForPopover &&
                !\(prop).running && \(raf) === null && !\(keys).left && !\(keys).right &&
                document.getElementById('\(game)Overlay').classList.contains('hidden')
                """, game + " paused in place")
            _ = try await evalJS("window.__qaArcadeTick = \(prop).lastTs; true")
            try await Task.sleep(nanoseconds: 250_000_000)
            try await assertJS("\(prop).lastTs === window.__qaArcadeTick", game + " no ticks while hidden")
            popover.show(relativeTo: anchor.bounds, of: anchor, preferredEdge: .minY)
            _ = try await evalJS("window.__onPopoverOpen(); true")
            try await assertJS("""
                \(prop) === window.__qaArcadeRound && \(prop).running && !\(prop).pausedForPopover &&
                \(raf) !== null && \(prop).lastTs > window.__qaArcadeTick
                """, game + " same round resumed")
            _ = try await evalJS("document.getElementById('arcadeCloseBtn').click(); true")
            try await assertJS("""
                !\(prop) && \(raf) === null &&
                !document.getElementById('\(game)Overlay').classList.contains('hidden')
                """, game + " intentional exit resets")
        }
        try await testOfflineSound()
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

guard CommandLine.arguments.count == 2,
      let url = URL(string: CommandLine.arguments[1]),
      url.scheme == "http", url.host == "127.0.0.1",
      url.user == nil, url.password == nil else {
    fatalError("Usage: ArcadePopoverSmoke 'http://127.0.0.1:PORT/?mode=popover'")
}
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let harness = Harness(url)
app.delegate = harness
app.run()
