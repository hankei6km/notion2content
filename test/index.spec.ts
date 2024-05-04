import { jest } from '@jest/globals'
import { Client as NotionClient } from '@notionhq/client'
import { ClientOptions } from '@notionhq/client/build/src/Client'
import { Client, toContent } from '../src/index.js'

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
