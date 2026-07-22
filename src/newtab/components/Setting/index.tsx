import React, { useState } from "react";
import { Palette, Settings } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/utils/base";
import BackgroundImg from "@/newtab/components/Setting/BackgroundImg";
import DataManagement from "@/newtab/components/Setting/DataManagement";

type SettingNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const Setting: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>("wallpaper");

  /* 导航栏 */
  const navItems: SettingNavItem[] = [
    { id: "wallpaper", label: "壁纸", icon: <Palette size={20} /> },
    { id: "data", label: "数据管理", icon: <Palette size={20} /> },
  ];

  /* 渲染内容 */
  const renderContent = () => {
    const config: Record<string, React.ReactNode> = {
      wallpaper: <BackgroundImg />,
      data: <DataManagement />,
    };
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {navItems.find((item) => item.id === activeNav)?.label}
          </h2>
        </div>
        {config[activeNav]}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="fixed bottom-6 left-6 z-50 p-3 text-white/80 hover:text-white  hover:translate-y-[-2px] transition-all duration-300 cursor-pointer"
          title="设置"
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
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06]",
                    activeNav === item.id ? "bg-white/[0.08] text-white" : ""
                  )}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className="text-white/70">{item.icon}</span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-white/10 rounded">
                      {item.badge}
                    </span>
                  )}
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
            <div className="p-6">{renderContent()}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Setting;
