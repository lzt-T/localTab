import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Github, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Chromium 扩展 API 最小类型声明
declare const chrome: {
  tabs: {
    create: (options?: { url?: string }) => void
  }
}

// GitHub 仓库地址
const GITHUB_REPOSITORY_URL = 'https://github.com/lzt-T/localTab'

/**
 * 扩展弹窗入口。
 */
const PopupApp: React.FC = () => {
  // 国际化工具
  const { t } = useTranslation()

  /**
   * 打开当前浏览器的新标签页。
   */
  const handleOpenNewTab = () => {
    chrome.tabs.create({})
    window.close()
  }

  /**
   * 打开项目仓库。
   */
  const handleOpenGitHub = () => {
    chrome.tabs.create({ url: GITHUB_REPOSITORY_URL })
    window.close()
  }

  useEffect(() => {
    document.title = t('meta.popupTitle')
  }, [t])

  return (
    <div className="relative w-80 overflow-hidden bg-[#202226] text-white shadow-2xl ring-1 ring-inset ring-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_44%)]"
      />

      <div className="relative flex flex-col p-5 backdrop-blur-xl">
        <header className="mb-5 flex items-center justify-between text-left">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">LocalTab</h1>
            <p className="mt-0.5 text-xs text-white/65">{t('popup.subtitle')}</p>
          </div>
          <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-medium text-blue-100/85">
            v1.0.1
          </span>
        </header>

        <div className="flex flex-col gap-2">
          <Button
            className="group h-11 w-full cursor-pointer justify-start rounded-xl border border-blue-300/20 bg-blue-500/85 px-4 text-sm text-white shadow-[0_8px_24px_rgba(59,130,246,0.2)] hover:bg-blue-400 focus-visible:border-blue-200/50 focus-visible:ring-blue-300/40"
            onClick={handleOpenNewTab}
          >
            <Home className="text-blue-100 transition-colors group-hover:text-white" />
            <span className="font-medium">{t('popup.openNewTab')}</span>
          </Button>
          <Button
            variant="ghost"
            className="group h-11 w-full cursor-pointer justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/85 hover:bg-white/[0.09] hover:text-white focus-visible:border-white/20 focus-visible:ring-white/20"
            onClick={handleOpenGitHub}
          >
            <Github className="text-blue-200/75 transition-colors group-hover:text-blue-100" />
            <span className="font-medium">lzt-T/localTab</span>
          </Button>
        </div>

        <footer className="mt-4 border-t border-white/10 pt-3 text-center">
          <p className="text-xs font-medium text-white/65">{t('popup.tagline')}</p>
        </footer>
      </div>
    </div>
  )
}

export default PopupApp
