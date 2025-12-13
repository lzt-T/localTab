/**
 * IndexedDB 通用数据库封装
 * 纯粹的数据访问层，只提供基础的 CRUD 操作
 */

const DB_NAME = 'LocalTabDB'
// 数据库版本 用于升级数据库,当数据库版本号发生变化时,会触发 onupgradeneeded 事件
const DB_VERSION = 2

// 对象存储名称常量
export const STORE_NAMES = {
  SYSTEM: 'system',
  CATEGORY: 'category',
  LINK: 'link',
  LINK_GROUP: 'linkGroup'
} as const

export type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES]

class LocalTabDB {
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('无法打开数据库'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建 settings 表（键值对存储）
        if (!db.objectStoreNames.contains(STORE_NAMES.SYSTEM)) {
          db.createObjectStore(STORE_NAMES.SYSTEM)
        }

        // 创建 category 表（使用 id 作为主键）
        if (!db.objectStoreNames.contains(STORE_NAMES.CATEGORY)) {
          db.createObjectStore(STORE_NAMES.CATEGORY, { keyPath: 'id' })
        }

        // 创建 link 表（使用 id 作为主键）
        if (!db.objectStoreNames.contains(STORE_NAMES.LINK)) {
          db.createObjectStore(STORE_NAMES.LINK, { keyPath: 'id' })
        }

        // 创建 linkGroup 表（使用 id 作为主键）
        if (!db.objectStoreNames.contains(STORE_NAMES.LINK_GROUP)) {
          db.createObjectStore(STORE_NAMES.LINK_GROUP, { keyPath: 'id' })
        }
      }
    })
  }

  // ==================== 通用 CRUD 操作 ====================

  /**
   * 保存数据（用于有 keyPath 的表）
   * @param storeName 表名
   * @param data 数据对象（必须包含 keyPath 字段）
   */
  async put<T>(storeName: StoreName, data: T): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`保存数据失败: ${storeName}`))
    })
  }

  /**
   * 保存数据（用于键值对存储的表）
   * @param storeName 表名
   * @param key 键
   * @param value 值
   */
  async putWithKey<T>(storeName: StoreName, key: string, value: T): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`保存数据失败: ${storeName}[${key}]`))
    })
  }

  /**
   * 读取单条数据
   * @param storeName 表名
   * @param key 主键或键
   */
  async get<T = unknown>(storeName: StoreName, key: string): Promise<T | undefined> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error(`读取数据失败: ${storeName}[${key}]`))
    })
  }

  /**
   * 读取所有数据
   * @param storeName 表名
   */
  async getAll<T = unknown>(storeName: StoreName): Promise<T[]> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error(`读取所有数据失败: ${storeName}`))
    })
  }

  /**
   * 批量读取数据
   * @param storeName 表名
   * @param keys 主键数组
   */
  async getMany<T = unknown>(storeName: StoreName, keys: string[]): Promise<T[]> {
    const db = await this.init()
    const results: T[] = []

    if (keys.length === 0) {
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)

      let completed = 0
      let hasError = false

      keys.forEach(key => {
        const request = store.get(key)

        request.onsuccess = () => {
          if (request.result) {
            results.push(request.result)
          }
          completed++
          if (completed === keys.length && !hasError) {
            resolve(results)
          }
        }

        request.onerror = () => {
          hasError = true
          reject(new Error(`批量读取失败: ${storeName}[${key}]`))
        }
      })
    })
  }

  /**
   * 删除数据
   * @param storeName 表名
   * @param key 主键或键
   */
  async delete(storeName: StoreName, key: string): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`删除数据失败: ${storeName}[${key}]`))
    })
  }

  /**
   * 清空指定表
   * @param storeName 表名
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`清空表失败: ${storeName}`))
    })
  }

  /**
   * 清空所有表
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.clear(STORE_NAMES.SYSTEM),
      this.clear(STORE_NAMES.CATEGORY),
      this.clear(STORE_NAMES.LINK),
      this.clear(STORE_NAMES.LINK_GROUP)
    ])
  }
}

// 导出单例
export const db = new LocalTabDB()

