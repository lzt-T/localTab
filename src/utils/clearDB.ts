/**
 * 清除旧数据库的工具函数
 * 仅在开发时使用
 */

export async function clearOldDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('LocalTabDB')
    
    request.onsuccess = () => {
      console.log('旧数据库已清除')
      resolve()
    }
    
    request.onerror = () => {
      console.error('清除数据库失败')
      reject(new Error('清除数据库失败'))
    }
    
    request.onblocked = () => {
      console.warn('数据库被阻塞，请关闭所有使用该数据库的标签页')
    }
  })
}

// 开发环境下可以在控制台调用：
// import { clearOldDatabase } from './utils/clearDB'
// await clearOldDatabase()

