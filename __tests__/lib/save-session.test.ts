import { saveSession } from '@/lib/save-session'
import { supabase } from '@/lib/supabase'
import { RowingSession } from '@/types/metrics'

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>

const mockSession: RowingSession = {
  consoleType: 'rowing',
  capturedAt: '2026-05-30T10:00:00Z',
  duration: '00:22:15',
  distanceMeters: 5000,
  splitPer500m: '2:13.5',
  strokeRate: 24,
  calories: 285,
  watts: 178,
}

describe('saveSession', () => {
  beforeEach(() => jest.clearAllMocks())

  it('inserts console_type and session_data into the sessions table', async () => {
    const mockInsert = jest.fn().mockResolvedValueOnce({ error: null })
    mockFrom.mockReturnValueOnce({ insert: mockInsert } as any)

    await saveSession(mockSession)

    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(mockInsert).toHaveBeenCalledWith({
      console_type: 'rowing',
      session_data: mockSession,
    })
  })

  it('logs error but does not throw when insert fails', async () => {
    const mockInsert = jest.fn().mockResolvedValueOnce({ error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce({ insert: mockInsert } as any)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(saveSession(mockSession)).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
