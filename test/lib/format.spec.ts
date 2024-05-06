import { normalizeFormatOptions, Format } from '../../src/format'

describe('normalizeFormatOptions()', () => {
  it('should return normalized options', async () => {
    expect(normalizeFormatOptions()).toEqual({})
    expect(normalizeFormatOptions({ sanitizeSchema: false })).toEqual({
      sanitizeSchema: false
    })
  })
})

describe('toFrontmatterString()', () => {
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

describe('toHtmlString()', () => {
  it('should convert hast to html string', async () => {
    expect(await Format.toHtmlString({ id: 'test-id' })).toEqual('')
    expect(
      await Format.toHtmlString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      })
    ).toEqual('test-text')
    expect(
      await Format.toHtmlString({
        id: 'test-id',
        content: {
          type: 'element',
          tagName: 'a',
          properties: { href: 'https://example.com' },
          children: []
        }
      })
    ).toEqual('<a href="https://example.com"></a>')
    expect(
      await Format.toHtmlString({
        id: 'test-id',
        content: {
          type: 'element',
          tagName: 'a',
          properties: { href: 'javascrpt:alert(123)' },
          children: [{ type: 'text', value: 'test-text' }]
        }
      })
    ).toEqual('<a>test-text</a>') // sanitized
    expect(
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
        { sanitizeSchema: false }
      )
    ).toEqual('<a href="javascrpt:alert(123)">test-text</a>')
  })
})

describe('toHMarkdownString()', () => {
  it('should convert hast to markdown string', async () => {
    expect(await Format.toHMarkdownString({ id: 'test-id' })).toEqual('')
    expect(
      await Format.toHMarkdownString({
        id: 'test-id',
        content: { type: 'text', value: 'test-text' }
      })
    ).toEqual('test-text\n')
    expect(
      await Format.toHMarkdownString({
        id: 'test-id',
        content: {
          type: 'element',
          tagName: 'a',
          properties: { href: 'javascrpt:alert(123)' },
          children: [{ type: 'text', value: 'test-text' }]
        }
      })
    ).toEqual('[test-text]()\n') // sanitized
    expect(
      await Format.toHMarkdownString(
        {
          id: 'test-id',
          content: {
            type: 'element',
            tagName: 'a',
            properties: { href: 'javascrpt:alert(123)' },
            children: [{ type: 'text', value: 'test-text' }]
          }
        },
        { sanitizeSchema: false }
      )
    ).toEqual('[test-text](javascrpt:alert\\(123\\))\n')
  })
})
