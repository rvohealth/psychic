import CrystalBall from 'src/crystal-ball'
import Namespace from 'src/crystal-ball/namespace'

describe('CrystalBall::Namespace#resource', () => {
  it ('adds routes for index, show, create, update, delete', async () => {
    const crystalBall = new CrystalBall()
    const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
    const getSpy = posess(ns, 'get').returning(true)
    const postSpy = posess(ns, 'post').returning(true)
    const patchSpy = posess(ns, 'patch').returning(true)
    const putSpy = posess(ns, 'put').returning(true)
    const deleteSpy = posess(ns, 'delete').returning(true)

    ns.resource('fishboy')

    expect(getSpy).toHaveBeenCalledWith('fishboys', 'fishboy#index', { _isResource: true })
    expect(getSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#show', { _isResource: true })
    expect(postSpy).toHaveBeenCalledWith('fishboys', 'fishboy#create', { _isResource: true })
    expect(putSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
    expect(patchSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
    expect(deleteSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#delete', { _isResource: true })
  })

  context ('only is specified', () => {
    it ('only binds specified routes', () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const getSpy = posess(ns, 'get').returning(true)
      const postSpy = posess(ns, 'post').returning(true)
      const patchSpy = posess(ns, 'patch').returning(true)
      const putSpy = posess(ns, 'put').returning(true)
      const deleteSpy = posess(ns, 'delete').returning(true)

      ns.resource('fishboy', { only: ['index'] })

      expect(getSpy).toHaveBeenCalledWith('fishboys', 'fishboy#index', { _isResource: true })
      expect(getSpy).not.toHaveBeenCalledWith('fishboys/:id', 'fishboy#show', { _isResource: true })
      expect(postSpy).not.toHaveBeenCalledWith('fishboys', 'fishboy#create', { _isResource: true })
      expect(putSpy).not.toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
      expect(patchSpy).not.toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
      expect(deleteSpy).not.toHaveBeenCalledWith('fishboys/:id', 'fishboy#delete', { _isResource: true })
    })
  })

  context ('except is specified', () => {
    it ('binds all but exempted routes', () => {
      const crystalBall = new CrystalBall()
      const ns = new Namespace('fishman', crystalBall.currentNamespace.prefix, crystalBall.app, crystalBall.io)
      const getSpy = posess(ns, 'get').returning(true)
      const postSpy = posess(ns, 'post').returning(true)
      const patchSpy = posess(ns, 'patch').returning(true)
      const putSpy = posess(ns, 'put').returning(true)
      const deleteSpy = posess(ns, 'delete').returning(true)

      ns.resource('fishboy', { except: ['index'] })

      expect(getSpy).not.toHaveBeenCalledWith('fishboys', 'fishboy#index', { _isResource: true })
      expect(getSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#show', { _isResource: true })
      expect(postSpy).toHaveBeenCalledWith('fishboys', 'fishboy#create', { _isResource: true })
      expect(putSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
      expect(patchSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#update', { _isResource: true })
      expect(deleteSpy).toHaveBeenCalledWith('fishboys/:id', 'fishboy#delete', { _isResource: true })
    })
  })
})
