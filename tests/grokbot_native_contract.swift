// CI concatenates this with the parser and selector extracted from macos/main.swift.
func quotas(_ buckets: [[String: Any]]) -> [String: Any] {
    ["grokbot": ["buckets": buckets]]
}
let weekly = "grokbot:weekly"
let now: TimeInterval = 100
precondition(grokBotWeeklyRemaining([:], now: now) == nil)
precondition(grokBotWeeklyRemaining(quotas([["key": "grokbot:five_hour", "used_percent": 5]]), now: now) == nil)
for bad in [NSNull(), true, "50", -1, 101, Double.nan] as [Any] {
    precondition(grokBotWeeklyRemaining(quotas([["key": weekly, "used_percent": bad]]), now: now) == nil)
}
precondition(grokBotWeeklyRemaining(quotas([["key": weekly, "used_percent": 18, "resets_at": 100]]), now: now) == nil)
precondition(grokBotWeeklyRemaining(quotas([["key": weekly, "used_percent": 100, "resets_at": 101]]), now: now) == 0)
precondition(grokBotWeeklyRemaining(quotas([["key": weekly, "used_percent": 14, "resets_at": NSNull()]]), now: now) == 86)
let available: [(key: String, remaining: Int?, label: String)] = [
    ("gem7d", nil, "Gemini 周"), ("codex", 43, "Codex 周"), ("grokbot", 0, "Grok Bot 周"),
]
precondition(selectQuotaBar(mode: "auto", bars: available)?.key == "codex")
precondition(selectQuotaBar(mode: "grokbot", bars: available)?.remaining == 0)
var missingGrok = available
missingGrok[2].remaining = nil
precondition(selectQuotaBar(mode: "grokbot", bars: missingGrok)?.key == "grokbot")
precondition(selectQuotaBar(mode: "grokbot", bars: missingGrok)?.remaining == nil)
var onlyGrok = available
onlyGrok[1].remaining = nil
precondition(selectQuotaBar(mode: "auto", bars: onlyGrok)?.key == "grokbot")
print("PASS native Grok Bot parser, invalid/expired/missing, zero, explicit pin and Auto precedence")
