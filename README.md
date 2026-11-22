# tootoo

零外部依赖（纯 Python 3 标准库 + 原生 Swift macOS 菜单栏应用）的本地 AI 编程用量、输出速度（TPS / TTFT）与费用遥测控制台。

## 特性
- **纯本地只读扫描**：直接增量读取本地会话日志 / SQLite，无需安装代理或 Hook。
- **支持 16 款本地 AI 编程工具**：Antigravity (`agy`)、Codex CLI、OMP / Pi、Devin CLI、Qoder CLI、Copilot CLI、Factory Droid、OpenCode、Grok CLI、Claude Code、Gemini CLI、Hermes、Qwen Code、Kimi Code、MiMoCode、Cline / Roo。
- **4 层动态价格引擎**：本地自定义覆盖 → 原生日志自动校准 → 远程价目表自动同步（OpenRouter + LiteLLM）→ 离线分级兜底。
- **九阶小兔战力进化**：按今日 Token 消耗逐阶进化（含 macOS 顶部菜单栏形态同步、悬浮/点击阶梯动效、未解锁图鉴隐藏）。
- **轻量高性能**：启动预热 + 内存缓存 + 弹窗关闭自动断开 SSE，后台近零空跑。

## 快速开始

### 方式一：下载 Release 安装包（macOS Apple Silicon）
1. 前往 [Releases](https://github.com/uuuyuqi/tootoo/releases) 下载最新版 `TooToo-v0.1.0-macos-arm64.zip`。
2. 解压后将 `TooToo.app` 拖入 `/Applications`。
3. 首次打开若遇 macOS 未知开发者提示（ad-hoc 签名），执行一次：
   ```bash
   xattr -cr /Applications/TooToo.app
   open /Applications/TooToo.app
   ```

### 方式二：从源码编译 macOS 菜单栏 App
需要 macOS 13+、Python 3 和 Swift 命令行工具（`xcode-select --install`）：
```bash
./macos/build_app.sh
open /Applications/TooToo.app
```

### 方式三：命令行 / Web 模式
```bash
# 启动本地 Web 控制台（默认 http://127.0.0.1:7891）
./tootoo

# 终端快速查看统计
./tootoo --cli --range today
./tootoo --cli --range 7d --tool codex

# 输出原始 JSON
./tootoo --json --range today

# 手动刷新远程模型价目表
./tootoo --refresh-pricing
```

## 架构说明
- `scanner.py`：本地日志与 SQLite 增量扫描引擎（缓存存于 `~/.tootoo/scan_cache_v5.json`）。
- `pricing.py`：4 层动态价格计算与远程价目表同步（存于 `~/.tootoo/pricing_remote.json`）。
- `server.py`：零依赖本地 HTTP + SSE 实时推送与 CLI 入口。
- `ui/index.html`：精密仪器风格双主题控制台（浅色纸张 / 深色模式，支持 Popover 与独立大屏窗口）。
- `macos/`：原生 Swift 菜单栏 App（`main.swift`、`gen_icon.swift`、`build_app.sh`）。
