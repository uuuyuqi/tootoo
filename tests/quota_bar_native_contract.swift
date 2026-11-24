// Concatenated with the actual selectQuotaBar function from macos/main.swift in CI.
let noGemini: [(key: String, remaining: Int?, label: String)] = [
    ("gem5h", nil, "Gemini 5h"), ("gem7d", nil, "Gemini 周"),
    ("argon7d", nil, "Gemini 4 Argon 周额度"), ("codex", 35, "Codex 周"),
]
for mode in ["gem5h", "gem7d", "argon7d"] {
    let pinned = selectQuotaBar(mode: mode, bars: noGemini)
    precondition(pinned?.key == mode && pinned?.remaining == nil, "unavailable pin fell through")
}
precondition(selectQuotaBar(mode: "auto", bars: noGemini)?.key == "codex")
precondition(selectQuotaBar(mode: "none", bars: noGemini) == nil)
var recovered = noGemini
recovered[1].remaining = 0
precondition(selectQuotaBar(mode: "gem7d", bars: recovered)?.remaining == 0)
precondition(selectQuotaBar(mode: "auto", bars: recovered)?.key == "gem7d")
print("PASS: native pinned Gemini/Argon, no fallback, Auto, Off and real zero")
