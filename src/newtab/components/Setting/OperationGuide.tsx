import {
  DatabaseBackup,
  FolderInput,
  Grip,
  PencilLine,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface OperationGuideSection {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  itemKeys: string[];
}

// 操作指南各分段的图标与国际化文案映射
const OPERATION_GUIDE_SECTIONS: OperationGuideSection[] = [
  {
    id: "search",
    icon: Search,
    titleKey: "operationGuide.searchTitle",
    itemKeys: [
      "operationGuide.searchEngine",
      "operationGuide.searchOrVisit",
    ],
  },
  {
    id: "create",
    icon: Plus,
    titleKey: "operationGuide.createTitle",
    itemKeys: [
      "operationGuide.createWebsite",
      "operationGuide.createCategory",
      "operationGuide.createFolder",
    ],
  },
  {
    id: "manage",
    icon: PencilLine,
    titleKey: "operationGuide.manageTitle",
    itemKeys: [
      "operationGuide.manageWebsite",
      "operationGuide.manageCategory",
      "operationGuide.manageFolder",
    ],
  },
  {
    id: "drag",
    icon: Grip,
    titleKey: "operationGuide.dragTitle",
    itemKeys: [
      "operationGuide.dragSort",
      "operationGuide.dragCategory",
      "operationGuide.dragAcrossCategory",
    ],
  },
  {
    id: "dock",
    icon: Trash2,
    titleKey: "operationGuide.dockTitle",
    itemKeys: [
      "operationGuide.dockActions",
      "operationGuide.dockPin",
      "operationGuide.dockManagePinned",
      "operationGuide.dragDelete",
      "operationGuide.deleteConfirm",
    ],
  },
  {
    id: "folder",
    icon: FolderInput,
    titleKey: "operationGuide.folderTitle",
    itemKeys: [
      "operationGuide.dragIntoFolder",
      "operationGuide.mergeWebsites",
    ],
  },
  {
    id: "settings",
    icon: DatabaseBackup,
    titleKey: "operationGuide.settingsTitle",
    itemKeys: [
      "operationGuide.preferences",
      "operationGuide.backup",
      "operationGuide.browserBookmarkImport",
    ],
  },
];

/** 渲染设置面板中的 LocalTab 操作指南。 */
export default function OperationGuide() {
  // 操作指南的本地化文案
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm leading-6 text-white/65">
        {t("operationGuide.introduction")}
      </p>
      <p className="mb-6 text-xs leading-5 text-amber-100/70">
        {t("operationGuide.pointerOnly")}
      </p>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {OPERATION_GUIDE_SECTIONS.map((section) => {
          // 当前操作分段使用的图标组件
          const SectionIcon = section.icon;

          return (
            <section
              key={section.id}
              className="grid gap-3 py-4 sm:grid-cols-[32px_minmax(0,1fr)]"
            >
              <span
                className="flex size-8 items-center justify-center rounded-lg bg-white/[0.055] text-blue-100/75"
                aria-hidden="true"
              >
                <SectionIcon size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="mb-1.5 text-sm font-semibold text-white/90">
                  {t(section.titleKey)}
                </h3>
                <ul className="space-y-1 text-sm leading-5 text-white/55">
                  {section.itemKeys.map((itemKey) => (
                    <li key={itemKey} className="flex gap-2">
                      <span
                        className="mt-2 size-1 shrink-0 rounded-full bg-white/30"
                        aria-hidden="true"
                      />
                      <span>{t(itemKey)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
