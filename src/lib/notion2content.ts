import { Client } from './client.ts'
import { Client as N2hClient } from 'notion2hast'
import type { ContentRaw, ToContentOpts } from './types.ts'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.d.ts'
import type { Child } from 'hastscript'
import type { toMdast } from 'hast-util-to-mdast'
import { PropsToItems } from './props.ts'
import { HeaderToItems } from './header.ts'
import { Chan } from 'chanpuru'
import { blockToHast } from 'notion2hast'

type Nodes = Parameters<typeof toMdast>[0]

const defaultOpts: Required<ToContentOpts> = {
  target: ['props', 'content'],
  pageObject: false,
  workersNum: 1,
  keepOrder: false,
  skip: 0,
  limit: -1,
  query: { data_source_id: '' },
  toItemsOpts: { indexName: '', initialIndex: 1 },
  toHastOpts: {}
}

function isNodes(content: Child): content is Nodes {
  return (
    content !== undefined &&
    ((content as any).type === 'root' ||
      (content as any).type === 'element' ||
      (content as any).type === 'text' ||
      (content as any).type === 'comment' ||
      (content as any).type === 'doctype')
  )
}

type NormalizedOpts = Required<ToContentOpts>
export function normalizeOpts(inOpts: ToContentOpts): NormalizedOpts {
  const ret = Object.assign({}, defaultOpts, inOpts)
  ret.query = Object.assign({}, defaultOpts.query, inOpts.query)
  ret.toItemsOpts = Object.assign(
    {},
    defaultOpts.toItemsOpts,
    inOpts.toItemsOpts
  )
  ret.toHastOpts = Object.assign({}, defaultOpts.toHastOpts, inOpts.toHastOpts)
  return ret
}

export async function* fetchPages(
  client: Client,
  { skip, limit, query }: Pick<NormalizedOpts, 'skip' | 'limit' | 'query'>
) {
  let skipCount = skip
  let limitCount = 0
  let reachedLimit = false
  const checkLimit: (count: number) => boolean = ((limit: number) => {
    if (limit < 0) {
      return (_count: number) => false
    }
    const l = limit
    return (count: number) => {
      if (count < l) {
        return false
      }
      return true
    }
  })(limit)

  // TODO: limit にあわせて page_size を調整
  const opts = Object.assign({}, query) // start_cursor を書き換えるため
  let pages = await client.queryDataSources(opts)
  let resultsItems = pages.results
  while (resultsItems && resultsItems.length > 0 && !reachedLimit) {
    for (const pageTmp of resultsItems) {
      const page: PageObjectResponse = pageTmp as any
      if (skipCount <= 0) {
        yield page
        limitCount++
        if (checkLimit(limitCount)) {
          reachedLimit = true
          break
        }
      } else {
        skipCount--
      }
    }
    resultsItems = []
    if (pages.next_cursor && !reachedLimit) {
      const opts = Object.assign({}, query) // spyOn 対策(履歴は shallow copy)
      opts.start_cursor = pages.next_cursor
      pages = await client.queryDataSources(opts)
      resultsItems = pages.results
    }
  }
}

export async function* toContent(client: Client, inOpts: ToContentOpts) {
  const opts = normalizeOpts(inOpts)
  // TODO: err 用 channle を検討
  const ch = new Chan<Promise<ContentRaw>>(opts.workersNum - 1)
  let err: Error | null = null
  const outTarget = {
    props: true,
    header: false, // header は互換性のためにデフォルトで false にする
    content: true
  }
  if (Array.isArray(inOpts.target)) {
    outTarget.props = inOpts.target.includes('props')
    outTarget.header = inOpts.target.includes('header')
    outTarget.content = inOpts.target.includes('content')
  }
  let index =
    typeof opts.toItemsOpts.initialIndex === 'number'
      ? opts.toItemsOpts.initialIndex
      : 1

  ;(async () => {
    const propsToItems = new PropsToItems()
    const headerToItems = new HeaderToItems()

    try {
      for await (const page of fetchPages(client, opts)) {
        const p = (async (page: PageObjectResponse) => {
          const q: ContentRaw = { id: page.id }
          if (outTarget.props) {
            q.props = await propsToItems.toItems(page.properties).catch((e) => {
              err = new Error(
                `toContent: error from propsToItems.toItems: ${e}, data_source_id:${opts.query.data_source_id}, page_id:${page.id}`
              )
              return undefined
            })
            if (typeof q.props === 'object' && opts.toItemsOpts.indexName) {
              q.props[opts.toItemsOpts.indexName] = index++
            }
          }
          if (outTarget.header) {
            q.header = await headerToItems.toItems(page).catch((e) => {
              err = new Error(
                `toContent: error from headerToItems.toItems: ${e}, data_source_id:${opts.query.data_source_id}, page_id:${page.id}`
              )
              return undefined
            })
          }
          if (outTarget.content) {
            let content = await blockToHast(client as N2hClient, {
              block_id: page.id,
              ...opts.toHastOpts
            }).catch((e) => {
              err = new Error(
                `toContent: error from blockToHast: ${e}, data_source_id:${opts.query.data_source_id}, page_id:${page.id}`
              )
              return undefined
            })
            if (err === null) {
              if (!isNodes(content)) {
                err = new Error(
                  `toContent: error type of content is not Nodes, data_source_id:${
                    opts.query.data_source_id
                  }, page_id:${page.id}, content:${JSON.stringify(
                    content,
                    null,
                    2
                  )}`
                )
                content = undefined
              }
              q.content = content
            }
          }
          if (opts.pageObject) {
            q.pageObject = page
          }
          return q
        })(page)

        await ch.send(p)
      }
    } catch (e: any) {
      err = new Error(
        `toContent: error from fetchPages: ${e}, data_source_id:${opts.query.data_source_id}`
      )
    }

    ch.close()
  })()

  for await (const i of ch.receiver()) {
    yield i
  }
  if (err) {
    throw err
  }
}
