import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Format } from '../../src/format/index.ts'
import { normalizeFormatOptions } from '../../src/format/internal.ts'

describe('normalizeFormatOptions()', () => {
  it('should return normalized options', async () => {
    assert.deepStrictEqual(normalizeFormatOptions(), {})
    assert.deepStrictEqual(normalizeFormatOptions({}), {})
  })
})

describe('toFrontmatterString()', () => {
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
  it('should convert object to frontmatter string(header)', async () => {
    assert.strictEqual(
      await Format.toFrontmatterString({
        id: 'test-id',
        header: { id: 'test-id' }
      }),
      '---\nid: test-id\n---\n'
    )
  })
  it('should convert object to frontmatter string(header and props)', async () => {
    assert.strictEqual(
      await Format.toFrontmatterString({
        id: 'test-id',
        header: { id: 'test-id' },
        props: { 'test-key': 'test-value' }
      }),
      '---\nheader:\n  id: test-id\nprops:\n  test-key: test-value\n---\n'
    )
  })
})

describe('toHtmlString()', () => {
  it('should convert hast to html string', async () => {
    assert.strictEqual(await Format.toHtmlString({ id: 'test-id' }), '')
    assert.strictEqual(
      await Format.toHtmlString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      }),
      'test-text'
    )
    assert.strictEqual(
      await Format.toHtmlString({
        id: 'test-id',
        content: {
          type: 'element',
          tagName: 'a',
          properties: { href: 'https://example.com' },
          children: []
        }
      }),
      '<a href="https://example.com"></a>'
    )
    assert.strictEqual(
      await Format.toHtmlString(
        {
          id: 'test-id',
          content: {
            type: 'element',
            tagName: 'a',
            properties: { href: 'javascrpt:alert(123)' },
            children: [{ type: 'text', value: 'test-text' }]
          }
        },
        {}
      ),
      '<a href="javascrpt:alert(123)">test-text</a>'
    )
  })
})

describe('toMarkdownString()', () => {
  it('should convert hast to markdown string', async () => {
    assert.strictEqual(await Format.toMarkdownString({ id: 'test-id' }), '')
    assert.strictEqual(
      await Format.toMarkdownString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      }),
      'test-text\n'
    )
    assert.strictEqual(
      await Format.toMarkdownString(
        {
          id: 'test-id',
          content: {
            type: 'element',
            tagName: 'a',
            properties: { href: 'javascrpt:alert(123)' },
            children: [{ type: 'text', value: 'test-text' }]
          }
        },
        {}
      ),
      '[test-text](javascrpt:alert\\(123\\))\n'
    )
  })
})
