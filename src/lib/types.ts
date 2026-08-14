import type { toMdast } from 'hast-util-to-mdast'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.d.ts'
import type { QueryDataSourceParameters } from '@notionhq/client/build/src/api-endpoints.d.ts'
//import { ToHastOpts } from 'notion2hast/dist/lib/types'
import type { blockToHast } from 'notion2hast'
type ToHastOpts = Parameters<typeof blockToHast>[1]

type Nodes = Parameters<typeof toMdast>[0]

export type OutputTarget = 'header' | 'props' | 'content'

export type ToContentOpts = {
  target?: OutputTarget[]
  workersNum?: number
  keepOrder?: boolean
  skip?: number
  limit?: number
  query: QueryDataSourceParameters
  toItemsOpts: { indexName?: string; initialIndex?: number }
  toHastOpts: Omit<ToHastOpts, 'block_id' | 'parent'>
}

export type PropsItemValue =
  | string
  | number
  | (string | number)[]
  | boolean
  | {
      start: string
      end: string
      time_zone: string
    }
  | {
      // user
      name: string
      avatar_url: string
      person: {
        email: string
      }
    }
  | {
      // user(array)
      name: string
      avatar_url: string
      person: {
        email: string
      }
    }[]
  | {
      // group
      name: string
    }
  | {
      // group(array)
      name: string
    }[]

export type PropsItem = Record<string, PropsItemValue>

export type HeaderItemValue =
  | string
  | number
  | boolean
  | Extract<PageObjectResponse['icon'], { type: 'icon' }>['icon']
  | Extract<PageObjectResponse['icon'], { type: 'emoji' }>['emoji']
  | Extract<PageObjectResponse['icon'], { type: 'file' }>['file']
  | Extract<PageObjectResponse['icon'], { type: 'external' }>['external']
  | Extract<
      PageObjectResponse['icon'],
      { type: 'custom_emoji' }
    >['custom_emoji']
  | null

export type HeaderItem = Record<string, HeaderItemValue>

export type ContentRaw = {
  id: string
  props?: PropsItem
  header?: HeaderItem
  content?: Nodes
}
