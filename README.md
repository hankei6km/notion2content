# notion2content

Notion のデータベースを変換しダウンロードするライブラリーとサンプル実装としての CLI ツール。

- Properties は Frontmatter で扱いやすい JSON へ変換
- Blocks は [hast](https://github.com/syntax-tree/hast) へ変換(CLI ツールでは hast から HTML/Markdown へ変換)

実装中。

## Install

まだ NPM へ登録していないのでクローンして以下を実行。

```sh
npm install
npm run build
```

## Usage

データベースを ndjson(JSON Lines) として出力。

```console
$ export NOTION2CONTENT_API_KEY=<NOTION API KEY>
$ node dist/main.js --database-id <DATABASE ID>
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
{"id":"*****","props":{ ... },"content":{"type":"root","children":[ ... ]}}
```

ページ別にファイルへ保存。HTML と Markdown の場合は Propery が Frontmatter となる。

```console
$ node dist/main.js --database-id <DATABASE ID> --save-dir ./tmp --save-format md
$ ll tmp
total 20
drwxrwxrwx+  2 vscode vscode 4096 Sep 30 16:15 ./
drwxrwxrwx+ 12 vscode root   4096 Sep 30 15:16 ../
-rw-rw-rw-   1 vscode vscode   41 Sep 30 16:15 *****.md
-rw-rw-rw-   1 vscode vscode   38 Sep 30 16:15 *****.md
-rw-rw-rw-   1 vscode vscode   48 Sep 30 16:15 *****.md
```

## 対応状況

### Properties

- [x] number - `null` は `0` へ変換される
- [ ] url
- [x] select - `null` はブランクへ変換される
- [x] multi_select
- [ ] status
- [ ] date
- [ ] email
- [ ] phone_number
- [ ] checkbox
- [ ] files
- [ ] created_by
- [ ] created_time
- [ ] last_edited_by
- [ ] last_edited_time
- [ ] formula
- [x] title - plain text へ変換される
- [x] rich_text - plain text へ変換される
- [ ] people
- [x] relation - id の配列へ変換
- [ ] rollup

### Blocks

Blocks の変換は [notion2hast](https://github.com/hankei6km/notion2hast#%E5%AF%BE%E5%BF%9C%E7%8A%B6%E6%B3%81) で対応。

## License

MIT License

Copyright (c) 2022 hankei6km
