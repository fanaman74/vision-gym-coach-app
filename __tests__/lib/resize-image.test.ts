describe('resizeImage module', () => {
  it('exports a resizeImage function', async () => {
    const mod = await import('@/lib/resize-image')
    expect(typeof mod.resizeImage).toBe('function')
  })
})
