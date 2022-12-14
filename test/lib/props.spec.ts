import { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { PropsToItems } from '../../src/lib/props.js'

describe('propsToItems()', () => {
  it('should convert enpty properties to empty items', async () => {
    const propsToItems = new PropsToItems()
    expect(await propsToItems.toItems({})).toEqual({})
    expect(await propsToItems.toItems(undefined as any)).toEqual({})
  })

  it('should convert number properties to items', async () => {
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-num': {
          id: '',
          type: 'number',
          number: 10
        }
      })
    ).toEqual({ 'test-num': 10 })
    expect(
      await propsToItems.toItems({
        'test-num': {
          id: '',
          type: 'number',
          number: null
        }
      })
    ).toEqual({ 'test-num': 0 })
  })

  it('should convert select properties to items', async () => {
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-select': {
          id: '',
          type: 'select',
          select: {
            id: '',
            color: 'blue',
            name: 'select1'
          }
        }
      })
    ).toEqual({ 'test-select': 'select1' })
    expect(
      await propsToItems.toItems({
        'test-select': {
          id: '',
          type: 'select',
          select: null
        }
      })
    ).toEqual({ 'test-select': '' })
  })

  it('should convert multi select properties to items', async () => {
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-multi-select': {
          id: '',
          type: 'multi_select',
          multi_select: [
            {
              id: '',
              color: 'blue',
              name: 'select1'
            },
            {
              id: '',
              color: 'blue',
              name: 'select2'
            }
          ]
        }
      })
    ).toEqual({ 'test-multi-select': ['select1', 'select2'] })
    expect(
      await propsToItems.toItems({
        'test-multi-select': {
          id: '',
          type: 'multi_select',
          multi_select: []
        }
      })
    ).toEqual({ 'test-multi-select': [] })
  })

  it('should convert title properties to items', async () => {
    const mockRichText: (text: string) => RichTextItemResponse = (text) => ({
      type: 'text',
      text: { content: '', link: null },
      href: null,
      annotations: {
        bold: false,
        code: false,
        color: 'default',
        italic: false,
        strikethrough: false,
        underline: false
      },
      plain_text: text
    })
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-title': {
          id: '',
          type: 'title',
          title: [mockRichText('text1')]
        }
      })
    ).toEqual({ 'test-title': 'text1' })
    expect(
      await propsToItems.toItems({
        'test-title': {
          id: '',
          type: 'title',
          title: [mockRichText('text1'), mockRichText('text2')]
        }
      })
    ).toEqual({ 'test-title': 'text1text2' })
  })

  it('should convert rich_text properties to items', async () => {
    const mockRichText: (text: string) => RichTextItemResponse = (text) => ({
      type: 'text',
      text: { content: '', link: null },
      href: null,
      annotations: {
        bold: false,
        code: false,
        color: 'default',
        italic: false,
        strikethrough: false,
        underline: false
      },
      plain_text: text
    })
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-rich': {
          id: '',
          type: 'rich_text',
          rich_text: [mockRichText('text1')]
        }
      })
    ).toEqual({ 'test-rich': 'text1' })
    expect(
      await propsToItems.toItems({
        'test-rich': {
          id: '',
          type: 'rich_text',
          rich_text: [mockRichText('text1'), mockRichText('text2')]
        }
      })
    ).toEqual({ 'test-rich': 'text1text2' })
  })

  it('should convert relation properties to items', async () => {
    const propsToItems = new PropsToItems()
    expect(
      await propsToItems.toItems({
        'test-relation': {
          id: '',
          type: 'relation',
          relation: [
            {
              id: 'test-rel-id-1'
            },
            {
              id: 'test-rel-id-2'
            }
          ]
        }
      })
    ).toEqual({ 'test-relation': ['test-rel-id-1', 'test-rel-id-2'] })
    expect(
      await propsToItems.toItems({
        'test-relation': {
          id: '',
          type: 'relation',
          relation: []
        }
      })
    ).toEqual({ 'test-relation': [] })
  })
})
