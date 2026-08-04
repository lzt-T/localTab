import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  BrowserBookmarkReadStatus,
  browserBookmarkService,
} from "@/services/browser-bookmark-service";
import {
  bookmarkImportService,
  getBookmarkImportSummary,
  type BookmarkImportPlan,
  type BookmarkImportSummary,
} from "@/services/bookmark-import-service";

/** 浏览器书签导入流程阶段。 */
export const BrowserBookmarkImportStage = {
  IDLE: "idle",
  READING: "reading",
  PREVIEW: "preview",
  IMPORTING: "importing",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

/** 浏览器书签导入阶段值。 */
export type BrowserBookmarkImportStageValue =
  (typeof BrowserBookmarkImportStage)[keyof typeof BrowserBookmarkImportStage];

/** 浏览器书签导入 Hook 参数。 */
interface UseBrowserBookmarkImportOptions {
  onDataChanged: () => Promise<void>;
}

/** 管理浏览器书签授权、预览和提交的页面流程。 */
export function useBrowserBookmarkImport({
  onDataChanged,
}: UseBrowserBookmarkImportOptions) {
  // 国际化工具
  const { t } = useTranslation();
  // 当前导入流程阶段
  const [stage, setStage] = useState<BrowserBookmarkImportStageValue>(
    BrowserBookmarkImportStage.IDLE
  );
  // 当前等待确认的导入计划
  const [plan, setPlan] = useState<BookmarkImportPlan | null>(null);
  // 导入成功后的实际写入统计
  const [completedSummary, setCompletedSummary] =
    useState<BookmarkImportSummary | null>(null);
  // 当前错误或不可用状态的国际化键
  const [feedbackKey, setFeedbackKey] = useState("");
  // 当前预览统计
  const previewSummary = plan ? getBookmarkImportSummary(plan) : null;

  /** 从用户点击直接请求权限并读取浏览器书签。 */
  async function startImport() {
    setStage(BrowserBookmarkImportStage.READING);
    setFeedbackKey("");
    setPlan(null);
    setCompletedSummary(null);

    try {
      // 一次性授权后的浏览器书签读取结果
      const readResult = await browserBookmarkService.readTree();

      /** 将成功读取的书签树转换为预览计划。 */
      async function handleSuccess() {
        if (readResult.status !== BrowserBookmarkReadStatus.SUCCESS) {
          return;
        }
        // 结合当前分类生成的追加导入计划
        const importPlan = await bookmarkImportService.createPlan(
          readResult.tree,
          {
            importSuffix: t("browserBookmarkImport.importSuffix"),
            unnamedCategoryName: t(
              "browserBookmarkImport.unnamedCategory"
            ),
            unnamedFolderName: t("browserBookmarkImport.unnamedFolder"),
          }
        );
        if (importPlan.links.length === 0) {
          setFeedbackKey("browserBookmarkImport.noValidBookmarks");
          setStage(BrowserBookmarkImportStage.ERROR);
          return;
        }
        setPlan(importPlan);
        setStage(BrowserBookmarkImportStage.PREVIEW);
      }

      /** 展示当前浏览器不支持直接读取的反馈。 */
      async function handleUnsupported() {
        setFeedbackKey("browserBookmarkImport.unsupported");
        setStage(BrowserBookmarkImportStage.ERROR);
      }

      /** 展示用户拒绝书签权限的反馈。 */
      async function handleDenied() {
        setFeedbackKey("browserBookmarkImport.permissionDenied");
        setStage(BrowserBookmarkImportStage.ERROR);
      }

      /** 展示浏览器书签读取失败的反馈。 */
      async function handleFailed() {
        setFeedbackKey("browserBookmarkImport.readFailed");
        setStage(BrowserBookmarkImportStage.ERROR);
      }

      // 不同读取状态对应的页面处理策略
      const readResultStrategies = {
        [BrowserBookmarkReadStatus.SUCCESS]: handleSuccess,
        [BrowserBookmarkReadStatus.UNSUPPORTED]: handleUnsupported,
        [BrowserBookmarkReadStatus.DENIED]: handleDenied,
        [BrowserBookmarkReadStatus.FAILED]: handleFailed,
      };
      await readResultStrategies[readResult.status]();
    } catch (error) {
      console.error("准备浏览器书签导入失败:", error);
      setFeedbackKey("browserBookmarkImport.readFailed");
      setStage(BrowserBookmarkImportStage.ERROR);
    }
  }

  /** 取消当前预览并清除内存导入计划。 */
  function cancelImport() {
    setPlan(null);
    setFeedbackKey("");
    setStage(BrowserBookmarkImportStage.IDLE);
  }

  /** 原子提交当前导入计划并刷新新标签页数据。 */
  async function confirmImport() {
    if (!plan) {
      return;
    }

    setStage(BrowserBookmarkImportStage.IMPORTING);
    try {
      // 原子事务完成后的实际导入统计
      const summary = await bookmarkImportService.commit(plan);
      await onDataChanged();
      setCompletedSummary(summary);
      setStage(BrowserBookmarkImportStage.COMPLETED);
      toast.success(
        t("browserBookmarkImport.importSuccess", { count: summary.linkCount })
      );
    } catch (error) {
      console.error("导入浏览器书签失败:", error);
      setFeedbackKey("browserBookmarkImport.importFailed");
      setStage(BrowserBookmarkImportStage.ERROR);
    }
  }

  return {
    stage,
    plan,
    previewSummary,
    completedSummary,
    feedbackKey,
    startImport,
    cancelImport,
    confirmImport,
  };
}
