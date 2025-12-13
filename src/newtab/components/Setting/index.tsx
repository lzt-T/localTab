import React, { useState } from "react";
import { Palette, Settings } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../../components/ui/popover";
import { cn } from "../../../utils/base";
import BackgroundImg from "./BackgroundImg";

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
    { id: "theme", label: "主题", icon: <Palette size={20} /> },
  ];

  /* 渲染内容 */
  const renderContent = () => {
    const config: Record<string, React.ReactNode> = {
      wallpaper: <BackgroundImg />,
      theme: <div>sad</div>,
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
        side="bottom"
        sideOffset={12}
      >
        <div
          className="flex bg-gray-900/95 backdrop-blur-xl text-white rounded-lg overflow-hidden"
          style={{ width: "900px", height: "600px" }}
        >
          {/* 左侧导航栏 */}
          <div className="w-64 bg-gray-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
            {/* 用户信息 */}

            {/* 导航列表 */}
            <div className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all hover:bg-white/5",
                    activeNav === item.id ? "bg-white/10 text-white" : ""
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
          <div className="flex-1 overflow-y-auto bg-gray-900/50 backdrop-blur-xl">
            <div className="p-6">{renderContent()}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Setting;
