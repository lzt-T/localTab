import React from 'react'
import { Home, Settings, Info } from 'lucide-react'

// Chrome API 类型声明
declare const chrome: {
  tabs: {
    create: (options: { url: string }) => void
  }
}

const PopupApp: React.FC = () => {
  const handleOpenNewTab = () => {
    // @ts-expect-error - Chrome API is available in extension context
    chrome.tabs.create({ url: 'chrome://newtab/' })
    window.close()
  }

  const handleSettings = () => {
    // 未来可以打开设置页面
    alert('设置功能即将推出！')
  }

  const handleAbout = () => {
    alert('LocalTab v1.0.0\n一个类似WeTab的新标签页管理器')
  }

  return (
    <div className="w-80 min-h-64 relative overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      
      {/* 玻璃态内容层 */}
      <div className="relative h-full backdrop-blur-xl bg-white/5 p-6 flex flex-col">
        {/* 头部 */}
        <div className="text-center mb-6">
          <div className="glass-style-border rounded-2xl px-6 py-4 inline-block mb-3">
            <div className="text-2xl font-bold text-white mb-1">LocalTab</div>
            <div className="text-xs text-white/70">v1.0.0</div>
          </div>
        </div>

        {/* 菜单 */}
        <div className="flex flex-col gap-3 flex-1">
          <button 
            className="glass-style-border group flex items-center px-4 py-3 rounded-xl text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            onClick={handleOpenNewTab}
          >
            <Home size={18} className="mr-3 text-blue-200/90 group-hover:text-blue-100 transition-colors" />
            <span className="font-medium">打开新标签页</span>
          </button>
          <button 
            className="glass-style-border group flex items-center px-4 py-3 rounded-xl text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            onClick={handleSettings}
          >
            <Settings size={18} className="mr-3 text-blue-200/90 group-hover:text-blue-100 transition-colors" />
            <span className="font-medium">设置</span>
          </button>
          <button 
            className="glass-style-border group flex items-center px-4 py-3 rounded-xl text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            onClick={handleAbout}
          >
            <Info size={18} className="mr-3 text-blue-200/90 group-hover:text-blue-100 transition-colors" />
            <span className="font-medium">关于</span>
          </button>
        </div>

        {/* 页脚 */}
        <div className="text-center mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-white/60 font-medium">
            让每个新标签页都充满可能
          </div>
        </div>
      </div>
    </div>
  )
}

export default PopupApp
