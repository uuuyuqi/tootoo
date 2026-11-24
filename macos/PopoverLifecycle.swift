// All transitions run on AppKit's main thread. isShown alone cannot tell
// whether a close animation or the user's newer open request is authoritative.
final class PopoverLifecycle {
    private(set) var visible = false
    private(set) var generation = 0
    private var closingGeneration: Int?
    private let publish: (Snapshot) -> Void

    struct Snapshot {
        let generation: Int
        let visible: Bool

        var javaScript: String {
            "window.__onPopoverVisibility && window.__onPopoverVisibility({generation: \(generation), visible: \(visible)});"
        }
    }

    init(publish: @escaping (Snapshot) -> Void) {
        self.publish = publish
    }

    var snapshot: Snapshot { Snapshot(generation: generation, visible: visible) }

    func sync() { publish(snapshot) }

    func openRequested() {
        guard !visible else { return }
        visible = true
        generation += 1
        sync()
    }

    func willClose() {
        guard visible else { return }
        visible = false
        generation += 1
        closingGeneration = generation
        sync()
    }

    func didShow() {
        // The document or WebKit visibility state may have changed mid-animation.
        if visible { sync() }
    }

    // Return whether AppKit dropped the newer show request during an animated
    // close. An old completion must never publish "hidden" or stop the monitor.
    func didClose(isShown: Bool) -> Bool {
        guard let closed = closingGeneration else { return false }
        closingGeneration = nil
        return visible && closed < generation && !isShown
    }
}
