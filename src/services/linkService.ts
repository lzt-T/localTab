/**
 * 链接服务
 * 处理链接的业务逻辑
 */

import { db, STORE_NAMES } from "@/utils/db";
import { LinkType, type Link } from "@/type/db";
import { getUniqueId } from "@/utils/base";

export class LinkService {
  /**
   * 创建链接
   */
  async createLink(link: Link): Promise<void> {
    // 可以在这里添加 URL 验证等业务逻辑
    this.validateUrl(link.url);
    await db.put(STORE_NAMES.LINK, link);
  }

  /* 获取parentId下的链接 */
  async getLinkCountByParentId(parentId: string): Promise<Link[]> {
    // 数据库中的全部网址
    const links = await this.getAllLinks();
    // 指定父级下的网址
    const filteredLinks = links.filter((link) => link.parentId === parentId);
    // 按 sort 字段排序
    return filteredLinks.sort((a, b) => a.sort - b.sort);
  }

  /**
   * 更新链接,如果链接不存在，则创建链接
   */
  async updateLink(link: Partial<Link>): Promise<Link> {
    if (link.url) {
      this.validateUrl(link.url);
    }

    // 当前已存在的网址
    let existingLink: Link | undefined;
    if (link.id) {
      existingLink = await this.getLink(link.id);
    }

    // 目标父级下的现有网址
    const links = await this.getLinkCountByParentId(link.parentId || "");
    // 新网址默认使用的排序位置
    const length = links.length;

    // 合并现有字段后的网址数据
    const result: Link = {
      id: link.id || existingLink?.id || getUniqueId(),
      title: link.title || existingLink?.title || "",
      url: link.url || existingLink?.url || "",
      icon: link.icon || existingLink?.icon || "",
      description: link.description || "",
      parentId: link.parentId || existingLink?.parentId || "",
      type: link.type || existingLink?.type || LinkType.LINK,
      sort:
        link.sort !== undefined
          ? link.sort
          : existingLink
          ? existingLink.sort
          : length,
    };

    await db.put(STORE_NAMES.LINK, result);
    return result;
  }

  /**
   * 获取单个链接
   */
  async getLink(id: string): Promise<Link | undefined> {
    return await db.get<Link>(STORE_NAMES.LINK, id);
  }

  /**
   * 获取所有链接
   */
  async getAllLinks(): Promise<Link[]> {
    return await db.getAll<Link>(STORE_NAMES.LINK);
  }

  /**
   * 批量获取链接
   */
  async getLinksByIds(ids: string[]): Promise<Link[]> {
    return await db.getMany<Link>(STORE_NAMES.LINK, ids);
  }

  /**
   * @description 删除链接
   * @param id 链接ID
   * @param isResetSort 是否重置排序
   */
  async deleteLink(id: string, isResetSort: boolean = true): Promise<void> {
    // 待删除的网址
    const link = await this.getLink(id);
    if (!link) return;
    // 网址所属父级
    const parentId = link.parentId;

    // 更新其他链接的排序
    const links = await this.getLinkCountByParentId(parentId);

    // 父级列表中的待删除网址
    const deleteLink = links.find((link) => link.id === id);
    // 待删除网址的排序位置
    const delSort = deleteLink!.sort;

    if (isResetSort) {
      for (const link of links) {
        if (link.sort > delSort) {
          link.sort = link.sort - 1;
          await this.updateLink(link);
        }
      }
    }

    await db.delete(STORE_NAMES.LINK, id);
  }

  /**
   * 验证 URL 格式
   */
  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error("无效的 URL 格式");
    }
  }

  /* 删除parentId等于parentId的链接 */
  async deleteLinkByParentId(parentId: string): Promise<void> {
    //查询所有链接
    const links = await this.getLinkCountByParentId(parentId);
    //删除所有链接
    for (const link of links) {
      await this.deleteLink(link.id, false);
    }
  }

  /** 按数组顺序保存分类内的链接位置。 */
  private async saveLinkOrder(links: Link[], parentId: string): Promise<void> {
    for (let index = 0; index < links.length; index++) {
      // 当前排序位置对应的网址
      const link = links[index];
      if (link.parentId !== parentId || link.sort !== index) {
        await db.put(STORE_NAMES.LINK, { ...link, parentId, sort: index });
      }
    }
  }

  /** 将链接移动到目标父级的指定位置。 */
  async moveLink(
    linkId: string,
    targetParentId: string,
    targetIndex: number
  ): Promise<void> {
    // 待移动的网址
    const link = await this.getLink(linkId);
    if (!link) {
      return;
    }

    // 网址原所属父级
    const sourceParentId = link.parentId;
    // 原父级中的网址列表
    const sourceLinks = await this.getLinkCountByParentId(sourceParentId);
    // 网址在原父级中的位置
    const sourceIndex = sourceLinks.findIndex((item) => item.id === linkId);

    if (sourceParentId === targetParentId) {
      if (sourceIndex === targetIndex) {
        return;
      }

      // 移除待移动网址后的列表
      const reorderedLinks = sourceLinks.filter((item) => item.id !== linkId);
      // 同一父级内限制后的插入位置
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, reorderedLinks.length)
      );
      reorderedLinks.splice(insertIndex, 0, link);
      await this.saveLinkOrder(reorderedLinks, targetParentId);
      return;
    }

    // 目标父级中的网址列表
    const targetLinks = await this.getLinkCountByParentId(targetParentId);
    // 跨父级移动时限制后的插入位置
    const insertIndex = Math.max(0, Math.min(targetIndex, targetLinks.length));
    // 移除待移动网址后的原父级列表
    const remainingSourceLinks = sourceLinks.filter((item) => item.id !== linkId);
    // 插入网址前的目标父级列表
    const movedTargetLinks = [...targetLinks];
    movedTargetLinks.splice(insertIndex, 0, link);

    await this.saveLinkOrder(remainingSourceLinks, sourceParentId);
    await this.saveLinkOrder(movedTargetLinks, targetParentId);
  }
}

// 导出单例
export const linkService = new LinkService();
