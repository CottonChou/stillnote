import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Constants from "expo-constants";
import { AppState, Linking, Platform, type AppStateStatus } from "react-native";
import { Alert } from "../components/LocalizedText";
import { useMobileLocale, getMobileCatalog, formatMobileCopy } from "./mobile-locale";
import {
  ANDROID_INSTALL_UPDATE_SOURCES,
  findNewerMobileRelease,
  GITHUB_LATEST_RELEASE_URL,
  type MobileInstallUpdateSource,
  type MobileRelease,
} from "./mobile-release";
import { openMobileInstallUpdateSource } from "./mobile-update-destination";

const FOREGROUND_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

type MobileUpdateStatus = "idle" | "checking" | "available";
export type MobileUpdateKind = "install";

type MobileUpdateContextValue = {
  checkForUpdate: () => Promise<void>;
  hasUpdate: boolean;
  installedVersion: string | null;
  isSupported: boolean;
  openUpdate: () => Promise<void>;
  status: MobileUpdateStatus;
  updateKind: MobileUpdateKind | null;
};

const MobileUpdateContext = createContext<MobileUpdateContextValue>({
  checkForUpdate: async () => undefined,
  hasUpdate: false,
  installedVersion: null,
  isSupported: false,
  openUpdate: async () => undefined,
  status: "idle",
  updateKind: null,
});
const MobileUpdateAvailableContext = createContext(false);

export const MobileUpdateProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedLocale } = useMobileLocale();
  const [installRelease, setInstallRelease] = useState<MobileRelease | null>(null);
  const [status, setStatus] = useState<MobileUpdateStatus>("idle");
  const [updateKind, setUpdateKind] = useState<MobileUpdateKind | null>(null);
  const activeCheckRef = useRef<Promise<void> | null>(null);
  const lastAutomaticCheckRef = useRef(0);
  const isSupported = !__DEV__ && Platform.OS === "android";
  const installedVersion = Constants.expoConfig?.version ?? null;

  const showLinkError = useCallback(() => {
    Alert.alert(
      getMobileCatalog(resolvedLocale).mobile.update.linkOpenFailed,
      getMobileCatalog(resolvedLocale).mobile.update.linkOpenFailedHint
    );
  }, [resolvedLocale]);

  const openManualUpdateSource = useCallback((source: MobileInstallUpdateSource) => {
    void openMobileInstallUpdateSource(source, { linking: Linking }).catch(() => {
      showLinkError();
    });
  }, [showLinkError]);

  const openInstallUpdateOptions = useCallback((release: MobileRelease | null) => {
    const github = ANDROID_INSTALL_UPDATE_SOURCES.find((source) => source.id === "github");
    if (!github) {
      return;
    }
    const copy = getMobileCatalog(resolvedLocale).mobile.update;
    Alert.alert(
      copy.available,
      !release
        ? copy.chooseSourceHint
        : formatMobileCopy(copy.releaseAvailable, { version: release.version }),
      [
        {
          text: copy.later,
          style: "cancel",
        },
        ...(release?.downloadUrl ? [{
          icon: "github" as const,
          text: resolvedLocale === "zh-CN" ? `下载 v${release.version} 安装包` : `Download v${release.version} APK`,
          onPress: () => openManualUpdateSource({ id: "github", url: release.downloadUrl }),
        }] : []),
        {
          icon: "github" as const,
          text: copy.sources[github.id],
          onPress: () => openManualUpdateSource({
            id: "github",
            url: release?.releaseUrl ?? github.url,
          }),
        },
      ]
    );
  }, [resolvedLocale, openManualUpdateSource]);

  const runCheck = useCallback((userInitiated: boolean) => {
    if (activeCheckRef.current) {
      return activeCheckRef.current;
    }

    if (!isSupported) {
      if (userInitiated) {
        Alert.alert(
          getMobileCatalog(resolvedLocale).mobile.update.unsupported,
          getMobileCatalog(resolvedLocale).mobile.update.unsupportedHint
        );
      }
      return Promise.resolve();
    }

    const check = (async () => {
      try {
        setStatus("checking");
        if (!installedVersion) {
          throw new Error("Installed app version is unavailable");
        }
        const release = await findNewerMobileRelease(installedVersion);
        if (release) {
          setInstallRelease(release);
          setUpdateKind("install");
          setStatus("available");
          if (userInitiated) {
            openInstallUpdateOptions(release);
          }
          return;
        }
        setInstallRelease(null);
        setUpdateKind(null);
        setStatus("idle");
        if (userInitiated) {
          Alert.alert(
            getMobileCatalog(resolvedLocale).mobile.update.none,
            resolvedLocale === "zh-CN"
              ? `当前版本 v${installedVersion} 已是最新正式版。`
              : `Version v${installedVersion} is already up to date.`
          );
        }
      } catch {
        setInstallRelease(null);
        setUpdateKind(null);
        setStatus("idle");
        if (userInitiated) {
          const copy = getMobileCatalog(resolvedLocale).mobile.update;
          Alert.alert(
            copy.failed,
            resolvedLocale === "zh-CN"
              ? "无法连接到 GitHub Release 页面，请检查网络或直接打开浏览器查看。"
              : "Could not reach the GitHub Releases page. Check your network or open it in a browser.",
            [
              { text: copy.later, style: "cancel" },
              {
                icon: "github",
                text: copy.sources.github,
                onPress: () => openManualUpdateSource({ id: "github", url: GITHUB_LATEST_RELEASE_URL }),
              },
            ]
          );
        }
      }
    })();

    activeCheckRef.current = check;
    void check.finally(() => {
      activeCheckRef.current = null;
    });
    return check;
  }, [installedVersion, isSupported, openInstallUpdateOptions, openManualUpdateSource, resolvedLocale]);

  useEffect(() => {
    const attemptAutomaticCheck = () => {
      if (Date.now() - lastAutomaticCheckRef.current < FOREGROUND_CHECK_INTERVAL_MS) {
        return;
      }
      lastAutomaticCheckRef.current = Date.now();
      void runCheck(false);
    };
    const timer = setTimeout(attemptAutomaticCheck, 1_500);
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        attemptAutomaticCheck();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [runCheck]);

  const openUpdate = useCallback(async () => {
    if (Platform.OS !== "android" || updateKind !== "install") {
      return;
    }
    openInstallUpdateOptions(installRelease);
  }, [installRelease, openInstallUpdateOptions, updateKind]);

  const hasUpdate = status === "available";
  const value = useMemo<MobileUpdateContextValue>(
    () => ({
      checkForUpdate: () => runCheck(true),
      hasUpdate,
      installedVersion,
      isSupported,
      openUpdate,
      status,
      updateKind,
    }),
    [hasUpdate, installedVersion, isSupported, openUpdate, runCheck, status, updateKind]
  );

  return (
    <MobileUpdateAvailableContext.Provider value={hasUpdate}>
      <MobileUpdateContext.Provider value={value}>{children}</MobileUpdateContext.Provider>
    </MobileUpdateAvailableContext.Provider>
  );
};

export const useMobileUpdate = () => useContext(MobileUpdateContext);
export const useMobileUpdateAvailable = () => useContext(MobileUpdateAvailableContext);
