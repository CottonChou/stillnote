import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("memo context menu", () => {
  test("uses a Radix submenu for notebook moves so opening the picker does not close the menu", () => {
    const source = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");

    expect(source).toContain("<DropdownMenuSub>");
    expect(source).toContain("<DropdownMenuSubTrigger");
    expect(source).toContain("<DropdownMenuSubContent");
    expect(source).not.toContain("contextMoveOpen");
  });

  test("opens the card menu without a modal scroll lock so the list does not hitch", () => {
    const source = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");

    expect(source).toContain("<DropdownMenu modal={false} open={true}");
    expect(source).toContain("data-[state=open]:animate-none");
    expect(source).toContain("onCloseAutoFocus={(event) => event.preventDefault()}");
  });
});

describe("desktop memo list spacing", () => {
  test("reserves matching desktop scrollbar gutters on both sides", () => {
    const source = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");

    expect(source).toContain("lg:px-2 lg:py-2 lg:pb-3 lg:[scrollbar-gutter:stable_both-edges]");
  });
});

describe("memo list windowing", () => {
  test("renders only virtualized memo cards instead of mapping the whole loaded list", () => {
    const source = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");

    expect(source).toContain("useVirtualizer");
    expect(source).toContain("memoListVirtualizer.getVirtualItems()");
    expect(source).toContain("memoListVirtualizer.measureElement");
    expect(source).not.toContain("{memos.map((memo) => (");
  });
});

describe("empty memo list creation", () => {
  test("does not forward the React click event as a memo kind", () => {
    const source = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");

    expect(source).toContain('onClick={() => onCreateMemo()} disabled={isCreating}');
    expect(source).not.toContain('onClick={onCreateMemo} disabled={isCreating}');
  });
});

describe("desktop bulk move", () => {
  test("keeps a user-chosen notebook instead of snapping back to the current notebook", () => {
    const memoListSource = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");
    const workspaceSource = readFileSync(new URL("./WorkspaceApp.tsx", import.meta.url), "utf8");

    expect(memoListSource).toContain("resolveSelectionMoveTargetNotebookId");
    expect(memoListSource).toContain("disabled={selectedCount === 0 || !moveTargetNotebookId || isMoving || isTrashView || !canMove}");
    expect(workspaceSource).toContain("resolveSelectionMoveTargetNotebookId");
    expect(workspaceSource).toContain("canMove={canMoveSelectedMemos}");
    expect(workspaceSource).not.toContain("setSelectionMoveTargetNotebookId(selectedNotebook.id)");
    expect(memoListSource).not.toContain("setMoveTargetNotebookId(notebook.id)");
  });
});

describe("desktop memo list collapse and expand", () => {
  test("provides collapse control in the memo list header and expand triggers across editor headers", () => {
    const memoListSource = readFileSync(new URL("./MemoListPane.tsx", import.meta.url), "utf8");
    const workspaceSource = readFileSync(new URL("./WorkspaceApp.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
    const leadingSource = readFileSync(new URL("./MemoEditorTopRowLeading.tsx", import.meta.url), "utf8");
    const chromeSource = readFileSync(new URL("./editor/EditorPaneChrome.tsx", import.meta.url), "utf8");
    const tableSource = readFileSync(new URL("./TableEditorPane.tsx", import.meta.url), "utf8");
    const editorSource = readFileSync(new URL("./EditorPane.tsx", import.meta.url), "utf8");
    const contextSource = readFileSync(new URL("./WorkspaceMemoListContext.tsx", import.meta.url), "utf8");

    expect(memoListSource).toContain('aria-label={t("memoList.collapseList")}');
    expect(memoListSource).toContain("<ChevronsLeft");
    expect(memoListSource).toContain("TooltipContent");
    expect(workspaceSource).toContain("desktopMemoListCollapsed");
    expect(workspaceSource).toContain("stillnote-workspace-grid--memo-list-collapsed");
    expect(workspaceSource).toContain("WorkspaceMemoListContext.Provider");
    expect(workspaceSource).toContain("collapsed={desktopMemoListCollapsed}");
    expect(css).toContain(".stillnote-workspace-grid--memo-list-collapsed");
    expect(leadingSource).toContain("<MemoListExpandButton");
    expect(chromeSource).toContain("<MemoListExpandButton");
    expect(tableSource).toContain("<MemoListExpandButton");
    expect(editorSource).toContain("<EmptyMemoListRestoreAction");
    expect(contextSource).toContain('t("memoList.expandList")');
    expect(contextSource).toContain("<TooltipContent");
  });
});
