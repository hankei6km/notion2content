import { Client as NotionClient } from '@notionhq/client'
import { ClientOptions } from '@notionhq/client/build/src/Client'
import { Client } from '../src/index.js'

describe('Class()', () => {
  it('should create an instance of Client', async () => {
    class CliClient extends Client {
      private client: NotionClient
      constructor(options?: ClientOptions) {
        super()
        this.client = new NotionClient(options)
      }
      async queryDatabases(
        ...args: Parameters<NotionClient['databases']['query']>
      ): Promise<ReturnType<NotionClient['databases']['query']>> {
        return this.client.databases.query(...args)
      }
      async listBlockChildren(
        ...args: Parameters<NotionClient['blocks']['children']['list']>
      ): Promise<ReturnType<NotionClient['blocks']['children']['list']>> {
        return this.client.blocks.children.list(...args)
      }
    }
    const client = new CliClient()
    expect(client).toBeInstanceOf(Client)
    expect(client.listBlockChildren).toBeInstanceOf(Function)
    expect(client.queryDatabases).toBeInstanceOf(Function)
  })
})
