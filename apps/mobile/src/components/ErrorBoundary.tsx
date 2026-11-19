import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AlertTriangle, ChevronDown, ChevronUp, Folder, RotateCcw } from "./icons";
import { getMobileEditorialPalette } from "../lib/mobile-theme-colors";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onReset?: () => void;
  resetButtonLabel?: string;
  title?: string;
  description?: string;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error for debugging while preventing total white screen crash
    console.error("[StillNote ErrorBoundary]", error, errorInfo?.componentStack);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  override render() {
    const { error, errorInfo, showDetails } = this.state;
    const { children, fallback, resetButtonLabel, title, description } = this.props;

    if (!error) {
      return children;
    }

    if (fallback) {
      return fallback(error, this.reset);
    }

    const palette = getMobileEditorialPalette("light");

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle color="#b45309" size={24} />
            </View>

            <Text style={styles.title}>{title ?? "页面遇到问题"}</Text>
            <Text style={styles.description}>
              {description ??
                "应用遇到未预期的渲染错误。您的笔记和数据已安全保存在本地。"}
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                accessibilityLabel={resetButtonLabel ?? "返回全部笔记"}
                accessibilityRole="button"
                onPress={this.reset}
                style={styles.primaryButton}
              >
                <Folder color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>
                  {resetButtonLabel ?? "返回全部笔记"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="重试"
                accessibilityRole="button"
                onPress={this.reset}
                style={styles.secondaryButton}
              >
                <RotateCcw color={palette.ink} size={15} style={{ marginRight: 5 }} />
                <Text style={styles.secondaryButtonText}>重试</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel={showDetails ? "收起错误详情" : "查看错误详情"}
              accessibilityRole="button"
              onPress={this.toggleDetails}
              style={styles.toggleDetailsButton}
            >
              <Text style={styles.toggleDetailsText}>
                {showDetails ? "收起错误详情" : "查看错误详情"}
              </Text>
              {showDetails ? (
                <ChevronUp color={palette.inkMuted} size={14} />
              ) : (
                <ChevronDown color={palette.inkMuted} size={14} />
              )}
            </Pressable>

            {showDetails ? (
              <ScrollView
                horizontal={false}
                nestedScrollEnabled
                style={styles.detailsContainer}
              >
                <Text style={styles.detailsText} selectable>
                  {error.name}: {error.message}
                  {"\n\n"}
                  {error.stack}
                  {errorInfo?.componentStack ? `\n\nComponent Stack:${errorInfo.componentStack}` : ""}
                </Text>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f9f7f2",
    flex: 1,
  },
  container: {
    alignItems: "center",
    backgroundColor: "#f9f7f2",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#fdfcf9",
    borderColor: "#e6e1d6",
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 420,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    width: "100%",
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    marginBottom: 16,
    width: 48,
  },
  title: {
    color: "#1c1b18",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    color: "#6b665e",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 16,
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#187958",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f3ede4",
    borderColor: "#ded8cc",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#1c1b18",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleDetailsButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 6,
  },
  toggleDetailsText: {
    color: "#8a847a",
    fontSize: 13,
  },
  detailsContainer: {
    backgroundColor: "#f4f1ea",
    borderColor: "#e4dfd5",
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 180,
    marginTop: 12,
    padding: 10,
    width: "100%",
  },
  detailsText: {
    color: "#544f47",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
  },
});
