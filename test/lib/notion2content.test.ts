import type { Mock } from 'node:test'
import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { Client } from '../../src/lib/client.ts'
import { Client as NotionClient } from '@notionhq/client'
import type {
  PageObjectResponse,
  QueryDataSourceResponse
} from '@notionhq/client/build/src/api-endpoints.d.ts'
import type { PropsItem } from '../../src/lib/types.ts'

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

const mockPropsExports = (() => {
  const mockPropsToItemsInstance = {
    toItems:
      mock.fn<(props: PageObjectResponse['properties']) => Promise<PropsItem>>()
  }
  const mockPropsToItems = mock.fn(function () {})
  const reset = () => {
    mockPropsToItemsInstance.toItems.mock.resetCalls()
    mockPropsToItemsInstance.toItems.mock.mockImplementation((props) => {
      const keys = Object.keys(props).sort()
      if (keys.includes('reject')) {
        return Promise.reject(`${keys.join(',')}:toItems`)
      }
      return Promise.resolve({ check: `${keys.join(',')}` })
    })
    mockPropsToItems.mock.resetCalls()
    mockPropsToItems.prototype.toItems = mockPropsToItemsInstance.toItems
    mockPropsToItems.mock.mockImplementation(function () {})
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
})()
mock.module('../../src/lib/props.ts', {
  exports: mockPropsExports
})

const mockHeaderExports = (() => {
  const mockHeaderToItemsInstance = {
    toItems: mock.fn<(page: PageObjectResponse) => Promise<PropsItem>>()
  }
  const mockHeaderToItems = mock.fn(function () {})
  const reset = () => {
    mockHeaderToItemsInstance.toItems.mock.resetCalls()
    mockHeaderToItemsInstance.toItems.mock.mockImplementation((page) => {
      const props = Object.keys(page.properties).sort()
      if (props.includes('reject')) {
        return Promise.reject(`${props.join(',')}:toItems`)
      }
      const keys = Object.keys(page).sort()
      return Promise.resolve({ check: `${keys.join(',')}` })
    })
    mockHeaderToItems.mock.resetCalls()
    mockHeaderToItems.prototype.toItems = mockHeaderToItemsInstance.toItems
    mockHeaderToItems.mock.mockImplementation(function () {})
  }

  reset()
  return {
    HeaderToItems: mockHeaderToItems,
    _reset: reset,
    _getMocks: () => ({
      mockHeaderToItemsInstance,
      mockHeaderToItems
    })
  }
})()
mock.module('../../src/lib/header.ts', {
  exports: mockHeaderExports
})

const mockNotion2HastExports = (() => {
  const mockBlockToHast =
    mock.fn<
      (
        client: any,
        opts: { block_id: string }
      ) => Promise<ReturnType<typeof getMockTree>>
    >()
  const reset = () => {
    mockBlockToHast.mock.resetCalls()
    mockBlockToHast.mock.mockImplementation((_client, { block_id }) => {
      if (block_id === 'reject') {
        return Promise.reject(`${block_id}:blockToHast`)
      }
      //return Promise.resolve(`${block_id}:blockToHast`)
      return Promise.resolve(getMockTree(block_id))
    })
  }

  reset()
  return {
    Client: function () {},
    blockToHast: mockBlockToHast,
    _reset: reset,
    _getMocks: () => ({
      mockBlockToHast
    })
  }
})()
mock.module('notion2hast', {
  exports: mockNotion2HastExports
})

const { mockPropsToItemsInstance, mockPropsToItems } =
  mockPropsExports._getMocks()
const { mockHeaderToItemsInstance, mockHeaderToItems } =
  mockHeaderExports._getMocks()
const { mockBlockToHast } = mockNotion2HastExports._getMocks()
afterEach(() => {
  mockPropsExports._reset()
  mockHeaderExports._reset()
  mockNotion2HastExports._reset()
})

const { normalizeOpts, toContent } =
  await import('../../src/lib/notion2content.ts')
const notion2content = await import('../../src/lib/notion2content.ts')

type MockClientOpts = {
  mockQueryDataSources: (Partial<Omit<QueryDataSourceResponse, 'results'>> & {
    results: Partial<QueryDataSourceResponse['results'][0]>[]
  } & { reject?: boolean })[]
}
class MockClient extends Client {
  iteQueryDataSources: Generator<
    MockClientOpts['mockQueryDataSources'][0],
    void,
    unknown
  >
  //iteListBlockChildren: Generator<any, void, unknown>
  constructor(mock: MockClientOpts) {
    super()
    this.iteQueryDataSources = (function* () {
      for (const i of mock.mockQueryDataSources) {
        yield i as any
      }
    })()
  }
  queryDataSources(
    ...args: Parameters<NotionClient['dataSources']['query']>
  ): ReturnType<NotionClient['dataSources']['query']> {
    const mock = this.iteQueryDataSources.next()
    if (!mock.done) {
      if (mock.value.reject) {
        throw new Error(`reject: ${args[0].data_source_id}`)
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
    assert.deepStrictEqual(
      normalizeOpts({
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: {},
        toHastOpts: {}
      }),
      {
        target: ['props', 'content'],
        workersNum: 1,
        keepOrder: false,
        skip: 0,
        limit: -1,
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: { indexName: '', initialIndex: 1 },
        toHastOpts: {}
      }
    )
    assert.deepStrictEqual(
      normalizeOpts({
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: {},
        toHastOpts: { richTexttoHastOpts: {} }
      }),
      {
        target: ['props', 'content'],
        workersNum: 1,
        keepOrder: false,
        skip: 0,
        limit: -1,
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: { indexName: '', initialIndex: 1 },
        toHastOpts: { richTexttoHastOpts: {} }
      }
    )
    assert.deepStrictEqual(
      normalizeOpts({
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
        toHastOpts: { richTexttoHastOpts: {} }
      }),
      {
        target: ['props', 'content'],
        workersNum: 1,
        keepOrder: false,
        skip: 0,
        limit: -1,
        query: { data_source_id: 'test_data_source' },
        toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
        toHastOpts: { richTexttoHastOpts: {} }
      }
    )
  })
})
describe('fetchPages()', () => {
  it('should query data source and generate pages(empty)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = []
    const spyQueryDataSources = t.mock.method(
      MockClient.prototype,
      'queryDataSources'
    )
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    //t.mock.property(mockClient, 'queryDataSources', spyQueryDataSources)
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 1)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
  })

  it('should query data source and generate pages(skip partial pages)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      { results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 1)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
  })

  it('should query data source and generate pages(basic)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
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
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 1)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
  })

  it('should query data source and generate pages(skip)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
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
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
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
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
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
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 3,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results).slice(3)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 3)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[1].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next1'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[2].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next2'
    })
  })

  it('should query data source and generate pages(skip and limit)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
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
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
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
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
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
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 3,
      limit: 2,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results).slice(3, 5)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 3)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[1].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next1'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[2].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next2'
    })
  })

  it('should query data source and generate pages(next cursor)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
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
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
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
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
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
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 3)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[1].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next1'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[2].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next2'
    })
  })

  it('should query data source and generate pages(limit)', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        next_cursor: 'next1',
        results: [
          {
            properties: {
              'prop1-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1-1'
          },
          {
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
            properties: {
              'prop2-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop2-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page2-1'
          },
          {
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
            properties: {
              'prop3-1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop3-1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page3-1'
          },
          {
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
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: 3,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(
      res,
      mockQueryDataSources.flatMap(({ results }) => results).slice(0, 3)
    )
    assert.strictEqual(spyQueryDataSources.mock.callCount(), 2)
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[0].arguments[0], {
      data_source_id: 'test_data_source'
    })
    assert.deepStrictEqual(spyQueryDataSources.mock.calls[1].arguments[0], {
      data_source_id: 'test_data_source',
      start_cursor: 'next1'
    })
  })

  it('should reject from queryDataSources', async (t) => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      { reject: true, results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const spyQueryDataSources = t.mock.method(mockClient, 'queryDataSources')
    const g = notion2content.fetchPages(mockClient, {
      skip: 0,
      limit: -1,
      query: { data_source_id: 'test_data_source' }
    })
    const res = []
    await assert.rejects(
      async () => {
        for await (const i of g) {
          res.push(i)
        }
      },
      { message: 'reject: test_data_source' }
    )
  })
})

describe('toContent()', () => {
  it('should generate content(empty)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = []
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [])
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 0)
  })

  it('should generate content(empty properties)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      { results: [{ properties: {}, id: 'page1' }] }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
      {
        id: 'page1',
        props: { check: '' },
        content: getMockTree('page1')
      }
    ])
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 1)
  })

  it('should generate content(basic)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
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
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
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
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 2)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 2)
  })

  it('should generate content(index)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' },
              'prop1-2': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          },
          {
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
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
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
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 2)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 2)
  })

  it('should generate content(target header)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      target: ['header'],
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
      {
        id: 'page1',
        header: {
          check: 'id,properties'
        }
      }
    ])
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 1)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 0)
  })

  it('should generate content(target props)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      target: ['props'],
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
      {
        id: 'page1',
        props: { 'test-index': 10, check: 'prop1-1' }
      }
    ])
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 0)
  })

  it('should generate content(target contrent)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              'prop1-1': { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      target: ['content'],
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: { indexName: 'test-index', initialIndex: 10 },
      toHastOpts: {}
    })
    const res = []
    for await (const i of g) {
      res.push(i)
    }
    assert.deepStrictEqual(res, [
      {
        id: 'page1',
        content: getMockTree('page1')
      }
    ])
    assert.strictEqual(mockPropsToItems.mock.callCount(), 1)
    assert.strictEqual(mockPropsToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockHeaderToItems.mock.callCount(), 1)
    assert.strictEqual(mockHeaderToItemsInstance.toItems.mock.callCount(), 0)
    assert.strictEqual(mockBlockToHast.mock.callCount(), 1)
  })

  it('should reject from queryDataSources', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      { reject: true, results: [] }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    await assert.rejects(
      async () => {
        for await (const i of g) {
          res.push(i)
        }
      },
      {
        message:
          'toContent: error from fetchPages: Error: reject: test_data_source, data_source_id:test_data_source'
      }
    )
  })

  it('should reject from toItems(props)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              reject: { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    await assert.rejects(
      async () => {
        for await (const i of g) {
          res.push(i)
        }
      },
      {
        message:
          'toContent: error from propsToItems.toItems: reject:toItems, data_source_id:test_data_source, page_id:page1'
      }
    )
  })
  it('should reject from toItems(header)', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              reject: { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'page1'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      target: ['header'],
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    await assert.rejects(
      async () => {
        for await (const i of g) {
          res.push(i)
        }
      },
      {
        message:
          'toContent: error from headerToItems.toItems: reject:toItems, data_source_id:test_data_source, page_id:page1'
      }
    )
  })
  it('should reject from blockToHast', async () => {
    const mockQueryDataSources: MockClientOpts['mockQueryDataSources'] = [
      {
        results: [
          {
            properties: {
              page1: { type: 'checkbox', checkbox: true, id: '' }
            },
            id: 'reject'
          }
        ]
      }
    ]
    const mockClient = new MockClient({
      mockQueryDataSources
    })
    const g = toContent(mockClient, {
      query: { data_source_id: 'test_data_source' },
      toItemsOpts: {},
      toHastOpts: {}
    })
    const res = []
    await assert.rejects(
      async () => {
        for await (const i of g) {
          res.push(i)
        }
      },
      {
        message:
          'toContent: error from blockToHast: reject:blockToHast, data_source_id:test_data_source, page_id:reject'
      }
    )
  })
})
