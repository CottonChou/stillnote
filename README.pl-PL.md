<div align="center">
  <h1>
    <img src="assets/brand/stillnote-icon.svg" alt="Logo StillNote" width="56" align="absmiddle" /> StillNote
  </h1>
  <p>
    <b>Otwartoźródłowa osobista baza wiedzy AI i trzypanelowy edytor notatek — z interfejsem Editorial Flow, ikoną sosnowej zakładki, leniwą synchronizacją notatników i płynnymi gestami mobilnymi. Bezpłatnie na Cloudflare lub przez Docker.</b>
  </p>
  <p>
    <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="https://img.shields.io/github/v/release/CottonChou/stillnote?include_prereleases&color=187958&label=Release" alt="Najnowsze wydanie" /></a>
    <a href="https://github.com/CottonChou/stillnote/stargazers"><img src="https://img.shields.io/github/stars/CottonChou/stillnote?style=social" alt="Gwiazdki GitHub" /></a>
    <a href="https://github.com/CottonChou/stillnote/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-187958" alt="Licencja AGPL-3.0" /></a>
    <a href="https://stillnote.org"><img src="https://img.shields.io/badge/Docs-stillnote.org-2c5a48" alt="Dokumentacja" /></a>
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
    <img src="assets/readme/stillnote-hero-v6.png" alt="Podgląd przestrzeni roboczej StillNote" width="800" />
  </p>
</div>

StillNote zachowuje klasyczny układ trzech paneli (**Notatniki · Lista notatek · Edytor**), natychmiastową synchronizację w chmurze, lokalne wsparcie offline w SQLite oraz natywną integrację z agentami AI (MCP i ACP).

---

<a id="nowoci-w-editorial-flow-edition"></a>
## ✨ Nowości Editorial Flow (`v2.17.0`)

Edycja dopracowuje czytelność przy długim pisaniu, spójność wizualną, ergonomię dotykową oraz szybkość synchronizacji mobilnej:

- **Interfejs Editorial Flow**: Aplikacja Web, klient desktopowy macOS oraz klient mobilny Expo / React Native korzystają ze stonowanej palety ciepłego papieru (`#f4f1ea` / `#f9f7f2` / `#fdfcf9`), trybu ciemnego Charcoal (`#151513` / `#1d1c1a` / `#22211e`) i akcentów sosnowej zieleni (`#187958` / `#43b88c`). Nagłówek notatki grupuje udostępnianie w menu `...` obok przycisku zamknięcia notatki.
- **Nowa ikona Editorial Pine Bookmark Folio**: Jednolity zestaw zasobów dla macOS (`icon.icns` i ikony zasobnika `trayTemplate`), Androida (`#187958` ikona adaptacyjna i ekran startowy), iOS, Web/PWA, witryny Astro oraz rozszerzeń przeglądarki.
- **Płynne gesty mobilne i synchronizacja na żądanie** *(szczegóły w [`docs/mobile-features.md`](docs/mobile-features.md))*:
  - **Płynna szuflada DrawerLayout i ochrona przed przypadkowym wyjściem**: Przesuwanie w prawo/lewo bez błędnego zamykania aplikacji na Androidzie (`WorkspaceDrawer.tsx`).
  - **Leniwa synchronizacja z metadanymi i ręczne odświeżanie notatnika**: Najpierw pobierane są notatniki i tytuły, a treść doczytuje się po otwarciu notatki (`Sync Notebook`).
  - **Szybkie akcje na karcie w lewo**: Oznaczanie gwiazdką lub przenoszenie do Kosza jednym gestem (`WorkspaceNotesView.tsx`).
  - **Ciągłe przeglądanie zdjęć między notatkami**: Płynne przejście poza pierwsze/ostatnie zdjęcie (`ZoomableImagePreview.tsx`).

---

<a id="downloads"></a>
## 📦 Pobieranie (macOS DMG i Android APK)

### Oficjalne wydania

Gotowe pakiety na wszystkie platformy są publikowane w [StillNote Releases](https://github.com/CottonChou/stillnote/releases/latest):

| Platforma | Architektura | Format | Uwagi |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (`arm64`) | `.dmg` / `.zip` | Zawiera natywny Rust Sidecar (`arm64`), nowe ikony paska menu i rozszerzenie udostępniania `StillNoteShare.appex` (podpis Ad-hoc) |
| **Android** | `arm64-v8a` | `.apk` | Podpisany pakiet produkcyjny (`org.stillnote.mobile`) z silnikiem Hermes i ikoną adaptacyjną `#187958` |

<p>
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/macos.svg" alt="Pobierz StillNote macOS" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/google-play.svg" alt="Pobierz StillNote Android APK" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/windows.svg" alt="Windows" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://github.com/CottonChou/stillnote/releases/latest"><img src="assets/readme/platforms/tux.svg" alt="Linux AppImage" width="40" height="40" /></a>&nbsp;&nbsp;
  <a href="https://apps.apple.com/pl/app/stillnote/id6792625631"><img src="assets/readme/platforms/app-store.svg" alt="iOS App Store" width="40" height="40" /></a>
</p>

> Sprawdzanie aktualizacji na desktopie i Androidzie wskazuje bezpośrednio na [`CottonChou/stillnote`](https://github.com/CottonChou/stillnote/releases/latest).

### Rozszerzenie Web Clipper

<p>
  <a href="https://chromewebstore.google.com/detail/stillnote-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/chrome/chrome.svg" alt="Chrome" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/stillnote-web-clipper/gjadpfmanienmlofajibkfkkpfdkclgo"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/edge/edge.svg" alt="Edge" width="36" height="36" /></a>&nbsp;&nbsp;
  <a href="https://addons.mozilla.org/firefox/addon/stillnote-web-clipper/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/58881b84c4d73adc03c06fa2c275a7abee02d935/src/firefox/firefox.svg" alt="Firefox" width="36" height="36" /></a>
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
Wdróż StillNote przez GitHub i Cloudflare:
1. Utwórz Fork repozytorium https://github.com/CottonChou/stillnote.
2. Utwórz bazę D1 `stillnote` i zasobnik R2 `stillnote-resources` w Cloudflare.
3. W Workers & Pages utwórz Worker o nazwie `stillnote` z gałęzi `main` Forka.
   Użyj katalogu głównego repozytorium, zachowaj domyślne polecenie wdrożenia
   Workers Builds i upewnij się, że token API może odczytywać i modyfikować D1.
   Wybierz Save and Deploy.
4. Po utworzeniu Workera zapisz wybrane hasło jako sekret środowiska
   uruchomieniowego `STILLNOTE_AUTH_PASSWORD` (najlepiej co najmniej 32 znaki).
   Domyślna nazwa użytkownika to `admin`. Aby ją zmienić, ustaw zmienną
   Workers Builds `STILLNOTE_AUTH_USERNAME` przed kolejnym buildem.
5. Ponów build, sprawdź `/api/health` i `/api/openapi.json`, a następnie
   zaloguj się nazwą administratora i hasłem.
6. Włącz i ręcznie uruchom raz workflow GitHub Actions `Update deployed StillNote`,
   aby Fork automatycznie otrzymywał przyszłe stabilne wersje i poprawki.
```

### Opcja B / C: Ręczne Cloudflare lub Docker na VPS / NAS

- Instrukcje ręczne: [Online Deployment Guide](docs/deploy-cloudflare-button.md)
- Szybka instalacja Docker:

```sh
curl -fsSL https://stillnote.org/install.sh | bash
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
```

---

## Społeczność, marka i zastrzeżenia

- **Repozytorium**: [`CottonChou/stillnote`](https://github.com/CottonChou/stillnote) · [Issues](https://github.com/CottonChou/stillnote/issues) · [Telegram](https://t.me/+wwUx1BYLrIdiZjY1)
- **Marka i wydania**: Kod źródłowy oraz wydania StillNote dla tej edycji są utrzymywane w [`CottonChou/stillnote`](https://github.com/CottonChou/stillnote).
- **Zastrzeżenie**: Niezależne oprogramowanie open-source niezwiązane z Evernote Corporation. Operatorzy instancji odpowiadają za przechowywane treści.
