import { buildVisionPrompt } from '@/lib/prompts'

describe('buildVisionPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildVisionPrompt().length).toBeGreaterThan(100)
  })

  it('instructs the model to return only JSON', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toMatch(/only.*json|json.*only/i)
  })

  it('includes all three console types', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toContain('rowing')
    expect(prompt).toContain('cycling')
    expect(prompt).toContain('unknown')
  })

  it('instructs the model to omit unreadable fields rather than guess', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toMatch(/omit|never guess/i)
  })

  it('includes an example for unknown console type', () => {
    const prompt = buildVisionPrompt()
    expect(prompt).toContain('"consoleType":"unknown"')
  })
})
