import React from "react";
import {
  BookOpenText,
  Database,
  Languages,
  Palette,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import BackgroundImg from "@/newtab/components/Setting/BackgroundImg";
import DataManagement from "@/newtab/components/Setting/DataManagement";
import LanguageSettings from "@/newtab/components/Setting/LanguageSettings";
import OperationGuide from "@/newtab/components/Setting/OperationGuide";

export type SettingSection = "wallpaper" | "guide" | "data" | "language";

type SettingNavItem = {
  id: SettingSection;
  labelKey: string;
  icon: React.ReactNode;
};

interface SettingProps {
  open: boolean;
  activeSection: SettingSection;
  triggerClassName?: string;
  onOpenChange: (open: boolean) => void;
  onSectionChange: (section: SettingSection) => void;
  onDataChanged: () => Promise<void>;
}

// 设置导航配置
const SETTING_NAV_ITEMS: SettingNavItem[] = [
  {
    id: "wallpaper",
    labelKey: "settings.wallpaper",
    icon: <Palette size={20} />,
  },
  {
    id: "guide",
    labelKey: "settings.operationGuide",
    icon: <BookOpenText size={20} />,
  },
  {
    id: "data",
    labelKey: "settings.dataManagement",
    icon: <Database size={20} />,
  },
  {
    id: "language",
    labelKey: "settings.language",
    icon: <Languages size={20} />,
  },
];

/**
 * 新标签页设置弹窗。
 */
const Setting: React.FC<SettingProps> = ({
  open,
  activeSection,
  triggerClassName,
  onOpenChange,
  onSectionChange,
  onDataChanged,
}) => {
  // 国际化工具
  const { t } = useTranslation();
  // 当前设置导航项
  const activeItem =
    SETTING_NAV_ITEMS.find((item) => item.id === activeSection) ??
    SETTING_NAV_ITEMS[0];
  // 设置区域内容映射
  const contentBySection: Record<SettingSection, React.ReactNode> = {
    wallpaper: <BackgroundImg />,
    guide: <OperationGuide />,
    data: <DataManagement onDataChanged={onDataChanged} />,
    language: <LanguageSettings />,
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              triggerClassName ??
                "flex size-11 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none"
            )}
            aria-label={t("settings.trigger")}
            onClick={() => onOpenChange(true)}
          >
            <Settings size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="border border-white/10 bg-[#202328] text-white shadow-lg motion-reduce:animate-none"
          arrowClassName="bg-[#202328] fill-[#202328]"
        >
          {t("settings.trigger")}
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[min(580px,calc(100vh-4rem))] w-[min(860px,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_18px_46px_rgba(0,0,0,0.36)] sm:max-w-none">
          <DialogTitle className="sr-only">
            {t("settings.trigger")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t(activeItem.labelKey)}
          </DialogDescription>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
            {/* 左侧导航栏 */}
            <div className="flex w-full shrink-0 border-b border-white/10 bg-black/15 pr-12 sm:w-56 sm:flex-col sm:border-b-0 sm:border-r sm:pr-0">
              {/* 导航列表 */}
              <div className="flex flex-1 gap-1 overflow-x-auto p-2 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
                {SETTING_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "flex min-w-fit flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left text-white/60 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-blue-300/70 sm:w-full sm:flex-none sm:justify-start",
                      activeSection === item.id &&
                        "bg-blue-400/15 text-blue-100"
                    )}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-semibold">
                      {t(item.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 overflow-y-auto bg-white/[0.025]">
              <div className="space-y-6 p-4 sm:p-6">
                <div className="mb-4 pr-10">
                  <h2 className="text-xl font-semibold text-white">
                    {t(activeItem.labelKey)}
                  </h2>
                </div>
                {contentBySection[activeSection]}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Setting;
