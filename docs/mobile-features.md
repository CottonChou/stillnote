# StillNote Mobile Interaction Features & Gestures

This document details the touch gestures, fullscreen image preview transitions, and offline sync mechanics in the StillNote mobile client (Expo / React Native).

---

## Table of Contents
1. [Cross-Note Fullscreen Image Swipe & Selection Sync](#1-cross-note-fullscreen-image-swipe--selection-sync)
2. [Swipe Right to Open Notebook Drawer](#2-swipe-right-to-open-notebook-drawer)
3. [Swipe Left Note Card Actions (Pin & Delete)](#3-swipe-left-note-card-actions-pin--delete)
4. [Metadata-First Lazy Sync Architecture](#4-metadata-first-lazy-sync-architecture)

---

## 1. Cross-Note Fullscreen Image Swipe & Selection Sync

### Interaction Design
1. **Seamless Cross-Note Navigation**:
   - When previewing images in fullscreen (`ZoomableImagePreview`), swiping past the last image (or before the first image) does not bounce back abruptly. Instead, it smoothly transitions to the **next or previous note containing images** in the current workspace.
   - Text-only notes are automatically skipped, landing seamlessly on the first (or last) image of the adjacent media note.
2. **Context-Aware Header Capsule**:
   - The top counter capsule displays the parent note title and image index (e.g., `Project Meeting Minutes · 1 / 3`), giving immediate context during browsing.
3. **Exit Selection Sync**:
   - When exiting the image viewer (via close button or back gesture), the main notes list and detail view automatically synchronize selection to the **note containing the last viewed image**.

### Key Implementation
* **`apps/mobile/src/components/ZoomableImagePreview.tsx`**:
  * Supports `onReachBoundary`, `canNavigateNext`, `canNavigatePrevious`, and `noteTitle` props.
  * Provides natural swipe feedback and slide-out transitions at boundary images.
* **`apps/mobile/src/screens/WorkspaceMemoDetail.tsx`**:
  * Leverages local SQLite mirror caching for fast cross-note image retrieval and decoding.

---

## 2. Swipe Right to Open Notebook Drawer

### Interaction Design
1. **Swipe Right Gesture**:
   - Swiping right (`translationX > 22`) anywhere on the note list smoothly draws out the notebook navigation panel.
   - Smart vertical scroll arbitration: vertical swipes exceeding 25px prioritize list scrolling without conflicting with horizontal drawer opening.
2. **Swipe Left & Backdrop Dismissal**:
   - Swiping left anywhere on the drawer or tapping the semi-transparent backdrop smoothly closes the drawer.
   - Android back button integration: pressing the physical/system back button dismisses the drawer before navigating back.
3. **Full Navigation Integration**:
   - **All Notes**: One-tap return with note count badge.
   - **Notebook Tree Hierarchy**: Multi-level indentation, one-tap expand/collapse all, and active notebook indicator.
   - **Quick Search & Inline Creation**: Real-time fuzzy filtering of notebook names and inline creation of child notebooks.
   - **Trash Shortcut**: Direct access to deleted notes for quick recovery.

---

## 3. Swipe Left Note Card Actions (Pin & Delete)

### Interaction Design
1. **Fluid Swipe Actions**:
   - Swiping left on any note card (`translationX < 0`) reveals two action buttons:
     - **Pin / Unpin**: Warm amber (`#d97706`) with `Sparkles` icon and dynamic state toggle.
     - **Delete**: Crimson (`#ef4444`) with `Trash2` icon.
   - 140px displacement threshold (70px per button) with smooth rubber-band damping beyond the boundary.
2. **Gesture Conflict Guarding**:
   - Vertical guard (`failOffsetY([-20, 20])`) prevents accidental card swipes during vertical list scrolling.
   - Isolated horizontal directions: card swipe-left never triggers drawer swipe-right.
3. **Optimistic Updates & Trash Protection**:
   - Pinning immediately updates local React Query cache for instant feedback.
   - Deleting in regular views immediately removes the item; in Trash view, a confirmation modal guards against accidental permanent deletion.

---

## 4. Metadata-First Lazy Sync Architecture

1. **Lightweight Index First**:
   - Synchronization prioritizes notebook hierarchy and note metadata (ID, title, tags, timestamps, excerpt), indexing thousands of notes within hundreds of milliseconds.
2. **On-Demand Content Loading**:
   - Full note bodies (`content_json` / `content_markdown`) are fetched lazily upon opening and cached in the local SQLite mirror.
   - Supports single notebook sync (`Sync Notebook`) and global sync, significantly reducing data usage and startup latency.
