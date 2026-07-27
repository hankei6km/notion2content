import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Client as NotionClient } from '@notionhq/client'
import type { ClientOptions } from '@notionhq/client/build/src/Client.d.ts'

import { Client, toContent, Format } from '../src/index.ts'

describe('Class()', () => {
  it('should create an instance of Client', async () => {
    class CliClient extends Client {
      private client: NotionClient
      constructor(options?: ClientOptions) {
        super()
        this.client = new NotionClient(options)
      }
      queryDatabases(
        ...args: Parameters<NotionClient['databases']['query']>
      ): ReturnType<NotionClient['databases']['query']> {
        return this.client.databases.query(...args)
      }
      listBlockChildren(
        ...args: Parameters<NotionClient['blocks']['children']['list']>
      ): ReturnType<NotionClient['blocks']['children']['list']> {
        return this.client.blocks.children.list(...args)
      }
    }
    const client = new CliClient()
    assert.ok(client instanceof Client)
    assert.strictEqual(typeof client.listBlockChildren, 'function')
    assert.strictEqual(typeof client.queryDatabases, 'function')
  })
})

describe('toContent()', () => {
  it('should use a Client instance in toContent()', async (t) => {
    class MockClient extends Client {
      public queryDatabasesMock = t.mock.fn()
      constructor() {
        super()
      }
      queryDatabases(
        ...args: Parameters<NotionClient['databases']['query']>
      ): ReturnType<NotionClient['databases']['query']> {
        this.queryDatabasesMock(...args)
        return {} as any
      }
      listBlockChildren(
        ...args: Parameters<NotionClient['blocks']['children']['list']>
      ): ReturnType<NotionClient['blocks']['children']['list']> {
        return {} as any
      }
    }
    const client = new MockClient()
    const ite = toContent(client, {
      query: { database_id: 'test' },
      toItemsOpts: {
        indexName: '',
        initialIndex: 1
      },
      toHastOpts: {}
    })
    const res = await ite.next()
    assert.deepStrictEqual(res, { done: true, value: undefined })
    assert.deepStrictEqual(
      client.queryDatabasesMock.mock.calls[0].arguments[0],
      {
        database_id: 'test'
        // start_cursor: undefined // 最初の呼び出しでは start_cursor は定義されていない
      }
    )
  })
})

describe('Format.toFrontmatterString()', () => {
  it('should convert object to frontmatter string', async () => {
    assert.strictEqual(
      await Format.toFrontmatterString({ id: 'test-id' }),
      '---\n---\n'
    )
    assert.strictEqual(
      await Format.toFrontmatterString({
        id: 'test-id',
        props: { 'test-key': 'test-value' }
      }),
      '---\ntest-key: test-value\n---\n'
    )
  })
})

describe('Format.toHtmlString()', () => {
  it('should convert hast to html string', async () => {
    assert.strictEqual(await Format.toHtmlString({ id: 'test-id' }), '')
    assert.strictEqual(
      await Format.toHtmlString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      }),
      'test-text'
    )
  })
})

describe('Format.toMarkdownString()', () => {
  it('should convert hast to markdown string', async () => {
    assert.strictEqual(await Format.toMarkdownString({ id: 'test-id' }), '')
    assert.strictEqual(
      await Format.toMarkdownString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      }),
      'test-text\n'
    )
  })
})
