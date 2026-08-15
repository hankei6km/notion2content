import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.d.ts'
import { HeaderToItems } from '../../src/lib/header.ts'

describe('headerToItems()', () => {
  const pageObject = (): PageObjectResponse => ({
    object: 'page',
    id: 'page1',
    parent: { type: 'database_id', database_id: 'db1' },
    created_time: '2024-06-01T00:00:00.000Z',
    last_edited_time: '2024-06-02T00:00:00.000Z',
    in_trash: false,
    is_archived: false,
    is_locked: false,
    archived: false,
    url: 'https://example.com/page1',
    public_url: null,
    icon: null,
    cover: null,
    created_by: { object: 'user', id: 'user1' },
    last_edited_by: { object: 'user', id: 'user2' },
    properties: {}
  })
  it('should convert a page object to header items', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(await headerToItems.toItems({ ...pageObject() }), {
      id: 'page1',
      created_time: '2024-06-01T00:00:00.000Z',
      last_edited_time: '2024-06-02T00:00:00.000Z',
      in_trash: false,
      is_archived: false,
      is_locked: false,
      url: 'https://example.com/page1',
      public_url: null,
      icon: '',
      cover: '',
      created_by: 'user1',
      last_edited_by: 'user2'
    })
  })
  it('should convert a page object to header items(public_url)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        public_url: 'http://example.com/public'
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: 'http://example.com/public',
        icon: '',
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(icon icon)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        icon: {
          type: 'icon',
          icon: { color: 'blue', name: 'icon1' }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: { color: 'blue', name: 'icon1' },
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(icon emoji)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        icon: {
          type: 'emoji',
          emoji: '😀'
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: '😀',
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(icon file)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        icon: {
          type: 'file',
          file: {
            url: 'https://example.com/icon.png',
            expiry_time: '2024-06-01T00:00:00.000Z'
          }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: 'https://example.com/icon.png',
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(icon external)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        icon: {
          type: 'external',
          external: { url: 'https://example.com/icon.png' }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: 'https://example.com/icon.png',
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(icon custom emoji)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        icon: {
          type: 'custom_emoji',
          custom_emoji: {
            url: 'https://example.com/icon.png',
            name: 'custom_emoji1',
            id: 'custom_emoji1'
          }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: 'https://example.com/icon.png',
        cover: '',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(cover external)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        cover: {
          type: 'external',
          external: { url: 'https://example.com/cover.png' }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: '',
        cover: 'https://example.com/cover.png',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
  it('should convert a page object to header items(cover file)', async () => {
    const headerToItems = new HeaderToItems()
    assert.deepStrictEqual(
      await headerToItems.toItems({
        ...pageObject(),
        cover: {
          type: 'file',
          file: {
            url: 'https://example.com/cover.png',
            expiry_time: '2024-06-03T00:00:00.000Z'
          }
        }
      }),
      {
        id: 'page1',
        created_time: '2024-06-01T00:00:00.000Z',
        last_edited_time: '2024-06-02T00:00:00.000Z',
        in_trash: false,
        is_archived: false,
        is_locked: false,
        url: 'https://example.com/page1',
        public_url: null,
        icon: '',
        cover: 'https://example.com/cover.png',
        created_by: 'user1',
        last_edited_by: 'user2'
      }
    )
  })
})
