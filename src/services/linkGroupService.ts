import { db, STORE_NAMES } from "@/utils/db";
import { LinkType, type LinkGroup } from "@/type/db";
import { getUniqueId } from "@/utils/base";
import { linkService } from "@/services/linkService";

/** 管理分类内的网址分组及其排序。 */
export class LinkGroupService {
  /** 获取单个网址分组。 */
  async getLinkGroup(id: string): Promise<LinkGroup | undefined> {
    return await db.get<LinkGroup>(STORE_NAMES.LINK_GROUP, id);
  }

  /** 获取分类下按顺序排列的网址分组。 */
  async getLinkGroupsByParentId(parentId: string): Promise<LinkGroup[]> {
    // 数据库中的全部网址分组
    const linkGroups = await db.getAll<LinkGroup>(STORE_NAMES.LINK_GROUP);
    return linkGroups
      .filter((linkGroup) => linkGroup.parentId === parentId)
      .sort((firstGroup, secondGroup) => firstGroup.sort - secondGroup.sort);
  }

  /** 创建分类内的网址分组。 */
  async createLinkGroup(name: string, parentId: string): Promise<LinkGroup> {
    // 当前分类已有的网址分组
    const linkGroups = await this.getLinkGroupsByParentId(parentId);
    // 新建的网址分组
    const linkGroup: LinkGroup = {
      id: getUniqueId(),
      type: LinkType.LINK_GROUP,
      name,
      sort: linkGroups.length,
      description: "",
      parentId,
    };
    await db.put(STORE_NAMES.LINK_GROUP, linkGroup);
    return linkGroup;
  }

  /** 更新网址分组名称。 */
  async updateLinkGroup(id: string, name: string): Promise<void> {
    // 待更新的网址分组
    const linkGroup = await this.getLinkGroup(id);
    if (!linkGroup) {
      return;
    }
    await db.put(STORE_NAMES.LINK_GROUP, { ...linkGroup, name });
  }

  /** 删除分类下的全部网址分组及其网址。 */
  async deleteLinkGroupsByParentId(parentId: string): Promise<void> {
    // 分类下的全部网址分组
    const linkGroups = await this.getLinkGroupsByParentId(parentId);
    for (const linkGroup of linkGroups) {
      await linkService.deleteLinkByParentId(linkGroup.id);
      await db.delete(STORE_NAMES.LINK_GROUP, linkGroup.id);
    }
  }

}

// 网址分组服务单例
export const linkGroupService = new LinkGroupService();
