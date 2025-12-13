import React from 'react'

const PopupApp: React.FC = () => {
  const handleOpenNewTab = () => {
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
    <div className="w-80 p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white min-h-52">
      {/* 头部 */}
      <div className="text-center mb-5">
        <div className="text-2xl font-bold mb-1">LocalTab</div>
        <div className="text-sm opacity-70">v1.0.0</div>
      </div>

      {/* 菜单 */}
      <div className="flex flex-col gap-2">
        <button 
          className="flex items-center px-4 py-3 bg-white/10 rounded-lg border border-white/10 text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:translate-x-1"
          onClick={handleOpenNewTab}
        >
          <span className="mr-3 text-base">🏠</span>
          打开新标签页
        </button>
        <button 
          className="flex items-center px-4 py-3 bg-white/10 rounded-lg border border-white/10 text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:translate-x-1"
          onClick={handleSettings}
        >
          <span className="mr-3 text-base">⚙️</span>
          设置
        </button>
        <button 
          className="flex items-center px-4 py-3 bg-white/10 rounded-lg border border-white/10 text-white cursor-pointer transition-all duration-300 text-sm w-full text-left hover:bg-white/20 hover:translate-x-1"
          onClick={handleAbout}
        >
          <span className="mr-3 text-base">ℹ️</span>
          关于
        </button>
      </div>

      {/* 页脚 */}
      <div className="text-center mt-5 text-sm opacity-60">
        让每个新标签页都充满可能
      </div>
    </div>
  )
}

export default PopupApp
