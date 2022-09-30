import { Client } from './client.js'
import { Client as N2hClient } from 'notion2hast'
import { ContentRaw, ToContentOpts } from './types.js'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { PropsToItems } from './props.js'
import { Chan } from 'chanpuru'
import { blockToHast } from 'notion2hast'

const defaultOpts: Required<ToContentOpts> = {
  target: ['props', 'content'],
  workersNum: 1,
  keepOrder: false,
  skip: 0,
  limit: -1,
  query: { database_id: '' },
  toItemsOpts: { indexName: '', initialIndex: 1 },
  toHastOpts: {}
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
  let pages = await client.queryDatabases(opts)
  let resultsItems = pages.results
  while (resultsItems && resultsItems.length > 0 && !reachedLimit) {
    for (const pageTmp of resultsItems) {
      if (typeof (pageTmp as any).archived === 'boolean') {
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
    }
    resultsItems = []
    if (pages.next_cursor && !reachedLimit) {
      const opts = Object.assign({}, query) // spyOn 対策(履歴は shallow copy)
      opts.start_cursor = pages.next_cursor
      pages = await client.queryDatabases(opts)
      resultsItems = pages.results
    }
  }
}

export async function* toContent(client: Client, inOpts: ToContentOpts) {
  const opts = normalizeOpts(inOpts)
  // TODO: err 用 channle を検討
  const ch = new Chan<Promise<ContentRaw>>(opts.workersNum - 1)
  let err: Error | null = null
  const outProps =
    typeof inOpts.target === 'undefined' || inOpts.target.includes('props')
  const outContent =
    typeof inOpts.target === 'undefined' || inOpts.target.includes('content')
  let index =
    typeof opts.toItemsOpts.initialIndex === 'number'
      ? opts.toItemsOpts.initialIndex
      : 1

  ;(async () => {
    const propsToItems = new PropsToItems()

    try {
      for await (const page of fetchPages(client, opts)) {
        const p = (async (page: PageObjectResponse) => {
          const q: ContentRaw = { id: page.id }
          if (outProps) {
            q.props = await propsToItems.toItems(page.properties).catch((e) => {
              err = new Error(
                `toContent: error from propsToItems.toItems: ${e}, database_id:${opts.query.database_id}, page_id:${page.id}`
              )
              return undefined
            })
            if (typeof q.props === 'object' && opts.toItemsOpts.indexName) {
              q.props[opts.toItemsOpts.indexName] = index++
            }
          }
          if (outContent) {
            q.content = await blockToHast(client as N2hClient, {
              block_id: page.id,
              ...opts.toHastOpts
            }).catch((e) => {
              err = new Error(
                `toContent: error from blockToHast: ${e}, database_id:${opts.query.database_id}, page_id:${page.id}`
              )
              return undefined
            })
          }
          return q
        })(page)

        await ch.send(p)
      }
    } catch (e: any) {
      err = new Error(
        `toContent: error from fetchPages: ${e}, database_id:${opts.query.database_id}`
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
