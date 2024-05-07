# notion2content

Notion のデータベースを変換しダウンロードするライブラリーとサンプル実装としての CLI ツール。

- Properties は Frontmatter で扱いやすい JSON へ変換
- Blocks は [hast](https://github.com/syntax-tree/hast) へ変換(CLI ツールでは hast から HTML/Markdown へ変換)

実装中。

## Install

CLI ツールとしてインストール。

```
npm install -g notion2content
```

ライブラリーとしてインストール。

```
npm install --save notion2content
```

## Usage

データベースを ndjson(JSON Lines) として出力。

```
$ export NOTION2CONTENT_API_KEY=<NOTION API KEY>
$ notion2content dist/main.js --database-id <DATABASE ID>
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
```

ページ別にファイルへ保存。HTML と Markdown の場合は Propery が Frontmatter となる。

```
$ notion2content dist/main.js --database-id <DATABASE ID> --save-dir ./tmp --save-format md
$ ll tmp
total 20
drwxrwxrwx+  2 vscode vscode 4096 Sep 30 16:15 ./
drwxrwxrwx+ 12 vscode root   4096 Sep 30 15:16 ../
-rw-rw-rw-   1 vscode vscode   41 Sep 30 16:15 *****.md
-rw-rw-rw-   1 vscode vscode   38 Sep 30 16:15 *****.md
-rw-rw-rw-   1 vscode vscode   48 Sep 30 16:15 *****.md
```

## API

### `Client` abstract class

[`@notionhq/client`](https://www.npmjs.com/package/@notionhq/client) を使った実装方法。

```typescript
import { Client as NotionClient } from '@notionhq/client'
import { ClientOptions } from '@notionhq/client/build/src/Client'
import { Client } from 'notion2content'

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

const client = new CliClient({
  auth: 'youre api key'
})
```

### `toContent` function

```typescript
import { toContent } from 'notion2content'
const client = new CliClient({
  auth: 'youre api key'
})
const ite = toContent(client, {
  target: ['props', 'content'],
  query: { database_id: '*****' },
  toItemsOpts: {},
  toHastOpts: {}
})
for await (const content of ite) {
  console.log(`${JSON.stringify(content)}\n`)
}
```

#### Options

##### `inOpts.target`

`props` と `content` のどちらを変換するか配列で指定(同時にどちらも指定可能)

##### `inOpts.workersNum`

`content` の変換(child ブロックのフェッチ)を並行で行う数。

##### `inOpts.query`

Notion Clinet の `databases.query` へ渡す引数。

##### `inOpts.skip`

`query` で取得したデータをスキップする数。

##### `inOpts.limit`

`query` で取得したデータを制限する数。

##### `inOpts.toItemsOpts.initialIndex`

`props` に追加する index の初期値。

index とは `toContent` が返す iterator から取得したときに `props` に追加する連番。

##### `inOpts.toItemsOpts.indexName`

`props` に追加する index 名。

##### `inOpts.toItemsOpts.toHastOpts`

[`notion2hast`](https://github.com/hankei6km/notion2hast) の `blockToHast` へ渡すオプション.

## 対応状況

### Properties

- [x] number - `null` は `0` へ変換される
- [x] url - plain text へ変換される
- [x] select - `null` はブランクへ変換される
- [x] multi_select
- [x] status - plain text へ変換される
- [x] date - [Date property values](https://developers.notion.com/reference/property-item-object#date-property-values) を出力(`null` は '' へ変換される)
- [x] email - plain text へ変換される
- [x] phone_number - plain text へ変換される
- [x] checkbox - boolean へ変換される
- [ ] files
- [x] created_by - [Created by property values](https://developers.notion.com/reference/property-item-object#created-by-property-values)を出力(`person` のみ対応、`null` と `undefined` は `''` へ変換される)
- [x] created_time - plain text へ変換される
- [x] last_edited_by - [Last edited by property values](https://developers.notion.com/reference/property-item-object#last-edited-by-property-values)を出力(`person` のみ対応、`null` と `undefined` は `''` へ変換される)
- [x] last_edited_time - plain text へ変換される
- [ ] formula
- [x] title - plain text へ変換される
- [x] rich_text - plain text へ変換される
- [x] people - [People property values](https://developers.notion.com/reference/property-item-object#people-property-values)を出力(`person` のみ対応、`null` と `undefined` は `''` へ変換される)
- [x] relation - id の配列へ変換
- [ ] rollup

### Blocks

Blocks の変換は [notion2hast](https://github.com/hankei6km/notion2hast#%E5%AF%BE%E5%BF%9C%E7%8A%B6%E6%B3%81) で対応。

## License

MIT License

Copyright (c) 2022 hankei6km
