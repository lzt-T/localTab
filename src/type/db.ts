export type settings = {
  backgroundImage?: string
}

/* 链接类型，链接或链接组 */
export const LinkType = {
  LINK: 'LINK',
  LINK_GROUP: 'LINK_GROUP'
} as const

export type LinkTypeValue = typeof LinkType[keyof typeof LinkType]

/* 类别 */
export type category = {
  id: string
  name: string
  icon: string
  sort: number
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

/* 链接 */
export type link = {
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