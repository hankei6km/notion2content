import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints.d.ts'
import { PropsToItems } from '../../src/lib/props.ts'

describe('propsToItems()', () => {
  it('should convert empty properties to empty items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(await propsToItems.toItems({}), {})
    assert.deepStrictEqual(await propsToItems.toItems(undefined as any), {})
  })

  it('should convert number properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-num': {
          id: '',
          type: 'number',
          number: 10
        }
      }),
      { 'test-num': 10 }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-num': {
          id: '',
          type: 'number',
          number: null
        }
      }),
      { 'test-num': 0 }
    )
  })

  it('should convert url properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-url': {
          id: '',
          type: 'url',
          url: 'https://notion.so/notiondevs'
        }
      }),
      { 'test-url': 'https://notion.so/notiondevs' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-url': {
          id: '',
          type: 'url',
          url: null
        }
      }),
      { 'test-url': '' }
    )
  })

  it('should convert checkbox properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-checkbox': {
          id: '',
          type: 'checkbox',
          checkbox: true
        }
      }),
      { 'test-checkbox': true }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-checkbox': {
          id: '',
          type: 'checkbox',
          checkbox: false
        }
      }),
      { 'test-checkbox': false }
    )
  })

  it('should convert created_by properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-created-by': {
          id: '',
          type: 'created_by',
          created_by: {
            id: 'person-id-1',
            type: 'person',
            name: 'hankei6km-1',
            avatar_url: 'hankei6km-1-avatar',
            person: { email: 'hankei6km-1-email' },
            object: 'user'
          }
        }
      }),
      {
        'test-created-by': {
          name: 'hankei6km-1',
          avatar_url: 'hankei6km-1-avatar',
          person: { email: 'hankei6km-1-email' }
        }
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-created-by': {
          id: '',
          type: 'created_by',
          created_by: {
            id: 'person-id-2',
            type: 'person',
            name: 'hankei6km-2',
            avatar_url: null,
            person: {},
            object: 'user'
          }
        }
      }),
      {
        'test-created-by': {
          name: 'hankei6km-2',
          avatar_url: '',
          person: { email: '' }
        }
      }
    )
  })

  it('should convert created time properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-created-time': {
          id: '',
          type: 'created_time',
          created_time: '2020-03-17T19:10:04.968Z'
        }
      }),
      { 'test-created-time': '2020-03-17T19:10:04.968Z' }
    )
  })

  it('should convert last_edited_by properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-last-edited-by': {
          id: '',
          type: 'last_edited_by',
          last_edited_by: {
            id: 'person-id-1',
            type: 'person',
            name: 'hankei6km-1',
            avatar_url: 'hankei6km-1-avatar',
            person: { email: 'hankei6km-1-email' },
            object: 'user'
          }
        }
      }),
      {
        'test-last-edited-by': {
          name: 'hankei6km-1',
          avatar_url: 'hankei6km-1-avatar',
          person: { email: 'hankei6km-1-email' }
        }
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-last-edited-by': {
          id: '',
          type: 'last_edited_by',
          last_edited_by: {
            id: 'person-id-2',
            type: 'person',
            name: 'hankei6km-2',
            avatar_url: null,
            person: {},
            object: 'user'
          }
        }
      }),
      {
        'test-last-edited-by': {
          name: 'hankei6km-2',
          avatar_url: '',
          person: { email: '' }
        }
      }
    )
  })

  it('should convert last_edited_time properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-last-edited-time': {
          id: '',
          type: 'last_edited_time',
          last_edited_time: '2020-03-17T19:10:04.968Z'
        }
      }),
      { 'test-last-edited-time': '2020-03-17T19:10:04.968Z' }
    )
  })

  it('should convert select properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
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
      }),
      { 'test-select': 'select1' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-select': {
          id: '',
          type: 'select',
          select: null
        }
      }),
      { 'test-select': '' }
    )
  })

  it('should convert multi select properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
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
      }),
      { 'test-multi-select': ['select1', 'select2'] }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-multi-select': {
          id: '',
          type: 'multi_select',
          multi_select: []
        }
      }),
      { 'test-multi-select': [] }
    )
  })

  it('should convert status properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-status': {
          id: '',
          type: 'status',
          status: {
            id: '',
            color: 'blue',
            name: 'status1'
          }
        }
      }),
      { 'test-status': 'status1' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-status': {
          id: '',
          type: 'status',
          status: null
        }
      }),
      { 'test-status': '' }
    )
  })

  it('should convert date properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-date': {
          id: '',
          type: 'date',
          date: {
            start: '2020-12-08T12:00:00Z',
            end: '2020-12-08T12:00:00Z',
            time_zone: 'America/Los_Angeles'
          }
        }
      }),
      {
        'test-date': {
          start: '2020-12-08T12:00:00Z',
          end: '2020-12-08T12:00:00Z',
          time_zone: 'America/Los_Angeles'
        }
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-date': {
          id: '',
          type: 'date',
          date: {
            start: '2020-12-08T12:00:00Z',
            end: null,
            time_zone: null
          }
        }
      }),
      {
        'test-date': {
          start: '2020-12-08T12:00:00Z',
          end: '',
          time_zone: ''
        }
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-date': {
          id: '',
          type: 'date',
          date: null
        }
      }),
      { 'test-date': { start: '', end: '', time_zone: '' } }
    )
  })

  it('should convert email properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-email': {
          id: '',
          type: 'email',
          email: 'hankei6km-dummy'
        }
      }),
      { 'test-email': 'hankei6km-dummy' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-email': {
          id: '',
          type: 'email',
          email: null
        }
      }),
      { 'test-email': '' }
    )
  })

  it('should convert phone number properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-phone-number': {
          id: '',
          type: 'phone_number',
          phone_number: '*dummy'
        }
      }),
      { 'test-phone-number': '*dummy' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-phone-number': {
          id: '',
          type: 'phone_number',
          phone_number: null
        }
      }),
      { 'test-phone-number': '' }
    )
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
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-title': {
          id: '',
          type: 'title',
          title: [mockRichText('text1')]
        }
      }),
      { 'test-title': 'text1' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-title': {
          id: '',
          type: 'title',
          title: [mockRichText('text1'), mockRichText('text2')]
        }
      }),
      { 'test-title': 'text1text2' }
    )
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
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-rich': {
          id: '',
          type: 'rich_text',
          rich_text: [mockRichText('text1')]
        }
      }),
      { 'test-rich': 'text1' }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-rich': {
          id: '',
          type: 'rich_text',
          rich_text: [mockRichText('text1'), mockRichText('text2')]
        }
      }),
      { 'test-rich': 'text1text2' }
    )
  })

  it('should convert group properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-group': {
          id: '',
          type: 'people',
          people: [
            {
              id: 'person-id-1',
              name: 'hankei6km-grp-1',
              object: 'group'
            },
            {
              id: 'person-id-2',
              name: 'hankei6km-grp-2',
              object: 'group'
            }
          ]
        }
      }),
      {
        'test-group': [
          {
            name: 'hankei6km-grp-1'
          },
          { name: 'hankei6km-grp-2' }
        ]
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-group': {
          id: '',
          type: 'people',
          people: [
            {
              id: 'person-id-1',
              name: null,
              object: 'group'
            }
          ]
        }
      }),
      { 'test-group': [{ name: '' }] }
    )
  })

  it('should convert people properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-people': {
          id: '',
          type: 'people',
          people: [
            {
              id: 'person-id-1',
              type: 'person',
              name: 'hankei6km-1',
              avatar_url: 'hankei6km-1-avatar',
              person: { email: 'hankei6km-1-email' },
              object: 'user'
            },
            {
              id: 'person-id-2',
              type: 'person',
              name: 'hankei6km-2',
              avatar_url: null,
              person: {},
              object: 'user'
            }
          ]
        }
      }),
      {
        'test-people': [
          {
            name: 'hankei6km-1',
            avatar_url: 'hankei6km-1-avatar',
            person: { email: 'hankei6km-1-email' }
          },
          { name: 'hankei6km-2', avatar_url: '', person: { email: '' } }
        ]
      }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-people': {
          id: '',
          type: 'people',
          people: []
        }
      }),
      { 'test-people': [] }
    )
  })

  it('should convert relation properties to items', async () => {
    const propsToItems = new PropsToItems()
    assert.deepStrictEqual(
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
      }),
      { 'test-relation': ['test-rel-id-1', 'test-rel-id-2'] }
    )
    assert.deepStrictEqual(
      await propsToItems.toItems({
        'test-relation': {
          id: '',
          type: 'relation',
          relation: []
        }
      }),
      { 'test-relation': [] }
    )
  })
})
