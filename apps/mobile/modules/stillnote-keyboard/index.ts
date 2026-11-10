import { requireNativeModule } from "expo";

type StillNoteKeyboardNativeModule = {
  show: () => boolean;
};

export const showStillNoteKeyboard = () => {
  requireNativeModule<StillNoteKeyboardNativeModule>("StillNoteKeyboard").show();
};
