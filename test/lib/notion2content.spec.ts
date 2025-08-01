import { jest } from '@jest/globals'
import { Client } from '../../src/lib/client.js'
import { Client as NotionClient } from '@notionhq/client'
import {
  PageObjectResponse,
  QueryDatabaseResponse
} from '@notionhq/client/build/src/api-endpoints.js'
import { PropsItem } from '../../src/lib/types.js'

function getMockTree(block_id: string) {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'p',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: [{ type: 'text', value: `${block_id}:blockToHast` }]
          }
        ]
      }
    ]
  }
}

jest.unstable_mockModule('../../src/lib/props.js', () => {
  const mockPropsToItemsInstance = {
    toItems:
      jest.fn<(props: PageObjectResponse['properties']) => Promise<PropsItem>>()
  }
  const mockPropsToItems = jest.fn()
  const reset = () => {
    mockPropsToItemsInstance.toItems.mockReset().mockImplementation((props) => {
      const keys = Object.keys(props).sort()
      if (keys.includes('reject')) {
        return Promise.reject(`${keys.join(',')}:toItems`)
      }
      return Promise.resolve({ check: `${keys.join(',')}` })
    })
    mockPropsToItems.mockReset().mockImplementation(() => {
      return mockPropsToItemsInstance
    })
  }

  reset()
  return {
    PropsToItems: mockPropsToItems,
    _reset: reset,
    _getMocks: () => ({
      mockPropsToItemsInstance,
      mockPropsToItems
    })
  }
})

jest.unstable_mockModule('notion2hast', () => {
  const mockBlockToHast =
    jest.fn<
      (
        client: any,
        opts: { block_id: string }
      ) => Promise<ReturnType<typeof getMockTree>>
    >()
  const reset = () => {
    mockBlockToHast.mockReset().mockImplementation((_client, { block_id }) => {
      if (block_id === 'reject') {
        return Promise.reject(`${block_id}:blockToHast`)
      }
      //return Promise.resolve(`${block_id}:blockToHast`)
      return Promise.resolve(getMockTree(block_id))
    })
  }

  reset()
  return {
    blockToHast: mockBlockToHast,
    _reset: reset,
    _getMocks: () => ({
      mockBlockToHast
    })
  }
})

const mockProps = await import('../../src/lib/props.js')
const { mockPropsToItemsInstance, mockPropsToItems } = (
  mockProps as any
)._getMocks()
const mockNotion2Hast = await import('notion2hast')
const { mockBlockToHast } = (mockNotion2Hast as any)._getMocks()
afterEach(() => {
  ;(mockProps as any)._reset()
  ;(mockNotion2Hast as any)._reset()
})

const { normalizeOpts, toContent } = await import(
  '../../src/lib/notion2content.js'
)
const notion2content = await import('../../src/lib/notion2content.js')

type MockClientOpts = {
  mockQueryDatabase: (Partial<Omit<QueryDatabaseResponse, 'results'>> & {
    results: Partial<QueryDatabaseResponse['results'][0]>[]
  } & { reject?: boolean })[]
}
class MockClient extends Client {
  iteQueryDatabase: Generator<
    MockClientOpts['mockQueryDatabase'][0],
    void,
    unknown
  >
  //iteListBlockChildren: Generator<any, void, unknown>
  constructor(mock: MockClientOpts) {
    super()
    this.iteQueryDatabase = (function* () {
      for (const i of mock.mockQueryDatabase) {
        yield i as any
      }
    })()
  }
  queryDatabases(
    ...args: Parameters<NotionClient['databases']['query']>
  ): ReturnType<NotionClient['databases']['query']> {
    const mock = this.iteQueryDatabase.next()
    if (!mock.done) {
      if (mock.value.reject) {
        throw new Error(`reject: ${args[0].database_id}`)
      }
      return mock.value as any
    }
    return {} as any
  }
  listBlockChildren(
    ...args: Parameters<NotionClient['blocks']['children']['list']>
  ): ReturnType<NotionClient['blocks']['children']['list']> {
    return {} as any
  }
}

describe('normalizeOpts()', () => {
  it('should return normalized options', () => {
    expect(
      normalizeOpts({
        query: { database_id: 'test_database' },
        toItemsOpts: {},
        toHastOpts: {}
      })
    ).toEqual({
      target: ['props', 'content'],
      workersNum: 1,
      keepOrder: false,
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' },
      toItemsOpts: { indexName: '', initialIndex: 1 },
      toHastOpts: {}
    })
    expect(
      normalizeOpts({
        query: { database_id: 'test_database', archived: true },
        toItemsOpts: {},
        toHastOpts: { richTexttoHastOpts: {} }
      })
    ).toEqual({
      target: ['props', 'content'],
      workersNum: 1,
      keepOrder: false,
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database', archived: true },
      toItemsOpts: { indexName: '', initialIndex: 1 },
      toHastOpts: { richTexttoHastOpts: {} }
    })
    expect(
      normalizeOpts({
        query: { database_id: 'test_database', archived: true },
        toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
        toHastOpts: { richTexttoHastOpts: {} }
      })
    ).toEqual({
      target: ['props', 'content'],
      workersNum: 1,
      keepOrder: false,
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database', archived: true },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: { richTexttoHastOpts: {} }
    })
  })
})

describe('fetchPages()', () => {
  it('should query database and generate pages(empty)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = []
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(mockQueryDatabase.flatMap(({ results }) => results))
    expect(spyQueryDatabases).toHaveBeenCalledTimes(1)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
  })

  it('should query database and generate pages(skip partial pages)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      { results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(mockQueryDatabase.flatMap(({ results }) => results))
    expect(spyQueryDatabases).toHaveBeenCalledTimes(1)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
  })

  it('should query database and generate pages(basic)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
            archived: false,
            properties: {
              'prop2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(mockQueryDatabase.flatMap(({ results }) => results))
    expect(spyQueryDatabases).toHaveBeenCalledTimes(1)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
  })

  it('should query database and generate pages(skip)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            archived: false,
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
            archived: false,
            properties: {
              'prop1-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-2'
          }
        ]
      },
      {
        next_cursor: 'next2',
        results: [
          {
            archived: false,
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
            archived: false,
            properties: {
              'prop2-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-2'
          }
        ]
      },
      {
        results: [
          {
            archived: false,
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
            archived: false,
            properties: {
              'prop3-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 3,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(
      mockQueryDatabase.flatMap(({ results }) => results).slice(3)
    )
    expect(spyQueryDatabases).toHaveBeenCalledTimes(3)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(2, {
      database_id: 'test_database',
      start_cursor: 'next1'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(3, {
      database_id: 'test_database',
      start_cursor: 'next2'
    })
  })

  it('should query database and generate pages(skip and limit)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            archived: false,
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
            archived: false,
            properties: {
              'prop1-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-2'
          }
        ]
      },
      {
        next_cursor: 'next2',
        results: [
          {
            archived: false,
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
            archived: false,
            properties: {
              'prop2-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-2'
          }
        ]
      },
      {
        results: [
          {
            archived: false,
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
            archived: false,
            properties: {
              'prop3-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 3,
      limit: 2,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(
      mockQueryDatabase.flatMap(({ results }) => results).slice(3, 5)
    )
    expect(spyQueryDatabases).toHaveBeenCalledTimes(3)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(2, {
      database_id: 'test_database',
      start_cursor: 'next1'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(3, {
      database_id: 'test_database',
      start_cursor: 'next2'
    })
  })
  it('should query database and generate pages(next cursor)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            archived: false,
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
            archived: false,
            properties: {
              'prop1-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-2'
          }
        ]
      },
      {
        next_cursor: 'next2',
        results: [
          {
            archived: false,
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
            archived: false,
            properties: {
              'prop2-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-2'
          }
        ]
      },
      {
        results: [
          {
            archived: false,
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
            archived: false,
            properties: {
              'prop3-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(mockQueryDatabase.flatMap(({ results }) => results))
    expect(spyQueryDatabases).toHaveBeenCalledTimes(3)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(2, {
      database_id: 'test_database',
      start_cursor: 'next1'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(3, {
      database_id: 'test_database',
      start_cursor: 'next2'
    })
  })

  it('should query database and generate pages(limit)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            archived: false,
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
            archived: false,
            properties: {
              'prop1-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-2'
          }
        ]
      },
      {
        next_cursor: 'next2',
        results: [
          {
            archived: false,
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
            archived: false,
            properties: {
              'prop2-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-2'
          }
        ]
      },
      {
        results: [
          {
            archived: false,
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
            archived: false,
            properties: {
              'prop3-2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: 3,
      query: { database_id: 'test_database' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual(
      mockQueryDatabase.flatMap(({ results }) => results).slice(0, 3)
    )
    expect(spyQueryDatabases).toHaveBeenCalledTimes(2)
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(1, {
      database_id: 'test_database'
    })
    expect(spyQueryDatabases).toHaveBeenNthCalledWith(2, {
      database_id: 'test_database',
      start_cursor: 'next1'
    })
  })

  it('should reject from queryDatabase', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      { reject: true, results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { database_id: 'test_database' }
    })
    const res = []
    expect(async () => {
      for await (const i of g) {
        res.push(i)
      }
    }).rejects.toThrow('reject: test_database')
  })
})

describe('toContent()', () => {
  it('should generate content(empty)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = []
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(0)
    expect(mockBlockToHast).toHaveBeenCalledTimes(0)
  })

  it('should generate content(empty properties)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      { results: [{ archived: false, properties: {}, id: 'page1' }] }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([
      {
        id: 'page1',
        props: { check: '' },
        content: getMockTree('page1')
      }
    ])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(1)
    expect(mockBlockToHast).toHaveBeenCalledTimes(1)
  })

  it('should generate content(basic)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
            archived: false,
            properties: {
              'prop2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([
      {
        id: 'page1',
        props: { check: 'prop1-1,prop1-2' },
        content: getMockTree('page1')
      },
      {
        id: 'page2',
        props: { check: 'prop2-1,prop2-2' },
        content: getMockTree('page2')
      }
    ])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(2)
    expect(mockBlockToHast).toHaveBeenCalledTimes(2)
  })

  it('should generate content(index)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
            archived: false,
            properties: {
              'prop2-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([
      {
        id: 'page1',
        props: { 'test-index': 10, check: 'prop1-1,prop1-2' },
        content: getMockTree('page1')
      },
      {
        id: 'page2',
        props: { 'test-index': 11, check: 'prop2-1,prop2-2' },
        content: getMockTree('page2')
      }
    ])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(2)
    expect(mockBlockToHast).toHaveBeenCalledTimes(2)
  })

  it('should generate content(target props)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      target: ['props'],
      query: { database_id: 'test_database' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([
      {
        id: 'page1',
        props: { 'test-index': 10, check: 'prop1-1' }
      }
    ])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(1)
    expect(mockBlockToHast).toHaveBeenCalledTimes(0)
  })

  it('should generate content(target contrent)', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      target: ['content'],
      query: { database_id: 'test_database' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    expect(res).toEqual([
      {
        id: 'page1',
        content: getMockTree('page1')
      }
    ])
    expect(mockPropsToItems).toHaveBeenCalledTimes(1)
    expect(mockPropsToItemsInstance.toItems).toHaveBeenCalledTimes(0)
    expect(mockBlockToHast).toHaveBeenCalledTimes(1)
  })

  it('should reject from queryDatabase', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      { reject: true, results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const spyQueryDatabases = jest.spyOn(mockClient, 'queryDatabases')
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    expect(async () => {
      for await (const i of g) {
        res.push(i)
      }
    }).rejects.toThrow(
      'toContent: error from fetchPages: Error: reject: test_database, database_id:test_database'
    )
  })

  it('should reject from toItems', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              reject: { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    expect(async () => {
      for await (const i of g) {
        res.push(i)
      }
    }).rejects.toThrow(
      'toContent: error from propsToItems.toItems: reject:toItems, database_id:test_database, page_id:page1'
    )
  })

  it('should reject from blockToHast', async () => {
    const mockQueryDatabase: MockClientOpts['mockQueryDatabase'] = [
      {
        results: [
          {
            archived: false,
            properties: {
              page1: { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'reject'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDatabase
    })
    const g = toContent(mockClient, {
      query: { database_id: 'test_database' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    expect(async () => {
      for await (const i of g) {
        res.push(i)
      }
    }).rejects.toThrow(
      'toContent: error from blockToHast: reject:blockToHast, database_id:test_database, page_id:reject'
    )
  })
})
