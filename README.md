<div align="center">
  <h1>
    <img src="assets/brand/edgeever-icon.svg" alt="EdgeEver Logo" width="56" align="absmiddle" /> EdgeEver · Editorial Flow Edition
  </h1>
  <p>
    <b>A redesigned open-source personal knowledge base &amp; three-pane notes workspace built on <a href="https://github.com/tianma-if/edgeever">EdgeEver</a> (v2.16.1) — featuring Editorial Flow UI, Editorial Pine branding, and fluid mobile gestures. Free on Cloudflare or self-hosted via Docker.</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/edgeever?include_prereleases&color=187958&label=Fork%20Release" alt="Latest Fork Release" /></a>
    <a href="https://github.com/CottonChou/edgeever/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/edgeever?style=social" alt="Fork Stars" /></a>
    <a href="https://github.com/tianma-if/edgeever"><img src="https://img.shields.io/badge/Based_on-tianma--if%2Fedgeever_v2.16.1-187958" alt="Based on tianma-if/edgeever" /></a>
    <a href="https://demo.edgeever.org"><img src="https://img.shields.io/badge/Upstream_Demo-Live-2c5a48" alt="Upstream Demo" /></a>
  </p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> | <a href="README.zh-TW.md">繁體中文</a> | <b>English</b> | <a href="README.ja.md">日本語</a> | <a href="README.pl-PL.md">Polski</a>
  </p>
  <p>
    <a href="#downloads">📦 MAC &amp; APK Downloads</a> &nbsp;|&nbsp;
    <a href="#whats-new-in-editorial-flow-edition">✨ Editorial Flow &amp; Enhancements</a> &nbsp;|&nbsp;
    <a href="#features">🧩 Feature Matrix</a> &nbsp;|&nbsp;
    <a href="#deployment">☁️ Deployment</a> &nbsp;|&nbsp;
    <a href="#developer-guide--local-packaging">🛠️ Local Packaging</a>
  </p>
  <p align="center">
    <img src="assets/readme/edgeever-hero-v6.png" alt="EdgeEver Workspace Preview" width="800" />
  </p>
</div>

> **Fork Attribution**: `CottonChou/edgeever` is an enhanced personal edition based on the open-source project [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) (currently aligned with upstream `v2.16.1`). It is independently packaged and is not an official upstream release.

EdgeEver preserves the proven three-pane productivity workflow (**Notebooks · Note List · Editor**) with instant multi-device sync, local SQLite offline resilience, and native AI Agent integration (MCP &amp; ACP) — while allowing zero-cost serverless hosting on Cloudflare or self-hosting via Docker.

---

<a id="whats-new-in-editorial-flow-edition"></a>
## ✨ Editorial Flow &amp; Fork Enhancements

Beyond all upstream capabilities (`v2.16.1`), this edition refines typography, cross-platform visual calm, branding, and touch ergonomics:

- **Editorial Flow Reading-First UI**: Web, macOS desktop, and Expo / React Native mobile clients adopt a warm cotton paper palette (`#f4f1ea` / `#f9f7f2` / `#fdfcf9`), charcoal dark mode (`#151513` / `#1d1c1a` / `#22211e`), and editorial pine accents (`#187958` / `#43b88c`). Desktop `BrowserWindow` startup backgrounds sync with `nativeTheme` (`apps/desktop/src/main/index.mjs`) to eliminate cold-start flash.
- **Editorial Pine Bookmark Folio Icon**: Unified across macOS (`icon.icns` + 1x/2x `trayTemplate` menu bar glyphs), Android (`#187958` adaptive icon &amp; splash screen), iOS asset slots, Web/PWA manifests, Astro site favicons, browser extensions, and login screens.
- **Fluid Mobile Touch Gestures** *(detailed in [`docs/FORK_CUSTOMIZATIONS.md`](docs/FORK_CUSTOMIZATIONS.md))*:
  - **Swipe Right Notebook Drawer**: Pull out the hierarchical notebook tree, instant search, inline folder creation, and Trash from anywhere in the mobile note list (`WorkspaceDrawer.tsx`).
  - **Swipe Left Card Actions**: Swipe any note card left for one-tap **Star / Unstar** (optimistic update) or **Delete** with Trash confirmation guard (`WorkspaceNotesView.tsx`).
  - **Cross-Note Fullscreen Image Swipe**: Swiping past the first or last image seamlessly transitions to the previous/next note containing images and syncs list selection upon exit (`ZoomableImagePreview.tsx`).

---

<a id="downloads"></a>
## 📦 Downloads (macOS DMG &amp; Android APK)

### Fork Custom Releases (`CottonChou/edgeever`)

Pre-built binaries with the **Editorial Flow UI**, **Pine Bookmark Icon**, and **mobile gesture enhancements** are published under [CottonChou/edgeever Releases](https://github.com/CottonChou/edgeever/releases/latest):

| Platform | Architecture | Format | Notes |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | Includes Rust SQLite sidecar, menu bar tray glyphs &amp; `EdgeEverShare.appex` (ad-hoc signed; right-click → Open or clear quarantine on first launch) |
| **Android** | `arm64-v8a` | `.apk` | Standalone release-signed APK with Hermes engine &amp; `#187958` adaptive icon |

<p>
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="Download custom EdgeEver for macOS arm64" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="Download custom EdgeEver Android APK" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="Official Windows Release" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="Official Linux AppImage Release" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/us/app/edgeever/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="Official iOS App Store" width="40" height="40" /></a>
</p>

> Windows, Linux, iOS App Store, and Google Play links above point to upstream [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever/releases/latest). iOS App Store availability requires a non-mainland China Apple ID.

### Browser Web Clipper Extension

<p>
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="EdgeEver Web Clipper for Chrome" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="EdgeEver Web Clipper for Edge" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/firefox/addon/edgeever-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="EdgeEver Web Clipper for Firefox" width="36" height="36" /></a>
</p>

- Extract clean Markdown or selected regions directly into your self-hosted EdgeEver instance.
- Structured capture for 20+ platforms including X, Xiaohongshu, WeChat, Zhihu, Reddit, GitHub, YouTube, Bilibili, Substack, Hacker News, and podcasts.

---

## Why EdgeEver

- **Truly Open &amp; Serverless-Capable**: Runs cleanly within Cloudflare Workers + D1 + R2 free tiers or via a single Docker container on your NAS/VPS.
- **Fast at Scale**: Three-tier persistence (`content_json` + `content_markdown` + `content_text`) keeps 10,000+ notes snappy for editing, search, and API/MCP automation.
- **No Lock-In**: Standard SQLite storage, lossless EdgeEver ZIP archive backup, and native Evernote / Obsidian / Joplin / flomo / Memos migration.

<a id="features"></a>
## 🧩 Feature Matrix

| Module | Core Capabilities | Highlights |
| :--- | :--- | :--- |
| **Writing &amp; Reading** | Three-pane workspace, TipTap WYSIWYG &amp; raw Markdown toggle, math/code blocks, auto-save, revision history | **Editorial Flow paper/charcoal themes**, native Poster Notes, WeChat formatter, MD/HTML/PDF export |
| **Organization &amp; Search** | Infinite notebook trees, tags, drag sorting, batch merge/move, full-text search | **One-click static knowledge-base publishing** with tree nav &amp; optional password/expiry controls |
| **Capture &amp; Media** | Multi-format attachments, client-side image compression (up to 1 GiB chunked streaming), mobile share extension | **WeChat chat transcript archival**, 20+ platform clipper, cross-note fullscreen image swipe |
| **Data &amp; Diagrams** | Native tables, Markdown tables, Mermaid flow/sequence/architecture diagrams | **AI Multi-Dimensional Tables**, public collection forms, AI diagrams &amp; infographics |
| **AI &amp; Protocols** | Companion AI sidebar (BYOK: OpenAI / Claude / Gemini / custom endpoints) | **Remote MCP &amp; Desktop ACP** for external/local coding agents, AI RSS daily digests, plugin API |
| **Sync &amp; Storage** | Web, PWA, macOS, Windows, Linux, iOS, Android; offline-first outbox &amp; incremental sync | **Zero-server Cloudflare tier** or **Docker (`amd64` / `arm64`)**, multi-user workspaces, OSS/PicGo/CloudFlare ImgBed |

---

<a id="deployment"></a>
## ☁️ Deployment

Cloudflare is the recommended zero-server deployment. Docker is available for users who prefer a VPS, NAS, or home server.

### Option A: Deploy with an AI Agent (Recommended)

Copy the prompt below directly into an AI Agent (such as Codex, Claude, Cursor, WorkBuddy, Antigravity, OpenClaw, Hermes Agent, etc.):

```text
Deploy EdgeEver entirely through GitHub and Cloudflare:
1. Fork https://github.com/tianma-if/edgeever.
2. Create D1 `edgeever` and R2 `edgeever-resources` in Cloudflare.
3. In Workers & Pages, create a Worker named `edgeever` from the Fork's `main` branch.
   Use the repository root, keep Cloudflare's default Workers Builds deploy command,
   and ensure its API token can read and edit D1. Select Save and Deploy.
4. After the Worker is created, add the user's chosen password as the runtime Secret
   `EDGE_EVER_AUTH_PASSWORD` (preferably at least 32 characters).
   The username defaults to `admin`.
   If the user specifies another, set `EDGE_EVER_AUTH_USERNAME` as a Workers Builds
   variable before the next build.
5. Run the build again, verify `/api/health` and `/api/openapi.json`, then log in
   with that administrator username and password.
6. Enable and manually run the GitHub Actions workflow named `Update deployed EdgeEver`
   once so the Fork can automatically receive future stable releases and fixes.
```

> Detailed requirements: [AI Agent Cloudflare Deployment](docs/agent-deploy-cloudflare.md).

### Option B: Manual Online Deployment

<details>
<summary>📖 Click to expand: 6-Step Web Manual Deployment Guide</summary>

Complete setup in 6 web steps:

1. **Fork the Repository**: Click **Fork** at the top right of GitHub to fork EdgeEver into your personal account.
2. **Create Cloudflare Resources**: Create D1 `edgeever` and R2 `edgeever-resources`.
3. **Import & Configure the Project**: Create a Worker named `edgeever` from the Fork's `main` branch in Cloudflare **Workers & Pages**. Use the repository root and keep Cloudflare's default Workers Builds deploy command, which runs in Cloudflare. Ensure its API token can read and edit D1. The deploy command creates the bindings; do not edit Fork files.
4. **Choose the Administrator Password**: Choose an administrator password, preferably at least 32 characters. Once the Worker is created, save it as the runtime Secret `EDGE_EVER_AUTH_PASSWORD`.
5. **Build & Verify**: Save and Deploy creates the Worker and starts a build. The initial build primarily initializes the Worker instance; if it fails due to missing administrator Secret, this is expected behavior. Simply add the runtime Secret `EDGE_EVER_AUTH_PASSWORD` from Step 4 and click retry. The username defaults to `admin`; to use another, set `EDGE_EVER_AUTH_USERNAME` as a Workers Builds variable before retrying. Once deployed, confirm `/api/health` returns `200`, then log in with the configured username and password.
6. **Enable Automatic Updates**: Open the Fork's **Actions** tab, click **I understand my workflows, go ahead and enable them**, then manually run **Update deployed EdgeEver** once so the Fork can automatically receive future stable releases and fixes.

> 📖 Full instructions: [Online Deployment Guide](docs/deploy-cloudflare-button.md).

</details>

### Option C: Docker on a VPS or NAS

Docker runs the same Hono/Zod API, Web UI, Remote MCP, and migrations using SQLite (`amd64` and `arm64`):

```sh
curl -fsSL https://edgeever.org/install.sh | bash
```

See [Deploy EdgeEver with Docker](docs/deploy-docker.md) for manual configuration and `~/edgeever/update.sh`.

---

<a id="developer-guide--local-packaging"></a>
## 🛠️ Developer Guide &amp; Local Packaging

### Local Development

```sh
bun install
bun run dev
```

Fresh local dev instances auto-sign in as `owner` / `edgeever-local-dev`.

### Regenerate Icons &amp; Package Native Clients

```sh
# Regenerate all platform icons from assets/brand/edgeever-icon.svg & edgeever-mark.svg
bun run prepare:brand:icons

# Build macOS Apple Silicon DMG / ZIP (requires arm64 Rust toolchain + Xcode)
bun run build:desktop

# Build signed Android arm64 APK using your local keystore (~/.config/edgeever/android/)
bun run build:android:apk:local

# Sync upstream changes into fork
git fetch upstream && git merge upstream/main
```

<details>
<summary>📁 Expand to view: Monorepo Architecture</summary>

```text
apps/web          Vite + React + PWA + Tailwind Editorial Flow UI
apps/desktop      Electron shell, tray glyphs, Rust sidecar & macOS Share Extension
apps/mobile       Expo + React Native Android app (SQLite mirror + gesture enhancements)
apps/ios          Native SwiftUI iOS client (TipTap EditorBundle + GRDB)
apps/api          Hono/Zod backend for Cloudflare Workers + D1/R2 or Docker Bun + SQLite
apps/extension    Manifest V3 Chrome / Edge / Firefox Web Clipper
apps/site         Astro marketing & documentation static site
packages/client   Shared API client
packages/shared   Shared Zod schemas, Markdown/TipTap converters, diagram canvas presets
crates/desktop-sidecar  Rust SQLite & resource service for Desktop
migrations        Append-only SQL migrations shared across D1 & SQLite
scripts           Icon generation, desktop/Android packaging & release utilities
```

</details>

---

## Community, Brand &amp; Legal

- **Upstream Repository**: [tianma-if/edgeever](https://github.com/tianma-if/edgeever) · [Upstream Issues](https://github.com/tianma-if/edgeever/issues) · [Telegram Group](https://t.me/+wwUx1BYLrIdiZjY1)
- **Trademark &amp; Brand**: The EdgeEver name, official branding, and official releases belong to [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever). This fork explicitly states it is based on EdgeEver and does not claim official status.
- **Disclaimer**: EdgeEver is independent open-source software unrelated to Evernote Corporation or its affiliates. Self-hosted users and instance operators bear sole responsibility for stored data.

## Contributors

<!-- readme-contributors:start -->
<p align="left">
  <a href="https://github.com/tianma-if"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/5895871?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@tianma-if" /></a>
  <a href="https://github.com/dkoryto"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/2572180?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@dkoryto" /></a>
  <a href="https://github.com/sivdead"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/27731043?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@sivdead" /></a>
  <a href="https://github.com/thorufur"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/55167?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@thorufur" /></a>
  <a href="https://github.com/yulei666"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/7358439?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@yulei666" /></a>
  <a href="https://github.com/arsaboo"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/18319734?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@arsaboo" /></a>
  <a href="https://github.com/alyyasser"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/16476111?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@alyyasser" /></a>
  <a href="https://github.com/MadlyFX"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/4896705?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@MadlyFX" /></a>
  <a href="https://github.com/claude"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/81847?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@claude" /></a>
  <a href="https://github.com/Crowszzz"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/75199133?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@Crowszzz" /></a>
  <a href="https://github.com/Shunamxiao"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/92215296?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@Shunamxiao" /></a>
  <a href="https://github.com/nzhdotme"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/9588882?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@nzhdotme" /></a>
  <a href="https://github.com/mookim-eth"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/97934198?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@mookim-eth" /></a>
  <a href="https://github.com/imgdown"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/348032096?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@imgdown" /></a>
  <a href="https://github.com/X77seven"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/171017641?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@X77seven" /></a>
  <a href="https://github.com/Sergmay911"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/304439776?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@Sergmay911" /></a>
  <a href="https://github.com/0xfelixli"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/81979996?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@0xfelixli" /></a>
  <a href="https://github.com/Z-DDV"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/122068983?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@Z-DDV" /></a>
  <a href="https://github.com/CottonChou"><img src="https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/17818375?v=4&h=96&w=96&fit=cover&mask=circle&maxage=7d" width="48" height="48" alt="@CottonChou" /></a>
</p>
<!-- readme-contributors:end -->
