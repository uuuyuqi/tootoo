import AppKit

let args = CommandLine.arguments
let config = NSWorkspace.OpenConfiguration()
config.createsNewApplicationInstance = true
config.activates = false
// Finder/LaunchServices semantics with an isolated home; no CLI in PATH.
config.environment = ["HOME": args[2], "PATH": "/usr/bin:/bin", "TOOTOO_HOME": args[3],
                      "CODEX_HOME": args[2] + "/.codex", "TOOTOO_CODEX_APP_SERVER": "0"]
if args[4] == "off" { config.arguments = ["-agyQuotaAutoDisabled", "YES"] }
let deadline = Date().addingTimeInterval(20)
var finished = false
var status: Int32 = 1
NSWorkspace.shared.openApplication(at: URL(fileURLWithPath: args[1]), configuration: config) { app, error in
    DispatchQueue.main.async {
    if let app {
        print(app.processIdentifier)
        status = 0
    } else {
        fputs("LaunchServices error: \(String(describing: error))\n", stderr)
    }
    finished = true
    }
}
while !finished && Date() < deadline {
    _ = RunLoop.main.run(mode: .default, before: Date().addingTimeInterval(0.1))
}
exit(status)
