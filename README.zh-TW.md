<div align="center">
  <h1>
    <img src="assets/brand/edgeever-icon.svg" alt="EdgeEver Logo" width="56" align="absmiddle" /> EdgeEver · Editorial Flow Edition
  </h1>
  <p>
    <b>基於開源專案 <a href="https://github.com/tianma-if/edgeever">EdgeEver</a>（v2.16.1）重構與強化的 AI 原生知識庫工作區 —— 帶來 Editorial Flow 極簡文件流閱讀風介面、松綠書籤品牌圖示與行動端手勢互動增強。支援 Cloudflare 零成本部署或 Docker 自行託管。</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/edgeever?include_prereleases&color=187958&label=Fork%20Release" alt="最新客製化 Release" /></a>
    <a href="https://github.com/CottonChou/edgeever/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/edgeever?style=social" alt="Fork Stars" /></a>
    <a href="https://github.com/tianma-if/edgeever"><img src="https://img.shields.io/badge/Based_on-tianma--if%2Fedgeever_v2.16.1-187958" alt="基於 tianma-if/edgeever" /></a>
    <a href="https://demo.edgeever.org"><img src="https://img.shields.io/badge/上游線上展示-Live-2c5a48" alt="線上展示" /></a>
  </p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> | <b>繁體中文</b> | <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.pl-PL.md">Polski</a>
  </p>
  <p>
    <a href="#downloads">📦 MAC 與 APK 下載</a> &nbsp;|&nbsp;
    <a href="#editorial-flow-客製化增強亮點">✨ Editorial Flow 與強化亮點</a> &nbsp;|&nbsp;
    <a href="#features">🧩 核心功能矩陣</a> &nbsp;|&nbsp;
    <a href="#部署">☁️ 線上與自託管部署</a> &nbsp;|&nbsp;
    <a href="#開發者指南與本機打包">🛠️ 本機打包指南</a>
  </p>
  <p align="center">
    <img src="assets/readme/edgeever-hero-v6.png" alt="EdgeEver 產品工作區預覽" width="800" />
  </p>
</div>

> **分支與衍生聲明**：`CottonChou/edgeever` 為基於開源專案 [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever)（目前已對齊上游 `v2.16.1`）打造的個人強化發行分支，包含獨立視覺設計與本機簽章安裝包，並非官方上游正式發行版。

EdgeEver 保留經典高效的三欄知識工作區（**目錄樹 · 筆記列表 · 編輯器**），支援跨裝置即時同步、SQLite 本機離線讀寫以及原生 AI Agent（MCP &amp; ACP）聯動，可在 Cloudflare 免費額度內運作，亦支援 Docker 部署於 VPS 或 NAS。

---

<a id="editorial-flow-客製化增強亮點"></a>
## ✨ Editorial Flow 與客製化強化亮點

在完整承接上游 `v2.16.1` 功能的基礎上，本分支著重優化了長時閱讀體驗、跨端視覺統一性與行動端操作流暢度：

- **Editorial Flow 極簡文件流 UI**：Web、macOS 桌面端與行動端統一採用低視覺雜訊的暖棉紙底色（`#f4f1ea` / `#f9f7f2` / `#fdfcf9`）與深炭灰暗黑模式（`#151513` / `#1d1c1a` / `#22211e`），配合松石松綠（`#187958` / `#43b88c`）點綴；Electron 主視窗與獨立筆記視窗背景依 `nativeTheme` 同步（[index.mjs](apps/desktop/src/main/index.mjs)），減少啟動閃爍。
- **Editorial Pine（`#187958`）書籤紙頁品牌圖示**：統一更新至 macOS（`icon.icns` 與雙倍率選單列 `trayTemplate`）、Android（`#187958` 自適應圖示與啟動畫面）、iOS 圖示資源槽、Web / PWA、官方網站與瀏覽器外掛，並同步替換全端登入頁徽標。
- **行動端手勢與瀏覽強化**（詳見 [docs/FORK_CUSTOMIZATIONS.md](docs/FORK_CUSTOMIZATIONS.md)）：
  - **右滑拉出筆記本抽屜**：在筆記列表任一處向右滑動即可展開層級目錄樹、即時搜尋、行內建立筆記本與回收筒入口（`WorkspaceDrawer.tsx`）；
  - **筆記卡片左滑快捷操作**：單篇筆記向左滑出「星標置頂 / 取消星標」與「刪除」按鈕，支援樂觀更新與回收筒二次確認（`WorkspaceNotesView.tsx`）；
  - **跨筆記全螢幕連續看圖**：全螢幕看圖滑過目前筆記首／末張後，平滑切換至相鄰有圖筆記並在退出時自動聯動選取該筆記（`ZoomableImagePreview.tsx`）。

---

<a id="downloads"></a>
## 📦 下載用戶端（MAC 與 Android APK）

### 本分支客製化發行檔（`CottonChou/edgeever`）

已整合 **Editorial Flow UI**、**Editorial Pine 書籤紙頁圖示**與**行動端手勢增強**的 macOS / Android 安裝包發布於 [CottonChou/edgeever Releases](https://github.com/CottonChou/edgeever/releases/latest)：

| 平台 | 架構 | 安裝格式 | 說明 |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | 內建原生 `arm64` Rust Sidecar、全新 Dock / 選單列圖示與 `EdgeEverShare.appex`（本機 Ad-hoc 簽章，首次啟用可在 Finder 右鍵「開啟」） |
| **Android** | `arm64-v8a` | `.apk` | 正式簽章獨立離線 APK，內建 Hermes 引擎、`#187958` 啟動畫面與自適應圖示 |

<p>
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="下載客製版 macOS 用戶端" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="下載客製版 Android APK" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="官方 Windows 用戶端" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="官方 Linux AppImage" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/tw/app/edgeever/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="官方 App Store iOS 用戶端" width="40" height="40" /></a>
</p>

> Windows、Linux 與 iOS App Store 連結指向官方上游 [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever/releases/latest)；iOS 用戶端需使用非中國大陸區 Apple ID 下載。

### 瀏覽器網頁擷取外掛

<p>
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="Chrome 外掛" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="Edge 外掛" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/zh-TW/firefox/addon/edgeever-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="Firefox 外掛" width="36" height="36" /></a>
</p>

- 一鍵擷取純淨 Markdown 或選取文字與圖片儲存至自託管執行個體，深層支援 X、小紅書、微信公眾號、知乎、Reddit、GitHub、YouTube、Bilibili 等 20+ 平台。

---

## 為什麼選擇 EdgeEver

- **免費 Serverless 與靈活自託管**：可於 Cloudflare Workers + D1 + R2 免費額度長期執行，亦可在 VPS / NAS 使用 Docker 部署。
- **海量筆記依然輕盈流暢**：同時維護 `content_json` / `content_markdown` / `content_text` 三種儲存形態，兼顧編輯效能、開放格式與即時全文檢索。
- **資料主權完全在握**：標準 SQLite 儲存底座與無損 ZIP 匯出還原，支援從 Evernote、Obsidian、Joplin、flomo 與 Memos 無縫遷入（[實機最佳實踐](docs/best-practices.zh-CN.md)）。

<a id="features"></a>
## 🧩 核心功能矩陣

| 模組 | 基礎功能 | 進階亮點 |
| :--- | :--- | :--- |
| **寫作與閱讀** | 經典三欄工作區、TipTap 所見即所得與 Markdown 雙視圖、數學公式與版本歷史 | **Editorial Flow 紙感與深炭主題**、原生海報筆記、微信公眾號一鍵排版、MD/HTML/PDF 匯出 |
| **組織與檢索** | 無限層級筆記本樹、標籤體系、拖放排序、批次合併/移動、全文檢索 | **獨立靜態知識庫網站發布**（支援密碼保護、到期時間與開啟次數控制） |
| **擷取與附件** | 全格式分塊串流上傳（最高 1 GiB）、端側靜默壓縮（減少 50%–90%） | **微信聊天記錄歸檔**、20+ 平台結構化擷取、行動端跨筆記連續看圖 |
| **資料與圖表** | 原生表格、Markdown 表格、Mermaid 流程圖/循序圖/架構圖 | **AI 多維表格**、免登入公開收集表單、AI 心智圖與資訊圖 |
| **AI 與生態** | 側邊 AI 助手（BYOK：相容 OpenAI / Claude / Gemini） | **Remote MCP + 桌面端 ACP 協定互聯**、AI RSS 智慧日報、開放外掛 API |
| **同步與底座** | Web / PWA / macOS / Windows / Linux / iOS / Android 離線優先增量同步 | **Cloudflare 免費代管**或 **Docker (`amd64`/`arm64`)**、多帳號隔離與 OSS/PicGo/CloudFlare ImgBed |

---

<a id="部署"></a>
## ☁️ 部署

Cloudflare 是建議的零伺服器部署方式；希望使用 VPS、NAS 或家用伺服器的使用者也可以選擇 Docker。

### 方案一：交給 AI Agent 部署（建議）

將下方提示詞複製傳送給 AI Agent（如 Codex、Claude、Cursor、WorkBuddy、Antigravity、OpenClaw 等）：

```text
請全程透過 GitHub 和 Cloudflare 線上部署 EdgeEver：
1. Fork https://github.com/tianma-if/edgeever。
2. 在 Cloudflare 中建立 D1 `edgeever` 與 R2 `edgeever-resources`。
3. 在 Workers & Pages 中從 Fork 的 `main` 分支建立名為 `edgeever` 的 Worker。
   使用儲存庫根目錄，保留 Cloudflare Workers Builds 的預設部署指令，確認其 API Token
   具備 D1 讀取及編輯權限，然後儲存並部署。
4. Worker 建立後，設定執行時 Secret `EDGE_EVER_AUTH_PASSWORD`，值為使用者指定的密碼
   （建議至少 32 個字元）。管理員使用者名稱預設為 `admin`；如需自訂，請在再次建置前
   設定 Workers Builds 建置變數 `EDGE_EVER_AUTH_USERNAME`。
5. 再次建置，驗證 `/api/health` 和 `/api/openapi.json`，再用該管理員
   使用者名稱和密碼驗證登入。
6. 啟用並手動執行一次名為 `Update deployed EdgeEver` 的 GitHub Actions 工作流程，
   以便後續自動同步正式版本，持續獲得 EdgeEver 的功能更新與問題修復。
```

> 詳細文件：[AI Agent 線上部署約定](docs/agent-deploy-cloudflare.zh-CN.md)。

### 方案二：手動線上部署

<details>
<summary>📖 展開查看：網頁端 6 步手動部署流程</summary>

1. **Fork 儲存庫**：在 GitHub 點選右上角 **Fork**，將專案 Fork 到您的個人帳戶下。
2. **建立 Cloudflare 資源**：建立 D1 `edgeever` 與 R2 `edgeever-resources`。
3. **匯入並設定專案**：在 Cloudflare **Workers & Pages** 中從 Fork 的 `main` 分支建立名為 `edgeever` 的 Worker，使用根目錄與預設部署指令，確認 API Token 具備 D1 讀寫權限。
4. **準備管理員密碼**：儲存為執行時 Secret `EDGE_EVER_AUTH_PASSWORD`（建議至少 32 個字元）。
5. **建置與驗證**：新增 Secret 後重試建置，確認 `/api/health` 回傳 `200` 並登入驗證。
6. **啟用自動更新**：於 Fork 的 **Actions** 手動執行一次 **Update deployed EdgeEver**。

> 📖 完整步驟：[線上部署完整文件](docs/deploy-cloudflare-button.zh-CN.md)。

</details>

### 方案三：在 VPS 或 NAS 上使用 Docker

```sh
curl -fsSL https://edgeever.org/install.sh | bash
```

手動部署與更新（`~/edgeever/update.sh`）請見 [Docker 部署文件](docs/deploy-docker.zh-CN.md)。

---

<a id="開發者指南與本機打包"></a>
## 🛠️ 開發者指南與本機打包

```sh
bun install
bun run dev                        # 啟動本機 Web + API 開發環境
bun run prepare:brand:icons        # 全端重繪品牌與系統圖示
bun run build:desktop              # 本機打包 macOS Apple Silicon (arm64) DMG / ZIP
bun run build:android:apk:local    # 本機打包簽章 Android arm64 APK
git fetch upstream && git merge upstream/main
```

---

## 社群、商標與免責聲明

- **官方上游與問題回報**：[`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) · [GitHub Issues](https://github.com/tianma-if/edgeever/issues)
- **微信交流群**：掃描 QR Code 或新增微信 `m1245207870`（備註「EdgeEver 進群」）

<p align="center">
  <img src="assets/wechat-group-qr.jpg" alt="微信聯絡人 QR Code" width="220" />
</p>

- **商標與品牌**：EdgeEver 名稱與官方識別歸 [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) 所有；本 Fork 明確標示基於 EdgeEver 改製，不代表官方發行。
- **免責聲明**：EdgeEver 為獨立開源軟體，與 Evernote® 無商業關聯；自託管內容由執行個體營運者自行負責。

## 貢獻者

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
