import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'stream'
import { deepStrictEqual } from 'node:assert'

const mockClieentBaseExports = {
  Client: mock.fn(function (a: any) {})
}
mock.module('@notionhq/client', {
  exports: mockClieentBaseExports
})

let toContentValue: any = Promise.resolve({ id: 'test-1' })
const mockNotion2ContentExports = {
  toContent: mock.fn(async function* (a1: any, a2: any) {
    yield toContentValue
  })
}
mock.module('../src/lib/notion2content.ts', {
  exports: mockNotion2ContentExports
})

const mockFsPromisesExports = {
  writeFile: mock.fn((file: string, data: string) => Promise.resolve())
}
mock.module('node:fs/promises', {
  exports: mockFsPromisesExports
})

const mockClieentBase = await import('@notionhq/client')
const mockNotion2Content = await import('../src/lib/notion2content.ts')
const mockFsPromises = await import('node:fs/promises')
const { contentToString, targetArray, cli } = await import('../src/cli.ts')

afterEach(() => {
  mock.reset()
  mockClieentBaseExports.Client.mock.resetCalls()
  toContentValue = Promise.resolve({ id: 'test-1' })
  mockNotion2ContentExports.toContent.mock.resetCalls()
  mockFsPromisesExports.writeFile.mock.resetCalls()
})

describe('contentToString()', () => {
  it('should convert content to json string', async () => {
    assert.deepStrictEqual(
      JSON.parse(await contentToString({}, { id: 'test-id' })),
      {
        id: 'test-id'
      }
    )
    assert.deepStrictEqual(
      JSON.parse(
        await contentToString(
          {},
          {
            id: 'test-id',
            props: { key1: 'val1' },
            content: { type: 'text', value: 'text1' }
          }
        )
      ),
      {
        id: 'test-id',
        props: { key1: 'val1' },
        content: { type: 'text', value: 'text1' }
      }
    )
  })

  it('should convert content to html string', async () => {
    assert.strictEqual(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'html'
        },
        { id: 'test-id' }
      ),
      '---\n---\n\n'
    )
    assert.strictEqual(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'html'
        },
        {
          id: 'test-id',
          props: { key1: 'val1' },
          content: { type: 'text', value: 'text1' }
        }
      ),
      '---\nkey1: val1\n---\n\ntext1'
    )
  })

  it('should convert content to markdown string', async () => {
    assert.strictEqual(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'md'
        },
        { id: 'test-id' }
      ),
      '---\n---\n\n'
    )
    assert.strictEqual(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'md'
        },
        {
          id: 'test-id',
          props: { key1: 'val1' },
          content: { type: 'text', value: 'text1' }
        }
      ),
      '---\nkey1: val1\n---\n\ntext1\n'
    )
  })
})

describe('targetArray()', () => {
  it('should return targe', () => {
    assert.strictEqual(targetArray(undefined), undefined)
    assert.deepStrictEqual(targetArray('both'), ['props', 'content'])
    assert.deepStrictEqual(targetArray('props'), ['props'])
    assert.deepStrictEqual(targetArray('content'), ['content'])
  })
})

describe('cli()', () => {
  it('should return stdout with exitcode=0', async () => {
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    let outData = ''
    stdout.on('data', (d) => (outData = outData + d))
    let errData = ''
    stderr.on('data', (d) => (errData = errData + d))
    assert.strictEqual(
      await cli({
        apiKey: 'test-api-key-1',
        databaseId: 'test-database-id-1',
        workersNum: 1,
        stdout,
        stderr
      }),
      0
    )
    assert.deepStrictEqual(
      mockClieentBaseExports.Client.mock.calls[0].arguments[0],
      { auth: 'test-api-key-1' }
    )
    assert.strictEqual(mockNotion2ContentExports.toContent.mock.callCount(), 1)
    assert.deepStrictEqual(
      mockNotion2ContentExports.toContent.mock.calls[0].arguments[1],
      {
        target: undefined,
        skip: undefined,
        limit: undefined,
        query: {
          database_id: 'test-database-id-1'
        },
        workersNum: 1,
        toItemsOpts: {
          indexName: undefined,
          initialIndex: undefined
        },
        toHastOpts: {
          blocktoHastOpts: { defaultClassName: undefined },
          richTexttoHastOpts: { defaultClassName: undefined }
        }
      }
    )
    //expect(mockToHtml).toHaveBeenCalledTimes(0)
    assert.strictEqual(
      outData,
      `{"id":"test-1"}
`
    )
    assert.strictEqual(errData, '')
  })

  it('should save content to file with exitcode=0', async () => {
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    let outData = ''
    stdout.on('data', (d) => (outData = outData + d))
    let errData = ''
    stderr.on('data', (d) => (errData = errData + d))
    assert.strictEqual(
      await cli({
        apiKey: 'test-api-key-1',
        databaseId: 'test-database-id-1',
        workersNum: 1,
        saveDir: 'tmp',
        saveFormat: 'html',
        stdout,
        stderr
      }),
      0
    )
    assert.deepStrictEqual(
      mockClieentBaseExports.Client.mock.calls[0].arguments[0],
      { auth: 'test-api-key-1' }
    )
    assert.strictEqual(mockNotion2ContentExports.toContent.mock.callCount(), 1)
    assert.deepStrictEqual(
      mockNotion2ContentExports.toContent.mock.calls[0].arguments[1],
      {
        target: undefined,
        skip: undefined,
        limit: undefined,
        query: {
          database_id: 'test-database-id-1'
        },
        workersNum: 1,
        toItemsOpts: {
          indexName: undefined,
          initialIndex: undefined
        },
        toHastOpts: {
          blocktoHastOpts: { defaultClassName: undefined },
          richTexttoHastOpts: { defaultClassName: undefined }
        }
      }
    )
    //expect(mockToHtml).toHaveBeenCalledTimes(0)
    assert.strictEqual(mockFsPromisesExports.writeFile.mock.callCount(), 1)
    assert.deepStrictEqual(
      mockFsPromisesExports.writeFile.mock.calls[0].arguments,
      ['tmp/test-1.html', '---\n---\n\n']
    )
    assert.strictEqual(outData, '')
    assert.strictEqual(errData, '')
  })
})
