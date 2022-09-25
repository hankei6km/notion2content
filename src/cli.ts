import { Writable } from 'node:stream'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Client as NotionClient } from '@notionhq/client'
import { ClientOptions } from '@notionhq/client/build/src/Client'
import { Client } from './lib/client.js'
import { toContent } from './lib/notion2content.js'
import {
  toFrontmatterString,
  toHMarkdownString,
  toHtmlString
} from './format.js'
import { ContentRaw, ToContentOpts } from './lib/types.js'

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

type Opts = {
  apiKey: string
  databaseId: string
  workersNum?: number
  skip?: number
  limit?: number
  defaultClassName?: boolean
  toHtml?: boolean
  saveDir?: string
  saveFormat?: 'json' | 'html' | 'md'
  outputTarget?: 'both' | 'props' | 'content'
  initialIndex?: number
  indexName?: string
  stdout: Writable
  stderr: Writable
}

export async function contentToString(
  { saveDir, saveFormat }: Pick<Opts, 'saveDir' | 'saveFormat'>,
  content: ContentRaw
): Promise<string> {
  if (saveDir && saveFormat && saveFormat !== 'json') {
    const frontMatter = await toFrontmatterString(content)
    if (saveFormat === 'html') {
      return `${frontMatter}\n${await toHtmlString(content)}`
    } else if (saveFormat === 'md') {
      return `${frontMatter}\n${await toHMarkdownString(content)}`
    }
  }
  return `${JSON.stringify(content)}`
}
export function targetArray(
  outputTarget: Opts['outputTarget']
): ToContentOpts['target'] {
  if (outputTarget) {
    if (outputTarget == 'both') {
      return ['props', 'content']
    } else {
      return outputTarget === 'props' ? ['props'] : ['content']
    }
  }

  return
}

export const cli = async ({
  apiKey,
  databaseId,
  workersNum,
  skip,
  limit,
  defaultClassName,
  saveDir,
  saveFormat,
  outputTarget,
  initialIndex,
  indexName,
  toHtml,
  stdout,
  stderr
}: Opts): Promise<number> => {
  try {
    const client = new CliClient({
      auth: apiKey
    })
    const ite = toContent(client, {
      target: targetArray(outputTarget),
      workersNum,
      skip,
      limit,
      query: { database_id: databaseId },
      toItemsOpts: { indexName, initialIndex },
      toHastOpts: {
        blocktoHastOpts: { defaultClassName },
        richTexttoHastOpts: { defaultClassName }
      }
    })
    for await (const content of ite) {
      if (saveDir) {
        // TODO: props と content を別々に string にして順次書き込む
        await writeFile(
          `${join(saveDir, content.id)}.${saveFormat}`,
          await contentToString({ saveDir, saveFormat }, content)
        )
      } else {
        stdout.write(`${JSON.stringify(content)}\n`)
      }
    }
  } catch (err: any) {
    stderr.write(err.toString())
    stderr.write('\n')
    return 1
  }
  return 0
}
