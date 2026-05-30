import { parseConsoleImage } from '@/lib/openrouter'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockRowingSession = {
  consoleType: 'rowing',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-key'
  process.env.OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash'
  mockFetch.mockClear()
})

describe('parseConsoleImage', () => {
  it('calls OpenRouter with Authorization header and returns parsed session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(mockRowingSession) } }],
      }),
    })

    const result = await parseConsoleImage('base64data', 'image/jpeg')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    )
    expect(result.consoleType).toBe('rowing')
    expect(result.capturedAt).toBeDefined()
    expect(new Date(result.capturedAt).toISOString()).toBe(result.capturedAt)
  })

  it('handles model response wrapped in markdown code fences', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '```json\n' + JSON.stringify(mockRowingSession) + '\n```' } }],
      }),
    })

    const result = await parseConsoleImage('data', 'image/jpeg')
    expect(result.consoleType).toBe('rowing')
  })

  it('throws an error when OpenRouter returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    await expect(parseConsoleImage('data', 'image/jpeg')).rejects.toThrow(
      'OpenRouter error: 429'
    )
  })

  it('throws when OpenRouter returns an empty choices array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    })
    await expect(parseConsoleImage('data', 'image/jpeg')).rejects.toThrow(
      'Unexpected response shape from OpenRouter'
    )
  })
})
