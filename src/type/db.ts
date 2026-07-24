export type Settings = {
  backgroundImage?: string
}

/* 浏览器默认搜索引擎标识 */
export const DEFAULT_SEARCH_ENGINE_ID = 'browser-default'

/* 旧版默认搜索引擎标识 */
export const LEGACY_DEFAULT_SEARCH_ENGINE_ID = 'chrome-default'

/* 用户自定义搜索引擎 */
export type CustomSearchEngine = {
  id: string
  name: string
  searchUrl: string
}

/* 链接类型，链接或链接组 */
export const LinkType = {
  LINK: 'LINK',
  LINK_GROUP: 'LINK_GROUP'
} as const

export type LinkTypeValue = typeof LinkType[keyof typeof LinkType]

/* 类别 */
export type Category = {
  id: string
  name: string
  icon: string
  sort: number
}

export type CategoryInfo = Category & {
  links: Link[]
  linkGroups: LinkGroupInfo[]
  items: CategoryGridItem[]
}

/* 链接组 */
export type LinkGroup = {
  id: string
  type: typeof LinkType.LINK_GROUP
  name: string
  sort: number
  description: string
  parentId: string
}

/* 包含组内链接的分组页面数据 */
export type LinkGroupInfo = LinkGroup & {
  links: Link[]
}

/* 链接 */
export type Link = {
  id: string
  type: typeof LinkType.LINK
  sort: number
  description: string
  title: string
  url: string
  icon: string
  /* 所属链接组或分类 */
  parentId: string
}

/* 分类直属网址或文件夹 */
export type CategoryItem = Link | LinkGroup

/* 包含文件夹预览数据的分类网格项目 */
export type CategoryGridItem = Link | LinkGroupInfo
