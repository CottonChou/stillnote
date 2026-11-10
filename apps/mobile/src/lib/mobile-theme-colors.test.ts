import { describe, expect, test } from "bun:test";
import { resolveMobileThemeColor, resolveMobileThemeStyles } from "./mobile-theme-colors";

describe("mobile dark theme colors", () => {
  test("maps neutral and semantic foreground colors", () => {
    expect(resolveMobileThemeColor("#0f172a", "dark")).toBe("#f8fafc");
    expect(resolveMobileThemeColor("#92400E", "dark")).toBe("#fde68a");
    expect(resolveMobileThemeColor("#1d4ed8", "dark")).toBe("#93c5fd");
  });

  test("maps warning and informational surfaces and borders", () => {
    expect(resolveMobileThemeColor("#fef3c7", "dark", "background")).toBe("#78350f");
    expect(resolveMobileThemeColor("#eff6ff", "dark", "background")).toBe("#172554");
    expect(resolveMobileThemeColor("#bfdbfe", "dark", "border")).toBe("#1e3a8a");
  });

  test("resolves StyleSheet-shaped records without changing light mode", () => {
    const styles = { card: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a" } };
    expect(resolveMobileThemeStyles(styles, "light")).toBe(styles);
    expect(resolveMobileThemeStyles(styles, "dark")).toEqual({
      card: { backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" },
    });
  });

  test("maps Editorial Flow paper surfaces and ink tokens into warm charcoal dark mode", () => {
    const styles = {
      paper: { backgroundColor: "#fdfcf9", borderColor: "#e6e1d6", color: "#1c1b18" },
      stream: { backgroundColor: "#f9f7f2", borderBottomColor: "#eae5da", color: "#57534e" },
      accent: { backgroundColor: "#e9f3ee", borderColor: "#b7d8c9", color: "#125e44" },
    };
    expect(resolveMobileThemeStyles(styles, "dark")).toEqual({
      paper: { backgroundColor: "#22211e", borderColor: "#2e2c28", color: "#eae6df" },
      stream: { backgroundColor: "#1d1c1a", borderBottomColor: "#2e2c28", color: "#a8a298" },
      accent: { backgroundColor: "#1b3128", borderColor: "#2c5a48", color: "#7cd9b4" },
    });
  });
});
