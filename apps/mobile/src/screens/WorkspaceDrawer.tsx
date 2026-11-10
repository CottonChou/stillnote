import type { Notebook } from "@edgeever/shared";
import { getMobileNotebookSearchVisibleIds } from "@edgeever/shared/mobile-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Search,
  Trash2,
  X,
} from "../components/icons";
import { useMobileLocale } from "../lib/mobile-locale";
import { useMobileTheme } from "../lib/mobile-theme";
import { getMobileEditorialPalette } from "../lib/mobile-theme-colors";
import {
  filterCollapsedNotebookOptions,
  filterNotebookOptionsById,
  flattenNotebooks,
  getNotebookAncestorIds,
  getNotebookParentIdSet,
  resolveDrawerDrag,
  type NotebookOption,
} from "./workspace-utils";

export const ALL_NOTES_ID = "all";
export type MemoView = "notebook" | "trash";

export interface UseNotebookDrawerOptions {
  drawerWidth: number;
  enabled?: boolean;
}

export const useNotebookDrawer = ({ drawerWidth, enabled = true }: UseNotebookDrawerOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useSharedValue(-drawerWidth);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isOpen) {
      translateX.value = -drawerWidth;
    }
  }, [drawerWidth, isOpen, translateX]);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    translateX.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.8 });
    backdropOpacity.value = withTiming(0.5, { duration: 220 });
  }, [backdropOpacity, translateX]);

  const closeDrawer = useCallback(() => {
    translateX.value = withTiming(-drawerWidth, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setIsOpen)(false);
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [backdropOpacity, drawerWidth, translateX]);

  // Swipe right gesture on NotesView to pull out the drawer
  const notesSwipeGesture = Gesture.Pan()
    .enabled(enabled && !isOpen)
    .activeOffsetX(22) // Drag right at least 22px
    .failOffsetX(-15) // Dragging left fails immediately
    .failOffsetY([-25, 25]) // Vertical scroll > 25px takes priority for note list
    .onStart(() => {
      runOnJS(setIsOpen)(true);
    })
    .onUpdate((e) => {
      const offset = Math.max(0, Math.min(drawerWidth, e.translationX));
      translateX.value = -drawerWidth + offset;
      backdropOpacity.value = (offset / drawerWidth) * 0.5;
    })
    .onEnd((e) => {
      const willOpen = resolveDrawerDrag({
        translationX: e.translationX,
        velocityX: e.velocityX,
        drawerWidth,
        isCurrentlyOpen: false,
      });
      if (willOpen) {
        translateX.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.8 });
        backdropOpacity.value = withTiming(0.5, { duration: 200 });
        runOnJS(setIsOpen)(true);
      } else {
        translateX.value = withTiming(-drawerWidth, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(setIsOpen)(false);
          }
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      }
    });

  // Swipe left gesture on Drawer to close it
  const drawerPanGesture = Gesture.Pan()
    .enabled(isOpen)
    .activeOffsetX(-15) // Dragging left activates dismissal
    .failOffsetX(15)
    .onUpdate((e) => {
      const offset = Math.max(-drawerWidth, Math.min(0, e.translationX));
      translateX.value = offset;
      backdropOpacity.value = ((drawerWidth + offset) / drawerWidth) * 0.5;
    })
    .onEnd((e) => {
      const willStayOpen = resolveDrawerDrag({
        translationX: e.translationX,
        velocityX: e.velocityX,
        drawerWidth,
        isCurrentlyOpen: true,
      });
      if (!willStayOpen) {
        translateX.value = withTiming(-drawerWidth, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(setIsOpen)(false);
          }
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.8 });
        backdropOpacity.value = withTiming(0.5, { duration: 200 });
      }
    });

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    notesSwipeGesture,
    drawerPanGesture,
    drawerAnimatedStyle,
    backdropAnimatedStyle,
  };
};

export interface NotebookDrawerProps {
  activeNotebookId: string;
  drawerAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  backdropAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  drawerPanGesture: ReturnType<typeof Gesture.Pan>;
  drawerWidth: number;
  isOpen: boolean;
  memoView: MemoView;
  notebooks: Notebook[];
  onClose: () => void;
  onCreateNotebook?: (name: string, parentId: string | null) => Promise<string>;
  onSelectAllNotes: () => void;
  onSelectNotebook: (notebookId: string) => void;
  onSelectTrash: () => void;
  totalNotesCount?: number;
}

export const NotebookDrawer = ({
  activeNotebookId,
  backdropAnimatedStyle,
  drawerAnimatedStyle,
  drawerPanGesture,
  drawerWidth,
  isOpen,
  memoView,
  notebooks,
  onClose,
  onCreateNotebook,
  onSelectAllNotes,
  onSelectNotebook,
  onSelectTrash,
  totalNotesCount,
}: NotebookDrawerProps) => {
  const { translate } = useMobileLocale();
  const { resolvedTheme } = useMobileTheme();
  const isDark = resolvedTheme === "dark";
  const palette = getMobileEditorialPalette(resolvedTheme);
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState("");
  const [creating, setCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newNotebookParentId, setNewNotebookParentId] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [isSavingNotebook, setIsSavingNotebook] = useState(false);
  const createInFlight = useRef(false);
  const [collapsedNotebookIds, setCollapsedNotebookIds] = useState<Set<string>>(() => new Set());

  const notebookOptions = flattenNotebooks(notebooks);
  const searchQuery = searchText.trim();
  const childNotebookIds = getNotebookParentIdSet(notebooks);
  const activeNotebookAncestorIds = getNotebookAncestorIds(notebooks, activeNotebookId);

  const visibleNotebookOptions = searchQuery
    ? filterNotebookOptionsById(notebookOptions, getMobileNotebookSearchVisibleIds(notebooks, searchText))
    : filterCollapsedNotebookOptions(notebookOptions, collapsedNotebookIds);

  const activeNotebookName = activeNotebookId === ALL_NOTES_ID
    ? "全部笔记"
    : notebooks.find((notebook) => notebook.id === activeNotebookId)?.name ?? "全部笔记";

  const allNotebookBranchesExpanded = childNotebookIds.size > 0 &&
    Array.from(childNotebookIds).every((notebookId) => !collapsedNotebookIds.has(notebookId));

  useEffect(() => {
    if (isOpen) {
      setSearchText("");
      setCreating(false);
      setNewNotebookName("");
      setNewNotebookParentId(null);
      setCreateError("");
      setCollapsedNotebookIds(new Set(Array.from(childNotebookIds).filter((id) => !activeNotebookAncestorIds.has(id))));
    }
  }, [isOpen, activeNotebookId, notebooks]);

  const submitNewNotebook = async () => {
    const name = newNotebookName.trim();
    if (!onCreateNotebook || createInFlight.current || !name || name.length > 80) {
      return;
    }
    createInFlight.current = true;
    setIsSavingNotebook(true);
    setCreateError("");
    try {
      const notebookId = await onCreateNotebook(name, newNotebookParentId);
      onSelectNotebook(notebookId);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "创建笔记本失败，请重试");
    } finally {
      createInFlight.current = false;
      setIsSavingNotebook(false);
    }
  };

  const toggleNotebookCollapsed = (notebookId: string) => {
    setCollapsedNotebookIds((current) => {
      const next = new Set(current);
      if (next.has(notebookId)) {
        next.delete(notebookId);
      } else {
        next.add(notebookId);
      }
      return next;
    });
  };

  const toggleAllNotebookBranches = () => {
    setCollapsedNotebookIds(allNotebookBranchesExpanded ? new Set(childNotebookIds) : new Set());
  };

  return (
    <View
      pointerEvents={isOpen ? "auto" : "none"}
      style={StyleSheet.absoluteFill}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable
          accessibilityLabel="关闭抽屉"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Drawer Container with Pan Gesture */}
      <GestureDetector gesture={drawerPanGesture}>
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: palette.list,
              borderRightColor: palette.divider,
              paddingBottom: Math.max(16, insets.bottom),
              paddingTop: Math.max(16, insets.top),
              width: drawerWidth,
            },
            drawerAnimatedStyle,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.headerIconWrap, isDark && styles.headerIconWrapDark]}>
                <BookOpen color={palette.accent} size={18} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                  笔记本
                </Text>
                <Text numberOfLines={1} style={[styles.headerSubtitle, isDark && styles.mutedTextDark]}>
                  {memoView === "trash" ? "当前：回收站" : translate(`当前：${activeNotebookName}`)}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="关闭侧边栏"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={[styles.closeButton, isDark && styles.closeButtonDark]}
            >
              <X color={palette.inkSecondary} size={19} />
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
            <Search color={palette.inkMuted} size={16} />
            <TextInput
              accessibilityLabel="搜索笔记本"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchText}
              placeholder="搜索笔记本"
              placeholderTextColor={palette.inkPlaceholder}
              style={[styles.searchInput, isDark && styles.textDark]}
              value={searchText}
            />
            {searchText ? (
              <Pressable hitSlop={6} onPress={() => setSearchText("")}>
                <X color={palette.inkMuted} size={15} />
              </Pressable>
            ) : null}
          </View>

          {/* Scrollable Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {/* All Notes Row */}
            <Pressable
              accessibilityLabel={activeNotebookId === ALL_NOTES_ID && memoView === "notebook" ? "当前：全部笔记" : "切换到全部笔记"}
              accessibilityRole="button"
              onPress={onSelectAllNotes}
              style={[
                styles.navItem,
                activeNotebookId === ALL_NOTES_ID && memoView === "notebook" && (isDark ? styles.navItemActiveDark : styles.navItemActive),
              ]}
            >
              <View style={styles.navItemLeft}>
                <BookOpen
                  color={activeNotebookId === ALL_NOTES_ID && memoView === "notebook" ? palette.accent : palette.inkSecondary}
                  size={18}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.navItemText,
                    isDark && styles.textDark,
                    activeNotebookId === ALL_NOTES_ID && memoView === "notebook" && [styles.navItemTextActive, isDark && styles.navItemTextActiveDark],
                  ]}
                >
                  全部笔记
                </Text>
              </View>
              {typeof totalNotesCount === "number" ? (
                <View style={[styles.badge, isDark && styles.badgeDark]}>
                  <Text style={[styles.badgeText, isDark && styles.badgeTextDark]}>
                    {totalNotesCount}
                  </Text>
                </View>
              ) : activeNotebookId === ALL_NOTES_ID && memoView === "notebook" ? (
                <Check color={palette.accent} size={17} />
              ) : null}
            </Pressable>

            {/* Notebooks Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.mutedTextDark]}>
                {searchQuery ? "匹配的笔记本" : "笔记本"}
              </Text>
              <View style={styles.sectionActions}>
                {!searchQuery && childNotebookIds.size > 0 ? (
                  <Pressable
                    accessibilityLabel={allNotebookBranchesExpanded ? "收起全部笔记本" : "展开全部笔记本"}
                    accessibilityRole="button"
                    hitSlop={6}
                    onPress={toggleAllNotebookBranches}
                    style={styles.actionPill}
                  >
                    <Text style={[styles.actionPillText, isDark && styles.navItemTextActiveDark]}>
                      {allNotebookBranchesExpanded ? "收起全部" : "展开全部"}
                    </Text>
                  </Pressable>
                ) : null}
                {onCreateNotebook ? (
                  <Pressable
                    accessibilityLabel="新建笔记本"
                    accessibilityRole="button"
                    hitSlop={6}
                    onPress={() => {
                      setCreating((v) => !v);
                      setCreateError("");
                    }}
                    style={[
                      styles.createToggle,
                      isDark && styles.createToggleDark,
                      creating && (isDark ? styles.createToggleActiveDark : styles.createToggleActive),
                    ]}
                  >
                    <Plus color={palette.accent} size={16} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Inline Notebook Creation Form */}
            {creating && onCreateNotebook ? (
              <View style={[styles.createForm, isDark && styles.createFormDark]}>
                <TextInput
                  accessibilityLabel="新笔记本名称"
                  autoFocus
                  maxLength={80}
                  onChangeText={setNewNotebookName}
                  placeholder="新笔记本名称"
                  placeholderTextColor={palette.inkPlaceholder}
                  returnKeyType="done"
                  style={[styles.createInput, isDark && styles.createInputDark]}
                  value={newNotebookName}
                />
                <View style={styles.parentChoiceRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: newNotebookParentId === null }}
                    onPress={() => setNewNotebookParentId(null)}
                    style={[styles.parentChoicePill, isDark && styles.parentChoicePillDark, newNotebookParentId === null && styles.parentChoicePillActive]}
                  >
                    <Text style={[styles.parentChoiceText, isDark && styles.mutedTextDark, newNotebookParentId === null && styles.parentChoiceTextActive]}>
                      顶层笔记本
                    </Text>
                  </Pressable>
                  {activeNotebookId !== ALL_NOTES_ID ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: newNotebookParentId === activeNotebookId }}
                      onPress={() => setNewNotebookParentId(activeNotebookId)}
                      style={[styles.parentChoicePill, isDark && styles.parentChoicePillDark, newNotebookParentId === activeNotebookId && styles.parentChoicePillActive]}
                    >
                      <Text numberOfLines={1} style={[styles.parentChoiceText, isDark && styles.mutedTextDark, newNotebookParentId === activeNotebookId && styles.parentChoiceTextActive]}>
                        {translate(`放入「${activeNotebookName}」`)}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {createError ? (
                  <Text accessibilityRole="alert" style={styles.createError}>
                    {createError}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityLabel="确认创建"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !newNotebookName.trim() || isSavingNotebook }}
                  disabled={!newNotebookName.trim() || isSavingNotebook}
                  onPress={() => void submitNewNotebook()}
                  style={[
                    styles.createSubmitButton,
                    (!newNotebookName.trim() || isSavingNotebook) && styles.createSubmitButtonDisabled,
                  ]}
                >
                  {isSavingNotebook ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.createSubmitButtonText}>创建笔记本</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* Notebook Tree Rows */}
            {visibleNotebookOptions.map(({ depth, notebook }: NotebookOption) => {
              const isSelected = activeNotebookId === notebook.id && memoView === "notebook";
              const hasChildren = childNotebookIds.has(notebook.id) && !searchQuery;
              const isCollapsed = collapsedNotebookIds.has(notebook.id);

              return (
                <View
                  key={notebook.id}
                  style={[
                    styles.notebookRow,
                    isSelected && (isDark ? styles.navItemActiveDark : styles.navItemActive),
                    depth > 0 && { paddingLeft: 12 + Math.min(depth * 16, 48) },
                  ]}
                >
                  {hasChildren ? (
                    <Pressable
                      accessibilityLabel={`${isCollapsed ? "展开" : "收起"} ${notebook.name}`}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => toggleNotebookCollapsed(notebook.id)}
                      style={styles.expandChevron}
                    >
                      {isCollapsed ? (
                        <ChevronRight color={palette.inkMuted} size={16} />
                      ) : (
                        <ChevronDown color={palette.inkMuted} size={16} />
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.expandChevronPlaceholder} />
                  )}

                  <Pressable
                    accessibilityLabel={`${isSelected ? "当前" : "切换到"} ${notebook.name}`}
                    accessibilityRole="button"
                    onPress={() => onSelectNotebook(notebook.id)}
                    style={styles.notebookSelectArea}
                  >
                    <Folder
                      color={isSelected ? palette.accent : palette.inkSecondary}
                      size={17}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.notebookName,
                        isDark && styles.textDark,
                        isSelected && [styles.navItemTextActive, isDark && styles.navItemTextActiveDark],
                      ]}
                    >
                      {notebook.name}
                    </Text>
                  </Pressable>

                  {isSelected ? <Check color={palette.accent} size={17} /> : null}
                </View>
              );
            })}

            {visibleNotebookOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Folder color={palette.inkMuted} size={32} />
                <Text style={[styles.emptyText, isDark && styles.mutedTextDark]}>
                  没有匹配的笔记本
                </Text>
              </View>
            ) : null}

            {/* Divider */}
            <View style={[styles.divider, isDark && styles.dividerDark]} />

            {/* Trash Row */}
            <Pressable
              accessibilityLabel={memoView === "trash" ? "当前：回收站" : "切换到回收站"}
              accessibilityRole="button"
              onPress={onSelectTrash}
              style={[
                styles.navItem,
                memoView === "trash" && (isDark ? styles.navItemActiveDark : styles.navItemActive),
              ]}
            >
              <View style={styles.navItemLeft}>
                <Trash2
                  color={memoView === "trash" ? palette.danger : palette.inkSecondary}
                  size={18}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.navItemText,
                    isDark && styles.textDark,
                    memoView === "trash" && { color: palette.danger, fontWeight: "600" },
                  ]}
                >
                  回收站
                </Text>
              </View>
              {memoView === "trash" ? <Check color={palette.danger} size={17} /> : null}
            </Pressable>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  drawer: {
    bottom: 0,
    elevation: 20,
    left: 0,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    top: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitleWrap: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  headerIconWrap: {
    alignItems: "center",
    backgroundColor: "#e9f3ee",
    borderRadius: 9,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerIconWrapDark: {
    backgroundColor: "#1b3128",
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    color: "#1c1b18",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: "#6b665e",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#ebe6db",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  closeButtonDark: {
    backgroundColor: "#2c2a26",
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#f4f1ea",
    borderColor: "#e6e1d6",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  searchBoxDark: {
    backgroundColor: "#151513",
    borderColor: "#2e2c28",
  },
  searchInput: {
    color: "#1c1b18",
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  navItem: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: "#e9f3ee",
  },
  navItemActiveDark: {
    backgroundColor: "#1b3128",
  },
  navItemLeft: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  navItemText: {
    color: "#403c37",
    fontSize: 15,
    fontWeight: "500",
  },
  navItemTextActive: {
    color: "#187958",
    fontWeight: "600",
  },
  navItemTextActiveDark: {
    color: "#43b88c",
  },
  badge: {
    backgroundColor: "#ebe6db",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeDark: {
    backgroundColor: "#2c2a26",
  },
  badgeText: {
    color: "#6b665e",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextDark: {
    color: "#948e84",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: "#8a847a",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionPillText: {
    color: "#187958",
    fontSize: 12,
    fontWeight: "600",
  },
  createToggle: {
    alignItems: "center",
    backgroundColor: "#e9f3ee",
    borderRadius: 14,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  createToggleDark: {
    backgroundColor: "#1b3128",
  },
  createToggleActive: {
    backgroundColor: "#b7d8c9",
  },
  createToggleActiveDark: {
    backgroundColor: "#2c5a48",
  },
  createForm: {
    backgroundColor: "#f4f1ea",
    borderColor: "#e6e1d6",
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    marginVertical: 8,
    padding: 12,
  },
  createFormDark: {
    backgroundColor: "#151513",
    borderColor: "#2e2c28",
  },
  createInput: {
    backgroundColor: "#fdfcf9",
    borderColor: "#d6d0c4",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1c1b18",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  createInputDark: {
    backgroundColor: "#22211e",
    borderColor: "#38352f",
    color: "#eae6df",
  },
  parentChoiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  parentChoicePill: {
    backgroundColor: "#ebe6db",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  parentChoicePillDark: {
    backgroundColor: "#2c2a26",
  },
  parentChoicePillActive: {
    backgroundColor: "#187958",
  },
  parentChoiceText: {
    color: "#57534e",
    fontSize: 12,
    fontWeight: "500",
  },
  parentChoiceTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  createError: {
    color: "#be123c",
    fontSize: 12,
    marginTop: 6,
  },
  createSubmitButton: {
    alignItems: "center",
    backgroundColor: "#187958",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 8,
  },
  createSubmitButtonDisabled: {
    opacity: 0.5,
  },
  createSubmitButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  notebookRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1,
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  expandChevron: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 24,
  },
  expandChevronPlaceholder: {
    width: 24,
  },
  notebookSelectArea: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
  },
  notebookName: {
    color: "#403c37",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#8a847a",
    fontSize: 13,
    marginTop: 8,
  },
  divider: {
    backgroundColor: "#e6e1d6",
    height: 1,
    marginHorizontal: 6,
    marginVertical: 12,
  },
  dividerDark: {
    backgroundColor: "#2e2c28",
  },
  textDark: {
    color: "#eae6df",
  },
  mutedTextDark: {
    color: "#948e84",
  },
});
