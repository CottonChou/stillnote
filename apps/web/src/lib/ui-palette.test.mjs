import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { contrastRatio } from "./color-contrast";

const globals = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

describe("application color system", () => {
  test("uses the same restrained brand green throughout the application", () => {
    const mobileEditor = readFileSync(new URL("../styles/mobile-markdown-editor.css", import.meta.url), "utf8");
    const button = readFileSync(new URL("../components/ui/button.tsx", import.meta.url), "utf8");

    expect(globals).toContain("--brand-green: #187958;");
    expect(globals).toContain("--brand-green-500-rgb: 24 121 88;");
    expect(globals).not.toContain("--brand-green: #00a82d;");
    expect(mobileEditor).toContain("color: #187958;");
    expect(button).toContain('solid: "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"');
    expect(contrastRatio("#125e44", "#e9f3ee")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", "#187958")).toBeGreaterThanOrEqual(4.5);
  });

  test("keeps menus, switches, and secondary icons in ink", () => {
    const switchSource = readFileSync(new URL("../components/ui/switch.tsx", import.meta.url), "utf8");
    const checkbox = readFileSync(new URL("../components/ui/checkbox.tsx", import.meta.url), "utf8");
    const settings = readFileSync(new URL("../components/SettingsPane.tsx", import.meta.url), "utf8");

    expect(globals).toContain("--accent: 41 25% 89%;");
    expect(globals).toContain("--accent-foreground: 38 9% 10%;");
    expect(globals).not.toContain("--accent-foreground: 158 70% 25%;");
    expect(globals).toContain("--switch-track-on: #403c37;");
    expect(globals).toContain("--checkbox-on: #403c37;");
    expect(globals).toContain("--switch-track-on: #eae6df;");
    expect(switchSource).toContain("data-[state=checked]:bg-[var(--switch-track-on)]");
    expect(switchSource).not.toContain("bg-emerald-500");
    expect(checkbox).toContain("data-[state=checked]:bg-[var(--checkbox-on)]");
    expect(checkbox).not.toContain("bg-emerald-500");
    expect(settings).not.toContain("text-emerald-");
    expect(contrastRatio("#fdfcf9", "#403c37")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", "#1c1b18")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#151513", "#eae6df")).toBeGreaterThanOrEqual(4.5);
  });

  test("keeps the light workspace on an editorial paper palette while preserving text hierarchy", () => {
    expect(globals).toContain("--workspace-canvas: #f4f1ea;");
    expect(globals).toContain("--workspace-sidebar: #f4f1ea;");
    expect(globals).toContain("--workspace-memo-list: #f9f7f2;");
    expect(globals).toContain("--workspace-editor: #fdfcf9;");
    expect(globals).toContain("--workspace-selection: #ebe6db;");
    expect(globals).toContain("--color-workspace-canvas: var(--workspace-canvas);");
    expect(globals).toContain("--workspace-hover: color-mix(in srgb, var(--workspace-sidebar) 55%, #fdfcf9);");
    expect(globals).toContain(".edgeever-workspace-sidebar-footer {\n  background: var(--workspace-sidebar);");
    expect(globals).toContain("--slate-500-rgb: 107 102 94;");
    expect(globals).toContain("--slate-950-rgb: 20 19 17;");
    expect(globals).toContain("--amber-50-rgb: 255 251 235;");
    expect(globals).toContain("--amber-300-rgb: 252 211 77;");
    expect(globals).toContain("--amber-400-rgb: 251 191 36;");
    expect(globals).toContain("--amber-500-rgb: 245 158 11;");
    expect(globals).toContain("--rose-50-rgb: 255 241 242;");
    expect(globals).toContain("--rose-400-rgb: 251 113 133;");
    expect(globals).not.toContain("--slate-500-rgb: 100 116 139;");
    expect(contrastRatio("#1c1b18", "#fdfcf9")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#57534e", "#fdfcf9")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#6b665e", "#f9f7f2")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#6b665e", "#fdfcf9")).toBeGreaterThanOrEqual(4.5);
  });

  test("keeps dark workspace surfaces distinct and warm charcoal neutral", () => {
    expect(globals).toContain("--workspace-canvas: #151513;");
    expect(globals).toContain("--workspace-sidebar: #181816;");
    expect(globals).toContain("--workspace-memo-list: #1d1c1a;");
    expect(globals).toContain("--workspace-editor: #22211e;");
    expect(globals).toContain("--foreground: 38 19% 90%;");
    expect(globals).toContain("--border: 40 8% 20%;");
    expect(globals).toContain("--amber-300-rgb: 180 83 9;");
    expect(globals).not.toContain("scrollbar-color: rgba(100, 116, 139, 0.18)");
    expect(contrastRatio("#eae6df", "#22211e")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#a8a298", "#22211e")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#948e84", "#22211e")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#948e84", "#1d1c1a")).toBeGreaterThanOrEqual(4.5);
  });
});
