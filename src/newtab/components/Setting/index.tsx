import React, { useState } from "react";
import {
  BookOpenText,
  Database,
  Languages,
  Palette,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/utils/base";
import BackgroundImg from "@/newtab/components/Setting/BackgroundImg";
import DataManagement from "@/newtab/components/Setting/DataManagement";
import LanguageSettings from "@/newtab/components/Setting/LanguageSettings";
import OperationGuide from "@/newtab/components/Setting/OperationGuide";

type SettingNavItem = {
  id: SettingSection;
  labelKey: string;
  icon: React.ReactNode;
};

type SettingSection = "wallpaper" | "guide" | "data" | "language";

interface SettingProps {
  triggerClassName?: string;
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
 * 新标签页设置面板。
 */
const Setting: React.FC<SettingProps> = ({ triggerClassName }) => {
  // 国际化工具
  const { t } = useTranslation();
  // 当前设置区域
  const [activeNav, setActiveNav] =
    useState<SettingSection>("wallpaper");
  // 当前设置导航项
  const activeItem = SETTING_NAV_ITEMS.find((item) => item.id === activeNav)!;
  // 设置区域内容映射
  const contentBySection: Record<SettingSection, React.ReactNode> = {
    wallpaper: <BackgroundImg />,
    guide: <OperationGuide />,
    data: <DataManagement />,
    language: <LanguageSettings />,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            triggerClassName ??
              "flex size-11 cursor-pointer items-center justify-center rounded-xl text-white/65 outline-none transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none"
          )}
          title={t("settings.trigger")}
          aria-label={t("settings.trigger")}
        >
          <Settings size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-none bg-transparent p-0 shadow-none duration-200 motion-reduce:animate-none"
        align="center"
        side="top"
        sideOffset={12}
      >
        <div
          className="glass-style-overlay flex flex-col overflow-hidden rounded-2xl text-white shadow-[0_18px_46px_rgba(0,0,0,0.36)] sm:flex-row"
          style={{
            width: "min(860px, calc(100vw - 2rem))",
            height: "min(560px, calc(100vh - 7rem))",
          }}
        >
          {/* 左侧导航栏 */}
          <div className="flex w-full shrink-0 border-b border-white/10 bg-black/10 sm:w-56 sm:flex-col sm:border-b-0 sm:border-r">
            {/* 导航列表 */}
            <div className="flex flex-1 overflow-x-auto p-2 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
              {SETTING_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex min-w-fit flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left text-slate-400 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-blue-300/70 sm:w-full sm:flex-none sm:justify-start",
                    activeNav === item.id
                      ? "bg-blue-300/10 text-blue-100"
                      : ""
                  )}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm font-semibold">{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 overflow-y-auto bg-white/[0.025]">
            <div className="space-y-6 p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {t(activeItem.labelKey)}
                </h2>
              </div>
              {contentBySection[activeNav]}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Setting;
