describe('new app bootstrap', () => {
  it ('does a thing', async () => {
    console.log('YAY')
  })
})

describe('Google', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:33333');
  });

  it('should have content "Psychic"', async () => {
    await expect(page).toMatch('Psychic');
  });
})
