describe('Landing on home page of boiler-plate react app', () => {
  it('should have content "Psychic"', async () => {
    await goto(baseUrl)
    await expect(page).toMatch('Psychic')
  })
})
