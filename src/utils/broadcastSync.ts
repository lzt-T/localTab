// 跨标签页与弹窗间同步数据的频道名称
const WORKSPACE_SYNC_CHANNEL = "localtab-sync";

// 跨上下文需要刷新的数据范围
export type WorkspaceSyncScope =
  | "workspace"
  | "wallpaper"
  | "search"
  | "all";

interface WorkspaceSyncMessage {
  scope: WorkspaceSyncScope;
}

/** 广播本地数据变更，通知已打开的新标签页按需同步。 */
export function notifyWorkspaceDataChanged(
  scope: WorkspaceSyncScope = "workspace"
): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(WORKSPACE_SYNC_CHANNEL);
  channel.postMessage({ scope } satisfies WorkspaceSyncMessage);
  channel.close();
}

/** 订阅来自其他页面或弹窗的本地数据变更事件。 */
export function subscribeWorkspaceDataChanged(
  listener: (scope: WorkspaceSyncScope) => void
): () => void {
  if (typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }

  const channel = new BroadcastChannel(WORKSPACE_SYNC_CHANNEL);
  const handleMessage = (event: MessageEvent<WorkspaceSyncMessage>) => {
    listener(event.data?.scope ?? "all");
  };

  channel.addEventListener("message", handleMessage);
  return () => {
    channel.removeEventListener("message", handleMessage);
    channel.close();
  };
}
