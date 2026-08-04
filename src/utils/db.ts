/**
 * IndexedDB 通用数据库封装
 * 纯粹的数据访问层，只提供基础的 CRUD 操作
 */

const DB_NAME = 'LocalTabDB'
// 数据库版本 用于升级数据库,当数据库版本号发生变化时,会触发 onupgradeneeded 事件
const DB_VERSION = 3
// v2 及更早版本使用的系统设置表
const LEGACY_SETTINGS_STORE_NAME = 'settings'

// 对象存储名称常量
export const STORE_NAMES = {
  SYSTEM: 'system',
  CATEGORY: 'category',
  LINK: 'link',
  LINK_GROUP: 'linkGroup'
} as const

export type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES]

export type KeyValueEntry = {
  key: string
  value: unknown
}

export type ReplaceAllData = {
  categories: unknown[]
  links: unknown[]
  linkGroups: unknown[]
  system: KeyValueEntry[]
}

export type AppendAllData = {
  categories: unknown[]
  links: unknown[]
  linkGroups: unknown[]
}

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
        // 当前升级事务
        const transaction = request.transaction
        // 升级前是否已存在新版系统设置表
        const hasSystemStore = db.objectStoreNames.contains(STORE_NAMES.SYSTEM)
        // 新版系统设置表
        let systemStore: IDBObjectStore

        // 创建 system 表（键值对存储）
        if (!hasSystemStore) {
          systemStore = db.createObjectStore(STORE_NAMES.SYSTEM)
        } else {
          systemStore = transaction!.objectStore(STORE_NAMES.SYSTEM)
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

        // 仅在首次创建 system 表时迁移旧 settings 数据，避免覆盖新版设置
        if (
          !hasSystemStore &&
          transaction &&
          db.objectStoreNames.contains(LEGACY_SETTINGS_STORE_NAME)
        ) {
          const legacyStore = transaction.objectStore(LEGACY_SETTINGS_STORE_NAME)
          const cursorRequest = legacyStore.openCursor()

          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result
            if (!cursor) return

            systemStore.put(cursor.value, cursor.key)
            cursor.continue()
          }
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

  /**
   * 在单个事务中用导入数据替换全部本地数据。
   * 任意清空或写入操作失败时，整个事务都会回滚。
   */
  async replaceAll(data: ReplaceAllData): Promise<void> {
    const db = await this.init()
    const storeNames = [
      STORE_NAMES.SYSTEM,
      STORE_NAMES.CATEGORY,
      STORE_NAMES.LINK,
      STORE_NAMES.LINK_GROUP
    ] as const

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite')
      let isSettled = false

      const rejectOnce = (error: unknown) => {
        if (isSettled) return
        isSettled = true
        reject(error instanceof Error ? error : new Error('替换数据库数据失败'))
      }

      transaction.oncomplete = () => {
        if (isSettled) return
        isSettled = true
        resolve()
      }
      transaction.onabort = () => {
        rejectOnce(transaction.error ?? new Error('替换数据库数据失败，事务已回滚'))
      }

      try {
        const systemStore = transaction.objectStore(STORE_NAMES.SYSTEM)
        const categoryStore = transaction.objectStore(STORE_NAMES.CATEGORY)
        const linkStore = transaction.objectStore(STORE_NAMES.LINK)
        const linkGroupStore = transaction.objectStore(STORE_NAMES.LINK_GROUP)

        systemStore.clear()
        categoryStore.clear()
        linkStore.clear()
        linkGroupStore.clear()

        for (const entry of data.system) {
          systemStore.put(entry.value, entry.key)
        }
        for (const category of data.categories) {
          categoryStore.put(category)
        }
        for (const link of data.links) {
          linkStore.put(link)
        }
        for (const linkGroup of data.linkGroups) {
          linkGroupStore.put(linkGroup)
        }
      } catch (error) {
        try {
          transaction.abort()
        } catch {
          // 事务可能已因同步请求错误而自动进入终止状态
        }
        rejectOnce(error)
      }
    })
  }

  /**
   * 在单个事务中追加分类、网址和文件夹。
   * 任意主键冲突或写入失败时，整个事务都会回滚。
   */
  async appendAll(data: AppendAllData): Promise<void> {
    // 当前数据库连接
    const db = await this.init()
    // 浏览器书签导入涉及的业务表
    const storeNames = [
      STORE_NAMES.CATEGORY,
      STORE_NAMES.LINK,
      STORE_NAMES.LINK_GROUP
    ] as const

    return new Promise((resolve, reject) => {
      // 覆盖全部导入记录的单个写事务
      const transaction = db.transaction(storeNames, 'readwrite')
      // 当前事务是否已经完成回调
      let isSettled = false

      /** 只拒绝一次当前事务 Promise。 */
      const rejectOnce = (error: unknown) => {
        if (isSettled) return
        isSettled = true
        reject(error instanceof Error ? error : new Error('追加数据库数据失败'))
      }

      transaction.oncomplete = () => {
        if (isSettled) return
        isSettled = true
        resolve()
      }
      transaction.onabort = () => {
        rejectOnce(transaction.error ?? new Error('追加数据库数据失败，事务已回滚'))
      }

      try {
        // 分类对象表
        const categoryStore = transaction.objectStore(STORE_NAMES.CATEGORY)
        // 网址对象表
        const linkStore = transaction.objectStore(STORE_NAMES.LINK)
        // 文件夹对象表
        const linkGroupStore = transaction.objectStore(STORE_NAMES.LINK_GROUP)

        // 以新增语义写入分类，避免覆盖意外重复的主键
        for (const category of data.categories) {
          categoryStore.add(category)
        }
        // 以新增语义写入网址，避免覆盖意外重复的主键
        for (const link of data.links) {
          linkStore.add(link)
        }
        // 以新增语义写入文件夹，避免覆盖意外重复的主键
        for (const linkGroup of data.linkGroups) {
          linkGroupStore.add(linkGroup)
        }
      } catch (error) {
        try {
          transaction.abort()
        } catch {
          // 事务可能已因同步请求错误而自动进入终止状态
        }
        rejectOnce(error)
      }
    })
  }
}

// 导出单例
export const db = new LocalTabDB()

