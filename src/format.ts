import matter from 'gray-matter'
import type { Nodes } from 'hast-util-to-mdast/lib'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { toMdast as hastToMdast } from 'hast-util-to-mdast'
import { toMarkdown as mdastToMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { sanitize, defaultSchema } from 'hast-util-sanitize'
import type { Schema } from 'hast-util-sanitize'
import { ContentRaw } from './lib/types'

type FormatOptions = {
  sanitizeSchema?: Schema | boolean
}

export function normalizeFormatOptions(opts?: FormatOptions): FormatOptions {
  if (typeof opts === 'object' && opts !== null) {
    return opts
  }
  return {}
}

function sanitizeTree(tree: Nodes, opts: FormatOptions): Nodes {
  if (opts.sanitizeSchema === false) {
    return tree
  } else if (opts.sanitizeSchema === true) {
    return sanitize(tree, defaultSchema)
  }
  return sanitize(tree, opts.sanitizeSchema || defaultSchema)
}

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

function isNodes(content: ContentRaw['content']): content is Nodes {
  return (
    content !== undefined &&
    ((content as any).type === 'root' ||
      (content as any).type === 'element' ||
      (content as any).type === 'text' ||
      (content as any).type === 'comment' ||
      (content as any).type === 'doctype')
  )
}

export async function toHtmlString(
  src: ContentRaw,
  inOpts?: FormatOptions
): Promise<string> {
  const opts = normalizeFormatOptions(inOpts)
  if (isNodes(src.content)) {
    const node = sanitizeTree(src.content, opts)
    return hastToHtml(node)
  }
  return ''
}

export async function toHMarkdownString(
  src: ContentRaw,
  inOpts?: FormatOptions
): Promise<string> {
  const opts = normalizeFormatOptions(inOpts)
  if (isNodes(src.content)) {
    const node = sanitizeTree(src.content, opts)
    return mdastToMarkdown(hastToMdast(node), {
      extensions: [gfmToMarkdown()]
    })
  }
  return ''
}
