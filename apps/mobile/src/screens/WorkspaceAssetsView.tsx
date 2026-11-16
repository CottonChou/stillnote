import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formatBytes,
  resolveAttachmentKind,
  type ResourceListItem,
  type ResourceStorageSummary,
} from "@stillnote/shared";
import {
  BookOpen,
  ChevronLeft,
  Download,
  ExternalLink,
  Eye,
  Grid,
  HardDrive,
  List,
  MoreVertical,
  Paperclip,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  X,
} from "../components/icons";
import { AttachmentFileIcon } from "../components/AttachmentFileIcon";
import { ZoomableImagePreview } from "../components/ZoomableImagePreview";
import {
  openMobileResource,
  saveMobileResourceAs,
  MobileResourceCancelledError,
  type MobileResourceTarget,
} from "../lib/mobile-attachments";
import {
  isProtectedResourceSource,
  loadProtectedResourceDataUrl,
  type ProtectedResourceLoadFailure,
} from "../lib/mobile-protected-resources";
import { useMobileLocale } from "../lib/mobile-locale";
import { useMobileTheme } from "../lib/mobile-theme";
import { getMobileEditorialPalette } from "../lib/mobile-theme-colors";
import {
  readMobileAssetsLayoutMode,
  writeMobileAssetsLayoutMode,
  type MobileAssetsLayoutMode,
} from "../lib/preferences";
import { useSession } from "../lib/session";
import { AuthenticatedResourceImage } from "./WorkspaceMemoDetail";
import {
  calculateAssetCategoryCounts,
  filterAssetResources,
  type AssetFilterType,
} from "./workspace-utils";

export interface WorkspaceAssetsViewProps {
  onClose: () => void;
  onSelectMemo?: (memoId: string) => void;
}

export const WorkspaceAssetsView = ({ onClose, onSelectMemo }: WorkspaceAssetsViewProps) => {
  const { translate, resolvedLocale } = useMobileLocale();
  const { resolvedTheme } = useMobileTheme();
  const isDark = resolvedTheme === "dark";
  const palette = getMobileEditorialPalette(resolvedTheme);
  const insets = useSafeAreaInsets();
  const { client, session } = useSession();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<AssetFilterType>("all");
  const [layoutMode, setLayoutMode] = useState<MobileAssetsLayoutMode>("grid");
  const [selectedResource, setSelectedResource] = useState<ResourceListItem | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [renameTarget, setRenameTarget] = useState<ResourceListItem | null>(null);
  const [renameText, setRenameText] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Load layout mode preference
  useEffect(() => {
    void readMobileAssetsLayoutMode().then(setLayoutMode);
  }, []);

  const handleLayoutModeChange = (mode: MobileAssetsLayoutMode) => {
    setLayoutMode(mode);
    void writeMobileAssetsLayoutMode(mode);
  };

  // Fetch resources from server
  const resourcesQuery = useQuery({
    queryKey: ["mobile", "resources", session?.baseUrl],
    queryFn: async () => {
      if (!client) throw new Error("未登录");
      return await client.listResources();
    },
    enabled: Boolean(client),
    staleTime: 30_000,
  });

  const resources = useMemo(
    () => resourcesQuery.data?.resources ?? [],
    [resourcesQuery.data?.resources]
  );

  const summary: ResourceStorageSummary = useMemo(
    () =>
      resourcesQuery.data?.summary ?? {
        totalCount: resources.length,
        totalBytes: resources.reduce((acc, r) => acc + (r.byteSize || 0), 0),
        imageCount: resources.filter((r) => r.kind === "image").length,
        attachmentCount: resources.filter((r) => r.kind !== "image").length,
      },
    [resourcesQuery.data?.summary, resources]
  );

  // Count items per category for tab badges
  const categoryCounts = useMemo(
    () => calculateAssetCategoryCounts(resources),
    [resources]
  );

  // Filtered and searched resources
  const filteredResources = useMemo(
    () => filterAssetResources(resources, filterType, searchQuery),
    [resources, filterType, searchQuery]
  );

  // Image list for fullscreen zoomable viewer
  const imageResources = useMemo(
    () => filteredResources.filter((r) => r.kind === "image"),
    [filteredResources]
  );

  const previewImages = useMemo(
    () => imageResources.map((r) => ({ alt: r.filename || "", source: r.url })),
    [imageResources]
  );

  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (fullscreenImageIndex !== null) {
        setFullscreenImageIndex(null);
        return true;
      }
      if (renameTarget !== null) {
        setRenameTarget(null);
        return true;
      }
      if (selectedResource !== null) {
        setSelectedResource(null);
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [fullscreenImageIndex, renameTarget, selectedResource, onClose]);

  const resourceToTarget = useCallback(
    (resource: ResourceListItem): MobileResourceTarget => ({
      filename: resource.filename || (resource.kind === "image" ? `image-${resource.id}` : resource.id),
      href: resource.url,
      kind: resource.kind === "image" ? "image" : "attachment",
      resourceId: resource.id,
    }),
    []
  );

  const handleOpenResource = async (resource: ResourceListItem) => {
    if (resource.kind === "image") {
      const idx = imageResources.findIndex((r) => r.id === resource.id);
      if (idx !== -1) {
        setFullscreenImageIndex(idx);
      }
      return;
    }

    if (!client) return;
    setActionBusy(true);
    try {
      await openMobileResource(client, resourceToTarget(resource), {
        baseUrl: session?.baseUrl ?? "",
        token: session?.token ?? undefined,
      });
    } catch (error) {
      if (!(error instanceof MobileResourceCancelledError)) {
        Alert.alert(translate("打开失败"), error instanceof Error ? error.message : translate("请重试"));
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleShareResource = async (resource: ResourceListItem) => {
    if (!client) return;
    setActionBusy(true);
    try {
      await openMobileResource(client, resourceToTarget(resource), {
        baseUrl: session?.baseUrl ?? "",
        token: session?.token ?? undefined,
      });
    } catch (error) {
      if (!(error instanceof MobileResourceCancelledError)) {
        Alert.alert(translate("分享失败"), error instanceof Error ? error.message : translate("请重试"));
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveResource = async (resource: ResourceListItem) => {
    if (!client) return;
    setActionBusy(true);
    try {
      const result = await saveMobileResourceAs(client, resourceToTarget(resource), {
        baseUrl: session?.baseUrl ?? "",
        token: session?.token ?? undefined,
      });
      if (result.kind === "saf") {
        Alert.alert(translate("下载完成"), translate(`已保存到设备：${result.filename}`));
      }
    } catch (error) {
      if (!(error instanceof MobileResourceCancelledError)) {
        Alert.alert(translate("下载失败"), error instanceof Error ? error.message : translate("请重试"));
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteResource = (resource: ResourceListItem) => {
    Alert.alert(
      translate("删除附件"),
      translate("附件将从存储空间中永久删除，笔记中的相关链接可能无法再打开。此操作无法撤销。"),
      [
        { text: translate("取消"), style: "cancel" },
        {
          text: translate("删除"),
          style: "destructive",
          onPress: async () => {
            if (!client) return;
            setActionBusy(true);
            try {
              await client.deleteResource(resource.id);
              setSelectedResource(null);
              await queryClient.invalidateQueries({ queryKey: ["mobile", "resources"] });
            } catch (error) {
              Alert.alert(translate("删除失败"), error instanceof Error ? error.message : translate("请重试"));
            } finally {
              setActionBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleStartRename = (resource: ResourceListItem) => {
    setRenameTarget(resource);
    setRenameText(resource.filename || "");
    setSelectedResource(null);
  };

  const handleConfirmRename = async () => {
    if (!client || !renameTarget || !renameText.trim()) return;
    setIsRenaming(true);
    try {
      await client.renameResource(renameTarget.id, renameText.trim());
      setRenameTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["mobile", "resources"] });
    } catch (error) {
      Alert.alert(translate("重命名失败"), error instanceof Error ? error.message : translate("请重试"));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleJumpToNote = (memoId: string) => {
    setSelectedResource(null);
    onSelectMemo?.(memoId);
  };

  const numColumns = layoutMode === "grid" ? 2 : 1;
  const screenWidth = Dimensions.get("window").width;
  const gridCardWidth = (screenWidth - 32 - 12) / 2;

  const renderGridItem = ({ item }: { item: ResourceListItem }) => {
    const isImage = item.kind === "image";
    const extension = (item.filename || "").split(".").pop()?.toUpperCase() || (isImage ? "IMG" : "FILE");
    const sourceNoteTitle = item.memoDeleted
      ? translate("已删除笔记")
      : item.memoTitle || item.memoExcerpt || translate("未命名笔记");

    return (
      <View style={[styles.gridCard, { width: gridCardWidth, backgroundColor: palette.paper, borderColor: palette.divider }]}>
        {/* Preview Container */}
        <Pressable
          accessibilityLabel={item.filename || item.id}
          accessibilityRole="button"
          onLongPress={() => setSelectedResource(item)}
          onPress={() => void handleOpenResource(item)}
          style={[styles.gridPreviewArea, { backgroundColor: isDark ? "#1a211e" : "#f1f5f3" }]}
        >
          {isImage ? (
            <AuthenticatedResourceImage
              alt={item.filename || ""}
              href={item.url}
              resizeMode="cover"
              session={session}
              style={styles.gridImage}
            />
          ) : (
            <View style={styles.gridFileIconWrap}>
              <AttachmentFileIcon filename={item.filename} mimeType={item.mimeType} size={36} />
              <View style={[styles.gridBadge, { backgroundColor: isDark ? "#28342f" : "#e2e8e5" }]}>
                <Text style={[styles.gridBadgeText, { color: palette.inkSecondary }]}>{extension}</Text>
              </View>
            </View>
          )}

          {/* More actions overlay icon */}
          <Pressable
            accessibilityLabel="更多操作"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSelectedResource(item)}
            style={[styles.gridMoreButton, { backgroundColor: isDark ? "rgba(20,26,23,0.85)" : "rgba(255,255,255,0.9)" }]}
          >
            <MoreVertical color={palette.inkSecondary} size={15} />
          </Pressable>
        </Pressable>

        {/* Info Area */}
        <View style={styles.gridInfoArea}>
          <Text numberOfLines={1} style={[styles.gridTitle, { color: palette.ink }]}>
            {item.filename || item.id}
          </Text>
          <View style={styles.gridMetaRow}>
            <Text style={[styles.gridMetaText, { color: palette.inkPlaceholder }]}>
              {formatBytes(item.byteSize)}
            </Text>
            <Text style={[styles.gridMetaText, { color: palette.inkPlaceholder }]}>
              {(item.mimeType?.split("/")[1] || item.kind).toUpperCase()}
            </Text>
          </View>

          {/* Source Note Link */}
          {item.memoId ? (
            <Pressable
              accessibilityLabel={`查看来源笔记：${sourceNoteTitle}`}
              accessibilityRole="button"
              disabled={item.memoDeleted}
              onPress={() => handleJumpToNote(item.memoId)}
              style={[styles.gridSourcePill, item.memoDeleted && { opacity: 0.5 }]}
            >
              <Text numberOfLines={1} style={[styles.gridSourceText, { color: palette.accent }]}>
                📄 {sourceNoteTitle}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: ResourceListItem }) => {
    const isImage = item.kind === "image";
    const sourceNoteTitle = item.memoDeleted
      ? translate("已删除笔记")
      : item.memoTitle || item.memoExcerpt || translate("未命名笔记");

    return (
      <Pressable
        accessibilityLabel={item.filename || item.id}
        accessibilityRole="button"
        onLongPress={() => setSelectedResource(item)}
        onPress={() => void handleOpenResource(item)}
        style={[styles.listCard, { backgroundColor: palette.paper, borderColor: palette.divider }]}
      >
        {/* Left Thumbnail / Icon */}
        <View style={[styles.listThumbWrap, { backgroundColor: isDark ? "#1a211e" : "#f1f5f3" }]}>
          {isImage ? (
            <AuthenticatedResourceImage
              alt={item.filename || ""}
              href={item.url}
              resizeMode="cover"
              session={session}
              style={styles.listImage}
            />
          ) : (
            <AttachmentFileIcon filename={item.filename} mimeType={item.mimeType} size={28} />
          )}
        </View>

        {/* Center Info */}
        <View style={styles.listCenterArea}>
          <Text numberOfLines={1} style={[styles.listTitle, { color: palette.ink }]}>
            {item.filename || item.id}
          </Text>
          <View style={styles.listMetaRow}>
            <Text style={[styles.listMetaText, { color: palette.inkPlaceholder }]}>
              {formatBytes(item.byteSize)}
            </Text>
            <Text style={[styles.listMetaDot, { color: palette.inkPlaceholder }]}>•</Text>
            <Text style={[styles.listMetaText, { color: palette.inkPlaceholder }]}>
              {(item.mimeType?.split("/")[1] || item.kind).toUpperCase()}
            </Text>
          </View>

          {item.memoId ? (
            <Pressable
              accessibilityLabel={`查看来源笔记：${sourceNoteTitle}`}
              accessibilityRole="button"
              disabled={item.memoDeleted}
              onPress={() => handleJumpToNote(item.memoId)}
              style={item.memoDeleted ? { opacity: 0.5 } : null}
            >
              <Text numberOfLines={1} style={[styles.listSourceText, { color: palette.accent }]}>
                📄 {sourceNoteTitle}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Right More Action */}
        <Pressable
          accessibilityLabel="更多选项"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setSelectedResource(item)}
          style={styles.listMoreButton}
        >
          <MoreVertical color={palette.inkSecondary} size={18} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: palette.divider }]}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel={translate("返回")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={[styles.backButton, { backgroundColor: isDark ? "#1d2622" : "#edf2ef" }]}
          >
            <ChevronLeft color={palette.ink} size={20} />
          </Pressable>
          <View style={styles.headerTitles}>
            <View style={styles.headerTitleRow}>
              <Paperclip color={palette.accent} size={18} />
              <Text style={[styles.headerTitleText, { color: palette.ink }]}>{translate("附件管理")}</Text>
            </View>
            <View style={styles.headerStatsRow}>
              <HardDrive color={palette.inkPlaceholder} size={12} />
              <Text style={[styles.headerStatsText, { color: palette.inkSecondary }]}>
                {formatBytes(summary.totalBytes)} • {summary.totalCount} {translate("文件")} • {summary.imageCount} {translate("图片")}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityLabel={translate("刷新附件列表")}
          accessibilityRole="button"
          disabled={resourcesQuery.isRefetching}
          hitSlop={8}
          onPress={() => void resourcesQuery.refetch()}
          style={[styles.refreshButton, { backgroundColor: isDark ? "#1d2622" : "#edf2ef" }]}
        >
          {resourcesQuery.isRefetching ? (
            <ActivityIndicator color={palette.accent} size="small" />
          ) : (
            <RefreshCw color={palette.ink} size={17} />
          )}
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, { borderBottomColor: palette.divider, backgroundColor: palette.paper }]}>
        <View style={[styles.searchInputWrap, { backgroundColor: isDark ? "#171e1b" : "#f1f5f3", borderColor: palette.divider }]}>
          <Search color={palette.inkPlaceholder} size={16} />
          <TextInput
            accessibilityLabel={translate("搜索附件名或来源笔记...")}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            onChangeText={setSearchQuery}
            placeholder={translate("搜索附件名或来源笔记...")}
            placeholderTextColor={palette.inkPlaceholder}
            returnKeyType="search"
            style={[styles.searchInput, { color: palette.ink }]}
            value={searchQuery}
          />
          {searchQuery ? (
            <Pressable
              accessibilityLabel={translate("清除搜索")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setSearchQuery("")}
            >
              <X color={palette.inkPlaceholder} size={15} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs & Layout Switcher */}
      <View style={[styles.toolbar, { borderBottomColor: palette.divider }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { id: "all", label: "全部", count: categoryCounts.all },
              { id: "image", label: "图片", count: categoryCounts.image },
              { id: "document", label: "文档", count: categoryCounts.document },
              { id: "other", label: "其他", count: categoryCounts.other },
            ] as const
          ).map((tab) => {
            const active = filterType === tab.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={tab.id}
                onPress={() => setFilterType(tab.id)}
                style={[
                  styles.filterPill,
                  active
                    ? { backgroundColor: palette.accentSoft, borderColor: palette.accent }
                    : { backgroundColor: palette.paper, borderColor: palette.divider },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active ? { color: palette.accent, fontWeight: "600" } : { color: palette.inkSecondary },
                  ]}
                >
                  {translate(tab.label)} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* View Layout Toggle (Grid vs List) */}
        <View style={[styles.layoutToggleWrap, { backgroundColor: isDark ? "#171e1b" : "#f1f5f3", borderColor: palette.divider }]}>
          <Pressable
            accessibilityLabel={translate("网格视图")}
            accessibilityRole="button"
            onPress={() => handleLayoutModeChange("grid")}
            style={[
              styles.layoutToggleBtn,
              layoutMode === "grid" && [styles.layoutToggleBtnActive, { backgroundColor: palette.paper }],
            ]}
          >
            <Grid color={layoutMode === "grid" ? palette.accent : palette.inkPlaceholder} size={16} />
          </Pressable>
          <Pressable
            accessibilityLabel={translate("列表视图")}
            accessibilityRole="button"
            onPress={() => handleLayoutModeChange("list")}
            style={[
              styles.layoutToggleBtn,
              layoutMode === "list" && [styles.layoutToggleBtnActive, { backgroundColor: palette.paper }],
            ]}
          >
            <List color={layoutMode === "list" ? palette.accent : palette.inkPlaceholder} size={16} />
          </Pressable>
        </View>
      </View>

      {/* Main List Area */}
      {resourcesQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={[styles.loadingText, { color: palette.inkSecondary }]}>
            {translate("正在加载附件列表...")}
          </Text>
        </View>
      ) : filteredResources.length === 0 ? (
        <View style={styles.centerContainer}>
          <Paperclip color={palette.inkPlaceholder} size={42} style={{ marginBottom: 12, opacity: 0.6 }} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            {searchQuery || filterType !== "all" ? translate("未找到匹配附件") : translate("暂无附件")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.inkPlaceholder }]}>
            {searchQuery || filterType !== "all"
              ? translate("请尝试更改搜索词或分类过滤器")
              : translate("在笔记中添加的图片和附件会显示在这里")}
          </Text>
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={layoutMode === "grid" ? styles.gridColumnWrapper : undefined}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(32, insets.bottom + 16) }]}
          data={filteredResources}
          key={layoutMode === "grid" ? "grid-2" : "list-1"}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          refreshControl={
            <RefreshControl
              colors={[palette.accent]}
              onRefresh={() => void resourcesQuery.refetch()}
              refreshing={resourcesQuery.isRefetching}
              tintColor={palette.accent}
            />
          }
          renderItem={layoutMode === "grid" ? renderGridItem : renderListItem}
        />
      )}

      {/* Fullscreen Zoomable Image Lightbox */}
      {fullscreenImageIndex !== null && imageResources.length > 0 ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setFullscreenImageIndex(null)}
          statusBarTranslucent
          transparent
          visible={fullscreenImageIndex !== null}
        >
          <View style={styles.lightboxBackdrop}>
            {/* Top Close Button & Counter */}
            <View style={[styles.lightboxHeader, { paddingTop: Math.max(16, insets.top) }]}>
              <Pressable
                accessibilityLabel={translate("关闭大图预览")}
                accessibilityRole="button"
                onPress={() => setFullscreenImageIndex(null)}
                style={styles.lightboxCloseBtn}
              >
                <X color="#ffffff" size={20} />
              </Pressable>
              <Text style={styles.lightboxCounter}>
                {fullscreenImageIndex + 1} / {imageResources.length}
              </Text>
              <Pressable
                accessibilityLabel={translate("图片选项")}
                accessibilityRole="button"
                onPress={() => {
                  const target = imageResources[fullscreenImageIndex];
                  if (target) setSelectedResource(target);
                }}
                style={styles.lightboxCloseBtn}
              >
                <MoreVertical color="#ffffff" size={20} />
              </Pressable>
            </View>

            <ZoomableImagePreview
              accessibilityHint={translate("双击放大或双指捏合缩放图片")}
              accessibilityLabel={imageResources[fullscreenImageIndex]?.filename || translate("大图预览")}
              currentIndex={fullscreenImageIndex}
              images={previewImages}
              noteTitle={imageResources[fullscreenImageIndex]?.memoTitle}
              onIndexChange={setFullscreenImageIndex}
              onLongPress={() => {
                const target = imageResources[fullscreenImageIndex];
                if (target) setSelectedResource(target);
              }}
              renderImage={() => {
                const active = imageResources[fullscreenImageIndex];
                return (
                  <AuthenticatedResourceImage
                    alt={active?.filename || ""}
                    href={active?.url || ""}
                    resizeMode="contain"
                    session={session}
                    style={styles.lightboxImage}
                  />
                );
              }}
              showNavigationArrows
            />
          </View>
        </Modal>
      ) : null}

      {/* Resource Actions Bottom Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedResource(null)}
        transparent
        visible={Boolean(selectedResource)}
      >
        <Pressable onPress={() => setSelectedResource(null)} style={styles.actionSheetBackdrop}>
          <Pressable style={[styles.actionSheetCard, { backgroundColor: palette.paper, paddingBottom: Math.max(24, insets.bottom) }]}>
            <View style={styles.actionSheetHandle} />

            {selectedResource ? (
              <>
                {/* Header with Icon, Name & Size */}
                <View style={[styles.actionSheetHeader, { borderBottomColor: palette.divider }]}>
                  <View style={[styles.actionSheetIconWrap, { backgroundColor: isDark ? "#171e1b" : "#f1f5f3" }]}>
                    <AttachmentFileIcon filename={selectedResource.filename} mimeType={selectedResource.mimeType} size={30} />
                  </View>
                  <View style={styles.actionSheetHeaderText}>
                    <Text numberOfLines={1} style={[styles.actionSheetTitle, { color: palette.ink }]}>
                      {selectedResource.filename || selectedResource.id}
                    </Text>
                    <Text style={[styles.actionSheetSubtitle, { color: palette.inkPlaceholder }]}>
                      {formatBytes(selectedResource.byteSize)} • {(selectedResource.mimeType?.split("/")[1] || selectedResource.kind).toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={translate("关闭")}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setSelectedResource(null)}
                    style={styles.sheetCloseBtn}
                  >
                    <X color={palette.inkSecondary} size={18} />
                  </Pressable>
                </View>

                {/* Action Items */}
                <View style={styles.actionSheetBody}>
                  {/* Preview / Open */}
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionBusy}
                    onPress={() => {
                      const res = selectedResource;
                      setSelectedResource(null);
                      void handleOpenResource(res);
                    }}
                    style={styles.actionSheetRow}
                  >
                    <Eye color={palette.ink} size={18} />
                    <Text style={[styles.actionSheetRowText, { color: palette.ink }]}>
                      {selectedResource.kind === "image" ? translate("查看大图") : translate("打开文件")}
                    </Text>
                  </Pressable>

                  {/* Jump to Note */}
                  {selectedResource.memoId && !selectedResource.memoDeleted ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={actionBusy}
                      onPress={() => handleJumpToNote(selectedResource.memoId)}
                      style={styles.actionSheetRow}
                    >
                      <BookOpen color={palette.accent} size={18} />
                      <Text style={[styles.actionSheetRowText, { color: palette.accent }]}>
                        {translate("定位到所属笔记")}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Share File */}
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionBusy}
                    onPress={() => {
                      const res = selectedResource;
                      setSelectedResource(null);
                      void handleShareResource(res);
                    }}
                    style={styles.actionSheetRow}
                  >
                    <Share2 color={palette.ink} size={18} />
                    <Text style={[styles.actionSheetRowText, { color: palette.ink }]}>{translate("分享")}</Text>
                  </Pressable>

                  {/* Save to Device */}
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionBusy}
                    onPress={() => {
                      const res = selectedResource;
                      setSelectedResource(null);
                      void handleSaveResource(res);
                    }}
                    style={styles.actionSheetRow}
                  >
                    <Download color={palette.ink} size={18} />
                    <Text style={[styles.actionSheetRowText, { color: palette.ink }]}>{translate("保存到设备")}</Text>
                  </Pressable>

                  {/* Rename File */}
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionBusy}
                    onPress={() => handleStartRename(selectedResource)}
                    style={styles.actionSheetRow}
                  >
                    <Pencil color={palette.ink} size={18} />
                    <Text style={[styles.actionSheetRowText, { color: palette.ink }]}>{translate("重命名")}</Text>
                  </Pressable>

                  {/* Delete File */}
                  <Pressable
                    accessibilityRole="button"
                    disabled={actionBusy}
                    onPress={() => {
                      const res = selectedResource;
                      setSelectedResource(null);
                      handleDeleteResource(res);
                    }}
                    style={styles.actionSheetRow}
                  >
                    <Trash2 color={palette.danger} size={18} />
                    <Text style={[styles.actionSheetRowText, { color: palette.danger }]}>{translate("删除附件")}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename Dialog Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
        transparent
        visible={Boolean(renameTarget)}
      >
        <Pressable onPress={() => setRenameTarget(null)} style={styles.renameBackdrop}>
          <Pressable style={[styles.renameDialog, { backgroundColor: palette.paper, borderColor: palette.divider }]}>
            <Text style={[styles.renameDialogTitle, { color: palette.ink }]}>{translate("重命名附件")}</Text>
            <TextInput
              accessibilityLabel={translate("文件名")}
              autoFocus
              onChangeText={setRenameText}
              returnKeyType="done"
              style={[styles.renameInput, { backgroundColor: isDark ? "#171e1b" : "#f1f5f3", color: palette.ink, borderColor: palette.divider }]}
              value={renameText}
            />
            <View style={styles.renameDialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRenameTarget(null)}
                style={[styles.renameCancelBtn, { borderColor: palette.divider }]}
              >
                <Text style={[styles.renameCancelText, { color: palette.inkSecondary }]}>{translate("取消")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isRenaming || !renameText.trim()}
                onPress={() => void handleConfirmRename()}
                style={[styles.renameConfirmBtn, { backgroundColor: palette.accent }]}
              >
                {isRenaming ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.renameConfirmText}>{translate("保存")}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerStatsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  headerStatsText: {
    fontSize: 11,
    fontWeight: "500",
  },
  refreshButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  searchBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputWrap: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    height: 36,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  toolbar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterScroll: {
    flex: 1,
    marginRight: 8,
  },
  filterPill: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterPillText: {
    fontSize: 12,
  },
  layoutToggleWrap: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    padding: 2,
  },
  layoutToggleBtn: {
    alignItems: "center",
    borderRadius: 6,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  layoutToggleBtnActive: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  listContent: {
    padding: 16,
  },
  gridColumnWrapper: {
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  gridCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  gridPreviewArea: {
    alignItems: "center",
    aspectRatio: 1,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  gridImage: {
    height: "100%",
    width: "100%",
  },
  gridFileIconWrap: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  gridBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  gridMoreButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 26,
    zIndex: 2,
  },
  gridInfoArea: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  gridMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  gridMetaText: {
    fontSize: 10,
    fontWeight: "500",
  },
  gridSourcePill: {
    marginTop: 6,
  },
  gridSourceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  listCard: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    marginBottom: 8,
    padding: 10,
  },
  listThumbWrap: {
    alignItems: "center",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    overflow: "hidden",
    width: 50,
  },
  listImage: {
    height: "100%",
    width: "100%",
  },
  listCenterArea: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  listMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 3,
  },
  listMetaText: {
    fontSize: 11,
  },
  listMetaDot: {
    marginHorizontal: 4,
  },
  listSourceText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },
  listMoreButton: {
    padding: 6,
  },
  centerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  lightboxBackdrop: {
    backgroundColor: "rgba(0,0,0,0.95)",
    flex: 1,
  },
  lightboxHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  lightboxCloseBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  lightboxCounter: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  lightboxImage: {
    height: "100%",
    width: "100%",
  },
  actionSheetBackdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  actionSheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionSheetHandle: {
    alignSelf: "center",
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    width: 36,
  },
  actionSheetHeader: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionSheetIconWrap: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  actionSheetHeaderText: {
    flex: 1,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionSheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  actionSheetBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionSheetRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  actionSheetRowText: {
    fontSize: 15,
    fontWeight: "500",
  },
  renameBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  renameDialog: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    width: "100%",
  },
  renameDialogTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  renameInput: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    height: 40,
    paddingHorizontal: 12,
  },
  renameDialogActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 18,
  },
  renameCancelBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  renameCancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  renameConfirmBtn: {
    borderRadius: 8,
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  renameConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
