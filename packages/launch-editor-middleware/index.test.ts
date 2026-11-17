import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import path from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import launch from 'launch-editor'
import launchEditorMiddleware from './dist/index.js'

const noop = () => {}

vi.mock('launch-editor', () => ({
  default: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

const STATUS_NOT_ALTERED = 200

function createRequestResponse(url: string) {
  const req = new IncomingMessage(new Socket())
  req.url = url
  const res = new ServerResponse(req)
  const end = vi.spyOn(res, 'end').mockReturnValue(res)
  return { req, res, end }
}

describe('launchEditorMiddleware', () => {
  test('returns a 500 if no file query param', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const { req, res, end } = createRequestResponse('https://localhost/')

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(end).toHaveBeenCalledExactlyOnceWith(
      'launch-editor-middleware: required query param "file" is missing.',
    )
  })

  test('launches editor with specified file', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const file = 'mock/file:100'
    const { req, res, end } = createRequestResponse(`https://localhost/?file=${file}`)

    middleware(req, res)

    expect(launch).toHaveBeenCalledExactlyOnceWith(path.resolve(file), 'vim', noop)
    expect(res.statusCode).toBe(STATUS_NOT_ALTERED)
    expect(end).toHaveBeenCalledExactlyOnceWith()
  })

  test('falsy file parameter returns 500', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const { req, res, end } = createRequestResponse('https://localhost/?file=')

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(end).toHaveBeenCalledExactlyOnceWith(
      'launch-editor-middleware: required query param "file" is missing.',
    )
  })

  test('returns 500 on invalid URL', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const { req, res, end } = createRequestResponse('some invalid URL')

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(end).toHaveBeenCalledExactlyOnceWith('launch-editor-middleware: invalid URL.')
  })

  test('correctly parse the url even if it contains only the path', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const file = 'mock/file:100'
    const { req, res, end } = createRequestResponse(`/__open-in-editor?file=${file}`)

    middleware(req, res)

    expect(res.statusCode).toBe(STATUS_NOT_ALTERED)
    expect(end).toHaveBeenCalledExactlyOnceWith()
  })
})
