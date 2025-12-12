// LocalTab 后台脚本

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('LocalTab 插件已安装')
  
  // 设置默认配置
  chrome.storage.sync.set({
    'localtab_settings': {
      theme: 'default',
      searchEngine: 'google',
      showWeather: true,
      showTime: true,
      customLinks: []
    }
  })
  
  // 如果是首次安装，打开欢迎页面
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('newtab.html')
    })
  }
})

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 可以在这里添加一些标签页管理逻辑
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('页面加载完成:', tab.url)
  }
})

// 处理来自内容脚本或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      chrome.storage.sync.get(['localtab_settings'], (result) => {
        sendResponse(result.localtab_settings || {})
      })
      return true // 保持消息通道开放
      
    case 'saveSettings':
      chrome.storage.sync.set({
        'localtab_settings': request.settings
      }, () => {
        sendResponse({ success: true })
      })
      return true
      
    case 'getTopSites':
      chrome.topSites.get((sites) => {
        sendResponse(sites)
      })
      return true
      
    default:
      sendResponse({ error: 'Unknown action' })
  }
})

// 右键菜单（可选功能）
chrome.contextMenus.create({
  id: 'localtab-newtab',
  title: '在LocalTab中打开',
  contexts: ['link']
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'localtab-newtab') {
    chrome.tabs.create({
      url: info.linkUrl
    })
  }
})
