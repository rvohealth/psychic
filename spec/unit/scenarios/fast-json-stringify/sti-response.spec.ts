import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import BalloonLatex from '../../../../test-app/src/app/models/Balloon/Latex.js'
import BalloonMylar from '../../../../test-app/src/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('fast-json-stringify with STI models', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('serializes a Mylar balloon with its full shape (show)', async () => {
    const user = await User.create({ email: 'a@b.c', password: 'howyadoin' })
    const mylar = await BalloonMylar.create({ color: 'red', user })

    const result = await request.get(`/balloons/${mylar.id}`, 200)

    expect(result.body).toEqual({
      id: mylar.id,
      color: 'red',
      mylarOnlyAttr: 'mylar-only-detailed',
    })
  })

  it('serializes a Latex balloon with its shape (show)', async () => {
    const user = await User.create({ email: 'a@b.c', password: 'howyadoin' })
    const latex = await BalloonLatex.create({ color: 'blue', user })

    const result = await request.get(`/balloons/${latex.id}`, 200)

    expect(result.body).toEqual({
      id: latex.id,
      color: 'blue',
      latexOnlyAttr: 'latex-only-detailed',
    })
  })

  it('serializes a mixed list with correct shapes for each STI type (index)', async () => {
    const user = await User.create({ email: 'a@b.c', password: 'howyadoin' })
    const mylar = await BalloonMylar.create({ color: 'red', user })
    const latex = await BalloonLatex.create({ color: 'blue', user })

    const result = await request.get('/balloons', 200)

    expect(result.body).toEqual(
      expect.arrayContaining([
        {
          id: mylar.id,
          color: 'red',
          mylarOnlyAttr: 'mylar-only-detailed',
        },
        {
          id: latex.id,
          color: 'blue',
          latexOnlyAttr: 'latex-only-detailed',
        },
      ]),
    )
  })
})
