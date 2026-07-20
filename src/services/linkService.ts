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
    const links = await this.getAllLinks();
    const filteredLinks = links.filter((link) => link.parentId === parentId);
    // 按 sort 字段排序
    return filteredLinks.sort((a, b) => a.sort - b.sort);
  }

  /**
   * 更新链接,如果链接不存在，则创建链接
   */
  async updateLink(link: Partial<Link>): Promise<void> {
    if (link.url) {
      this.validateUrl(link.url);
    }

    let existingLink: Link | undefined;
    if (link.id) {
      existingLink = await this.getLink(link.id);
    }

    const links = await this.getLinkCountByParentId(link.parentId || "");
    const length = links.length;

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
    const link = await this.getLink(id);
    if (!link) return;
    const parentId = link.parentId;

    // 更新其他链接的排序
    const links = await this.getLinkCountByParentId(parentId);

    const deleteLink = links.find((link) => link.id === id);
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
      const link = links[index];
      if (link.parentId !== parentId || link.sort !== index) {
        await db.put(STORE_NAMES.LINK, { ...link, parentId, sort: index });
      }
    }
  }

  /** 将链接移动到目标分类的指定位置。 */
  async moveLink(
    linkId: string,
    targetCategoryId: string,
    targetIndex: number
  ): Promise<void> {
    const link = await this.getLink(linkId);
    if (!link) {
      return;
    }

    const sourceCategoryId = link.parentId;
    const sourceLinks = await this.getLinkCountByParentId(sourceCategoryId);
    const sourceIndex = sourceLinks.findIndex((item) => item.id === linkId);

    if (sourceCategoryId === targetCategoryId) {
      if (sourceIndex === targetIndex) {
        return;
      }

      const reorderedLinks = sourceLinks.filter((item) => item.id !== linkId);
      const insertIndex = Math.max(
        0,
        Math.min(targetIndex, reorderedLinks.length)
      );
      reorderedLinks.splice(insertIndex, 0, link);
      await this.saveLinkOrder(reorderedLinks, targetCategoryId);
      return;
    }

    const targetLinks = await this.getLinkCountByParentId(targetCategoryId);
    const insertIndex = Math.max(0, Math.min(targetIndex, targetLinks.length));
    const remainingSourceLinks = sourceLinks.filter((item) => item.id !== linkId);
    const movedTargetLinks = [...targetLinks];
    movedTargetLinks.splice(insertIndex, 0, link);

    await this.saveLinkOrder(remainingSourceLinks, sourceCategoryId);
    await this.saveLinkOrder(movedTargetLinks, targetCategoryId);
  }
}

// 导出单例
export const linkService = new LinkService();
