/**
 * 链接服务
 * 处理链接的业务逻辑
 */

import { db, STORE_NAMES } from "../utils/db";
import type { link } from "../type/db";
import { getUniqueId } from "../utils/base";
import { LinkType } from "@/type/db";

export class LinkService {
  /**
   * 创建链接
   */
  async createLink(link: link): Promise<void> {
    // 可以在这里添加 URL 验证等业务逻辑
    this.validateUrl(link.url);
    await db.put(STORE_NAMES.LINK, link);
  }

  /* 获取parentId下的链接数量 */
  async getLinkCountByParentId(parentId: string): Promise<link[]> {
    const links = await this.getAllLinks();
    return links.filter((link) => link.parentId === parentId);
  }

  /**
   * 更新链接,如果链接不存在，则创建链接
   */
  async updateLink(link: Partial<link>): Promise<void> {
    if (link.url) {
      this.validateUrl(link.url);
    }

    let existingLink: link | undefined;
    if (link.id) {
      existingLink = await this.getLink(link.id);
    }

    const links = await this.getLinkCountByParentId(link.parentId || "");
    const length = links.length;

    const result: link = {
      id: link.id || existingLink?.id || getUniqueId(),
      title: link.title || existingLink?.title || "",
      url: link.url || existingLink?.url || "",
      icon: link.icon || existingLink?.icon || "",
      description: link.description || existingLink?.description || "",
      parentId: link.parentId || existingLink?.parentId || "",
      type: link.type || existingLink?.type || LinkType.LINK,
      sort: link.sort !== undefined ? link.sort : length,
    };

    await db.put(STORE_NAMES.LINK, result);
  }

  /**
   * 获取单个链接
   */
  async getLink(id: string): Promise<link | undefined> {
    return await db.get<link>(STORE_NAMES.LINK, id);
  }

  /**
   * 获取所有链接
   */
  async getAllLinks(): Promise<link[]> {
    return await db.getAll<link>(STORE_NAMES.LINK);
  }

  /**
   * 批量获取链接
   */
  async getLinksByIds(ids: string[]): Promise<link[]> {
    return await db.getMany<link>(STORE_NAMES.LINK, ids);
  }

  /**
   * @description 删除链接
   * @param parentId 父级ID
   * @param id 链接ID
   * @param isResetSort 是否重置排序
   */
  async deleteLink(parentId: string,id: string ,isResetSort: boolean = true): Promise<void> {    
    // 更新其他链接的排序
    const links = await this.getLinkCountByParentId(parentId);

    const deleteLink = links.find((link) => link.id === id);
    const delSort = deleteLink!.sort;

    if(isResetSort){
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
    const links = await this.getAllLinks();
    //删除所有链接
    for (const link of links) {
      if (link.parentId === parentId) {
        await this.deleteLink(parentId, link.id, false);
      }
    }
  }
}

// 导出单例
export const linkService = new LinkService();
