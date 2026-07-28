import type { FormatOptions } from './format.js'

export function normalizeFormatOptions(opts?: FormatOptions): FormatOptions {
  if (typeof opts === 'object' && opts !== null) {
    return opts
  }
  return {}
}
