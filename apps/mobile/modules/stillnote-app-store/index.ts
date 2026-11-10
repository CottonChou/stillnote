import { requireNativeModule } from "expo";

export type GooglePlayOpenResult = "disabled" | "not-installed" | "opened" | "unavailable";

type StillNoteAppStoreNativeModule = {
  openGooglePlayDetails: (applicationId: string) => Promise<GooglePlayOpenResult | boolean>;
  getGooglePlayUpdate?: () => Promise<GooglePlayUpdateState>;
  startGooglePlayUpdate?: () => Promise<GooglePlayUpdateResult>;
  completeGooglePlayUpdate?: () => Promise<boolean>;
  addListener: (event: "onGooglePlayUpdate", listener: (state: GooglePlayUpdateState) => void) => { remove: () => void };
};

export type GooglePlayUpdateState = {
  status: "unavailable" | "available" | "downloading" | "ready";
  versionCode: number;
};
export type GooglePlayUpdateResult = "accepted" | "cancelled" | "unavailable";

// Older installed binaries can receive this JS through OTA before the native SDK.
// Missing native methods must therefore behave like an unavailable Play update.
export const googlePlayUpdates = {
  async check(): Promise<GooglePlayUpdateState> {
    try {
      return await requireNativeModule<StillNoteAppStoreNativeModule>("StillNoteAppStore")
        .getGooglePlayUpdate?.() ?? { status: "unavailable", versionCode: 0 };
    } catch {
      return { status: "unavailable", versionCode: 0 };
    }
  },
  async start(): Promise<GooglePlayUpdateResult> {
    try {
      return await requireNativeModule<StillNoteAppStoreNativeModule>("StillNoteAppStore")
        .startGooglePlayUpdate?.() ?? "unavailable";
    } catch {
      return "unavailable";
    }
  },
  async complete(): Promise<boolean> {
    try {
      return await requireNativeModule<StillNoteAppStoreNativeModule>("StillNoteAppStore")
        .completeGooglePlayUpdate?.() ?? false;
    } catch {
      return false;
    }
  },
  subscribe(listener: (state: GooglePlayUpdateState) => void): { remove: () => void } {
    try {
      const module = requireNativeModule<StillNoteAppStoreNativeModule>("StillNoteAppStore");
      return module.getGooglePlayUpdate
        ? module.addListener("onGooglePlayUpdate", listener)
        : { remove() {} };
    } catch {
      return { remove() {} };
    }
  },
};

export const openGooglePlayDetails = async (applicationId: string): Promise<GooglePlayOpenResult> => {
  const result = await requireNativeModule<StillNoteAppStoreNativeModule>("StillNoteAppStore")
    .openGooglePlayDetails(applicationId);
  if (result === true) {
    return "opened";
  }
  if (result === false) {
    return "unavailable";
  }
  return result;
};
