import { db, STORE_NAMES } from '../utils/db'
import type { LinkGroup } from '../type/db'

export class LinkGroupService {
  /**
   * 创建链接组
   */
  async createLinkGroup(linkGroup: LinkGroup): Promise<void> {
    await db.put(STORE_NAMES.LINK_GROUP, linkGroup)
  }


  /* 删除链接组 */
  async deleteLinkGroup(id: string): Promise<void> {
    await db.delete(STORE_NAMES.LINK_GROUP, id)
  }
}