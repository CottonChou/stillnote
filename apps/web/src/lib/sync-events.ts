import type { MemoDetail } from "@stillnote/shared";

export const SYNC_QUEUE_CHANGED_EVENT = "stillnote:sync-queue-changed";
export const SYNC_QUEUE_DEFERRED_EVENT = "stillnote:sync-queue-deferred";
export const MEMO_ID_REMAPPED_EVENT = "stillnote:memo-id-remapped";
export const NOTEBOOK_ID_REMAPPED_EVENT = "stillnote:notebook-id-remapped";
export const MEMO_SYNC_ACKNOWLEDGED_EVENT = "stillnote:memo-sync-acknowledged";

export const notifySyncQueueChanged = () => {
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGED_EVENT));
};

export const notifySyncQueueDeferred = () => {
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_DEFERRED_EVENT));
};

export const notifyMemoIdRemapped = (memoIdMappings: ReadonlyMap<string, string>) => {
  if (memoIdMappings.size === 0) return;
  window.dispatchEvent(new CustomEvent(MEMO_ID_REMAPPED_EVENT, { detail: memoIdMappings }));
};

export const notifyNotebookIdRemapped = (temporaryId: string, remoteId: string) => {
  if (temporaryId === remoteId) return;
  window.dispatchEvent(new CustomEvent(NOTEBOOK_ID_REMAPPED_EVENT, { detail: { temporaryId, remoteId } }));
};

export const notifyMemoSyncAcknowledged = (memo: MemoDetail) => {
  window.dispatchEvent(new CustomEvent(MEMO_SYNC_ACKNOWLEDGED_EVENT, { detail: memo }));
};
