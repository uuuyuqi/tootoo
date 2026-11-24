import AppKit
import Foundation
import WebKit

@MainActor
final class LayoutSmoke: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    let cases: [(String, Int)] = [("before",403), ("after",260), ("after",320), ("after",403), ("after",452)]
    let labels = ["Gemini Models · Weekly","Gemini Models · 5h","Claude and GPT models · Weekly","Claude and GPT models · 5h"]
    private var index = 0
    private var window: NSWindow!
    private var web: WKWebView!
    private let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)

    func applicationDidFinishLaunching(_ notification: Notification) { next() }

    private func next() {
        guard index < cases.count else { exit(0) }
        let (name,width) = cases[index]
        let bounds = NSRect(x: 0, y: 0, width: width, height: 420)
        window?.orderOut(nil)
        window = NSWindow(contentRect: bounds, styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        web = WKWebView(frame: bounds, configuration: config)
        web.navigationDelegate = self
        window.contentView = web
        window.orderFrontRegardless()
        let source = root.appendingPathComponent(name + ".html")
        web.loadFileURL(source, allowingReadAccessTo: source)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let (name,width) = cases[index]
        let script = """
        [...document.querySelectorAll('.quota-item')].map(row => {
          const coord=(sel,k)=>row.querySelector(sel).getBoundingClientRect()[k];
          return {
            barLeft:coord('.quota-track','left'), barRight:coord('.quota-track','right'),
            percentRight:coord('.quota-pct','right'), resetRight:coord('.quota-rst','right'),
            label:row.querySelector('.quota-lbl').textContent,
            fit:row.scrollWidth <= row.clientWidth && row.getBoundingClientRect().right <= innerWidth
          };
        });
        """
        webView.evaluateJavaScript(script) { [self] value, error in
            guard error == nil, let rows = value as? [[String:Any]],
                  rows.count == labels.count, rows.compactMap({$0["label"] as? String}) == labels else {
                fatalError("Missing layout geometry at \(name)/\(width): \(String(describing: error))")
            }
            let keys = ["barLeft","barRight","percentRight","resetRight"]
            let equal = keys.allSatisfy { key in
                let xs = rows.compactMap { $0[key] as? Double }
                return xs.count == rows.count && xs.allSatisfy { abs($0 - xs[0]) < 0.1 }
            }
            if name == "before" {
                precondition(!equal, "Fixture did not reproduce old staggered columns")
            } else {
                precondition(equal && rows.allSatisfy { $0["fit"] as? Bool == true }, "Unaligned or overflowing at \(width): \(rows)")
            }
            print("PASS \(name) WKWebView width=\(width), aligned=\(equal), bounds=\(rows.map { row in keys.compactMap { row[$0] } })")
            if width == 403 || (name == "after" && width == 320) {
                let cfg = WKSnapshotConfiguration()
                cfg.rect = CGRect(x: 0, y: 0, width: width, height: 280)
                webView.takeSnapshot(with: cfg) { [self] image, error in
                    guard error == nil, let tiff = image?.tiffRepresentation,
                          let bitmap = NSBitmapImageRep(data: tiff),
                          let png = bitmap.representation(using: .png, properties: [:]) else {
                        fatalError("Could not capture \(name)/\(width): \(String(describing: error))")
                    }
                    try! png.write(to: root.appendingPathComponent("\(name)-\(width).png"))
                    index += 1
                    next()
                }
            } else {
                index += 1
                next()
            }
        }
    }
}

@main
enum Entry {
    @MainActor static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        let delegate = LayoutSmoke()
        app.delegate = delegate
        DispatchQueue.main.asyncAfter(deadline: .now() + 35) {
            fputs("Timed out waiting for WebKit layout\n", stderr)
            exit(1)
        }
        app.run()
    }
}
