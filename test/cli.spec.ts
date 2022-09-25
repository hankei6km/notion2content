import { PassThrough } from 'stream'
import { jest } from '@jest/globals'

jest.unstable_mockModule('@notionhq/client', async () => {
  const mockClientInstance = {}
  const mockClient = jest.fn<(a: any[]) => any>()
  const reset = (reject: boolean = false) => {
    mockClient.mockReset().mockImplementation(() => mockClientInstance)
  }

  reset()
  return {
    Client: mockClient,
    _reset: reset,
    _getMocks: () => ({
      mockClient,
      mockClientInstance
    })
  }
})

jest.unstable_mockModule('../src/lib/notion2content.js', async () => {
  const mockToContent = jest.fn<(a: any[]) => any>()
  const reset = (reject: boolean = false) => {
    if (reject) {
      mockToContent.mockReset().mockRejectedValue('rejected')
    } else {
      //mockToContent.mockReset().mockResolvedValue({ id: 'test-1' })
      mockToContent.mockReset().mockImplementation(async function* () {
        yield { id: 'test-1' }
      })
    }
  }

  reset()
  return {
    toContent: mockToContent,
    _reset: reset,
    _getMocks: () => ({
      mockToContent
    })
  }
})

jest.unstable_mockModule('node:fs/promises', async () => {
  //const { writeFile } = await import('node:fs/promises')
  const mockWriteFile = jest.fn<(file: string, data: string) => Promise<void>>()
  const reset = (reject: boolean = false) => {
    mockWriteFile.mockReset().mockResolvedValue()
  }

  reset()
  return {
    writeFile: mockWriteFile,
    _reset: reset,
    _getMocks: () => ({
      mockWriteFile
    })
  }
})

//jest.unstable_mockModule('hast-util-to-html', async () => {
//  const mockToHtml = jest.fn<(a: any[]) => any>()
//  const reset = (reject: boolean = false) => {
//    mockToHtml.mockReset().mockReturnValue('test-html-1')
//  }
//
//  reset()
//  return {
//    toHtml: mockToHtml,
//    _reset: reset,
//    _getMocks: () => ({
//      mockToHtml
//    })
//  }
//})

const mockClieentBase = await import('@notionhq/client')
const mockNotion2Content = await import('../src/lib/notion2content.js')
const mockFsPromises = await import('node:fs/promises')
const { mockClient, mockClientInstance } = (mockClieentBase as any)._getMocks()
const { mockToContent } = (mockNotion2Content as any)._getMocks()
const { mockWriteFile } = (mockFsPromises as any)._getMocks()
const { contentToString, targetArray, cli } = await import('../src/cli.js')

afterEach(() => {
  ;(mockClieentBase as any)._reset()
  ;(mockNotion2Content as any)._reset()
  ;(mockFsPromises as any)._reset()
})

describe('contentToString()', () => {
  it('should convert content to json string', async () => {
    expect(JSON.parse(await contentToString({}, { id: 'test-id' }))).toEqual({
      id: 'test-id'
    })
    expect(
      JSON.parse(
        await contentToString(
          {},
          {
            id: 'test-id',
            props: { key1: 'val1' },
            content: { type: 'text', value: 'text1' }
          }
        )
      )
    ).toEqual({
      id: 'test-id',
      props: { key1: 'val1' },
      content: { type: 'text', value: 'text1' }
    })
  })

  it('should convert content to html string', async () => {
    expect(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'html'
        },
        { id: 'test-id' }
      )
    ).toEqual('---\n---\n\n')
    expect(
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
      )
    ).toEqual('---\nkey1: val1\n---\n\ntext1')
  })

  it('should convert content to markdown string', async () => {
    expect(
      await contentToString(
        {
          saveDir: 'tmp/',
          saveFormat: 'md'
        },
        { id: 'test-id' }
      )
    ).toEqual('---\n---\n\n')
    expect(
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
      )
    ).toEqual('---\nkey1: val1\n---\n\ntext1\n')
  })
})

describe('targetArray()', () => {
  it('should return targe', () => {
    expect(targetArray(undefined)).toBeUndefined()
    expect(targetArray('both')).toEqual(['props', 'content'])
    expect(targetArray('props')).toEqual(['props'])
    expect(targetArray('content')).toEqual(['content'])
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
    expect(
      await cli({
        apiKey: 'test-api-key-1',
        databaseId: 'test-database-id-1',
        workersNum: 1,
        stdout,
        stderr
      })
    ).toEqual(0)
    expect(mockClient).toBeCalledWith({ auth: 'test-api-key-1' })
    expect(mockToContent).toBeCalledTimes(1)
    expect(mockToContent.mock.calls[0][1]).toEqual({
      query: {
        database_id: 'test-database-id-1'
      },
      workersNum: 1,
      toItemsOpts: {},
      toHastOpts: {
        blocktoHastOpts: { defaultClassName: undefined },
        richTexttoHastOpts: { defaultClassName: undefined }
      }
    })
    //expect(mockToHtml).toBeCalledTimes(0)
    expect(outData).toEqual(`{"id":"test-1"}
`)
    expect(errData).toEqual('')
  })

  it('should save content to file with exitcode=0', async () => {
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    let outData = ''
    stdout.on('data', (d) => (outData = outData + d))
    let errData = ''
    stderr.on('data', (d) => (errData = errData + d))
    expect(
      await cli({
        apiKey: 'test-api-key-1',
        databaseId: 'test-database-id-1',
        workersNum: 1,
        saveDir: 'tmp',
        saveFormat: 'html',
        stdout,
        stderr
      })
    ).toEqual(0)
    expect(mockClient).toBeCalledWith({ auth: 'test-api-key-1' })
    expect(mockToContent).toBeCalledTimes(1)
    expect(mockToContent.mock.calls[0][1]).toEqual({
      query: {
        database_id: 'test-database-id-1'
      },
      workersNum: 1,
      toItemsOpts: {},
      toHastOpts: {
        blocktoHastOpts: { defaultClassName: undefined },
        richTexttoHastOpts: { defaultClassName: undefined }
      }
    })
    //expect(mockToHtml).toBeCalledTimes(0)
    expect(mockWriteFile).toBeCalledTimes(1)
    expect(mockWriteFile).toHaveBeenNthCalledWith(
      1,
      'tmp/test-1.html',
      '---\n---\n\n'
    )
    expect(outData).toEqual('')
    expect(errData).toEqual('')
  })
})
