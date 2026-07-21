import React from 'react'
import { Github, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Chrome API 类型声明
declare const chrome: {
  tabs: {
    create: (options: { url: string }) => void
  }
}

const GITHUB_REPOSITORY_URL = 'https://github.com/lzt-T/localTab'

const PopupApp: React.FC = () => {
  const handleOpenNewTab = () => {
    chrome.tabs.create({ url: 'chrome://newtab/' })
    window.close()
  }

  const handleOpenGitHub = () => {
    chrome.tabs.create({ url: GITHUB_REPOSITORY_URL })
    window.close()
  }

  return (
    <div className="relative w-80 overflow-hidden bg-[#101116] text-white shadow-2xl ring-1 ring-inset ring-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_44%)]"
      />

      <div className="relative flex flex-col p-5 backdrop-blur-xl">
        <header className="mb-5 flex items-center justify-between text-left">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">LocalTab</h1>
            <p className="mt-0.5 text-xs text-white/65">新标签页管理器</p>
          </div>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-medium text-violet-100/85">
            v1.0.0
          </span>
        </header>

        <div className="flex flex-col gap-2">
          <Button
            className="group h-11 w-full cursor-pointer justify-start rounded-xl border border-violet-300/20 bg-violet-500 px-4 text-sm text-white shadow-[0_8px_24px_rgba(124,58,237,0.22)] hover:bg-violet-400 focus-visible:border-violet-200/50 focus-visible:ring-violet-300/40"
            onClick={handleOpenNewTab}
          >
            <Home className="text-violet-100 transition-colors group-hover:text-white" />
            <span className="font-medium">打开新标签页</span>
          </Button>
          <Button
            variant="ghost"
            className="group h-11 w-full cursor-pointer justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/85 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
            onClick={handleOpenGitHub}
          >
            <Github className="text-violet-200/75 transition-colors group-hover:text-violet-100" />
            <span className="font-medium">lzt-T/localTab</span>
          </Button>
        </div>

        <footer className="mt-4 border-t border-white/10 pt-3 text-center">
          <p className="text-xs font-medium text-white/65">让每个新标签页都充满可能</p>
        </footer>
      </div>
    </div>
  )
}

export default PopupApp
