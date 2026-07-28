import { useCallback, useEffect, useRef, useState } from "react";
import { useDndMonitor } from "@dnd-kit/core";

// 网址在文件夹中心悬停后自动展开的延迟
const AUTO_OPEN_FOLDER_DELAY_MS = 400;

/** 管理网址拖拽期间唯一自动展开的文件夹。 */
export default function useAutoOpenFolder() {
  // 当前由拖拽自动展开的文件夹标识
  const [autoOpenFolderId, setAutoOpenFolderId] = useState<string | null>(null);
  // 当前自动展开状态的同步引用
  const autoOpenFolderIdRef = useRef<string | null>(null);
  // 等待自动展开的文件夹标识
  const pendingFolderIdRef = useRef<string | null>(null);
  // 文件夹延迟展开计时器
  const autoOpenTimerRef = useRef<number | null>(null);

  /** 清除尚未执行的文件夹展开任务。 */
  const clearPendingAutoOpen = useCallback(() => {
    if (autoOpenTimerRef.current !== null) {
      window.clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
    pendingFolderIdRef.current = null;
  }, []);

  /** 关闭自动展开的文件夹并取消等待任务。 */
  const closeAutoOpenFolder = useCallback(() => {
    clearPendingAutoOpen();
    autoOpenFolderIdRef.current = null;
    setAutoOpenFolderId(null);
  }, [clearPendingAutoOpen]);

  /** 为当前中心悬停目标安排延迟展开。 */
  const requestAutoOpen = useCallback(
    (folderId: string) => {
      if (
        autoOpenFolderIdRef.current === folderId ||
        pendingFolderIdRef.current === folderId
      ) {
        return;
      }

      clearPendingAutoOpen();
      autoOpenFolderIdRef.current = null;
      setAutoOpenFolderId(null);
      pendingFolderIdRef.current = folderId;
      autoOpenTimerRef.current = window.setTimeout(() => {
        pendingFolderIdRef.current = null;
        autoOpenTimerRef.current = null;
        autoOpenFolderIdRef.current = folderId;
        setAutoOpenFolderId(folderId);
      }, AUTO_OPEN_FOLDER_DELAY_MS);
    },
    [clearPendingAutoOpen]
  );

  /** 仅取消指定文件夹尚未触发的展开任务。 */
  const cancelPendingAutoOpen = useCallback(
    (folderId: string) => {
      if (pendingFolderIdRef.current === folderId) {
        clearPendingAutoOpen();
      }
    },
    [clearPendingAutoOpen]
  );

  useDndMonitor({
    /** 结束网址拖拽时关闭自动展开的文件夹。 */
    onDragEnd() {
      closeAutoOpenFolder();
    },
    /** 取消网址拖拽时关闭自动展开的文件夹。 */
    onDragCancel() {
      closeAutoOpenFolder();
    },
  });

  useEffect(() => clearPendingAutoOpen, [clearPendingAutoOpen]);

  return {
    autoOpenFolderId,
    requestAutoOpen,
    cancelPendingAutoOpen,
    closeAutoOpenFolder,
  };
}
