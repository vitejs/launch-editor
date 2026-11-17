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
})

const STATUS_NOT_ALTERED = -1
class MockResponse {
  constructor() {
    this.statusCode = STATUS_NOT_ALTERED
    this.body = ''
  }

  end(body) {
    this.body = body || ''
  }
}

class MockRequest {
  constructor(url) {
    this.url = url
  }
}

describe('launchEditorMiddleware', () => {
  test('returns a 500 if no file query param', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const req = new MockRequest('https://localhost/')
    const res = new MockResponse(null)

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('launch-editor-middleware: required query param "file" is missing.')
  })

  test('launches editor with specified file', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const file = 'mock/file:100'
    const req = new MockRequest(`https://localhost/?file=${file}`)
    const res = new MockResponse(null)

    middleware(req, res)

    expect(launch).toHaveBeenCalledExactlyOnceWith(path.resolve(file), 'vim', noop)
    expect(res.statusCode).toBe(STATUS_NOT_ALTERED)
    expect(res.body).toBe('')
  })

  test('falsy file parameter returns 500', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const req = new MockRequest('https://localhost/?file=')
    const res = new MockResponse(null)

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('launch-editor-middleware: required query param "file" is missing.')
  })

  test('returns 500 on invalid URL', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const req = new MockRequest('some invalid URL')
    const res = new MockResponse(null)

    middleware(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('launch-editor-middleware: invalid URL.')
  })

  test('correctly parse the url even if it contains only the path', async () => {
    const middleware = launchEditorMiddleware('vim', undefined, noop)

    const file = 'mock/file:100'
    const req = new MockRequest(`/__open-in-editor?file=${file}`)
    const res = new MockResponse(null)

    middleware(req, res)

    expect(res.statusCode).toBe(STATUS_NOT_ALTERED)
    expect(res.body).toBe('')
  })
})
