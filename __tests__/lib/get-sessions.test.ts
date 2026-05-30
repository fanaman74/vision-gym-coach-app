import { getSessions } from '@/lib/get-sessions'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockRows = [
  {
    id: 'abc-123',
    created_at: '2026-05-30T10:00:00Z',
    console_type: 'rowing',
    session_data: {
      consoleType: 'rowing',
      capturedAt: '2026-05-30T10:00:00Z',
      distanceMeters: 5000,
      calories: 285,
    },
  },
]

function makeMockChain(result: { data: typeof mockRows | null; error: { message: string } | null }) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValueOnce(result),
  }
}

describe('getSessions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fetches sessions ordered by created_at desc, limited to 50', async () => {
    const chain = makeMockChain({ data: mockRows, error: null })
    mockFrom.mockReturnValueOnce(chain as any)

    const result = await getSessions()

    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(50)
    expect(result).toEqual(mockRows)
  })

  it('throws when Supabase returns an error', async () => {
    const chain = makeMockChain({ data: null, error: { message: 'Connection failed' } })
    mockFrom.mockReturnValueOnce(chain as any)

    await expect(getSessions()).rejects.toThrow('Failed to fetch sessions: Connection failed')
  })

  it('returns empty array when data is null with no error', async () => {
    const chain = makeMockChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain as any)

    expect(await getSessions()).toEqual([])
  })
})
