/**
 * 服务层统一导出
 */

export { backgroundService } from './backgroundService'
export { categoryService } from './categoryService'
export { linkService } from './linkService'

/**
 * 初始化所有服务
 * 应该在应用启动时调用
 */
export async function initServices(): Promise<void> {
  const { categoryService } = await import('./categoryService')
  await categoryService.init()
}

