import { dump } from 'js-yaml'
import { frontmatterToMarkdown } from 'mdast-util-frontmatter'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { toMdast as hastToMdast } from 'hast-util-to-mdast'
import { toMarkdown as mdastToMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import type { ContentRaw } from '../lib/types.ts'
import { normalizeFormatOptions } from './internal.ts'

export type FormatOptions = {}
export async function toFrontmatterString(
  src: ContentRaw,
  _opts?: FormatOptions
): Promise<string> {
  if (src.props || src.header) {
    const q: { [key: string]: any } = {}
    if (src.props && src.header) {
      q.header = src.header // 確実ではないが、frontmatter にしたときにheader が先にくるような気がする。
      q.props = src.props
    } else if (src.props) {
      Object.assign(q, src.props)
    } else if (src.header) {
      Object.assign(q, src.header)
    }
    const yaml = dump(q).slice(0, -1)
    /*let yaml = dump(q)
    const l = yaml.length - 1
    if (yaml[l] === '\n') {
      yaml = yaml.slice(0, l)
    }*/
    return mdastToMarkdown(
      {
        type: 'root' as const,
        children: [
          {
            type: 'yaml' as const,
            value: yaml
          }
        ]
      },
      {
        extensions: [frontmatterToMarkdown(['yaml'])]
      }
    )
  }
  return mdastToMarkdown(
    {
      type: 'root' as const,
      children: [
        {
          type: 'yaml' as const,
          value: ''
        }
      ]
    },
    {
      extensions: [frontmatterToMarkdown(['yaml'])]
    }
  )
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
