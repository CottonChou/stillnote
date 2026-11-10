<div align="center">
  <h1>
    <img src="assets/brand/edgeever-icon.svg" alt="Logo EdgeEver" width="56" align="absmiddle" /> EdgeEver · Editorial Flow Edition
  </h1>
  <p>
    <b>Osobista baza wiedzy open-source oparta na projekcie <a href="https://github.com/tianma-if/edgeever">EdgeEver</a> (v2.16.1) — z przeprojektowanym interfejsem Editorial Flow, ikoną sosnowej zakładki i płynnymi gestami mobilnymi. Bezpłatnie na Cloudflare lub przez Docker.</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/edgeever?include_prereleases&color=187958&label=Fork%20Release" alt="Najnowsze wydanie Forka" /></a>
    <a href="https://github.com/CottonChou/edgeever/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/edgeever?style=social" alt="Gwiazdki Forka" /></a>
    <a href="https://github.com/tianma-if/edgeever"><img src="https://img.shields.io/badge/Based_on-tianma--if%2Fedgeever_v2.16.1-187958" alt="Oparte na tianma-if/edgeever" /></a>
    <a href="https://demo.edgeever.org"><img src="https://img.shields.io/badge/Upstream_Demo-Live-2c5a48" alt="Demo online" /></a>
  </p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> | <a href="README.zh-TW.md">繁體中文</a> | <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <b>Polski</b>
  </p>
  <p>
    <a href="#downloads">📦 Pobierz MAC i APK</a> &nbsp;|&nbsp;
    <a href="#nowoci-w-editorial-flow-edition">✨ Nowości Editorial Flow</a> &nbsp;|&nbsp;
    <a href="#features">🧩 Funkcje</a> &nbsp;|&nbsp;
    <a href="#wdrozenie">☁️ Wdrożenie</a> &nbsp;|&nbsp;
    <a href="#przewodnik-lokalne-budowanie">🛠️ Budowanie lokalne</a>
  </p>
  <p align="center">
    <img src="assets/readme/edgeever-hero-v6.png" alt="Podgląd przestrzeni roboczej EdgeEver" width="800" />
  </p>
</div>

> **Informacja o Forku**: `CottonChou/edgeever` to osobista edycja rozwojowa oparta na otwartoźródłowym projekcie [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) (obecnie zsynchronizowana z wersją `v2.16.1`). Nie jest to oficjalne wydanie autorów projektu głównego.

EdgeEver zachowuje klasyczny układ trzech paneli (**Notatniki · Lista notatek · Edytor**), natychmiastową synchronizację w chmurze, lokalne wsparcie offline w SQLite oraz natywną integrację z agentami AI (MCP i ACP).

---

<a id="nowoci-w-editorial-flow-edition"></a>
## ✨ Nowości w Editorial Flow Edition

Poza pełnym zestawem funkcji wersji `v2.16.1`, ten Fork wprowadza spójny wygląd i ulepszenia mobilne:

- **Interfejs Editorial Flow**: Aplikacja Web, klient desktopowy macOS oraz klient mobilny Expo / React Native korzystają ze stonowanej palety ciepłego papieru (`#f4f1ea` / `#f9f7f2` / `#fdfcf9`), trybu ciemnego Charcoal (`#151513` / `#1d1c1a` / `#22211e`) i akcentów sosnowej zieleni (`#187958` / `#43b88c`). Tło okien Electron dostosowuje się natywnie do motywu systemowego ([index.mjs](apps/desktop/src/main/index.mjs)).
- **Nowa ikona Editorial Pine Bookmark Folio**: Jednolity zestaw zasobów dla macOS (`icon.icns` i ikony zasobnika `trayTemplate`), Androida (`#187958` ikona adaptacyjna i ekran startowy), iOS, Web/PWA, witryny Astro oraz rozszerzeń przeglądarki.
- **Płynne gesty mobilne** *(szczegóły w [`docs/FORK_CUSTOMIZATIONS.md`](docs/FORK_CUSTOMIZATIONS.md))*:
  - **Szuflada notatników gestem w prawo**: Przesuń od lewej w liście notatek, aby otworzyć drzewo folderów, wyszukiwarkę, szybkie tworzenie i Kosz (`WorkspaceDrawer.tsx`).
  - **Szybkie akcje na karcie w lewo**: Przesuń kartę notatki w lewo, aby jednym dotknięciem oznaczyć gwiazdką lub usunąć (`WorkspaceNotesView.tsx`).
  - **Ciągłe przeglądanie zdjęć między notatkami**: Przesuwanie poza pierwsze lub ostatnie zdjęcie płynnie przechodzi do kolejnej notatki z obrazami i synchronizuje wybór listy po wyjściu (`ZoomableImagePreview.tsx`).

---

<a id="downloads"></a>
## 📦 Pobieranie (macOS DMG i Android APK)

### Niestandardowe wydania Forka (`CottonChou/edgeever`)

Gotowe pakiety z interfejsem **Editorial Flow**, **nową ikoną** i **ulepszeniami mobilnymi** są publikowane w [CottonChou/edgeever Releases](https://github.com/CottonChou/edgeever/releases/latest):

| Platforma | Architektura | Format | Uwagi |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | Zawiera natywny Rust Sidecar (`arm64`), nowe ikony paska menu i rozszerzenie udostępniania `EdgeEverShare.appex` (podpis Ad-hoc) |
| **Android** | `arm64-v8a` | `.apk` | Podpisany pakiet produkcyjny z silnikiem Hermes i ikoną adaptacyjną `#187958` |

<p>
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="Pobierz Fork macOS" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/edgeever/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="Pobierz Fork Android APK" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="Oficjalny Windows" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/tianma-if/edgeever/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="Oficjalny Linux AppImage" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/pl/app/edgeever/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="Oficjalny iOS" width="40" height="40" /></a>
</p>

> Linki do Windows, Linuxa i iOS App Store kierują do oficjalnego projektu [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever/releases/latest). Aplikacja na iOS wymaga Apple ID spoza Chin kontynentalnych.

### Rozszerzenie Web Clipper

<p>
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="Chrome" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/edgeever-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="Edge" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/firefox/addon/edgeever-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="Firefox" width="36" height="36" /></a>
</p>

---

<a id="features"></a>
## 🧩 Funkcje

| Moduł | Podstawowe możliwości | Wyróżniki |
| :--- | :--- | :--- |
| **Pisanie i czytanie** | Układ 3 paneli, TipTap WYSIWYG i Markdown, wzory matematyczne, historia wersji | **Motywy Editorial Flow**, natywne notatki plakatowe, eksport do MD/HTML/PDF |
| **Organizacja i publikacja** | Zagnieżdżone notatniki, tagi, sortowanie przeciąganiem, wyszukiwanie pełnotekstowe | **Publikacja bazy wiedzy jako statycznej strony** z hasłem i datą wygaśnięcia |
| **Zapisywanie i media** | Przesyłanie strumieniowe do 1 GiB, automatyczna kompresja obrazów | **Archiwizacja rozmów WeChat**, wycinanie z 20+ platform, ciągłe przeglądanie zdjęć |
| **Dane i diagramy** | Tabele natywne, Markdown i diagramy Mermaid | **Wielowymiarowe tabele AI**, formularze publiczne, infografiki AI |
| **AI i protokoły** | Asystent AI w panelu bocznym (BYOK: OpenAI / Claude / Gemini) | **Remote MCP i Desktop ACP**, codzienne podsumowania RSS AI, API wtyczek |
| **Synchronizacja** | Web / PWA / macOS / Windows / Linux / iOS / Android z kolejką offline | **Darmowy Cloudflare** lub **Docker (`amd64`/`arm64`)**, obsługa S3 / PicGo / ImgBed |

---

<a id="wdrozenie"></a>
## ☁️ Wdrożenie

### Opcja A: Wdrożenie z agentem AI (zalecane)

```text
Wdróż EdgeEver przez GitHub i Cloudflare:
1. Utwórz Fork repozytorium https://github.com/tianma-if/edgeever.
2. Utwórz bazę D1 `edgeever` i zasobnik R2 `edgeever-resources` w Cloudflare.
3. W Workers & Pages utwórz Worker o nazwie `edgeever` z gałęzi `main` Forka.
   Użyj katalogu głównego repozytorium, zachowaj domyślne polecenie wdrożenia
   Workers Builds i upewnij się, że token API może odczytywać i modyfikować D1.
   Wybierz Save and Deploy.
4. Po utworzeniu Workera zapisz wybrane hasło jako sekret środowiska
   uruchomieniowego `EDGE_EVER_AUTH_PASSWORD` (najlepiej co najmniej 32 znaki).
   Domyślna nazwa użytkownika to `admin`. Aby ją zmienić, ustaw zmienną
   Workers Builds `EDGE_EVER_AUTH_USERNAME` przed kolejnym buildem.
5. Ponów build, sprawdź `/api/health` i `/api/openapi.json`, a następnie
   zaloguj się nazwą administratora i hasłem.
6. Włącz i ręcznie uruchom raz workflow GitHub Actions `Update deployed EdgeEver`,
   aby Fork automatycznie otrzymywał przyszłe stabilne wersje i poprawki.
```

### Opcja B / C: Ręczne Cloudflare lub Docker na VPS / NAS

- Instrukcje ręczne: [Online Deployment Guide](docs/deploy-cloudflare-button.md)
- Szybka instalacja Docker:

```sh
curl -fsSL https://edgeever.org/install.sh | bash
```

---

<a id="przewodnik-lokalne-budowanie"></a>
## 🛠️ Przewodnik lokalny i budowanie pakietów

```sh
bun install
bun run dev                        # Lokalne uruchomienie Web + API
bun run prepare:brand:icons        # Wygeneruj ikony dla wszystkich platform
bun run build:desktop              # Zbuduj paczkę macOS arm64 DMG / ZIP
bun run build:android:apk:local    # Zbuduj podpisany APK Android arm64
git fetch upstream && git merge upstream/main
```

---

## Społeczność, marka i zastrzeżenia

- **Repozytorium główne**: [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever) · [Issues](https://github.com/tianma-if/edgeever/issues) · [Telegram](https://t.me/+wwUx1BYLrIdiZjY1)
- **Znak towarowy**: Nazwa EdgeEver i oficjalna identyfikacja należą do [`tianma-if/edgeever`](https://github.com/tianma-if/edgeever). Niniejszy Fork zaznacza swoje pochodzenie i nie jest oficjalnym wydaniem.
- **Zastrzeżenie**: Niezależne oprogramowanie open-source niezwiązane z Evernote Corporation. Operatorzy instancji odpowiadają za przechowywane treści.

## Współtwórcy

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
