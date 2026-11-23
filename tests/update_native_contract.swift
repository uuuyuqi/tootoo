import Foundation

@main struct UpdateNativeTest {
    static func main() throws {
        let base = "https://github.com/uuuyuqi/tootoo/releases"
        let zip = base + "/download/v0.2.5/TooToo-v0.2.5-macos-universal.zip"
        let valid: [String: String] = [
            "currentVersion": "0.2.4", "latestVersion": "0.2.5", "status": "available",
            "releaseURL": base + "/tag/v0.2.5", "archiveURL": zip, "checksumURL": zip + ".sha256"
        ]
        func release(_ replacements: [String: String] = [:]) throws -> UpdateRelease {
            let json = try JSONSerialization.data(withJSONObject: valid.merging(replacements) { _, new in new })
            return try JSONDecoder().decode(UpdateRelease.self, from: json)
        }
        let good = try release()
        precondition(good.approvedArchive(current: "0.2.4")?.zip == zip)
        precondition(good.approvedArchive(current: "0.2.5") == nil)
        for invalid in [
            ["archiveURL": "https://example.com/TooToo-v0.2.5-macos-universal.zip"],
            ["archiveURL": zip + "?malicious"],
            ["checksumURL": zip + ".sha256?malicious"],
            ["latestVersion": "0.2.4"],
            ["latestVersion": "0.02.5"],
            ["status": "current"],
            ["releaseURL": base + "/tag/v0.2.6"]
        ] {
            let rejected = try release(invalid)
            precondition(rejected.approvedArchive(current: "0.2.4") == nil, "\(invalid)")
        }
        print("PASS: native accepts only exact official higher versions and bound archive, checksum, and tag")
    }
}
