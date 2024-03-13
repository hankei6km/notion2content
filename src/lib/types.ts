import type { Child } from 'hastscript'

import { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints'
import { ToHastOpts } from 'notion2hast/dist/lib/types'

export type OutputTarget = 'props' | 'content'

export type ToContentOpts = {
  target?: OutputTarget[]
  workersNum?: number
  keepOrder?: boolean
  skip?: number
  limit?: number
  query: QueryDatabaseParameters
  toItemsOpts: { indexName?: string; initialIndex?: number }
  toHastOpts: Omit<ToHastOpts, 'block_id' | 'parent'>
}

export type PropsItemValue = string | number | (string | number)[] | boolean
export type PropsItem = Record<string, PropsItemValue>

export type ContentRaw = {
  id: string
  props?: PropsItem
  content?: Child
}
