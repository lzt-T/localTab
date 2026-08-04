/** 浏览器书签树节点的最小只读结构。 */
export interface BrowserBookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BrowserBookmarkNode[];
  folderType?: "bookmarks-bar" | "other" | "mobile" | "managed";
}

/** 浏览器书签读取结果状态。 */
export const BrowserBookmarkReadStatus = {
  SUCCESS: "success",
  UNSUPPORTED: "unsupported",
  DENIED: "denied",
  FAILED: "failed",
} as const;

/** 浏览器书签读取结果状态值。 */
export type BrowserBookmarkReadStatusValue =
  (typeof BrowserBookmarkReadStatus)[keyof typeof BrowserBookmarkReadStatus];

/** 浏览器书签读取结果。 */
export type BrowserBookmarkReadResult =
  | {
      status: typeof BrowserBookmarkReadStatus.SUCCESS;
      tree: BrowserBookmarkNode[];
    }
  | {
      status: Exclude<
        BrowserBookmarkReadStatusValue,
        typeof BrowserBookmarkReadStatus.SUCCESS
      >;
    };

/** Chromium 书签只读接口。 */
interface ChromiumBookmarksApi {
  getTree: () => Promise<BrowserBookmarkNode[]>;
}

/** Chromium 可选权限接口。 */
interface ChromiumPermissionsApi {
  request: (options: { permissions: string[] }) => Promise<boolean>;
  remove: (options: { permissions: string[] }) => Promise<boolean>;
}

/** 当前功能使用的 Chromium 扩展接口。 */
interface ChromiumBookmarkApi {
  bookmarks?: ChromiumBookmarksApi;
  permissions?: ChromiumPermissionsApi;
}

// 浏览器书签可选权限名称
const BOOKMARKS_PERMISSION = "bookmarks";

/** 获取当前页面可用的 Chromium 扩展接口。 */
function getChromiumBookmarkApi(): ChromiumBookmarkApi | undefined {
  // 扩展页面上的 Chromium 全局对象
  return (
    globalThis as typeof globalThis & { chrome?: ChromiumBookmarkApi }
  ).chrome;
}

/** 通过一次性可选权限读取浏览器书签树。 */
export class BrowserBookmarkService {
  /** 检查当前运行环境是否支持直接读取浏览器书签。 */
  isSupported(): boolean {
    // 当前 Chromium 扩展接口
    const chromiumApi = getChromiumBookmarkApi();
    return Boolean(
      chromiumApi?.permissions?.request && chromiumApi.permissions.remove
    );
  }

  /** 申请权限、读取完整书签树并立即释放权限。 */
  async readTree(): Promise<BrowserBookmarkReadResult> {
    // 当前 Chromium 扩展接口
    const chromiumApi = getChromiumBookmarkApi();
    // 授权前可用的权限接口
    const permissionsApi = chromiumApi?.permissions;
    if (!permissionsApi?.request || !permissionsApi.remove) {
      return { status: BrowserBookmarkReadStatus.UNSUPPORTED };
    }

    // 本次操作是否获得书签权限
    let isPermissionGranted = false;
    try {
      isPermissionGranted = await permissionsApi.request({
        permissions: [BOOKMARKS_PERMISSION],
      });
      if (!isPermissionGranted) {
        return { status: BrowserBookmarkReadStatus.DENIED };
      }

      // 授权后重新获取的书签接口
      const bookmarksApi = getChromiumBookmarkApi()?.bookmarks;
      if (!bookmarksApi?.getTree) {
        return { status: BrowserBookmarkReadStatus.UNSUPPORTED };
      }

      // 浏览器返回的完整书签树
      const tree = await bookmarksApi.getTree();
      return { status: BrowserBookmarkReadStatus.SUCCESS, tree };
    } catch (error) {
      console.error("读取浏览器书签失败:", error);
      return { status: BrowserBookmarkReadStatus.FAILED };
    } finally {
      if (isPermissionGranted) {
        await permissionsApi.remove({
          permissions: [BOOKMARKS_PERMISSION],
        });
      }
    }
  }
}

// 浏览器书签只读服务单例
export const browserBookmarkService = new BrowserBookmarkService();
