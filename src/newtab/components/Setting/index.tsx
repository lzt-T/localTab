import React, { useState } from "react";
import { Languages, Palette, Settings } from "lucide-react";
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

type SettingNavItem = {
  id: SettingSection;
  labelKey: string;
  icon: React.ReactNode;
};

type SettingSection = "wallpaper" | "data" | "language";

const SETTING_NAV_ITEMS: SettingNavItem[] = [
  {
    id: "wallpaper",
    labelKey: "settings.wallpaper",
    icon: <Palette size={20} />,
  },
  {
    id: "data",
    labelKey: "settings.dataManagement",
    icon: <Palette size={20} />,
  },
  {
    id: "language",
    labelKey: "settings.language",
    icon: <Languages size={20} />,
  },
];

const Setting: React.FC = () => {
  const { t } = useTranslation();
  const [activeNav, setActiveNav] =
    useState<SettingSection>("wallpaper");
  const activeItem = SETTING_NAV_ITEMS.find((item) => item.id === activeNav)!;
  const contentBySection: Record<SettingSection, React.ReactNode> = {
    wallpaper: <BackgroundImg />,
    data: <DataManagement />,
    language: <LanguageSettings />,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="fixed bottom-6 left-6 z-50 p-3 text-white/80 hover:text-white  hover:translate-y-[-2px] transition-all duration-300 cursor-pointer"
          title={t("settings.trigger")}
          aria-label={t("settings.trigger")}
        >
          <Settings size={22} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-transparent border-none shadow-none"
        align="start"
        side="top"
        sideOffset={12}
      >
        <div
          className="flex overflow-hidden rounded-2xl border border-white/15 bg-[rgba(32,34,38,0.9)] text-white shadow-2xl shadow-black/40 backdrop-blur-2xl"
          style={{
            width: "min(860px, calc(100vw - 3rem))",
            height: "min(560px, calc(100vh - 6rem))",
          }}
        >
          {/* 左侧导航栏 */}
          <div className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-black/10">
            {/* 用户信息 */}

            {/* 导航列表 */}
            <div className="flex-1 overflow-y-auto py-2">
              {SETTING_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06]",
                    activeNav === item.id ? "bg-white/[0.08] text-white" : ""
                  )}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className="text-white/70">{item.icon}</span>
                  <span className="flex-1 text-sm">{t(item.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* 底部信息 */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <div className="text-xs text-white/50">V1.0.0</div>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 overflow-y-auto bg-white/[0.025]">
            <div className="space-y-6 p-6">
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
