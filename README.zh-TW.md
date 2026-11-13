<div align="center">
  <h1>
    <img src="assets/brand/stillnote-icon.svg" alt="StillNote Logo" width="56" align="absmiddle" /> StillNote
  </h1>
  <p>
    <b>開源個人 AI 原生知識庫與三欄筆記工作區 —— 採用 Editorial Flow 極簡文件流閱讀風介面、松綠書籤品牌圖示、行動端元資訊優先延遲同步與流暢手勢互動。支援 Cloudflare 零成本部署或 Docker 自行託管。</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/stillnote?include_prereleases&color=187958&label=Release" alt="最新 Release" /></a>
    <a href="https://github.com/CottonChou/stillnote/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/stillnote?style=social" alt="GitHub Stars" /></a>
    <a href="https://github.com/CottonChou/stillnote/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-187958" alt="AGPL-3.0 授權條款" /></a>
    <a href="https://stillnote.org"><img src="https://img.shields.io/badge/Docs-stillnote.org-2c5a48" alt="說明文件" /></a>
  </p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> | <b>繁體中文</b> | <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.pl-PL.md">Polski</a>
  </p>
  <p>
    <a href="#downloads">📦 MAC 與 APK 下載</a> &nbsp;|&nbsp;
    <a href="#editorial-flow-客製化增強亮點">✨ Editorial Flow 與核心亮點</a> &nbsp;|&nbsp;
    <a href="#features">🧩 核心功能矩陣</a> &nbsp;|&nbsp;
    <a href="#部署">☁️ 線上與自託管部署</a> &nbsp;|&nbsp;
    <a href="#開發者指南與本機打包">🛠️ 本機打包指南</a>
  </p>
  <p align="center">
    <img src="assets/readme/stillnote-hero-v6.png" alt="StillNote 產品工作區預覽" width="800" />
  </p>
</div>

StillNote 保留經典高效的三欄知識工作區（**目錄樹 · 筆記列表 · 編輯器**），支援跨裝置即時同步、SQLite 本機離線讀寫以及原生 AI Agent（MCP &amp; ACP）聯動，可在 Cloudflare 免費額度內運作，亦支援 Docker 部署於 VPS 或 NAS。

---

<a id="editorial-flow-客製化增強亮點"></a>
## ✨ Editorial Flow 與核心亮點（`v2.17.0`）

在完整支援多格式匯入遷入、公開分享連結設定、PicGo/ImgBed 圖床與 AI 助手的基礎上，進一步優化長時閱讀介面、全端品牌識別與行動端手勢及同步效率：

- **Editorial Flow 極簡文件流 UI**：Web、macOS 桌面端與行動端統一採用低視覺雜訊的暖棉紙底色（`#f4f1ea` / `#f9f7f2` / `#fdfcf9`）與深炭灰暗黑模式（`#151513` / `#1d1c1a` / `#22211e`），配合松石松綠（`#187958` / `#43b88c`）點綴；Electron 視窗背景依 `nativeTheme` 同步（[index.mjs](apps/desktop/src/main/index.mjs)），減少啟動閃爍；筆記頂部欄精簡並將分享納入「更多」選單，新增一鍵關閉筆記按鈕。
- **Editorial Pine（`#187958`）書籤紙頁品牌圖示**：統一更新至 macOS（`icon.icns` 與雙倍率選單列 `trayTemplate`）、Android（`#187958` 自適應圖示與啟動畫面）、iOS 圖示資源槽、Web / PWA、官方網站與瀏覽器外掛，並同步替換全端登入頁徽標。
- **行動端手勢與筆記本按需同步**（詳見 [docs/mobile-features.zh-CN.md](docs/mobile-features.zh-CN.md)）：
  - **DrawerLayout 流暢抽屜與防誤退**：使用 `react-native-drawer-layout` 優化左滑收起抽屜手感，並支援系統返回鍵雙擊確認退出（`WorkspaceDrawer.tsx`）；
  - **元資訊優先與單本按需同步**：同步時優先載入筆記本與標題清單，點擊筆記時再延遲載入正文，並支援手動同步單本或全部筆記本（`Sync Notebook`）；
  - **筆記卡片左滑快捷操作**：單篇筆記向左滑出「星標置頂 / 取消星標」與「刪除」按鈕（`WorkspaceNotesView.tsx`）；
  - **跨筆記全螢幕連續看圖**：全螢幕看圖滑過目前筆記首／末張後，平滑切換至相鄰有圖筆記並在退出時自動聯動選取該筆記（`ZoomableImagePreview.tsx`）。

---

<a id="downloads"></a>
## 📦 下載用戶端（MAC 與 Android APK）

### 官方 Release 下載

全平台預編譯用戶端與 Android 安裝包均發布於 [StillNote Releases](https://github.com/CottonChou/stillnote/releases/latest)：

| 平台 | 架構 | 安裝格式 | 說明 |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | 內建原生 `arm64` Rust Sidecar、全新 Dock / 選單列圖示與 `StillNoteShare.appex`（本機 Ad-hoc 簽章，首次啟用可在 Finder 右鍵「開啟」） |
| **Android** | `arm64-v8a` | `.apk` | 正式簽章獨立離線 APK（`org.stillnote.mobile`），內建 Hermes 引擎、`#187958` 啟動畫面與自適應圖示 |

<p>
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="下載 StillNote macOS 用戶端" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="下載 StillNote Android APK" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="Windows 用戶端" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="Linux AppImage" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/tw/app/stillnote/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="App Store iOS 用戶端" width="40" height="40" /></a>
</p>

> 桌面端與 Android 用戶端預設從 [`CottonChou/stillnote`](https://github.com/CottonChou/stillnote/releases/latest) 檢查與取得更新。

### 瀏覽器網頁擷取外掛

<p>
  <a href="https://chromewebstore.google.com/detail/stillnote-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="Chrome 外掛" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/stillnote-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="Edge 外掛" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/zh-TW/firefox/addon/stillnote-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="Firefox 外掛" width="36" height="36" /></a>
</p>

- 一鍵擷取純淨 Markdown 或選取文字與圖片儲存至自託管執行個體，深層支援 X、小紅書、微信公眾號、知乎、Reddit、GitHub、YouTube、Bilibili 等 20+ 平台。

---

## 為什麼選擇 StillNote

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
請全程透過 GitHub 和 Cloudflare 線上部署 StillNote：
1. Fork https://github.com/CottonChou/stillnote。
2. 在 Cloudflare 中建立 D1 `stillnote` 與 R2 `stillnote-resources`。
3. 在 Workers & Pages 中從 Fork 的 `main` 分支建立名為 `stillnote` 的 Worker。
   使用儲存庫根目錄，保留 Cloudflare Workers Builds 的預設部署指令，確認其 API Token
   具備 D1 讀取及編輯權限，然後儲存並部署。
4. Worker 建立後，設定執行時 Secret `STILLNOTE_AUTH_PASSWORD`，值為使用者指定的密碼
   （建議至少 32 個字元）。管理員使用者名稱預設為 `admin`；如需自訂，請在再次建置前
   設定 Workers Builds 建置變數 `STILLNOTE_AUTH_USERNAME`。
5. 再次建置，驗證 `/api/health` 和 `/api/openapi.json`，再用該管理員
   使用者名稱和密碼驗證登入。
6. 啟用並手動執行一次名為 `Update deployed StillNote` 的 GitHub Actions 工作流程，
   以便後續自動同步正式版本，持續獲得 StillNote 的功能更新與問題修復。
```

> 詳細文件：[AI Agent 線上部署約定](docs/agent-deploy-cloudflare.zh-CN.md)。

### 方案二：手動線上部署

<details>
<summary>📖 展開查看：網頁端 6 步手動部署流程</summary>

1. **Fork 儲存庫**：在 GitHub 點選右上角 **Fork**，將專案 Fork 到您的個人帳戶下。
2. **建立 Cloudflare 資源**：建立 D1 `stillnote` 與 R2 `stillnote-resources`。
3. **匯入並設定專案**：在 Cloudflare **Workers & Pages** 中從 Fork 的 `main` 分支建立名為 `stillnote` 的 Worker，使用根目錄與預設部署指令，確認 API Token 具備 D1 讀寫權限。
4. **準備管理員密碼**：儲存為執行時 Secret `STILLNOTE_AUTH_PASSWORD`（建議至少 32 個字元）。
5. **建置與驗證**：新增 Secret 後重試建置，確認 `/api/health` 回傳 `200` 並登入驗證。
6. **啟用自動更新**：於 Fork 的 **Actions** 手動執行一次 **Update deployed StillNote**。

> 📖 完整步驟：[線上部署完整文件](docs/deploy-cloudflare-button.zh-CN.md)。

</details>

### 方案三：在 VPS 或 NAS 上使用 Docker

```sh
curl -fsSL https://stillnote.org/install.sh | bash
```

手動部署與更新（`~/stillnote/update.sh`）請見 [Docker 部署文件](docs/deploy-docker.zh-CN.md)。

---

<a id="開發者指南與本機打包"></a>
## 🛠️ 開發者指南與本機打包

```sh
bun install
bun run dev                        # 啟動本機 Web + API 開發環境
bun run prepare:brand:icons        # 全端重繪品牌與系統圖示
bun run build:desktop              # 本機打包 macOS Apple Silicon (arm64) DMG / ZIP
bun run build:android:apk:local    # 本機打包簽章 Android arm64 APK
```

---

## 社群、品牌與免責聲明

- **專案儲存庫與問題回報**：[`CottonChou/stillnote`](https://github.com/CottonChou/stillnote) · [GitHub Issues](https://github.com/CottonChou/stillnote/issues)
- **品牌與發行**：本版本的 StillNote 原始碼與用戶端發行檔均維護於 [`CottonChou/stillnote`](https://github.com/CottonChou/stillnote)。
- **免責聲明**：StillNote 為獨立開源軟體，與 Evernote® 無商業關聯；自託管內容由執行個體營運者自行負責。
