import Constants from "expo-constants";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, RefreshCw } from "./icons";
import { Pressable, Text } from "./LocalizedText";
import { useMobileLocale, getMobileCatalog } from "../lib/mobile-locale";
import { useMobileUpdate } from "../lib/mobile-update";
import { useMobileTheme, resolveMobileThemeStyles } from "../lib/mobile-theme";
import { getMobileEditorialPalette } from "../lib/mobile-theme-colors";

export const MobileUpdateCard = () => {
  const { resolvedLocale } = useMobileLocale();
  const { resolvedTheme } = useMobileTheme();
  const palette = getMobileEditorialPalette(resolvedTheme);
  const { checkForUpdate, hasUpdate, installedVersion, isSupported, openUpdate, status } = useMobileUpdate();
  const busy = status === "checking";
  const styles = resolveMobileThemeStyles(baseStyles, resolvedTheme);
  const checkLabel = status === "checking"
    ? getMobileCatalog(resolvedLocale).mobile.update.checking
    : getMobileCatalog(resolvedLocale).mobile.update.checkForUpdates;
  const openLabel = getMobileCatalog(resolvedLocale).mobile.update.sources.github;

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{getMobileCatalog(resolvedLocale).mobile.update.title}</Text>
        <Text style={styles.description}>
          {getMobileCatalog(resolvedLocale).mobile.update.description}
        </Text>
        <Text style={styles.version}>
          {getMobileCatalog(resolvedLocale).mobile.update.currentVersion}: v{installedVersion ?? Constants.expoConfig?.version ?? "unknown"}
        </Text>
      </View>
      {hasUpdate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={() => void openUpdate()}
          style={[styles.button, busy && styles.buttonDisabled]}
        >
          <RefreshCw color={palette.accentText} size={16} />
          <Text style={styles.buttonText}>{openLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={() => void checkForUpdate()}
        style={[styles.button, busy && styles.buttonDisabled]}
      >
        {status === "checking" ? <ActivityIndicator color={palette.accentText} size="small" /> : <RefreshCw color={palette.accentText} size={16} />}
        <Text style={styles.buttonText}>{checkLabel}</Text>
      </Pressable>
      {!isSupported ? (
        <Text style={styles.hint}>
          {getMobileCatalog(resolvedLocale).mobile.update.releaseBuildsOnly}
        </Text>
      ) : null}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  card: {
    borderTopColor: "#eae5da",
    borderTopWidth: 1,
    gap: 12,
    padding: 16,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: "#1c1b18",
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    color: "#6b665e",
    fontSize: 12,
    lineHeight: 17,
  },
  version: {
    color: "#6b665e",
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e9f3ee",
    borderColor: "#b7d8c9",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#125e44",
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    color: "#9e978b",
    fontSize: 11,
    lineHeight: 16,
  },
});
