import matter from 'gray-matter'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { toMdast as hastToMdast } from 'hast-util-to-mdast'
import { toMarkdown as mdastToMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { ContentRaw } from './lib/types'

export function normalizeFormatOptions(
  opts?: Format.FormatOptions
): Format.FormatOptions {
  if (typeof opts === 'object' && opts !== null) {
    return opts
  }
  return {}
}

export namespace Format {
  export type FormatOptions = {}
  export async function toFrontmatterString(
    src: ContentRaw,
    _opts?: FormatOptions
  ): Promise<string> {
    if (src.props) {
      const s = matter.stringify('', src.props)
      const l = s.length - 1
      const i = s.lastIndexOf('\n')
      if (i === l) {
        return s.slice(0, l)
      }
      // gray-matter の挙動が変更されないかぎり、ここに到達することはない
      return s
    }
    return '---\n---\n'
  }

  export async function toHtmlString(
    src: ContentRaw,
    inOpts?: FormatOptions
  ): Promise<string> {
    const opts = normalizeFormatOptions(inOpts)
    if (src.content) {
      return hastToHtml(src.content)
    }
    return ''
  }

  export async function toMarkdownString(
    src: ContentRaw,
    inOpts?: FormatOptions
  ): Promise<string> {
    const opts = normalizeFormatOptions(inOpts)
    if (src.content) {
      return mdastToMarkdown(hastToMdast(src.content), {
        extensions: [gfmToMarkdown()]
      })
    }
    return ''
  }
}
