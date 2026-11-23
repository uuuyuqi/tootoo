import AppKit
import CryptoKit
import Foundation

private let officialReleases = "https://github.com/uuuyuqi/tootoo/releases"

struct UpdateRelease: Decodable {
    let currentVersion: String
    let latestVersion: String?
    let status: String
    let notes: String?
    let releaseURL: String?
    let archiveURL: String?
    let checksumURL: String?
    let error: String?

    private static func stableVersion(_ version: String) -> [Int]? {
        guard version.range(of: #"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$"#,
                            options: .regularExpression) != nil else { return nil }
        let parts = version.split(separator: ".").compactMap { Int($0) }
        return parts.count == 3 ? parts : nil
    }

    func approvedArchive(current: String) -> (version: String, zip: String, checksum: String)? {
        guard status == "available", currentVersion == current, let version = latestVersion,
              let old = Self.stableVersion(current), let new = Self.stableVersion(version),
              old.lexicographicallyPrecedes(new) else { return nil }
        let page = "\(officialReleases)/tag/v\(version)"
        let zip = "\(officialReleases)/download/v\(version)/TooToo-v\(version)-macos-universal.zip"
        guard releaseURL == page, archiveURL == zip, checksumURL == zip + ".sha256" else { return nil }
        return (version, zip, zip + ".sha256")
    }

    var approvedPage: String? {
        guard let version = latestVersion, Self.stableVersion(version) != nil else { return nil }
        let page = "\(officialReleases)/tag/v\(version)"
        return releaseURL == page ? page : nil
    }
}

final class NativeUpdateController {
    private let current = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.0.0"
    private let publishState: (String) -> Void
    private let backendIsRunning: () -> Bool
    private let executable: () -> String
    let backendNonce = UUID().uuidString
    private var port: UInt16?
    private var release: UpdateRelease?
    private var status = "idle"
    private var error: String?
    private var progress: Double?
    private var hasInstallerError = false
    private var checking = false
    private var installing = false
    private var timer: Timer?
    private var helper: Process?

    init(backendIsRunning: @escaping () -> Bool, executable: @escaping () -> String,
         publishState: @escaping (String) -> Void) {
        self.backendIsRunning = backendIsRunning
        self.executable = executable
        self.publishState = publishState
        #if !TOOTOO_DEBUG
        readInstallerResult()
        #endif
    }

    var availableVersion: String? {
        status == "available" || status == "error" ? release?.latestVersion : nil
    }

    func start(port: UInt16) {
        self.port = port
        scheduleCheck(in: 12)
    }

    private func scheduleCheck(in seconds: TimeInterval) {
        timer?.invalidate()
        let timer = Timer(timeInterval: seconds, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            self.check()
            self.scheduleCheck(in: 6 * 60 * 60)
        }
        self.timer = timer
        RunLoop.main.add(timer, forMode: .common)
    }

    private var eligibleBundle: URL? {
        #if TOOTOO_DEBUG
        return nil
        #else
        let local = Bundle.main.bundleURL.standardizedFileURL
        let resolved = local.resolvingSymlinksInPath()
        let fm = FileManager.default
        guard Bundle.main.bundleIdentifier == "com.tootoo.telemetry",
              local.isFileURL, local == resolved, local.lastPathComponent == "TooToo.app",
              !local.path.contains("/AppTranslocation/"),
              let resources = Bundle.main.resourceURL,
              fm.fileExists(atPath: resources.appendingPathComponent(".release").path),
              fm.isWritableFile(atPath: local.path),
              fm.isWritableFile(atPath: local.deletingLastPathComponent().path) else { return nil }
        return local
        #endif
    }

    func sync() {
        let payload: [String: Any] = [
            "currentVersion": current, "latestVersion": release?.latestVersion as Any? ?? NSNull(),
            "status": status, "notes": release?.notes?.prefix(1200).description ?? "",
            "canInstall": !installing && eligibleBundle != nil && release?.approvedArchive(current: current) != nil,
            "progress": progress as Any? ?? NSNull(), "error": error as Any? ?? NSNull(),
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        publishState("window.__onUpdateState && window.__onUpdateState(\(json));")
    }

    func check(force: Bool = false) {
        guard !checking, !installing else { return }
        guard let port = port, backendIsRunning(),
              let url = URL(string: "http://127.0.0.1:\(port)/api/update" + (force ? "?force=1" : "")) else {
            if force { fail("TooToo 本地服务尚未就绪，请稍后重试。") }
            return
        }
        checking = true
        let priorStatus = status
        if force { hasInstallerError = false; status = "checking"; error = nil; sync() }
        let challenge = UUID().uuidString
        let key = SymmetricKey(data: Data(backendNonce.utf8))
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 7)
        request.setValue(challenge, forHTTPHeaderField: "X-TooToo-Update-Challenge")
        URLSession.shared.dataTask(with: request) { [weak self] data, response, _ in
            let result: UpdateRelease?
            if let bytes = data, bytes.count <= 24_000, let http = response as? HTTPURLResponse,
               http.statusCode == 200, http.url == url,
               let proof = http.value(forHTTPHeaderField: "X-TooToo-Update-Proof"),
               Self.matchesProof(proof, challenge: challenge, body: bytes, key: key) {
                result = try? JSONDecoder().decode(UpdateRelease.self, from: bytes)
            } else {
                result = nil
            }
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.checking = false
                if let info = result, self.backendIsRunning(),
                   info.currentVersion == self.current, ["current", "available"].contains(info.status),
                   info.approvedPage != nil {
                    self.release = info
                    if !self.hasInstallerError {
                        self.status = info.status
                        self.error = nil
                    }
                } else if force {
                    self.fail("暂时无法检查更新，请稍后重试或打开发布页。")
                    return
                } else {
                    self.status = priorStatus
                }
                self.sync()
            }
        }.resume()
    }

    private static func matchesProof(_ proof: String, challenge: String, body: Data, key: SymmetricKey) -> Bool {
        guard proof.utf8.count == 64 else { return false }
        var raw = Data()
        var i = proof.startIndex
        while i < proof.endIndex {
            guard let next = proof.index(i, offsetBy: 2, limitedBy: proof.endIndex),
                  let byte = UInt8(proof[i..<next], radix: 16) else { return false }
            raw.append(byte)
            i = next
        }
        var signedBytes = Data(challenge.utf8)
        signedBytes.append(0)
        signedBytes.append(body)
        return HMAC<SHA256>.isValidAuthenticationCode(raw, authenticating: signedBytes, using: key)
    }

    func openRelease() {
        if let url = URL(string: release?.approvedPage ?? officialReleases + "/latest") {
            NSWorkspace.shared.open(url)
        }
    }

    func install() {
        #if TOOTOO_DEBUG
        fail("调试版只能检查更新，请从发布页下载正式版。")
        #else
        guard !checking, !installing else { return }
        guard let candidate = release?.approvedArchive(current: current), backendIsRunning(),
              let bundle = eligibleBundle, let helperURL = Bundle.main.resourceURL?.appendingPathComponent("update_install.py"),
              FileManager.default.isReadableFile(atPath: helperURL.path) else {
            fail("这个安装位置不能自动替换，或更新文件尚未就绪。请从发布页下载。")
            return
        }
        installing = true            // Also excludes re-entry through a nested modal event loop.
        let alert = NSAlert()
        alert.messageText = "将 TooToo 从 v\(current) 更新到 v\(candidate.version)？"
        alert.informativeText = "下载和校验通过后，TooToo 会退出并重新打开，当前的防休眠会关闭。设置和存档不会被改动。"
        alert.addButton(withTitle: "下载并更新")
        alert.addButton(withTitle: "取消")
        NSApp.activate(ignoringOtherApps: true)
        guard alert.runModal() == .alertFirstButtonReturn else { installing = false; sync(); return }
        status = "downloading"; progress = nil; error = nil; sync()
        let pid = String(ProcessInfo.processInfo.processIdentifier)
        var stagedPath: String?
        var stageError: String?
        do {
            helper = try launchHelper(helperURL, arguments: ["stage", "--version", candidate.version,
                    "--zip-url", candidate.zip, "--checksum-url", candidate.checksum,
                    "--bundle", bundle.path, "--parent", pid], event: { info in
                switch info["status"] as? String {
                case "downloading":
                    self.status = "downloading"
                    self.progress = (info["progress"] as? Double).map { min(100, max(0, $0 * 100)) }
                    self.sync()
                case "verifying":
                    self.status = "verifying"; self.progress = nil; self.sync()
                case "staged": stagedPath = info["stagingPath"] as? String
                case "error": stageError = info["error"] as? String
                default: break
                }
            }, exited: { result in
                self.helper = nil
                guard result == 0, let path = stagedPath else {
                    self.fail(stageError ?? "下载或校验失败，原应用未改变。")
                    return
                }
                self.swap(helperURL, stagingPath: path, bundle: bundle, pid: pid)
            })
        } catch {
            fail("无法启动更新工具，原应用未改变。")
        }
        #endif
    }

    #if !TOOTOO_DEBUG
    private func readInstallerResult() {
        let group = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Library/Caches/com.tootoo.telemetry")
        let file = group.appendingPathComponent("update-result.json")
        guard let values = try? file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey]),
              values.isRegularFile == true, values.isSymbolicLink == false, (values.fileSize ?? 8192) < 8192 else { return }
        if let data = try? Data(contentsOf: file), data.count < 8192,
           let record = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
           record["bundlePath"] as? String == Bundle.main.bundleURL.resolvingSymlinksInPath().path,
           let message = record["error"] as? String, !message.isEmpty {
            try? FileManager.default.removeItem(at: file)
            hasInstallerError = true
            status = "error"; error = String(message.prefix(300))
        }
    }

    private func swap(_ helperURL: URL, stagingPath: String, bundle: URL, pid: String) {
        status = "installing"; progress = nil; sync()
        var ready = false
        var installError: String?
        do {
            helper = try launchHelper(helperURL,
                    arguments: ["install", "--staged", stagingPath, "--bundle", bundle.path, "--parent", pid],
                    event: { info in
                switch info["status"] as? String {
                case "ready":
                    ready = true
                    NSApp.terminate(nil)
                case "error": installError = info["error"] as? String
                default: break
                }
            }, exited: { _ in
                self.helper = nil
                if !ready {
                    self.discard(helperURL, stagingPath: stagingPath, bundle: bundle, pid: pid)
                    self.fail(installError ?? "无法安全替换应用，原应用未改变。")
                }
            })
        } catch {
            discard(helperURL, stagingPath: stagingPath, bundle: bundle, pid: pid)
            fail("无法启动替换工具，原应用未改变。")
        }
    }

    private func discard(_ helperURL: URL, stagingPath: String, bundle: URL, pid: String) {
        _ = try? launchHelper(helperURL, arguments: ["discard", "--staged", stagingPath,
            "--bundle", bundle.path, "--parent", pid], event: { _ in }, exited: { _ in })
    }

    private func launchHelper(_ script: URL, arguments: [String],
                              event: @escaping ([String: Any]) -> Void,
                              exited: @escaping (Int32) -> Void) throws -> Process {
        let proc = Process()
        let pipe = Pipe()
        proc.executableURL = URL(fileURLWithPath: executable())
        proc.arguments = ["-I", script.path] + arguments
        proc.standardInput = FileHandle.nullDevice
        proc.standardOutput = pipe
        proc.standardError = FileHandle.nullDevice
        try proc.run()
        try? pipe.fileHandleForWriting.close()
        DispatchQueue.global(qos: .utility).async {
            let rd = pipe.fileHandleForReading
            var pending = Data()
            while true {
                let bytes = rd.availableData
                if bytes.isEmpty { break }
                pending.append(bytes)
                while let stop = pending.firstIndex(of: 10) {
                    let line = pending.prefix(upTo: stop)
                    pending.removeSubrange(...stop)
                    if line.count < 16_384, let payload = (try? JSONSerialization.jsonObject(with: line)) as? [String: Any] {
                        DispatchQueue.main.async { event(payload) }
                    }
                }
                if pending.count >= 16_384 { pending.removeAll() }
            }
            proc.waitUntilExit()
            DispatchQueue.main.async { exited(proc.terminationStatus) }
        }
        return proc
    }
    #endif

    private func fail(_ message: String) {
        installing = false; status = "error"; error = String(message.prefix(300)); progress = nil
        sync()
    }
}
