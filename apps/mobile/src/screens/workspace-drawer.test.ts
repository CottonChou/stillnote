import { describe, expect, it } from "bun:test";
import {
  ANDROID_EXIT_CONFIRM_WINDOW_MS,
  DRAWER_CLOSE_BACK_GRACE_MS,
  resolveAndroidRootBackAction,
  resolveCardSwipe,
  resolveDrawerDrag,
} from "./workspace-utils";

describe("WorkspaceDrawer resolution logic", () => {
  const drawerWidth = 320;

  it("opens when right swipe distance exceeds threshold (22%)", () => {
    // 22% of 320 = 70.4px
    const result = resolveDrawerDrag({
      translationX: 75,
      velocityX: 0,
      drawerWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(true);
  });

  it("does not open when right swipe distance is too small with low velocity", () => {
    const result = resolveDrawerDrag({
      translationX: 30,
      velocityX: 50,
      drawerWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(false);
  });

  it("opens on fast fling right even if distance is small", () => {
    const result = resolveDrawerDrag({
      translationX: 35,
      velocityX: 450,
      drawerWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(true);
  });

  it("closes when left swipe distance exceeds threshold (22%) while open", () => {
    // translationX is negative when dragging left
    const result = resolveDrawerDrag({
      translationX: -80,
      velocityX: 0,
      drawerWidth,
      isCurrentlyOpen: true,
    });
    // result = true means stay open, false means close
    expect(result).toBe(false);
  });

  it("stays open when left swipe distance is small with low velocity", () => {
    const result = resolveDrawerDrag({
      translationX: -20,
      velocityX: -50,
      drawerWidth,
      isCurrentlyOpen: true,
    });
    expect(result).toBe(true);
  });

  it("closes on fast flick left even if distance is small", () => {
    const result = resolveDrawerDrag({
      translationX: -25,
      velocityX: -400,
      drawerWidth,
      isCurrentlyOpen: true,
    });
    expect(result).toBe(false);
  });
});

describe("MemoCard swipe action resolution logic", () => {
  const actionWidth = 140;

  it("opens actions when swiped left past threshold (35%)", () => {
    // 35% of 140 = 49px
    const result = resolveCardSwipe({
      translationX: -55,
      velocityX: 0,
      actionWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(true);
  });

  it("does not open actions when swipe left is too short with low velocity", () => {
    const result = resolveCardSwipe({
      translationX: -25,
      velocityX: -100,
      actionWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(false);
  });

  it("opens actions on fast flick left even if distance is small", () => {
    const result = resolveCardSwipe({
      translationX: -20,
      velocityX: -350,
      actionWidth,
      isCurrentlyOpen: false,
    });
    expect(result).toBe(true);
  });

  it("closes actions when swiped right past 30px while open", () => {
    const result = resolveCardSwipe({
      translationX: 45,
      velocityX: 0,
      actionWidth,
      isCurrentlyOpen: true,
    });
    // result = true means stay open, false means close
    expect(result).toBe(false);
  });

  it("stays open when dragged right less than 30px with low velocity", () => {
    const result = resolveCardSwipe({
      translationX: 15,
      velocityX: 50,
      actionWidth,
      isCurrentlyOpen: true,
    });
    expect(result).toBe(true);
  });

  it("closes actions on fast flick right", () => {
    const result = resolveCardSwipe({
      translationX: 10,
      velocityX: 300,
      actionWidth,
      isCurrentlyOpen: true,
    });
    expect(result).toBe(false);
  });
});

describe("Android root back guard logic", () => {
  it("swallows accidental hardware back right after drawer closes", () => {
    expect(
      resolveAndroidRootBackAction({
        now: 10_000 + DRAWER_CLOSE_BACK_GRACE_MS - 1,
        lastDrawerCloseAt: 10_000,
        lastExitPromptAt: 0,
      })
    ).toBe("swallow-recent-drawer-close");
  });

  it("prompts once before exiting at the root view", () => {
    expect(
      resolveAndroidRootBackAction({
        now: 20_000,
        lastDrawerCloseAt: 10_000,
        lastExitPromptAt: 0,
      })
    ).toBe("prompt-exit");
  });

  it("allows exiting when back is pressed a second time within the confirmation window", () => {
    expect(
      resolveAndroidRootBackAction({
        now: 20_000 + ANDROID_EXIT_CONFIRM_WINDOW_MS - 100,
        lastDrawerCloseAt: 10_000,
        lastExitPromptAt: 20_000,
      })
    ).toBe("allow-exit");
  });

  it("requires another double-back sequence after the confirmation window expires", () => {
    expect(
      resolveAndroidRootBackAction({
        now: 20_000 + ANDROID_EXIT_CONFIRM_WINDOW_MS + 1,
        lastDrawerCloseAt: 10_000,
        lastExitPromptAt: 20_000,
      })
    ).toBe("prompt-exit");
  });
});
