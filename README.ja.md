<div align="center">
  <h1>
    <img src="assets/brand/edgeever-icon.svg" alt="EdgeEver のロゴ" width="56" align="absmiddle" /> EdgeEver · Editorial Flow Edition
  </h1>
  <p>
    <b>オープンソースプロジェクト <a href="https://github.com/tianma-if/edgeever">EdgeEver</a>（v2.16.1）をベースに再設計・機能拡張した AI ネイティブ知識ベースワークスペース — Editorial Flow UI、松緑ブックマークアイコン、モバイル向けジェスチャー操作を搭載。Cloudflare 無料枠または Docker で運用可能。</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/edgeever?include_prereleases&color=187958&label=Fork%20Release" alt="Fork 最新リリース" /></a>
    <a href="https://github.com/CottonChou/edgeever/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/edgeever?style=social" alt="Fork Stars" /></a>
    <a href="https://github.com/tianma-if/edgeever"><img src="https://img.shields.io/badge/Based_on-tianma--if%2Fedgeever_v2.16.1-187958" alt="Based on tianma-if/edgeever" /></a>
    <a href="https://demo.edgeever.org"><img src="https://img.shields.io/badge/Upstream_Demo-Live-2c5a48" alt="オンラインデモ" /></a>
  </p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> | <a href="README.zh-TW.md">繁體中文</a> | <a href="README.md">English</a> | <b>日本語</b> | <a href="README.pl-PL.md">Polski</a>
  </p>
  <p>
    <a href="#downloads">📦 MAC / APK ダウンロード</a> &nbsp;|&nbsp;
    <a href="#editorial-flow-の主な強化点">✨ Editorial Flow 強化点</a> &nbsp;|&nbsp;
    <a href="#features">🧩 機能マトリクス</a> &nbsp;|&nbsp;
    <a href="#導入">☁️ 導入方法</a> &nbsp;|&nbsp;
    <a href="#開発ローカルビルド">🛠️ ローカルビルド</a>
  </p>
  <p align="center">
    <img src="assets/readme/edgeever-hero-v6.png" alt="EdgeEver ワークスペースプレビュー" width="800" />
  </p>
</div>

> **Fork に関する注記**: `CottonChou/edgeever` はオープンソースプロジェクト [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever)（上流 `v2.16.1` に追従）を基にした個人カスタマイズ版であり、上流の公式リリースではありません。

クラシックで高効率な 3 ペイン構成（**ノートブックツリー · ノート一覧 · エディタ**）、低遅延クラウド同期、ローカル SQLite オフライン編集、ネイティブ AI Agent 連携（MCP &amp; ACP）をそのまま備えています。

---

<a id="editorial-flow-の主な強化点"></a>
## ✨ Editorial Flow の主な強化点

上流 `v2.16.1` の全機能に加え、本エディションでは視認性とモバイル操作性を中心に再設計しています：

- **Editorial Flow リーディングファースト UI**：Web、macOS デスクトップ、Expo / React Native モバイルアプリ全体で、暖かみのあるコットン紙基調（`#f4f1ea` / `#f9f7f2` / `#fdfcf9`）、落ち着いたチャコールダーク（`#151513` / `#1d1c1a` / `#22211e`）、アクセントの Editorial Pine（`#187958` / `#43b88c`）を採用。Electron ウィンドウの背景色も `nativeTheme` と同期します（[index.mjs](apps/desktop/src/main/index.mjs)）。
- **Editorial Pine ブックマーク・フォリオアイコン**：macOS（1024px `icon.icns` および 1x/2x メニューバー用モノクロ `trayTemplate`）、Android（`#187958` アダプティブアイコン＆スプラッシュ）、iOS アセットスロット、Web/PWA、Astro 公式サイト、ブラウザ拡張機能、ログイン画面まで一貫して刷新。
- **モバイルジェスチャー操作の強化**（詳細は [`docs/FORK_CUSTOMIZATIONS.md`](docs/FORK_CUSTOMIZATIONS.md)）：
  - **右スワイプでノートブックドロワーを開閉**：一覧画面のどこからでもツリー階層、リアルタイム検索、インライン作成、ゴミ箱へ即アクセス（`WorkspaceDrawer.tsx`）。
  - **カード左スワイプでスター／削除**：1 回のスワイプで楽観的スター切替とゴミ箱確認付き削除を実行（`WorkspaceNotesView.tsx`）。
  - **ノートを跨いだ連続画像スワイプ**：全画面画像プレビューの端から次の画像付きノートへシームレスに移動し、閉じた際の一覧選択も自動同期（`ZoomableImagePreview.tsx`）。

---

<a id="downloads"></a>
## 📦 クライアントダウンロード（MAC / Android APK）

### Fork カスタムリリース（`CottonChou/edgeever`）

**Editorial Flow UI** と **新ブランドアイコン** を収録した macOS / Android パッケージは [CottonChou/edgeever Releases](https://github.com/CottonChou/edgeever/releases/latest) から入手できます：

| プラットフォーム | アーキテクチャ | 形式 | 備考 |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | ネイティブ `arm64` Rust Sidecar・刷新されたメニューバーアイコン・`EdgeEverShare.appex` 同梱（ローカル Ad-hoc 署名のため初回は Finder で右クリック→「開く」推奨） |
| **Android** | `arm64-v8a` | `.apk` | Hermes エンジンと `#187958` スプラッシュ／アダプティブアイコン同梱の本番署名済み APK |

<p>
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="Fork 版 macOS クライアントをダウンロード" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="Fork 版 Android APK をダウンロード" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="公式 Windows 版" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="公式 Linux AppImage" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/jp/app/edgeever/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="公式 iOS App Store" width="40" height="40" /></a>
</p>

> Windows・Linux・iOS App Store のアイコンは上流 [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever/releases/latest) にリンクしています（iOS 版は中国本土以外の Apple ID が必要です）。

### ブラウザ Web Clipper

<p>
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="Chrome 向け拡張機能" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="Edge 向け拡張機能" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/ja/firefox/addon/edgeever-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="Firefox 向け拡張機能" width="36" height="36" /></a>
</p>

- Web 記事をクリーンな Markdown に変換し、X、小紅書、WeChat、知乎、Reddit、GitHub、YouTube、Bilibili など 20+ サイトを構造化クリップします。

---

<a id="features"></a>
## 🧩 機能マトリクス

| モジュール | 基本機能 | 主な特徴 |
| :--- | :--- | :--- |
| **執筆と閲覧** | 3 ペイン構成、TipTap WYSIWYG / Markdown 切替、数式、コードブロック、履歴 | **Editorial Flow テーマ**、ポスターノート、WeChat 整形、MD/HTML/PDF 出力 |
| **整理と公開** | 無制限ノートブック階層、タグ、ドラッグ並べ替え、全文検索 | **静的ナレッジベースサイト公開**（パスワード・期限・閲覧数制限対応） |
| **収集とメディア** | 分割アップロード（最大 1 GiB）、クライアント側自動画像圧縮 | **WeChat チャット履歴取込**、20+ プラットフォーム対応、ノート横断画像スワイプ |
| **データと図表** | テーブル、Markdown 表、Mermaid フローチャート／シーケンス図 | **AI 多次元テーブル**、公開アンケートフォーム、AI インフォグラフィック生成 |
| **AI とプロトコル** | 伴走型 AI サイドバー（BYOK：OpenAI / Claude / Gemini 互換） | **Remote MCP + デスクトップ ACP**、AI RSS 日報、プラグイン API |
| **同期と基盤** | Web / PWA / macOS / Windows / Linux / iOS / Android オフライン優先同期 | **Cloudflare 無料運用**または **Docker (`amd64`/`arm64`)**、OSS/PicGo/ImgBed |

---

<a id="導入"></a>
## ☁️ 導入方法

Cloudflare の無料枠を使ったサーバーレス構成、または VPS / NAS 上の Docker 構成を選べます。

### 方法 A: AI Agent に任せて導入（推奨）

```text
GitHub と Cloudflare のオンライン操作だけで EdgeEver を導入してください:
1. Fork https://github.com/tianma-if/edgeever。
2. Cloudflare で D1 `edgeever` と R2 `edgeever-resources` を作成します。
3. Workers & Pages で Fork の `main` ブランチから `edgeever` という名前の Worker を作成します。
   リポジトリのルートを使い、Cloudflare Workers Builds の既定のデプロイコマンドを維持します。
   その API トークンに D1 の読み取り・編集権限があることを確認して Save and Deploy を選択します。
4. Worker の作成後、ユーザーが指定したパスワードを実行時 Secret
   `EDGE_EVER_AUTH_PASSWORD` に設定します
   （32 文字以上を推奨）。管理者ユーザー名の既定値は `admin` です。別の名前を指定された場合は、
   次のビルド前に Workers Builds 変数 `EDGE_EVER_AUTH_USERNAME` を設定します。
5. 再度ビルドし、`/api/health` と `/api/openapi.json` を確認してから、
   その管理者ユーザー名とパスワードでログインできることを確認します。
6. GitHub Actions の `Update deployed EdgeEver` を有効にし、一度手動実行して、
   Fork が今後の安定版と修正を自動で受け取れるようにします。
```

### 方法 B: 手動のオンライン導入 / 方法 C: Docker

- Cloudflare 手動手順の詳細は [Online Deployment Guide](docs/deploy-cloudflare-button.md) を参照してください。
- VPS / NAS で Docker を導入する場合：

```sh
curl -fsSL https://edgeever.org/install.sh | bash
```

---

<a id="開発ローカルビルド"></a>
## 🛠️ 開発とローカルビルド

```sh
bun install
bun run dev                        # Web + API ローカル開発起動
bun run prepare:brand:icons        # 全プラットフォームのアイコンを再生成
bun run build:desktop              # macOS arm64 DMG / ZIP をローカルビルド
bun run build:android:apk:local    # 本番署名済み Android arm64 APK をビルド
git fetch upstream && git merge upstream/main
```

---

## コミュニティ・商標・免責

- **上流プロジェクト**: [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) · [Issues](https://github.com/tianma-if/edgeever/issues) · [Telegram](https://t.me/+wwUx1BYLrIdiZjY1)
- **商標とブランド**: EdgeEver の名称および公式ブランドは [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) に帰属します。本 Fork は EdgeEver に基づく派生版であり、公式リリースを示すものではありません。
- **免責事項**: 独立したオープンソースソフトウェアであり、Evernote Corporation とは無関係です。セルフホストされたデータの管理責任は各運用者に帰属します。

## コントリビューター

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
