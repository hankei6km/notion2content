import { Client as NotionClient } from '@notionhq/client'
import { Client as N2hClient } from 'notion2hast'

export type ClientOptions = {
  auth: string
}

export abstract class Client extends N2hClient {
  abstract queryDatabases(
    // args: WithAuth<QueryDatabaseParameters>
    ...args: Parameters<NotionClient['databases']['query']>
  ): Promise<ReturnType<NotionClient['databases']['query']>>
}
