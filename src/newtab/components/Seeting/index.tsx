import React, { useState } from "react";
import { 
  User, 
  Settings, 
  Palette, 
  Search, 
  Bell, 
  Info, 
  Grid3x3, 
  MessageSquare,
  Image,
  Video,
  Sparkles
} from "lucide-react";
import { cn } from "../../../utils/base";

type SettingNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

type GradientPreset = {
  id: string;
  colors: string[];
  angle?: number;
};

const Setting: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>("wallpaper");
  const [activeTab, setActiveTab] = useState<string>("gradient");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [colorValue, setColorValue] = useState<number>(50);
  const [brightnessValue, setBrightnessValue] = useState<number>(50);
  const [angleValue, setAngleValue] = useState<number>(25);

  const navItems: SettingNavItem[] = [
    { id: "subscription", label: "订阅管理", icon: <User size={20} />, badge: "FREE" },
    { id: "invitation", label: "我的邀请", icon: <User size={20} /> },
    { id: "general", label: "常规设置", icon: <Settings size={20} /> },
    { id: "wallpaper", label: "壁纸", icon: <Palette size={20} /> },
    { id: "theme", label: "主题切换", icon: <Palette size={20} /> },
    { id: "search", label: "搜索引擎", icon: <Search size={20} /> },
    { id: "notification", label: "消息通知", icon: <Bell size={20} /> },
    { id: "about", label: "关于我们", icon: <Info size={20} /> },
    { id: "apps", label: "相关应用", icon: <Grid3x3 size={20} /> },
    { id: "feedback", label: "投诉与反馈", icon: <MessageSquare size={20} /> },
  ];

  const colorFilters = [
    { id: "all", label: "All", color: "transparent" },
    { id: "red", label: "", color: "#ef4444" },
    { id: "orange", label: "", color: "#f97316" },
    { id: "yellow", label: "", color: "#eab308" },
    { id: "green", label: "", color: "#22c55e" },
    { id: "lightblue", label: "", color: "#38bdf8" },
    { id: "blue", label: "", color: "#3b82f6" },
    { id: "purple", label: "", color: "#a855f7" },
    { id: "brown", label: "", color: "#a16207" },
    { id: "gray", label: "", color: "#6b7280" },
  ];

  const gradientPresets: GradientPreset[] = [
    { id: "1", colors: ["#3b82f6", "#22c55e"], angle: 135 },
    { id: "2", colors: ["#86efac", "#eab308"], angle: 45 },
    { id: "3", colors: ["#a855f7", "#ef4444"], angle: 90 },
    { id: "4", colors: ["#22c55e", "#06b6d4"], angle: 120 },
    { id: "5", colors: ["#f97316", "#f97316"], angle: 0 },
    { id: "6", colors: ["#3b82f6", "#22c55e"], angle: 60 },
    { id: "7", colors: ["#a16207", "#78350f"], angle: 180 },
    { id: "8", colors: ["#7c3aed", "#a855f7"], angle: 135 },
    { id: "9", colors: ["#06b6d4", "#1e40af"], angle: 45 },
  ];

  const getGradientStyle = (gradient: GradientPreset) => {
    const angle = gradient.angle || 0;
    return {
      background: `linear-gradient(${angle}deg, ${gradient.colors.join(", ")})`,
    };
  };

  const renderWallpaperContent = () => {
    if (activeTab === "gradient") {
      return (
        <div className="space-y-6">
          {/* 颜色筛选器 */}
          <div className="flex items-center gap-3">
            {colorFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedColor(filter.id)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  selectedColor === filter.id
                    ? "border-white scale-110"
                    : "border-white/30 hover:border-white/50",
                  filter.id === "all" ? "bg-white/10 flex items-center justify-center text-xs text-white" : ""
                )}
                style={
                  filter.id !== "all"
                    ? { backgroundColor: filter.color }
                    : undefined
                }
                title={filter.id === "all" ? "全部" : filter.id}
              >
                {filter.id === "all" && "All"}
              </button>
            ))}
          </div>

          {/* 渐变预览网格 */}
          <div className="grid grid-cols-3 gap-3">
            {gradientPresets.map((gradient) => (
              <button
                key={gradient.id}
                onClick={() => setSelectedGradient(gradient.id)}
                className={cn(
                  "aspect-square rounded-lg transition-all hover:scale-105 shadow-lg",
                  selectedGradient === gradient.id
                    ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900"
                    : ""
                )}
                style={getGradientStyle(gradient)}
              />
            ))}
          </div>

          {/* 调整滑块 */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs text-white/70 mb-2">色彩</label>
              <input
                type="range"
                min="0"
                max="100"
                value={colorValue}
                onChange={(e) => setColorValue(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/70 mb-2">亮度</label>
              <input
                type="range"
                min="0"
                max="100"
                value={brightnessValue}
                onChange={(e) => setBrightnessValue(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-2 border-white/30"
                  style={{
                    transform: `rotate(${angleValue}deg)`,
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-white rounded-full" />
                </div>
                <span className="text-xs text-white/70 z-10">{angleValue}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angleValue}
                onChange={(e) => setAngleValue(Number(e.target.value))}
                className="w-12 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 text-white/50">
        {activeTab === "featured" && "精选图片功能开发中..."}
        {activeTab === "dynamic" && "动态壁纸功能开发中..."}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case "wallpaper":
        return (
          <div className="space-y-6">
            {/* 标签页 */}
            <div className="flex gap-2 border-b border-white/10">
              {[
                { id: "featured", label: "精选图片", icon: Image },
                { id: "dynamic", label: "动态壁纸", icon: Video },
                { id: "gradient", label: "渐变背景", icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all border-b-2",
                    activeTab === tab.id
                      ? "text-white border-white bg-white/5"
                      : "text-white/50 border-transparent hover:text-white/70"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {renderWallpaperContent()}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 text-white/50">
            {navItems.find((item) => item.id === activeNav)?.label} 功能开发中...
          </div>
        );
    }
  };

  return (
    <div className="flex bg-gray-900/95 backdrop-blur-xl text-white rounded-lg overflow-hidden" style={{ width: '900px', height: '600px' }}>
      {/* 左侧导航栏 */}
      <div className="w-64 bg-gray-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* 用户信息 */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">1134565243@qq.com</div>
            </div>
          </div>
        </div>

        {/* 导航列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all hover:bg-white/5",
                activeNav === item.id ? "bg-white/10 text-white" : ""
              )}
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
          <div className="text-xs text-white/50">V2.2.16</div>
          <div className="flex gap-4 text-xs text-white/50">
            <button className="hover:text-white transition-colors">用户协议</button>
            <button className="hover:text-white transition-colors">隐私政策</button>
          </div>
        </div>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 overflow-y-auto bg-gray-900/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {navItems.find((item) => item.id === activeNav)?.label}
            </h2>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Setting;

