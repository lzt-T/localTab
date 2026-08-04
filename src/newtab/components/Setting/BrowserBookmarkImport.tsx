import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BrowserBookmarkImportStage,
  useBrowserBookmarkImport,
  type BrowserBookmarkImportStageValue,
} from "@/hooks/useBrowserBookmarkImport";

/** 浏览器书签导入区域参数。 */
interface BrowserBookmarkImportProps {
  onDataChanged: () => Promise<void>;
}

/** 展示浏览器书签的一次性授权、预览和导入流程。 */
export default function BrowserBookmarkImport({
  onDataChanged,
}: BrowserBookmarkImportProps) {
  // 国际化工具
  const { t } = useTranslation();
  // 浏览器书签导入流程状态和操作
  const {
    stage,
    plan,
    previewSummary,
    completedSummary,
    feedbackKey,
    startImport,
    cancelImport,
    confirmImport,
  } = useBrowserBookmarkImport({ onDataChanged });

  // 各导入阶段对应的界面内容
  const contentByStage: Record<BrowserBookmarkImportStageValue, ReactNode> = {
    [BrowserBookmarkImportStage.IDLE]: (
      <Button
        type="button"
        className="cursor-pointer border border-blue-300/20 bg-blue-500/75 text-white hover:bg-blue-400"
        onClick={startImport}
      >
        <Bookmark />
        {t("browserBookmarkImport.readAction")}
      </Button>
    ),
    [BrowserBookmarkImportStage.READING]: (
      <Button type="button" disabled className="bg-white/10 text-white/70">
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        {t("browserBookmarkImport.reading")}
      </Button>
    ),
    [BrowserBookmarkImportStage.PREVIEW]: plan && previewSummary ? (
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <div>
          <p className="text-sm font-semibold text-white/90">
            {t("browserBookmarkImport.previewTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {t("browserBookmarkImport.previewSummary", {
              ...previewSummary,
            })}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            {t("browserBookmarkImport.skippedSummary", {
              ...previewSummary,
            })}
          </p>
        </div>
        <ul className="max-h-28 space-y-1 overflow-y-auto border-y border-white/10 py-2 text-sm text-white/70">
          {plan.categories.map((category) => (
            <li key={category.id} className="truncate">
              {category.name}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="cursor-pointer bg-blue-500/80 text-white hover:bg-blue-400"
            onClick={confirmImport}
          >
            {t("browserBookmarkImport.confirmAction", {
              count: previewSummary.linkCount,
            })}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer border-white/15 bg-transparent text-white/75 hover:bg-white/10 hover:text-white"
            onClick={cancelImport}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    ) : null,
    [BrowserBookmarkImportStage.IMPORTING]: (
      <Button type="button" disabled className="bg-white/10 text-white/70">
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        {t("browserBookmarkImport.importing")}
      </Button>
    ),
    [BrowserBookmarkImportStage.COMPLETED]: completedSummary ? (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-50/85">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" />
        <div>
          <p className="font-semibold">
            {t("browserBookmarkImport.completedTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/65">
            {t("browserBookmarkImport.completedSummary", {
              ...completedSummary,
            })}
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto cursor-pointer p-0 text-xs text-emerald-200 hover:text-emerald-100"
            onClick={cancelImport}
          >
            {t("browserBookmarkImport.importAgain")}
          </Button>
        </div>
      </div>
    ) : null,
    [BrowserBookmarkImportStage.ERROR]: (
      <div className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-400/[0.08] p-4 text-sm text-amber-50/80">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" />
        <div>
          <p className="leading-5">
            {feedbackKey ? t(feedbackKey) : t("browserBookmarkImport.readFailed")}
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto cursor-pointer p-0 text-xs text-amber-200 hover:text-amber-100"
            onClick={startImport}
          >
            {t("browserBookmarkImport.retry")}
          </Button>
        </div>
      </div>
    ),
  };

  return (
    <section className="space-y-4 border-b border-white/10 pb-6">
      <div>
        <h3 className="mb-2 text-lg font-medium text-white">
          {t("browserBookmarkImport.title")}
        </h3>
        <p className="text-sm leading-6 text-white/60">
          {t("browserBookmarkImport.description")}
        </p>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-blue-100/65">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>{t("browserBookmarkImport.permissionNotice")}</span>
        </p>
      </div>
      {contentByStage[stage]}
    </section>
  );
}
