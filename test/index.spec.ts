import { jest } from '@jest/globals'
import { Client as NotionClient } from '@notionhq/client'
import { ClientOptions } from '@notionhq/client/build/src/Client'
import { Client, toContent, Format } from '../src/index.js'

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
    expect(client).toBeInstanceOf(Client)
    expect(client.listBlockChildren).toBeInstanceOf(Function)
    expect(client.queryDatabases).toBeInstanceOf(Function)
  })
})

describe('toContent()', () => {
  it('should use a Client instance in toContent()', async () => {
    class MockClient extends Client {
      public queryDatabasesMock = jest.fn()
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
    expect(res).toEqual({ done: true, value: undefined })
    expect(client.queryDatabasesMock).toHaveBeenCalledWith({
      database_id: 'test',
      start_cursor: undefined
    })
  })
})

describe('Format.toFrontmatterString()', () => {
  it('should convert object to frontmatter string', async () => {
    expect(await Format.toFrontmatterString({ id: 'test-id' })).toEqual(
      '---\n---\n'
    )
    expect(
      await Format.toFrontmatterString({
        id: 'test-id',
        props: { 'test-key': 'test-value' }
      })
    ).toEqual('---\ntest-key: test-value\n---\n')
  })
})

describe('Format.toHtmlString()', () => {
  it('should convert hast to html string', async () => {
    expect(await Format.toHtmlString({ id: 'test-id' })).toEqual('')
    expect(
      await Format.toHtmlString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      })
    ).toEqual('test-text')
  })
})

describe('Format.toMarkdownString()', () => {
  it('should convert hast to markdown string', async () => {
    expect(await Format.toMarkdownString({ id: 'test-id' })).toEqual('')
    expect(
      await Format.toMarkdownString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      })
    ).toEqual('test-text\n')
  })
})
